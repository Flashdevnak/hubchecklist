const APP_VERSION = 'RESET-011';
const TIME_ZONE = 'Asia/Bangkok';

const SHEETS = {
  HUBS: 'Hubs',
  RESPONSIBLE_STAFF: 'ResponsibleStaff',
  RECORDS: 'Records_All',
  PHOTOS: 'Photos',
  SETTINGS: 'Settings',
  AUDIT: 'Audit',
  EXPORT_LOGS: 'ExportLogs',
  ADMIN_DEVICES: 'AdminDevices',
};

const HEADERS = {
  Hubs: ['hubCode', 'hubName', 'active', 'note', 'updatedAt'],
  ResponsibleStaff: ['employeeCode', 'employeeName', 'hubCode', 'active', 'note', 'updatedAt'],
  Records_All: [
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
    'รูปหลังรถพ่วงเพิ่ม',
    'รายการรูปที่ขาด',
    'เวลาส่งข้อมูล',
    'หมายเหตุ',
    'recordId',
    'duplicateKey',
    'syncStatus',
    'updatedAt',
    'hubCode',
    'responsibleEmployeeCode',
    'responsibleName',
    'photoRequiredCount',
    'photoDoneCount',
    'submittedAt',
    'syncedAt',
    'createdAt',
    'duplicateOfRecordId',
    'duplicateReason',
    'date',
    'vehicleBarcode',
    'dropType',
    'dropCount',
    'statusInternal',
    'note',
  ],
  Photos: [
    'photoId',
    'recordId',
    'duplicateKey',
    'vehicleBarcode',
    'slotId',
    'slotType',
    'labelThai',
    'capturedAt',
    'fileName',
    'driveFileId',
    'driveUrl',
    'imagePreviewUrl',
    'imagePreview',
    'imageFormula',
    'gpsLat',
    'gpsLng',
    'gpsAccuracy',
    'gpsStatus',
    'addressText',
    'watermarkText',
    'hub',
    'responsible',
    'createdAt',
    'updatedAt',
    'date',
    'hubCode',
    'responsibleEmployeeCode',
    'watermarkApplied',
  ],
  Settings: ['key', 'value', 'updatedAt', 'note'],
  Audit: ['auditId', 'action', 'message', 'recordId', 'actor', 'detailJson', 'createdAt'],
  ExportLogs: ['logId', 'action', 'message', 'actor', 'detailJson', 'createdAt'],
  AdminDevices: ['deviceId', 'deviceName', 'ownerName', 'role', 'status', 'approvedAt', 'revokedAt', 'lastLoginAt', 'note'],
};

function doGet() {
  const repair = initOrRepairStorage_();
  return respond_(true, 'API พร้อมใช้งาน', {
    appName: 'Hub Photo Proof',
    apiVersion: APP_VERSION,
    serverTime: bangkokNow_(),
    storageReady: repair.ok,
  });
}

