import type { EditHistoryEntry, VehiclePhoto, VehicleRecord, VehicleRecordStatus } from '../types';
import {
  type ExportData,
  type ExportFilters,
  buildExportFilters,
  collectExportData,
  downloadBackupZip,
  generateBackupZip,
  getExportSummary,
} from './exportBackup';
import {
  cleanupLocalPhotoPayloads,
  getPhotoStorageStats,
  listCleanupEligiblePhotos,
  listVehiclePhotos,
  markPhotosBackedUp,
} from './photos';
import {
  addAuditEntry,
  listVehicleRecords,
  markVehicleRecordsBackedUp,
} from './vehicleRecords';

const BACKUP_JOBS_KEY = 'hubchecklist.backupJobs';
const CLEANUP_JOBS_KEY = 'hubchecklist.cleanupJobs';
const DEFAULT_LIMIT_BYTES = 10 * 1024 * 1024 * 1024;
export const CLEANUP_CONFIRMATION_TEXT = 'ลบรูปที่สำรองแล้ว';

export type BackupJobStatus = 'DRAFT' | 'GENERATED' | 'CONFIRMED' | 'FAILED';
export type CleanupJobStatus = 'DRAFT' | 'COMPLETED' | 'PARTIAL' | 'FAILED';
export type WarningLevel = 'normal' | 'yellow' | 'orange' | 'red' | 'critical';

export interface LocalBackupJob {
  id: string;
  backupId: string;
  status: BackupJobStatus;
  createdAt: string;
  confirmedAt?: string;
  createdBy: string;
  confirmedBy?: string;
  dateRange: string;
  branchFilter: string;
  responsibleFilter: string;
  statusFilter: string;
  recordCount: number;
  photoCount: number;
  missingPhotoCount: number;
  estimatedSizeBytes: number;
  fileName: string;
  warnings: string[];
  includedRecordIds: string[];
  includedPhotoIds: string[];
}

export interface CleanupFilters {
  startDate: string;
  endDate: string;
  branch: string;
  responsibleEmployeeCode: string;
  olderThanDate: string;
}

export interface LocalCleanupJob {
  id: string;
  createdAt: string;
  createdBy: string;
  status: CleanupJobStatus;
  filters: CleanupFilters;
  eligiblePhotoIds: string[];
  skippedPhotoIds: string[];
  cleanedPhotoCount: number;
  skippedPhotoCount: number;
  estimatedFreedBytes: number;
  warnings: string[];
}

export interface BackupCleanupSummary {
  totalVehicleRecords: number;
  totalPhotos: number;
  localOnlyPhotos: number;
  uploadedPhotos: number;
  photosNotBackedUp: number;
  photosBackedUp: number;
  photosEligibleForCleanup: number;
  estimatedPhotoStorageBytes: number;
  oldestUnbackedUpDate: string;
  latestBackupDate: string;
  warningLevel: WarningLevel;
  warningMessage: string;
  usagePercent: number;
}

export interface CleanupPreview {
  eligible: VehiclePhoto[];
  blocked: VehiclePhoto[];
  estimatedFreedBytes: number;
  affectedRecordIds: string[];
  warnings: string[];
  canCleanup: boolean;
  blockReason?: string;
}

export function getBackupCleanupSummary(limitBytes = DEFAULT_LIMIT_BYTES): BackupCleanupSummary {
  const records = listVehicleRecords();
  const photos = listVehiclePhotos();
  const stats = getPhotoStorageStats();
  const backupJobs = listBackupJobs();
  const confirmedBackupIds = new Set(backupJobs.filter((job) => job.status === 'CONFIRMED').map((job) => job.backupId));
  const eligible = photos.filter((photo) => photo.backedUp && photo.backupId && confirmedBackupIds.has(photo.backupId) && !photo.localCleaned);
  const unbacked = photos.filter((photo) => !photo.backedUp);
  const usagePercent = limitBytes > 0 ? Math.min(999, (stats.estimatedSizeBytes / limitBytes) * 100) : 0;
  const warning = getWarningLevel(usagePercent);
  return {
    totalVehicleRecords: records.length,
    totalPhotos: stats.totalPhotos,
    localOnlyPhotos: stats.localOnlyPhotos,
    uploadedPhotos: stats.uploadedPhotos,
    photosNotBackedUp: stats.notBackedUpPhotos,
    photosBackedUp: stats.backedUpPhotos,
    photosEligibleForCleanup: eligible.length,
    estimatedPhotoStorageBytes: stats.estimatedSizeBytes,
    oldestUnbackedUpDate: unbacked.map((photo) => photo.workDate).sort()[0] ?? '-',
    latestBackupDate: backupJobs.filter((job) => job.status === 'CONFIRMED').sort((a, b) => b.confirmedAt?.localeCompare(a.confirmedAt ?? '') ?? 0)[0]?.confirmedAt ?? '-',
    warningLevel: warning.level,
    warningMessage: warning.message,
    usagePercent,
  };
}

