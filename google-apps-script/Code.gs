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

const BANGKOK_TIME_ZONE = 'Asia/Bangkok';
const APP_VERSION = 'RESET-009A';
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
  Records_All: SIMPLE_RECORD_HEADERS.concat([
    'recordId',
    'hubCode',
    'responsibleEmployeeCode',
    'responsibleName',
    'statusInternal',
    'duplicateKey',
    'duplicateOfRecordId',
    'duplicateReason',
    'syncStatus',
    'createdAt',
    'updatedAt',
  ]),
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
  Hubs: ['hubCode', 'hubName', 'active', 'note'],
  ResponsibleStaff: ['employeeCode', 'employeeName', 'hubCode', 'active', 'note'],
  Audit: ['id', 'recordId', 'action', 'message', 'detail', 'detailJson', 'actor', 'createdAt'],
  Settings: ['key', 'value', 'note', 'updatedAt'],
  AdminDevices: ['deviceId', 'deviceName', 'ownerName', 'role', 'status', 'approvedAt', 'revokedAt', 'lastLoginAt', 'note'],
  ExportLogs: ['id', 'action', 'detail', 'actor', 'createdAt'],
};

function doGet() {
  const repair = ensureStorageReady();
  const settings = readSettingsMap_();
  return json_({
    ok: true,
    appName: 'Hub Photo Proof',
    version: APP_VERSION,
    serverTimeBangkok: formatBangkokDateTime_(new Date()),
    requiredSheetsReady: repair.ok === true,
    adminPinSet: String(settings.ADMIN_PIN_SET).toLowerCase() === 'true' || Boolean(settings.ADMIN_PIN_HASH),
    message: 'API พร้อมใช้งาน',
  });
}

