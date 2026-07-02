import { Search, ScanLine } from 'lucide-react';
import { useEffect, useState } from 'react';
import StatusBadge from '../components/StatusBadge';
import type { ScanDraft } from '../types';
import { getScanDraft, saveScanDraft } from '../utils';

export default function ScanPreviewPage() {
  const [draft, setDraft] = useState<ScanDraft | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const vehicleBarcode = params.get('vehicleBarcode') ?? '';

    if (vehicleBarcode) {
      const queryDraft: ScanDraft = {
        vehicleBarcode,
        sourceUrl: params.get('sourceUrl') ?? '',
        scannedAt: new Date().toISOString(),
        responsibleEmployeeCode: params.get('responsibleEmployeeCode') ?? '',
        responsibleDisplayName: params.get('responsibleDisplayName') ?? '',
        branch: params.get('branch') ?? '',
      };
      saveScanDraft(queryDraft);
      setDraft(queryDraft);
      return;
    }

    setDraft(getScanDraft());
  }, []);

  return (
    <div className="scan-preview-page">
      <article className="feature-card primary-card">
        <div className="card-heading-row">
          <div className="large-icon"><ScanLine size={30} /></div>
          <div>
            <StatusBadge label="MVP-004 scan draft" tone="success" />
            <h2>ตรวจข้อมูลจาก QR</h2>
          </div>
        </div>

        {draft ? (
          <div className="scan-result-grid">
            <span>vehicleBarcode</span>
            <strong>{draft.vehicleBarcode}</strong>
            <span>sourceUrl</span>
            <strong>{draft.sourceUrl || '-'}</strong>
            <span>ผู้รับผิดชอบ</span>
            <strong>
              {draft.responsibleEmployeeCode} {draft.responsibleDisplayName} / {draft.branch}
            </strong>
            <span>เวลาสแกน</span>
            <strong>{new Date(draft.scannedAt).toLocaleString('th-TH')}</strong>
          </div>
        ) : (
          <p className="muted-note">ยังไม่มีข้อมูลสแกน กรุณากลับไปหน้า Scan แล้วกรอก QR หรือบาร์โค้ด</p>
        )}
      </article>

      <article className="feature-card">
        <div className="card-heading-row">
          <div className="large-icon"><Search size={30} /></div>
          <div>
            <StatusBadge label="Placeholder" tone="warning" />
            <h2>OCR เบอร์โทร</h2>
          </div>
        </div>
        <p className="muted-note">ขั้นตอน OCR เบอร์โทรจะทำใน MVP-005</p>
      </article>
    </div>
  );
}
