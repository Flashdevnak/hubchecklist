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
