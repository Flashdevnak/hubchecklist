import { Camera, Keyboard, RefreshCcw, ScanLine, UserCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import WarningCard from '../components/WarningCard';
import { getVehicleRecordById, updateRecordWithAudit } from '../services/vehicleRecords';
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
  const [redoRecordId, setRedoRecordId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const redoId = params.get('redoRecordId') ?? '';
    setRedoRecordId(redoId);
    setActiveProfile(getActiveResponsibleProfile());
    const redoRecord = redoId ? getVehicleRecordById(redoId) : null;
    if (redoRecord) {
      setManualInput(redoRecord.sourceUrl || redoRecord.vehicleBarcode);
      setScannerMessage('โหมดสแกน QR ใหม่: ระบบจะไม่แทนที่ข้อมูลเดิมจนกว่าจะยืนยัน');
      return;
    }
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
      setScannerMessage('อุปกรณ์รองรับ BarcodeDetector แล้ว แต่กล้องจริงยังเป็นโหมดทดสอบใน MVP นี้ กรุณากรอกลิงก์หรือบาร์โค้ดเพื่อทำงานต่อ');
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

    if (redoRecordId) {
      const oldRecord = getVehicleRecordById(redoRecordId);
      const confirmed = window.confirm(
        `แทนที่ QR ของรายการนี้หรือไม่?\n\nเดิม: ${oldRecord?.vehicleBarcode ?? '-'}\nใหม่: ${draft.vehicleBarcode}`,
      );
      if (!confirmed) return;
      const updated = updateRecordWithAudit(
        redoRecordId,
        { sourceUrl: draft.sourceUrl, vehicleBarcode: draft.vehicleBarcode },
        'redo QR scan confirmed',
        'user',
        'REDO_QR_SCAN',
      );
      if (updated) {
        window.location.hash = `/checklist?recordId=${updated.id}`;
      }
      return;
    }

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
    <div className="scan-page clean-scan-page">
      <section className="scan-hero">
        <div className="scan-frame" aria-label="พื้นที่สแกน QR">
          <div className="scan-corners" />
          <ScanLine size={72} />
          <strong>วาง QR ให้อยู่ในกรอบ</strong>
          <span>สแกนหรือกรอกลิงก์ Flash เพื่อดึงบาร์โค้ดรถ จากนั้นไปกรอกเบอร์คนขับ</span>
        </div>

        <div className="scan-actions">
          <PrimaryButton onClick={handleOpenScanner}>
            <Camera size={20} />
            <span>เปิดกล้องสแกน QR</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => document.getElementById('manual-qr-input')?.focus()}>
            <Keyboard size={20} />
            <span>กรอกเอง</span>
          </PrimaryButton>
        </div>

        {scannerMessage ? <div className="scan-message warning">{scannerMessage}</div> : null}
      </section>

      <section className="scan-panel">
        {activeProfile ? (
          <article className="profile-mini-card">
            <UserCog size={20} />
            <div>
              <span>ผู้รับผิดชอบ</span>
              <strong>{activeProfile.employeeCode} {activeProfile.displayName} / {activeProfile.branch}</strong>
            </div>
          </article>
        ) : (
          <WarningCard
            title="กรุณาเลือกผู้รับผิดชอบก่อนเริ่มงาน"
            tone="danger"
            action={
              <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/responsible-profile'; }}>
                <UserCog size={20} />
                <span>เลือกผู้รับผิดชอบ</span>
              </PrimaryButton>
            }
          >
            ปุ่มไปขั้นตอนถัดไปจะเปิดใช้งานหลังจากมีผู้รับผิดชอบและ QR ถูกต้อง
          </WarningCard>
        )}

        <div className="scan-form">
          <label htmlFor="manual-qr-input">ลิงก์ QR หรือบาร์โค้ดรถ</label>
          <textarea
            id="manual-qr-input"
            value={manualInput}
            onChange={(event) => setManualInput(event.target.value)}
            placeholder="https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45 หรือ NAK1R7XJ45"
            rows={3}
          />
        </div>

        <article className="scan-result-card compact-result">
          <div className="scan-result-heading">
            <h2>ผลตรวจ QR</h2>
            <StatusBadge
              label={redoRecordId ? 'โหมดสแกนใหม่' : parseResult.isValid ? 'ถูกต้อง' : 'ยังไม่ถูกต้อง'}
              tone={parseResult.isValid ? 'success' : 'warning'}
            />
          </div>

          <div className="scan-result-grid">
            <span>สถานะ</span>
            <strong>{parseResult.error ?? parseResult.warning ?? 'ข้อมูลถูกต้อง'}</strong>
            <span>บาร์โค้ดรถ</span>
            <strong>{parseResult.vehicleBarcode || '-'}</strong>
            <span>ลิงก์ Flash</span>
            <strong>{parseResult.sourceUrl || '-'}</strong>
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