function doPost(e) {
  try {
    const request = parseRequest_(e);
    ensureStorageReady();

    switch (request.action) {
      case 'health':
      case 'healthCheck':
        return json_({ ok: true, appName: 'Hub Photo Proof', version: APP_VERSION, serverTimeBangkok: formatBangkokDateTime_(new Date()), message: 'API พร้อมใช้งาน' });
      case 'initOrRepairStorage':
        return json_(ensureStorageReady());
      case 'bootstrap':
      case 'getBootstrapData':
        return json_(bootstrap_(request.payload));
      case 'getSettings':
      case 'getAppSettings':
        return json_({ ok: true, appSettings: safeSettings_() });
      case 'updateSetting':
        return json_(updateSettingFromAdmin_(request.payload));
      case 'findRecordByKey':
        return json_(findRecordByKey_(request.payload));
      case 'upsertRecordByKey':
      case 'saveRecord':
        return json_({ ok: true, result: syncRecord_(request.payload.record || request.payload, request.payload.photoMetadata || []) });
      case 'createRecord':
      case 'syncRecord':
        return json_({ ok: true, result: syncRecord_(request.payload.record, request.payload.photoMetadata || []) });
      case 'savePhotoMetadata':
      case 'uploadPhotoMetadata':
        return json_({ ok: true, result: upsertPhoto_(request.payload) });
      case 'syncBatch':
        return json_(syncBatch_(request.payload));
      case 'getMyWork':
        return json_(getMyWork_(request.payload));
      case 'getHubs':
        return json_({ ok: true, hubs: readActiveHubs_() });
      case 'upsertHub':
        return json_(upsertHub_(request.payload));
      case 'deactivateHub':
        return json_(deactivateHub_(request.payload));
      case 'getResponsibleStaff':
        return json_({ ok: true, responsibleStaff: readActiveResponsibleStaff_() });
      case 'upsertResponsibleStaff':
        return json_(upsertResponsibleStaff_(request.payload));
      case 'deactivateResponsibleStaff':
        return json_(deactivateResponsibleStaff_(request.payload));
      case 'getRecords':
        return json_({ ok: true, records: readRows_(SHEETS.RECORDS_ALL) });
      case 'appendAudit':
      case 'logAudit':
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
        return json_({ ok: false, message: 'ไม่พบคำสั่งนี้', errorCode: 'UNKNOWN_ACTION' });
    }
  } catch (error) {
    return json_({ ok: false, message: 'ดำเนินการไม่สำเร็จ', errorCode: error && error.message ? String(error.message).slice(0, 80) : 'UNKNOWN_ERROR' });
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

function ensureStorageReady() {
  const result = {
    ok: true,
    message: 'ตรวจสอบและซ่อมโครงสร้างชีทเรียบร้อย',
    sheetsCreated: [],
    headersRepaired: [],
    settingsUpdated: [],
  };
  Object.keys(HEADERS).forEach(function (sheetName) {
    const sheet = getOrCreateSheet_(sheetName, result);
    const repaired = ensureHeaders_(sheet, HEADERS[sheetName]);
    if (repaired) result.headersRepaired.push(sheetName);
  });
  ensureDefaultSettings_(result);
  return result;
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    return true;
  }
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  const firstRow = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const missing = headers.filter(function (header) { return firstRow.indexOf(header) < 0; });
  if (missing.length > 0) {
    sheet.getRange(1, firstRow.length + 1, 1, missing.length).setValues([missing]);
    return true;
  }
  return false;
}

function ensureDefaultSettings_(result) {
  const sheet = getOrCreateSheet_(SHEETS.SETTINGS);
  ensureHeaders_(sheet, HEADERS.Settings);
  upsertSettingDefault_(sheet, 'ADMIN_PIN_ENABLED', 'false', result);
  upsertSettingDefault_(sheet, 'ADMIN_PIN_HASH', '', result);
  upsertSettingDefault_(sheet, 'ADMIN_PIN_SET', 'false', result);
  upsertSettingDefault_(sheet, 'REQUIRE_ADMIN_DEVICE_APPROVAL', 'false', result);
  upsertSettingDefault_(sheet, 'APP_VERSION', APP_VERSION, result);
  upsertSettingDefault_(sheet, 'MINIMUM_APP_VERSION', '0.1.0', result);
  upsertSettingDefault_(sheet, 'GPS_MANDATORY', 'false', result);
  upsertSettingDefault_(sheet, 'WATERMARK_ENABLED', 'true', result);
}

function upsertSettingDefault_(sheet, key, value, result) {
  const rowIndex = findRowByValue_(sheet, 1, key);
  if (rowIndex > 0) return;
  sheet.appendRow([key, value, '', formatBangkokDateTime_(new Date())]);
  if (result) result.settingsUpdated.push(key);
}

function upsertSetting_(key, value) {
  const sheet = getOrCreateSheet_(SHEETS.SETTINGS);
  ensureHeaders_(sheet, HEADERS.Settings);
  const rowIndex = findRowByValue_(sheet, 1, key);
  const row = [key, value, '', formatBangkokDateTime_(new Date())];
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
    serverTime: formatBangkokDateTime_(new Date()),
    serverTimeBangkok: formatBangkokDateTime_(new Date()),
    appVersion: APP_VERSION,
    appSettings: safeSettings_(),
    hubs: readActiveHubs_(),
    responsibleStaff: readActiveResponsibleStaff_(),
    adminAuthEnabled: String(settings.ADMIN_PIN_ENABLED).toLowerCase() === 'true' && Boolean(settings.ADMIN_PIN_HASH),
    minimumAppVersion: settings.MINIMUM_APP_VERSION || '0.1.0',
    deviceId: payload && payload.deviceId ? payload.deviceId : '',
  };
}

function safeSettings_() {
  const settings = readSettingsMap_();
  return {
    ADMIN_PIN_ENABLED: settings.ADMIN_PIN_ENABLED || 'false',
    ADMIN_PIN_SET: settings.ADMIN_PIN_SET || (settings.ADMIN_PIN_HASH ? 'true' : 'false'),
    REQUIRE_ADMIN_DEVICE_APPROVAL: settings.REQUIRE_ADMIN_DEVICE_APPROVAL || 'false',
    APP_VERSION: settings.APP_VERSION || APP_VERSION,
    MINIMUM_APP_VERSION: settings.MINIMUM_APP_VERSION || '0.1.0',
    GPS_REQUIRED: settings.GPS_REQUIRED || settings.GPS_MANDATORY || 'false',
    GPS_MANDATORY: settings.GPS_MANDATORY || 'false',
    WATERMARK_ENABLED: settings.WATERMARK_ENABLED || 'true',
  };
}