export function getDefaultBackupFilters(): ExportFilters {
  const today = new Date().toISOString().slice(0, 10);
  return buildExportFilters({
    startDate: today,
    endDate: today,
    branch: 'all',
    includeVoided: true,
    includeLocalOnlyPhotos: true,
    fileName: `hubchecklist-backup-${today}.zip`,
  });
}

export function getDefaultCleanupFilters(): CleanupFilters {
  const today = new Date().toISOString().slice(0, 10);
  return {
    startDate: '2000-01-01',
    endDate: today,
    branch: 'all',
    responsibleEmployeeCode: '',
    olderThanDate: today,
  };
}

export function previewBackup(filters: ExportFilters): ExportData {
  return collectExportData(filters);
}

export async function generateBackupJob(filters: ExportFilters, createdBy = 'local-user'): Promise<{
  data: ExportData;
  job: LocalBackupJob;
}> {
  const data = collectExportData(filters);
  const summary = getExportSummary(data);
  try {
    const blob = await generateBackupZip(data);
    downloadBackupZip(blob, filters.fileName);
    const job = saveBackupJob({
      id: createId(),
      backupId: data.backupId,
      status: 'GENERATED',
      createdAt: data.exportedAt,
      createdBy,
      dateRange: `${filters.startDate} to ${filters.endDate}`,
      branchFilter: filters.branch,
      responsibleFilter: filters.responsibleEmployeeCode || filters.responsibleDisplayName || 'all',
      statusFilter: filters.status || 'all',
      recordCount: summary.recordCount,
      photoCount: summary.photoCount,
      missingPhotoCount: summary.missingPhotoCount,
      estimatedSizeBytes: data.photoEntries.reduce((total, entry) => total + (entry.photo?.sizeBytes ?? 0), 0),
      fileName: filters.fileName,
      warnings: [
        ...data.warnings,
        'Browser cannot verify that the downloaded file was stored; user confirmation is required before cleanup.',
      ],
      includedRecordIds: data.records.map((record) => record.id),
      includedPhotoIds: data.photoEntries.filter((entry) => entry.existsInZip && entry.photo).map((entry) => entry.photo?.id ?? ''),
    });
    data.records.forEach((record) => {
      addBackupAudit(record, 'BACKUP_GENERATED', job.backupId, createdBy, 'Backup ZIP generated; waiting for user confirmation');
    });
    return { data, job };
  } catch (error) {
    const job = saveBackupJob({
      id: createId(),
      backupId: data.backupId,
      status: 'FAILED',
      createdAt: data.exportedAt,
      createdBy,
      dateRange: `${filters.startDate} to ${filters.endDate}`,
      branchFilter: filters.branch,
      responsibleFilter: filters.responsibleEmployeeCode || filters.responsibleDisplayName || 'all',
      statusFilter: filters.status || 'all',
      recordCount: summary.recordCount,
      photoCount: summary.photoCount,
      missingPhotoCount: summary.missingPhotoCount,
      estimatedSizeBytes: 0,
      fileName: filters.fileName,
      warnings: [error instanceof Error ? error.message : 'Backup generation failed'],
      includedRecordIds: data.records.map((record) => record.id),
      includedPhotoIds: [],
    });
    return { data, job };
  }
}