function doPost(e) {
  try {
    const request = parseRequest_(e);
    initOrRepairStorage_();
    const action = String(request.action || '');
    const payload = request.payload || {};
    switch (action) {
      case 'health':
      case 'healthCheck':
        return respond_(true, 'ระบบกลางพร้อมใช้งาน', health_());
      case 'initOrRepairStorage':
        return respond_(true, 'ตรวจสอบและซ่อมชีทเรียบร้อย', initOrRepairStorage_());
      case 'getBootstrapData':
      case 'bootstrap':
        return respond_(true, 'ดึงข้อมูลล่าสุดแล้ว', getBootstrapData_());
      case 'getHubs':
        return respond_(true, 'ดึงฮับแล้ว', { hubs: activeRows_(SHEETS.HUBS) });
      case 'upsertHub':
        return respond_(true, 'บันทึกลงระบบกลางแล้ว', upsertHub_(payload));
      case 'deactivateHub':
        return respond_(true, 'บันทึกลงระบบกลางแล้ว', deactivateHub_(payload));
      case 'getResponsibleStaff':
        return respond_(true, 'ดึงผู้รับผิดชอบแล้ว', { responsibleStaff: activeRows_(SHEETS.RESPONSIBLE_STAFF) });
      case 'upsertResponsibleStaff':
        return respond_(true, 'บันทึกลงระบบกลางแล้ว', upsertResponsibleStaff_(payload));
      case 'deactivateResponsibleStaff':
        return respond_(true, 'บันทึกลงระบบกลางแล้ว', deactivateResponsibleStaff_(payload));
      case 'getSettings':
        return respond_(true, 'ดึงตั้งค่าแล้ว', { settings: safeSettings_() });
      case 'updateSetting':
        return respond_(true, 'บันทึกลงระบบกลางแล้ว', updateSetting_(payload));
      case 'updateSettingsBatch':
        return respond_(true, 'บันทึกลงระบบกลางแล้ว', updateSettingsBatch_(payload));
      case 'verifyAdminAccess':
        return respond_(true, 'ยืนยันผู้ดูแลแล้ว', verifyAdminAccess_(payload));
      case 'setAdminPin':
        return respond_(true, 'บันทึกลงระบบกลางแล้ว', setAdminPin_(payload));
      case 'getAdminAuthStatus':
        return respond_(true, 'ดึงสถานะผู้ดูแลแล้ว', getAdminAuthStatus_());
      case 'findRecordByKey':
        return respond_(true, 'ตรวจรายการซ้ำแล้ว', findRecordByKey_(payload));
      case 'upsertRecordByKey':
      case 'syncRecord':
      case 'createRecord':
      case 'saveRecord':
        return respond_(true, 'ซิงก์แล้ว', syncRecord_(payload.record || payload, payload.photoMetadata || []));
      case 'syncBatch':
        return respond_(true, 'ซิงก์ชุดข้อมูลแล้ว', syncBatch_(payload));
      case 'savePhotoMetadata':
      case 'uploadPhotoMetadata':
        return respond_(true, 'บันทึกรูปแล้ว', { photo: savePhotoMetadata_(payload) });
      case 'getMyWork':
        return respond_(true, 'ดึงงานของฉันแล้ว', { records: filterRecords_(payload) });
      case 'getRecords':
        return respond_(true, 'ดึงรายการแล้ว', { records: rows_(SHEETS.RECORDS) });
      case 'getHistory':
      case 'getRecordsByDateRange':
        return respond_(true, 'ดึงประวัติแล้ว', { records: filterRecords_(payload) });
      case 'getPhotos':
        return respond_(true, 'ดึงรูปภาพแล้ว', { photos: rows_(SHEETS.PHOTOS) });
      case 'logAudit':
      case 'appendAudit':
        return respond_(true, 'บันทึกประวัติแล้ว', { audit: logAudit_(payload) });
      default:
        return respond_(false, 'ไม่พบคำสั่งนี้', { action: action });
    }
  } catch (error) {
    return respond_(false, 'ดำเนินการไม่สำเร็จ', { errorCode: String(error && error.message ? error.message : error).slice(0, 120) });
  }
}

function health_() {
  return {
    appName: 'Hub Photo Proof',
    apiVersion: APP_VERSION,
    serverTime: bangkokNow_(),
    requiredSheets: Object.keys(SHEETS).map(function (key) { return SHEETS[key]; }),
  };
}

function getBootstrapData_() {
  return {
    apiVersion: APP_VERSION,
    serverTime: bangkokNow_(),
    hubs: activeRows_(SHEETS.HUBS),
    responsibleStaff: activeRows_(SHEETS.RESPONSIBLE_STAFF),
    settings: safeSettings_(),
  };
}

function initOrRepairStorage_() {
  const result = { ok: true, sheetsCreated: [], headersRepaired: [], settingsUpdated: [] };
  Object.keys(SHEETS).forEach(function (key) {
    const name = SHEETS[key];
    const sheet = getOrCreateSheet_(name, result);
    if (ensureHeaders_(sheet, HEADERS[name])) result.headersRepaired.push(name);
  });
  ensureDefaultSettings_(result);
  seedDefaultRows_();
  return result;
}

function upsertHub_(payload) {
  const hubCode = clean_(payload.hubCode).toUpperCase();
  if (!hubCode) throw new Error('Missing hubCode');
  const values = {
    hubCode: hubCode,
    hubName: clean_(payload.hubName),
    active: boolText_(payload.active !== false),
    note: clean_(payload.note),
    updatedAt: bangkokNow_(),
  };
  upsertByKey_(SHEETS.HUBS, 'hubCode', hubCode, values);
  logAudit_({ action: 'hub_upsert', message: 'บันทึกฮับ', actor: actor_(payload), detailJson: JSON.stringify(values) });
  return { hubs: activeRows_(SHEETS.HUBS) };
}

function deactivateHub_(payload) {
  const hubCode = clean_(payload.hubCode).toUpperCase();
  if (!hubCode) throw new Error('Missing hubCode');
  const sheet = sheet_(SHEETS.HUBS);
  const rowIndex = findRow_(sheet, 'hubCode', hubCode);
  if (rowIndex < 2) throw new Error('Hub not found');
  const row = rowObject_(sheet, rowIndex);
  row.active = 'FALSE';
  row.updatedAt = bangkokNow_();
  writeRow_(sheet, rowIndex, row);
  logAudit_({ action: 'hub_deactivate', message: 'ปิดใช้งานฮับ', actor: actor_(payload), detailJson: JSON.stringify({ hubCode: hubCode }) });
  return { hubs: activeRows_(SHEETS.HUBS) };
}

