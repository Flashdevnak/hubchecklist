const SHEETS = {
  RECORDS_ALL: 'Records_All',
  PHOTOS: 'Photos',
  HUBS: 'Hubs',
  RESPONSIBLE_STAFF: 'ResponsibleStaff',
  AUDIT: 'Audit',
  SETTINGS: 'Settings',
  ADMIN_DEVICES: 'AdminDevices',
  EXPORT_LOGS: 'ExportLogs',
};

const MISSING_PHOTO_TEXT = 'ยังไม่ได้ถ่าย';

const SIMPLE_RECORD_HEADERS = [
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

const HEADERS = {
  Records_All: SIMPLE_RECORD_HEADERS.concat(['recordId', 'syncStatus', 'updatedAt']),
  Photos: [
    'id',
    'recordId',
    'vehicleBarcode',
    'slotId',
    'slotType',
    'labelThai',
    'captured',
    'fileName',
    'capturedAt',
    'gpsLat',
    'gpsLng',
    'gpsAccuracy',
    'gpsStatus',
    'watermarkText',
    'hub',
    'responsible',
    'driveFileId',
    'driveUrl',
    'localOnly',
    'createdAt',
  ],
  Hubs: ['hubCode', 'hubName', 'active', 'updatedAt'],
  ResponsibleStaff: ['employeeCode', 'displayName', 'hubCode', 'active', 'updatedAt'],
  Audit: ['id', 'recordId', 'action', 'detail', 'actor', 'createdAt'],
  Settings: ['key', 'value', 'updatedAt'],
  AdminDevices: ['deviceId', 'deviceName', 'ownerName', 'role', 'status', 'approvedAt', 'revokedAt', 'lastLoginAt', 'note'],
  ExportLogs: ['id', 'action', 'detail', 'actor', 'createdAt'],
};

function doGet() {
  return json_({
    ok: true,
    service: 'Hub Photo Proof API',
    method: 'GET',
    message: 'Apps Script Web App is running. Use POST for app actions.',
    note: 'This /exec URL is the backend API, not the employee Web/PWA app.',
    serverTime: new Date().toISOString(),
  });
}

function doPost(e) {
  try {
    const request = parseRequest_(e);
    ensureSheets_();

    switch (request.action) {
      case 'healthCheck':
        return json_({ ok: true, app: 'hubchecklist', storage: 'Records_All + hub sheets', checkedAt: new Date().toISOString() });
      case 'bootstrap':
        return json_(bootstrap_(request.payload));
      case 'getAppSettings':
        return json_({ ok: true, appSettings: readSettingsMap_() });
      case 'createRecord':
      case 'syncRecord':
        return json_({ ok: true, result: syncRecord_(request.payload.record, request.payload.photoMetadata || []) });
      case 'uploadPhotoMetadata':
        return json_({ ok: true, result: upsertPhoto_(request.payload) });
      case 'getHubs':
        return json_({ ok: true, hubs: readRows_(SHEETS.HUBS) });
      case 'getResponsibleStaff':
        return json_({ ok: true, responsibleStaff: readRows_(SHEETS.RESPONSIBLE_STAFF) });
      case 'getRecords':
        return json_({ ok: true, records: readRows_(SHEETS.RECORDS_ALL) });
      case 'appendAudit':
        return json_({ ok: true, result: appendAudit_(request.payload) });
      case 'requestAdminAccess':
        return json_(requestAdminAccess_(request.payload));
      case 'verifyAdminAccess':
        return json_(verifyAdminAccess_(request.payload));
      case 'setAdminPin':
        return json_(setAdminPin_(request.payload));
      case 'setAdminDeviceApprovalRequired':
        return json_(setAdminDeviceApprovalRequired_(request.payload));
      case 'listAdminDevices':
        return json_({ ok: true, devices: listAdminDevices_(request.payload) });
      case 'approveAdminDevice':
        return json_(approveAdminDevice_(request.payload));
      case 'revokeAdminDevice':
        return json_(revokeAdminDevice_(request.payload));
      case 'getAdminAuthStatus':
        return json_(getAdminAuthStatus_(request.payload));
      default:
        return json_({ ok: false, error: 'Unknown action' });
    }
  } catch (error) {
    return json_({ ok: false, error: error && error.message ? error.message : String(error) });
  }
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Missing POST body');
  return JSON.parse(e.postData.contents);
}

function validateToken_(token) {
  const expected = PropertiesService.getScriptProperties().getProperty('APP_SHARED_SECRET');
  if (!expected) throw new Error('APP_SHARED_SECRET is not set in Script Properties');
  if (!token || token !== expected) throw new Error('Unauthorized');
}

function ensureSheets_() {
  Object.keys(HEADERS).forEach(function (sheetName) {
    ensureHeaders_(getOrCreateSheet_(sheetName), HEADERS[sheetName]);
  });
  ensureDefaultSettings_();
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return;
  }
  const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (firstRow.join('|') !== headers.join('|')) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  }
}

