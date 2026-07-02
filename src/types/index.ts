import type { LucideIcon } from 'lucide-react';
export type {
  AppSetting,
  AppUser,
  BackupJob,
  Branch,
  CleanupJob,
  EditHistory as DbEditHistory,
  JobStatus,
  ResponsibleProfile,
  RouteRow as DbRouteRow,
  StorageUsageSnapshot,
  UserRole,
  VehiclePhoto,
  VehiclePhotoKind,
  VehicleRecord as DbVehicleRecord,
  VehicleRecordStatus as DbVehicleRecordStatus,
} from './database';

export type AppRoute =
  | 'login'
  | 'responsible-profile'
  | 'scan'
  | 'scan-preview'
  | 'flash-search'
  | 'checklist'
  | 'edit-record'
  | 'dashboard'
  | 'export'
  | 'backup-cleanup'
  | 'admin-settings'
  | 'user-management';

export type FeatureStatus = 'placeholder' | 'planned' | 'ready';

export interface PageDefinition {
  route: AppRoute;
  title: string;
  shortTitle: string;
  description: string;
  nextMvp: string;
  icon: LucideIcon;
}

export interface ActiveResponsibleProfile {
  employeeCode: string;
  displayName: string;
  branch: string;
}

export interface ScanDraft {
  sourceUrl: string;
  vehicleBarcode: string;
  scannedAt: string;
  responsibleEmployeeCode: string;
  responsibleDisplayName: string;
  branch: string;
}

export interface ScanPreviewDraft extends ScanDraft {
  driverPhone: string;
  ocrRawText: string;
  ocrConfidence?: number;
  phoneConfirmedAt?: string;
}

export interface FlashProofRouteRow {
  index: number;
  branchName?: string;
  date?: string;
  expectedArrivalTime?: string;
  actualArrivalTime?: string;
  inboundScanner?: string;
  expectedDepartureTime?: string;
  actualDepartureTime?: string;
  outboundScanner?: string;
  duration?: string;
  distance?: string;
  sealNumbers?: string;
}

export interface FlashProofResult {
  sourceUrl: string;
  vehicleBarcode: string;
  driverPhone: string;
  driverName?: string;
  companyName?: string;
  routeSummary?: string;
  firstBranch?: string;
  lastBranch?: string;
  plannedDepartureTime?: string;
  actualDepartureTime?: string;
  routeRows: FlashProofRouteRow[];
  rawText: string;
  htmlSnapshot?: string;
  status: 'success' | 'error' | 'unavailable' | 'manual_fallback';
  message?: string;
  flashPageStatus?: string;
  extractedAt: string;
  responsibleEmployeeCode?: string;
  responsibleDisplayName?: string;
  branch?: string;
}

export interface FlashProofPluginResponse {
  success: boolean;
  status: 'success' | 'error' | 'unavailable';
  message: string;
  data?: FlashProofResult;
}

export interface FlashProofParseResult {
  sourceUrl: string;
  vehicleBarcode: string;
  isFlashUrl: boolean;
  isValid: boolean;
  warning?: string;
  error?: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

export type VehicleRecordStatus = 'READY_FOR_PHOTO' | 'NEED_REVIEW' | 'VOIDED';

export type ChecklistType = 'NORMAL_ROUTE' | 'MULTI_DROP';

export interface RouteRow {
  id: string;
  recordId: string;
  index: number;
  branchName?: string;
  date?: string;
  expectedArrivalTime?: string;
  actualArrivalTime?: string;
  inboundScanner?: string;
  expectedDepartureTime?: string;
  actualDepartureTime?: string;
  outboundScanner?: string;
  duration?: string;
  distance?: string;
  sealNumbers?: string;
  createdAt: string;
}

export interface VehicleRecord {
  id: string;
  workDate: string;
  branch: string;
  responsibleEmployeeCode: string;
  responsibleDisplayName: string;
  scannerUserId?: string;
  scannerName?: string;
  sourceUrl: string;
  vehicleBarcode: string;
  driverPhone: string;
  driverName?: string;
  companyName?: string;
  routeSummary?: string;
  firstBranch?: string;
  lastBranch?: string;
  plannedDepartureTime?: string;
  actualDepartureTime?: string;
  routeRows: RouteRow[];
  checklistType: ChecklistType;
  requiredPhotos: string[];
  flashPageStatus?: string;
  flashHtmlSnapshot?: string;
  flashScreenshotObjectKey?: string;
  ocrRawText?: string;
  ocrConfidence?: number;
  status: VehicleRecordStatus;
  duplicateKey: string;
  backedUp: boolean;
  backupId?: string;
  voidReason?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: 'local_only' | 'pending' | 'synced' | 'error';
  syncMessage?: string;
}

export interface VehicleRecordDraft {
  workDate: string;
  branch: string;
  responsibleEmployeeCode: string;
  responsibleDisplayName: string;
  sourceUrl: string;
  vehicleBarcode: string;
  driverPhone: string;
  driverName?: string;
  companyName?: string;
  routeSummary?: string;
  firstBranch?: string;
  lastBranch?: string;
  plannedDepartureTime?: string;
  actualDepartureTime?: string;
  routeRows: FlashProofRouteRow[];
  flashPageStatus?: string;
  flashHtmlSnapshot?: string;
  ocrRawText?: string;
  ocrConfidence?: number;
}

export interface DuplicateVehicleRecordResult {
  exactMatches: VehicleRecord[];
  conflictingMatches: VehicleRecord[];
  hasExactDuplicate: boolean;
  hasConflict: boolean;
  message?: string;
}

export interface EditHistoryEntry {
  id: string;
  recordId: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  editedBy: string;
  editedAt: string;
  reason: string;
}
