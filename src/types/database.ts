export type UserRole = 'staff' | 'supervisor' | 'admin';

export type VehicleRecordStatus =
  | 'draft'
  | 'waiting_phone'
  | 'waiting_flash_search'
  | 'flash_loaded'
  | 'need_review'
  | 'ready_for_photo'
  | 'pending_photo'
  | 'complete'
  | 'voided'
  | 'error';

export type VehiclePhotoKind =
  | 'vehicle_front'
  | 'vehicle_side'
  | 'vehicle_rear'
  | 'paper'
  | 'flash_screenshot'
  | 'other';

export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'blocked';

export interface Branch {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AppUser {
  id: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  branchId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResponsibleProfile {
  id: string;
  userId: string;
  branchId: string;
  employeeCode: string;
  displayName: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VehicleRecord {
  id: string;
  branchId: string;
  responsibleProfileId: string | null;
  responsibleEmployeeCode: string;
  responsibleDisplayName: string;
  workDate: string;
  vehicleBarcode: string;
  driverPhone: string | null;
  flashUrl: string | null;
  status: VehicleRecordStatus;
  createdBy: string;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RouteRow {
  id: string;
  vehicleRecordId: string;
  rowIndex: number;
  routeCode: string | null;
  routeName: string | null;
  destination: string | null;
  statusText: string | null;
  rawData: Record<string, unknown>;
  createdAt: string;
}

export interface VehiclePhoto {
  id: string;
  vehicleRecordId: string;
  branchId: string;
  photoKind: VehiclePhotoKind;
  storageBucket: string | null;
  storagePath: string | null;
  publicUrl: string | null;
  contentType: string | null;
  fileSizeBytes: number | null;
  width: number | null;
  height: number | null;
  capturedBy: string;
  capturedAt: string;
  createdAt: string;
}

export interface EditHistory {
  id: string;
  vehicleRecordId: string;
  branchId: string;
  editedBy: string;
  action: string;
  changedFields: Record<string, unknown>;
  beforeData: Record<string, unknown> | null;
  afterData: Record<string, unknown> | null;
  createdAt: string;
}

export interface BackupJob {
  id: string;
  branchId: string;
  requestedBy: string;
  status: JobStatus;
  backupDate: string;
  storageBucket: string | null;
  storagePath: string | null;
  manifest: Record<string, unknown>;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface CleanupJob {
  id: string;
  branchId: string;
  requestedBy: string;
  status: JobStatus;
  cutoffDate: string;
  requiresBackupJobId: string | null;
  deletedPhotoCount: number;
  freedBytes: number;
  errorMessage: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface StorageUsageSnapshot {
  id: string;
  branchId: string | null;
  bucketName: string;
  totalBytes: number;
  objectCount: number;
  capturedAt: string;
}

export interface AppSetting {
  key: string;
  value: Record<string, unknown>;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
}