function upsertResponsibleStaff_(payload) {
  const employeeCode = clean_(payload.employeeCode);
  const hubCode = clean_(payload.hubCode).toUpperCase();
  if (!employeeCode || !hubCode) throw new Error('Missing employeeCode or hubCode');
  const values = {
    employeeCode: employeeCode,
    employeeName: clean_(payload.employeeName || payload.displayName),
    hubCode: hubCode,
    active: boolText_(payload.active !== false),
    note: clean_(payload.note),
    updatedAt: bangkokNow_(),
  };
  const sheet = sheet_(SHEETS.RESPONSIBLE_STAFF);
  const rowIndex = findResponsibleRow_(sheet, employeeCode, hubCode);
  if (rowIndex > 1) writeRow_(sheet, rowIndex, values);
  else sheet.appendRow(rowFor_(sheet, values));
  logAudit_({ action: 'responsible_upsert', message: 'บันทึกผู้รับผิดชอบ', actor: actor_(payload), detailJson: JSON.stringify(values) });
  return { responsibleStaff: activeRows_(SHEETS.RESPONSIBLE_STAFF) };
}

function deactivateResponsibleStaff_(payload) {
  const employeeCode = clean_(payload.employeeCode);
  const hubCode = clean_(payload.hubCode).toUpperCase();
  if (!employeeCode || !hubCode) throw new Error('Missing employeeCode or hubCode');
  const sheet = sheet_(SHEETS.RESPONSIBLE_STAFF);
  const rowIndex = findResponsibleRow_(sheet, employeeCode, hubCode);
  if (rowIndex < 2) throw new Error('Responsible staff not found');
  const row = rowObject_(sheet, rowIndex);
  row.active = 'FALSE';
  row.updatedAt = bangkokNow_();
  writeRow_(sheet, rowIndex, row);
  logAudit_({ action: 'responsible_deactivate', message: 'ปิดใช้งานผู้รับผิดชอบ', actor: actor_(payload), detailJson: JSON.stringify({ employeeCode: employeeCode, hubCode: hubCode }) });
  return { responsibleStaff: activeRows_(SHEETS.RESPONSIBLE_STAFF) };
}

function updateSetting_(payload) {
  const key = clean_(payload.key).toUpperCase();
  if (!isEditableSetting_(key)) throw new Error('Setting is not editable');
  const value = normalizeSettingValue_(key, payload.value);
  upsertSetting_(key, value, clean_(payload.note));
  if (key === 'GPS_REQUIRED') upsertSetting_('GPS_MANDATORY', value, '');
  if (key === 'GPS_MANDATORY') upsertSetting_('GPS_REQUIRED', value, '');
  logAudit_({ action: 'setting_update', message: 'บันทึกตั้งค่า', actor: actor_(payload), detailJson: JSON.stringify({ key: key, value: value }) });
  return { settings: safeSettings_() };
}

function updateSettingsBatch_(payload) {
  const settings = Array.isArray(payload.settings) ? payload.settings : [];
  settings.forEach(function (item) {
    updateSetting_(Object.assign({}, item, { actor: actor_(payload) }));
  });
  return { settings: safeSettings_() };
}

function verifyAdminAccess_(payload) {
  const settings = settingsMap_();
  const enabled = String(settings.ADMIN_PIN_ENABLED).toLowerCase() === 'true';
  const saved = settings.ADMIN_PIN_HASH || settings.ADMIN_PIN || '';
  if (!enabled || !saved) throw new Error('ยังไม่ได้ตั้งค่า PIN หลังบ้าน กรุณาติดต่อผู้ดูแล');
  if (hashPin_(clean_(payload.pin)) !== saved && clean_(payload.pin) !== saved) throw new Error('PIN ไม่ถูกต้อง');
  logAudit_({ action: 'admin_login', message: 'ผู้ดูแลเข้าสู่ระบบ', actor: actor_(payload), detailJson: '{}' });
  return { admin: true };
}

function setAdminPin_(payload) {
  const settings = settingsMap_();
  const currentHash = settings.ADMIN_PIN_HASH || settings.ADMIN_PIN || '';
  if (currentHash) {
    const currentPin = clean_(payload.currentPin);
    if (hashPin_(currentPin) !== currentHash && currentPin !== currentHash) throw new Error('PIN ปัจจุบันไม่ถูกต้อง');
  }
  const pin = clean_(payload.pin);
  if (pin.length < 4) throw new Error('PIN ต้องมีอย่างน้อย 4 ตัว');
  upsertSetting_('ADMIN_PIN_HASH', hashPin_(pin), 'ตั้งค่าโดยผู้ดูแล');
  upsertSetting_('ADMIN_PIN_ENABLED', 'true', '');
  upsertSetting_('ADMIN_PIN_SET', 'true', '');
  logAudit_({ action: 'admin_pin_set', message: 'ตั้งค่า PIN หลังบ้าน', actor: actor_(payload), detailJson: '{}' });
  return { adminPinSet: true };
}