function ensureDefaultSettings_() {
  const sheet = getOrCreateSheet_(SHEETS.SETTINGS);
  ensureHeaders_(sheet, HEADERS.Settings);
  upsertSettingDefault_(sheet, 'ADMIN_PIN_ENABLED', 'false');
  upsertSettingDefault_(sheet, 'ADMIN_PIN_HASH', '');
  upsertSettingDefault_(sheet, 'ADMIN_PIN_SET', 'false');
  upsertSettingDefault_(sheet, 'REQUIRE_ADMIN_DEVICE_APPROVAL', 'false');
  upsertSettingDefault_(sheet, 'MINIMUM_APP_VERSION', '0.1.0');
  upsertSettingDefault_(sheet, 'GPS_MANDATORY', 'false');
  upsertSettingDefault_(sheet, 'WATERMARK_ENABLED', 'true');
}

function upsertSettingDefault_(sheet, key, value) {
  const rowIndex = findRowByValue_(sheet, 1, key);
  if (rowIndex > 0) return;
  sheet.appendRow([key, value, new Date().toISOString()]);
}

function upsertSetting_(key, value) {
  const sheet = getOrCreateSheet_(SHEETS.SETTINGS);
  ensureHeaders_(sheet, HEADERS.Settings);
  const rowIndex = findRowByValue_(sheet, 1, key);
  const row = [key, value, new Date().toISOString()];
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
}

function bootstrap_(payload) {
  const settings = readSettingsMap_();
  return {
    ok: true,
    serverTime: new Date().toISOString(),
    appSettings: settings,
    hubs: readRows_(SHEETS.HUBS),
    responsibleStaff: readRows_(SHEETS.RESPONSIBLE_STAFF),
    adminAuthEnabled: String(settings.ADMIN_PIN_ENABLED).toLowerCase() === 'true' && Boolean(settings.ADMIN_PIN_HASH),
    minimumAppVersion: settings.MINIMUM_APP_VERSION || '0.1.0',
    deviceId: payload && payload.deviceId ? payload.deviceId : '',
  };
}

function readSettingsMap_() {
  const rows = readRows_(SHEETS.SETTINGS);
  const settings = {};
  rows.forEach(function (row) {
    if (row.key) settings[row.key] = row.value;
  });
  return settings;
}

