export type ProofStatus =
  | 'DRAFT'
  | 'IN_PROGRESS'
  | 'NEED_REVIEW'
  | 'COMPLETE'
  | 'PENDING_SYNC'
  | 'SYNCING'
  | 'SYNCED'
  | 'SYNC_FAILED'
  | 'VOIDED';

export type DropType = 'NO_DROP' | 'DROP';
export type SlotType = 'REAR' | 'DROP_FRONT' | 'MAIN_REAR' | 'TRAILER_REAR' | 'TRAILER_REAR_EXTRA';
export type GpsStatus = 'granted' | 'denied' | 'unavailable' | 'unknown';

export interface Hub {
  hubCode: string;
  hubName: string;
  active: boolean;
  note?: string;
  updatedAt?: string;
}

export interface ResponsibleStaff {
  employeeCode: string;
  employeeName: string;
  hubCode: string;
  active: boolean;
  note?: string;
  updatedAt?: string;
}

export interface ActiveContext {
  hubCode: string;
  employeeCode: string;
}

export interface PhotoSlot {
  slotId: string;
  slotType: SlotType;
  label: string;
  required: boolean;
  captured: boolean;
  fileName?: string;
  imageLocalData?: string;
  driveUrl?: string;
  driveFileId?: string;
  imagePreviewUrl?: string;
  imageFormula?: string;
  capturedAt?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  addressText?: string;
  watermarkText?: string;
  gpsStatus: GpsStatus;
}

export interface ProofRecord {
  recordId: string;
  duplicateKey: string;
  date: string;
  hubCode: string;
  hubName: string;
  responsibleEmployeeCode: string;
  responsibleName: string;
  vehicleBarcode: string;
  dropType: DropType;
  dropCount: number;
  status: ProofStatus;
  photoSlots: PhotoSlot[];
  missingPhotoLabels: string[];
  submittedAt?: string;
  syncedAt?: string;
  createdAt: string;
  updatedAt: string;
  duplicateOfRecordId?: string;
  duplicateReason?: string;
  note?: string;
}

export interface AppSettings {
  GPS_REQUIRED: string;
  GPS_MANDATORY: string;
  WATERMARK_ENABLED: string;
  REQUIRE_ADMIN_DEVICE_APPROVAL: string;
  MINIMUM_APP_VERSION: string;
  ADMIN_PIN_ENABLED?: string;
  ADMIN_PIN_SET?: string;
}

export interface BootstrapData {
  ok: boolean;
  source: 'central' | 'cache' | 'local';
  message: string;
  serverTime?: string;
  apiVersion?: string;
  hubs: Hub[];
  responsibleStaff: ResponsibleStaff[];
  settings: AppSettings;
  pulledAt: string;
}

export interface CentralPullResult {
  ok: boolean;
  message: string;
  recordsPulled: number;
  bootstrap: BootstrapData;
}

export interface ApiResult<T = unknown> {
  ok: boolean;
  message: string;
  data?: T;
}

export interface SyncReport {
  attempted: number;
  synced: number;
  failed: number;
  message: string;
}

const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
const API_URL = (
  (import.meta.env.VITE_API_BASE_URL as string | undefined)
  || (import.meta.env.VITE_APPS_SCRIPT_WEB_APP_URL as string | undefined)
  || '/api/hub-proof'
).trim();
const APP_VERSION = 'RESET-013';

const KEYS = {
  hubs: 'reset013.hubs',
  staff: 'reset013.responsibleStaff',
  records: 'reset013.records',
  activeContext: 'reset013.activeContext',
  bootstrap: 'reset013.bootstrap',
  pending: 'reset013.pendingRecords',
  deviceId: 'reset013.deviceId',
  showSubmitted: 'reset013.showSubmitted',
};

export const FALLBACK_HUB: Hub = {
  hubCode: '26NAK_BHUB',
  hubName: 'นครราชสีมา',
  active: true,
};

export const FALLBACK_STAFF: ResponsibleStaff = {
  employeeCode: '25845',
  employeeName: 'Tui',
  hubCode: FALLBACK_HUB.hubCode,
  active: true,
};

const DEFAULT_SETTINGS: AppSettings = {
  GPS_REQUIRED: 'false',
  GPS_MANDATORY: 'false',
  WATERMARK_ENABLED: 'true',
  REQUIRE_ADMIN_DEVICE_APPROVAL: 'false',
  MINIMUM_APP_VERSION: '0.1.0',
  ADMIN_PIN_ENABLED: 'true',
  ADMIN_PIN_SET: 'false',
};

export function isCentralConfigured(): boolean {
  return API_URL.length > 0;
}

export function getCentralUrlStatus(): 'configured' | 'missing' {
  return isCentralConfigured() ? 'configured' : 'missing';
}

export function getDeviceId(): string {
  const saved = localStorage.getItem(KEYS.deviceId);
  if (saved) return saved;
  const next = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  localStorage.setItem(KEYS.deviceId, next);
  return next;
}

