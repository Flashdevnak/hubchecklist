import { Camera, ImagePlus, Keyboard, RefreshCcw, Save, ScanLine, UserCog } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import WarningCard from '../components/WarningCard';
import { getVehicleRecordById, createVehicleRecordFromFlashDraft, updateRecordWithAudit } from '../services/vehicleRecords';
import type { ActiveResponsibleProfile, FlashProofResult, FlashProofRouteRow, ScanDraft } from '../types';
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
import {
  extractVehicleBarcodeFromAnyInput,
  isFlashProofUrl,
  parseProofPaperText,
  type ProofPaperParseResult,
} from '../utils/proofPaper';

type BarcodeDetectorShape = new (options?: { formats?: string[] }) => {
  detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue?: string }>>;
};

interface ReviewDraft {
  vehicleBarcode: string;
  driverPhone: string;
  origin: string;
  destination: string;
  routeSummary: string;
  plannedDepartureTime: string;
  plannedArrivalTime: string;
  distance: string;
  duration: string;
  companyName: string;
  notes: string;
  ocrRawText: string;
}

const FLASH_PROOF_BASE_URL = 'https://api.flashexpress.com/gw/nws/web/proof/go/';
const EMPTY_REVIEW: ReviewDraft = {
  vehicleBarcode: '',
  driverPhone: '',
  origin: '',
  destination: '',
  routeSummary: '',
  plannedDepartureTime: '',
  plannedArrivalTime: '',
  distance: '',
  duration: '',
  companyName: '',
  notes: '',
  ocrRawText: '',
};

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
  const [review, setReview] = useState<ReviewDraft>(EMPTY_REVIEW);
  const [cachedPhone, setCachedPhone] = useState<string | null>(null);
  const [ocrBusy, setOcrBusy] = useState(false);
  const [createBusy, setCreateBusy] = useState(false);
  const [createMessage, setCreateMessage] = useState('');
  const [forceDuplicate, setForceDuplicate] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const redoId = params.get('redoRecordId') ?? '';
    setRedoRecordId(redoId);
    setActiveProfile(getActiveResponsibleProfile());

    const redoRecord = redoId ? getVehicleRecordById(redoId) : null;
    if (redoRecord) {
      applyScanValue(redoRecord.sourceUrl || redoRecord.vehicleBarcode, 'Redo QR: ตรวจสอบข้อมูลก่อนบันทึก');
      return;
    }

    const lastDraft = getScanDraft();
    if (lastDraft?.sourceUrl || lastDraft?.vehicleBarcode) {
      applyScanValue(lastDraft.sourceUrl || lastDraft.vehicleBarcode, '');
    }

    return () => stopCamera();
  }, []);

  const phoneValidation = useMemo(() => (
    review.driverPhone.trim() ? validateThaiPhoneNumber(review.driverPhone) : { isValid: true }
  ), [review.driverPhone]);
  const barcodeValidation = useMemo(() => parseFlashProofInput(review.vehicleBarcode), [review.vehicleBarcode]);
  const canCreate = Boolean(activeProfile && barcodeValidation.isValid && review.vehicleBarcode && phoneValidation.isValid);
  const sourceUrl = review.vehicleBarcode ? `${FLASH_PROOF_BASE_URL}${review.vehicleBarcode}` : '';

  useEffect(() => {
    if (!activeProfile || !review.vehicleBarcode) return;
    saveScanDraft(buildScanDraft(activeProfile, review.vehicleBarcode));
  }, [activeProfile, review.vehicleBarcode]);

  const startCamera = async () => {
    setScannerMessage('');
    setCreateMessage('');
    if (!activeProfile) {
      setScannerMessage('กรุณาบันทึกผู้รับผิดชอบก่อนเริ่มสแกน');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setScannerMessage('อุปกรณ์นี้ยังเปิดกล้องไม่ได้ กรุณากรอกบาร์รถเอง');
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
      setScannerMessage('เปิดกล้องแล้ว วาง QR หรือบาร์โค้ดให้อยู่ในกรอบ');

      const BarcodeDetectorCtor = (window as typeof window & { BarcodeDetector?: BarcodeDetectorShape }).BarcodeDetector;
      if (!BarcodeDetectorCtor) {
        setScannerMessage('เปิดกล้องแล้ว แต่เครื่องนี้ยังไม่รองรับ BarcodeDetector กรุณากรอกบาร์รถเอง');
        return;
      }

      try {
        detectorRef.current = new BarcodeDetectorCtor({ formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8'] });
      } catch {
        detectorRef.current = new BarcodeDetectorCtor({ formats: ['qr_code'] });
      }
      scanFrame();
    } catch (error) {
      stopCamera();
      setScannerMessage(error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'ไม่ได้รับอนุญาตให้ใช้กล้อง กรุณาอนุญาตกล้องหรือกรอกบาร์รถเอง'
        : 'เปิดกล้องไม่สำเร็จ กรุณาลองใหม่หรือกรอกบาร์รถเอง');
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
        const barcode = extractVehicleBarcodeFromAnyInput(rawValue);
        if (barcode) {
          applyScanValue(rawValue, 'อ่านบาร์รถสำเร็จ ตรวจสอบข้อมูลก่อนสร้างรายการ');
          navigator.vibrate?.(80);
          stopCamera();
          return;
        }
      }
    } catch {
      // Moving cameras can produce transient decode failures; keep scanning.
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

  const applyScanValue = (value: string, message = 'อ่านข้อมูลแล้ว กรุณาตรวจสอบก่อนสร้างรายการ') => {
    const barcode = extractVehicleBarcodeFromAnyInput(value);
    setManualInput(value);
    if (!barcode) {
      setScannerMessage('ยังไม่พบบาร์รถในข้อมูลที่อ่านได้');
      return;
    }

    const cached = getCachedDriverPhone(barcode);
    setCachedPhone(cached);
    setReview((current) => ({
      ...current,
      vehicleBarcode: barcode,
      driverPhone: current.driverPhone || cached || '',
    }));
    setForceDuplicate(false);
    if (message) setScannerMessage(cached ? `${message} พบเบอร์ล่าสุด ${formatThaiPhone(cached)}` : message);
  };

  const applyProofParse = (parsed: ProofPaperParseResult, rawText: string) => {
    if (parsed.vehicleBarcode) {
      const cached = getCachedDriverPhone(parsed.vehicleBarcode);
      setCachedPhone(cached);
    }
    setReview((current) => ({
      ...current,
      vehicleBarcode: parsed.vehicleBarcode ?? current.vehicleBarcode,
      driverPhone: parsed.driverPhone ?? current.driverPhone,
      origin: parsed.origin ?? current.origin,
      destination: parsed.destination ?? current.destination,
      routeSummary: parsed.routeSummary ?? current.routeSummary,
      plannedDepartureTime: parsed.plannedDepartureTime ?? current.plannedDepartureTime,
      plannedArrivalTime: parsed.plannedArrivalTime ?? current.plannedArrivalTime,
      distance: parsed.distance ?? current.distance,
      duration: parsed.duration ?? current.duration,
      companyName: parsed.companyName ?? current.companyName,
      ocrRawText: rawText,
    }));
    setScannerMessage(parsed.warnings.length ? parsed.warnings.join(' / ') : 'อ่านข้อมูลจากรูปใบรถแล้ว');
  };

  const handleManualChange = (value: string) => {
    setManualInput(value);
    const barcode = extractVehicleBarcodeFromAnyInput(value);
    if (barcode) {
      applyScanValue(value, '');
      return;
    }
    setReview((current) => ({ ...current, vehicleBarcode: value.trim().toUpperCase() }));
  };

  const handleOcrFile = async (file: File | undefined) => {
    if (!file) return;
    setOcrBusy(true);
    setScannerMessage('กำลังอ่านตัวอักษรจากรูปใบรถ');
    try {
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(file, 'eng+tha');
      const rawText = result.data.text ?? '';
      applyProofParse(parseProofPaperText(rawText), rawText);
    } catch (error) {
      setScannerMessage(error instanceof Error ? `OCR อ่านไม่สำเร็จ: ${error.message}` : 'OCR อ่านไม่สำเร็จ กรุณากรอกเอง');
    } finally {
      setOcrBusy(false);
    }
  };

  const handleReset = () => {
    stopCamera();
    lastDetectedRef.current = '';
    setManualInput('');
    setScannerMessage('');
    setReview(EMPTY_REVIEW);
    setCachedPhone(null);
    setCreateMessage('');
    setForceDuplicate(false);
  };

  const handleCreateRecord = () => {
    if (!canCreate || !activeProfile) return;
    setCreateBusy(true);
    setCreateMessage('');

    if (redoRecordId) {
      const updated = updateRecordWithAudit(
        redoRecordId,
        {
          sourceUrl,
          vehicleBarcode: review.vehicleBarcode,
          driverPhone: review.driverPhone.replace(/\D/g, ''),
          companyName: review.companyName,
          routeSummary: review.routeSummary,
          firstBranch: review.origin,
          lastBranch: review.destination,
          plannedDepartureTime: review.plannedDepartureTime,
        },
        'redo QR scan confirmed',
        'user',
        'REDO_QR_SCAN',
      );
      setCreateBusy(false);
      if (updated) window.location.hash = `/checklist?recordId=${updated.id}`;
      return;
    }

    const scanDraft = buildScanDraft(activeProfile, review.vehicleBarcode);
    saveScanDraft(scanDraft);
    saveScanPreviewDraft(createScanPreviewDraft(scanDraft, {
      driverPhone: review.driverPhone,
      ocrRawText: review.ocrRawText,
      phoneConfirmedAt: new Date().toISOString(),
    }));

    const result = createVehicleRecordFromFlashDraft(buildFlashResult(activeProfile), { forceNewTrip: forceDuplicate });
    setCreateBusy(false);

    if (result.validationErrors.length > 0) {
      setCreateMessage(`ยังสร้างรายการไม่ได้: ${result.validationErrors.join(', ')}`);
      return;
    }
    if (!result.record && (result.duplicate.hasExactDuplicate || result.duplicate.hasConflict)) {
      setCreateMessage(result.duplicate.message ?? 'พบรายการซ้ำ กรุณาตรวจสอบก่อนสร้างใหม่');
      setForceDuplicate(true);
      return;
    }
    if (!result.record) {
      setCreateMessage('ยังสร้างรายการไม่ได้ กรุณาตรวจสอบข้อมูลอีกครั้ง');
      return;
    }

    if (review.driverPhone && validateThaiPhoneNumber(review.driverPhone).isValid) {
      saveCachedDriverPhone(review.vehicleBarcode, review.driverPhone);
    }
    window.location.hash = `/checklist?recordId=${result.record.id}`;
  };

  const buildScanDraft = (profile: ActiveResponsibleProfile, vehicleBarcode: string): ScanDraft => ({
    sourceUrl: `${FLASH_PROOF_BASE_URL}${vehicleBarcode}`,
    vehicleBarcode,
    scannedAt: new Date().toISOString(),
    responsibleEmployeeCode: profile.employeeCode,
    responsibleDisplayName: profile.displayName,
    branch: profile.branch,
  });

  const buildRouteRows = (): FlashProofRouteRow[] => {
    const rows: FlashProofRouteRow[] = [];
    if (review.origin || review.plannedDepartureTime) {
      rows.push({
        index: 1,
        branchName: review.origin,
        expectedDepartureTime: review.plannedDepartureTime,
      });
    }
    if (review.destination || review.plannedArrivalTime || review.distance || review.duration) {
      rows.push({
        index: rows.length + 1,
        branchName: review.destination,
        expectedArrivalTime: review.plannedArrivalTime,
        distance: review.distance,
        duration: review.duration,
      });
    }
    return rows.length > 0 ? rows : [{ index: 1, branchName: review.origin || activeProfile?.branch || 'BNAK' }];
  };

  const buildFlashResult = (profile: ActiveResponsibleProfile): FlashProofResult => ({
    sourceUrl,
    vehicleBarcode: review.vehicleBarcode,
    driverPhone: review.driverPhone.replace(/\D/g, ''),
    companyName: review.companyName,
    routeSummary: review.routeSummary || [review.origin, review.destination].filter(Boolean).join(' -> '),
    firstBranch: review.origin,
    lastBranch: review.destination,
    plannedDepartureTime: review.plannedDepartureTime,
    routeRows: buildRouteRows(),
    rawText: review.ocrRawText || review.notes,
    status: 'manual_fallback',
    message: isFlashProofUrl(sourceUrl) ? 'Created from staff scan review' : 'Created from manual review',
    flashPageStatus: 'not_fetched',
    extractedAt: new Date().toISOString(),
    responsibleEmployeeCode: profile.employeeCode,
    responsibleDisplayName: profile.displayName,
    branch: profile.branch,
  });

  const updateReview = (field: keyof ReviewDraft, value: string) => {
    setReview((current) => ({ ...current, [field]: field === 'vehicleBarcode' ? value.trim().toUpperCase() : value }));
    setForceDuplicate(false);
  };

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
            title="กรุณาบันทึกผู้รับผิดชอบก่อนเริ่มงาน"
            tone="danger"
            action={
              <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/dashboard'; }}>
                <UserCog size={20} />
                <span>ไปหน้าวันนี้</span>
              </PrimaryButton>
            }
          >
            หน้าสแกนต้องผูกรายการกับรหัสพนักงาน ชื่อ และสาขาก่อนสร้างงาน
          </WarningCard>
        )}

        <article className={cameraActive ? 'camera-card active' : 'camera-card'}>
          <video ref={videoRef} muted playsInline className="camera-preview" />
          {!cameraActive ? (
            <div className="camera-empty-state">
              <ScanLine size={54} />
              <strong>สแกนใบรถ</strong>
              <span>อ่าน QR หรือบาร์โค้ดรถ แล้วตรวจสอบข้อมูลก่อนสร้างรายการ</span>
            </div>
          ) : null}
          <div className="camera-overlay" aria-hidden="true" />
        </article>

        <div className="scan-actions one-screen-actions">
          <PrimaryButton onClick={startCamera} disabled={cameraStarting || !activeProfile}>
            <Camera size={20} />
            <span>{cameraStarting ? 'กำลังเปิดกล้อง' : cameraActive ? 'สแกนต่อ' : 'เปิดกล้องสแกน'}</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => document.getElementById('manual-qr-input')?.focus()}>
            <Keyboard size={20} />
            <span>กรอกเอง</span>
          </PrimaryButton>
        </div>

        <label className="ocr-upload-box">
          <span>อ่านข้อมูลจากรูปใบรถ</span>
          <input
            accept="image/*"
            capture="environment"
            disabled={ocrBusy}
            type="file"
            onChange={(event) => { void handleOcrFile(event.target.files?.[0]); event.currentTarget.value = ''; }}
          />
        </label>
        {ocrBusy ? <p className="scan-message warning compact-message">OCR กำลังอ่านรูป กรุณารอสักครู่</p> : null}
        {scannerMessage ? <p className="scan-message warning compact-message">{scannerMessage}</p> : null}
      </section>

      <section className="scan-panel">
        <div className="scan-form compact-manual-input">
          <label htmlFor="manual-qr-input">ลิงก์ QR หรือบาร์โค้ดรถ</label>
          <textarea
            id="manual-qr-input"
            value={manualInput}
            onChange={(event) => handleManualChange(event.target.value)}
            placeholder="https://api.flashexpress.com/gw/nws/web/proof/go/NAK1R7XJ45 หรือ NAK1R7XJ45"
            rows={2}
          />
        </div>

        <article className="scan-result-card review-card">
          <div className="scan-result-heading">
            <h2>ตรวจสอบก่อนสร้างรายการ</h2>
            <StatusBadge label={review.vehicleBarcode ? 'พร้อมตรวจสอบ' : 'รอสแกน'} tone={review.vehicleBarcode ? 'success' : 'warning'} />
          </div>
          <div className="review-grid">
            <ReviewInput label="บาร์รถ" value={review.vehicleBarcode} onChange={(value) => updateReview('vehicleBarcode', value)} />
            <ReviewInput label="เบอร์คนขับ" value={review.driverPhone} onChange={(value) => updateReview('driverPhone', value)} placeholder="0643042911 (ไม่บังคับ)" inputMode="numeric" />
            <ReviewInput label="ต้นทาง" value={review.origin} onChange={(value) => updateReview('origin', value)} placeholder="BNAK" />
            <ReviewInput label="ปลายทาง" value={review.destination} onChange={(value) => updateReview('destination', value)} placeholder="NE6" />
            <ReviewInput label="เส้นทาง" value={review.routeSummary} onChange={(value) => updateReview('routeSummary', value)} placeholder="LH...BNAK...NE..." wide />
            <ReviewInput label="เวลาออกตามแผน" value={review.plannedDepartureTime} onChange={(value) => updateReview('plannedDepartureTime', value)} placeholder="22:00" />
            <ReviewInput label="เวลาถึงปลายทาง" value={review.plannedArrivalTime} onChange={(value) => updateReview('plannedArrivalTime', value)} placeholder="00:15" />
            <ReviewInput label="ระยะทาง" value={review.distance} onChange={(value) => updateReview('distance', value)} placeholder="131KM" />
            <ReviewInput label="ระยะเวลา" value={review.duration} onChange={(value) => updateReview('duration', value)} placeholder="2h15min" />
            <ReviewInput label="บริษัท/รายละเอียดเพิ่มเติม" value={review.companyName} onChange={(value) => updateReview('companyName', value)} placeholder="DOLLARSOUND" wide />
          </div>
          {cachedPhone ? (
            <button className="cached-phone-button" type="button" onClick={() => updateReview('driverPhone', cachedPhone)}>
              ใช้เบอร์ล่าสุด {formatThaiPhone(cachedPhone)}
            </button>
          ) : null}
          {review.driverPhone && !phoneValidation.isValid ? <p className="form-error">{phoneValidation.error}</p> : null}
          {barcodeValidation.error ? <p className="form-error">{barcodeValidation.error}</p> : null}
          {createMessage ? <p className="scan-message warning compact-message">{createMessage}</p> : null}
          <div className="scan-actions bottom-actions fast-scan-actions">
            <PrimaryButton variant="secondary" onClick={handleReset}>
              <RefreshCcw size={20} />
              <span>สแกนใหม่</span>
            </PrimaryButton>
            <PrimaryButton onClick={handleCreateRecord} disabled={!canCreate || createBusy}>
              <Save size={20} />
              <span>{forceDuplicate ? 'สร้างรายการใหม่อีกเที่ยว' : 'สร้างรายการ'}</span>
            </PrimaryButton>
          </div>
        </article>

        <details className="feature-card advanced-panel">
          <summary><ImagePlus size={18} /> ข้อความ OCR / รายละเอียดขั้นสูง</summary>
          <div className="scan-form">
            <label htmlFor="ocr-raw-text">ข้อความที่อ่านได้</label>
            <textarea
              id="ocr-raw-text"
              value={review.ocrRawText}
              onChange={(event) => updateReview('ocrRawText', event.target.value)}
              placeholder="วางข้อความจากใบรถเพื่อให้ระบบช่วยแยกข้อมูล"
              rows={6}
            />
            <PrimaryButton variant="secondary" onClick={() => applyProofParse(parseProofPaperText(review.ocrRawText), review.ocrRawText)}>
              แปลงข้อความอีกครั้ง
            </PrimaryButton>
          </div>
        </details>
      </section>
    </div>
  );
}

function ReviewInput({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
  wide = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  inputMode?: 'numeric';
  wide?: boolean;
}) {
  return (
    <label className={wide ? 'review-field wide' : 'review-field'}>
      <span>{label}</span>
      <input
        inputMode={inputMode}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}