function updateSettingFromAdmin_(payload) {
  if (!payload || !payload.key) throw new Error('Missing setting key');
  const key = String(payload.key).trim().toUpperCase();
  const allowed = {
    GPS_REQUIRED: true,
    GPS_MANDATORY: true,
    WATERMARK_ENABLED: true,
    REQUIRE_ADMIN_DEVICE_APPROVAL: true,
    MINIMUM_APP_VERSION: true,
  };
  if (!allowed[key]) throw new Error('Setting is not editable from UI');
  const value = normalizeSettingValue_(key, payload.value);
  upsertSetting_(key, value);
  if (key === 'GPS_REQUIRED') upsertSetting_('GPS_MANDATORY', value);
  if (key === 'GPS_MANDATORY') upsertSetting_('GPS_REQUIRED', value);
  appendAudit_({
    action: 'setting_update',
    message: 'Admin setting updated',
    detailJson: JSON.stringify({ key: key, value: value }),
    actor: payload.actor || payload.deviceId || 'admin',
    createdAt: formatBangkokDateTime_(new Date()),
  });
  return { ok: true, message: 'บันทึกลงระบบกลางแล้ว', appSettings: safeSettings_() };
}

function normalizeSettingValue_(key, value) {
  if (key === 'MINIMUM_APP_VERSION') return String(value || '').trim();
  return value === true || String(value).toLowerCase() === 'true' ? 'true' : 'false';
}

function readActiveHubs_() {
  return readRows_(SHEETS.HUBS).filter(function (hub) {
    return isActive_(hub.active);
  });
}

function readActiveResponsibleStaff_() {
  return readRows_(SHEETS.RESPONSIBLE_STAFF).filter(function (staff) {
    return isActive_(staff.active);
  });
}

function upsertHub_(payload) {
  if (!payload || !payload.hubCode) throw new Error('Missing hubCode');
  const sheet = getOrCreateSheet_(SHEETS.HUBS);
  ensureHeaders_(sheet, HEADERS.Hubs);
  const hubCode = String(payload.hubCode).trim();
  const values = {
    hubCode: hubCode,
    hubName: String(payload.hubName || '').trim(),
    active: payload.active === false || String(payload.active).toLowerCase() === 'false' ? 'FALSE' : 'TRUE',
    note: payload.note || '',
  };
  const headers = getSheetHeaders_(sheet);
  const row = rowForHeaders_(headers, values);
  const rowIndex = findRowByHeaderValue_(sheet, 'hubCode', hubCode);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  appendAudit_({
    action: 'hub_upsert',
    message: 'Hub saved',
    detailJson: JSON.stringify(values),
    actor: payload.actor || payload.deviceId || 'admin',
    createdAt: formatBangkokDateTime_(new Date()),
  });
  return { ok: true, message: 'บันทึกลงระบบกลางแล้ว', hubs: readActiveHubs_() };
}

function deactivateHub_(payload) {
  const hubCode = String(payload && payload.hubCode ? payload.hubCode : '').trim();
  if (!hubCode) throw new Error('Missing hubCode');
  const sheet = getOrCreateSheet_(SHEETS.HUBS);
  ensureHeaders_(sheet, HEADERS.Hubs);
  const rowIndex = findRowByHeaderValue_(sheet, 'hubCode', hubCode);
  if (rowIndex < 0) throw new Error('Hub not found');
  const existing = readRowObject_(sheet, rowIndex);
  existing.active = 'FALSE';
  existing.note = payload.note || existing.note || '';
  const row = rowForHeaders_(getSheetHeaders_(sheet), existing);
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  appendAudit_({
    action: 'hub_deactivate',
    message: 'Hub deactivated',
    detailJson: JSON.stringify({ hubCode: hubCode }),
    actor: payload.actor || payload.deviceId || 'admin',
    createdAt: formatBangkokDateTime_(new Date()),
  });
  return { ok: true, message: 'บันทึกลงระบบกลางแล้ว', hubs: readActiveHubs_() };
}

