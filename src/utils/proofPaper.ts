import type { FlashProofRouteRow } from '../types';

export interface ProofPaperParseResult {
  vehicleBarcode?: string;
  driverPhone?: string;
  driverPhoneConfidence: 'high' | 'medium' | 'low' | 'none';
  phoneCandidates: string[];
  companyName?: string;
  origin?: string;
  destination?: string;
  routeSummary?: string;
  plannedDepartureTime?: string;
  plannedArrivalTime?: string;
  distance?: string;
  duration?: string;
  printTime?: string;
  routeRows: FlashProofRouteRow[];
  warnings: string[];
}

export function normalizeVehicleBarcode(input: string): string {
  return input.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isFlashProofUrl(input: string): boolean {
  try {
    const url = new URL(input.trim());
    return (
      url.protocol === 'https:' &&
      url.hostname.toLowerCase() === 'api.flashexpress.com' &&
      url.pathname.toLowerCase().includes('/gw/nws/web/proof/go/')
    );
  } catch {
    return false;
  }
}

export function parseFlashProofUrl(input: string): { sourceUrl: string; vehicleBarcode: string } | null {
  try {
    const url = new URL(input.trim());
    if (!isFlashProofUrl(url.toString())) return null;
    const lastSegment = url.pathname.split('/').filter(Boolean).pop() ?? '';
    const vehicleBarcode = extractVehicleBarcodeFromAnyInput(lastSegment);
    return vehicleBarcode ? { sourceUrl: url.toString(), vehicleBarcode } : null;
  } catch {
    return null;
  }
}

export function extractVehicleBarcodeFromAnyInput(input: string): string {
  const flash = parseFlashProofUrlFromMixedText(input);
  if (flash?.vehicleBarcode) return flash.vehicleBarcode;

  const match = input.toUpperCase().match(/\bNAK[A-Z0-9]{5,20}\b/);
  return match ? normalizeVehicleBarcode(match[0]) : '';
}

export function parseProofPaperText(rawText: string): ProofPaperParseResult {
  const text = normalizeOcrText(rawText);
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const routeRows = extractRouteRows(text);
  const routeSummary = extractRouteSummary(text);
  const originDestination = extractOriginDestination(routeSummary, routeRows);
  const phoneResult = extractDriverPhoneCandidates(text);

  const result: ProofPaperParseResult = {
    vehicleBarcode: extractVehicleBarcodeFromAnyInput(text) || undefined,
    driverPhone: phoneResult.bestPhone,
    driverPhoneConfidence: phoneResult.confidence,
    phoneCandidates: phoneResult.candidates,
    companyName: extractCompany(text),
    origin: originDestination.origin,
    destination: originDestination.destination,
    routeSummary,
    plannedDepartureTime: extractPlannedDepartureTime(text, routeRows),
    plannedArrivalTime: extractDestinationArrivalTime(text, routeRows),
    distance: extractDistance(text),
    duration: extractDuration(text),
    printTime: extractPrintTime(text),
    routeRows,
    warnings: [],
  };

  if (result.plannedArrivalTime && result.routeRows.length > 0) {
    result.routeRows[result.routeRows.length - 1] = {
      ...result.routeRows[result.routeRows.length - 1],
      expectedArrivalTime: result.plannedArrivalTime,
    };
  }
  if (result.plannedDepartureTime && result.routeRows.length > 0) {
    result.routeRows[0] = {
      ...result.routeRows[0],
      expectedDepartureTime: result.plannedDepartureTime,
    };
  }

  if (!result.vehicleBarcode) result.warnings.push('à¸¢à¸±à¸‡à¸­à¹ˆà¸²à¸™à¸šà¸²à¸£à¹Œà¸£à¸–à¹„à¸¡à¹ˆà¹„à¸”à¹‰');
  if (!result.driverPhone) result.warnings.push('ยังอ่านเบอร์คนขับไม่ได้');
  if (result.driverPhoneConfidence === 'low' || result.phoneCandidates.length > 1) {
    result.warnings.push('กรุณาตรวจสอบเบอร์คนขับ');
  }
  if (!result.routeSummary) result.warnings.push('à¸¢à¸±à¸‡à¸­à¹ˆà¸²à¸™à¹€à¸ªà¹‰à¸™à¸—à¸²à¸‡à¹„à¸¡à¹ˆà¹„à¸”à¹‰');
  if (lines.length > 0) result.warnings.push('OCR à¸—à¸”à¸¥à¸­à¸‡ à¸à¸£à¸¸à¸“à¸²à¸•à¸£à¸§à¸ˆà¸ªà¸­à¸šà¸‚à¹‰à¸­à¸¡à¸¹à¸¥à¸à¹ˆà¸­à¸™à¸šà¸±à¸™à¸—à¸¶à¸');
  return result;
}

export function extractDriverPhone(rawText: string): string | undefined {
  return extractDriverPhoneCandidates(rawText).bestPhone;
}

export function extractDriverPhoneCandidates(rawText: string): {
  bestPhone?: string;
  candidates: string[];
  confidence: 'high' | 'medium' | 'low' | 'none';
} {
  const text = normalizePhoneOcrText(rawText);
  const candidates = findPhoneCandidates(text);
  if (candidates.length === 0) return { candidates: [], confidence: 'none' };

  const lines = text.split(/\r?\n/);
  const scored = candidates.map((phone) => ({
    phone,
    score: scorePhoneCandidate(phone, lines, text),
  })).sort((a, b) => b.score - a.score);
  const uniqueCandidates = scored.map((item) => item.phone);
  const best = scored[0];
  const second = scored[1];

  if (best.score >= 8 && (!second || best.score - second.score >= 3)) {
    return { bestPhone: best.phone, candidates: uniqueCandidates, confidence: 'high' };
  }

  if (uniqueCandidates.length === 1 && best.score >= 4) {
    return { bestPhone: best.phone, candidates: uniqueCandidates, confidence: 'medium' };
  }

  return { candidates: uniqueCandidates, confidence: 'low' };
}

export function extractRouteSummary(rawText: string): string | undefined {
  const text = normalizeOcrText(rawText);
  const routeMatch = text.match(/\b(?:LH|[0-9]+[Ww])[A-Z0-9.\-:]+(?:BNAK|NE|N[E0-9])[A-Z0-9.\-:]*\b/i);
  if (routeMatch) return routeMatch[0].toUpperCase();

  const line = text
    .split(/\r?\n/)
    .find((item) => /BNAK/i.test(item) && /NE\d?/i.test(item) && /\d{1,2}:\d{2}/.test(item));
  return line?.trim();
}

export function extractRouteRows(rawText: string): FlashProofRouteRow[] {
  const text = normalizeOcrText(rawText);
  const branchPattern = /\b(\d{2}[A-Z0-9]{2,6})\b/g;
  const branches = [...text.matchAll(branchPattern)]
    .map((match) => match[1].toUpperCase())
    .filter((branch) => !/KM$/i.test(branch) && /[A-Z]/.test(branch));
  const dates = [...text.matchAll(/\b(20\d{2}-\d{2}-\d{2})\b/g)].map((match) => match[1]);
  const times = [...text.matchAll(/\b([01]?\d|2[0-3]):[0-5]\d\b/g)].map((match) => match[0]);
  const distance = extractDistance(text);
  const duration = extractDuration(text);

  return branches.slice(0, 8).map((branchName, index) => ({
    index: index + 1,
    branchName,
    date: dates[index] ?? dates[0],
    expectedArrivalTime: index === 0 ? times[0] : times[index * 2] ?? times[times.length - 1],
    expectedDepartureTime: index === 0 ? times[1] ?? times[0] : undefined,
    distance: index === branches.length - 1 ? distance : undefined,
    duration: index === branches.length - 1 ? duration : undefined,
  }));
}

export function extractPlannedDepartureTime(rawText: string, rows = extractRouteRows(rawText)): string | undefined {
  const labeled = normalizeOcrText(rawText).match(/\b(?:plan|planned)?\s*(?:depart|departure|out)\D*([01]?\d|2[0-3]):[0-5]\d\b/i)?.[0]?.match(/([01]?\d|2[0-3]):[0-5]\d/)?.[0];
  if (labeled) return labeled;
  return rows[0]?.expectedDepartureTime ?? extractRouteSummary(rawText)?.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/)?.[0];
}

