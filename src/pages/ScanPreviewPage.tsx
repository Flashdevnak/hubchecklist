import { CheckCircle2, FileImage, Phone, RefreshCcw, ScanLine, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StepProgress from '../components/StepProgress';
import StatusBadge from '../components/StatusBadge';
import { getVehicleRecordById, updateRecordWithAudit } from '../services/vehicleRecords';
import type { ScanDraft } from '../types';
import {
  clearScanPreviewDraft,
  createScanPreviewDraft,
  extractThaiPhoneNumbers,
  formatThaiPhone,
  getScanDraft,
  getScanPreviewDraft,
  saveScanDraft,
  saveScanPreviewDraft,
  validateThaiPhoneNumber,
  validateVehicleBarcode,
} from '../utils';

const sampleOcrText = `บาร์โค้ดประจำตัวรถ: NAK1R7XJ45
เบอร์โทรศัพท์ของคนขับรถ: 0643042911`;

export default function ScanPreviewPage() {
  const [scanDraft, setScanDraft] = useState<ScanDraft | null>(null);
  const [sourceUrl, setSourceUrl] = useState('');
  const [vehicleBarcode, setVehicleBarcode] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [ocrRawText, setOcrRawText] = useState('');
  const [phoneCandidates, setPhoneCandidates] = useState<string[]>([]);
  const [ocrStatus, setOcrStatus] = useState('ยังไม่ได้อ่าน OCR');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [confirmedAt, setConfirmedAt] = useState('');
  const [redoPhoneRecordId, setRedoPhoneRecordId] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.split('?')[1] ?? '');
    const redoId = params.get('redoPhoneRecordId') ?? '';
    setRedoPhoneRecordId(redoId);
    const redoRecord = redoId ? getVehicleRecordById(redoId) : null;
    if (redoRecord) {
      const redoDraft: ScanDraft = {
        sourceUrl: redoRecord.sourceUrl,
        vehicleBarcode: redoRecord.vehicleBarcode,
        scannedAt: new Date().toISOString(),
        responsibleEmployeeCode: redoRecord.responsibleEmployeeCode,
        responsibleDisplayName: redoRecord.responsibleDisplayName,
        branch: redoRecord.branch,
      };
      setScanDraft(redoDraft);
      setSourceUrl(redoDraft.sourceUrl);
      setVehicleBarcode(redoDraft.vehicleBarcode);
      setDriverPhone(redoRecord.driverPhone);
      setOcrStatus('โหมดอ่านเบอร์ใหม่: ระบบจะไม่แทนที่เบอร์เดิมจนกว่าจะยืนยัน');
      return;
    }
    const queryBarcode = params.get('vehicleBarcode') ?? '';
    const savedPreview = getScanPreviewDraft();

    if (savedPreview) {
      setScanDraft(savedPreview);
      setSourceUrl(savedPreview.sourceUrl);
      setVehicleBarcode(savedPreview.vehicleBarcode);
      setDriverPhone(savedPreview.driverPhone);
      setOcrRawText(savedPreview.ocrRawText);
      setConfirmedAt(savedPreview.phoneConfirmedAt ?? '');
      setPhoneCandidates(extractThaiPhoneNumbers(savedPreview.ocrRawText));
      setOcrStatus(savedPreview.ocrRawText ? 'โหลดข้อความ OCR ที่บันทึกไว้แล้ว' : 'ยังไม่ได้อ่าน OCR');
      return;
    }

    if (queryBarcode) {
      const queryDraft: ScanDraft = {
        vehicleBarcode: queryBarcode,
        sourceUrl: params.get('sourceUrl') ?? '',
        scannedAt: new Date().toISOString(),
        responsibleEmployeeCode: params.get('responsibleEmployeeCode') ?? '',
        responsibleDisplayName: params.get('responsibleDisplayName') ?? '',
        branch: params.get('branch') ?? '',
      };
      saveScanDraft(queryDraft);
      setScanDraft(queryDraft);
      setSourceUrl(queryDraft.sourceUrl);
      setVehicleBarcode(queryDraft.vehicleBarcode);
      return;
    }

    const savedScanDraft = getScanDraft();
    setScanDraft(savedScanDraft);
    setSourceUrl(savedScanDraft?.sourceUrl ?? '');
    setVehicleBarcode(savedScanDraft?.vehicleBarcode ?? '');
  }, []);

  const phoneValidation = useMemo(() => validateThaiPhoneNumber(driverPhone), [driverPhone]);
  const barcodeValidation = useMemo(() => validateVehicleBarcode(vehicleBarcode), [vehicleBarcode]);
  const canConfirm = Boolean(scanDraft) && barcodeValidation.isValid && phoneValidation.isValid;

  const workingDraft: ScanDraft | null = scanDraft
    ? {
        ...scanDraft,
        sourceUrl,
        vehicleBarcode: vehicleBarcode.trim().toUpperCase(),
      }
    : null;

  const handleFileSelected = (file: File | undefined) => {
    if (!file) return;
    setSelectedFileName(file.name);
    setOcrStatus(
      'เลือกไฟล์แล้ว แต่ยังไม่ได้ติดตั้ง OCR engine ใน MVP-005 กรุณาวางข้อความ OCR หรือพิมพ์เบอร์เอง',
    );
  };

  const handleExtractPhones = () => {
    const candidates = extractThaiPhoneNumbers(ocrRawText);
    setPhoneCandidates(candidates);

    if (candidates.length === 1) {
      setDriverPhone(candidates[0]);
      setOcrStatus('พบเบอร์โทร 1 เบอร์ และใส่ให้อัตโนมัติแล้ว กรุณาตรวจสอบอีกครั้ง');
      return;
    }

    if (candidates.length > 1) {
      setOcrStatus('พบหลายเบอร์ กรุณาเลือกเบอร์ของคนขับ');
      return;
    }

    setOcrStatus('ไม่พบเบอร์โทรในข้อความ กรุณากรอกเบอร์โทรเอง');
  };

  const handleConfirm = () => {
    if (!workingDraft || !canConfirm) return;

    if (redoPhoneRecordId) {
      const oldRecord = getVehicleRecordById(redoPhoneRecordId);
      const nextPhone = driverPhone.replace(/\D/g, '');
      const confirmed = window.confirm(
        `แทนที่เบอร์โทรหรือไม่?\n\nเดิม: ${oldRecord?.driverPhone ?? '-'}\nใหม่: ${nextPhone}`,
      );
      if (!confirmed) return;
      const updated = updateRecordWithAudit(
        redoPhoneRecordId,
        { driverPhone: nextPhone },
        'redo phone OCR confirmed',
        'user',
        'REDO_PHONE_OCR',
      );
      if (updated) {
        window.location.hash = `/checklist?recordId=${updated.id}`;
      }
      return;
    }

    const previewDraft = createScanPreviewDraft(workingDraft, {
      driverPhone,
      ocrRawText,
      phoneConfirmedAt: new Date().toISOString(),
    });

    saveScanPreviewDraft(previewDraft);
    setConfirmedAt(previewDraft.phoneConfirmedAt ?? '');
    setDriverPhone(previewDraft.driverPhone);
    window.location.hash = '/flash-search';
  };

  const handleClear = () => {
    clearScanPreviewDraft();
    setDriverPhone('');
    setOcrRawText('');
    setPhoneCandidates([]);
    setConfirmedAt('');
    setSelectedFileName('');
    setOcrStatus('ล้าง preview draft แล้ว');
    window.location.hash = '/scan';
  };

  if (!scanDraft) {
    return (
      <div className="scan-preview-page single-column">
        <article className="feature-card primary-card">
          <div className="card-heading-row">
            <div className="large-icon"><ScanLine size={30} /></div>
            <div>
              <StatusBadge label="ต้องสแกนก่อน" tone="warning" />
              <h2>ยังไม่มีข้อมูล QR หรือบาร์โค้ดรถ</h2>
            </div>
          </div>
          <p className="muted-note">กรุณากลับไปหน้า Scan แล้วกรอกลิงก์ QR หรือบาร์โค้ดก่อนอ่านเบอร์โทร</p>
          <PrimaryButton onClick={() => { window.location.hash = '/scan'; }}>
            <ScanLine size={20} />
            <span>กลับไปหน้า Scan</span>
          </PrimaryButton>
        </article>
      </div>
    );
  }

  return (
    <div className="scan-preview-page">
      <section className="preview-main-stack">
        <StepProgress steps={['QR completed', 'Phone number', 'Flash search']} current={1} />
        <article className="feature-card primary-card">
          <div className="card-heading-row">
            <div className="large-icon"><ScanLine size={30} /></div>
            <div>
              <StatusBadge label={redoPhoneRecordId ? 'MVP-009 redo phone' : 'MVP-005 preview/edit'} tone="success" />
              <h2>ตรวจข้อมูลก่อนค้นหา Flash</h2>
            </div>
          </div>

          <div className="preview-edit-grid">
            <label>
              <span>vehicleBarcode</span>
              <input
                value={vehicleBarcode}
                onChange={(event) => setVehicleBarcode(event.target.value.toUpperCase())}
              />
            </label>
            <label>
              <span>sourceUrl</span>
              <input
                value={sourceUrl}
                onChange={(event) => setSourceUrl(event.target.value)}
                placeholder="Flash QR URL ถ้ามี"
              />
            </label>
          </div>

          {barcodeValidation.error ? <p className="form-error">{barcodeValidation.error}</p> : null}

          <div className="scan-result-grid">
            <span>ผู้รับผิดชอบ</span>
            <strong>
              {scanDraft.responsibleEmployeeCode || '-'} {scanDraft.responsibleDisplayName || ''} /{' '}
              {scanDraft.branch || '-'}
            </strong>
            <span>เวลาสแกน</span>
            <strong>{new Date(scanDraft.scannedAt).toLocaleString('th-TH')}</strong>
          </div>
        </article>

        <details className="feature-card advanced-panel">
          <summary>ตัวเลือกขั้นสูง: OCR / ข้อความดิบ</summary>
          <div className="card-heading-row">
            <div className="large-icon"><FileImage size={30} /></div>
            <div>
              <StatusBadge label="OCR foundation" tone="warning" />
              <h2>อ่านเบอร์โทรจากกระดาษ</h2>
            </div>
          </div>

          <div className="ocr-upload-box">
            <label htmlFor="paper-photo-input">รูปกระดาษสำหรับ OCR</label>
            <input
              id="paper-photo-input"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => handleFileSelected(event.target.files?.[0])}
            />
            <p className="muted-note">
              {selectedFileName ? `ไฟล์ที่เลือก: ${selectedFileName}` : 'ยังไม่ได้เลือกไฟล์'}
            </p>
            <p className="scan-message warning">{ocrStatus}</p>
          </div>

          <div className="scan-form">
            <label htmlFor="ocr-raw-text">ข้อความ OCR / ข้อความทดสอบ</label>
            <textarea
              id="ocr-raw-text"
              value={ocrRawText}
              onChange={(event) => setOcrRawText(event.target.value)}
              placeholder={sampleOcrText}
              rows={7}
            />
          </div>

          <div className="scan-actions">
            <PrimaryButton onClick={handleExtractPhones}>
              <Search size={20} />
              <span>ดึงเบอร์จากข้อความ</span>
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => setOcrRawText(sampleOcrText)}>
              <FileImage size={20} />
              <span>ใส่ข้อความตัวอย่าง</span>
            </PrimaryButton>
          </div>

          {phoneCandidates.length > 0 ? (
            <div className="phone-candidate-list">
              <strong>เบอร์ที่พบ</strong>
              <div className="phone-candidate-grid">
                {phoneCandidates.map((candidate) => (
                  <button
                    key={candidate}
                    type="button"
                    className={candidate === driverPhone.replace(/\D/g, '') ? 'phone-chip active' : 'phone-chip'}
                    onClick={() => setDriverPhone(candidate)}
                  >
                    {formatThaiPhone(candidate)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </details>
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card">
          <div className="card-heading-row">
            <div className="large-icon"><Phone size={30} /></div>
            <div>
              <StatusBadge label={phoneValidation.isValid ? 'พร้อมยืนยัน' : 'ต้องแก้ไข'} tone={phoneValidation.isValid ? 'success' : 'warning'} />
              <h2>แก้ไขเบอร์โทรคนขับ</h2>
            </div>
          </div>

          <div className="preview-phone-input">
            <label htmlFor="driver-phone-input">driverPhone</label>
            <input
              id="driver-phone-input"
              value={driverPhone}
              onChange={(event) => setDriverPhone(event.target.value)}
              inputMode="numeric"
              placeholder="0643042911"
            />
            <span>{driverPhone ? formatThaiPhone(driverPhone) : 'กรอกเบอร์โทร 10 หลัก'}</span>
          </div>

          {phoneValidation.error ? <p className="form-error">{phoneValidation.error}</p> : null}
        </article>

        <article className="feature-card action-card">
          <h2>ยืนยันข้อมูล</h2>
          <PrimaryButton onClick={handleConfirm} disabled={!canConfirm}>
            <CheckCircle2 size={20} />
            <span>{redoPhoneRecordId ? 'ยืนยันแทนที่เบอร์' : 'ยืนยันเบอร์และไปหน้า Flash'}</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={handleClear}>
            <RefreshCcw size={20} />
            <span>ล้าง draft / สแกนใหม่</span>
          </PrimaryButton>
          {confirmedAt ? (
            <p className="scan-message success">บันทึก preview แล้วเมื่อ {new Date(confirmedAt).toLocaleString('th-TH')}</p>
          ) : null}
          <p className="muted-note">เส้นทางหลักคือกรอกเบอร์ด้วยมือหรือเลือกเบอร์ที่ตรวจพบ แล้วไปหน้า Flash</p>
        </article>
      </aside>
    </div>
  );
}
