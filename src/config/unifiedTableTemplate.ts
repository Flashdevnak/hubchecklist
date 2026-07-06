export type UnifiedColumnKey =
  | 'responsible'
  | 'date'
  | 'vehicleBarcode'
  | 'targetBranch'
  | 'transferLoadRate'
  | 'branchPhoto1'
  | 'branchPhoto2'
  | 'outboundAfterReleasePhoto'
  | 'plannedDepartureTime'
  | 'actualDepartureTime'
  | 'smallParcelPriority';

export interface UnifiedTableColumn {
  columnKey: UnifiedColumnKey;
  zh: string;
  th: string;
  staffVisible: boolean;
  staffEditable: boolean;
  requiredForStaff: boolean;
  autoFillSource: string;
  exportVisible: boolean;
  adminVisible: boolean;
  adminEditable: boolean;
  dataType: 'text' | 'date' | 'time' | 'photo' | 'boolean';
  defaultValue: string;
}

export const UNIFIED_TABLE_TEMPLATE: UnifiedTableColumn[] = [
  {
    columnKey: 'responsible',
    zh: '卡位负责人',
    th: 'ผู้รับผิดชอบสาขา',
    staffVisible: true,
    staffEditable: false,
    requiredForStaff: true,
    autoFillSource: 'active_responsible_profile',
    exportVisible: true,
    adminVisible: true,
    adminEditable: true,
    dataType: 'text',
    defaultValue: '',
  },
  {
    columnKey: 'date',
    zh: '日期',
    th: 'วันที่',
    staffVisible: true,
    staffEditable: false,
    requiredForStaff: true,
    autoFillSource: 'device_date_on_save',
    exportVisible: true,
    adminVisible: true,
    adminEditable: true,
    dataType: 'date',
    defaultValue: '',
  },
  {
    columnKey: 'vehicleBarcode',
    zh: '出车凭证',
    th: 'บาร์โค้ดรถ',
    staffVisible: true,
    staffEditable: true,
    requiredForStaff: true,
    autoFillSource: 'qr_or_barcode_or_ocr_or_manual',
    exportVisible: true,
    adminVisible: true,
    adminEditable: true,
    dataType: 'text',
    defaultValue: '',
  },
  {
    columnKey: 'targetBranch',
    zh: '卡位/目标网点',
    th: 'สาขาที่พ่วง',
    staffVisible: true,
    staffEditable: true,
    requiredForStaff: false,
    autoFillSource: 'proof_scan_or_ocr_or_flash',
    exportVisible: true,
    adminVisible: true,
    adminEditable: true,
    dataType: 'text',
    defaultValue: '',
  },
  {
    columnKey: 'transferLoadRate',
    zh: '串点车每站转载',
    th: 'อัตราบรรทุกสาขาที่พ่วง',
    staffVisible: false,
    staffEditable: false,
    requiredForStaff: false,
    autoFillSource: 'backoffice_manual',
    exportVisible: true,
    adminVisible: true,
    adminEditable: true,
    dataType: 'text',
    defaultValue: '',
  },
  {
    columnKey: 'branchPhoto1',
    zh: '串点车内照片',
    th: 'รูปถ่ายสาขาที่พ่วง 1',
    staffVisible: true,
    staffEditable: false,
    requiredForStaff: false,
    autoFillSource: 'photo_capture',
    exportVisible: true,
    adminVisible: true,
    adminEditable: false,
    dataType: 'photo',
    defaultValue: '',
  },
  {
    columnKey: 'branchPhoto2',
    zh: '串点车内照片',
    th: 'รูปถ่ายสาขาที่พ่วง 2',
    staffVisible: true,
    staffEditable: false,
    requiredForStaff: false,
    autoFillSource: 'photo_capture',
    exportVisible: true,
    adminVisible: true,
    adminEditable: false,
    dataType: 'photo',
    defaultValue: '',
  },
  {
    columnKey: 'outboundAfterReleasePhoto',
    zh: '卡位余货照片',
    th: 'รูปถ่ายรถขาออก / หลังปล่อยรถ',
    staffVisible: true,
    staffEditable: false,
    requiredForStaff: false,
    autoFillSource: 'photo_capture',
    exportVisible: true,
    adminVisible: true,
    adminEditable: false,
    dataType: 'photo',
    defaultValue: '',
  },
  {
    columnKey: 'plannedDepartureTime',
    zh: '计划发车时间',
    th: 'เวลาปล่อยรถตามแผน',
    staffVisible: true,
    staffEditable: true,
    requiredForStaff: false,
    autoFillSource: 'proof_scan_or_ocr_or_flash',
    exportVisible: true,
    adminVisible: true,
    adminEditable: true,
    dataType: 'time',
    defaultValue: '',
  },
  {
    columnKey: 'actualDepartureTime',
    zh: '实际发车时间',
    th: 'เวลาปล่อยรถจริง',
    staffVisible: true,
    staffEditable: false,
    requiredForStaff: false,
    autoFillSource: 'realtime_device_time_on_save',
    exportVisible: true,
    adminVisible: true,
    adminEditable: true,
    dataType: 'time',
    defaultValue: '',
  },
  {
    columnKey: 'smallParcelPriority',
    zh: '小件是否优先中转',
    th: 'งานถุงออกก่อนหรือไม่',
    staffVisible: false,
    staffEditable: false,
    requiredForStaff: false,
    autoFillSource: 'backoffice_manual',
    exportVisible: true,
    adminVisible: true,
    adminEditable: true,
    dataType: 'boolean',
    defaultValue: '',
  },
];

export function getUnifiedHeaderLabel(column: UnifiedTableColumn): string {
  return `${column.zh} / ${column.th}`;
}