function requestAdminAccess_(payload) {
  if (!payload || !payload.deviceId) throw new Error('Missing deviceId');
  const sheet = getOrCreateSheet_(SHEETS.ADMIN_DEVICES);
  ensureHeaders_(sheet, HEADERS.AdminDevices);
  const rowIndex = findRowByValue_(sheet, 1, payload.deviceId);
  const existing = rowIndex > 0 ? readRowObject_(sheet, rowIndex) : null;
  if (existing && existing.status === 'APPROVED') {
    return { ok: true, message: 'อุปกรณ์นี้ได้รับอนุมัติแล้ว', device: normalizeAdminDevice_(existing) };
  }
  const device = {
    deviceId: payload.deviceId,
    deviceName: payload.deviceName || 'Unknown device',
    ownerName: payload.ownerName || '',
    role: existing && existing.role ? existing.role : 'VIEWER',
    status: 'PENDING',
    approvedAt: '',
    revokedAt: '',
    lastLoginAt: '',
    note: existing && existing.note ? existing.note : 'requested from app',
  };
  const row = HEADERS.AdminDevices.map(function (key) { return device[key] || ''; });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  appendAudit_({
    id: Utilities.getUuid(),
    action: 'admin_access_requested',
    detail: payload.deviceId,
    actor: payload.ownerName || 'unknown',
    createdAt: new Date().toISOString(),
  });
  return { ok: true, message: 'ส่งคำขออนุมัติแล้ว', device: device };
}

function verifyAdminAccess_(payload) {
  if (!payload) throw new Error('Missing payload');
  const settings = readSettingsMap_();
  if (String(settings.ADMIN_PIN_ENABLED).toLowerCase() !== 'true' || !settings.ADMIN_PIN_HASH) {
    return { ok: false, code: 'PIN_NOT_CONFIGURED', message: 'ยังไม่ได้ตั้งค่า PIN หลังบ้าน' };
  }
  if (sha256_(payload.adminPin || payload.pin || '') !== settings.ADMIN_PIN_HASH) {
    return { ok: false, code: 'PIN_WRONG', message: 'PIN ไม่ถูกต้อง' };
  }

  const requireDeviceApproval = String(settings.REQUIRE_ADMIN_DEVICE_APPROVAL).toLowerCase() === 'true';
  if (!requireDeviceApproval) {
    appendAudit_({
      id: Utilities.getUuid(),
      action: 'admin_login',
      detail: 'central PIN login',
      actor: 'admin',
      createdAt: new Date().toISOString(),
    });
    return {
      ok: true,
      message: 'เข้าสู่หลังบ้านแล้ว',
      role: 'ADMIN',
      sessionExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
      deviceApprovalRequired: false,
    };
  }

  if (!payload.deviceId) throw new Error('Missing deviceId');
  const sheet = getOrCreateSheet_(SHEETS.ADMIN_DEVICES);
  ensureHeaders_(sheet, HEADERS.AdminDevices);
  const rowIndex = findRowByValue_(sheet, 1, payload.deviceId);
  if (rowIndex < 0) {
    return { ok: false, message: 'เครื่องนี้ยังไม่ได้รับอนุญาตให้เข้าใช้งานหลังบ้าน กรุณาติดต่อผู้ดูแล' };
  }
  const device = normalizeAdminDevice_(readRowObject_(sheet, rowIndex));
  if (device.status !== 'APPROVED' || (device.role !== 'OWNER' && device.role !== 'ADMIN')) {
    return { ok: false, message: 'เครื่องนี้ยังไม่ได้รับอนุญาตให้เข้าใช้งานหลังบ้าน กรุณาติดต่อผู้ดูแล', device: device, role: device.role };
  }
  device.lastLoginAt = new Date().toISOString();
  sheet.getRange(rowIndex, 1, 1, HEADERS.AdminDevices.length).setValues([HEADERS.AdminDevices.map(function (key) { return device[key] || ''; })]);
  appendAudit_({
    id: Utilities.getUuid(),
    action: 'admin_login',
    detail: payload.deviceId,
    actor: device.ownerName || device.deviceName,
    createdAt: new Date().toISOString(),
  });
  return {
    ok: true,
    message: 'เข้าสู่หลังบ้านแล้ว',
    device: device,
    role: device.role,
    sessionExpiresAt: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
    deviceApprovalRequired: true,
  };
}