function upsertResponsibleStaff_(payload) {
  if (!payload || !payload.employeeCode || !payload.hubCode) throw new Error('Missing employeeCode or hubCode');
  const sheet = getOrCreateSheet_(SHEETS.RESPONSIBLE_STAFF);
  ensureHeaders_(sheet, HEADERS.ResponsibleStaff);
  const values = {
    employeeCode: String(payload.employeeCode).trim(),
    employeeName: String(payload.employeeName || payload.displayName || '').trim(),
    hubCode: String(payload.hubCode).trim(),
    active: payload.active === false || String(payload.active).toLowerCase() === 'false' ? 'FALSE' : 'TRUE',
    note: payload.note || '',
  };
  const headers = getSheetHeaders_(sheet);
  const row = rowForHeaders_(headers, values);
  const rowIndex = findResponsibleStaffRow_(sheet, values.employeeCode, values.hubCode);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  appendAudit_({
    action: 'responsible_upsert',
    message: 'Responsible staff saved',
    detailJson: JSON.stringify(values),
    actor: payload.actor || payload.deviceId || 'admin',
    createdAt: formatBangkokDateTime_(new Date()),
  });
  return { ok: true, message: 'บันทึกลงระบบกลางแล้ว', responsibleStaff: readActiveResponsibleStaff_() };
}

function deactivateResponsibleStaff_(payload) {
  const employeeCode = String(payload && payload.employeeCode ? payload.employeeCode : '').trim();
  const hubCode = String(payload && payload.hubCode ? payload.hubCode : '').trim();
  if (!employeeCode || !hubCode) throw new Error('Missing employeeCode or hubCode');
  const sheet = getOrCreateSheet_(SHEETS.RESPONSIBLE_STAFF);
  ensureHeaders_(sheet, HEADERS.ResponsibleStaff);
  const rowIndex = findResponsibleStaffRow_(sheet, employeeCode, hubCode);
  if (rowIndex < 0) throw new Error('Responsible staff not found');
  const existing = readRowObject_(sheet, rowIndex);
  existing.active = 'FALSE';
  existing.note = payload.note || existing.note || '';
  const row = rowForHeaders_(getSheetHeaders_(sheet), existing);
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  appendAudit_({
    action: 'responsible_deactivate',
    message: 'Responsible staff deactivated',
    detailJson: JSON.stringify({ employeeCode: employeeCode, hubCode: hubCode }),
    actor: payload.actor || payload.deviceId || 'admin',
    createdAt: formatBangkokDateTime_(new Date()),
  });
  return { ok: true, message: 'บันทึกลงระบบกลางแล้ว', responsibleStaff: readActiveResponsibleStaff_() };
}

function findResponsibleStaffRow_(sheet, employeeCode, hubCode) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const headers = getSheetHeaders_(sheet);
  const employeeColumn = headers.indexOf('employeeCode') + 1;
  const hubColumn = headers.indexOf('hubCode') + 1;
  if (employeeColumn <= 0 || hubColumn <= 0) return -1;
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][employeeColumn - 1]) === String(employeeCode)
      && String(values[index][hubColumn - 1]) === String(hubCode)) {
      return index + 2;
    }
  }
  return -1;
}

function isActive_(value) {
  if (value === false) return false;
  return String(value === undefined || value === null || value === '' ? 'TRUE' : value).toLowerCase() === 'true';
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
  record.duplicateKey = duplicateKey_(record);
  const photoResults = (photoMetadata || []).map(function (photo) {
    return upsertPhoto_(photo);
  });
  const row = buildSimpleRecordRow_(record, photoResults);
  const masterResult = upsertRecordAll_(record, row);
  const hubResult = upsertHubSheet_(record, row.slice(0, SIMPLE_RECORD_HEADERS.length));
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
    statusText_(record.status || ''),
    photoCell_(photoMap.REAR_MAIN),
    photoCell_(photoMap.FRONT_DROP),
    photoCell_(photoMap.DROP_REAR_1),
    photoCell_(photoMap.DROP_REAR_2),
    extras.map(photoCell_).filter(Boolean).join('\n') || MISSING_PHOTO_TEXT,
    (record.missingPhotoWarnings || []).join(', '),
    formatBangkokDateTime_(record.submittedAt),
    record.notes || '',
    record.id || '',
    record.hubCode || '',
    record.responsibleEmployeeCode || '',
    record.responsibleName || '',
    record.status || '',
    record.duplicateKey || duplicateKey_(record),
    record.duplicateOfRecordId || '',
    record.duplicateReason || '',
    record.syncStatus || '',
    formatBangkokDateTime_(record.createdAt),
    formatBangkokDateTime_(record.updatedAt || new Date()),
  ];
}

