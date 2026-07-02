import type { EditHistoryEntry, VehiclePhoto, VehicleRecord } from '../types';

export type DashboardStatusFilter =
  | 'all'
  | 'active'
  | 'READY_FOR_PHOTO'
  | 'PENDING_PHOTO'
  | 'COMPLETE'
  | 'VOIDED'
  | 'edited'
  | 'redo'
  | 'duplicate'
  | 'local_only'
  | 'upload_failed';

export type DashboardDateMode = 'today' | 'yesterday' | 'last7' | 'all' | 'custom';
export type DashboardSortMode = 'latest' | 'oldest' | 'status' | 'responsible' | 'barcode' | 'missing_photos';

export interface DashboardFilters {
  query: string;
  statusFilter: DashboardStatusFilter;
  dateMode: DashboardDateMode;
  selectedDate: string;
  branch: string;
  responsibleEmployeeCode: string;
}

export interface RecordOperationalFlags {
  edited: boolean;
  redoOrRefetch: boolean;
  voided: boolean;
  duplicateWarning: boolean;
  localOnlyPhotos: boolean;
  uploadFailed: boolean;
  missingResponsible: boolean;
  missingDriverPhone: boolean;
  missingVehicleBarcode: boolean;
}

export interface PhotoProgress {
  completeCount: number;
  requiredCount: number;
  missingCount: number;
  localOnlyCount: number;
  uploadedCount: number;
  uploadFailedCount: number;
  estimatedLocalBytes: number;
}

export interface DashboardSummary {
  total: number;
  ready: number;
  pending: number;
  complete: number;
  voided: number;
  edited: number;
  redoOrRefetch: number;
  duplicateWarning: number;
  localOnlyPhotos: number;
  uploadedPhotos: number;
  uploadFailedPhotos: number;
  estimatedLocalPhotoBytes: number;
}

export interface ResponsibleSummary {
  key: string;
  employeeCode: string;
  displayName: string;
  branch: string;
  total: number;
  complete: number;
  pendingPhoto: number;
  voided: number;
  edited: number;
  lastUpdatedAt: string;
}

export interface OperationalAlert {
  id: string;
  label: string;
  count: number;
  tone: 'warning' | 'danger' | 'neutral';
}

const MANUAL_EDIT_ACTIONS = ['FIELD_EDIT', 'PHONE_EDIT', 'ROUTE_EDIT', 'CHECKLIST_TYPE_CHANGE'];
const REDO_ACTIONS = ['REDO_QR_SCAN', 'REDO_PHONE_OCR', 'REFETCH_FLASH'];

export function getDashboardSummary(
  records: VehicleRecord[],
  photos: VehiclePhoto[],
  audits: EditHistoryEntry[],
): DashboardSummary {
  return records.reduce<DashboardSummary>((summary, record) => {
    const flags = getRecordOperationalFlags(record, records, photos, audits);
    const progress = getPhotoProgress(record, photos);
    return {
      total: summary.total + 1,
      ready: summary.ready + (record.status === 'READY_FOR_PHOTO' ? 1 : 0),
      pending: summary.pending + (record.status === 'PENDING_PHOTO' ? 1 : 0),
      complete: summary.complete + (record.status === 'COMPLETE' ? 1 : 0),
      voided: summary.voided + (record.status === 'VOIDED' ? 1 : 0),
      edited: summary.edited + (flags.edited ? 1 : 0),
      redoOrRefetch: summary.redoOrRefetch + (flags.redoOrRefetch ? 1 : 0),
      duplicateWarning: summary.duplicateWarning + (flags.duplicateWarning ? 1 : 0),
      localOnlyPhotos: summary.localOnlyPhotos + progress.localOnlyCount,
      uploadedPhotos: summary.uploadedPhotos + progress.uploadedCount,
      uploadFailedPhotos: summary.uploadFailedPhotos + progress.uploadFailedCount,
      estimatedLocalPhotoBytes: summary.estimatedLocalPhotoBytes + progress.estimatedLocalBytes,
    };
  }, createEmptySummary());
}