export async function bootstrapCentralData(): Promise<BootstrapData> {
  seedFallbackData();
  try {
    const response = await callCentral<{
      hubs?: unknown;
      responsibleStaff?: unknown;
      settings?: unknown;
      serverTime?: string;
      apiVersion?: string;
      version?: string;
    }>('getBootstrapData', { deviceId: getDeviceId(), appVersion: APP_VERSION }, true);
    const data = response.data ?? {};
    const hubs = normalizeHubs(data.hubs);
    const responsibleStaff = normalizeResponsibleStaff(data.responsibleStaff);
    const settings = normalizeSettings(data.settings);
    if (hubs.length) saveHubs(hubs);
    if (responsibleStaff.length) saveResponsibleStaff(responsibleStaff);
    const bootstrap: BootstrapData = {
      ok: true,
      source: 'central',
      message: response.message || 'ดึงข้อมูลล่าสุดแล้ว',
      serverTime: data.serverTime,
      apiVersion: data.apiVersion || data.version,
      hubs: hubs.length ? hubs : listHubs(),
      responsibleStaff: responsibleStaff.length ? responsibleStaff : listResponsibleStaff(),
      settings,
      pulledAt: new Date().toISOString(),
    };
    writeJson(KEYS.bootstrap, bootstrap);
    return bootstrap;
  } catch (error) {
    const cached = readJson<BootstrapData | null>(KEYS.bootstrap, null);
    if (cached) return { ...cached, ok: false, source: 'cache', message: errorMessage(error) };
    return localBootstrap(errorMessage(error));
  }
}

export async function pullCentralData(): Promise<CentralPullResult> {
  const bootstrap = await bootstrapCentralData();
  try {
    const response = await callCentral<{ records?: unknown }>('getRecords', {}, true);
    const centralRecords = normalizeRecords(response.data?.records);
    saveRecords(mergeRecords(listRecords(), centralRecords));
    return {
      ok: true,
      message: response.message || 'ดึงข้อมูลล่าสุดแล้ว',
      recordsPulled: centralRecords.length,
      bootstrap,
    };
  } catch (error) {
    return { ok: false, message: errorMessage(error), recordsPulled: 0, bootstrap };
  }
}

export function listHubs(): Hub[] {
  seedFallbackData();
  return readJson<Hub[]>(KEYS.hubs, []).filter((hub) => hub.active);
}

export function saveHubs(hubs: Hub[]): void {
  writeJson(KEYS.hubs, dedupeBy(hubs.map(normalizeHub), (hub) => hub.hubCode.toUpperCase()));
}

export function listResponsibleStaff(): ResponsibleStaff[] {
  seedFallbackData();
  return readJson<ResponsibleStaff[]>(KEYS.staff, []).filter((staff) => staff.active);
}

export function saveResponsibleStaff(staff: ResponsibleStaff[]): void {
  writeJson(KEYS.staff, dedupeBy(staff.map(normalizeStaff), (item) => `${item.employeeCode}|${item.hubCode}`.toUpperCase()));
}

export function getActiveContext(): ActiveContext | null {
  return readJson<ActiveContext | null>(KEYS.activeContext, null);
}

export function saveActiveContext(context: ActiveContext): void {
  writeJson(KEYS.activeContext, context);
}