function getAdminAuthStatus_() {
  const settings = settingsMap_();
  return {
    adminPinEnabled: String(settings.ADMIN_PIN_ENABLED).toLowerCase() === 'true',
    adminPinSet: Boolean(settings.ADMIN_PIN_HASH || settings.ADMIN_PIN),
  };
}

function findRecordByKey_(payload) {
  const key = duplicateKey_(payload);
  const sheet = sheet_(SHEETS.RECORDS);
  let rowIndex = findRow_(sheet, 'duplicateKey', key);
  if (rowIndex < 2) rowIndex = findRecordByParts_(sheet, payload);
  if (rowIndex < 2) return { found: false, duplicateKey: key };
  return { found: true, duplicateKey: key, record: rowObject_(sheet, rowIndex) };
}

function syncRecord_(record, photoMetadata) {
  if (!record) throw new Error('Missing record');
  const duplicateKey = clean_(record.duplicateKey) || duplicateKey_(record);
  const now = bangkokNow_();
  const incomingStatus = clean_(record.statusInternal || record.status);
  const finalStatus = incomingStatus === 'COMPLETE' ? 'SYNCED' : incomingStatus;
  const values = {
    recordId: clean_(record.recordId) || Utilities.getUuid(),
    duplicateKey: duplicateKey,
    date: clean_(record.date),
    'วันที่': clean_(record.date),
    hubCode: clean_(record.hubCode),
    'ฮับ': [clean_(record.hubCode), clean_(record.hubName)].filter(Boolean).join('-'),
    responsibleEmployeeCode: clean_(record.responsibleEmployeeCode),
    responsibleName: clean_(record.responsibleName),
    'ผู้รับผิดชอบ': [clean_(record.responsibleEmployeeCode), clean_(record.responsibleName)].filter(Boolean).join(' '),
    vehicleBarcode: clean_(record.vehicleBarcode).toUpperCase(),
    'บาร์โค้ดรถ': clean_(record.vehicleBarcode).toUpperCase(),
    dropType: clean_(record.dropType),
    'พ่วงดรอปหรือไม่': clean_(record.dropType) === 'DROP' ? 'พ่วงดรอป' : 'ไม่พ่วงดรอป',
    dropCount: Number(record.dropCount || 0),
    'จำนวนดรอป': Number(record.dropCount || 0),
    statusInternal: finalStatus,
    syncStatus: finalStatus === 'SYNCED' ? 'SYNCED' : '',
    'สถานะ': statusThai_(finalStatus),
    photoRequiredCount: Number(record.photoRequiredCount || 0),
    photoDoneCount: Number(record.photoDoneCount || 0),
    'รายการรูปที่ขาด': Array.isArray(record.missingPhotoLabels) ? record.missingPhotoLabels.join(', ') : clean_(record.missingPhotoLabels),
    submittedAt: formatBangkok_(record.submittedAt || now),
    syncedAt: now,
    createdAt: formatBangkok_(record.createdAt || now),
    updatedAt: now,
    duplicateOfRecordId: clean_(record.duplicateOfRecordId),
    duplicateReason: clean_(record.duplicateReason),
    note: clean_(record.note),
    'เวลาส่งข้อมูล': formatBangkok_(record.submittedAt || now),
    'หมายเหตุ': clean_(record.note),
  };
  upsertByKey_(SHEETS.RECORDS, 'duplicateKey', duplicateKey, values);
  (photoMetadata || []).forEach(function (photo) {
    savePhotoMetadata_(Object.assign({}, photo, {
      recordId: values.recordId,
      duplicateKey: duplicateKey,
      date: values.date,
      hubCode: values.hubCode,
      responsibleEmployeeCode: values.responsibleEmployeeCode,
      vehicleBarcode: values.vehicleBarcode,
      hub: values['ฮับ'],
      responsible: values['ผู้รับผิดชอบ'],
    }));
  });
  updateRecordPhotoColumns_(values.recordId, duplicateKey);
  const finalRowIndex = findRow_(sheet_(SHEETS.RECORDS), 'duplicateKey', duplicateKey);
  const finalRecord = finalRowIndex > 1 ? rowObject_(sheet_(SHEETS.RECORDS), finalRowIndex) : values;
  logAudit_({ action: 'record_sync', message: 'ซิงก์งาน', recordId: values.recordId, actor: values.responsibleEmployeeCode, detailJson: JSON.stringify({ duplicateKey: duplicateKey }) });
  return { record: finalRecord };
}

function syncBatch_(payload) {
  const records = Array.isArray(payload.records) ? payload.records : [];
  const results = records.map(function (item) {
    return syncRecord_(item.record || item, item.photoMetadata || []);
  });
  return { results: results };
}