export function getResponsibleSummary(
  records: VehicleRecord[],
  photos: VehiclePhoto[],
  audits: EditHistoryEntry[],
): ResponsibleSummary[] {
  const groups = new Map<string, ResponsibleSummary>();
  records.forEach((record) => {
    const key = record.responsibleEmployeeCode || 'missing';
    const existing = groups.get(key) ?? {
      key,
      employeeCode: record.responsibleEmployeeCode || '-',
      displayName: record.responsibleDisplayName || 'Missing profile',
      branch: record.branch || '-',
      total: 0,
      complete: 0,
      pendingPhoto: 0,
      voided: 0,
      edited: 0,
      lastUpdatedAt: '',
    };
    const flags = getRecordOperationalFlags(record, records, photos, audits);
    existing.total += 1;
    existing.complete += record.status === 'COMPLETE' ? 1 : 0;
    existing.pendingPhoto += ['READY_FOR_PHOTO', 'PENDING_PHOTO', 'NEED_REVIEW'].includes(record.status) ? 1 : 0;
    existing.voided += record.status === 'VOIDED' ? 1 : 0;
    existing.edited += flags.edited ? 1 : 0;
    existing.lastUpdatedAt = [existing.lastUpdatedAt, record.updatedAt].sort().pop() ?? record.updatedAt;
    groups.set(key, existing);
  });
  return [...groups.values()].sort((a, b) => b.total - a.total || a.employeeCode.localeCompare(b.employeeCode));
}

export function filterVehicleRecords(
  records: VehicleRecord[],
  photos: VehiclePhoto[],
  audits: EditHistoryEntry[],
  filters: DashboardFilters,
): VehicleRecord[] {
  const normalizedQuery = filters.query.trim().toLocaleLowerCase('th-TH');
  return records.filter((record) => {
    const flags = getRecordOperationalFlags(record, records, photos, audits);
    if (!matchesDate(record, filters)) return false;
    if (filters.branch && filters.branch !== 'all' && record.branch !== filters.branch) return false;
    if (filters.responsibleEmployeeCode && record.responsibleEmployeeCode !== filters.responsibleEmployeeCode) return false;
    if (!matchesStatusFilter(record, flags, filters.statusFilter)) return false;
    if (!normalizedQuery) return true;
    return [
      record.vehicleBarcode,
      record.driverPhone,
      record.driverName,
      record.companyName,
      record.routeSummary,
      record.firstBranch,
      record.lastBranch,
      record.responsibleEmployeeCode,
      record.responsibleDisplayName,
      record.status,
      record.checklistType,
      record.branch,
    ].some((value) => value?.toLocaleLowerCase('th-TH').includes(normalizedQuery));
  });
}