export function listRecords(): ProofRecord[] {
  return mergeRecords(readJson<ProofRecord[]>(KEYS.records, []), []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function saveRecords(records: ProofRecord[]): void {
  writeJson(KEYS.records, mergeRecords(records, []));
}

export function getRecord(recordId: string): ProofRecord | null {
  return listRecords().find((record) => record.recordId === recordId) ?? null;
}

export function getRecordByDuplicateKey(duplicateKey: string): ProofRecord | null {
  return listRecords().find((record) => record.duplicateKey === duplicateKey) ?? null;
}

export function upsertLocalRecord(record: ProofRecord): ProofRecord {
  const normalized = normalizeRecord(record);
  const records = listRecords().filter((item) => item.recordId !== normalized.recordId && item.duplicateKey !== normalized.duplicateKey);
  records.push(normalized);
  saveRecords(records);
  return normalized;
}

export async function findExistingWork(values: {
  date?: string;
  hubCode: string;
  responsibleEmployeeCode: string;
  vehicleBarcode: string;
}): Promise<ProofRecord | null> {
  const duplicateKey = buildDuplicateKey(values.date ?? todayBangkok(), values.hubCode, values.responsibleEmployeeCode, values.vehicleBarcode);
  const local = getRecordByDuplicateKey(duplicateKey);
  if (local && ['SYNCED', 'COMPLETE', 'NEED_REVIEW', 'PENDING_SYNC', 'SYNC_FAILED', 'IN_PROGRESS', 'DRAFT'].includes(local.status)) return local;
  try {
    const response = await callCentral<{ found?: boolean; record?: unknown }>('findRecordByKey', {
      date: values.date ?? todayBangkok(),
      hubCode: values.hubCode,
      responsibleEmployeeCode: values.responsibleEmployeeCode,
      vehicleBarcode: normalizeVehicleBarcode(values.vehicleBarcode),
    }, true);
    const record = response.data?.record ? normalizeRecordFromAny(response.data.record) : null;
    if (record) {
      upsertLocalRecord(record);
      return record;
    }
  } catch {
    return local ?? null;
  }
  return local ?? null;
}

export function createDraftRecord(values: {
  hub: Hub;
  responsible: ResponsibleStaff;
  vehicleBarcode: string;
  dropType: DropType;
  dropCount?: number;
}): ProofRecord {
  const now = new Date().toISOString();
  const barcode = normalizeVehicleBarcode(values.vehicleBarcode);
  const dropCount = values.dropType === 'DROP' ? Math.max(2, values.dropCount ?? 2) : 0;
  const date = todayBangkok();
  const duplicateKey = buildDuplicateKey(date, values.hub.hubCode, values.responsible.employeeCode, barcode);
  const existing = getRecordByDuplicateKey(duplicateKey);
  if (existing && !['COMPLETE', 'SYNCED', 'VOIDED'].includes(existing.status)) return existing;
  const record: ProofRecord = {
    recordId: crypto.randomUUID?.() ?? `${Date.now()}`,
    duplicateKey,
    date,
    hubCode: values.hub.hubCode,
    hubName: values.hub.hubName,
    responsibleEmployeeCode: values.responsible.employeeCode,
    responsibleName: values.responsible.employeeName,
    vehicleBarcode: barcode,
    dropType: values.dropType,
    dropCount,
    status: 'DRAFT',
    photoSlots: createPhotoSlots(values.dropType, dropCount),
    missingPhotoLabels: [],
    createdAt: now,
    updatedAt: now,
  };
  return upsertLocalRecord(record);
}

export function changeDropType(record: ProofRecord, dropType: DropType, dropCount?: number): ProofRecord {
  const nextDropCount = dropType === 'DROP' ? Math.max(2, dropCount ?? (record.dropCount || 2)) : 0;
  return upsertLocalRecord({
    ...record,
    dropType,
    dropCount: nextDropCount,
    photoSlots: carryExistingPhotos(record.photoSlots, createPhotoSlots(dropType, nextDropCount)),
    status: record.status === 'DRAFT' ? 'IN_PROGRESS' : record.status,
    updatedAt: new Date().toISOString(),
  });
}

export async function capturePhoto(record: ProofRecord, slotId: string, file: File): Promise<ProofRecord> {
  const capturedAt = new Date().toISOString();
  const location = await requestLocation();
  const slot = record.photoSlots.find((item) => item.slotId === slotId);
  if (!slot) return record;
  const watermarkText = buildWatermarkText(record, slot.label, capturedAt, location);
  const imageLocalData = await renderWatermarkedImage(file, watermarkText);
  const nextSlots = record.photoSlots.map((item) => item.slotId === slotId ? {
    ...item,
    captured: true,
    imageLocalData,
    fileName: `${record.date}_${record.vehicleBarcode}_${item.slotId}.jpg`,
    capturedAt,
    latitude: location.latitude,
    longitude: location.longitude,
    accuracy: location.accuracy,
    addressText: location.addressText,
    watermarkText,
    gpsStatus: location.status,
  } : item);
  return upsertLocalRecord({
    ...record,
    photoSlots: nextSlots,
    status: 'IN_PROGRESS',
    updatedAt: capturedAt,
  });
}

export async function submitRecord(record: ProofRecord, allowMissing: boolean): Promise<{ record: ProofRecord; message: string }> {
  const missing = getMissingPhotoSlots(record);
  if (missing.length && !allowMissing) return { record, message: 'ยังมีรูปที่ต้องถ่าย กรุณาตรวจสอบก่อนส่ง' };
  const now = new Date().toISOString();
  const localStatus: ProofStatus = missing.length ? 'NEED_REVIEW' : 'COMPLETE';
  const prepared = upsertLocalRecord({
    ...record,
    status: 'SYNCING',
    missingPhotoLabels: missing.map((slot) => slot.label),
    submittedAt: now,
    updatedAt: now,
  });
  return syncOneRecord({ ...prepared, status: localStatus, updatedAt: now });
}

export async function syncOneRecord(record: ProofRecord): Promise<{ record: ProofRecord; message: string }> {
  try {
    const response = await callCentral<{ record?: unknown }>('syncRecord', {
      record: toCentralRecord(record),
      photoMetadata: record.photoSlots.filter((slot) => slot.captured).map((slot) => toCentralPhoto(record, slot)),
    });
    const centralRecord = response.data?.record ? normalizeRecordFromAny(response.data.record) : null;
    const finalStatus: ProofStatus = record.status === 'NEED_REVIEW' ? 'NEED_REVIEW' : 'SYNCED';
    const synced = upsertLocalRecord({
      ...record,
      ...(centralRecord ?? {}),
      status: finalStatus,
      syncedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    removePending(record.recordId);
    await pullCentralData();
    return { record: synced, message: response.message || 'ส่งข้อมูลแล้ว' };
  } catch (error) {
    const failed = upsertLocalRecord({ ...record, status: 'SYNC_FAILED', updatedAt: new Date().toISOString() });
    queuePending(failed);
    return { record: failed, message: errorMessage(error) || 'ซิงก์ไม่สำเร็จ' };
  }
}

export async function retryPendingSync(): Promise<SyncReport> {
  const pending = getPendingRecords();
  let synced = 0;
  let failed = 0;
  for (const record of pending) {
    const result = await syncOneRecord(record);
    if (result.record.status === 'SYNCED' || result.record.status === 'NEED_REVIEW') synced += 1;
    else failed += 1;
  }
  return { attempted: pending.length, synced, failed, message: failed ? 'ยังมีงานซิงก์ไม่สำเร็จ' : 'ซิงก์งานค้างเรียบร้อย' };
}

export function getPendingRecords(): ProofRecord[] {
  return mergeRecords(readJson<ProofRecord[]>(KEYS.pending, []), []);
}

export function getPendingSyncCount(): number {
  return getPendingRecords().length;
}

export function getPendingPhotoCount(): number {
  return getPendingRecords().reduce((sum, record) => sum + record.photoSlots.filter((slot) => slot.captured && !slot.driveUrl).length, 0);
}

export function canClearLocalCache(): { ok: boolean; message: string } {
  if (getPendingSyncCount() > 0) return { ok: false, message: 'ยังมีงานรอซิงก์อยู่ ไม่สามารถล้างแคชได้' };
  return { ok: true, message: 'ล้างแคชได้' };
}

export async function clearSafeLocalCache(): Promise<{ ok: boolean; message: string }> {
  const allowed = canClearLocalCache();
  if (!allowed.ok) return allowed;
  localStorage.removeItem(KEYS.bootstrap);
  localStorage.removeItem(KEYS.activeContext);
  localStorage.removeItem(KEYS.showSubmitted);
  if (isCentralConfigured()) await pullCentralData();
  return { ok: true, message: 'ล้างแคชเครื่องนี้แล้ว' };
}

export async function testCentralHealth(): Promise<ApiResult<{ serverTime?: string; apiVersion?: string }>> {
  return callCentral('health', { deviceId: getDeviceId() }, true);
}

export async function verifyAdminPin(pin: string): Promise<ApiResult> {
  return callCentral('verifyAdminAccess', { pin, deviceId: getDeviceId() }, true);
}

export async function setCentralAdminPin(pin: string, currentPin?: string): Promise<ApiResult> {
  return callCentral('setAdminPin', { pin, currentPin, deviceId: getDeviceId() });
}

export async function getAdminAuthStatus(): Promise<ApiResult<{ adminPinSet?: boolean; adminPinEnabled?: boolean }>> {
  return callCentral('getAdminAuthStatus', { deviceId: getDeviceId() }, true);
}

export async function upsertHubCentral(hub: Hub): Promise<ApiResult<{ hubs: Hub[] }>> {
  const response = await callCentral<{ hubs?: unknown }>('upsertHub', { ...hub, actor: getDeviceId() });
  const hubs = normalizeHubs(response.data?.hubs);
  if (hubs.length) saveHubs(hubs);
  return { ok: response.ok, message: response.message, data: { hubs } };
}

export async function deactivateHubCentral(hubCode: string): Promise<ApiResult<{ hubs: Hub[] }>> {
  const response = await callCentral<{ hubs?: unknown }>('deactivateHub', { hubCode, actor: getDeviceId() });
  const hubs = normalizeHubs(response.data?.hubs);
  if (hubs.length) saveHubs(hubs);
  return { ok: response.ok, message: response.message, data: { hubs } };
}

export async function upsertResponsibleCentral(staff: ResponsibleStaff): Promise<ApiResult<{ responsibleStaff: ResponsibleStaff[] }>> {
  const response = await callCentral<{ responsibleStaff?: unknown }>('upsertResponsibleStaff', { ...staff, actor: getDeviceId() });
  const responsibleStaff = normalizeResponsibleStaff(response.data?.responsibleStaff);
  if (responsibleStaff.length) saveResponsibleStaff(responsibleStaff);
  return { ok: response.ok, message: response.message, data: { responsibleStaff } };
}

export async function deactivateResponsibleCentral(employeeCode: string, hubCode: string): Promise<ApiResult<{ responsibleStaff: ResponsibleStaff[] }>> {
  const response = await callCentral<{ responsibleStaff?: unknown }>('deactivateResponsibleStaff', { employeeCode, hubCode, actor: getDeviceId() });
  const responsibleStaff = normalizeResponsibleStaff(response.data?.responsibleStaff);
  if (responsibleStaff.length) saveResponsibleStaff(responsibleStaff);
  return { ok: response.ok, message: response.message, data: { responsibleStaff } };
}

export async function updateSettingsCentral(settings: Partial<AppSettings>): Promise<ApiResult<{ settings: AppSettings }>> {
  const allowed = ['GPS_REQUIRED', 'GPS_MANDATORY', 'WATERMARK_ENABLED', 'REQUIRE_ADMIN_DEVICE_APPROVAL', 'MINIMUM_APP_VERSION'] as const;
  const payload = allowed.filter((key) => settings[key] !== undefined).map((key) => ({ key, value: settings[key] }));
  const response = await callCentral<{ settings?: unknown }>('updateSettingsBatch', { settings: payload, actor: getDeviceId() });
  return { ok: response.ok, message: response.message, data: { settings: normalizeSettings(response.data?.settings) } };
}

export async function getHistory(filters: {
  dateFrom?: string;
  dateTo?: string;
  hubCode?: string;
  responsibleEmployeeCode?: string;
  vehicleBarcode?: string;
  status?: string;
}): Promise<ProofRecord[]> {
  const response = await callCentral<{ records?: unknown }>('getHistory', filters, true);
  return normalizeRecords(response.data?.records);
}

export function todayBangkok(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: BANGKOK_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  return `${part(parts, 'year')}-${part(parts, 'month')}-${part(parts, 'day')}`;
}

export function formatBangkok(iso?: string): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: BANGKOK_TIME_ZONE }).format(date);
  const time = new Intl.DateTimeFormat('th-TH', { timeZone: BANGKOK_TIME_ZONE, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date);
  return `${day} ${time}`;
}

export function normalizeVehicleBarcode(input: string): string {
  const fromUrl = input.match(/\/proof\/go\/([A-Za-z0-9-]+)/)?.[1] ?? input;
  return fromUrl.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function buildDuplicateKey(date: string, hubCode: string, employeeCode: string, vehicleBarcode: string): string {
  return [date, hubCode, employeeCode, normalizeVehicleBarcode(vehicleBarcode)].map((value) => value.trim().toUpperCase()).join('|');
}

export function getMissingPhotoSlots(record: ProofRecord): PhotoSlot[] {
  return record.photoSlots.filter((slot) => slot.required && !slot.captured);
}

export function isActiveWork(record: ProofRecord): boolean {
  return ['SYNC_FAILED', 'PENDING_SYNC', 'NEED_REVIEW', 'IN_PROGRESS', 'DRAFT', 'SYNCING'].includes(record.status);
}

export function statusText(status: ProofStatus): string {
  const labels: Record<ProofStatus, string> = {
    DRAFT: 'เริ่มทำ',
    IN_PROGRESS: 'กำลังถ่ายรูป',
    NEED_REVIEW: 'ส่งแล้วแต่รูปไม่ครบ',
    COMPLETE: 'ส่งครบแล้ว',
    PENDING_SYNC: 'รอซิงก์',
    SYNCING: 'กำลังซิงก์',
    SYNCED: 'ซิงก์แล้ว',
    SYNC_FAILED: 'ซิงก์ไม่สำเร็จ',
    VOIDED: 'ยกเลิก',
  };
  return labels[status];
}

export function statusRank(record: ProofRecord): number {
  const ranks: Record<ProofStatus, number> = { SYNCED: 90, COMPLETE: 80, NEED_REVIEW: 70, SYNC_FAILED: 60, PENDING_SYNC: 50, SYNCING: 45, IN_PROGRESS: 40, DRAFT: 30, VOIDED: 10 };
  return ranks[record.status] ?? 0;
}

function localBootstrap(message: string): BootstrapData {
  return { ok: false, source: 'local', message, hubs: listHubs(), responsibleStaff: listResponsibleStaff(), settings: DEFAULT_SETTINGS, pulledAt: new Date().toISOString() };
}

function seedFallbackData(): void {
  if (readJson<Hub[]>(KEYS.hubs, []).length === 0) writeJson(KEYS.hubs, [FALLBACK_HUB]);
  if (readJson<ResponsibleStaff[]>(KEYS.staff, []).length === 0) writeJson(KEYS.staff, [FALLBACK_STAFF]);
}

function createPhotoSlots(dropType: DropType, dropCount: number): PhotoSlot[] {
  if (dropType === 'NO_DROP') return [makeSlot('rear', 'REAR', 'รูปหลังรถ'), makeSlot('dropFront', 'DROP_FRONT', 'รูปหน้าดรอป')];
  const slots: PhotoSlot[] = [makeSlot('mainRear', 'MAIN_REAR', 'รูปหลังรถหลัก')];
  for (let index = 1; index <= Math.max(2, dropCount); index += 1) {
    slots.push(makeSlot(index <= 2 ? `trailerRear${index}` : `trailerRearExtra${index}`, index <= 2 ? 'TRAILER_REAR' : 'TRAILER_REAR_EXTRA', `รูปหลังรถพ่วง ${index}`));
  }
  return slots;
}

function makeSlot(slotId: string, slotType: SlotType, label: string): PhotoSlot {
  return { slotId, slotType, label, required: true, captured: false, gpsStatus: 'unknown' };
}

function carryExistingPhotos(existing: PhotoSlot[], next: PhotoSlot[]): PhotoSlot[] {
  return next.map((slot) => existing.find((item) => item.slotId === slot.slotId || (item.slotType === slot.slotType && item.label === slot.label)) ?? slot);
}

function mergeRecords(localRecords: ProofRecord[], centralRecords: ProofRecord[]): ProofRecord[] {
  const groups = new Map<string, ProofRecord[]>();
  [...localRecords, ...centralRecords].map(normalizeRecord).forEach((record) => groups.set(record.duplicateKey, [...(groups.get(record.duplicateKey) ?? []), record]));
  return Array.from(groups.values()).map((records) => records.sort((a, b) => {
    const rank = statusRank(b) - statusRank(a);
    if (rank !== 0) return rank;
    const photos = b.photoSlots.filter((slot) => slot.captured).length - a.photoSlots.filter((slot) => slot.captured).length;
    if (photos !== 0) return photos;
    return b.updatedAt.localeCompare(a.updatedAt);
  })[0]);
}

function normalizeRecord(record: ProofRecord): ProofRecord {
  const date = record.date || todayBangkok();
  const barcode = normalizeVehicleBarcode(record.vehicleBarcode);
  return { ...record, date, vehicleBarcode: barcode, duplicateKey: record.duplicateKey || buildDuplicateKey(date, record.hubCode, record.responsibleEmployeeCode, barcode), photoSlots: record.photoSlots ?? [], missingPhotoLabels: record.missingPhotoLabels ?? [] };
}

function normalizeRecordFromAny(raw: unknown): ProofRecord | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const date = text(row.date ?? row['วันที่']);
  const hubCode = text(row.hubCode ?? splitCode(row['ฮับ']));
  const responsibleEmployeeCode = text(row.responsibleEmployeeCode ?? splitCode(row['ผู้รับผิดชอบ']));
  const vehicleBarcode = normalizeVehicleBarcode(text(row.vehicleBarcode ?? row['บาร์โค้ดรถ']));
  if (!date || !hubCode || !responsibleEmployeeCode || !vehicleBarcode) return null;
  const status = normalizeStatus(text(row.statusInternal ?? row.status ?? row['สถานะ']));
  const duplicateKey = text(row.duplicateKey) || buildDuplicateKey(date, hubCode, responsibleEmployeeCode, vehicleBarcode);
  const photoSlots = Array.isArray(row.photoSlots) ? (row.photoSlots as unknown[]).map(normalizeSlotFromAny).filter((slot): slot is PhotoSlot => Boolean(slot)) : createPhotoSlots(text(row.dropType ?? row['พ่วงดรอปหรือไม่']).includes('พ่วง') ? 'DROP' : 'NO_DROP', Number(row.dropCount ?? row['จำนวนดรอป'] ?? 0) || 0);
  return {
    recordId: text(row.recordId ?? row.id) || duplicateKey,
    duplicateKey,
    date,
    hubCode,
    hubName: text(row.hubName ?? splitName(row['ฮับ'])),
    responsibleEmployeeCode,
    responsibleName: text(row.responsibleName ?? splitName(row['ผู้รับผิดชอบ'])),
    vehicleBarcode,
    dropType: text(row.dropType ?? row['พ่วงดรอปหรือไม่']).includes('พ่วง') ? 'DROP' : 'NO_DROP',
    dropCount: Number(row.dropCount ?? row['จำนวนดรอป'] ?? 0) || 0,
    status,
    photoSlots,
    missingPhotoLabels: Array.isArray(row.missingPhotoLabels) ? row.missingPhotoLabels.map(text).filter(Boolean) : text(row['รายการรูปที่ขาด']).split(',').map((item) => item.trim()).filter(Boolean),
    submittedAt: parseCentralTime(row.submittedAt ?? row['เวลาส่งข้อมูล']),
    syncedAt: parseCentralTime(row.syncedAt),
    createdAt: parseCentralTime(row.createdAt) || new Date().toISOString(),
    updatedAt: parseCentralTime(row.updatedAt) || parseCentralTime(row.syncedAt) || new Date().toISOString(),
    duplicateOfRecordId: text(row.duplicateOfRecordId) || undefined,
    duplicateReason: text(row.duplicateReason) || undefined,
    note: text(row.note ?? row['หมายเหตุ']) || undefined,
  };
}

function normalizeRecords(raw: unknown): ProofRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeRecordFromAny).filter((record): record is ProofRecord => Boolean(record));
}

