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