function savePhotoMetadata_(photo) {
  if (!photo) throw new Error('Missing photo');
  const slotId = clean_(photo.slotId || photo.photoSlot);
  const slotType = clean_(photo.slotType);
  const labelThai = clean_(photo.labelThai || photo.photoType || photo.label);
  if (!slotId || !slotType || !labelThai) throw new Error('ข้อมูลประเภทรูปไม่ครบ กรุณาถ่ายรูปใหม่');
  const id = clean_(photo.photoId) || [photo.recordId, slotId].filter(Boolean).join('_') || Utilities.getUuid();
  const upload = uploadPhoto_(photo);
  const imageFormula = upload.imagePreviewUrl ? imageFormula_(upload.imagePreviewUrl, 100, 140) : clean_(photo.imageFormula);
  const values = {
    photoId: id,
    recordId: clean_(photo.recordId),
    duplicateKey: clean_(photo.duplicateKey),
    vehicleBarcode: clean_(photo.vehicleBarcode).toUpperCase(),
    slotId: slotId,
    slotType: slotType,
    labelThai: labelThai,
    capturedAt: formatBangkok_(photo.capturedAt),
    fileName: clean_(photo.fileName),
    driveFileId: upload.driveFileId,
    driveUrl: upload.driveUrl,
    imagePreviewUrl: upload.imagePreviewUrl,
    imagePreview: imageFormula,
    imageFormula: imageFormula,
    gpsLat: clean_(photo.gpsLat || photo.latitude),
    gpsLng: clean_(photo.gpsLng || photo.longitude),
    gpsAccuracy: clean_(photo.gpsAccuracy || photo.accuracy),
    gpsStatus: clean_(photo.gpsStatus),
    addressText: clean_(photo.addressText),
    watermarkText: clean_(photo.watermarkText),
    hub: clean_(photo.hub),
    responsible: clean_(photo.responsible),
    createdAt: bangkokNow_(),
    updatedAt: bangkokNow_(),
    date: clean_(photo.date),
    hubCode: clean_(photo.hubCode),
    responsibleEmployeeCode: clean_(photo.responsibleEmployeeCode),
    watermarkApplied: photo.watermarkApplied === true ? 'TRUE' : 'FALSE',
  };
  upsertPhotoByRecordSlot_(values);
  updateRecordPhotoColumns_(values.recordId, values.duplicateKey);
  return values;
}

function upsertPhotoByRecordSlot_(values) {
  const sheet = sheet_(SHEETS.PHOTOS);
  let rowIndex = findRow_(sheet, 'photoId', values.photoId);
  if (rowIndex < 2) rowIndex = findPhotoRowByRecordSlot_(sheet, values.recordId, values.slotId);
  if (rowIndex > 1) writeRow_(sheet, rowIndex, values);
  else sheet.appendRow(rowFor_(sheet, values));
}

function findPhotoRowByRecordSlot_(sheet, recordId, slotId) {
  const all = rows_(SHEETS.PHOTOS);
  for (let index = 0; index < all.length; index += 1) {
    if (clean_(all[index].recordId) === clean_(recordId) && clean_(all[index].slotId) === clean_(slotId)) return index + 2;
  }
  return -1;
}

function updateRecordPhotoColumns_(recordId, duplicateKey) {
  const sheet = sheet_(SHEETS.RECORDS);
  let rowIndex = findRow_(sheet, 'recordId', clean_(recordId));
  if (rowIndex < 2) rowIndex = findRow_(sheet, 'duplicateKey', clean_(duplicateKey));
  if (rowIndex < 2) return;

  const record = rowObject_(sheet, rowIndex);
  const photos = rows_(SHEETS.PHOTOS).filter(function (photo) {
    return (recordId && clean_(photo.recordId) === clean_(recordId))
      || (duplicateKey && clean_(photo.duplicateKey) === clean_(duplicateKey));
  });
  const columnValues = photoColumnValues_(record, photos);
  Object.keys(columnValues).forEach(function (header) {
    setCellByHeader_(sheet, rowIndex, header, columnValues[header]);
  });
  setCellByHeader_(sheet, rowIndex, 'photoDoneCount', photos.filter(function (photo) { return clean_(photo.driveUrl) || clean_(photo.imagePreviewUrl); }).length);
  setCellByHeader_(sheet, rowIndex, 'updatedAt', bangkokNow_());
}