function normalizeSlotFromAny(raw: unknown): PhotoSlot | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as Record<string, unknown>;
  const slotId = text(row.slotId ?? row.photoSlot);
  const slotType = normalizeSlotType(text(row.slotType));
  const label = text(row.label ?? row.labelThai ?? row.photoType ?? row['ประเภทรูป']);
  if (!slotId || !label) return null;
  return {
    slotId,
    slotType,
    label,
    required: true,
    captured: Boolean(text(row.driveUrl ?? row.imagePreviewUrl ?? row.imageLocalData ?? row.fileName)),
    fileName: text(row.fileName) || undefined,
    driveFileId: text(row.driveFileId) || undefined,
    driveUrl: text(row.driveUrl) || undefined,
    imagePreviewUrl: text(row.imagePreviewUrl) || undefined,
    imageFormula: text(row.imageFormula) || undefined,
    capturedAt: parseCentralTime(row.capturedAt),
    latitude: numberOrUndefined(row.latitude ?? row.gpsLat),
    longitude: numberOrUndefined(row.longitude ?? row.gpsLng),
    accuracy: numberOrUndefined(row.accuracy ?? row.gpsAccuracy),
    addressText: text(row.addressText) || undefined,
    watermarkText: text(row.watermarkText) || undefined,
    gpsStatus: normalizeGpsStatus(text(row.gpsStatus)),
  };
}

