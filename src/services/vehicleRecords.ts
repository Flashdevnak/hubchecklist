import type {
  ChecklistType,
  DuplicateVehicleRecordResult,
  EditHistoryEntry,
  FlashProofResult,
  RouteRow,
  VehicleRecord,
  VehicleRecordDraft,
} from '../types';
import { getScanPreviewDraft, validateThaiPhoneNumber, validateVehicleBarcode } from '../utils';
import { supabase, supabaseConfig } from './supabase';

const VEHICLE_RECORDS_KEY = 'hubchecklist.vehicleRecords';
const EDIT_HISTORY_KEY = 'hubchecklist.vehicleRecordEditHistory';

export interface VehicleRecordStorageStatus {
  mode: 'local_only' | 'supabase_configured';
  message: string;
}

export interface VehicleRecordCreateResult {
  record?: VehicleRecord;
  duplicate: DuplicateVehicleRecordResult;
  status: VehicleRecordStorageStatus;
  validationErrors: string[];
}

export function createVehicleRecordFromFlashDraft(
  draft: FlashProofResult,
  options: { forceNewTrip?: boolean; voidExistingId?: string; voidReason?: string } = {},
): VehicleRecordCreateResult {
  const recordDraft = buildVehicleRecordDraft(draft);
  const validationErrors = validateRecordDraft(recordDraft);
  const duplicate = findDuplicateVehicleRecords(recordDraft);
  const status = getVehicleRecordStorageStatus();

  if (options.voidExistingId && options.voidReason) {
    voidVehicleRecord(options.voidExistingId, options.voidReason);
  }

  if (validationErrors.length > 0) {
    return { duplicate, status, validationErrors };
  }

  if ((duplicate.hasExactDuplicate || duplicate.hasConflict) && !options.forceNewTrip) {
    return { duplicate, status, validationErrors };
  }

  const record = createRecord(recordDraft);
  saveVehicleRecordLocal(record);
  syncVehicleRecordToSupabase(record).then((syncResult) => {
    if (syncResult.synced || syncResult.message) {
      updateVehicleRecord(record.id, {
        syncStatus: syncResult.synced ? 'synced' : status.mode === 'local_only' ? 'local_only' : 'error',
        syncMessage: syncResult.message,
      }, 'sync status update');
    }
  });

  return { record, duplicate, status, validationErrors };
}