export function sortVehicleRecords(
  records: VehicleRecord[],
  photos: VehiclePhoto[],
  sortMode: DashboardSortMode,
): VehicleRecord[] {
  return [...records].sort((a, b) => {
    if (sortMode === 'oldest') return a.updatedAt.localeCompare(b.updatedAt);
    if (sortMode === 'status') return a.status.localeCompare(b.status) || b.updatedAt.localeCompare(a.updatedAt);
    if (sortMode === 'responsible') return a.responsibleEmployeeCode.localeCompare(b.responsibleEmployeeCode) || b.updatedAt.localeCompare(a.updatedAt);
    if (sortMode === 'barcode') return a.vehicleBarcode.localeCompare(b.vehicleBarcode);
    if (sortMode === 'missing_photos') {
      return getPhotoProgress(b, photos).missingCount - getPhotoProgress(a, photos).missingCount;
    }
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

export function getRecordOperationalFlags(
  record: VehicleRecord,
  allRecords: VehicleRecord[],
  photos: VehiclePhoto[],
  audits: EditHistoryEntry[],
): RecordOperationalFlags {
  const recordAudits = audits.filter((entry) => entry.recordId === record.id);
  const recordPhotos = photos.filter((photo) => photo.recordId === record.id);
  const sameDayBarcode = allRecords.filter((candidate) => (
    candidate.id !== record.id &&
    candidate.workDate === record.workDate &&
    candidate.branch === record.branch &&
    candidate.vehicleBarcode === record.vehicleBarcode &&
    candidate.status !== 'VOIDED' &&
    record.status !== 'VOIDED'
  ));
  return {
    edited: recordAudits.some((entry) => MANUAL_EDIT_ACTIONS.includes(entry.actionType)),
    redoOrRefetch: recordAudits.some((entry) => REDO_ACTIONS.includes(entry.actionType)),
    voided: record.status === 'VOIDED',
    duplicateWarning: sameDayBarcode.length > 0,
    localOnlyPhotos: recordPhotos.some((photo) => photo.uploadStatus === 'LOCAL_ONLY'),
    uploadFailed: recordPhotos.some((photo) => photo.uploadStatus === 'UPLOAD_FAILED'),
    missingResponsible: !record.responsibleEmployeeCode || !record.responsibleDisplayName,
    missingDriverPhone: !record.driverPhone,
    missingVehicleBarcode: !record.vehicleBarcode,
  };
}

export function getPhotoProgress(record: VehicleRecord, photos: VehiclePhoto[]): PhotoProgress {
  const recordPhotos = photos.filter((photo) => photo.recordId === record.id);
  const required = record.requiredPhotos;
  const completeCount = required.filter((photoType) => recordPhotos.some((photo) => photo.photoType === photoType)).length;
  return {
    completeCount,
    requiredCount: required.length,
    missingCount: Math.max(0, required.length - completeCount),
    localOnlyCount: recordPhotos.filter((photo) => photo.uploadStatus === 'LOCAL_ONLY').length,
    uploadedCount: recordPhotos.filter((photo) => photo.uploadStatus === 'UPLOADED').length,
    uploadFailedCount: recordPhotos.filter((photo) => photo.uploadStatus === 'UPLOAD_FAILED').length,
    estimatedLocalBytes: recordPhotos.reduce((total, photo) => total + (photo.sizeBytes || 0), 0),
  };
}

export function getOperationalAlerts(
  records: VehicleRecord[],
  photos: VehiclePhoto[],
  audits: EditHistoryEntry[],
): OperationalAlert[] {
  const today = getLocalDateString(new Date());
  const withFlags = records.map((record) => ({
    record,
    flags: getRecordOperationalFlags(record, records, photos, audits),
    progress: getPhotoProgress(record, photos),
  }));
  return [
    { id: 'missing_photos', label: 'Records missing required photos', count: withFlags.filter((item) => item.progress.missingCount > 0 && item.record.status !== 'VOIDED').length, tone: 'warning' },
    { id: 'voided_today', label: 'Records voided today', count: withFlags.filter((item) => item.record.status === 'VOIDED' && item.record.updatedAt.slice(0, 10) === today).length, tone: 'danger' },
    { id: 'edited_today', label: 'Records edited today', count: audits.filter((entry) => entry.editedAt.slice(0, 10) === today && MANUAL_EDIT_ACTIONS.includes(entry.actionType)).length, tone: 'warning' },
    { id: 'upload_failed', label: 'Records with upload failed', count: withFlags.filter((item) => item.flags.uploadFailed).length, tone: 'danger' },
    { id: 'duplicate', label: 'Records with duplicate/conflict warning', count: withFlags.filter((item) => item.flags.duplicateWarning).length, tone: 'danger' },
    { id: 'missing_responsible', label: 'Records with missing responsible profile', count: withFlags.filter((item) => item.flags.missingResponsible).length, tone: 'danger' },
    { id: 'missing_phone', label: 'Records missing driverPhone', count: withFlags.filter((item) => item.flags.missingDriverPhone).length, tone: 'warning' },
    { id: 'missing_barcode', label: 'Records missing vehicleBarcode', count: withFlags.filter((item) => item.flags.missingVehicleBarcode).length, tone: 'danger' },
  ];
}

export function getBranchOptions(records: VehicleRecord[]): string[] {
  return [...new Set(records.map((record) => record.branch).filter(Boolean))].sort();
}

export function getLocalDateString(date: Date): string {
  const offsetDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return offsetDate.toISOString().slice(0, 10);
}

function createEmptySummary(): DashboardSummary {
  return {
    total: 0,
    ready: 0,
    pending: 0,
    complete: 0,
    voided: 0,
    edited: 0,
    redoOrRefetch: 0,
    duplicateWarning: 0,
    localOnlyPhotos: 0,
    uploadedPhotos: 0,
    uploadFailedPhotos: 0,
    estimatedLocalPhotoBytes: 0,
  };
}

function matchesStatusFilter(record: VehicleRecord, flags: RecordOperationalFlags, filter: DashboardStatusFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'active') return record.status !== 'VOIDED';
  if (filter === 'edited') return flags.edited;
  if (filter === 'redo') return flags.redoOrRefetch;
  if (filter === 'duplicate') return flags.duplicateWarning;
  if (filter === 'local_only') return flags.localOnlyPhotos;
  if (filter === 'upload_failed') return flags.uploadFailed;
  return record.status === filter;
}

function matchesDate(record: VehicleRecord, filters: DashboardFilters): boolean {
  if (filters.dateMode === 'all') return true;
  const today = getLocalDateString(new Date());
  if (filters.dateMode === 'today') return record.workDate === today;
  if (filters.dateMode === 'yesterday') {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return record.workDate === getLocalDateString(date);
  }
  if (filters.dateMode === 'last7') {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - 6);
    return record.workDate >= getLocalDateString(threshold) && record.workDate <= today;
  }
  return record.workDate === filters.selectedDate;
}
