import type { LucideIcon } from 'lucide-react';
export type {
  AppSetting,
  AppUser,
  BackupJob,
  Branch,
  CleanupJob,
  EditHistory,
  JobStatus,
  ResponsibleProfile,
  RouteRow,
  StorageUsageSnapshot,
  UserRole,
  VehiclePhoto,
  VehiclePhotoKind,
  VehicleRecord,
  VehicleRecordStatus,
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
