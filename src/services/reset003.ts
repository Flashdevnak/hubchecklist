import ExcelJS from 'exceljs';
import JSZip from 'jszip';

export type AppMode = 'frontline' | 'admin';
export type ProofStatus = 'DRAFT' | 'IN_PROGRESS' | 'COMPLETE' | 'NEED_REVIEW' | 'VOIDED';
export type GpsStatus = 'granted' | 'denied' | 'unavailable' | 'unknown';
export type SlotType = 'REAR_MAIN' | 'FRONT_DROP' | 'DROP_REAR_1' | 'DROP_REAR_2' | 'DROP_REAR_EXTRA';
export type GoogleSyncMode = 'local_only' | 'google_sheets';
export type GoogleSyncAction = 'createRecord' | 'uploadPhotoMetadata' | 'syncRecord' | 'appendAudit';
export type RecordSyncStatus = 'LOCAL_ONLY' | 'PENDING_SYNC' | 'SYNCED' | 'SYNC_FAILED';
export type AdminDeviceStatus = 'PENDING' | 'APPROVED' | 'REVOKED';
export type AdminDeviceRole = 'OWNER' | 'ADMIN' | 'VIEWER';

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
  duplicateKey?: string;
  duplicateOfRecordId?: string;
  duplicateReason?: string;
  forceCreateNew?: boolean;
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

export interface AdminDevice {
  deviceId: string;
  deviceName: string;
  ownerName: string;
  role: AdminDeviceRole;
  status: AdminDeviceStatus;
  approvedAt?: string;
  revokedAt?: string;
  lastLoginAt?: string;
  note?: string;
}

export interface BootstrapCache {
  ok: boolean;
  serverTime?: string;
  appSettings?: Partial<AppSettings> & Record<string, unknown>;
  hubs: Hub[];
  responsibleStaff: ResponsibleStaff[];
  adminAuthEnabled: boolean;
  minimumAppVersion?: string;
  cachedAt: string;
  source: 'online' | 'cache' | 'local';
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

export interface CentralAdminSaveResult {
  ok: boolean;
  message: string;
  hubs?: Hub[];
  responsibleStaff?: ResponsibleStaff[];
  appSettings?: Partial<AppSettings> & Record<string, unknown>;
}

export interface RetrySyncResult {
  attempted: number;
  synced: number;
  failed: number;
  message: string;
}

export type WorkViewStatus = ProofStatus | RecordSyncStatus;

const HUBS_KEY = 'reset003.hubs';
const STAFF_KEY = 'reset003.responsibleStaff';
const ACTIVE_CONTEXT_KEY = 'reset003.activeContext';
const RECORDS_KEY = 'reset003.records';
const AUDIT_KEY = 'reset003.audit';
const SETTINGS_KEY = 'reset003.settings';
const SYNC_QUEUE_KEY = 'reset003.googleSyncQueue';
const ADMIN_PIN_KEY = 'reset003.adminPin';
const EMPLOYEE_DEVICE_MODE_KEY = 'reset003.employeeDeviceMode';
const DEVICE_ID_KEY = 'reset003.deviceId';
const BOOTSTRAP_CACHE_KEY = 'reset003.bootstrapCache';
const ADMIN_SESSION_KEY = 'reset003.adminSession';
const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
const CENTRAL_BACKEND_URL = (import.meta.env.VITE_APPS_SCRIPT_WEB_APP_URL as string | undefined)?.trim() ?? '';
const CENTRAL_CLIENT_MODE = (import.meta.env.VITE_APP_CLIENT_MODE as string | undefined)?.trim() ?? '';

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
  const saved = readJson<Partial<AppSettings>>(SETTINGS_KEY, {});
  return {
    ...DEFAULT_SETTINGS,
    ...saved,
    googleSyncMode: CENTRAL_BACKEND_URL ? 'google_sheets' : (saved.googleSyncMode ?? DEFAULT_SETTINGS.googleSyncMode),
    googleAppsScriptUrl: CENTRAL_BACKEND_URL || saved.googleAppsScriptUrl || '',
  };
}