function toCentralRecord(record: ProofRecord): Record<string, unknown> {
  return {
    recordId: record.recordId,
    duplicateKey: record.duplicateKey,
    date: record.date,
    hubCode: record.hubCode,
    hubName: record.hubName,
    responsibleEmployeeCode: record.responsibleEmployeeCode,
    responsibleName: record.responsibleName,
    vehicleBarcode: record.vehicleBarcode,
    dropType: record.dropType,
    dropCount: record.dropCount,
    statusInternal: record.status,
    photoRequiredCount: record.photoSlots.filter((slot) => slot.required).length,
    photoDoneCount: record.photoSlots.filter((slot) => slot.captured).length,
    missingPhotoLabels: record.missingPhotoLabels,
    submittedAt: record.submittedAt,
    syncedAt: record.syncedAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    note: record.note ?? '',
  };
}

function toCentralPhoto(record: ProofRecord, slot: PhotoSlot): Record<string, unknown> {
  return {
    photoId: `${record.recordId}_${slot.slotId}`,
    recordId: record.recordId,
    duplicateKey: record.duplicateKey,
    date: record.date,
    hubCode: record.hubCode,
    responsibleEmployeeCode: record.responsibleEmployeeCode,
    vehicleBarcode: record.vehicleBarcode,
    slotId: slot.slotId,
    slotType: slot.slotType,
    labelThai: slot.label,
    fileName: slot.fileName ?? '',
    driveFileId: slot.driveFileId ?? '',
    driveUrl: slot.driveUrl ?? '',
    imagePreviewUrl: slot.imagePreviewUrl ?? '',
    imageFormula: slot.imageFormula ?? '',
    imageLocalData: slot.imageLocalData ?? '',
    capturedAt: slot.capturedAt ?? '',
    gpsLat: slot.latitude ?? '',
    gpsLng: slot.longitude ?? '',
    gpsAccuracy: slot.accuracy ?? '',
    gpsStatus: slot.gpsStatus,
    addressText: slot.addressText ?? '',
    watermarkText: slot.watermarkText ?? '',
    watermarkApplied: Boolean(slot.watermarkText),
  };
}

