import ExcelJS from 'exceljs';
import JSZip from 'jszip';
import { getUnifiedHeaderLabel, UNIFIED_TABLE_TEMPLATE } from '../config/unifiedTableTemplate';
import type { EditHistoryEntry, PhotoType, VehiclePhoto, VehicleRecord, VehicleRecordStatus } from '../types';
import { listVehiclePhotos, PHOTO_TYPE_LABELS } from './photos';
import { listAuditEntries, listVehicleRecords } from './vehicleRecords';

export interface ExportFilters {
  startDate: string;
  endDate: string;
  branch: string;
  responsibleEmployeeCode: string;
  responsibleDisplayName: string;
  status: '' | VehicleRecordStatus;
  vehicleBarcode: string;
  includeVoided: boolean;
  includeLocalOnlyPhotos: boolean;
  fileName: string;
}

export interface ExportPhotoEntry {
  record: VehicleRecord;
  photoType: PhotoType;
  photo: VehiclePhoto | null;
  label: string;
  relativePath: string;
  exportedFileName: string;
  linkedCellIn21_6: string;
  existsInZip: boolean;
  missingReason: string;
  dataUrl?: string;
}

export interface ExportData {
  backupId: string;
  exportedAt: string;
  exportedBy: string;
  filters: ExportFilters;
  records: VehicleRecord[];
  activeRecords: VehicleRecord[];
  voidedRecords: VehicleRecord[];
  photos: VehiclePhoto[];
  audits: EditHistoryEntry[];
  photoEntries: ExportPhotoEntry[];
  missingPhotos: ExportPhotoEntry[];
  warnings: string[];
}

export interface ExportSummary {
  backupId: string;
  recordCount: number;
  activeRecordCount: number;
  voidedRecordCount: number;
  completeRecordCount: number;
  pendingPhotoCount: number;
  photoCount: number;
  missingPhotoCount: number;
  localOnlyPhotoCount: number;
  uploadFailedPhotoCount: number;
  warningCount: number;
}

const APP_VERSION = '0.1.0-mvp011';
const MISSING_PHOTO_TEXT = '???????????';
const LOCAL_PHOTO_MISSING_TEXT = '???????????????? / ??????????? export';

const NORMAL_PHOTOS: PhotoType[] = ['loadingPhoto', 'dropPhotoAfterDeparture'];
const DROP_PHOTOS: PhotoType[] = ['branchDropPhoto1', 'branchDropPhoto2', 'dropPhotoAfterDeparture'];

const BLOCKS = {
  mainDrop: { titleCell: 'A1', startCol: 1, headers: ['????????????????', '??????', '??????????', '??????????? / ?????????????????', '??????????????????????', '?????????????????? 1', '?????????????????? 2', '??????? Drop ???? ???????????', '?????????????????', '???????????????', '????????????????????'] },
  mainVehicle: { titleCell: 'M1', startCol: 13, headers: ['????????????????', '??????', '??????????', '??????????? / ?????????????????', '????????????????', '??????? Drop ???? ???????????', '?????????????????', '???????????????', '????????????????????'] },
  extraVehicle: { titleCell: 'W1', startCol: 23, headers: ['????????????????', '??????', '??????????', '??????????? / ?????????????????', '????????????????', '??????? Drop ???? ???????????', '?????????????????', '???????????????', '????????????????????'] },
  extraDrop: { titleCell: 'AG1', startCol: 33, headers: ['????????????????', '??????', '??????????', '??????????? / ?????????????????', '??????????????????????', '?????????????????? 1', '?????????????????? 2', '??????? Drop ???? ???????????', '?????????????????', '???????????????', '????????????????????'] },
} as const;

export function buildExportFilters(values: Partial<ExportFilters> = {}): ExportFilters {
  const today = new Date().toISOString().slice(0, 10);
  return {
    startDate: values.startDate ?? today,
    endDate: values.endDate ?? today,
    branch: values.branch ?? 'all',
    responsibleEmployeeCode: values.responsibleEmployeeCode ?? '',
    responsibleDisplayName: values.responsibleDisplayName ?? '',
    status: values.status ?? '',
    vehicleBarcode: values.vehicleBarcode ?? '',
    includeVoided: values.includeVoided ?? false,
    includeLocalOnlyPhotos: values.includeLocalOnlyPhotos ?? true,
    fileName: values.fileName ?? `hubchecklist-backup-${today}.zip`,
  };
}

