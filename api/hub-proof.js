import { google } from 'googleapis';
import { Readable } from 'node:stream';
import crypto from 'node:crypto';

const API_VERSION = 'RESET-013';
const TZ = 'Asia/Bangkok';

const SHEETS = {
  hubs: 'Hubs',
  staff: 'ResponsibleStaff',
  records: 'Records_All',
  photos: 'Photos',
  settings: 'Settings',
  audit: 'Audit',
};

const HEADERS = {
  Hubs: ['hubCode', 'hubName', 'active', 'note', 'updatedAt'],
  ResponsibleStaff: ['employeeCode', 'employeeName', 'hubCode', 'active', 'note', 'updatedAt'],
  Settings: ['key', 'value', 'updatedAt', 'note'],
  Audit: ['auditId', 'action', 'message', 'recordId', 'actor', 'detailJson', 'createdAt'],
  Photos: [
    'photoId', 'recordId', 'duplicateKey', 'vehicleBarcode', 'slotId', 'slotType', 'labelThai', 'capturedAt',
    'fileName', 'driveFileId', 'driveUrl', 'imagePreviewUrl', 'imagePreview', 'gpsLat', 'gpsLng', 'gpsAccuracy',
    'gpsStatus', 'addressText', 'watermarkText', 'hub', 'responsible', 'createdAt', 'updatedAt',
  ],
  Records_All: [
    'วันที่', 'ฮับ', 'ผู้รับผิดชอบ', 'บาร์โค้ดรถ', 'พ่วงดรอปหรือไม่', 'จำนวนดรอป', 'สถานะ',
    'รูปหลังรถ', 'รูปหน้าดรอป', 'รูปหลังรถพ่วงที่ 1', 'รูปหลังรถพ่วงที่ 2', 'รูปหลังรถพ่วงเพิ่ม',
    'รายการรูปที่ขาด', 'เวลาส่งข้อมูล', 'หมายเหตุ', 'recordId', 'duplicateKey', 'syncStatus', 'updatedAt',
    'hubCode', 'responsibleEmployeeCode', 'responsibleName', 'photoRequiredCount', 'photoDoneCount',
    'submittedAt', 'syncedAt', 'createdAt', 'duplicateOfRecordId', 'duplicateReason', 'dropType', 'dropCount', 'statusInternal',
  ],
};

