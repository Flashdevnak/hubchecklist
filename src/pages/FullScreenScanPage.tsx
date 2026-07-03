import { Camera, Keyboard, Phone, RefreshCcw, ScanLine, UserCog } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import WarningCard from '../components/WarningCard';
import { getVehicleRecordById, updateRecordWithAudit } from '../services/vehicleRecords';
import type { ActiveResponsibleProfile, ScanDraft } from '../types';
import {
  createScanPreviewDraft,
  formatThaiPhone,
  getActiveResponsibleProfile,
  getCachedDriverPhone,
  getScanDraft,
  parseFlashProofInput,
  saveCachedDriverPhone,
  saveScanDraft,
  saveScanPreviewDraft,
  validateThaiPhoneNumber,
} from '../utils';

type BarcodeDetectorShape = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

const FLASH_PROOF_BASE_URL = 'https://api.flashexpress.com/gw/nws/web/proof/go/';

export default function FullScreenScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const frameRef = useRef<number | null>(null);
  const detectorRef = useRef<{ detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>> } | null>(null);
  const lastDetectedRef = useRef('');
  const scanningRef = useRef(false);

  const [manualInput, setManualInput] = useState('');
  const [scannerMessage, setScannerMessage] = useState('');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);
  const [activeProfile, setActiveProfile] = useState<ActiveResponsibleProfile | null>(null);
  const [redoRecordId, setRedoRecordId] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [cachedPhone, setCachedPhone] = useState<string | null>(null);
  const [phoneMessage, setPhoneMessage] = useState('');
  const [scanSuccess, setScanSuccess] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const redoId = params.get('redoRecordId') ?? '';
    setRedoRecordId(redoId);
    setActiveProfile(getActiveResponsibleProfile());

    const redoRecord = redoId ? getVehicleRecordById(redoId) : null;
    if (redoRecord) {
      applyScanValue(redoRecord.sourceUrl || redoRecord.vehicleBarcode, { keepMessage: 'โหมดสแกน QR ใหม่: ระบบจะไม่แทนที่ข้อมูลเดิมจนกว่าจะยืนยัน' });
      return;
    }

    const lastDraft = getScanDraft();
    if (lastDraft?.sourceUrl || lastDraft?.vehicleBarcode) {
      applyScanValue(lastDraft.sourceUrl || lastDraft.vehicleBarcode, { silent: true });
    }

    return () => stopCamera();
  }, []);

  const parseResult = useMemo(() => parseFlashProofInput(manualInput), [manualInput]);
  const phoneValidation = useMemo(() => validateThaiPhoneNumber(driverPhone), [driverPhone]);
  const canUseScan = parseResult.isValid && Boolean(parseResult.vehicleBarcode) && Boolean(activeProfile);
  const canContinue = canUseScan && phoneValidation.isValid;
  const effectiveSourceUrl = parseResult.sourceUrl || (parseResult.vehicleBarcode ? `${FLASH_PROOF_BASE_URL}${parseResult.vehicleBarcode}` : '');

  useEffect(() => {
    if (!canUseScan || !activeProfile) return;
    const draft = buildScanDraft(activeProfile);
    saveScanDraft(draft);
  }, [activeProfile, canUseScan, effectiveSourceUrl, parseResult.vehicleBarcode]);

  const startCamera = async () => {
    setScannerMessage('');
    if (!activeProfile) {
      setScannerMessage('กรุณาเลือกผู้รับผิดชอบก่อนเริ่มสแกน');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerMessage('อุปกรณ์นี้ไม่รองรับการเปิดกล้องในเว็บวิว กรุณากรอกลิงก์หรือบาร์โค้ดเอง');
      return;
    }

    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      scanningRef.current = true;
      setScannerMessage('เปิดกล้องแล้ว วาง QR ให้อยู่ในกรอบ');

      const BarcodeDetectorCtor = (window as typeof window & { BarcodeDetector?: BarcodeDetectorShape }).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setScannerMessage('เปิดกล้องแล้ว แต่เครื่องนี้ยังไม่รองรับ BarcodeDetector กรุณากรอกลิงก์หรือบาร์โค้ดเอง');
        return;
      }

      detectorRef.current = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      scanFrame();
    } catch (error) {
      stopCamera();
      setScannerMessage(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาอนุญาตกล้องหรือกรอกบาร์โค้ดเอง'
        : 'เปิดกล้องไม่สำเร็จ กรุณาลองใหม่หรือกรอกบาร์โค้ดเอง');
    } finally {
      setCameraStarting(false);
    }
  };

  const scanFrame = async () => {
    if (!scanningRef.current) return;
    if (!videoRef.current || !detectorRef.current) {
      frameRef.current = window.requestAnimationFrame(scanFrame);
      return;
    }

    try {
      const results = await detectorRef.current.detect(videoRef.current);
      const rawValue = results.find((result) => result.rawValue)?.rawValue?.trim();
      if (rawValue && rawValue !== lastDetectedRef.current) {
        lastDetectedRef.current = rawValue;
        const parsed = parseFlashProofInput(rawValue);
        if (parsed.isValid && parsed.vehicleBarcode) {
          applyScanValue(rawValue, { keepMessage: 'อ่านบาร์รถสำเร็จ' });
          navigator.vibrate?.(80);
          stopCamera();
          return;
        }
      }
    } catch {
      // Keep scanning; transient frame decode errors are common on moving cameras.
    }

    frameRef.current = window.requestAnimationFrame(scanFrame);
  };

  const stopCamera = () => {
    scanningRef.current = false;
    if (frameRef.current) {
      window.cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  };

  const applyScanValue = (value: string, options: { keepMessage?: string; silent?: boolean } = {}) => {
    const parsed = parseFlashProofInput(value);
    setManualInput(value);
    if (parsed.isValid && parsed.vehicleBarcode) {
      const cached = getCachedDriverPhone(parsed.vehicleBarcode);
      setCachedPhone(cached);
      setDriverPhone((current) => current || cached || '');
      setScanSuccess(true);
      setPhoneMessage(cached ? 'พบเบอร์ล่าสุดของรถคันนี้ กรุณาตรวจสอบก่อนใช้งาน' : 'QR ไม่มีเบอร์คนขับ กรุณากรอกเบอร์บนหน้านี้');
      if (!options.silent) setScannerMessage(options.keepMessage ?? 'อ่านบาร์รถสำเร็จ');
      return;
    }
    setScanSuccess(false);
    setCachedPhone(null);
    if (!options.silent) setScannerMessage(parsed.error ?? 'ยังอ่าน QR ไม่สำเร็จ');
  };

  const handleManualChange = (value: string) => {
    applyScanValue(value, { silent: true });
  };

  const handleReset = () => {
    stopCamera();
    lastDetectedRef.current = '';
    setManualInput('');
    setScannerMessage('');
    setDriverPhone('');
    setCachedPhone(null);
    setPhoneMessage('');
    setScanSuccess(false);
  };

  const handleContinue = () => {
    if (!canContinue || !activeProfile) return;
    const draft = buildScanDraft(activeProfile);
    saveScanDraft(draft);

    if (redoRecordId) {
      const oldRecord = getVehicleRecordById(redoRecordId);
      const confirmed = window.confirm(
        `แทนที่ QR ของรายการนี้หรือไม่?\n\nเดิม: ${oldRecord?.vehicleBarcode ?? '-'}\nใหม่: ${draft.vehicleBarcode}`,
      );
      if (!confirmed) return;
      const updated = updateRecordWithAudit(
        redoRecordId,
        { sourceUrl: draft.sourceUrl, vehicleBarcode: draft.vehicleBarcode, driverPhone: driverPhone.replace(/\D/g, '') },
        'redo QR scan confirmed',
        'user',
        'REDO_QR_SCAN',
      );
      if (updated) window.location.hash = `/checklist?recordId=${updated.id}`;
      return;
    }

    const previewDraft = createScanPreviewDraft(draft, {
      driverPhone,
      ocrRawText: '',
      phoneConfirmedAt: new Date().toISOString(),
    });
    saveScanPreviewDraft(previewDraft);
    saveCachedDriverPhone(draft.vehicleBarcode, previewDraft.driverPhone);
    window.location.hash = '/flash-search';
  };

  const buildScanDraft = (profile: ActiveResponsibleProfile): ScanDraft => ({
    sourceUrl: effectiveSourceUrl,
    vehicleBarcode: parseResult.vehicleBarcode,
    scannedAt: new Date().toISOString(),
    responsibleEmployeeCode: profile.employeeCode,
    responsibleDisplayName: profile.displayName,
    branch: profile.branch,
  });

  return (
    <div className="staff-scan-page">
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
            title="กรุณาเลือกผู้รับผิดชอบก่อนเริ่มสแกน"
            tone="danger"
            action={
              <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/responsible-profile?returnTo=scan'; }}>
                <UserCog size={20} />
                <span>เลือก/เพิ่มผู้รับผิดชอบ</span>
              </PrimaryButton>
            }
          >
            ระบบจะไม่ให้ไปต่อถ้ายังไม่มีผู้รับผิดชอบ เพราะต้องผูกงานกับคนทำรายการ
          </WarningCard>
        )}

        <article className={cameraActive ? 'camera-card active' : 'camera-card'}>
          <video ref={videoRef} muted playsInline className="camera-preview" />
          {!cameraActive ? (
            <div className="camera-empty-state">
              <ScanLine size={54} />
              <strong>สแกน Flash QR</strong>
              <span>QR ให้บาร์โค้ดรถเท่านั้น ถ้าไม่มีเบอร์คนขับ ระบบจะให้กรอกต่อในหน้านี้</span>
            </div>
          ) : null}
          <div className="camera-overlay" aria-hidden="true" />
        </article>

        <div className="scan-actions one-screen-actions">
          <PrimaryButton onClick={startCamera} disabled={cameraStarting || !activeProfile}>
            <Camera size={20} />
            <span>{cameraStarting ? 'กำลังเปิดกล้อง' : cameraActive ? 'สแกนต่อ' : 'เปิดกล้องสแกน QR'}</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => document.getElementById('manual-qr-input')?.focus()}>
            <Keyboard size={20} />
            <span>กรอกเอง</span>
          </PrimaryButton>
        </div>

        {scannerMessage ? <p className={scanSuccess ? 'scan-message success compact-message' : 'scan-message warning compact-message'}>{scannerMessage}</p> : null}
      </section>

      <section className="scan-panel">
        <div className="scan-form compact-manual-input">
          <label htmlFor="manual-qr-input">ลิงก์ QR หรือบาร์โค้ดรถ</label>
          <textarea
            id="manual-qr-input"
            value={manualInput}
            onChange={(event) => handleManualChange(event.target.value)}
            placeholder="https://api.flashexpress.com/gw/nws/web/proof/go/NAK1RH9A274 หรือ NAK1RH9A274"
            rows={2}
          />
        </div>

        <article className="scan-result-card compact-result">
          <div className="scan-result-heading">
            <h2>ผลสแกน</h2>
            <StatusBadge
              label={parseResult.isValid ? 'อ่านบาร์รถสำเร็จ' : 'รอ QR'}
              tone={parseResult.isValid ? 'success' : 'warning'}
            />
          </div>
          <div className="scan-result-grid compact-grid">
            <span>บาร์โค้ดรถ</span>
            <strong>{parseResult.vehicleBarcode || '-'}</strong>
            <span>ลิงก์ Flash</span>
            <strong>{effectiveSourceUrl || '-'}</strong>
          </div>
        </article>

        {parseResult.vehicleBarcode ? (
          <article className="phone-inline-card">
            <div className="scan-result-heading">
              <div>
                <h2>เบอร์คนขับ</h2>
                <p className="muted-note">QR ไม่มีเบอร์คนขับ กรุณาตรวจสอบหรือกรอกเบอร์ก่อนเปิด Flash</p>
              </div>
              <Phone size={24} />
            </div>
            {cachedPhone ? (
              <button className="cached-phone-button" type="button" onClick={() => setDriverPhone(cachedPhone)}>
                ใช้เบอร์ล่าสุด {formatThaiPhone(cachedPhone)}
              </button>
            ) : null}
            <input
              value={driverPhone}
              onChange={(event) => setDriverPhone(event.target.value)}
              inputMode="numeric"
              placeholder="0643042911"
            />
            {phoneMessage ? <p className="muted-note">{phoneMessage}</p> : null}
            {driverPhone && !phoneValidation.isValid ? <p className="form-error">{phoneValidation.error}</p> : null}
          </article>
        ) : null}

        <div className="scan-actions bottom-actions fast-scan-actions">
          <PrimaryButton variant="secondary" onClick={handleReset}>
            <RefreshCcw size={20} />
            <span>สแกนใหม่</span>
          </PrimaryButton>
          <PrimaryButton onClick={handleContinue} disabled={!canContinue}>
            <ScanLine size={20} />
            <span>ยืนยันเบอร์และไปต่อ</span>
          </PrimaryButton>
        </div>
      </section>
    </div>
  );
}