export function collectExportData(filters: ExportFilters): ExportData {
  const allRecords = listVehicleRecords();
  const photos = listVehiclePhotos();
  const audits = listAuditEntries();
  const exportedAt = new Date().toISOString();
  const backupId = `backup-${exportedAt.replace(/[-:.TZ]/g, '')}-${Math.random().toString(36).slice(2, 8)}`;
  const normalizedBarcode = filters.vehicleBarcode.trim().toLocaleLowerCase('th-TH');

  const records = allRecords.filter((record) => {
    if (record.workDate < filters.startDate || record.workDate > filters.endDate) return false;
    if (!filters.includeVoided && record.status === 'VOIDED') return false;
    if (filters.branch !== 'all' && record.branch !== filters.branch) return false;
    if (filters.responsibleEmployeeCode && record.responsibleEmployeeCode !== filters.responsibleEmployeeCode) return false;
    if (filters.responsibleDisplayName && !record.responsibleDisplayName.toLocaleLowerCase('th-TH').includes(filters.responsibleDisplayName.toLocaleLowerCase('th-TH'))) return false;
    if (filters.status && record.status !== filters.status) return false;
    if (normalizedBarcode && !record.vehicleBarcode.toLocaleLowerCase('th-TH').includes(normalizedBarcode)) return false;
    return true;
  });

  const photoEntries = buildPhotoEntries(records, photos, filters);
  const warnings = createWarnings(records, photoEntries);
  return {
    backupId,
    exportedAt,
    exportedBy: filters.responsibleEmployeeCode || 'local-user',
    filters,
    records,
    activeRecords: records.filter((record) => record.status !== 'VOIDED'),
    voidedRecords: records.filter((record) => record.status === 'VOIDED'),
    photos,
    audits: audits.filter((entry) => records.some((record) => record.id === entry.recordId)),
    photoEntries,
    missingPhotos: photoEntries.filter((entry) => !entry.existsInZip),
    warnings,
  };
}

export function getExportSummary(data: ExportData): ExportSummary {
  return {
    backupId: data.backupId,
    recordCount: data.records.length,
    activeRecordCount: data.activeRecords.length,
    voidedRecordCount: data.voidedRecords.length,
    completeRecordCount: data.records.filter((record) => record.status === 'COMPLETE').length,
    pendingPhotoCount: data.records.filter((record) => ['READY_FOR_PHOTO', 'PENDING_PHOTO', 'NEED_REVIEW'].includes(record.status)).length,
    photoCount: data.photoEntries.filter((entry) => entry.existsInZip).length,
    missingPhotoCount: data.missingPhotos.length,
    localOnlyPhotoCount: data.photoEntries.filter((entry) => entry.photo?.uploadStatus === 'LOCAL_ONLY').length,
    uploadFailedPhotoCount: data.photoEntries.filter((entry) => entry.photo?.uploadStatus === 'UPLOAD_FAILED').length,
    warningCount: data.warnings.length,
  };
}

export async function createWorkbook21_6(data: ExportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'HubChecklist';
  workbook.created = new Date(data.exportedAt);
  workbook.modified = new Date(data.exportedAt);

  createSheet21_6(workbook, data);
  createRouteDetailSheet(workbook, data);
  createPhotoIndexSheet(workbook, data);
  createEditHistorySheet(workbook, data);
  createBackupManifestSheet(workbook, data);
  createVoidedRecordsSheet(workbook, data);

  return workbook;
}