function photoColumnValues_(record, photos) {
  const bySlot = {};
  photos.forEach(function (photo) {
    const slotId = clean_(photo.slotId);
    const slotType = clean_(photo.slotType);
    const cell = clean_(photo.imageFormula) || clean_(photo.imagePreview) || clean_(photo.driveUrl);
    if (!cell) return;
    if (slotId === 'rear' || slotType === 'REAR' || slotType === 'REAR_MAIN') bySlot.rear = cell;
    if (slotId === 'dropFront' || slotType === 'DROP_FRONT' || slotType === 'FRONT_DROP') bySlot.dropFront = cell;
    if (slotId === 'mainRear' || slotType === 'MAIN_REAR') bySlot.mainRear = cell;
    if (slotId === 'trailerRear1') bySlot.trailerRear1 = cell;
    else if (slotId === 'trailerRear2') bySlot.trailerRear2 = cell;
    else if (slotType === 'DROP_REAR_1') bySlot.trailerRear1 = cell;
    else if (slotType === 'DROP_REAR_2') bySlot.trailerRear2 = cell;
    else if (slotType === 'DROP_REAR_EXTRA') bySlot.extra = bySlot.extra || cell;
    else if (slotType === 'TRAILER_REAR' && !bySlot.trailerRear1) bySlot.trailerRear1 = cell;
    else if (slotType === 'TRAILER_REAR' && !bySlot.trailerRear2) bySlot.trailerRear2 = cell;
    if (slotId.indexOf('trailerRearExtra') === 0 || slotType === 'TRAILER_REAR_EXTRA') bySlot.extra = bySlot.extra || cell;
  });

  const isDrop = clean_(record.dropType) === 'DROP' || clean_(record['พ่วงดรอปหรือไม่']).indexOf('พ่วง') >= 0;
  const missing = [];
  if (isDrop) {
    if (!bySlot.mainRear) missing.push('รูปหลังรถหลัก');
    if (!bySlot.trailerRear1) missing.push('รูปหลังรถพ่วง 1');
    if (!bySlot.trailerRear2) missing.push('รูปหลังรถพ่วง 2');
  } else {
    if (!bySlot.rear) missing.push('รูปหลังรถ');
    if (!bySlot.dropFront) missing.push('รูปหน้าดรอป');
  }

  return {
    'รูปหลังรถ': isDrop ? (bySlot.mainRear || '') : (bySlot.rear || ''),
    'รูปหน้าดรอป': isDrop ? '' : (bySlot.dropFront || ''),
    'รูปหลังรถพ่วงที่ 1': bySlot.trailerRear1 || '',
    'รูปหลังรถพ่วงที่ 2': bySlot.trailerRear2 || '',
    'รูปหลังรถพ่วงเพิ่ม': bySlot.extra || '',
    'รายการรูปที่ขาด': missing.join(', '),
  };
}

function setCellByHeader_(sheet, rowIndex, header, value) {
  const column = headers_(sheet).indexOf(header) + 1;
  if (column <= 0) return;
  sheet.getRange(rowIndex, column).setValue(value);
}

function filterRecords_(payload) {
  const rows = rows_(SHEETS.RECORDS);
  const date = clean_(payload.date);
  const from = clean_(payload.dateFrom);
  const to = clean_(payload.dateTo);
  const hubCode = clean_(payload.hubCode);
  const employeeCode = clean_(payload.responsibleEmployeeCode);
  const barcode = clean_(payload.vehicleBarcode).toUpperCase();
  const status = clean_(payload.status);
  return rows.filter(function (row) {
    const rowDate = clean_(row.date || row['วันที่']);
    const rowBarcode = clean_(row.vehicleBarcode || row['บาร์โค้ดรถ']).toUpperCase();
    return (!date || rowDate === date)
      && (!from || rowDate >= from)
      && (!to || rowDate <= to)
      && (!hubCode || clean_(row.hubCode) === hubCode)
      && (!employeeCode || clean_(row.responsibleEmployeeCode) === employeeCode)
      && (!barcode || rowBarcode.indexOf(barcode) >= 0)
      && (!status || clean_(row.statusInternal) === status || clean_(row['สถานะ']) === status);
  });
}

function safeSettings_() {
  const map = settingsMap_();
  return {
    ADMIN_PIN_ENABLED: map.ADMIN_PIN_ENABLED || 'false',
    ADMIN_PIN_SET: map.ADMIN_PIN_SET || (map.ADMIN_PIN_HASH || map.ADMIN_PIN ? 'true' : 'false'),
    REQUIRE_ADMIN_DEVICE_APPROVAL: map.REQUIRE_ADMIN_DEVICE_APPROVAL || 'false',
    MINIMUM_APP_VERSION: map.MINIMUM_APP_VERSION || '0.1.0',
    GPS_REQUIRED: map.GPS_REQUIRED || map.GPS_MANDATORY || 'false',
    GPS_MANDATORY: map.GPS_MANDATORY || map.GPS_REQUIRED || 'false',
    WATERMARK_ENABLED: map.WATERMARK_ENABLED || 'true',
  };
}

