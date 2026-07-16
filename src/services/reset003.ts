import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export type AppMode = 'frontline' | 'admin';
export type ProofStatus = 'DRAFT' | 'COMPLETE' | 'NEED_REVIEW' | 'VOIDED';
export type GpsStatus = 'granted' | 'denied' | 'unavailable' | 'unknown';
export type SlotType = 'REAR_MAIN' | 'FRONT_DROP' | 'DROP_REAR_1' | 'DROP_REAR_2' | 'DROP_REAR_EXTRA';
export type GoogleSyncMode = 'local_only' | 'google_sheets';
export type GoogleSyncAction = 'createRecord' | 'uploadPhotoMetadata' | 'syncRecord' | 'appendAudit';
export type RecordSyncStatus = 'LOCAL_ONLY' | 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED';

export interface Hub {
  hubCode: string;
  hubName: string;
  active: boolean;
}

export interface ResponsibleStaff {
  employeeCode: string;
  displayName: string;
  hubCode: string;
  active: boolean;
}

export interface ActiveWorkContext {
  hubCode: string;
  employeeCode: string;
}

export interface ProofPhotoSlot {
  slotId: string;
  slotType: SlotType;
  labelThai: string;
  required: boolean;
  captured: boolean;
  imageLocalData?: string;
  fileName?: string;
  capturedAt?: string;
  displayTimestamp?: string;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  gpsStatus: GpsStatus;
  locationPermissionStatus: GpsStatus;
  watermarkText?: string;
  retakeCount: number;
}

export interface ProofRecord {
  id: string;
  hubCode: string;
  hubName: string;
  responsibleEmployeeCode: string;
  responsibleName: string;
  date: string;
  vehicleBarcode: string;
  hasDropTransfer: boolean;
  dropCount: number;
  photoSlots: ProofPhotoSlot[];
  status: ProofStatus;
  missingPhotoWarnings: string[];
  missingPhotoConfirmed: boolean;
  missingPhotoConfirmedAt?: string;
  submittedAt?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus?: RecordSyncStatus;
  voidReason?: string;
  notes?: string;
}

export interface AuditEntry {
  id: string;
  recordId?: string;
  action: string;
  detail: string;
  createdAt: string;
  actor: string;
}

export interface AppSettings {
  gpsMandatory: boolean;
  watermarkEnabled: boolean;
  googleSyncMode: GoogleSyncMode;
  googleAppsScriptUrl: string;
  googleSharedSecret: string;
}

export interface SyncQueueItem {
  id: string;
  action: GoogleSyncAction;
  payload: unknown;
  createdAt: string;
  attempts: number;
  lastAttemptAt?: string;
  error?: string;
}

export interface SyncResult {
  ok: boolean;
  queued: boolean;
  message: string;
  response?: unknown;
}

export interface RetrySyncResult {
  attempted: number;
  synced: number;
  failed: number;
  message: string;
}

const HUBS_KEY = 'reset003.hubs';
const STAFF_KEY = 'reset003.responsibleStaff';
const ACTIVE_CONTEXT_KEY = 'reset003.activeContext';
const RECORDS_KEY = 'reset003.records';
const AUDIT_KEY = 'reset003.audit';
const SETTINGS_KEY = 'reset003.settings';
const SYNC_QUEUE_KEY = 'reset003.googleSyncQueue';
const ADMIN_PIN_KEY = 'reset003.adminPin';
const EMPLOYEE_DEVICE_MODE_KEY = 'reset003.employeeDeviceMode';

const DEFAULT_SETTINGS: AppSettings = {
  gpsMandatory: false,
  watermarkEnabled: true,
  googleSyncMode: 'local_only',
  googleAppsScriptUrl: '',
  googleSharedSecret: '',
};

export const DEFAULT_HUB: Hub = {
  hubCode: '26NAK_BHUB',
  hubName: 'นครราชสีมา',
  active: true,
};

export const DEFAULT_STAFF: ResponsibleStaff = {
  employeeCode: '25845',
  displayName: 'TUI',
  hubCode: DEFAULT_HUB.hubCode,
  active: true,
};