export function confirmBackupJob(jobId: string, confirmedBy = 'local-user'): LocalBackupJob | null {
  const jobs = listBackupJobs();
  const job = jobs.find((item) => item.id === jobId);
  if (!job || job.status !== 'GENERATED') return null;
  const now = new Date().toISOString();
  const confirmed: LocalBackupJob = {
    ...job,
    status: 'CONFIRMED',
    confirmedAt: now,
    confirmedBy,
  };
  writeBackupJobs(jobs.map((item) => item.id === jobId ? confirmed : item));
  markPhotosBackedUp(job.includedPhotoIds, job.backupId);
  const backedRecords = markVehicleRecordsBackedUp(job.includedRecordIds, job.backupId);
  backedRecords.forEach((record) => {
    addBackupAudit(record, 'BACKUP_CONFIRMED', job.backupId, confirmedBy, 'User confirmed backup file was saved');
  });
  return confirmed;
}

export function listBackupJobs(): LocalBackupJob[] {
  return readJson<LocalBackupJob[]>(BACKUP_JOBS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function previewCleanup(filters: CleanupFilters): CleanupPreview {
  const jobs = listBackupJobs();
  const confirmedBackupIds = new Set(jobs.filter((job) => job.status === 'CONFIRMED').map((job) => job.backupId));
  const { eligible, blocked } = listCleanupEligiblePhotos(filters);
  const confirmedEligible = eligible.filter((photo) => photo.backupId && confirmedBackupIds.has(photo.backupId));
  const unconfirmedEligible = eligible.filter((photo) => !photo.backupId || !confirmedBackupIds.has(photo.backupId));
  const allBlocked = [...blocked, ...unconfirmedEligible];
  const warnings = [
    'ระบบจะไม่ลบข้อมูลรถและประวัติการแก้ไข',
    'ยังไม่ได้เชื่อมระบบลบไฟล์ R2 / ลบเฉพาะข้อมูลรูปในเครื่องที่สำรองแล้ว',
  ];
  if (jobs.filter((job) => job.status === 'CONFIRMED').length === 0) {
    return {
      eligible: [],
      blocked: [...eligible, ...blocked],
      estimatedFreedBytes: 0,
      affectedRecordIds: [],
      warnings: ['ยังลบไม่ได้ เพราะยังไม่ได้ Backup', ...warnings],
      canCleanup: false,
      blockReason: 'ยังลบไม่ได้ เพราะยังไม่ได้ Backup',
    };
  }
  return {
    eligible: confirmedEligible,
    blocked: allBlocked,
    estimatedFreedBytes: confirmedEligible.reduce((total, photo) => total + (photo.sizeBytes || 0), 0),
    affectedRecordIds: [...new Set(confirmedEligible.map((photo) => photo.recordId))],
    warnings,
    canCleanup: confirmedEligible.length > 0,
    blockReason: confirmedEligible.length === 0 ? 'ต้องยืนยันว่าเก็บไฟล์ Backup แล้วก่อน' : undefined,
  };
}

export function runCleanup(filters: CleanupFilters, confirmationText: string, createdBy = 'local-user'): LocalCleanupJob {
  const preview = previewCleanup(filters);
  const now = new Date().toISOString();
  if (confirmationText.trim() !== CLEANUP_CONFIRMATION_TEXT) {
    return saveCleanupJob(createCleanupJob(filters, now, createdBy, 'FAILED', [], preview.blocked.map((photo) => photo.id), 0, [
      'ต้องยืนยันว่าเก็บไฟล์ Backup แล้วก่อน',
    ]));
  }
  if (!preview.canCleanup) {
    return saveCleanupJob(createCleanupJob(filters, now, createdBy, 'FAILED', [], preview.blocked.map((photo) => photo.id), 0, [
      preview.blockReason ?? 'ยังลบไม่ได้ เพราะยังไม่ได้ Backup',
    ]));
  }
  const jobId = createId();
  const result = cleanupLocalPhotoPayloads(preview.eligible.map((photo) => photo.id), jobId, createdBy);
  const job = saveCleanupJob(createCleanupJob(
    filters,
    now,
    createdBy,
    result.skipped.length > 0 ? 'PARTIAL' : 'COMPLETED',
    result.cleaned.map((photo) => photo.id),
    [...preview.blocked.map((photo) => photo.id), ...result.skipped.map((photo) => photo.id)],
    result.freedBytes,
    preview.warnings,
    jobId,
  ));
  const records = listVehicleRecords();
  result.cleaned.forEach((photo) => {
    const record = records.find((item) => item.id === photo.recordId);
    if (record) addCleanupAudit(record, 'PHOTO_CLEANUP', photo, createdBy, job.id);
  });
  preview.blocked.forEach((photo) => {
    const record = records.find((item) => item.id === photo.recordId);
    if (record) addCleanupAudit(record, 'CLEANUP_SKIPPED', photo, createdBy, job.id);
  });
  return job;
}

export function listCleanupJobs(): LocalCleanupJob[] {
  return readJson<LocalCleanupJob[]>(CLEANUP_JOBS_KEY, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function createCleanupJob(
  filters: CleanupFilters,
  createdAt: string,
  createdBy: string,
  status: CleanupJobStatus,
  cleanedPhotoIds: string[],
  skippedPhotoIds: string[],
  estimatedFreedBytes: number,
  warnings: string[],
  id = createId(),
): LocalCleanupJob {
  return {
    id,
    createdAt,
    createdBy,
    status,
    filters,
    eligiblePhotoIds: cleanedPhotoIds,
    skippedPhotoIds,
    cleanedPhotoCount: cleanedPhotoIds.length,
    skippedPhotoCount: skippedPhotoIds.length,
    estimatedFreedBytes,
    warnings,
  };
}

function saveBackupJob(job: LocalBackupJob): LocalBackupJob {
  const jobs = listBackupJobs().filter((item) => item.id !== job.id);
  jobs.push(job);
  writeBackupJobs(jobs);
  return job;
}

function writeBackupJobs(jobs: LocalBackupJob[]): void {
  window.localStorage.setItem(BACKUP_JOBS_KEY, JSON.stringify(jobs));
}

function saveCleanupJob(job: LocalCleanupJob): LocalCleanupJob {
  const jobs = listCleanupJobs().filter((item) => item.id !== job.id);
  jobs.push(job);
  window.localStorage.setItem(CLEANUP_JOBS_KEY, JSON.stringify(jobs));
  return job;
}

function getWarningLevel(percent: number): { level: WarningLevel; message: string } {
  if (percent >= 95) return { level: 'critical', message: 'ต้อง Backup และ Cleanup ก่อนเพิ่มรูปจำนวนมาก' };
  if (percent >= 85) return { level: 'red', message: 'ควรสำรองและเตรียมลบรูปเก่า' };
  if (percent >= 75) return { level: 'orange', message: 'แนะนำให้ Export Backup' };
  if (percent >= 60) return { level: 'yellow', message: 'ควรเริ่มสำรองข้อมูล' };
  return { level: 'normal', message: 'ปกติ' };
}

function addBackupAudit(record: VehicleRecord, actionType: 'BACKUP_GENERATED' | 'BACKUP_CONFIRMED', backupId: string, editedBy: string, reason: string): EditHistoryEntry {
  return addAuditEntry({
    recordId: record.id,
    actionType,
    fieldName: 'backupId',
    oldValue: record.backupId ?? '',
    newValue: backupId,
    editedBy,
    reason,
    source: 'system',
  });
}

function addCleanupAudit(record: VehicleRecord, actionType: 'PHOTO_CLEANUP' | 'CLEANUP_SKIPPED', photo: VehiclePhoto, editedBy: string, cleanupJobId: string): EditHistoryEntry {
  return addAuditEntry({
    recordId: record.id,
    actionType,
    fieldName: photo.photoType,
    oldValue: photo.localCleaned ? 'localCleaned' : 'local payload present',
    newValue: cleanupJobId,
    editedBy,
    reason: actionType === 'PHOTO_CLEANUP' ? 'Cleaned local photo payload after confirmed backup' : 'Skipped cleanup because guard blocked photo',
    source: 'system',
  });
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