function setAdminPin_(payload) {
  if (!payload || !payload.newPin) throw new Error('Missing newPin');
  const newPin = String(payload.newPin);
  if (newPin.length < 4) return { ok: false, message: 'PIN ใหม่ต้องมีอย่างน้อย 4 ตัว' };

  const settings = readSettingsMap_();
  const currentHash = settings.ADMIN_PIN_HASH || PropertiesService.getScriptProperties().getProperty('ADMIN_PIN_HASH') || '';
  if (currentHash) {
    if (sha256_(payload.currentPin || '') !== currentHash) {
      return { ok: false, message: 'PIN ปัจจุบันไม่ถูกต้อง' };
    }
  } else {
    const expectedSetupToken = PropertiesService.getScriptProperties().getProperty('ADMIN_SETUP_TOKEN') || '';
    if (!expectedSetupToken || payload.setupToken !== expectedSetupToken) {
      return { ok: false, message: 'โทเคนตั้งค่า PIN ไม่ถูกต้อง' };
    }
  }

  const hash = sha256_(newPin);
  PropertiesService.getScriptProperties().setProperty('ADMIN_PIN_HASH', hash);
  upsertSetting_('ADMIN_PIN_ENABLED', 'true');
  upsertSetting_('ADMIN_PIN_HASH', hash);
  upsertSetting_('ADMIN_PIN_SET', 'true');
  appendAudit_({
    id: Utilities.getUuid(),
    action: 'admin_pin_changed',
    detail: 'Central Admin PIN hash updated',
    actor: 'admin',
    createdAt: new Date().toISOString(),
  });
  return { ok: true, message: 'บันทึก PIN หลังบ้านแล้ว' };
}

function setAdminDeviceApprovalRequired_(payload) {
  const result = verifyAdminAccess_(payload || {});
  if (!result.ok) return result;
  upsertSetting_('REQUIRE_ADMIN_DEVICE_APPROVAL', payload.enabled === true ? 'true' : 'false');
  appendAudit_({
    id: Utilities.getUuid(),
    action: 'admin_device_approval_setting_changed',
    detail: payload.enabled === true ? 'enabled' : 'disabled',
    actor: 'admin',
    createdAt: new Date().toISOString(),
  });
  return {
    ok: true,
    message: payload.enabled === true ? 'เปิดจำกัดเครื่องแอดมินแล้ว' : 'ปิดจำกัดเครื่องแอดมินแล้ว',
    deviceApprovalRequired: payload.enabled === true,
  };
}

function listAdminDevices_(payload) {
  requireApprovedAdmin_(payload);
  return readRows_(SHEETS.ADMIN_DEVICES).map(normalizeAdminDevice_);
}

function approveAdminDevice_(payload) {
  requireApprovedAdmin_(payload);
  if (!payload.targetDeviceId) throw new Error('Missing targetDeviceId');
  const sheet = getOrCreateSheet_(SHEETS.ADMIN_DEVICES);
  const rowIndex = findRowByValue_(sheet, 1, payload.targetDeviceId);
  if (rowIndex < 0) throw new Error('Device request not found');
  const device = normalizeAdminDevice_(readRowObject_(sheet, rowIndex));
  device.role = payload.role === 'OWNER' ? 'OWNER' : 'ADMIN';
  device.status = 'APPROVED';
  device.approvedAt = new Date().toISOString();
  device.revokedAt = '';
  sheet.getRange(rowIndex, 1, 1, HEADERS.AdminDevices.length).setValues([HEADERS.AdminDevices.map(function (key) { return device[key] || ''; })]);
  appendAudit_({
    id: Utilities.getUuid(),
    action: 'admin_device_approved',
    detail: payload.targetDeviceId,
    actor: payload.deviceId || 'admin',
    createdAt: new Date().toISOString(),
  });
  return { ok: true, device: device };
}