export const EXPORT_HEADERS = [
  'วันที่',
  'ฮับ',
  'ผู้รับผิดชอบ',
  'บาร์โค้ดรถ',
  'พ่วงดรอปหรือไม่',
  'จำนวนดรอป',
  'สถานะ',
  'รูปหลังรถ',
  'รูปหน้าดรอป',
  'รูปหลังรถพ่วงที่ 1',
  'รูปหลังรถพ่วงที่ 2',
  'รูปหลังรถพ่วงเพิ่มเติม',
  'รายการรูปที่ขาด',
  'เวลาส่งข้อมูล',
  'หมายเหตุ',
];

export function ensureSeedData(): void {
  if (readJson<Hub[]>(HUBS_KEY, []).length === 0) writeJson(HUBS_KEY, [DEFAULT_HUB]);
  if (readJson<ResponsibleStaff[]>(STAFF_KEY, []).length === 0) writeJson(STAFF_KEY, [DEFAULT_STAFF]);
}

export function listHubs(): Hub[] {
  ensureSeedData();
  return readJson<Hub[]>(HUBS_KEY, []);
}

export function saveHubs(hubs: Hub[]): void {
  writeJson(HUBS_KEY, hubs);
}

export function listResponsibleStaff(): ResponsibleStaff[] {
  ensureSeedData();
  return readJson<ResponsibleStaff[]>(STAFF_KEY, []);
}

export function saveResponsibleStaff(staff: ResponsibleStaff[]): void {
  writeJson(STAFF_KEY, staff);
}

export function getActiveContext(): ActiveWorkContext | null {
  return readJson<ActiveWorkContext | null>(ACTIVE_CONTEXT_KEY, null);
}

export function saveActiveContext(context: ActiveWorkContext): void {
  writeJson(ACTIVE_CONTEXT_KEY, context);
}

export function getSettings(): AppSettings {
  return { ...DEFAULT_SETTINGS, ...readJson<Partial<AppSettings>>(SETTINGS_KEY, {}) };
}

export function saveSettings(settings: AppSettings): void {
  writeJson(SETTINGS_KEY, settings);
}

export function hasAdminPin(): boolean {
  return Boolean(window.localStorage.getItem(ADMIN_PIN_KEY));
}

export function isEmployeeDeviceMode(): boolean {
  return window.localStorage.getItem(EMPLOYEE_DEVICE_MODE_KEY) === 'true';
}

export function setEmployeeDeviceMode(enabled: boolean): void {
  window.localStorage.setItem(EMPLOYEE_DEVICE_MODE_KEY, enabled ? 'true' : 'false');
  addAudit({
    action: enabled ? 'employee_device_mode_enabled' : 'employee_device_mode_disabled',
    detail: enabled ? 'This device was locked to Frontline employee mode' : 'This device was unlocked from employee mode',
    actor: 'admin',
  });
}

export function setAdminPin(pin: string): boolean {
  const cleaned = pin.trim();
  if (cleaned.length < 4) return false;
  window.localStorage.setItem(ADMIN_PIN_KEY, cleaned);
  addAudit({ action: 'admin_pin_set', detail: 'Local admin PIN was set on this device', actor: 'admin' });
  return true;
}

export function verifyAdminPin(pin: string): boolean {
  const saved = window.localStorage.getItem(ADMIN_PIN_KEY);
  return Boolean(saved && pin === saved);
}

export function changeAdminPin(currentPin: string, nextPin: string): boolean {
  if (!verifyAdminPin(currentPin)) return false;
  return setAdminPin(nextPin);
}

export function resetLocalTestData(): void {
  window.localStorage.removeItem(RECORDS_KEY);
  window.localStorage.removeItem(AUDIT_KEY);
  window.localStorage.removeItem(SYNC_QUEUE_KEY);
}