export function listVehicleRecords(filters: {
  query?: string;
  status?: string;
  responsibleEmployeeCode?: string;
} = {}): VehicleRecord[] {
  const query = filters.query?.trim().toLowerCase() ?? '';
  return readRecords()
    .filter((record) => {
      if (filters.status && record.status !== filters.status) return false;
      if (filters.responsibleEmployeeCode && record.responsibleEmployeeCode !== filters.responsibleEmployeeCode) {
        return false;
      }
      if (!query) return true;
      return [
        record.vehicleBarcode,
        record.driverPhone,
        record.driverName,
        record.companyName,
        record.responsibleEmployeeCode,
        record.routeSummary,
      ].some((value) => value?.toLowerCase().includes(query));
    })
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getVehicleRecordById(id: string): VehicleRecord | null {
  return readRecords().find((record) => record.id === id) ?? null;
}

export function updateVehicleRecord(id: string, patch: Partial<VehicleRecord>, reason = 'manual edit'): VehicleRecord | null {
  const records = readRecords();
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) return null;

  const oldRecord = records[index];
  const nextRecord: VehicleRecord = {
    ...oldRecord,
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  records[index] = nextRecord;
  writeRecords(records);
  writeEditHistory(oldRecord, nextRecord, reason);
  return nextRecord;
}

export function voidVehicleRecord(id: string, reason: string): VehicleRecord | null {
  return updateVehicleRecord(id, { status: 'VOIDED', voidReason: reason }, reason || 'void record');
}

export function findDuplicateVehicleRecords(candidate: Pick<VehicleRecordDraft, 'workDate' | 'branch' | 'vehicleBarcode' | 'driverPhone' | 'sourceUrl' | 'routeSummary'>): DuplicateVehicleRecordResult {
  const exactKey = createDuplicateKey(candidate);
  const sameDayBarcode = readRecords().filter((record) => (
    record.workDate === candidate.workDate &&
    record.branch === candidate.branch &&
    record.vehicleBarcode === candidate.vehicleBarcode &&
    record.status !== 'VOIDED'
  ));
  const exactMatches = sameDayBarcode.filter((record) => record.duplicateKey === exactKey);
  const conflictingMatches = sameDayBarcode.filter((record) => (
    record.duplicateKey !== exactKey &&
    (record.driverPhone !== candidate.driverPhone || record.routeSummary !== candidate.routeSummary)
  ));

  return {
    exactMatches,
    conflictingMatches,
    hasExactDuplicate: exactMatches.length > 0,
    hasConflict: conflictingMatches.length > 0,
    message: conflictingMatches.length > 0
      ? 'พบรถคันนี้ในวันนี้แล้ว แต่ข้อมูลไม่ตรงกัน'
      : exactMatches.length > 0
        ? 'พบรายการรถนี้ซ้ำกับข้อมูลเดิม'
        : undefined,
  };
}

export function saveVehicleRecordLocal(record: VehicleRecord): void {
  const records = readRecords();
  records.push(record);
  writeRecords(records);
}

export async function syncVehicleRecordToSupabase(record: VehicleRecord): Promise<{ synced: boolean; message: string }> {
  if (!supabaseConfig.isConfigured || !supabase) {
    return { synced: false, message: 'บันทึกในเครื่อง / ยังไม่ได้เชื่อม Supabase' };
  }

  try {
    const { error } = await supabase.from('vehicle_records').insert({
      work_date: record.workDate,
      responsible_employee_code: record.responsibleEmployeeCode,
      responsible_display_name: record.responsibleDisplayName,
      vehicle_barcode: record.vehicleBarcode,
      driver_phone: record.driverPhone,
      flash_url: record.sourceUrl,
      status: record.status === 'VOIDED'
        ? 'voided'
        : record.status === 'NEED_REVIEW'
          ? 'need_review'
          : record.status === 'COMPLETE'
            ? 'complete'
            : record.status === 'PENDING_PHOTO'
              ? 'pending_photo'
              : 'ready_for_photo',
    });

    if (error) {
      return { synced: false, message: `Supabase sync failed: ${error.message}` };
    }

    return { synced: true, message: 'Supabase sync สำเร็จ' };
  } catch (error) {
    return {
      synced: false,
      message: error instanceof Error ? `Supabase sync failed: ${error.message}` : 'Supabase sync failed',
    };
  }
}

export function getVehicleRecordStorageStatus(): VehicleRecordStorageStatus {
  return supabaseConfig.isConfigured
    ? { mode: 'supabase_configured', message: 'Supabase configured / local-first sync path prepared' }
    : { mode: 'local_only', message: 'บันทึกในเครื่อง / ยังไม่ได้เชื่อม Supabase' };
}

export function getEditHistory(recordId?: string): EditHistoryEntry[] {
  const entries = readJson<EditHistoryEntry[]>(EDIT_HISTORY_KEY, []);
  return recordId ? entries.filter((entry) => entry.recordId === recordId) : entries;
}

function buildVehicleRecordDraft(draft: FlashProofResult): VehicleRecordDraft {
  const previewDraft = getScanPreviewDraft();
  const workDate = new Date().toISOString().slice(0, 10);
  return {
    workDate,
    branch: draft.branch ?? previewDraft?.branch ?? '',
    responsibleEmployeeCode: draft.responsibleEmployeeCode ?? previewDraft?.responsibleEmployeeCode ?? '',
    responsibleDisplayName: draft.responsibleDisplayName ?? previewDraft?.responsibleDisplayName ?? '',
    sourceUrl: draft.sourceUrl,
    vehicleBarcode: draft.vehicleBarcode,
    driverPhone: draft.driverPhone,
    driverName: draft.driverName,
    companyName: draft.companyName,
    routeSummary: draft.routeSummary,
    firstBranch: draft.firstBranch,
    lastBranch: draft.lastBranch,
    plannedDepartureTime: draft.plannedDepartureTime,
    actualDepartureTime: draft.actualDepartureTime,
    routeRows: draft.routeRows,
    flashPageStatus: draft.flashPageStatus,
    flashHtmlSnapshot: draft.htmlSnapshot,
    ocrRawText: previewDraft?.ocrRawText,
    ocrConfidence: previewDraft?.ocrConfidence,
  };
}

function validateRecordDraft(draft: VehicleRecordDraft): string[] {
  const errors: string[] = [];
  if (!draft.workDate) errors.push('workDate จำเป็น');
  if (!draft.branch) errors.push('branch จำเป็น');
  if (!draft.responsibleEmployeeCode) errors.push('responsibleEmployeeCode จำเป็น');
  if (!draft.responsibleDisplayName) errors.push('responsibleDisplayName จำเป็น');
  if (!validateVehicleBarcode(draft.vehicleBarcode).isValid) errors.push('vehicleBarcode ไม่ถูกต้อง');
  if (!validateThaiPhoneNumber(draft.driverPhone).isValid) errors.push('driverPhone ไม่ถูกต้อง');
  return errors;
}

function createRecord(draft: VehicleRecordDraft): VehicleRecord {
  const now = new Date().toISOString();
  const id = createId();
  const checklistType = getChecklistType(draft.routeRows);
  return {
    id,
    ...draft,
    routeRows: draft.routeRows.map((row, index) => ({
      id: createId(),
      recordId: id,
      index: row.index || index + 1,
      branchName: row.branchName,
      date: row.date,
      expectedArrivalTime: row.expectedArrivalTime,
      actualArrivalTime: row.actualArrivalTime,
      inboundScanner: row.inboundScanner,
      expectedDepartureTime: row.expectedDepartureTime,
      actualDepartureTime: row.actualDepartureTime,
      outboundScanner: row.outboundScanner,
      duration: row.duration,
      distance: row.distance,
      sealNumbers: row.sealNumbers,
      createdAt: now,
    })),
    checklistType,
    requiredPhotos: getRequiredPhotosForChecklist(checklistType),
    flashHtmlSnapshot: draft.flashHtmlSnapshot,
    status: validateRecordDraft(draft).length === 0 ? 'READY_FOR_PHOTO' : 'NEED_REVIEW',
    duplicateKey: createDuplicateKey(draft),
    backedUp: false,
    createdAt: now,
    updatedAt: now,
    syncStatus: getVehicleRecordStorageStatus().mode === 'local_only' ? 'local_only' : 'pending',
    syncMessage: getVehicleRecordStorageStatus().message,
  };
}

function getChecklistType(rows: unknown[]): ChecklistType {
  return rows.length > 1 ? 'MULTI_DROP' : 'NORMAL_ROUTE';
}

export function getRequiredPhotosForChecklist(checklistType: ChecklistType): string[] {
  return checklistType === 'MULTI_DROP'
    ? ['branchDropPhoto1', 'branchDropPhoto2', 'dropPhotoAfterDeparture']
    : ['loadingPhoto', 'dropPhotoAfterDeparture'];
}

function createDuplicateKey(candidate: Pick<VehicleRecordDraft, 'workDate' | 'branch' | 'vehicleBarcode' | 'driverPhone' | 'sourceUrl'>): string {
  return [candidate.workDate, candidate.branch, candidate.vehicleBarcode, candidate.driverPhone, candidate.sourceUrl].join('|');
}

function readRecords(): VehicleRecord[] {
  return readJson<VehicleRecord[]>(VEHICLE_RECORDS_KEY, []);
}

function writeRecords(records: VehicleRecord[]): void {
  window.localStorage.setItem(VEHICLE_RECORDS_KEY, JSON.stringify(records));
}

function writeEditHistory(oldRecord: VehicleRecord, nextRecord: VehicleRecord, reason: string): void {
  const entries = readJson<EditHistoryEntry[]>(EDIT_HISTORY_KEY, []);
  Object.entries(nextRecord).forEach(([fieldName, newValue]) => {
    const oldValue = oldRecord[fieldName as keyof VehicleRecord];
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) return;
    entries.push({
      id: createId(),
      recordId: nextRecord.id,
      fieldName,
      oldValue: typeof oldValue === 'string' ? oldValue : JSON.stringify(oldValue ?? ''),
      newValue: typeof newValue === 'string' ? newValue : JSON.stringify(newValue ?? ''),
      editedBy: nextRecord.responsibleEmployeeCode || 'local-user',
      editedAt: new Date().toISOString(),
      reason,
    });
  });
  window.localStorage.setItem(EDIT_HISTORY_KEY, JSON.stringify(entries));
}

function readJson<T>(key: string, fallback: T): T {
  const rawValue = window.localStorage.getItem(key);
  if (!rawValue) return fallback;
  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function createId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