function ensureDefaultSettings_(result) {
  [
    ['ADMIN_PIN_HASH', '', 'ไม่ส่งออกไปหน้า Frontline'],
    ['ADMIN_PIN_ENABLED', 'false', 'เปิดเมื่อผู้ดูแลตั้ง PIN แล้ว'],
    ['ADMIN_PIN_SET', 'false', 'สถานะการตั้ง PIN'],
    ['REQUIRE_ADMIN_DEVICE_APPROVAL', 'false', 'ตั้งค่าปลอดภัย'],
    ['MINIMUM_APP_VERSION', '0.1.0', 'เวอร์ชันขั้นต่ำ'],
    ['GPS_REQUIRED', 'false', 'บังคับ GPS'],
    ['GPS_MANDATORY', 'false', 'ค่าเทียบเท่า GPS_REQUIRED'],
    ['WATERMARK_ENABLED', 'true', 'เปิดลายน้ำ'],
  ].forEach(function (item) {
    const existed = findRow_(sheet_(SHEETS.SETTINGS), 'key', item[0]) > 1;
    if (!existed) {
      upsertSetting_(item[0], item[1], item[2]);
      result.settingsUpdated.push(item[0]);
    }
  });
}

function seedDefaultRows_() {
  if (rows_(SHEETS.HUBS).length === 0) {
    upsertHub_({ hubCode: '26NAK_BHUB', hubName: 'นครราชสีมา', active: true, actor: 'system' });
  }
  if (rows_(SHEETS.RESPONSIBLE_STAFF).length === 0) {
    upsertResponsibleStaff_({ employeeCode: '25845', employeeName: 'Tui', hubCode: '26NAK_BHUB', active: true, actor: 'system' });
  }
}

function uploadPhoto_(photo) {
  const data = clean_(photo.imageLocalData);
  if (!data || data.indexOf('data:image/') !== 0) {
    const fileId = clean_(photo.driveFileId);
    return {
      driveFileId: fileId,
      driveUrl: clean_(photo.driveUrl),
      imagePreviewUrl: clean_(photo.imagePreviewUrl) || (fileId ? previewUrl_(fileId, 400) : ''),
    };
  }
  const match = data.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return { driveFileId: '', driveUrl: '', imagePreviewUrl: '' };
  const folder = photoFolder_(photo);
  const blob = Utilities.newBlob(Utilities.base64Decode(match[2]), match[1], safeName_(photo.fileName || `${photo.vehicleBarcode}_${photo.photoSlot}.jpg`));
  const file = folder.createFile(blob);
  try {
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  } catch (error) {
    logAudit_({ action: 'photo_preview_warning', message: 'แสดงรูปไม่ได้', actor: 'system', detailJson: JSON.stringify({ error: String(error).slice(0, 120) }) });
  }
  return {
    driveFileId: file.getId(),
    driveUrl: `https://drive.google.com/file/d/${file.getId()}/view?usp=drivesdk`,
    imagePreviewUrl: previewUrl_(file.getId(), 400),
  };
}