export function extractDestinationArrivalTime(rawText: string, rows = extractRouteRows(rawText)): string | undefined {
  const labeled = normalizeOcrText(rawText).match(/\b(?:plan|planned)?\s*(?:arrive|arrival|in)\D*([01]?\d|2[0-3]):[0-5]\d\b/i)?.[0]?.match(/([01]?\d|2[0-3]):[0-5]\d/)?.[0];
  if (labeled) return labeled;
  const lastRow = rows[rows.length - 1];
  if (lastRow?.expectedArrivalTime) return lastRow.expectedArrivalTime;
  const times = [...normalizeOcrText(rawText).matchAll(/\b([01]?\d|2[0-3]):[0-5]\d\b/g)].map((match) => match[0]);
  return times[times.length - 1];
}

export function extractDistance(rawText: string): string | undefined {
  return normalizeOcrText(rawText).match(/\b\d+(?:\.\d+)?\s?KM\b/i)?.[0].replace(/\s+/g, '').toUpperCase();
}

export function extractDuration(rawText: string): string | undefined {
  return normalizeOcrText(rawText).match(/\b\d+\s?h\s?\d+\s?min\b/i)?.[0].replace(/\s+/g, '');
}

function parseFlashProofUrlFromMixedText(input: string): { sourceUrl: string; vehicleBarcode: string } | null {
  const match = input.match(/https:\/\/api\.flashexpress\.com\/gw\/nws\/web\/proof\/go\/[A-Z0-9-]+/i);
  return match ? parseFlashProofUrl(match[0]) : null;
}