export function saveSettings(settings: AppSettings): void {
  writeJson(SETTINGS_KEY, {
    ...settings,
    googleAppsScriptUrl: CENTRAL_BACKEND_URL || settings.googleAppsScriptUrl,
  });
}

export function getCentralBackendUrl(): string {
  return CENTRAL_BACKEND_URL;
}

export function isCentralSaveReady(settings = getSettings()): boolean {
  return Boolean(CENTRAL_BACKEND_URL || (
    settings.googleSyncMode === 'google_sheets'
    && settings.googleAppsScriptUrl.trim()
    && settings.googleSharedSecret.trim()
  ));
}

export function isCentralClientMode(): boolean {
  return CENTRAL_CLIENT_MODE === 'central' || Boolean(CENTRAL_BACKEND_URL);
}

export function getCentralBackendStatus(): 'configured' | 'missing' {
  return CENTRAL_BACKEND_URL ? 'configured' : 'missing';
}

export function getDeviceId(): string {
  const current = window.localStorage.getItem(DEVICE_ID_KEY);
  if (current) return current;
  const next = createId();
  window.localStorage.setItem(DEVICE_ID_KEY, next);
  return next;
}

export function getCachedBootstrap(): BootstrapCache | null {
  return readJson<BootstrapCache | null>(BOOTSTRAP_CACHE_KEY, null);
}

export function hasAuthorizedAdminSession(): boolean {
  const session = readJson<{ deviceId: string; role: AdminDeviceRole; expiresAt: string } | null>(ADMIN_SESSION_KEY, null);
  return Boolean(session && session.deviceId === getDeviceId() && new Date(session.expiresAt).getTime() > Date.now());
}

export function clearAdminSession(): void {
  window.localStorage.removeItem(ADMIN_SESSION_KEY);
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

export function getWorkSortRank(record: ProofRecord): number {
  if (record.syncStatus === 'SYNC_FAILED') return 1;
  if (record.syncStatus === 'PENDING_SYNC') return 2;
  if (record.status === 'NEED_REVIEW') return 3;
  if (record.status === 'IN_PROGRESS') return 4;
  if (record.status === 'DRAFT') return 5;
  if (record.status === 'COMPLETE') return 6;
  if (record.syncStatus === 'SYNCED') return 7;
  if (record.status === 'VOIDED') return 8;
  return 9;
}

export function isActiveFrontlineRecord(record: ProofRecord): boolean {
  if (record.status === 'VOIDED') return false;
  if (record.syncStatus === 'SYNC_FAILED' || record.syncStatus === 'PENDING_SYNC') return true;
  if (record.status === 'DRAFT' || record.status === 'IN_PROGRESS' || record.status === 'NEED_REVIEW') return true;
  return getMissingPhotoSlots(record).length > 0;
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
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const pick = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return `${pick('year')}-${pick('month')}-${pick('day')}`;
}

export function formatDateTime(iso?: string): string {
  if (!iso) return '-';
  return `${formatDatePart(iso)} ${formatTimePart(iso)}`;
}

export function formatDatePart(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: BANGKOK_TIME_ZONE });
}

export function formatTimePart(iso?: string): string {
  if (!iso) return '-';
  return new Date(iso).toLocaleTimeString('th-TH', { timeZone: BANGKOK_TIME_ZONE, hour12: false });
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

  const trailerSlots = Array.from({ length: Math.max(2, dropCount) }, (_, index) => createSlot(
    index < 2 ? (`DROP_REAR_${index + 1}` as SlotType) : 'DROP_REAR_EXTRA',
    `รูปหลังรถพ่วงที่ ${index + 1}`,
  ));
  return [
    createSlot('REAR_MAIN', 'รูปหลังรถหลัก'),
    ...trailerSlots,
  ];
}

