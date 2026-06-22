import type { LucideIcon } from 'lucide-react';

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

export interface ResponsibleProfile {
  id: string;
  employeeCode: string;
  displayName: string;
  branch: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type VehicleRecordStatus =
  | 'DRAFT'
  | 'WAITING_PHONE'
  | 'WAITING_FLASH_SEARCH'
  | 'FLASH_LOADED'
  | 'NEED_REVIEW'
  | 'READY_FOR_PHOTO'
  | 'PENDING_PHOTO'
  | 'COMPLETE'
  | 'VOIDED'
  | 'ERROR';

export interface VehicleRecord {
  id: string;
  workDate: string;
  branch: string;
  responsibleEmployeeCode: string;
  responsibleDisplayName: string;
  vehicleBarcode: string;
  driverPhone?: string;
  status: VehicleRecordStatus;
  createdAt: string;
  updatedAt: string;
}
