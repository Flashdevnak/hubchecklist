import { Camera, Keyboard, RefreshCcw, ScanLine, UserCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import type { ActiveResponsibleProfile, ScanDraft } from '../types';
import {
  getActiveResponsibleProfile,
  getScanDraft,
  parseFlashProofInput,
  saveScanDraft,
} from '../utils';

const unsupportedScannerMessage =
  'อุปกรณ์นี้ยังไม่รองรับการสแกน QR โดยตรง กรุณากรอกลิงก์หรือบาร์โค้ดเอง';

export default function FullScreenScanPage() {
  const [manualInput, setManualInput] = useState('');
  const [scannerMessage, setScannerMessage] = useState('');
  const [activeProfile, setActiveProfile] = useState<ActiveResponsibleProfile | null>(null);

  useEffect(() => {
    setActiveProfile(getActiveResponsibleProfile());
    const lastDraft = getScanDraft();
    if (lastDraft?.sourceUrl) {
      setManualInput(lastDraft.sourceUrl);
    } else if (lastDraft?.vehicleBarcode) {
      setManualInput(lastDraft.vehicleBarcode);
    }
  }, []);

  const parseResult = useMemo(() => parseFlashProofInput(manualInput), [manualInput]);
  const canContinue = parseResult.isValid && Boolean(parseResult.vehicleBarcode) && Boolean(activeProfile);

  useEffect(() => {
    if (!parseResult.isValid || !parseResult.vehicleBarcode || !activeProfile) return;

    saveScanDraft({
      sourceUrl: parseResult.sourceUrl,
      vehicleBarcode: parseResult.vehicleBarcode,
      scannedAt: new Date().toISOString(),
      responsibleEmployeeCode: activeProfile.employeeCode,
      responsibleDisplayName: activeProfile.displayName,
      branch: activeProfile.branch,
    });
  }, [activeProfile, parseResult.isValid, parseResult.sourceUrl, parseResult.vehicleBarcode]);

  const handleOpenScanner = () => {
    if ('BarcodeDetector' in window) {
      setScannerMessage(
        'อุปกรณ์รองรับ BarcodeDetector แล้ว แต่การเปิดกล้องจริงจะเชื่อมต่อใน MVP ถัดไป กรุณากรอกลิงก์หรือบาร์โค้ดเพื่อทดสอบงานตอนนี้',
      );
      return;
    }

    setScannerMessage(unsupportedScannerMessage);
  };

  const handleReset = () => {
    setManualInput('');
    setScannerMessage('');
  };

  const handleContinue = () => {
    if (!canContinue || !activeProfile) return;

    const draft: ScanDraft = {
      sourceUrl: parseResult.sourceUrl,
      vehicleBarcode: parseResult.vehicleBarcode,
      scannedAt: new Date().toISOString(),
      responsibleEmployeeCode: activeProfile.employeeCode,
      responsibleDisplayName: activeProfile.displayName,
      branch: activeProfile.branch,
    };

    saveScanDraft(draft);

    const params = new URLSearchParams({
      vehicleBarcode: draft.vehicleBarcode,
      sourceUrl: draft.sourceUrl,
      responsibleEmployeeCode: draft.responsibleEmployeeCode,
      responsibleDisplayName: draft.responsibleDisplayName,
      branch: draft.branch,
    });

    window.location.hash = `/scan-preview?${params.toString()}`;
  };

  return (
    <div className="scan-page">
      <section className="scan-hero">
        <div className="scan-frame" aria-label="พื้นที่สแกน QR">
          <div className="scan-corners" />
          <ScanLine size={72} />
          <strong>วาง QR ให้อยู่ในกรอบ</strong>
          <span>กล้องจริงยังเป็นฐานเตรียมเชื่อมต่อ Manual input ใช้งานได้ใน MVP-004</span>
        </div>

        <div className="scan-actions">
          <PrimaryButton onClick={handleOpenScanner}>
            <Camera size={20} />
            <span>เปิดกล้องสแกน QR</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => document.getElementById('manual-qr-input')?.focus()}>
            <Keyboard size={20} />
            <span>กรอกลิงก์/บาร์โค้ดเอง</span>
          </PrimaryButton>
        </div>

        {scannerMessage ? <div className="scan-message warning">{scannerMessage}</div> : null}
      </section>

      <section className="scan-panel">
        <div className="scan-form">
          <label htmlFor="manual-qr-input">ลิงก์ QR หรือบาร์โค้ดรถ</label>
          <textarea
            id="manual-qr-input"
            value={manualInput}
            onChange={(event) => setManualInput(event.target.value)}
            placeholder="https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45 หรือ NAK1R7XJ45"
            rows={4}
          />
        </div>

        {!activeProfile ? (
          <div className="scan-message danger">
            <strong>กรุณาเลือกผู้รับผิดชอบก่อนเริ่มสแกน</strong>
            <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/responsible-profile'; }}>
              <UserCog size={20} />
              <span>ไปหน้าเลือกผู้รับผิดชอบ</span>
            </PrimaryButton>
          </div>
        ) : null}

        <article className="scan-result-card">
          <div className="scan-result-heading">
            <h2>ผลตรวจ QR</h2>
            <StatusBadge
              label={parseResult.isValid ? 'พร้อมตรวจต่อ' : 'รอข้อมูลถูกต้อง'}
              tone={parseResult.isValid ? 'success' : 'warning'}
            />
          </div>

          <div className="scan-result-grid">
            <span>sourceUrl</span>
            <strong>{parseResult.sourceUrl || '-'}</strong>
            <span>vehicleBarcode</span>
            <strong>{parseResult.vehicleBarcode || '-'}</strong>
            <span>validation</span>
            <strong>{parseResult.error ?? parseResult.warning ?? 'ข้อมูลถูกต้อง'}</strong>
            <span>ผู้รับผิดชอบ</span>
            <strong>
              {activeProfile
                ? `${activeProfile.employeeCode} ${activeProfile.displayName} / ${activeProfile.branch}`
                : '-'}
            </strong>
          </div>
        </article>

        <div className="scan-actions bottom-actions">
          <PrimaryButton variant="secondary" onClick={handleReset}>
            <RefreshCcw size={20} />
            <span>สแกนใหม่</span>
          </PrimaryButton>
          <PrimaryButton onClick={handleContinue} disabled={!canContinue}>
            <ScanLine size={20} />
            <span>ไปขั้นตอนถัดไป</span>
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