function queuePending(record: ProofRecord): void {
  const pending = getPendingRecords().filter((item) => item.recordId !== record.recordId && item.duplicateKey !== record.duplicateKey);
  pending.push(record);
  writeJson(KEYS.pending, pending);
}

function removePending(recordId: string): void {
  writeJson(KEYS.pending, getPendingRecords().filter((item) => item.recordId !== recordId));
}

async function callCentral<T>(action: string, payload: unknown, allowPublic = false): Promise<ApiResult<T>> {
  if (!API_URL) throw new Error('ยังไม่ได้ตั้งค่าระบบกลาง');
  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, payload, allowPublic, client: 'hub-photo-proof-reset013', appVersion: APP_VERSION, sentAt: new Date().toISOString() }),
  });
  const raw = await response.text();
  let parsed: Record<string, unknown> & { ok?: boolean; message?: string; error?: string; data?: unknown };
  try {
    parsed = JSON.parse(raw) as typeof parsed;
  } catch {
    throw new Error('ระบบกลางตอบกลับไม่ถูกต้อง');
  }
  if (!response.ok || parsed.ok === false) throw new Error(text(parsed.message ?? parsed.error) || 'ระบบกลางทำงานไม่สำเร็จ');
  return { ok: true, message: text(parsed.message) || 'สำเร็จ', data: (parsed.data ?? {}) as T };
}

