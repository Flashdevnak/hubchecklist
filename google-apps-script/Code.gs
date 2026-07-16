const SHEETS = {
  RECORDS: 'Records',
  PHOTOS: 'Photos',
  HUBS: 'Hubs',
  RESPONSIBLE_STAFF: 'ResponsibleStaff',
  AUDIT: 'Audit',
};

const HEADERS = {
  Records: [
    'id',
    'date',
    'hubCode',
    'hubName',
    'responsibleEmployeeCode',
    'responsibleName',
    'vehicleBarcode',
    'hasDropTransfer',
    'dropCount',
    'status',
    'missingPhotoWarnings',
    'missingPhotoConfirmed',
    'submittedAt',
    'createdAt',
    'updatedAt',
    'notes',
  ],
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
    'driveFileId',
    'driveUrl',
    'localOnly',
    'createdAt',
  ],
  Hubs: ['hubCode', 'hubName', 'active', 'updatedAt'],
  ResponsibleStaff: ['employeeCode', 'displayName', 'hubCode', 'active', 'updatedAt'],
  Audit: ['id', 'recordId', 'action', 'detail', 'actor', 'createdAt'],
};

function doPost(e) {
  try {
    const request = parseRequest_(e);
    validateToken_(request.token);
    ensureSheets_();

    switch (request.action) {
      case 'healthCheck':
        return json_({ ok: true, app: 'hubchecklist', checkedAt: new Date().toISOString() });
      case 'createRecord':
      case 'syncRecord':
        return json_({ ok: true, result: syncRecord_(request.payload.record, request.payload.photoMetadata || []) });
      case 'uploadPhotoMetadata':
        return json_({ ok: true, result: appendPhoto_(request.payload) });
      case 'getHubs':
        return json_({ ok: true, hubs: readRows_(SHEETS.HUBS) });
      case 'getResponsibleStaff':
        return json_({ ok: true, responsibleStaff: readRows_(SHEETS.RESPONSIBLE_STAFF) });
      case 'getRecords':
        return json_({ ok: true, records: readRows_(SHEETS.RECORDS) });
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
    const sheet = getOrCreateSheet_(sheetName);
    const headers = HEADERS[sheetName];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      return;
    }
    const firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
    if (firstRow.join('|') !== headers.join('|')) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    }
  });
}

function syncRecord_(record, photoMetadata) {
  if (!record || !record.id) throw new Error('Missing record.id');
  const recordResult = upsertRecord_(record);
  const photoResults = (photoMetadata || []).map(function (photo) {
    return appendPhoto_(photo);
  });
  appendAudit_({
    id: Utilities.getUuid(),
    recordId: record.id,
    action: 'google_sync_record',
    detail: 'Record synced from HubChecklist app',
    actor: record.responsibleEmployeeCode || 'app',
    createdAt: new Date().toISOString(),
  });
  return { record: recordResult, photos: photoResults };
}

function upsertRecord_(record) {
  const sheet = getOrCreateSheet_(SHEETS.RECORDS);
  const headers = HEADERS.Records;
  const row = headers.map(function (key) {
    return valueForRecord_(record, key);
  });
  const rowIndex = findRowByValue_(sheet, 1, record.id);
  if (rowIndex > 0) {
    sheet.getRange(rowIndex, 1, 1, row.length).setValues([row]);
    return { id: record.id, action: 'updated' };
  }
  sheet.appendRow(row);
  return { id: record.id, action: 'created' };
}

function appendPhoto_(photo) {
  if (!photo || !photo.recordId || !photo.slotId) throw new Error('Missing photo recordId or slotId');
  const uploaded = uploadPhotoIfPresent_(photo);
  const sheet = getOrCreateSheet_(SHEETS.PHOTOS);
  const row = HEADERS.Photos.map(function (key) {
    return valueForPhoto_(photo, uploaded, key);
  });
  sheet.appendRow(row);
  return { id: row[0], driveFileId: uploaded.fileId, driveUrl: uploaded.url, localOnly: uploaded.localOnly };
}

function appendAudit_(entry) {
  const sheet = getOrCreateSheet_(SHEETS.AUDIT);
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

function uploadPhotoIfPresent_(photo) {
  if (!photo.imageLocalData || photo.captured !== true) {
    return { fileId: '', url: '', localOnly: true };
  }
  const match = String(photo.imageLocalData).match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) return { fileId: '', url: '', localOnly: true };

  const bytes = Utilities.base64Decode(match[2]);
  const blob = Utilities.newBlob(bytes, match[1], safeName_(photo.fileName || `${photo.vehicleBarcode}_${photo.slotId}.jpg`));
  const folder = getPhotoFolder_(photo);
  const file = folder.createFile(blob);
  return { fileId: file.getId(), url: file.getUrl(), localOnly: false };
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

function valueForRecord_(record, key) {
  if (key === 'missingPhotoWarnings') return (record.missingPhotoWarnings || []).join(', ');
  if (key === 'hasDropTransfer' || key === 'missingPhotoConfirmed') return record[key] === true;
  return record[key] || '';
}

function valueForPhoto_(photo, uploaded, key) {
  const values = {
    id: Utilities.getUuid(),
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
    driveFileId: uploaded.fileId || '',
    driveUrl: uploaded.url || '',
    localOnly: uploaded.localOnly === true,
    createdAt: new Date().toISOString(),
  };
  return values[key] || '';
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