function upsertRecordAll_(record, simpleRow) {
  const sheet = getOrCreateSheet_(SHEETS.RECORDS_ALL);
  ensureHeaders_(sheet, HEADERS.Records_All);
  const headers = getSheetHeaders_(sheet);
  const row = rowForHeaders_(headers, simpleRowToObject_(record, simpleRow));
  let rowIndex = findRowByHeaderValue_(sheet, 'recordId', record.id);
  if (rowIndex < 0 && !record.forceCreateNew) rowIndex = findRowByHeaderValue_(sheet, 'duplicateKey', record.duplicateKey || duplicateKey_(record));
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return { id: record.id, action: 'updated', sheet: SHEETS.RECORDS_ALL };
  }
  if (record.forceCreateNew && !record.duplicateReason) throw new Error('Duplicate reason is required');
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
  const headers = getSheetHeaders_(sheet);
  const row = rowForHeaders_(headers, values);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
  } else {
    sheet.appendRow(row);
  }
  return values;
}

function findRecordByKey_(payload) {
  const key = duplicateKeyFromValues_(payload || {});
  const sheet = getOrCreateSheet_(SHEETS.RECORDS_ALL);
  ensureHeaders_(sheet, HEADERS.Records_All);
  let rowIndex = findRowByHeaderValue_(sheet, 'duplicateKey', key);
  if (rowIndex < 0) rowIndex = findRecordRowByParts_(sheet, payload || {});
  if (rowIndex < 0) {
    return { ok: true, found: false, message: 'ไม่พบงานเดิม', duplicateKey: key };
  }
  const row = readRowObject_(sheet, rowIndex);
  const statusInternal = row.statusInternal || internalStatusFromThai_(row['สถานะ']);
  return {
    ok: true,
    found: true,
    message: 'พบงานเดิม',
    recordId: row.recordId || '',
    record: row,
    status: statusInternal,
    statusText: statusText_(statusInternal),
    missingPhotoSlots: String(row['รายการรูปที่ขาด'] || '').split(',').map(function (item) { return item.trim(); }).filter(Boolean),
    submittedAt: row['เวลาส่งข้อมูล'] || '',
    syncStatus: row.syncStatus || '',
    duplicateKey: key,
  };
}

function getMyWork_(payload) {
  const rows = readRows_(SHEETS.RECORDS_ALL);
  const date = payload && payload.date ? String(payload.date) : '';
  const hubCode = payload && payload.hubCode ? String(payload.hubCode) : '';
  const employeeCode = payload && payload.responsibleEmployeeCode ? String(payload.responsibleEmployeeCode) : '';
  return {
    ok: true,
    records: rows.filter(function (row) {
      return (!date || row['วันที่'] === date)
        && (!hubCode || row.hubCode === hubCode || String(row['ฮับ'] || '').indexOf(hubCode) === 0)
        && (!employeeCode || row.responsibleEmployeeCode === employeeCode || String(row['ผู้รับผิดชอบ'] || '').indexOf(employeeCode) === 0);
    }),
  };
}

function syncBatch_(payload) {
  const records = payload && payload.records ? payload.records : [];
  const results = records.map(function (item) {
    return syncRecord_(item.record || item, item.photoMetadata || []);
  });
  return { ok: true, message: 'ซิงก์ข้อมูลเรียบร้อย', results: results };
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
    capturedAt: formatBangkokDateTime_(photo.capturedAt),
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
    createdAt: existing && existing.createdAt ? existing.createdAt : formatBangkokDateTime_(new Date()),
  };
}

function simpleRowToObject_(record, row) {
  const values = {};
  HEADERS.Records_All.forEach(function (header, index) {
    values[header] = row[index] || '';
  });
  values.recordId = record.id || values.recordId || Utilities.getUuid();
  values.hubCode = record.hubCode || values.hubCode || '';
  values.responsibleEmployeeCode = record.responsibleEmployeeCode || values.responsibleEmployeeCode || '';
  values.responsibleName = record.responsibleName || values.responsibleName || '';
  values.statusInternal = record.status || values.statusInternal || '';
  values.duplicateKey = record.duplicateKey || duplicateKey_(record);
  values.duplicateOfRecordId = record.duplicateOfRecordId || '';
  values.duplicateReason = record.duplicateReason || '';
  values.syncStatus = record.syncStatus || values.syncStatus || '';
  values.createdAt = formatBangkokDateTime_(record.createdAt);
  values.updatedAt = formatBangkokDateTime_(record.updatedAt || new Date());
  return values;
}