function revokeAdminDevice_(payload) {
  requireApprovedAdmin_(payload);
  if (!payload.targetDeviceId) throw new Error('Missing targetDeviceId');
  const sheet = getOrCreateSheet_(SHEETS.ADMIN_DEVICES);
  const rowIndex = findRowByValue_(sheet, 1, payload.targetDeviceId);
  if (rowIndex < 0) throw new Error('Device not found');
  const device = normalizeAdminDevice_(readRowObject_(sheet, rowIndex));
  device.status = 'REVOKED';
  device.revokedAt = new Date().toISOString();
  sheet.getRange(rowIndex, 1, 1, HEADERS.AdminDevices.length).setValues([HEADERS.AdminDevices.map(function (key) { return device[key] || ''; })]);
  appendAudit_({
    id: Utilities.getUuid(),
    action: 'admin_device_revoked',
    detail: payload.targetDeviceId,
    actor: payload.deviceId || 'admin',
    createdAt: new Date().toISOString(),
  });
  return { ok: true, device: device };
}

function getAdminAuthStatus_(payload) {
  const sheet = getOrCreateSheet_(SHEETS.ADMIN_DEVICES);
  const rowIndex = payload && payload.deviceId ? findRowByValue_(sheet, 1, payload.deviceId) : -1;
  const device = rowIndex > 0 ? normalizeAdminDevice_(readRowObject_(sheet, rowIndex)) : null;
  const settings = readSettingsMap_();
  return {
    ok: true,
    adminAuthEnabled: String(settings.ADMIN_PIN_ENABLED).toLowerCase() === 'true' && Boolean(settings.ADMIN_PIN_HASH),
    adminPinSet: Boolean(settings.ADMIN_PIN_HASH),
    deviceApprovalRequired: String(settings.REQUIRE_ADMIN_DEVICE_APPROVAL).toLowerCase() === 'true',
    device: device,
  };
}

function requireApprovedAdmin_(payload) {
  const result = verifyAdminAccess_(payload);
  if (!result.ok) throw new Error(result.message || 'Unauthorized admin device');
  return result;
}

function normalizeAdminDevice_(row) {
  return {
    deviceId: row.deviceId || '',
    deviceName: row.deviceName || '',
    ownerName: row.ownerName || '',
    role: row.role || 'VIEWER',
    status: row.status || 'PENDING',
    approvedAt: row.approvedAt || '',
    revokedAt: row.revokedAt || '',
    lastLoginAt: row.lastLoginAt || '',
    note: row.note || '',
  };
}

function sha256_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value), Utilities.Charset.UTF_8);
  return bytes.map(function (byte) {
    const value = byte < 0 ? byte + 256 : byte;
    return ('0' + value.toString(16)).slice(-2);
  }).join('');
}

function syncRecord_(record, photoMetadata) {
  if (!record || !record.id) throw new Error('Missing record.id');
  const photoResults = (photoMetadata || []).map(function (photo) {
    return upsertPhoto_(photo);
  });
  const row = buildSimpleRecordRow_(record, photoResults);
  const masterResult = upsertRecordAll_(record, row);
  const hubResult = upsertHubSheet_(record, row);
  appendAudit_({
    id: Utilities.getUuid(),
    recordId: record.id,
    action: 'google_sync_record',
    detail: 'Record synced to Records_All and hub sheet',
    actor: record.responsibleEmployeeCode || 'app',
    createdAt: new Date().toISOString(),
  });
  return { record: masterResult, hubSheet: hubResult, photos: photoResults };
}