export function listRecords(): ProofRecord[] {
  return readJson<ProofRecord[]>(RECORDS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function saveRecords(records: ProofRecord[]): void {
  writeJson(RECORDS_KEY, records);
}

export function upsertRecord(record: ProofRecord): void {
  const records = listRecords().filter((item) => item.id !== record.id);
  records.push(record);
  saveRecords(records);
}

export function getRecordById(recordId: string): ProofRecord | null {
  return listRecords().find((record) => record.id === recordId) ?? null;
}

export function listAudit(): AuditEntry[] {
  return readJson<AuditEntry[]>(AUDIT_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function addAudit(entry: Omit<AuditEntry, 'id' | 'createdAt'>): void {
  const next: AuditEntry = {
    ...entry,
    id: createId(),
    createdAt: new Date().toISOString(),
  };
  writeJson(AUDIT_KEY, [next, ...listAudit()]);
}

export function getLocalDateString(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('th-TH', { hour12: false });
}

export function normalizeVehicleBarcode(input: string): string {
  const flashMatch = input.match(/\/proof\/go\/([A-Z0-9-]+)/i);
  const value = flashMatch?.[1] ?? input;
  return value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function createPhotoSlots(hasDropTransfer: boolean, dropCount: number): ProofPhotoSlot[] {
  if (!hasDropTransfer) {
    return [
      createSlot('REAR_MAIN', 'รูปหลังรถ'),
      createSlot('FRONT_DROP', 'รูปหน้าดรอป'),
    ];
  }

  return Array.from({ length: Math.max(2, dropCount) }, (_, index) => createSlot(
    index < 2 ? (`DROP_REAR_${index + 1}` as SlotType) : 'DROP_REAR_EXTRA',
    `รูปหลังรถพ่วงที่ ${index + 1}`,
  ));
}

export function updatePhotoSlotsForDropCount(record: ProofRecord, dropCount: number): ProofRecord {
  const nextSlots = createPhotoSlots(true, dropCount).map((slot) => {
    const existing = record.photoSlots.find((item) => item.labelThai === slot.labelThai || item.slotId === slot.slotId);
    return existing ?? slot;
  });
  return {
    ...record,
    hasDropTransfer: true,
    dropCount,
    photoSlots: nextSlots,
    updatedAt: new Date().toISOString(),
  };
}

export function createDraftRecord(values: {
  hub: Hub;
  responsible: ResponsibleStaff;
  vehicleBarcode: string;
  hasDropTransfer: boolean;
}): ProofRecord {
  const now = new Date().toISOString();
  const dropCount = values.hasDropTransfer ? 2 : 0;
  return {
    id: createId(),
    hubCode: values.hub.hubCode,
    hubName: values.hub.hubName,
    responsibleEmployeeCode: values.responsible.employeeCode,
    responsibleName: values.responsible.displayName,
    date: getLocalDateString(),
    vehicleBarcode: normalizeVehicleBarcode(values.vehicleBarcode),
    hasDropTransfer: values.hasDropTransfer,
    dropCount,
    photoSlots: createPhotoSlots(values.hasDropTransfer, dropCount),
    status: 'DRAFT',
    missingPhotoWarnings: [],
    missingPhotoConfirmed: false,
    createdAt: now,
    updatedAt: now,
  };
}

export function getMissingPhotoSlots(record: ProofRecord): ProofPhotoSlot[] {
  return record.photoSlots.filter((slot) => slot.required && !slot.captured);
}

export function submitRecord(record: ProofRecord, confirmMissing: boolean): ProofRecord {
  const missing = getMissingPhotoSlots(record);
  const now = new Date().toISOString();
  const submitted: ProofRecord = {
    ...record,
    status: missing.length === 0 ? 'COMPLETE' : 'NEED_REVIEW',
    missingPhotoWarnings: missing.map((slot) => slot.labelThai),
    missingPhotoConfirmed: missing.length > 0 ? confirmMissing : false,
    missingPhotoConfirmedAt: missing.length > 0 && confirmMissing ? now : undefined,
    submittedAt: now,
    updatedAt: now,
    syncStatus: isGoogleSyncConfigured() ? 'PENDING_SYNC' : 'LOCAL_ONLY',
  };
  upsertRecord(submitted);
  addAudit({
    recordId: submitted.id,
    action: 'record_submitted',
    detail: missing.length ? `submitted with missing photos: ${missing.map((slot) => slot.labelThai).join(', ')}` : 'submitted complete',
    actor: submitted.responsibleEmployeeCode,
  });
  return submitted;
}

export async function submitRecordWithGoogleSync(record: ProofRecord, confirmMissing: boolean): Promise<{ record: ProofRecord; sync: SyncResult }> {
  const submitted = submitRecord(record, confirmMissing);
  const sync = await syncRecordToGoogle(submitted);
  return { record: submitted, sync };
}

export function getPendingSyncCount(): number {
  return getSyncQueue().length;
}

export function getSyncQueue(): SyncQueueItem[] {
  return readJson<SyncQueueItem[]>(SYNC_QUEUE_KEY, []);
}

export async function testGoogleConnection(): Promise<SyncResult> {
  const settings = getSettings();
  if (!isGoogleSyncConfigured(settings)) {
    return {
      ok: false,
      queued: false,
      message: 'ยังไม่ได้ตั้งค่า Google Apps Script URL หรือ shared secret',
    };
  }
  try {
    const response = await callAppsScript('healthCheck', { checkedAt: new Date().toISOString() });
    return { ok: true, queued: false, message: 'เชื่อมต่อ Google Sheets ได้', response };
  } catch (error) {
    return {
      ok: false,
      queued: false,
      message: error instanceof Error ? error.message : 'เชื่อมต่อ Google Sheets ไม่สำเร็จ',
    };
  }
}

export async function syncRecordToGoogle(record: ProofRecord): Promise<SyncResult> {
  const settings = getSettings();
  if (!isGoogleSyncConfigured(settings)) {
    return {
      ok: true,
      queued: false,
      message: 'บันทึกในเครื่องแล้ว',
    };
  }

  const payload = {
    record,
    photoMetadata: record.photoSlots.map((slot) => ({
      recordId: record.id,
      vehicleBarcode: record.vehicleBarcode,
      slotId: slot.slotId,
      slotType: slot.slotType,
      labelThai: slot.labelThai,
      captured: slot.captured,
      fileName: slot.fileName,
      capturedAt: slot.capturedAt,
      gpsLat: slot.gpsLat,
      gpsLng: slot.gpsLng,
      gpsAccuracy: slot.gpsAccuracy,
      gpsStatus: slot.gpsStatus,
      watermarkText: slot.watermarkText,
      hub: `${record.hubCode}-${record.hubName}`,
      responsible: responsibleText(record),
      imageLocalData: slot.imageLocalData,
    })),
  };

  try {
    const response = await callAppsScript('syncRecord', payload);
    upsertRecord({ ...record, syncStatus: 'SYNCED', updatedAt: new Date().toISOString() });
    return { ok: true, queued: false, message: 'บันทึกและซิงก์แล้ว', response };
  } catch (error) {
    queueSync('syncRecord', payload, error instanceof Error ? error.message : 'Sync failed');
    upsertRecord({ ...record, syncStatus: 'PENDING_SYNC', updatedAt: new Date().toISOString() });
    return {
      ok: false,
      queued: true,
      message: 'บันทึกในเครื่องแล้ว รอซิงก์',
    };
  }
}

export async function retryPendingSync(): Promise<RetrySyncResult> {
  const queue = getSyncQueue();
  if (queue.length === 0) {
    return { attempted: 0, synced: 0, failed: 0, message: 'ไม่มีรายการรอซิงก์' };
  }

  let synced = 0;
  const failedItems: SyncQueueItem[] = [];

  for (const item of queue) {
    try {
      await callAppsScript(item.action, item.payload);
      synced += 1;
    } catch (error) {
      failedItems.push({
        ...item,
        attempts: item.attempts + 1,
        lastAttemptAt: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Sync failed',
      });
    }
  }

  saveSyncQueue(failedItems);
  const failed = failedItems.length;
  return {
    attempted: queue.length,
    synced,
    failed,
    message: failed === 0 ? `ซิงก์สำเร็จ ${synced} รายการ` : `ซิงก์สำเร็จ ${synced} รายการ, ยังไม่สำเร็จ ${failed} รายการ`,
  };
}

export async function capturePhotoForSlot(record: ProofRecord, slotId: string, file: File): Promise<ProofRecord> {
  const location = await requestLocation();
  const capturedAt = new Date().toISOString();
  const slot = record.photoSlots.find((item) => item.slotId === slotId);
  if (!slot) return record;
  const watermarkText = buildWatermarkText(record, slot.labelThai, capturedAt, location);
  const imageLocalData = await renderWatermarkedImage(file, getSettings().watermarkEnabled ? watermarkText : '');
  const nextSlots = record.photoSlots.map((item) => item.slotId === slotId ? {
    ...item,
    captured: true,
    imageLocalData,
    fileName: buildPhotoFileName(record, item),
    capturedAt,
    displayTimestamp: formatDateTime(capturedAt),
    gpsLat: location.lat,
    gpsLng: location.lng,
    gpsAccuracy: location.accuracy,
    gpsStatus: location.status,
    locationPermissionStatus: location.status,
    watermarkText,
    retakeCount: item.captured ? item.retakeCount + 1 : item.retakeCount,
  } : item);
  const updated = { ...record, photoSlots: nextSlots, updatedAt: new Date().toISOString() };
  upsertRecord(updated);
  addAudit({
    recordId: record.id,
    action: slot.captured ? 'photo_retaken' : 'photo_captured',
    detail: `${slot.labelThai}; GPS ${location.status}`,
    actor: record.responsibleEmployeeCode,
  });
  return updated;
}

export async function generateExportZip(records = listRecords()): Promise<Blob> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Records');
  sheet.addRow(EXPORT_HEADERS);
  records.forEach((record) => {
    const row = sheet.addRow(buildExportRow(record));
    applyPhotoHyperlinks(row, record);
  });
  sheet.getRow(1).font = { bold: true };
  sheet.columns.forEach((column) => {
    column.width = 22;
    column.alignment = { wrapText: true, vertical: 'middle' };
  });

  const zip = new JSZip();
  zip.file('workbook.xlsx', await workbook.xlsx.writeBuffer());
  records.forEach((record) => {
    record.photoSlots.forEach((slot) => {
      if (!slot.imageLocalData) return;
      zip.file(photoZipPath(record, slot), dataUrlToUint8Array(slot.imageLocalData));
    });
  });
  zip.file('manifest.json', JSON.stringify({
    exportedAt: new Date().toISOString(),
    recordCount: records.length,
    photoCount: records.flatMap((record) => record.photoSlots).filter((slot) => slot.imageLocalData).length,
    records: records.map((record) => ({
      id: record.id,
      date: record.date,
      hubCode: record.hubCode,
      hubName: record.hubName,
      responsible: responsibleText(record),
      vehicleBarcode: record.vehicleBarcode,
      hasDropTransfer: record.hasDropTransfer,
      dropCount: record.dropCount,
      status: record.status,
      submittedAt: record.submittedAt,
      syncStatus: record.syncStatus ?? 'LOCAL_ONLY',
      missingPhotoWarnings: record.missingPhotoWarnings,
      photos: record.photoSlots.map((slot) => ({
        slotId: slot.slotId,
        slotType: slot.slotType,
        slotLabel: slot.labelThai,
        required: slot.required,
        captured: slot.captured,
        fileName: slot.fileName,
        capturedAt: slot.capturedAt,
        gpsLat: slot.gpsLat,
        gpsLng: slot.gpsLng,
        gpsAccuracy: slot.gpsAccuracy,
        gpsStatus: slot.gpsStatus,
        locationPermissionStatus: slot.locationPermissionStatus,
        watermarkText: slot.watermarkText,
        vehicleBarcode: record.vehicleBarcode,
        hub: `${record.hubCode}-${record.hubName}`,
        responsible: responsibleText(record),
      })),
    })),
  }, null, 2));
  return zip.generateAsync({ type: 'blob' });
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createSlot(slotType: SlotType, labelThai: string): ProofPhotoSlot {
  return {
    slotId: createId(),
    slotType,
    labelThai,
    required: true,
    captured: false,
    gpsStatus: 'unknown',
    locationPermissionStatus: 'unknown',
    retakeCount: 0,
  };
}

function buildExportRow(record: ProofRecord): string[] {
  const rearMain = findSlot(record, 'REAR_MAIN');
  const frontDrop = findSlot(record, 'FRONT_DROP');
  const drop1 = record.photoSlots.find((slot) => slot.slotType === 'DROP_REAR_1');
  const drop2 = record.photoSlots.find((slot) => slot.slotType === 'DROP_REAR_2');
  const extras = record.photoSlots.filter((slot) => slot.slotType === 'DROP_REAR_EXTRA');
  return [
    record.date,
    `${record.hubCode}-${record.hubName}`,
    responsibleText(record),
    record.vehicleBarcode,
    record.hasDropTransfer ? 'พ่วงดรอป' : 'ไม่พ่วงดรอป',
    String(record.dropCount),
    record.status,
    photoExportValue(rearMain),
    photoExportValue(frontDrop),
    photoExportValue(drop1),
    photoExportValue(drop2),
    extras.map(photoExportValue).join('\n') || 'ยังไม่ได้ถ่าย',
    record.missingPhotoWarnings.join(', '),
    record.submittedAt ? formatDateTime(record.submittedAt) : '',
    record.notes ?? '',
  ];
}

function findSlot(record: ProofRecord, slotType: SlotType): ProofPhotoSlot | undefined {
  return record.photoSlots.find((slot) => slot.slotType === slotType);
}

function photoExportValue(slot?: ProofPhotoSlot): string {
  if (!slot?.captured) return 'ยังไม่ได้ถ่าย';
  return slot.fileName ?? slot.labelThai;
}

function applyPhotoHyperlinks(row: ExcelJS.Row, record: ProofRecord): void {
  const rearMain = findSlot(record, 'REAR_MAIN');
  const frontDrop = findSlot(record, 'FRONT_DROP');
  const drop1 = record.photoSlots.find((slot) => slot.slotType === 'DROP_REAR_1');
  const drop2 = record.photoSlots.find((slot) => slot.slotType === 'DROP_REAR_2');
  const extras = record.photoSlots.filter((slot) => slot.slotType === 'DROP_REAR_EXTRA' && slot.captured);
  setPhotoHyperlink(row, 8, record, rearMain);
  setPhotoHyperlink(row, 9, record, frontDrop);
  setPhotoHyperlink(row, 10, record, drop1);
  setPhotoHyperlink(row, 11, record, drop2);
  setPhotoHyperlink(row, 12, record, extras[0]);
}

function setPhotoHyperlink(row: ExcelJS.Row, columnNumber: number, record: ProofRecord, slot?: ProofPhotoSlot): void {
  if (!slot?.captured || !slot.imageLocalData) return;
  const currentValue = row.getCell(columnNumber).value;
  const text = typeof currentValue === 'string' && currentValue ? currentValue : (slot.fileName ?? slot.labelThai);
  row.getCell(columnNumber).value = {
    text,
    hyperlink: photoZipPath(record, slot),
  };
}

function photoZipPath(record: ProofRecord, slot: ProofPhotoSlot): string {
  return `photos/${safeFileName(record.date)}/${safeFileName(record.vehicleBarcode)}/${safeFileName(slot.fileName ?? `${slot.slotId}.jpg`)}`;
}

function gpsText(slot?: ProofPhotoSlot): string {
  if (!slot) return '';
  if (typeof slot.gpsLat === 'number' && typeof slot.gpsLng === 'number') {
    return `${slot.gpsLat.toFixed(6)}, ${slot.gpsLng.toFixed(6)} (${Math.round(slot.gpsAccuracy ?? 0)}m)`;
  }
  return slot.gpsStatus === 'granted' ? '' : 'ไม่พบ GPS / ไม่ได้รับอนุญาตตำแหน่ง';
}

function responsibleText(record: ProofRecord): string {
  return `${record.responsibleEmployeeCode} ${record.responsibleName}`.trim();
}

function buildPhotoFileName(record: ProofRecord, slot: ProofPhotoSlot): string {
  return safeFileName(`${record.date}_${record.vehicleBarcode}_${photoFileKey(record, slot)}.jpg`);
}

function photoFileKey(record: ProofRecord, slot: ProofPhotoSlot): string {
  if (slot.slotType === 'REAR_MAIN') return 'rear_main';
  if (slot.slotType === 'FRONT_DROP') return 'front_drop';
  if (slot.slotType === 'DROP_REAR_1') return 'drop_rear_1';
  if (slot.slotType === 'DROP_REAR_2') return 'drop_rear_2';
  const sameTypeIndex = record.photoSlots
    .filter((item) => item.slotType === 'DROP_REAR_EXTRA')
    .findIndex((item) => item.slotId === slot.slotId);
  return `drop_rear_${Math.max(3, sameTypeIndex + 3)}`;
}

async function requestLocation(): Promise<{ status: GpsStatus; lat?: number; lng?: number; accuracy?: number }> {
  if (!navigator.geolocation) return { status: 'unavailable' };
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({
        status: 'granted',
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
      }),
      () => resolve({ status: 'denied' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

function buildWatermarkText(record: ProofRecord, labelThai: string, capturedAt: string, location: { status: GpsStatus; lat?: number; lng?: number; accuracy?: number }): string {
  const gps = typeof location.lat === 'number' && typeof location.lng === 'number'
    ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}${typeof location.accuracy === 'number' ? ` ±${Math.round(location.accuracy)}m` : ''}`
    : 'ไม่พบตำแหน่ง / ไม่ได้รับอนุญาต';
  return [
    `วันที่: ${formatDateTime(capturedAt)}`,
    `GPS: ${gps}`,
    `บาร์รถ: ${record.vehicleBarcode}`,
    `ฮับ: ${record.hubCode}-${record.hubName}`,
    `ผู้รับผิดชอบ: ${responsibleText(record)}`,
    `รูป: ${labelThai}`,
  ].join('\n');
}

function renderWatermarkedImage(file: File, watermarkText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const maxSize = 1600;
      const scale = Math.min(1, maxSize / image.width, maxSize / image.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const context = canvas.getContext('2d');
      if (!context) {
        reject(new Error('ไม่สามารถประมวลผลรูปได้'));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (watermarkText) {
        const fontSize = Math.max(18, Math.round(canvas.width / 48));
        const lineHeight = Math.round(fontSize * 1.35);
        const padding = Math.max(14, Math.round(canvas.width / 80));
        context.font = `${fontSize}px sans-serif`;
        const wrappedLines = watermarkText.split('\n').flatMap((line) => wrapCanvasText(context, line, canvas.width - padding * 2));
        const maxLines = Math.max(4, Math.floor((canvas.height * 0.45 - padding * 2) / lineHeight));
        const lines = wrappedLines.length > maxLines ? [...wrappedLines.slice(0, maxLines - 1), `${wrappedLines[maxLines - 1].slice(0, 80)}...`] : wrappedLines;
        const stripHeight = Math.min(canvas.height * 0.45, Math.max(96, lines.length * lineHeight + padding * 2));
        context.fillStyle = 'rgba(0, 0, 0, 0.62)';
        context.fillRect(0, canvas.height - stripHeight, canvas.width, stripHeight);
        lines.forEach((line, index) => {
          context.fillStyle = index === 0 ? '#ffe044' : '#ffffff';
          context.fillText(line, padding, canvas.height - stripHeight + padding + lineHeight * (index + 0.75));
        });
      }
      resolve(canvas.toDataURL('image/jpeg', 0.78));
      URL.revokeObjectURL(image.src);
    };
    image.onerror = () => reject(new Error('อ่านรูปไม่สำเร็จ'));
    image.src = URL.createObjectURL(file);
  });
}

function wrapCanvasText(context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  words.forEach((word) => {
    const testLine = line ? `${line} ${word}` : word;
    if (context.measureText(testLine).width <= maxWidth) {
      line = testLine;
      return;
    }
    if (line) lines.push(line);
    line = word;
  });
  if (line) lines.push(line);
  return lines.length ? lines : [text];
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function safeFileName(value: string): string {
  return value.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\s+/g, '_');
}

function readJson<T>(key: string, fallback: T): T {
  const raw = window.localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function isGoogleSyncConfigured(settings = getSettings()): boolean {
  return settings.googleSyncMode === 'google_sheets'
    && settings.googleAppsScriptUrl.trim().length > 0
    && settings.googleSharedSecret.trim().length > 0;
}

function queueSync(action: GoogleSyncAction, payload: unknown, error?: string): void {
  const item: SyncQueueItem = {
    id: createId(),
    action,
    payload,
    createdAt: new Date().toISOString(),
    attempts: 0,
    error,
  };
  saveSyncQueue([...getSyncQueue(), item]);
}

function saveSyncQueue(queue: SyncQueueItem[]): void {
  writeJson(SYNC_QUEUE_KEY, queue);
}

async function callAppsScript(action: 'healthCheck' | GoogleSyncAction | 'getHubs' | 'getResponsibleStaff' | 'getRecords', payload: unknown): Promise<unknown> {
  const settings = getSettings();
  if (!isGoogleSyncConfigured(settings)) {
    throw new Error('ยังไม่ได้ตั้งค่า Google Apps Script URL หรือ shared secret');
  }

  const response = await fetch(settings.googleAppsScriptUrl.trim(), {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action,
      token: settings.googleSharedSecret,
      payload,
      client: 'hubchecklist-reset004',
      sentAt: new Date().toISOString(),
    }),
  });

  const text = await response.text();
  let data: { ok?: boolean; error?: string } | null = null;
  try {
    data = text ? JSON.parse(text) as { ok?: boolean; error?: string } : null;
  } catch {
    throw new Error('Apps Script response is not JSON');
  }

  if (!response.ok || data?.ok === false) {
    throw new Error(data?.error || `Apps Script HTTP ${response.status}`);
  }

  return data;
}

function createId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
