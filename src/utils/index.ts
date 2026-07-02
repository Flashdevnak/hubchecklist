import type {
  ActiveResponsibleProfile,
  FlashProofParseResult,
  FlashProofResult,
  FlashProofRouteRow,
  ScanDraft,
  ScanPreviewDraft,
  ValidationResult,
} from '../types';

export function formatThaiDate(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

export function extractBarcodeFromFlashUrl(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    const parts = url.pathname.split('/').filter(Boolean);
    const last = parts.length > 0 ? parts[parts.length - 1] : null;
    return last || null;
  } catch {
    return /^[A-Z0-9-]+$/i.test(trimmed) ? trimmed : null;
  }
}

export const SCAN_DRAFT_STORAGE_KEY = 'hubchecklist.scanDraft';
export const SCAN_PREVIEW_DRAFT_STORAGE_KEY = 'hubchecklist.scanPreviewDraft';
export const FLASH_PROOF_RESULT_DRAFT_STORAGE_KEY = 'hubchecklist.flashProofResultDraft';
export const ACTIVE_RESPONSIBLE_PROFILE_STORAGE_KEYS = [
  'hubchecklist.activeResponsibleProfile',
  'hubchecklist.responsibleProfile.active',
  'activeResponsibleProfile',
];

export function isFlashProofUrl(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;

  try {
    const url = new URL(trimmed);
    return (
      url.hostname.toLowerCase() === 'api.flashexpress.com' &&
      url.pathname.toLowerCase().includes('/gw/nws/web/proof/go/')
    );
  } catch {
    return false;
  }
}

export function extractVehicleBarcode(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return '';

  if (isFlashProofUrl(trimmed)) {
    const url = new URL(trimmed);
    const lastSegment = url.pathname.split('/').filter(Boolean).pop() ?? '';
    return normalizeVehicleBarcode(lastSegment);
  }

  return normalizeVehicleBarcode(trimmed);
}

export function validateVehicleBarcode(barcode: string): {
  isValid: boolean;
  error?: string;
  warning?: string;
} {
  const normalized = normalizeVehicleBarcode(barcode);

  if (!normalized) {
    return { isValid: false, error: 'กรุณากรอกลิงก์ QR หรือบาร์โค้ดรถ' };
  }

  if (!/^[A-Z0-9]+$/.test(normalized)) {
    return { isValid: false, error: 'บาร์โค้ดใช้ได้เฉพาะตัวอักษรอังกฤษและตัวเลข' };
  }

  if (!normalized.startsWith('NAK') || normalized.length < 8 || normalized.length > 20) {
    return {
      isValid: true,
      warning: 'รูปแบบบาร์โค้ดไม่ตรงตามที่แนะนำ กรุณาตรวจสอบก่อนทำขั้นตอนถัดไป',
    };
  }

  return { isValid: true };
}

export function normalizeThaiPhoneText(input: string): string {
  return input
    .replace(/[๐-๙]/g, (digit) => String('๐๑๒๓๔๕๖๗๘๙'.indexOf(digit)))
    .replace(/\u00a0/g, ' ')
    .trim();
}

export function extractThaiPhoneNumbers(input: string): string[] {
  const normalizedText = normalizeThaiPhoneText(input);
  const candidates = new Set<string>();
  const phoneLikePattern = /0[689](?:[\s\-.()/]*\d){8}/g;
  const compactText = normalizedText.replace(/[^\d]/g, '');
  const compactPattern = /0[689]\d{8}/g;

  for (const match of normalizedText.matchAll(phoneLikePattern)) {
    const normalizedPhone = match[0].replace(/\D/g, '');
    if (validateThaiPhoneNumber(normalizedPhone).isValid) {
      candidates.add(normalizedPhone);
    }
  }

  for (const match of compactText.matchAll(compactPattern)) {
    const normalizedPhone = match[0];
    if (validateThaiPhoneNumber(normalizedPhone).isValid) {
      candidates.add(normalizedPhone);
    }
  }

  return [...candidates];
}

export function validateThaiPhoneNumber(phone: string): ValidationResult {
  const normalizedPhone = phone.replace(/\D/g, '');

  if (!normalizedPhone) {
    return { isValid: false, error: 'กรุณากรอกเบอร์โทรคนขับ' };
  }

  if (!/^\d{10}$/.test(normalizedPhone)) {
    return { isValid: false, error: 'เบอร์โทรต้องเป็นตัวเลข 10 หลัก' };
  }

  if (!/^0[689]/.test(normalizedPhone)) {
    return { isValid: false, error: 'เบอร์โทรต้องขึ้นต้นด้วย 06, 08 หรือ 09' };
  }

  return { isValid: true };
}

export function formatThaiPhone(phone: string): string {
  const normalizedPhone = phone.replace(/\D/g, '');
  if (normalizedPhone.length !== 10) return phone;
  return `${normalizedPhone.slice(0, 3)}-${normalizedPhone.slice(3, 6)}-${normalizedPhone.slice(6)}`;
}