function buildSimpleRecordRow_(record, photoResults) {
  const photoMap = {};
  (photoResults || []).forEach(function (photo) {
    photoMap[photo.slotType] = photo;
  });
  const extras = (photoResults || []).filter(function (photo) {
    return photo.slotType === 'DROP_REAR_EXTRA';
  });
  return [
    record.date || '',
    hubText_(record),
    responsibleText_(record),
    record.vehicleBarcode || '',
    record.hasDropTransfer ? 'พ่วงดรอป' : 'ไม่พ่วงดรอป',
    record.dropCount || 0,
    record.status || '',
    photoCell_(photoMap.REAR_MAIN),
    photoCell_(photoMap.FRONT_DROP),
    photoCell_(photoMap.DROP_REAR_1),
    photoCell_(photoMap.DROP_REAR_2),
    extras.map(photoCell_).filter(Boolean).join('\n') || MISSING_PHOTO_TEXT,
    (record.missingPhotoWarnings || []).join(', '),
    record.submittedAt || '',
    record.notes || '',
  ];
}

function upsertRecordAll_(record, simpleRow) {
  const sheet = getOrCreateSheet_(SHEETS.RECORDS_ALL);
  ensureHeaders_(sheet, HEADERS.Records_All);
  const row = simpleRow.concat([record.id, record.syncStatus || '', record.updatedAt || '']);
  const rowIndex = findRowByValue_(sheet, SIMPLE_RECORD_HEADERS.length + 1, record.id);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return { id: record.id, action: 'updated', sheet: SHEETS.RECORDS_ALL };
  }
  sheet.appendRow(row);
  return { id: record.id, action: 'created', sheet: SHEETS.RECORDS_ALL };
}

function upsertHubSheet_(record, simpleRow) {
  const sheetName = hubSheetName_(record);
  const sheet = getOrCreateSheet_(sheetName);
  ensureHeaders_(sheet, SIMPLE_RECORD_HEADERS);
  const rowIndex = findRowByRecordNote_(sheet, record.id);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, simpleRow.length).setValues([simpleRow]);
    sheet.getRange(rowIndex, 1).setNote(record.id);
    return { id: record.id, action: 'updated', sheet: sheetName };
  }
  sheet.appendRow(simpleRow);
  const newRow = sheet.getLastRow();
  sheet.getRange(newRow, 1).setNote(record.id);
  return { id: record.id, action: 'created', sheet: sheetName };
}

function upsertPhoto_(photo) {
  if (!photo || !photo.recordId || !photo.slotId) throw new Error('Missing photo recordId or slotId');
  const sheet = getOrCreateSheet_(SHEETS.PHOTOS);
  ensureHeaders_(sheet, HEADERS.Photos);
  const rowIndex = findPhotoRow_(sheet, photo.recordId, photo.slotId);
  const existing = rowIndex > 0 ? readRowObject_(sheet, rowIndex) : null;
  const uploaded = uploadPhotoIfPresent_(photo, existing);
  const values = photoValues_(photo, uploaded, existing);
  const row = HEADERS.Photos.map(function (key) { return values[key] || ''; });
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return values;
}

function uploadPhotoIfPresent_(photo, existing) {
  if (existing && existing.capturedAt === photo.capturedAt && existing.driveUrl) {
    return { fileId: existing.driveFileId || '', url: existing.driveUrl || '', localOnly: existing.localOnly === true };
  }
  if (!photo.imageLocalData || photo.captured !== true) {
    return { fileId: existing ? existing.driveFileId || '' : '', url: existing ? existing.driveUrl || '' : '', localOnly: true };
  }
  const match = String(photo.imageLocalData).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return { fileId: '', url: '', localOnly: true };

  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, match[1], safeName_(photo.fileName || `${photo.vehicleBarcode}_${photo.slotId}.jpg`));
  const folder = getPhotoFolder_(photo);
  const file = folder.createFile(blob);
  return { fileId: file.getId(), url: file.getUrl(), localOnly: false };
}