function previewUrl_(fileId, size) {
  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w${size}`;
}

function imageFormula_(url, height, width) {
  return url ? `=IMAGE("${url}", 4, ${height}, ${width})` : '';
}

function photoFolder_(photo) {
  const root = folder_(DriveApp.getRootFolder(), 'Hub Photo Proof');
  const dateFolder = folder_(root, clean_(photo.date) || Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd'));
  return folder_(dateFolder, safeName_(photo.vehicleBarcode || 'unknown'));
}

function folder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function logAudit_(entry) {
  const values = {
    auditId: clean_(entry.auditId) || Utilities.getUuid(),
    action: clean_(entry.action),
    message: clean_(entry.message),
    recordId: clean_(entry.recordId),
    actor: clean_(entry.actor) || 'system',
    detailJson: clean_(entry.detailJson),
    createdAt: clean_(entry.createdAt) || bangkokNow_(),
  };
  sheet_(SHEETS.AUDIT).appendRow(rowFor_(sheet_(SHEETS.AUDIT), values));
  return values;
}

function upsertSetting_(key, value, note) {
  upsertByKey_(SHEETS.SETTINGS, 'key', key, {
    key: key,
    value: value,
    updatedAt: bangkokNow_(),
    note: note || '',
  });
}

function settingsMap_() {
  const map = {};
  rows_(SHEETS.SETTINGS).forEach(function (row) {
    map[clean_(row.key)] = clean_(row.value);
  });
  return map;
}

function isEditableSetting_(key) {
  return ['GPS_REQUIRED', 'GPS_MANDATORY', 'WATERMARK_ENABLED', 'REQUIRE_ADMIN_DEVICE_APPROVAL', 'MINIMUM_APP_VERSION'].indexOf(key) >= 0;
}

function normalizeSettingValue_(key, value) {
  if (key === 'MINIMUM_APP_VERSION') return clean_(value);
  return value === true || String(value).toLowerCase() === 'true' ? 'true' : 'false';
}

function activeRows_(sheetName) {
  return rows_(sheetName).filter(function (row) {
    return row.active === true || String(row.active).toUpperCase() === 'TRUE';
  });
}

function rows_(sheetName) {
  const sheet = sheet_(sheetName);
  const values = sheet.getDataRange().getValues();
  if (values.length < 2) return [];
  const headers = values[0].map(String);
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

function upsertByKey_(sheetName, keyHeader, keyValue, values) {
  const sheet = sheet_(sheetName);
  const rowIndex = findRow_(sheet, keyHeader, keyValue);
  if (rowIndex > 1) writeRow_(sheet, rowIndex, values);
  else sheet.appendRow(rowFor_(sheet, values));
}

function writeRow_(sheet, rowIndex, values) {
  const row = rowFor_(sheet, values);
  sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
}

function rowFor_(sheet, values) {
  return headers_(sheet).map(function (header) {
    return values[header] === undefined ? '' : values[header];
  });
}

function rowObject_(sheet, rowIndex) {
  const headers = headers_(sheet);
  const values = sheet.getRange(rowIndex, 1, 1, headers.length).getValues()[0];
  const item = {};
  headers.forEach(function (header, index) {
    item[header] = values[index];
  });
  return item;
}

function findRow_(sheet, header, value) {
  const headers = headers_(sheet);
  const column = headers.indexOf(header) + 1;
  if (column <= 0 || value === '') return -1;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  const values = sheet.getRange(2, column, lastRow - 1, 1).getValues();
  for (let index = 0; index < values.length; index += 1) {
    if (String(values[index][0]) === String(value)) return index + 2;
  }
  return -1;
}

function findResponsibleRow_(sheet, employeeCode, hubCode) {
  const rows = rows_(SHEETS.RESPONSIBLE_STAFF);
  for (let index = 0; index < rows.length; index += 1) {
    if (clean_(rows[index].employeeCode) === employeeCode && clean_(rows[index].hubCode) === hubCode) return index + 2;
  }
  return -1;
}

function findRecordByParts_(sheet, payload) {
  const key = duplicateKey_(payload);
  const all = rows_(SHEETS.RECORDS);
  for (let index = 0; index < all.length; index += 1) {
    if (duplicateKey_(all[index]) === key) return index + 2;
  }
  return -1;
}

function duplicateKey_(value) {
  return [
    clean_(value.date || value['วันที่']),
    clean_(value.hubCode || splitCode_(value['ฮับ'])).toUpperCase(),
    clean_(value.responsibleEmployeeCode || splitCode_(value['ผู้รับผิดชอบ'])),
    clean_(value.vehicleBarcode || value['บาร์โค้ดรถ']).toUpperCase(),
  ].join('|');
}

function splitCode_(value) {
  return clean_(value).split(/[-\s]/)[0] || '';
}

function sheet_(name) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  if (!spreadsheet) throw new Error('Open script from a Google Sheet');
  return getOrCreateSheet_(name);
}

function getOrCreateSheet_(name, result) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const existing = spreadsheet.getSheetByName(name);
  if (existing) return existing;
  const created = spreadsheet.insertSheet(name);
  if (result) result.sheetsCreated.push(name);
  return created;
}

function ensureHeaders_(sheet, expected) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(expected);
    return true;
  }
  const current = headers_(sheet);
  const missing = expected.filter(function (header) { return current.indexOf(header) < 0; });
  if (missing.length === 0) return false;
  sheet.getRange(1, current.length + 1, 1, missing.length).setValues([missing]);
  return true;
}

function headers_(sheet) {
  const lastColumn = Math.max(sheet.getLastColumn(), 1);
  return sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
}

function parseRequest_(e) {
  if (!e || !e.postData || !e.postData.contents) throw new Error('Missing body');
  return JSON.parse(e.postData.contents);
}

function respond_(ok, message, data) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: ok, message: message, data: data || {} }))
    .setMimeType(ContentService.MimeType.JSON);
}

function bangkokNow_() {
  return Utilities.formatDate(new Date(), TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
}

function formatBangkok_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
  }
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (!isNaN(date.getTime())) return Utilities.formatDate(date, TIME_ZONE, 'yyyy-MM-dd HH:mm:ss');
  return text;
}

function statusThai_(status) {
  const labels = {
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
  return labels[status] || status || '';
}

function hashPin_(pin) {
  const digest = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, pin, Utilities.Charset.UTF_8);
  return digest.map(function (byte) {
    const value = byte < 0 ? byte + 256 : byte;
    return (`0${value.toString(16)}`).slice(-2);
  }).join('');
}

function boolText_(value) {
  return value === true || String(value).toLowerCase() === 'true' ? 'TRUE' : 'FALSE';
}

function clean_(value) {
  return String(value === undefined || value === null ? '' : value).trim();
}

function actor_(payload) {
  return clean_(payload.actor || payload.deviceId) || 'admin';
}

function safeName_(value) {
  return clean_(value).replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').replace(/\s+/g, '_');
}