async function requestLocation(): Promise<{ status: GpsStatus; latitude?: number; longitude?: number; accuracy?: number; addressText?: string }> {
  if (!navigator.geolocation) return { status: 'unavailable', addressText: 'ไม่พบชื่อสถานที่' };
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => resolve({ status: 'granted', latitude: position.coords.latitude, longitude: position.coords.longitude, accuracy: position.coords.accuracy, addressText: 'ไม่พบชื่อสถานที่' }),
      () => resolve({ status: 'denied', addressText: 'ไม่พบชื่อสถานที่' }),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  });
}

function buildWatermarkText(record: ProofRecord, label: string, capturedAt: string, location: { status: GpsStatus; latitude?: number; longitude?: number; accuracy?: number; addressText?: string }): string {
  const hasGps = typeof location.latitude === 'number' && typeof location.longitude === 'number';
  const gps = hasGps ? `${location.latitude?.toFixed(6)}, ${location.longitude?.toFixed(6)}${typeof location.accuracy === 'number' ? ` ±${Math.round(location.accuracy)}m` : ''}` : 'ไม่พบตำแหน่ง';
  const place = location.addressText && location.addressText !== 'ไม่พบชื่อสถานที่' ? location.addressText : 'ไม่พบชื่อสถานที่';
  return [
    `วันที่ ${todayBangkok(new Date(capturedAt))} เวลา ${formatBangkok(capturedAt).split(' ')[1] ?? ''}`,
    `พิกัด ${gps}`,
    `สถานที่ ${place}`,
    `บาร์โค้ดรถ ${record.vehicleBarcode}`,
    `ฮับ ${record.hubCode}-${record.hubName}`,
    `ผู้รับผิดชอบ ${record.responsibleEmployeeCode} ${record.responsibleName}`,
    `ประเภทรูป ${label}`,
  ].join('\n');
}