function normalizeOcrText(rawText: string): string {
  return normalizeThaiDigits(rawText)
    .replace(/\u00a0/g, ' ')
    .replace(/[|]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function normalizeThaiDigits(input: string): string {
  const thaiDigits = '๐๑๒๓๔๕๖๗๘๙';
  return input.replace(/[๐-๙]/g, (digit) => String(thaiDigits.indexOf(digit)));
}

function normalizePhoneOcrText(rawText: string): string {
  return normalizeThaiDigits(rawText)
    .replace(/[０-９]/g, (digit) => String('０１２３４５６７８９'.indexOf(digit)))
    .replace(/[Oo〇]/g, '0')
    .replace(/\u00a0/g, ' ');
}

function findPhoneCandidates(text: string): string[] {
  const candidates = new Set<string>();
  const relaxedPhonePattern = /0[689](?:[\s\-().]*\d){8}/g;

  for (const match of text.matchAll(relaxedPhonePattern)) {
    const phone = match[0].replace(/\D/g, '');
    if (/^0[689]\d{8}$/.test(phone)) candidates.add(phone);
  }

  return [...candidates];
}

function scorePhoneCandidate(phone: string, lines: string[], fullText: string): number {
  let score = 1;
  const labelPattern = /(พนักงานขับรถ|คนขับ|เบอร์โทร|เบอร์|โทร|driver|phone|mobile|tel)/i;

  lines.forEach((line, index) => {
    const compactLine = line.replace(/\D/g, '');
    if (!compactLine.includes(phone)) return;
    if (labelPattern.test(line)) score += 8;
    if (index > 0 && labelPattern.test(lines[index - 1])) score += 6;
    if (index + 1 < lines.length && labelPattern.test(lines[index + 1])) score += 4;
  });

  const phoneIndex = fullText.indexOf(phone);
  const labelMatch = fullText.match(labelPattern);
  if (phoneIndex >= 0 && labelMatch?.index !== undefined && Math.abs(phoneIndex - labelMatch.index) < 80) {
    score += 4;
  }

  return score;
}

function extractCompany(rawText: string): string | undefined {
  const text = normalizeOcrText(rawText);
  return text.match(/\bDOLL(?:ARSOUND)?\b/i)?.[0].toUpperCase();
}

function extractOriginDestination(routeSummary?: string, rows: FlashProofRouteRow[] = []) {
  const routeParts = routeSummary?.split('-') ?? [];
  const origin = routeParts.find((part) => /^[A-Z]{2,5}$/.test(part) && part.includes('BNAK')) ?? simplifyBranch(rows[0]?.branchName);
  const destination = routeParts.find((part) => /^NE\d?$/i.test(part)) ?? simplifyBranch(rows[rows.length - 1]?.branchName);
  return { origin, destination };
}

function simplifyBranch(branch?: string): string | undefined {
  return branch?.replace(/^\d+/, '').toUpperCase();
}

function extractPrintTime(rawText: string): string | undefined {
  return normalizeOcrText(rawText).match(/\b20\d{2}-\d{2}-\d{2}\s+[0-2]\d:[0-5]\d:[0-5]\d\b/)?.[0];
}
