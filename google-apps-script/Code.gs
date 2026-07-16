const SHEETS = {
  RECORDS_ALL: 'Records_All',
  PHOTOS: 'Photos',
  HUBS: 'Hubs',
  RESPONSIBLE_STAFF: 'ResponsibleStaff',
  AUDIT: 'Audit',
  SETTINGS: 'Settings',
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
  ExportLogs: ['id', 'action', 'detail', 'actor', 'createdAt'],
};

function doPost(e) {
  try {
    const request = parseRequest_(e);
    validateToken_(request.token);
    ensureSheets_();

    switch (request.action) {
      case 'healthCheck':
        return json_({ ok: true, app: 'hubchecklist', storage: 'Records_All + hub sheets', checkedAt: new Date().toISOString() });
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