function renderWatermarkedImage(file: File, watermarkText: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const maxSize = 1100;
      const scale = Math.min(1, maxSize / image.width, maxSize / image.height);
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(image.width * scale));
      canvas.height = Math.max(1, Math.round(image.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error('ไม่สามารถประมวลผลรูปได้'));
        return;
      }
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const lines = watermarkText.split('\n');
      const fontSize = Math.max(18, Math.round(canvas.width * 0.026));
      const lineHeight = Math.round(fontSize * 1.32);
      const padding = Math.round(fontSize * 0.9);
      ctx.font = `700 ${fontSize}px system-ui, sans-serif`;
      ctx.textBaseline = 'bottom';
      lines.forEach((line, index) => {
        const y = canvas.height - padding - (lines.length - 1 - index) * lineHeight;
        ctx.lineWidth = Math.max(3, Math.round(fontSize / 5));
        ctx.strokeStyle = 'rgba(0,0,0,0.75)';
        ctx.fillStyle = index === 0 ? '#ffd54a' : '#ffffff';
        ctx.strokeText(line, padding, y);
        ctx.fillText(line, padding, y);
      });
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('เปิดรูปไม่สำเร็จ'));
    };
    image.src = objectUrl;
  });
}

function normalizeHubs(raw: unknown): Hub[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeHub).filter((hub) => hub.hubCode && hub.active);
}

function normalizeHub(raw: unknown): Hub {
  const row = typeof raw === 'object' && raw ? raw as Record<string, unknown> : {};
  const hubCode = text(row.hubCode ?? row['รหัสฮับ']).trim();
  return { hubCode, hubName: text(row.hubName ?? row['ชื่อฮับ']) || hubCode, active: toBool(row.active, true), note: text(row.note) || undefined, updatedAt: text(row.updatedAt) || undefined };
}

function normalizeResponsibleStaff(raw: unknown): ResponsibleStaff[] {
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeStaff).filter((staff) => staff.employeeCode && staff.hubCode && staff.active);
}

function normalizeStaff(raw: unknown): ResponsibleStaff {
  const row = typeof raw === 'object' && raw ? raw as Record<string, unknown> : {};
  return { employeeCode: text(row.employeeCode ?? row['รหัสพนักงาน']).trim(), employeeName: text(row.employeeName ?? row['ชื่อพนักงาน']).trim(), hubCode: text(row.hubCode).trim(), active: toBool(row.active, true), note: text(row.note) || undefined, updatedAt: text(row.updatedAt) || undefined };
}

function normalizeSettings(raw: unknown): AppSettings {
  const settings = { ...DEFAULT_SETTINGS };
  if (Array.isArray(raw)) {
    raw.forEach((item) => {
      if (item && typeof item === 'object') {
        const row = item as Record<string, unknown>;
        const key = text(row.key).trim();
        if (key) (settings as Record<string, string>)[key] = text(row.value);
      }
    });
  } else if (raw && typeof raw === 'object') {
    Object.entries(raw as Record<string, unknown>).forEach(([key, value]) => { (settings as Record<string, string>)[key] = text(value); });
  }
  return settings;
}

function normalizeStatus(value: string): ProofStatus {
  const upper = value.toUpperCase();
  if (['DRAFT', 'IN_PROGRESS', 'NEED_REVIEW', 'COMPLETE', 'PENDING_SYNC', 'SYNCING', 'SYNCED', 'SYNC_FAILED', 'VOIDED'].includes(upper)) return upper as ProofStatus;
  if (value.includes('ซิงก์ไม่สำเร็จ')) return 'SYNC_FAILED';
  if (value.includes('รอซิงก์')) return 'PENDING_SYNC';
  if (value.includes('ซิงก์แล้ว')) return 'SYNCED';
  if (value.includes('รูปไม่ครบ')) return 'NEED_REVIEW';
  if (value.includes('ส่งครบ')) return 'COMPLETE';
  if (value.includes('กำลัง')) return 'IN_PROGRESS';
  return 'DRAFT';
}

function normalizeSlotType(value: string): SlotType {
  if (['REAR', 'DROP_FRONT', 'MAIN_REAR', 'TRAILER_REAR', 'TRAILER_REAR_EXTRA'].includes(value)) return value as SlotType;
  return 'REAR';
}

function normalizeGpsStatus(value: string): GpsStatus {
  if (['granted', 'denied', 'unavailable', 'unknown'].includes(value)) return value as GpsStatus;
  return 'unknown';
}

function numberOrUndefined(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function parseCentralTime(value: unknown): string | undefined {
  const str = text(value);
  if (!str) return undefined;
  const normalized = str.includes('T') ? str : str.replace(' ', 'T') + '+07:00';
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? str : date.toISOString();
}

function splitCode(value: unknown): string {
  return text(value).split(/\s|-/)[0] ?? '';
}

function splitName(value: unknown): string {
  const raw = text(value);
  const index = raw.indexOf(' ');
  if (index >= 0) return raw.slice(index + 1).trim();
  const dash = raw.indexOf('-');
  return dash >= 0 ? raw.slice(dash + 1).trim() : '';
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

function dedupeBy<T>(items: T[], keyer: (item: T) => string): T[] {
  const map = new Map<string, T>();
  items.forEach((item) => map.set(keyer(item), item));
  return Array.from(map.values());
}

function text(value: unknown): string {
  return value === null || value === undefined ? '' : String(value);
}

function toBool(value: unknown, fallback = false): boolean {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', 'yes', '1', 'y', 'ใช่', 'active'].includes(String(value).trim().toLowerCase());
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((item) => item.type === type)?.value ?? '';
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'ระบบกลางทำงานไม่สำเร็จ';
}