export function createBackupManifest(data: ExportData) {
  const summary = getExportSummary(data);
  return {
    backupId: data.backupId,
    exportedAt: data.exportedAt,
    exportedBy: data.exportedBy,
    filters: data.filters,
    recordCount: summary.recordCount,
    activeRecordCount: summary.activeRecordCount,
    voidedRecordCount: summary.voidedRecordCount,
    completeRecordCount: summary.completeRecordCount,
    pendingPhotoCount: summary.pendingPhotoCount,
    photoCount: summary.photoCount,
    missingPhotoCount: summary.missingPhotoCount,
    includedRecordIds: data.records.map((record) => record.id),
    includedPhotoIds: data.photoEntries.filter((entry) => entry.photo).map((entry) => entry.photo?.id),
    missingPhotos: data.missingPhotos.map((entry) => ({
      recordId: entry.record.id,
      vehicleBarcode: entry.record.vehicleBarcode,
      photoType: entry.photoType,
      missingReason: entry.missingReason,
      linkedCellIn21_6: entry.linkedCellIn21_6,
    })),
    warnings: data.warnings,
    appVersion: APP_VERSION,
  };
}

export function buildPhotoZipEntries(data: ExportData): ExportPhotoEntry[] {
  return data.photoEntries.filter((entry) => entry.existsInZip && entry.dataUrl);
}

export async function generateBackupZip(data: ExportData): Promise<Blob> {
  const zip = new JSZip();
  const workbook = await createWorkbook21_6(data);
  const workbookBuffer = await workbook.xlsx.writeBuffer();
  zip.file('workbook.xlsx', workbookBuffer);
  zip.folder('photos');
  zip.folder('flash-screenshots');

  buildPhotoZipEntries(data).forEach((entry) => {
    if (!entry.dataUrl) return;
    zip.file(entry.relativePath, dataUrlToUint8Array(entry.dataUrl));
  });

  data.records.forEach((record) => {
    if (!record.flashHtmlSnapshot) return;
    zip.file(`flash-screenshots/${sanitizeExportFileName(record.workDate)}/${sanitizeExportFileName(record.vehicleBarcode || record.id)}/flash-proof.html`, record.flashHtmlSnapshot);
  });

  zip.file('backup-manifest.json', JSON.stringify(createBackupManifest(data), null, 2));
  return zip.generateAsync({ type: 'blob' });
}