function rowForHeaders_(headers, values) {
  return headers.map(function (header) { return values[header] || ''; });
}

function duplicateKey_(record) {
  return duplicateKeyFromValues_({
    date: record.date,
    hubCode: record.hubCode,
    responsibleEmployeeCode: record.responsibleEmployeeCode,
    vehicleBarcode: record.vehicleBarcode,
  });
}

function duplicateKeyFromValues_(values) {
  return [
    values.date || values['วันที่'] || '',
    values.hubCode || extractHubCode_(values['ฮับ']) || '',
    values.responsibleEmployeeCode || extractEmployeeCode_(values['ผู้รับผิดชอบ']) || '',
    values.vehicleBarcode || values['บาร์โค้ดรถ'] || '',
  ].map(function (part) { return String(part).trim().toUpperCase(); }).join('|');
}

function extractHubCode_(value) {
  return String(value || '').split('-')[0].trim();
}

function extractEmployeeCode_(value) {
  return String(value || '').trim().split(/\s+/)[0] || '';
}

function findRowByHeaderValue_(sheet, header, value) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
  const columnIndex = headers.indexOf(header) + 1;
  if (columnIndex <= 0 || !value) return -1;
  return findRowByValue_(sheet, columnIndex, value);
}

function findRecordRowByParts_(sheet, values) {
  const rows = readRows_(SHEETS.RECORDS_ALL);
  const key = duplicateKeyFromValues_(values);
  for (let index = 0; index < rows.length; index += 1) {
    if (duplicateKeyFromValues_(rows[index]) === key) return index + 2;
  }
  return -1;
}

function formatBangkokDateTime_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, BANGKOK_TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
  }
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (!isNaN(date.getTime())) return Utilities.formatDate(date, BANGKOK_TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
  return text;
}

function statusText_(status) {
  if (status === 'DRAFT') return 'เริ่มทำแต่ยังไม่ส่ง';
  if (status === 'IN_PROGRESS') return 'กำลังถ่ายรูป';
  if (status === 'COMPLETE') return 'ส่งครบแล้ว';
  if (status === 'NEED_REVIEW') return 'ส่งแล้วแต่รูปไม่ครบ';
  if (status === 'PENDING_SYNC') return 'บันทึกแล้ว รอซิงก์';
  if (status === 'SYNCED') return 'ซิงก์แล้ว';
  if (status === 'VOIDED') return 'ยกเลิก';
  return status || '';
}

function internalStatusFromThai_(value) {
  const text = String(value || '');
  if (text === 'เริ่มทำแต่ยังไม่ส่ง') return 'DRAFT';
  if (text === 'กำลังถ่ายรูป') return 'IN_PROGRESS';
  if (text === 'ส่งแล้วแต่รูปไม่ครบ') return 'NEED_REVIEW';
  if (text === 'ส่งครบแล้ว' || text === 'เสร็จแล้ว') return 'COMPLETE';
  if (text === 'ยกเลิก') return 'VOIDED';
  return text;
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
    message: entry.message || entry.detail || '',
    detail: entry.detail || entry.message || '',
    detailJson: entry.detailJson || '',
    actor: entry.actor || '',
    createdAt: entry.createdAt || formatBangkokDateTime_(new Date()),
  };
  sheet.appendRow(rowForHeaders_(getSheetHeaders_(sheet), next));
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

function getSheetHeaders_(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String);
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

function getOrCreateSheet_(name, result) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open this script from a Google Sheet or bind it to one');
  const existing = spreadsheet.getSheetByName(name);
  if (existing) return existing;
  const created = spreadsheet.insertSheet(name);
  if (result) result.sheetsCreated.push(name);
  return created;
}

function safeName_(value) {
  return String(value).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\s+/g, '_');
}

function json_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