const THAI_STATUS = {
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

const STATUS_RANK = {
  SYNCED: 90,
  COMPLETE: 80,
  NEED_REVIEW: 70,
  SYNC_FAILED: 60,
  PENDING_SYNC: 50,
  SYNCING: 45,
  IN_PROGRESS: 40,
  DRAFT: 30,
  VOIDED: 10,
};

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export default async function handler(req, res) {
  setCors(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  try {
    const body = parseBody(req);
    const action = req.method === 'GET' ? 'health' : text(body.action || body.fn || body.route || 'health');
    const payload = body.payload && typeof body.payload === 'object' ? body.payload : body;
    const data = await dispatch(action, payload);
    return res.status(200).json({ ok: true, message: data.message || 'สำเร็จ', data: data.data ?? data });
  } catch (error) {
    console.error(error);
    const status = error.statusCode || 500;
    return res.status(status).json({ ok: false, message: error.safeMessage || error.message || 'ระบบกลางทำงานไม่สำเร็จ', errorCode: error.code || 'SERVER_ERROR' });
  }
}

async function dispatch(action, payload) {
  switch (action) {
    case 'health': return health();
    case 'initOrRepairStorage': return initOrRepairStorage();
    case 'getBootstrapData': return getBootstrapData();
    case 'getHubs': return { message: 'ดึงข้อมูลฮับแล้ว', data: { hubs: await listHubs() } };
    case 'upsertHub': return upsertHub(payload);
    case 'deactivateHub': return deactivateHub(payload);
    case 'getResponsibleStaff': return { message: 'ดึงข้อมูลผู้รับผิดชอบแล้ว', data: { responsibleStaff: await listResponsibleStaff() } };
    case 'upsertResponsibleStaff': return upsertResponsibleStaff(payload);
    case 'deactivateResponsibleStaff': return deactivateResponsibleStaff(payload);
    case 'getSettings': return { message: 'ดึงการตั้งค่าแล้ว', data: { settings: await listSettingsObject() } };
    case 'updateSetting': return updateSetting(payload);
    case 'updateSettingsBatch': return updateSettingsBatch(payload);
    case 'verifyAdminAccess': return verifyAdminAccess(payload);
    case 'setAdminPin': return setAdminPin(payload);
    case 'getAdminAuthStatus': return getAdminAuthStatus();
    case 'findRecordByKey': return findRecordByKey(payload);
    case 'syncRecord':
    case 'upsertRecordByKey':
    case 'saveRecord': return syncRecord(payload);
    case 'syncBatch': return syncBatch(payload);
    case 'savePhotoMetadata': return savePhotoMetadata(payload);
    case 'getMyWork':
    case 'getRecords': return getRecords(payload);
    case 'getHistory':
    case 'getRecordsByDateRange': return getHistory(payload);
    case 'getPhotos': return getPhotos(payload);
    case 'logAudit': return logAudit(payload);
    default: throw safeError(`ไม่รู้จักคำสั่ง ${action}`, 'UNKNOWN_ACTION', 400);
  }
}

async function health() {
  await ensureStorageReady();
  return { message: 'ระบบกลางพร้อมใช้งาน', data: { apiVersion: API_VERSION, serverTime: nowBangkok(), backend: 'vercel-google-api' } };
}

async function initOrRepairStorage() {
  await ensureStorageReady();
  await writeAudit('storage_repair', 'ตรวจสอบและซ่อมชีท', '', 'system', {});
  return { message: 'ตรวจสอบและซ่อมชีทแล้ว', data: { apiVersion: API_VERSION, serverTime: nowBangkok() } };
}

async function getBootstrapData() {
  await ensureStorageReady();
  return {
    message: 'ดึงข้อมูลล่าสุดแล้ว',
    data: {
      hubs: await listHubs(),
      responsibleStaff: await listResponsibleStaff(),
      settings: await listSettingsObject(),
      apiVersion: API_VERSION,
      serverTime: nowBangkok(),
    },
  };
}

async function listHubs() {
  const rows = await getObjects(SHEETS.hubs, HEADERS.Hubs);
  return rows.filter((row) => toBool(row.active, true)).map((row) => ({
    hubCode: text(row.hubCode),
    hubName: text(row.hubName),
    active: toBool(row.active, true),
    note: text(row.note),
    updatedAt: text(row.updatedAt),
  }));
}

async function upsertHub(payload) {
  const hubCode = text(payload.hubCode).trim();
  if (!hubCode) throw safeError('กรุณาระบุรหัสฮับ', 'HUB_CODE_REQUIRED', 400);
  await upsertObject(SHEETS.hubs, HEADERS.Hubs, (row) => text(row.hubCode).toUpperCase() === hubCode.toUpperCase(), {
    hubCode,
    hubName: text(payload.hubName) || hubCode,
    active: String(payload.active ?? true).toUpperCase() === 'FALSE' ? 'FALSE' : 'TRUE',
    note: text(payload.note),
    updatedAt: nowBangkok(),
  });
  await writeAudit('hub_upsert', `บันทึกฮับ ${hubCode}`, '', text(payload.actor), payload);
  return { message: 'บันทึกลงระบบกลางแล้ว', data: { hubs: await listHubs() } };
}

async function deactivateHub(payload) {
  const hubCode = text(payload.hubCode).trim();
  await upsertObject(SHEETS.hubs, HEADERS.Hubs, (row) => text(row.hubCode).toUpperCase() === hubCode.toUpperCase(), {
    hubCode,
    hubName: text(payload.hubName) || hubCode,
    active: 'FALSE',
    note: text(payload.note),
    updatedAt: nowBangkok(),
  });
  await writeAudit('hub_deactivate', `ปิดใช้งานฮับ ${hubCode}`, '', text(payload.actor), payload);
  return { message: 'บันทึกลงระบบกลางแล้ว', data: { hubs: await listHubs() } };
}

async function listResponsibleStaff() {
  const rows = await getObjects(SHEETS.staff, HEADERS.ResponsibleStaff);
  return rows.filter((row) => toBool(row.active, true)).map((row) => ({
    employeeCode: text(row.employeeCode),
    employeeName: text(row.employeeName),
    hubCode: text(row.hubCode),
    active: toBool(row.active, true),
    note: text(row.note),
    updatedAt: text(row.updatedAt),
  }));
}

async function upsertResponsibleStaff(payload) {
  const employeeCode = text(payload.employeeCode).trim();
  const hubCode = text(payload.hubCode).trim();
  if (!employeeCode || !hubCode) throw safeError('ข้อมูลผู้รับผิดชอบไม่ครบ', 'STAFF_REQUIRED', 400);
  await upsertObject(SHEETS.staff, HEADERS.ResponsibleStaff, (row) => text(row.employeeCode).toUpperCase() === employeeCode.toUpperCase() && text(row.hubCode).toUpperCase() === hubCode.toUpperCase(), {
    employeeCode,
    employeeName: text(payload.employeeName) || employeeCode,
    hubCode,
    active: String(payload.active ?? true).toUpperCase() === 'FALSE' ? 'FALSE' : 'TRUE',
    note: text(payload.note),
    updatedAt: nowBangkok(),
  });
  await writeAudit('responsible_upsert', `บันทึกผู้รับผิดชอบ ${employeeCode}`, '', text(payload.actor), payload);
  return { message: 'บันทึกลงระบบกลางแล้ว', data: { responsibleStaff: await listResponsibleStaff() } };
}

async function deactivateResponsibleStaff(payload) {
  const employeeCode = text(payload.employeeCode).trim();
  const hubCode = text(payload.hubCode).trim();
  await upsertObject(SHEETS.staff, HEADERS.ResponsibleStaff, (row) => text(row.employeeCode).toUpperCase() === employeeCode.toUpperCase() && text(row.hubCode).toUpperCase() === hubCode.toUpperCase(), {
    employeeCode,
    employeeName: text(payload.employeeName) || employeeCode,
    hubCode,
    active: 'FALSE',
    note: text(payload.note),
    updatedAt: nowBangkok(),
  });
  await writeAudit('responsible_deactivate', `ปิดใช้งานผู้รับผิดชอบ ${employeeCode}`, '', text(payload.actor), payload);
  return { message: 'บันทึกลงระบบกลางแล้ว', data: { responsibleStaff: await listResponsibleStaff() } };
}

async function listSettingsObject() {
  const rows = await getObjects(SHEETS.settings, HEADERS.Settings);
  const settings = {
    GPS_REQUIRED: 'false',
    GPS_MANDATORY: 'false',
    WATERMARK_ENABLED: 'true',
    REQUIRE_ADMIN_DEVICE_APPROVAL: 'false',
    MINIMUM_APP_VERSION: '0.1.0',
    ADMIN_PIN_ENABLED: 'true',
    ADMIN_PIN_SET: 'false',
  };
  for (const row of rows) {
    const key = text(row.key);
    if (key) settings[key] = text(row.value);
  }
  settings.ADMIN_PIN_SET = settings.ADMIN_PIN_HASH ? 'true' : 'false';
  delete settings.ADMIN_PIN_HASH;
  return settings;
}

async function updateSetting(payload) {
  return updateSettingsBatch({ settings: [{ key: payload.key, value: payload.value }], actor: payload.actor });
}

async function updateSettingsBatch(payload) {
  const updates = Array.isArray(payload.settings) ? payload.settings : [];
  const safeKeys = new Set(['GPS_REQUIRED', 'GPS_MANDATORY', 'WATERMARK_ENABLED', 'REQUIRE_ADMIN_DEVICE_APPROVAL', 'MINIMUM_APP_VERSION']);
  for (const item of updates) {
    const key = text(item.key);
    if (!safeKeys.has(key)) continue;
    await upsertObject(SHEETS.settings, HEADERS.Settings, (row) => text(row.key) === key, { key, value: text(item.value), updatedAt: nowBangkok(), note: text(item.note) });
    await writeAudit('setting_update', `บันทึกการตั้งค่า ${key}`, '', text(payload.actor), { key, value: text(item.value) });
  }
  return { message: 'บันทึกลงระบบกลางแล้ว', data: { settings: await listSettingsObject() } };
}

async function verifyAdminAccess(payload) {
  const pin = text(payload.pin || payload.adminPin);
  const settings = await getObjects(SHEETS.settings, HEADERS.Settings);
  const hash = text(settings.find((row) => text(row.key) === 'ADMIN_PIN_HASH')?.value);
  if (!hash) return { message: 'ยังไม่ได้ตั้งค่า PIN หลังบ้าน', data: { verified: false, adminPinSet: false } };
  if (hashPin(pin) !== hash) throw safeError('PIN ไม่ถูกต้อง', 'PIN_WRONG', 401);
  return { message: 'ยืนยัน PIN สำเร็จ', data: { verified: true, adminPinSet: true } };
}

async function setAdminPin(payload) {
  const pin = text(payload.pin || payload.newPin);
  if (!pin || pin.length < 4) throw safeError('PIN ต้องมีอย่างน้อย 4 หลัก', 'PIN_TOO_SHORT', 400);
  const rows = await getObjects(SHEETS.settings, HEADERS.Settings);
  const currentHash = text(rows.find((row) => text(row.key) === 'ADMIN_PIN_HASH')?.value);
  if (currentHash && hashPin(text(payload.currentPin)) !== currentHash) throw safeError('PIN เดิมไม่ถูกต้อง', 'PIN_WRONG', 401);
  await upsertObject(SHEETS.settings, HEADERS.Settings, (row) => text(row.key) === 'ADMIN_PIN_HASH', { key: 'ADMIN_PIN_HASH', value: hashPin(pin), updatedAt: nowBangkok(), note: 'central admin pin' });
  await writeAudit('admin_pin_changed', 'เปลี่ยน PIN หลังบ้าน', '', text(payload.actor || payload.deviceId), {});
  return { message: 'ตั้งค่า PIN แล้ว', data: { adminPinSet: true } };
}

async function getAdminAuthStatus() {
  const rows = await getObjects(SHEETS.settings, HEADERS.Settings);
  const adminPinSet = Boolean(text(rows.find((row) => text(row.key) === 'ADMIN_PIN_HASH')?.value));
  return { message: 'ดึงสถานะ PIN แล้ว', data: { adminPinSet, adminPinEnabled: true } };
}

async function findRecordByKey(payload) {
  const duplicateKey = text(payload.duplicateKey) || buildDuplicateKey(text(payload.date) || dateBangkok(), text(payload.hubCode), text(payload.responsibleEmployeeCode), text(payload.vehicleBarcode));
  const records = await readRecordsWithPhotos();
  const record = chooseBest(records.filter((item) => text(item.duplicateKey) === duplicateKey));
  return { message: record ? 'พบงานเดิม' : 'ไม่พบงานเดิม', data: { found: Boolean(record), record } };
}

async function syncRecord(payload) {
  const recordInput = payload.record || payload;
  const record = normalizeRecord(recordInput);
  const photoMetadata = Array.isArray(payload.photoMetadata) ? payload.photoMetadata : [];
  await upsertRecordRow(record, []);
  const syncedPhotos = [];
  for (const rawPhoto of photoMetadata) {
    const photo = await savePhotoObject({ ...rawPhoto, recordId: record.recordId, duplicateKey: record.duplicateKey, vehicleBarcode: record.vehicleBarcode, hubCode: record.hubCode, responsibleEmployeeCode: record.responsibleEmployeeCode });
    syncedPhotos.push(photo);
  }
  const finalRecord = await upsertRecordRow(record, syncedPhotos);
  await writeAudit('record_sync', `ซิงก์งาน ${record.vehicleBarcode}`, record.recordId, text(payload.actor), { duplicateKey: record.duplicateKey, photos: syncedPhotos.length });
  return { message: 'ส่งข้อมูลแล้ว', data: { record: finalRecord, photos: syncedPhotos } };
}

async function syncBatch(payload) {
  const records = Array.isArray(payload.records) ? payload.records : [];
  const results = [];
  for (const record of records) results.push(await syncRecord({ record, photoMetadata: record.photoMetadata || record.photos || [] }));
  return { message: 'ซิงก์งานค้างเรียบร้อย', data: { results } };
}

async function savePhotoMetadata(payload) {
  const photo = await savePhotoObject(payload);
  const records = await readRecordsWithPhotos();
  const record = records.find((item) => text(item.recordId) === text(photo.recordId) || text(item.duplicateKey) === text(photo.duplicateKey));
  if (record) await upsertRecordRow(record, [photo]);
  return { message: 'บันทึกรูปแล้ว', data: { photo } };
}

async function getRecords(payload = {}) {
  const records = await readRecordsWithPhotos();
  const filtered = filterRecords(records, payload);
  return { message: 'ดึงข้อมูลงานแล้ว', data: { records: dedupeRecords(filtered) } };
}

async function getHistory(payload = {}) {
  const records = await readRecordsWithPhotos();
  return { message: 'ดึงประวัติแล้ว', data: { records: filterRecords(records, payload) } };
}

async function getPhotos(payload = {}) {
  const rows = await getObjects(SHEETS.photos, HEADERS.Photos);
  const photos = rows.filter((row) => !payload.recordId || text(row.recordId) === text(payload.recordId));
  return { message: 'ดึงข้อมูลรูปแล้ว', data: { photos } };
}

async function logAudit(payload) {
  await writeAudit(text(payload.action) || 'audit', text(payload.message), text(payload.recordId), text(payload.actor), payload.detailJson || payload);
  return { message: 'บันทึก Audit แล้ว', data: {} };
}

async function savePhotoObject(raw) {
  const slotId = text(raw.slotId || raw.photoSlot);
  const slotType = text(raw.slotType);
  const labelThai = text(raw.labelThai || raw.photoType || raw.label);
  if (!slotId || !slotType || !labelThai) throw safeError('ข้อมูลประเภทรูปไม่ครบ กรุณาถ่ายรูปใหม่', 'PHOTO_SLOT_REQUIRED', 400);
  let driveFileId = text(raw.driveFileId);
  let driveUrl = text(raw.driveUrl);
  let imagePreviewUrl = text(raw.imagePreviewUrl);
  if (!driveFileId && text(raw.imageLocalData)) {
    const uploaded = await uploadImage(raw);
    driveFileId = uploaded.driveFileId;
    driveUrl = uploaded.driveUrl;
    imagePreviewUrl = uploaded.imagePreviewUrl;
  }
  const imageFormula = imagePreviewUrl ? `=IMAGE("${imagePreviewUrl}", 4, 100, 140)` : text(raw.imageFormula);
  const photoId = text(raw.photoId) || `${text(raw.recordId)}_${slotId}`;
  const photo = {
    photoId,
    recordId: text(raw.recordId),
    duplicateKey: text(raw.duplicateKey),
    vehicleBarcode: normalizeVehicleBarcode(text(raw.vehicleBarcode)),
    slotId,
    slotType,
    labelThai,
    capturedAt: formatBangkokFromAny(raw.capturedAt) || nowBangkok(),
    fileName: text(raw.fileName) || `${photoId}.jpg`,
    driveFileId,
    driveUrl,
    imagePreviewUrl,
    imagePreview: imageFormula,
    gpsLat: text(raw.gpsLat || raw.latitude),
    gpsLng: text(raw.gpsLng || raw.longitude),
    gpsAccuracy: text(raw.gpsAccuracy || raw.accuracy),
    gpsStatus: text(raw.gpsStatus) || 'unknown',
    addressText: text(raw.addressText) || 'ไม่พบชื่อสถานที่',
    watermarkText: text(raw.watermarkText),
    hub: text(raw.hub || raw.hubCode),
    responsible: text(raw.responsible || raw.responsibleEmployeeCode),
    createdAt: formatBangkokFromAny(raw.createdAt) || nowBangkok(),
    updatedAt: nowBangkok(),
  };
  await upsertObject(SHEETS.photos, HEADERS.Photos, (row) => text(row.photoId) === photoId || (text(row.recordId) === photo.recordId && text(row.slotId) === slotId), photo, 'USER_ENTERED');
  return photo;
}

async function uploadImage(raw) {
  const folderId = env('GOOGLE_DRIVE_FOLDER_ID');
  if (!folderId) throw safeError('ยังไม่ได้ตั้งค่า GOOGLE_DRIVE_FOLDER_ID', 'DRIVE_FOLDER_MISSING', 500);
  const { drive } = await googleClients();
  const dataUrl = text(raw.imageLocalData);
  const match = dataUrl.match(/^data:(.+?);base64,(.+)$/);
  if (!match) throw safeError('ข้อมูลรูปไม่ถูกต้อง', 'INVALID_IMAGE_DATA', 400);
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const name = text(raw.fileName) || `${text(raw.recordId)}_${text(raw.slotId)}.jpg`;
  const created = await drive.files.create({
    requestBody: { name, parents: [folderId] },
    media: { mimeType, body: Readable.from(buffer) },
    fields: 'id,webViewLink',
    supportsAllDrives: true,
  });
  const fileId = created.data.id;
  if (!fileId) throw safeError('อัปโหลดรูปไม่สำเร็จ', 'DRIVE_UPLOAD_FAILED', 500);
  try {
    await drive.permissions.create({ fileId, requestBody: { role: 'reader', type: 'anyone' }, supportsAllDrives: true });
  } catch (error) {
    console.warn('Drive sharing warning', error.message);
  }
  return {
    driveFileId: fileId,
    driveUrl: created.data.webViewLink || `https://drive.google.com/file/d/${fileId}/view`,
    imagePreviewUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
  };
}

async function upsertRecordRow(recordInput, photos) {
  const existingRows = await getObjects(SHEETS.records, HEADERS.Records_All, 'FORMULA');
  const record = normalizeRecord(recordInput);
  const existing = existingRows.find((row) => text(row.recordId) === record.recordId || text(row.duplicateKey) === record.duplicateKey);
  const allPhotos = await getObjects(SHEETS.photos, HEADERS.Photos, 'FORMULA');
  const relatedPhotos = [...allPhotos.filter((photo) => text(photo.recordId) === record.recordId || text(photo.duplicateKey) === record.duplicateKey), ...photos];
  const rowObject = buildRecordRow({ ...(existing || {}), ...record }, relatedPhotos);
  await upsertObject(SHEETS.records, HEADERS.Records_All, (row) => text(row.recordId) === record.recordId || text(row.duplicateKey) === record.duplicateKey, rowObject, 'USER_ENTERED');
  return { ...record, statusInternal: rowObject.statusInternal, status: rowObject.statusInternal, photoSlots: photosToSlots(record, relatedPhotos), syncedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

function buildRecordRow(record, photos) {
  const statusInternal = normalizeStatus(text(record.statusInternal || record.status));
  const done = photos.filter((photo) => text(photo.driveUrl || photo.imagePreviewUrl)).length;
  const required = Number(record.photoRequiredCount || record.photoSlots?.length || (text(record.dropType) === 'DROP' ? 3 : 2)) || 2;
  const photoBySlot = Object.fromEntries(photos.map((photo) => [text(photo.slotId), photo]));
  const extra = photos.filter((photo) => text(photo.slotId).startsWith('trailerRearExtra')).map(photoCell).filter(Boolean).join('\n');
  return {
    'วันที่': text(record.date) || dateBangkok(),
    'ฮับ': `${text(record.hubCode)} ${text(record.hubName)}`.trim(),
    'ผู้รับผิดชอบ': `${text(record.responsibleEmployeeCode)} ${text(record.responsibleName)}`.trim(),
    'บาร์โค้ดรถ': normalizeVehicleBarcode(text(record.vehicleBarcode)),
    'พ่วงดรอปหรือไม่': text(record.dropType) === 'DROP' ? 'พ่วงดรอป' : 'ไม่พ่วงดรอป',
    'จำนวนดรอป': text(record.dropCount || ''),
    'สถานะ': THAI_STATUS[statusInternal] || 'ส่งครบแล้ว',
    'รูปหลังรถ': photoCell(photoBySlot.rear || photoBySlot.mainRear),
    'รูปหน้าดรอป': photoCell(photoBySlot.dropFront),
    'รูปหลังรถพ่วงที่ 1': photoCell(photoBySlot.trailerRear1),
    'รูปหลังรถพ่วงที่ 2': photoCell(photoBySlot.trailerRear2),
    'รูปหลังรถพ่วงเพิ่ม': extra,
    'รายการรูปที่ขาด': Array.isArray(record.missingPhotoLabels) ? record.missingPhotoLabels.join(', ') : text(record['รายการรูปที่ขาด']),
    'เวลาส่งข้อมูล': formatBangkokFromAny(record.submittedAt) || nowBangkok(),
    'หมายเหตุ': text(record.note || record['หมายเหตุ']),
    recordId: text(record.recordId),
    duplicateKey: text(record.duplicateKey),
    syncStatus: 'ซิงก์แล้ว',
    updatedAt: nowBangkok(),
    hubCode: text(record.hubCode),
    responsibleEmployeeCode: text(record.responsibleEmployeeCode),
    responsibleName: text(record.responsibleName),
    photoRequiredCount: required,
    photoDoneCount: done,
    submittedAt: formatBangkokFromAny(record.submittedAt) || nowBangkok(),
    syncedAt: nowBangkok(),
    createdAt: formatBangkokFromAny(record.createdAt) || nowBangkok(),
    duplicateOfRecordId: text(record.duplicateOfRecordId),
    duplicateReason: text(record.duplicateReason),
    dropType: text(record.dropType) || 'NO_DROP',
    dropCount: text(record.dropCount || ''),
    statusInternal: statusInternal === 'NEED_REVIEW' ? 'NEED_REVIEW' : 'SYNCED',
  };
}

function photoCell(photo) {
  if (!photo) return '';
  return text(photo.imagePreview || photo.imageFormula) || (photo.imagePreviewUrl ? `=IMAGE("${photo.imagePreviewUrl}", 4, 120, 160)` : text(photo.driveUrl));
}

async function readRecordsWithPhotos() {
  const rows = await getObjects(SHEETS.records, HEADERS.Records_All, 'FORMULA');
  const photos = await getObjects(SHEETS.photos, HEADERS.Photos, 'FORMULA');
  return rows.map((row) => {
    const duplicateKey = text(row.duplicateKey) || buildDuplicateKey(text(row['วันที่']), text(row.hubCode), text(row.responsibleEmployeeCode), text(row['บาร์โค้ดรถ']));
    const relatedPhotos = photos.filter((photo) => text(photo.duplicateKey) === duplicateKey || text(photo.recordId) === text(row.recordId));
    return recordFromRow(row, relatedPhotos);
  });
}

function recordFromRow(row, photos) {
  const date = text(row['วันที่'] || row.date) || dateBangkok();
  const hubCode = text(row.hubCode) || text(row['ฮับ']).split(' ')[0];
  const responsibleEmployeeCode = text(row.responsibleEmployeeCode) || text(row['ผู้รับผิดชอบ']).split(' ')[0];
  const vehicleBarcode = normalizeVehicleBarcode(text(row.vehicleBarcode || row['บาร์โค้ดรถ']));
  const duplicateKey = text(row.duplicateKey) || buildDuplicateKey(date, hubCode, responsibleEmployeeCode, vehicleBarcode);
  const dropType = text(row.dropType || row['พ่วงดรอปหรือไม่']).includes('พ่วง') ? 'DROP' : 'NO_DROP';
  const dropCount = Number(row.dropCount || row['จำนวนดรอป'] || 0) || 0;
  return {
    recordId: text(row.recordId) || duplicateKey,
    duplicateKey,
    date,
    hubCode,
    hubName: text(row.hubName || text(row['ฮับ']).replace(hubCode, '').trim()),
    responsibleEmployeeCode,
    responsibleName: text(row.responsibleName || text(row['ผู้รับผิดชอบ']).replace(responsibleEmployeeCode, '').trim()),
    vehicleBarcode,
    dropType,
    dropCount,
    status: normalizeStatus(text(row.statusInternal || row['สถานะ'])),
    photoSlots: photosToSlots({ dropType, dropCount }, photos),
    missingPhotoLabels: text(row['รายการรูปที่ขาด']).split(',').map((item) => item.trim()).filter(Boolean),
    submittedAt: parseBangkok(text(row.submittedAt || row['เวลาส่งข้อมูล'])),
    syncedAt: parseBangkok(text(row.syncedAt)),
    createdAt: parseBangkok(text(row.createdAt)) || new Date().toISOString(),
    updatedAt: parseBangkok(text(row.updatedAt)) || new Date().toISOString(),
    duplicateOfRecordId: text(row.duplicateOfRecordId) || undefined,
    duplicateReason: text(row.duplicateReason) || undefined,
    note: text(row['หมายเหตุ'] || row.note) || undefined,
  };
}

function photosToSlots(record, photos) {
  const base = createSlots(text(record.dropType) === 'DROP' ? 'DROP' : 'NO_DROP', Number(record.dropCount || 0) || 0);
  return base.map((slot) => {
    const found = photos.find((photo) => text(photo.slotId) === slot.slotId || text(photo.labelThai) === slot.label);
    if (!found) return slot;
    return {
      ...slot,
      captured: true,
      fileName: text(found.fileName),
      driveFileId: text(found.driveFileId),
      driveUrl: text(found.driveUrl),
      imagePreviewUrl: text(found.imagePreviewUrl),
      imageFormula: text(found.imagePreview),
      capturedAt: parseBangkok(text(found.capturedAt)),
      latitude: numberOrUndefined(found.gpsLat),
      longitude: numberOrUndefined(found.gpsLng),
      accuracy: numberOrUndefined(found.gpsAccuracy),
      addressText: text(found.addressText),
      watermarkText: text(found.watermarkText),
      gpsStatus: text(found.gpsStatus) || 'unknown',
    };
  });
}

function createSlots(dropType, dropCount) {
  if (dropType === 'NO_DROP') return [slot('rear', 'REAR', 'รูปหลังรถ'), slot('dropFront', 'DROP_FRONT', 'รูปหน้าดรอป')];
  const slots = [slot('mainRear', 'MAIN_REAR', 'รูปหลังรถหลัก')];
  for (let i = 1; i <= Math.max(2, dropCount || 2); i += 1) slots.push(slot(i <= 2 ? `trailerRear${i}` : `trailerRearExtra${i}`, i <= 2 ? 'TRAILER_REAR' : 'TRAILER_REAR_EXTRA', `รูปหลังรถพ่วง ${i}`));
  return slots;
}

function slot(slotId, slotType, label) {
  return { slotId, slotType, label, required: true, captured: false, gpsStatus: 'unknown' };
}

function normalizeRecord(raw) {
  const date = text(raw.date || raw['วันที่']) || dateBangkok();
  const vehicleBarcode = normalizeVehicleBarcode(text(raw.vehicleBarcode || raw['บาร์โค้ดรถ']));
  const hubCode = text(raw.hubCode);
  const responsibleEmployeeCode = text(raw.responsibleEmployeeCode);
  return {
    ...raw,
    recordId: text(raw.recordId) || crypto.randomUUID(),
    duplicateKey: text(raw.duplicateKey) || buildDuplicateKey(date, hubCode, responsibleEmployeeCode, vehicleBarcode),
    date,
    vehicleBarcode,
    hubCode,
    responsibleEmployeeCode,
    statusInternal: normalizeStatus(text(raw.statusInternal || raw.status || 'COMPLETE')),
  };
}

function filterRecords(records, filters = {}) {
  return records.filter((record) => {
    if (filters.date && record.date !== filters.date) return false;
    if (filters.dateFrom && record.date < filters.dateFrom) return false;
    if (filters.dateTo && record.date > filters.dateTo) return false;
    if (filters.hubCode && record.hubCode !== filters.hubCode) return false;
    if (filters.responsibleEmployeeCode && record.responsibleEmployeeCode !== filters.responsibleEmployeeCode) return false;
    if (filters.vehicleBarcode && !record.vehicleBarcode.includes(normalizeVehicleBarcode(filters.vehicleBarcode))) return false;
    if (filters.status && record.status !== filters.status) return false;
    return true;
  });
}

function dedupeRecords(records) {
  const groups = new Map();
  for (const record of records) groups.set(record.duplicateKey, [...(groups.get(record.duplicateKey) || []), record]);
  return Array.from(groups.values()).map(chooseBest).sort((a, b) => text(b.updatedAt).localeCompare(text(a.updatedAt)));
}

function chooseBest(records) {
  return records.sort((a, b) => {
    const rank = (STATUS_RANK[b.status] || 0) - (STATUS_RANK[a.status] || 0);
    if (rank) return rank;
    return text(b.updatedAt).localeCompare(text(a.updatedAt));
  })[0];
}

async function ensureStorageReady() {
  const { sheets, spreadsheetId } = await googleClients();
  const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
  const existing = new Set(spreadsheet.data.sheets?.map((sheet) => sheet.properties?.title).filter(Boolean));
  const requests = Object.values(SHEETS).filter((title) => !existing.has(title)).map((title) => ({ addSheet: { properties: { title } } }));
  if (requests.length) await sheets.spreadsheets.batchUpdate({ spreadsheetId, requestBody: { requests } });
  for (const [title, headers] of Object.entries(HEADERS)) await ensureHeaders(title, headers);
}

async function ensureHeaders(sheetName, requiredHeaders) {
  const { sheets, spreadsheetId } = await googleClients();
  const existing = await getHeader(sheetName);
  const merged = [...existing];
  for (const header of requiredHeaders) if (!merged.includes(header)) merged.push(header);
  if (!existing.length || merged.length !== existing.length) await sheets.spreadsheets.values.update({ spreadsheetId, range: `${sheetName}!1:1`, valueInputOption: 'RAW', requestBody: { values: [merged] } });
}

async function getHeader(sheetName) {
  const { sheets, spreadsheetId } = await googleClients();
  const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!1:1` });
  return result.data.values?.[0]?.map(text) || [];
}

async function getObjects(sheetName, defaultHeaders, valueRenderOption = 'FORMATTED_VALUE') {
  await ensureHeaders(sheetName, defaultHeaders);
  const { sheets, spreadsheetId } = await googleClients();
  const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: `${sheetName}!A:ZZ`, valueRenderOption });
  const values = result.data.values || [];
  const headers = (values[0] || defaultHeaders).map(text);
  return values.slice(1).filter((row) => row.some((cell) => text(cell))).map((row, index) => {
    const obj = { __rowNumber: index + 2 };
    headers.forEach((header, i) => { obj[header] = row[i] ?? ''; });
    return obj;
  });
}

async function upsertObject(sheetName, headers, matcher, object, valueInputOption = 'RAW') {
  await ensureHeaders(sheetName, headers);
  const { sheets, spreadsheetId } = await googleClients();
  const actualHeaders = await getHeader(sheetName);
  const rows = await getObjects(sheetName, actualHeaders, 'FORMULA');
  const found = rows.find(matcher);
  const rowValues = actualHeaders.map((header) => object[header] ?? '');
  if (found) {
    await sheets.spreadsheets.values.update({ spreadsheetId, range: `${sheetName}!A${found.__rowNumber}:${columnLetter(actualHeaders.length)}${found.__rowNumber}`, valueInputOption, requestBody: { values: [rowValues] } });
    return found.__rowNumber;
  }
  await sheets.spreadsheets.values.append({ spreadsheetId, range: `${sheetName}!A:${columnLetter(actualHeaders.length)}`, valueInputOption, insertDataOption: 'INSERT_ROWS', requestBody: { values: [rowValues] } });
  return null;
}

async function googleClients() {
  const clientEmail = env('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  const privateKey = env('GOOGLE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  const spreadsheetId = env('GOOGLE_SHEET_ID');
  if (!clientEmail || !privateKey || !spreadsheetId) throw safeError('ยังไม่ได้ตั้งค่า Google API ใน Vercel', 'GOOGLE_ENV_MISSING', 500);
  const auth = new google.auth.JWT({ email: clientEmail, key: privateKey, scopes: ['https://www.googleapis.com/auth/spreadsheets', 'https://www.googleapis.com/auth/drive'] });
  return { sheets: google.sheets({ version: 'v4', auth }), drive: google.drive({ version: 'v3', auth }), spreadsheetId };
}

async function writeAudit(action, message, recordId, actor, detailJson) {
  await upsertObject(SHEETS.audit, HEADERS.Audit, () => false, { auditId: crypto.randomUUID(), action, message, recordId, actor, detailJson: JSON.stringify(detailJson || {}), createdAt: nowBangkok() });
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  return req.body;
}

function buildDuplicateKey(date, hubCode, employeeCode, vehicleBarcode) {
  return [date, hubCode, employeeCode, normalizeVehicleBarcode(vehicleBarcode)].map((value) => text(value).trim().toUpperCase()).join('|');
}

function normalizeVehicleBarcode(value) {
  return text(value).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

function normalizeStatus(value) {
  const upper = text(value).toUpperCase();
  if (Object.prototype.hasOwnProperty.call(THAI_STATUS, upper)) return upper;
  if (text(value).includes('ซิงก์แล้ว')) return 'SYNCED';
  if (text(value).includes('รูปไม่ครบ')) return 'NEED_REVIEW';
  if (text(value).includes('ส่งครบ')) return 'COMPLETE';
  return 'COMPLETE';
}

function dateBangkok(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

function nowBangkok() {
  return formatBangkokFromAny(new Date());
}

function formatBangkokFromAny(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(text(value).includes('T') ? text(value) : `${text(value).replace(' ', 'T')}+07:00`);
  if (Number.isNaN(date.getTime())) return text(value);
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  const time = new Intl.DateTimeFormat('th-TH', { timeZone: TZ, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(date);
  return `${day} ${time}`;
}

function parseBangkok(value) {
  const str = text(value);
  if (!str) return undefined;
  const date = new Date(str.includes('T') ? str : `${str.replace(' ', 'T')}+07:00`);
  return Number.isNaN(date.getTime()) ? str : date.toISOString();
}

function columnLetter(index) {
  let temp = index;
  let letter = '';
  while (temp > 0) {
    const mod = (temp - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    temp = Math.floor((temp - mod) / 26);
  }
  return letter || 'A';
}

function hashPin(pin) {
  const secret = env('APP_SHARED_SECRET') || 'hub-photo-proof';
  return crypto.createHash('sha256').update(`${secret}:${pin}`).digest('hex');
}

function env(key) {
  return process.env[key] || '';
}

function text(value) {
  return value === null || value === undefined ? '' : String(value);
}

function toBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  return ['true', 'yes', '1', 'y', 'ใช่', 'active'].includes(String(value).trim().toLowerCase());
}

function numberOrUndefined(value) {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function safeError(message, code, statusCode = 500) {
  const error = new Error(message);
  error.safeMessage = message;
  error.code = code;
  error.statusCode = statusCode;
  return error;
}
