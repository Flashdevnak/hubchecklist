import type { ActiveResponsibleProfile, FlashProofParseResult, ScanDraft } from '../types';

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

function normalizeVehicleBarcode(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, '');
}