export function downloadBackupZip(blob: Blob, filename: string): void {
  const safeName = sanitizeExportFileName(filename || 'backup.zip').replace(/\.zip$/i, '') + '.zip';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function mapRecordTo21_6Block(record: VehicleRecord): keyof typeof BLOCKS {
  return record.checklistType === 'MULTI_DROP' ? 'mainDrop' : 'mainVehicle';
}

export function getPhotoCellLink(record: VehicleRecord, photoType: PhotoType, entries: ExportPhotoEntry[]): string {
  return entries.find((entry) => entry.record.id === record.id && entry.photoType === photoType)?.relativePath ?? '';
}

export function getPhotoExportPath(record: VehicleRecord, photo: VehiclePhoto): string {
  const date = sanitizeExportFileName(record.workDate || 'unknown-date');
  const responsible = sanitizeExportFileName(`${record.responsibleEmployeeCode || 'missing'}_${record.responsibleDisplayName || 'missing'}`);
  const barcode = sanitizeExportFileName(`${record.vehicleBarcode || 'missing'}_${record.id.slice(0, 8)}`);
  const extension = getPhotoExtension(photo);
  return `photos/${date}/${responsible}/${barcode}/${sanitizeExportFileName(photo.photoType)}.${extension}`;
}

export function sanitizeExportFileName(value: string): string {
  return (value || 'export')
    .normalize('NFKD')
    .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .slice(0, 120);
}

function createSheet21_6(workbook: ExcelJS.Workbook, data: ExportData): void {
  const sheet = workbook.addWorksheet('21.6', { views: [{ state: 'frozen', ySplit: 2 }] });
  sheet.mergeCells(1, 1, 1, UNIFIED_TABLE_TEMPLATE.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = 'Unified Vehicle Proof Table / RESET-001';
  titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };

  UNIFIED_TABLE_TEMPLATE.forEach((column, index) => {
    const cell = sheet.getCell(2, index + 1);
    cell.value = getUnifiedHeaderLabel(column);
    cell.font = { bold: true };
    cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE044' } };
    cell.border = thinBorder();
    sheet.getColumn(index + 1).width = column.dataType === 'photo' ? 24 : 18;
  });

  data.activeRecords.forEach((record, recordIndex) => {
    const rowNumber = recordIndex + 3;
    const rowValues = getUnifiedRowValues(record, data.photoEntries, rowNumber);
    rowValues.forEach((value, index) => {
      const cell = sheet.getCell(rowNumber, index + 1);
      if (typeof value === 'object' && value !== null && 'text' in value) {
        cell.value = value;
        cell.font = { color: { argb: 'FF0563C1' }, underline: true };
      } else {
        cell.value = value;
      }
      cell.alignment = { wrapText: true, vertical: 'middle', horizontal: getHorizontalAlign(index) };
      cell.border = thinBorder();
    });
  });
}

function getUnifiedRowValues(record: VehicleRecord, entries: ExportPhotoEntry[], rowNumber: number): Array<string | ExcelJS.CellHyperlinkValue> {
  return [
    getResponsibleText(record),
    record.workDate,
    record.vehicleBarcode,
    record.targetBranch || record.lastBranch || record.routeSummary || '',
    record.transferLoadRate || '',
    getUnifiedPhotoCellValue(record, 'branchDropPhoto1', entries, rowNumber, 6),
    getUnifiedPhotoCellValue(record, 'branchDropPhoto2', entries, rowNumber, 7),
    getUnifiedPhotoCellValue(record, 'dropPhotoAfterDeparture', entries, rowNumber, 8),
    record.plannedDepartureTime || '',
    record.actualDepartureTime || '',
    record.smallParcelPriority || '',
  ];
}

function getUnifiedPhotoCellValue(record: VehicleRecord, photoType: PhotoType, entries: ExportPhotoEntry[], rowNumber: number, columnNumber: number): string | ExcelJS.CellHyperlinkValue {
  const entry = entries.find((item) => item.record.id === record.id && item.photoType === photoType);
  if (!entry) return MISSING_PHOTO_TEXT;
  entry.linkedCellIn21_6 = `${getColumnLetter(columnNumber)}${rowNumber}`;
  if (!entry.existsInZip) return entry.missingReason || MISSING_PHOTO_TEXT;
  return { text: getPhotoLinkText(photoType), hyperlink: entry.relativePath };
}

function setupBlock(sheet: ExcelJS.Worksheet, blockName: keyof typeof BLOCKS, title: string): void {
  const block = BLOCKS[blockName];
  const start = block.startCol;
  const end = start + block.headers.length - 1;
  sheet.mergeCells(1, start, 1, end);
  const titleCell = sheet.getCell(block.titleCell);
  titleCell.value = title;
  titleCell.font = { bold: true, size: 13, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF111827' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  block.headers.forEach((header, index) => {
    const cell = sheet.getCell(2, start + index);
    cell.value = header;
    cell.font = { bold: true };
    cell.alignment = { wrapText: true, horizontal: 'center', vertical: 'middle' };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE044' } };
    cell.border = thinBorder();
    sheet.getColumn(start + index).width = getColumnWidth(header);
  });
}

function getBlockRowValues(record: VehicleRecord, blockName: keyof typeof BLOCKS, entries: ExportPhotoEntry[], rowNumber: number): Array<string | ExcelJS.CellHyperlinkValue> {
  if (blockName === 'mainDrop' || blockName === 'extraDrop') {
    return [
      getResponsibleText(record),
      record.workDate,
      record.vehicleBarcode,
      record.routeSummary || record.firstBranch || '',
      '',
      getPhotoCellValue(record, 'branchDropPhoto1', entries, blockName, rowNumber),
      getPhotoCellValue(record, 'branchDropPhoto2', entries, blockName, rowNumber),
      getPhotoCellValue(record, 'dropPhotoAfterDeparture', entries, blockName, rowNumber),
      record.plannedDepartureTime || '',
      record.actualDepartureTime || '',
      '',
    ];
  }
  return [
    getResponsibleText(record),
    record.workDate,
    record.vehicleBarcode,
    record.routeSummary || record.firstBranch || '',
    getPhotoCellValue(record, 'loadingPhoto', entries, blockName, rowNumber),
    getPhotoCellValue(record, 'dropPhotoAfterDeparture', entries, blockName, rowNumber),
    record.plannedDepartureTime || '',
    record.actualDepartureTime || '',
    '',
  ];
}