function photoValues_(photo, uploaded, existing) {
  return {
    id: existing && existing.id ? existing.id : Utilities.getUuid(),
    recordId: photo.recordId || '',
    vehicleBarcode: photo.vehicleBarcode || '',
    slotId: photo.slotId || '',
    slotType: photo.slotType || '',
    labelThai: photo.labelThai || '',
    captured: photo.captured === true,
    fileName: photo.fileName || '',
    capturedAt: photo.capturedAt || '',
    gpsLat: photo.gpsLat || '',
    gpsLng: photo.gpsLng || '',
    gpsAccuracy: photo.gpsAccuracy || '',
    gpsStatus: photo.gpsStatus || '',
    watermarkText: photo.watermarkText || '',
    hub: photo.hub || '',
    responsible: photo.responsible || '',
    driveFileId: uploaded.fileId || '',
    driveUrl: uploaded.url || '',
    localOnly: uploaded.localOnly === true,
    createdAt: existing && existing.createdAt ? existing.createdAt : new Date().toISOString(),
  };
}

function photoCell_(photo) {
  if (!photo || photo.captured !== true) return MISSING_PHOTO_TEXT;
  return photo.driveUrl || photo.fileName || MISSING_PHOTO_TEXT;
}

function getPhotoFolder_(photo) {
  const root = getOrCreateFolder_(DriveApp.getRootFolder(), 'HubChecklist Photos');
  const dateFolder = getOrCreateFolder_(root, new Date().toISOString().slice(0, 10));
  const vehicleFolder = getOrCreateFolder_(dateFolder, safeName_(photo.vehicleBarcode || 'unknown-vehicle'));
  return vehicleFolder;
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  if (folders.hasNext()) return folders.next();
  return parent.createFolder(name);
}

function appendAudit_(entry) {
  const sheet = getOrCreateSheet_(SHEETS.AUDIT);
  ensureHeaders_(sheet, HEADERS.Audit);
  const next = {
    id: entry.id || Utilities.getUuid(),
    recordId: entry.recordId || '',
    action: entry.action || '',
    detail: entry.detail || '',
    actor: entry.actor || '',
    createdAt: entry.createdAt || new Date().toISOString(),
  };
  sheet.appendRow(HEADERS.Audit.map(function (key) { return next[key]; }));
  return next;
}

function readRows_(sheetName) {
  const sheet = getOrCreateSheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0];
  return values.slice(1).filter(function (row) {
    return row.some(function (cell) { return cell !== ''; });
  }).map(function (row) {
    const item = {};
    headers.forEach(function (header, index) {
      item[header] = row[index];
    });
    return item;
  });
}

function readRowObject_(sheet, rowIndex) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  const item = {};
  headers.forEach(function (header, index) {
    item[header] = values[index];
  });
  return item;
}

function findRowByValue_(sheet, columnIndex, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, columnIndex, lastRow - 1, 1).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === String(value)) return index + 2;
  }
  return -1;
}

function findPhotoRow_(sheet, recordId, slotId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, 2, lastRow - 1, 3).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === String(recordId) && String(values[index][2]) === String(slotId)) return index + 2;
  }
  return -1;
}

function findRowByRecordNote_(sheet, recordId) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const notes = sheet.getRange(2, 1, lastRow - 1, 1).getNotes();
  for (let index = 0; index < notes.length; index += 1) {
    if (String(notes[index][0]) === String(recordId)) return index + 2;
  }
  return -1;
}

function hubText_(record) {
  return `${record.hubCode || ''}-${record.hubName || ''}`.replace(/-$/, '');
}

function responsibleText_(record) {
  return `${record.responsibleEmployeeCode || ''} ${record.responsibleName || ''}`.trim();
}

function hubSheetName_(record) {
  const base = hubText_(record) || 'Unknown Hub';
  const sanitized = base.replace(/[\\/?*\[\]:]/g, ' ').replace(/\s+/g, ' ').trim();
  return sanitized.slice(0, 90) || 'Unknown Hub';
}

function getOrCreateSheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from a Google Sheet or bind it to one');
  return spreadsheet.getSheetByName(name) || spreadsheet.insertSheet(name);
}

function safeName_(value) {
  return String(value).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\s+/g, '_');
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