export function updatePhotoSlotsForDropCount(record: ProofRecord, dropCount: number): ProofRecord {
  const nextSlots = createPhotoSlots(true, dropCount).map((slot) => {
    const existing = record.photoSlots.find((item) => item.slotType === slot.slotType && item.labelThai === slot.labelThai)
      ?? record.photoSlots.find((item) => item.slotType === slot.slotType && item.slotType !== 'DROP_REAR_EXTRA');
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
  if (!isGoogleSyncConfigured()) {
    return { record: submitted, sync: { ok: true, queued: false, message: 'บันทึกข้อมูลแล้ว' } };
  }
  void syncRecordToGoogle(submitted);
  return { record: submitted, sync: { ok: true, queued: true, message: 'บันทึกข้อมูลแล้ว' } };
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

export async function bootstrapCentralConfig(): Promise<BootstrapCache> {
  ensureSeedData();
  if (!CENTRAL_BACKEND_URL && !isGoogleSyncConfigured()) {
    const local: BootstrapCache = {
      ok: false,
      hubs: listHubs(),
      responsibleStaff: listResponsibleStaff(),
      adminAuthEnabled: false,
      cachedAt: new Date().toISOString(),
      source: 'local',
    };
    writeJson(BOOTSTRAP_CACHE_KEY, local);
    return local;
  }

  try {
    const data = await callAppsScript('getBootstrapData', {
      deviceId: getDeviceId(),
      appVersion: '0.1.0',
    }, { allowWithoutSecret: true }) as Partial<BootstrapCache>;
    const hubs = normalizeHubs(data.hubs);
    const responsibleStaff = normalizeResponsibleStaff(data.responsibleStaff);
    if (hubs.length > 0) saveHubs(hubs);
    if (responsibleStaff.length > 0) saveResponsibleStaff(responsibleStaff);
    const cache: BootstrapCache = {
      ok: data.ok !== false,
      serverTime: data.serverTime,
      appSettings: data.appSettings,
      hubs: hubs.length > 0 ? hubs : listHubs(),
      responsibleStaff: responsibleStaff.length > 0 ? responsibleStaff : listResponsibleStaff(),
      adminAuthEnabled: data.adminAuthEnabled !== false,
      minimumAppVersion: data.minimumAppVersion,
      cachedAt: new Date().toISOString(),
      source: 'online',
    };
    writeJson(BOOTSTRAP_CACHE_KEY, cache);
    return cache;
  } catch {
    const cached = getCachedBootstrap();
    if (cached) return { ...cached, source: 'cache' };
    return {
      ok: false,
      hubs: listHubs(),
      responsibleStaff: listResponsibleStaff(),
      adminAuthEnabled: true,
      cachedAt: new Date().toISOString(),
      source: 'local',
    };
  }
}

export async function upsertCentralHub(hub: Hub): Promise<CentralAdminSaveResult> {
  if (!isCentralSaveReady()) return { ok: false, message: 'ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้' };
  try {
    const data = await callAppsScript('upsertHub', {
      ...hub,
      deviceId: getDeviceId(),
      actor: 'admin',
    }) as { ok?: boolean; message?: string; hubs?: unknown };
    const hubs = normalizeHubs(data.hubs);
    if (hubs.length > 0) saveHubs(hubs);
    return { ok: data.ok !== false, message: data.message || 'บันทึกลงระบบกลางแล้ว', hubs };
  } catch {
    return { ok: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' };
  }
}

export async function deactivateCentralHub(hubCode: string): Promise<CentralAdminSaveResult> {
  if (!isCentralSaveReady()) return { ok: false, message: 'ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้' };
  try {
    const data = await callAppsScript('deactivateHub', {
      hubCode,
      deviceId: getDeviceId(),
      actor: 'admin',
    }) as { ok?: boolean; message?: string; hubs?: unknown };
    const hubs = normalizeHubs(data.hubs);
    if (hubs.length > 0) saveHubs(hubs);
    return { ok: data.ok !== false, message: data.message || 'บันทึกลงระบบกลางแล้ว', hubs };
  } catch {
    return { ok: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' };
  }
}

export async function upsertCentralResponsibleStaff(staff: ResponsibleStaff): Promise<CentralAdminSaveResult> {
  if (!isCentralSaveReady()) return { ok: false, message: 'ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้' };
  try {
    const data = await callAppsScript('upsertResponsibleStaff', {
      ...staff,
      employeeName: staff.displayName,
      deviceId: getDeviceId(),
      actor: 'admin',
    }) as { ok?: boolean; message?: string; responsibleStaff?: unknown };
    const responsibleStaff = normalizeResponsibleStaff(data.responsibleStaff);
    if (responsibleStaff.length > 0) saveResponsibleStaff(responsibleStaff);
    return { ok: data.ok !== false, message: data.message || 'บันทึกลงระบบกลางแล้ว', responsibleStaff };
  } catch {
    return { ok: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' };
  }
}

export async function deactivateCentralResponsibleStaff(employeeCode: string, hubCode: string): Promise<CentralAdminSaveResult> {
  if (!isCentralSaveReady()) return { ok: false, message: 'ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้' };
  try {
    const data = await callAppsScript('deactivateResponsibleStaff', {
      employeeCode,
      hubCode,
      deviceId: getDeviceId(),
      actor: 'admin',
    }) as { ok?: boolean; message?: string; responsibleStaff?: unknown };
    const responsibleStaff = normalizeResponsibleStaff(data.responsibleStaff);
    if (responsibleStaff.length > 0) saveResponsibleStaff(responsibleStaff);
    return { ok: data.ok !== false, message: data.message || 'บันทึกลงระบบกลางแล้ว', responsibleStaff };
  } catch {
    return { ok: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' };
  }
}

export async function updateCentralSetting(key: 'GPS_REQUIRED' | 'GPS_MANDATORY' | 'WATERMARK_ENABLED' | 'REQUIRE_ADMIN_DEVICE_APPROVAL' | 'MINIMUM_APP_VERSION', value: boolean | string): Promise<CentralAdminSaveResult> {
  if (!isCentralSaveReady()) return { ok: false, message: 'ต้องเชื่อมต่อระบบกลางก่อนจึงจะบันทึกได้' };
  try {
    const data = await callAppsScript('updateSetting', {
      key,
      value,
      deviceId: getDeviceId(),
      actor: 'admin',
    }) as { ok?: boolean; message?: string; appSettings?: Partial<AppSettings> & Record<string, unknown> };
    return { ok: data.ok !== false, message: data.message || 'บันทึกลงระบบกลางแล้ว', appSettings: data.appSettings };
  } catch {
    return { ok: false, message: 'บันทึกไม่สำเร็จ กรุณาลองใหม่' };
  }
}

export async function saveCentralSafeSettings(settings: Pick<AppSettings, 'gpsMandatory' | 'watermarkEnabled'>): Promise<CentralAdminSaveResult> {
  const gps = await updateCentralSetting('GPS_MANDATORY', settings.gpsMandatory);
  if (!gps.ok) return gps;
  const watermark = await updateCentralSetting('WATERMARK_ENABLED', settings.watermarkEnabled);
  if (!watermark.ok) return watermark;
  return { ok: true, message: 'บันทึกลงระบบกลางแล้ว', appSettings: { ...gps.appSettings, ...watermark.appSettings } };
}

export async function requestAdminAccess(deviceName: string, ownerName: string): Promise<{ ok: boolean; message: string; device?: AdminDevice }> {
  if (!CENTRAL_BACKEND_URL) return { ok: false, message: 'ยังไม่ได้ตั้งค่าระบบกลาง กรุณาติดต่อผู้ดูแล' };
  try {
    const data = await callAppsScript('requestAdminAccess', {
      deviceId: getDeviceId(),
      deviceName,
      ownerName,
    }, { allowWithoutSecret: true }) as { ok?: boolean; device?: AdminDevice; message?: string };
    return { ok: data.ok !== false, message: data.message || 'ส่งคำขออนุมัติแล้ว', device: data.device };
  } catch {
    return { ok: false, message: 'ส่งคำขอไม่สำเร็จ กรุณาติดต่อผู้ดูแล' };
  }
}

export async function verifyCentralAdminAccess(pin: string): Promise<{ ok: boolean; message: string; role?: AdminDeviceRole; device?: AdminDevice }> {
  if (!CENTRAL_BACKEND_URL) return { ok: false, message: 'ยังไม่ได้ตั้งค่าระบบกลาง กรุณาติดต่อผู้ดูแล' };
  try {
    const data = await callAppsScript('verifyAdminAccess', {
      deviceId: getDeviceId(),
      adminPin: pin,
    }, { allowWithoutSecret: true }) as { ok?: boolean; message?: string; role?: AdminDeviceRole; device?: AdminDevice; sessionExpiresAt?: string };
    if (data.ok) {
      const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString();
      writeJson(ADMIN_SESSION_KEY, { deviceId: getDeviceId(), role: data.role ?? 'ADMIN', expiresAt: data.sessionExpiresAt || expiresAt });
      return { ok: true, message: data.message || 'อนุมัติหลังบ้านแล้ว', role: data.role, device: data.device };
    }
    return { ok: false, message: data.message || 'PIN ไม่ถูกต้อง', role: data.role, device: data.device };
  } catch {
    if (hasAuthorizedAdminSession() && verifyAdminPin(pin)) {
      return { ok: true, message: 'ออฟไลน์: ใช้ session ผู้ดูแลเดิมบนเครื่องนี้', role: 'ADMIN' };
    }
    return { ok: false, message: 'เชื่อมต่อระบบกลางไม่ได้ กรุณาลองใหม่' };
  }
}

export async function setCentralAdminPin(values: { currentPin?: string; setupToken?: string; newPin: string }): Promise<{ ok: boolean; message: string }> {
  if (!CENTRAL_BACKEND_URL) return { ok: false, message: 'ยังไม่ได้ตั้งค่าระบบกลาง กรุณาติดต่อผู้ดูแล' };
  try {
    const data = await callAppsScript('setAdminPin', values, { allowWithoutSecret: true }) as { ok?: boolean; message?: string };
    return { ok: data.ok === true, message: data.message || (data.ok ? 'บันทึก PIN หลังบ้านแล้ว' : 'บันทึก PIN ไม่สำเร็จ') };
  } catch {
    return { ok: false, message: 'เชื่อมต่อระบบกลางไม่ได้ กรุณาลองใหม่' };
  }
}

export async function setCentralAdminDeviceApprovalRequired(values: { adminPin: string; enabled: boolean }): Promise<{ ok: boolean; message: string }> {
  if (!CENTRAL_BACKEND_URL) return { ok: false, message: 'ยังไม่ได้ตั้งค่าระบบกลาง กรุณาติดต่อผู้ดูแล' };
  try {
    const data = await callAppsScript('setAdminDeviceApprovalRequired', values, { allowWithoutSecret: true }) as { ok?: boolean; message?: string };
    return { ok: data.ok === true, message: data.message || (data.ok ? 'บันทึกการจำกัดเครื่องแอดมินแล้ว' : 'บันทึกไม่สำเร็จ') };
  } catch {
    return { ok: false, message: 'เชื่อมต่อระบบกลางไม่ได้ กรุณาลองใหม่' };
  }
}

export async function initOrRepairCentralStorage(): Promise<{ ok: boolean; message: string }> {
  if (!CENTRAL_BACKEND_URL) return { ok: false, message: 'ยังไม่ได้ตั้งค่าระบบกลาง กรุณาติดต่อผู้ดูแล' };
  try {
    const data = await callAppsScript('initOrRepairStorage', {}, { allowWithoutSecret: true }) as { ok?: boolean; message?: string };
    return { ok: data.ok === true, message: data.message || 'ตรวจสอบและซ่อมโครงสร้างชีทเรียบร้อย' };
  } catch {
    return { ok: false, message: 'เชื่อมต่อระบบกลางไม่ได้ กรุณาลองใหม่' };
  }
}

export async function findCentralRecordByKey(values: {
  date: string;
  hubCode: string;
  responsibleEmployeeCode: string;
  vehicleBarcode: string;
}): Promise<{ ok: boolean; found: boolean; message: string; recordId?: string; status?: ProofStatus; statusText?: string; record?: Record<string, unknown> }> {
  if (!CENTRAL_BACKEND_URL) return { ok: false, found: false, message: 'ยังไม่ได้ตรวจสอบข้อมูลซ้ำจากระบบกลาง' };
  try {
    const data = await callAppsScript('findRecordByKey', values, { allowWithoutSecret: true }) as {
      ok?: boolean;
      found?: boolean;
      message?: string;
      recordId?: string;
      status?: ProofStatus;
      statusText?: string;
      record?: Record<string, unknown>;
    };
    return {
      ok: data.ok !== false,
      found: data.found === true,
      message: data.message || (data.found ? 'พบงานเดิม' : 'ไม่พบงานเดิม'),
      recordId: data.recordId,
      status: data.status,
      statusText: data.statusText,
      record: data.record,
    };
  } catch {
    return { ok: false, found: false, message: 'ยังไม่ได้ตรวจสอบข้อมูลซ้ำจากระบบกลาง' };
  }
}

export async function listAdminDevices(pin: string): Promise<AdminDevice[]> {
  const data = await callAppsScript('listAdminDevices', { deviceId: getDeviceId(), pin }, { allowWithoutSecret: true }) as { devices?: AdminDevice[] };
  return data.devices ?? [];
}

export async function approveAdminDevice(targetDeviceId: string, role: AdminDeviceRole, pin: string): Promise<unknown> {
  return callAppsScript('approveAdminDevice', { deviceId: getDeviceId(), targetDeviceId, role, pin }, { allowWithoutSecret: true });
}

export async function revokeAdminDevice(targetDeviceId: string, pin: string): Promise<unknown> {
  return callAppsScript('revokeAdminDevice', { deviceId: getDeviceId(), targetDeviceId, pin }, { allowWithoutSecret: true });
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
      message: 'บันทึกแล้ว ระบบจะซิงก์ให้อัตโนมัติเมื่อออนไลน์',
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
    statusText(record.status),
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

function statusText(status: ProofStatus): string {
  if (status === 'DRAFT') return 'เริ่มทำแต่ยังไม่ส่ง';
  if (status === 'COMPLETE') return 'ส่งครบแล้ว';
  if (status === 'NEED_REVIEW') return 'ส่งแล้วแต่รูปไม่ครบ';
  if (status === 'VOIDED') return 'ยกเลิก';
  return 'กำลังถ่ายรูป';
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
    : 'ไม่พบตำแหน่ง';
  return [
    `วันที่: ${formatDatePart(capturedAt)}`,
    `เวลา: ${formatTimePart(capturedAt)}`,
    `พิกัด: ${gps}`,
    `บาร์โค้ดรถ: ${record.vehicleBarcode}`,
    `ฮับ: ${record.hubCode}-${record.hubName}`,
    `ผู้รับผิดชอบ: ${responsibleText(record)}`,
    `ประเภทรูป: ${labelThai}`,
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
        const fontSize = Math.max(20, Math.round(canvas.width / 46));
        const lineHeight = Math.round(fontSize * 1.28);
        const padding = Math.max(18, Math.round(canvas.width / 58));
        const boxWidth = Math.min(canvas.width - padding * 2, Math.max(canvas.width * 0.52, 560));
        context.font = `700 ${fontSize}px "Segoe UI", sans-serif`;
        const wrappedLines = watermarkText.split('\n').flatMap((line) => wrapCanvasText(context, line, boxWidth));
        const maxLines = Math.max(5, Math.floor((canvas.height * 0.38 - padding * 2) / lineHeight));
        const lines = wrappedLines.length > maxLines ? [...wrappedLines.slice(0, maxLines - 1), `${wrappedLines[maxLines - 1].slice(0, 80)}...`] : wrappedLines;
        const x = padding;
        const y = canvas.height - padding - (lines.length * lineHeight);
        context.textBaseline = 'top';
        context.lineJoin = 'round';
        context.shadowColor = 'rgba(0, 0, 0, 0.85)';
        context.shadowBlur = Math.max(3, Math.round(fontSize / 5));
        context.shadowOffsetX = 1;
        context.shadowOffsetY = 2;
        lines.forEach((line, index) => {
          const lineY = y + lineHeight * index;
          context.strokeStyle = 'rgba(0, 0, 0, 0.72)';
          context.lineWidth = Math.max(3, Math.round(fontSize / 8));
          context.strokeText(line, x, lineY);
          context.fillStyle = index < 2 ? '#ffe044' : '#ffffff';
          context.fillText(line, x, lineY);
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
  if (CENTRAL_BACKEND_URL && settings.googleSyncMode === 'google_sheets') return true;
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

function normalizeHubs(raw: unknown): Hub[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => item as Partial<Hub> & Record<string, unknown>).filter((item) => item.hubCode || item.HubCode).map((item) => ({
    hubCode: String(item.hubCode ?? item.HubCode ?? ''),
    hubName: String(item.hubName ?? item.HubName ?? ''),
    active: item.active === undefined ? true : item.active === true || String(item.active).toLowerCase() === 'true',
  })).filter((hub) => hub.hubCode);
}

function normalizeResponsibleStaff(raw: unknown): ResponsibleStaff[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => item as Partial<ResponsibleStaff> & Record<string, unknown>).filter((item) => item.employeeCode || item.EmployeeCode).map((item) => ({
    employeeCode: String(item.employeeCode ?? item.EmployeeCode ?? ''),
    displayName: String(item.displayName ?? item.employeeName ?? item.DisplayName ?? item.EmployeeName ?? ''),
    hubCode: String(item.hubCode ?? item.HubCode ?? ''),
    active: item.active === undefined ? true : item.active === true || String(item.active).toLowerCase() === 'true',
  })).filter((staff) => staff.employeeCode && staff.hubCode);
}

type AppsScriptAction = 'bootstrap' | 'getBootstrapData' | 'health' | 'healthCheck' | 'initOrRepairStorage' | 'getSettings' | 'getAppSettings' | 'updateSetting' | 'getHubs' | 'upsertHub' | 'deactivateHub' | 'getResponsibleStaff' | 'upsertResponsibleStaff' | 'deactivateResponsibleStaff' | 'getRecords' | 'findRecordByKey' | 'upsertRecordByKey' | 'saveRecord' | 'savePhotoMetadata' | 'syncBatch' | 'getMyWork' | 'requestAdminAccess' | 'verifyAdminAccess' | 'setAdminPin' | 'setAdminDeviceApprovalRequired' | 'listAdminDevices' | 'approveAdminDevice' | 'revokeAdminDevice' | 'getAdminAuthStatus' | GoogleSyncAction;

async function callAppsScript(action: AppsScriptAction, payload: unknown, options: { allowWithoutSecret?: boolean } = {}): Promise<unknown> {
  const settings = getSettings();
  const url = CENTRAL_BACKEND_URL || settings.googleAppsScriptUrl.trim();
  if (!url || (!options.allowWithoutSecret && !isGoogleSyncConfigured(settings))) {
    throw new Error('ยังไม่ได้ตั้งค่า Google Apps Script URL หรือ shared secret');
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify({
      action,
      token: settings.googleSharedSecret || undefined,
      payload,
      client: 'hubchecklist-reset006-007-plus',
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