function getPhotoCellValue(record: VehicleRecord, photoType: PhotoType, entries: ExportPhotoEntry[], blockName: keyof typeof BLOCKS, rowNumber: number): string | ExcelJS.CellHyperlinkValue {
  const entry = entries.find((item) => item.record.id === record.id && item.photoType === photoType);
  if (!entry) return MISSING_PHOTO_TEXT;
  entry.linkedCellIn21_6 = `${getColumnLetter(getPhotoColumn(blockName, photoType))}${rowNumber}`;
  if (!entry.existsInZip) return entry.missingReason || MISSING_PHOTO_TEXT;
  return { text: getPhotoLinkText(photoType), hyperlink: entry.relativePath };
}

function createRouteDetailSheet(workbook: ExcelJS.Workbook, data: ExportData): void {
  const sheet = workbook.addWorksheet('Route Detail');
  addHeaderRow(sheet, ['workDate', 'branch', 'responsibleEmployeeCode', 'responsibleDisplayName', 'vehicleBarcode', 'recordId', 'routeIndex', 'branchName', 'date', 'expectedArrivalTime', 'actualArrivalTime', 'inboundScanner', 'expectedDepartureTime', 'actualDepartureTime', 'outboundScanner', 'duration', 'distance', 'sealNumbers']);
  data.records.forEach((record) => {
    record.routeRows.forEach((route) => {
      sheet.addRow([record.workDate, record.branch, record.responsibleEmployeeCode, record.responsibleDisplayName, record.vehicleBarcode, record.id, route.index, route.branchName, route.date, route.expectedArrivalTime, route.actualArrivalTime, route.inboundScanner, route.expectedDepartureTime, route.actualDepartureTime, route.outboundScanner, route.duration, route.distance, route.sealNumbers]);
    });
  });
  autoStyleSheet(sheet);
}

function createPhotoIndexSheet(workbook: ExcelJS.Workbook, data: ExportData): void {
  const sheet = workbook.addWorksheet('Photo Index');
  addHeaderRow(sheet, ['workDate', 'branch', 'responsibleEmployeeCode', 'responsibleDisplayName', 'vehicleBarcode', 'recordId', 'checklistType', 'photoType', 'photoLabelThai', 'originalFileName', 'exportedFileName', 'relativePath', 'capturedAt', 'capturedBy', 'uploadStatus', 'linkedCellIn21_6', 'existsInZip', 'missingReason']);
  data.photoEntries.forEach((entry) => {
    const row = sheet.addRow([entry.record.workDate, entry.record.branch, entry.record.responsibleEmployeeCode, entry.record.responsibleDisplayName, entry.record.vehicleBarcode, entry.record.id, entry.record.checklistType, entry.photoType, entry.label, entry.photo?.fileName ?? '', entry.exportedFileName, entry.relativePath, entry.photo?.capturedAt ?? '', entry.photo?.capturedBy ?? '', entry.photo?.uploadStatus ?? '', entry.linkedCellIn21_6, entry.existsInZip ? 'yes' : 'no', entry.missingReason]);
    if (entry.existsInZip) {
      row.getCell(12).value = { text: entry.relativePath, hyperlink: entry.relativePath };
      row.getCell(12).font = { color: { argb: 'FF0563C1' }, underline: true };
    }
  });
  autoStyleSheet(sheet);
}