export function parseFlashProofInput(input: string): FlashProofParseResult {
  const trimmed = input.trim();
  const vehicleBarcode = extractVehicleBarcode(trimmed);
  const validation = validateVehicleBarcode(vehicleBarcode);

  return {
    sourceUrl: isFlashProofUrl(trimmed) ? trimmed : '',
    vehicleBarcode,
    isFlashUrl: isFlashProofUrl(trimmed),
    isValid: validation.isValid,
    warning: validation.warning,
    error: validation.error,
  };
}

export function getActiveResponsibleProfile(): ActiveResponsibleProfile | null {
  for (const key of ACTIVE_RESPONSIBLE_PROFILE_STORAGE_KEYS) {
    const rawValue = window.localStorage.getItem(key);
    if (!rawValue) continue;

    try {
      const parsed = JSON.parse(rawValue) as Partial<ActiveResponsibleProfile> & {
        employee_code?: string;
        display_name?: string;
        branchCode?: string;
      };
      const employeeCode = parsed.employeeCode ?? parsed.employee_code;
      const displayName = parsed.displayName ?? parsed.display_name;
      const branch = parsed.branch ?? parsed.branchCode;

      if (employeeCode && displayName && branch) {
        return { employeeCode, displayName, branch };
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function saveScanDraft(draft: ScanDraft): void {
  window.localStorage.setItem(SCAN_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function getScanDraft(): ScanDraft | null {
  const rawValue = window.localStorage.getItem(SCAN_DRAFT_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as ScanDraft;
    return parsed.vehicleBarcode ? parsed : null;
  } catch {
    return null;
  }
}

export function createScanPreviewDraft(
  scanDraft: ScanDraft,
  values: {
    driverPhone: string;
    ocrRawText: string;
    ocrConfidence?: number;
    phoneConfirmedAt?: string;
  },
): ScanPreviewDraft {
  return {
    ...scanDraft,
    driverPhone: values.driverPhone.replace(/\D/g, ''),
    ocrRawText: values.ocrRawText,
    ocrConfidence: values.ocrConfidence,
    phoneConfirmedAt: values.phoneConfirmedAt,
  };
}

export function saveScanPreviewDraft(draft: ScanPreviewDraft): void {
  window.localStorage.setItem(SCAN_PREVIEW_DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

export function getScanPreviewDraft(): ScanPreviewDraft | null {
  const rawValue = window.localStorage.getItem(SCAN_PREVIEW_DRAFT_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as ScanPreviewDraft;
    return parsed.vehicleBarcode ? parsed : null;
  } catch {
    return null;
  }
}

export function clearScanPreviewDraft(): void {
  window.localStorage.removeItem(SCAN_PREVIEW_DRAFT_STORAGE_KEY);
}

export function isAllowedFlashProofUrl(input: string): boolean {
  try {
    const url = new URL(input);
    return (
      url.protocol === 'https:' &&
      url.hostname.toLowerCase() === 'api.flashexpress.com' &&
      url.pathname.toLowerCase().includes('/gw/nws/web/proof/go/')
    );
  } catch {
    return false;
  }
}

export function parseFlashProofRawText(rawText: string): Partial<FlashProofResult> {
  const lines = rawText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const routeRows: FlashProofRouteRow[] = [];

  lines.forEach((line, index) => {
    if (/สาขา|branch/i.test(line)) {
      routeRows.push({ index: routeRows.length + 1, branchName: line });
    }
    if (index === 0 && routeRows.length === 0 && line.length > 20) {
      routeRows.push({ index: 1, branchName: line });
    }
  });

  const findValue = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const line = lines.find((item) => pattern.test(item));
      if (line) return line.replace(/^[^:：]*[:：]?\s*/, '').trim();
    }
    return undefined;
  };

  return {
    driverName: findValue([/พนักงานขับรถ/, /driver/i]),
    companyName: findValue([/ชื่อบริษัท/, /company/i]),
    routeSummary: lines.slice(0, 6).join('\n'),
    firstBranch: routeRows[0]?.branchName,
    lastBranch: routeRows[routeRows.length - 1]?.branchName,
    routeRows,
    rawText,
  };
}

export function saveFlashProofResultDraft(result: FlashProofResult): void {
  window.localStorage.setItem(FLASH_PROOF_RESULT_DRAFT_STORAGE_KEY, JSON.stringify(result));
}

export function getFlashProofResultDraft(): FlashProofResult | null {
  const rawValue = window.localStorage.getItem(FLASH_PROOF_RESULT_DRAFT_STORAGE_KEY);
  if (!rawValue) return null;

  try {
    const parsed = JSON.parse(rawValue) as FlashProofResult;
    return parsed.vehicleBarcode ? parsed : null;
  } catch {
    return null;
  }
}

function normalizeVehicleBarcode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}