function createEditHistorySheet(workbook: ExcelJS.Workbook, data: ExportData): void {
  const sheet = workbook.addWorksheet('Edit History');
  addHeaderRow(sheet, ['recordId', 'vehicleBarcode', 'actionType', 'fieldName', 'oldValue', 'newValue', 'editedBy', 'editedAt', 'reason', 'source']);
  data.audits.forEach((entry) => {
    const record = data.records.find((item) => item.id === entry.recordId);
    sheet.addRow([entry.recordId, record?.vehicleBarcode ?? '', entry.actionType, entry.fieldName, entry.oldValue, entry.newValue, entry.editedBy, entry.editedAt, entry.reason, entry.source]);
  });
  autoStyleSheet(sheet);
}

function createVoidedRecordsSheet(workbook: ExcelJS.Workbook, data: ExportData): void {
  const sheet = workbook.addWorksheet('Voided Records');
  addHeaderRow(sheet, ['workDate', 'branch', 'responsibleEmployeeCode', 'responsibleDisplayName', 'vehicleBarcode', 'driverPhone', 'driverName', 'companyName', 'routeSummary', 'voidReason', 'updatedAt', 'auditCount']);
  data.voidedRecords.forEach((record) => {
    sheet.addRow([record.workDate, record.branch, record.responsibleEmployeeCode, record.responsibleDisplayName, record.vehicleBarcode, record.driverPhone, record.driverName, record.companyName, record.routeSummary, record.voidReason, record.updatedAt, data.audits.filter((entry) => entry.recordId === record.id).length]);
  });
  autoStyleSheet(sheet);
}

function createBackupManifestSheet(workbook: ExcelJS.Workbook, data: ExportData): void {
  const sheet = workbook.addWorksheet('Backup Manifest');
  addHeaderRow(sheet, ['field', 'value']);
  const summary = getExportSummary(data);
  Object.entries({
    backupId: data.backupId,
    exportedAt: data.exportedAt,
    exportedBy: data.exportedBy,
    dateRange: `${data.filters.startDate} to ${data.filters.endDate}`,
    branchFilter: data.filters.branch,
    responsibleFilter: data.filters.responsibleEmployeeCode || data.filters.responsibleDisplayName || 'all',
    statusFilter: data.filters.status || 'all',
    recordCount: summary.recordCount,
    activeRecordCount: summary.activeRecordCount,
    voidedRecordCount: summary.voidedRecordCount,
    completeRecordCount: summary.completeRecordCount,
    pendingPhotoCount: summary.pendingPhotoCount,
    photoCount: summary.photoCount,
    missingPhotoCount: summary.missingPhotoCount,
    appVersion: APP_VERSION,
    exportMode: 'local-first browser ZIP',
  }).forEach(([field, value]) => sheet.addRow([field, value]));
  autoStyleSheet(sheet);
}

function buildPhotoEntries(records: VehicleRecord[], photos: VehiclePhoto[], filters: ExportFilters): ExportPhotoEntry[] {
  return records.flatMap((record) => {
    const requiredPhotoTypes: PhotoType[] = ['branchDropPhoto1', 'branchDropPhoto2', 'dropPhotoAfterDeparture'];
    return requiredPhotoTypes.map((photoType) => {
      const photo = photos.find((item) => item.recordId === record.id && item.photoType === photoType) ?? null;
      const dataUrl = photo ? getPhotoDataUrl(photo) : '';
      const includePhoto = Boolean(photo && dataUrl && (filters.includeLocalOnlyPhotos || photo.uploadStatus !== 'LOCAL_ONLY'));
      const relativePath = photo ? getPhotoExportPath(record, photo) : '';
      return {
        record,
        photoType,
        photo,
        label: PHOTO_TYPE_LABELS[photoType],
        relativePath,
        exportedFileName: relativePath.split('/').pop() ?? '',
        linkedCellIn21_6: '',
        existsInZip: includePhoto,
        missingReason: getMissingReason(photo, dataUrl, filters),
        dataUrl: includePhoto ? dataUrl : undefined,
      };
    });
  });
}

function getMissingReason(photo: VehiclePhoto | null, dataUrl: string, filters: ExportFilters): string {
  if (!photo) return MISSING_PHOTO_TEXT;
  if (photo.uploadStatus === 'LOCAL_ONLY' && !filters.includeLocalOnlyPhotos) return LOCAL_PHOTO_MISSING_TEXT;
  if (!dataUrl) return LOCAL_PHOTO_MISSING_TEXT;
  return '';
}

function getPhotoDataUrl(photo: VehiclePhoto): string {
  return photo.localObjectUrl || window.localStorage.getItem(photo.localStorageKey) || '';
}

function createWarnings(records: VehicleRecord[], photoEntries: ExportPhotoEntry[]): string[] {
  const warnings: string[] = [];
  const missing = photoEntries.filter((entry) => !entry.existsInZip);
  if (missing.length > 0) warnings.push(`${missing.length} photo cells are missing export files`);
  if (records.some((record) => record.status === 'VOIDED')) warnings.push('Voided records are included in Voided Records sheet');
  if (records.some((record) => record.flashHtmlSnapshot)) warnings.push('Flash HTML snapshots included when locally available; screenshots are not faked');
  return warnings;
}

function addHeaderRow(sheet: ExcelJS.Worksheet, headers: string[]): void {
  const row = sheet.addRow(headers);
  row.font = { bold: true };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFE044' } };
  row.alignment = { wrapText: true, vertical: 'middle', horizontal: 'center' };
}

function autoStyleSheet(sheet: ExcelJS.Worksheet): void {
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  sheet.columns.forEach((column) => {
    column.width = Math.min(38, Math.max(14, String(column.header ?? '').length + 6));
    column.alignment = { wrapText: true, vertical: 'middle' };
  });
  sheet.eachRow((row) => row.eachCell((cell) => {
    cell.border = thinBorder();
  }));
}

function thinBorder(): Partial<ExcelJS.Borders> {
  return {
    top: { style: 'thin', color: { argb: 'FFE7E1D2' } },
    left: { style: 'thin', color: { argb: 'FFE7E1D2' } },
    bottom: { style: 'thin', color: { argb: 'FFE7E1D2' } },
    right: { style: 'thin', color: { argb: 'FFE7E1D2' } },
  };
}

function getResponsibleText(record: VehicleRecord): string {
  return `${record.responsibleEmployeeCode || '-'} ${record.responsibleDisplayName || ''}`.trim();
}

function getPhotoLinkText(photoType: PhotoType): string {
  if (photoType === 'loadingPhoto') return '???????????';
  if (photoType === 'dropPhotoAfterDeparture') return '????? Drop';
  if (photoType === 'branchDropPhoto1') return '????????????? 1';
  return '????????????? 2';
}

function getPhotoColumn(blockName: keyof typeof BLOCKS, photoType: PhotoType): number {
  const block = BLOCKS[blockName];
  if (blockName === 'mainDrop' || blockName === 'extraDrop') {
    if (photoType === 'branchDropPhoto1') return block.startCol + 5;
    if (photoType === 'branchDropPhoto2') return block.startCol + 6;
    return block.startCol + 7;
  }
  if (photoType === 'loadingPhoto') return block.startCol + 4;
  return block.startCol + 5;
}

function getHorizontalAlign(index: number): 'left' | 'center' {
  return [1, 2, 4, 5, 8, 9, 10].includes(index) ? 'center' : 'left';
}

function getColumnWidth(header: string): number {
  if (header.includes('???')) return 22;
  if (header.includes('??????????')) return 34;
  if (header.includes('????????')) return 18;
  return 16;
}

function getColumnLetter(columnNumber: number): string {
  let value = columnNumber;
  let letter = '';
  while (value > 0) {
    const modulo = (value - 1) % 26;
    letter = String.fromCharCode(65 + modulo) + letter;
    value = Math.floor((value - modulo) / 26);
  }
  return letter;
}

function getPhotoExtension(photo: VehiclePhoto): string {
  if (photo.mimeType.includes('webp')) return 'webp';
  if (photo.mimeType.includes('png')) return 'png';
  return 'jpg';
}

function dataUrlToUint8Array(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(',')[1] ?? '';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
