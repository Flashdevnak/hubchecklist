import { ClipboardCheck, Copy, ExternalLink, FileSearch, RefreshCcw, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import {
  checkFlashProofWebViewAvailability,
  openFlashProofInWebView,
} from '../services/flashProofWebView';
import {
  createVehicleRecordFromFlashDraft,
} from '../services/vehicleRecords';
import type { DuplicateVehicleRecordResult, FlashProofResult, ScanPreviewDraft } from '../types';
import {
  getFlashProofResultDraft,
  getScanPreviewDraft,
  isAllowedFlashProofUrl,
  parseFlashProofRawText,
  saveFlashProofResultDraft,
  validateThaiPhoneNumber,
  validateVehicleBarcode,
} from '../utils';

const webFallbackMessage =
  'โหมดเว็บไม่สามารถกรอกเบอร์ในหน้า Flash อัตโนมัติได้ กรุณาคัดลอกเบอร์และเปิดลิงก์เอง';

export default function FlashSearchPage() {
  const [previewDraft, setPreviewDraft] = useState<ScanPreviewDraft | null>(null);
  const [platformStatus, setPlatformStatus] = useState('กำลังตรวจสอบแพลตฟอร์ม');
  const [platformAvailable, setPlatformAvailable] = useState(false);
  const [actionStatus, setActionStatus] = useState('');
  const [flashResult, setFlashResult] = useState<FlashProofResult | null>(null);
  const [manualRawText, setManualRawText] = useState('');
  const [duplicateResult, setDuplicateResult] = useState<DuplicateVehicleRecordResult | null>(null);
  const [recordErrors, setRecordErrors] = useState<string[]>([]);

  useEffect(() => {
    setPreviewDraft(getScanPreviewDraft());
    setFlashResult(getFlashProofResultDraft());
    checkFlashProofWebViewAvailability().then((status) => {
      setPlatformAvailable(status.available);
      setPlatformStatus(status.message);
    });
  }, []);

  const validation = useMemo(() => {
    if (!previewDraft) return 'ยังไม่มี preview draft จาก MVP-005';
    if (!previewDraft.sourceUrl || !isAllowedFlashProofUrl(previewDraft.sourceUrl)) {
      return 'ต้องมี Flash URL ที่ถูกต้องจาก api.flashexpress.com';
    }
    const barcode = validateVehicleBarcode(previewDraft.vehicleBarcode);
    if (!barcode.isValid) return barcode.error ?? 'บาร์โค้ดรถไม่ถูกต้อง';
    const phone = validateThaiPhoneNumber(previewDraft.driverPhone);
    if (!phone.isValid) return phone.error ?? 'เบอร์โทรไม่ถูกต้อง';
    return '';
  }, [previewDraft]);

  const canOpenNative = Boolean(previewDraft) && !validation && platformAvailable;
  const canCreateRecord = Boolean(flashResult?.vehicleBarcode && flashResult.driverPhone);

  const handleOpenFlash = async () => {
    if (!previewDraft) return;
    setActionStatus('กำลังเปิด Android WebView และกรอกเบอร์โทร');
    const response = await openFlashProofInWebView({
      sourceUrl: previewDraft.sourceUrl,
      vehicleBarcode: previewDraft.vehicleBarcode,
      driverPhone: previewDraft.driverPhone,
    });

    setActionStatus(response.message);
    if (response.success && response.data) {
      const result = attachResponsibleProfile(response.data, previewDraft);
      saveFlashProofResultDraft(result);
      setFlashResult(result);
    }
  };

  const handleCopyPhone = async () => {
    if (!previewDraft) return;
    await navigator.clipboard.writeText(previewDraft.driverPhone);
    setActionStatus('คัดลอกเบอร์โทรแล้ว');
  };

  const handleOpenLink = () => {
    if (!previewDraft?.sourceUrl) return;
    window.open(previewDraft.sourceUrl, '_blank', 'noopener,noreferrer');
  };

  const handleManualParse = () => {
    if (!previewDraft || !manualRawText.trim()) return;
    const parsed = parseFlashProofRawText(manualRawText);
    const result: FlashProofResult = {
      sourceUrl: previewDraft.sourceUrl,
      vehicleBarcode: previewDraft.vehicleBarcode,
      driverPhone: previewDraft.driverPhone,
      driverName: parsed.driverName,
      companyName: parsed.companyName,
      routeSummary: parsed.routeSummary,
      firstBranch: parsed.firstBranch,
      lastBranch: parsed.lastBranch,
      routeRows: parsed.routeRows ?? [],
      rawText: manualRawText,
      status: 'manual_fallback',
      message: 'โหมดทดสอบข้อความ / ยังไม่ใช่การดึงจาก Flash อัตโนมัติ',
      flashPageStatus: 'manual_fallback',
      extractedAt: new Date().toISOString(),
      responsibleEmployeeCode: previewDraft.responsibleEmployeeCode,
      responsibleDisplayName: previewDraft.responsibleDisplayName,
      branch: previewDraft.branch,
    };
    saveFlashProofResultDraft(result);
    setFlashResult(result);
    setActionStatus('บันทึกผลจากโหมดทดสอบข้อความแล้ว');
  };

  const handleCreateVehicleRecord = (forceNewTrip = false) => {
    if (!flashResult) return;
    const result = createVehicleRecordFromFlashDraft(flashResult, { forceNewTrip });
    setRecordErrors(result.validationErrors);
    setDuplicateResult(result.duplicate.hasExactDuplicate || result.duplicate.hasConflict ? result.duplicate : null);

    if (result.record) {
      setActionStatus(result.status.message);
      window.location.hash = `/checklist?recordId=${result.record.id}`;
      return;
    }

    if (result.validationErrors.length > 0) {
      setActionStatus('ยังสร้างรายการรถไม่ได้ กรุณาตรวจข้อมูลที่จำเป็น');
    } else if (result.duplicate.message) {
      setActionStatus(result.duplicate.message);
    }
  };

  const handleOpenExisting = () => {
    const existing = duplicateResult?.exactMatches[0] ?? duplicateResult?.conflictingMatches[0];
    if (!existing) return;
    window.location.hash = `/checklist?recordId=${existing.id}`;
  };

  const handleVoidFirstConflict = () => {
    if (!flashResult || !duplicateResult?.conflictingMatches[0]) return;
    const reason = window.prompt('กรุณาระบุเหตุผลการ Void รายการเดิม');
    if (!reason) return;
    const result = createVehicleRecordFromFlashDraft(flashResult, {
      forceNewTrip: true,
      voidExistingId: duplicateResult.conflictingMatches[0].id,
      voidReason: reason,
    });
    if (result.record) {
      window.location.hash = `/checklist?recordId=${result.record.id}`;
    }
  };

  const handleReplaceDraftOnly = () => {
    setDuplicateResult(null);
    setActionStatus('เก็บ Flash draft ล่าสุดไว้แล้ว ยังไม่ได้สร้างรายการรถใหม่');
  };

  if (!previewDraft) {
    return (
      <div className="flash-page single-column">
        <article className="feature-card primary-card">
          <div className="card-heading-row">
            <div className="large-icon"><FileSearch size={30} /></div>
            <div>
              <StatusBadge label="ต้องยืนยัน preview ก่อน" tone="warning" />
              <h2>ยังไม่มีข้อมูลพร้อมค้นหา Flash</h2>
            </div>
          </div>
          <p className="muted-note">กรุณาสแกน QR และยืนยันเบอร์โทรในหน้า Preview ก่อนเปิด Flash</p>
          <PrimaryButton onClick={() => { window.location.hash = '/scan-preview'; }}>
            <Search size={20} />
            <span>ไปหน้า Preview</span>
          </PrimaryButton>
        </article>
      </div>
    );
  }

  return (
    <div className="flash-page">
      <section className="preview-main-stack">
        <article className="feature-card primary-card">
          <div className="card-heading-row">
            <div className="large-icon"><FileSearch size={30} /></div>
            <div>
              <StatusBadge label="MVP-006 WebView foundation" tone="success" />
              <h2>ค้นหา Flash Proof</h2>
            </div>
          </div>

          <div className="scan-result-grid">
            <span>sourceUrl</span>
            <strong>{previewDraft.sourceUrl || '-'}</strong>
            <span>vehicleBarcode</span>
            <strong>{previewDraft.vehicleBarcode}</strong>
            <span>driverPhone</span>
            <strong>{previewDraft.driverPhone}</strong>
            <span>ผู้รับผิดชอบ</span>
            <strong>
              {previewDraft.responsibleEmployeeCode} {previewDraft.responsibleDisplayName} / {previewDraft.branch}
            </strong>
          </div>
          {validation ? <p className="form-error">{validation}</p> : null}
        </article>

        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>สถานะแพลตฟอร์ม</h2>
            <StatusBadge label={platformAvailable ? 'Android WebView available' : 'Web/PWA fallback'} tone={platformAvailable ? 'success' : 'warning'} />
          </div>
          <p className={platformAvailable ? 'scan-message success' : 'scan-message warning'}>
            {platformStatus || webFallbackMessage}
          </p>
          <PrimaryButton onClick={handleOpenFlash} disabled={!canOpenNative}>
            <Search size={20} />
            <span>เปิดหน้า Flash และกรอกเบอร์อัตโนมัติ</span>
          </PrimaryButton>
          {actionStatus ? <p className="muted-note">{actionStatus}</p> : null}
        </article>

        <article className="feature-card">
          <h2>ผลลัพธ์ Flash</h2>
          {flashResult ? (
            <div className="flash-result-preview">
              <StatusBadge
                label={flashResult.status === 'manual_fallback' ? 'Manual fallback' : flashResult.status}
                tone={flashResult.status === 'success' ? 'success' : 'warning'}
              />
              <div className="scan-result-grid">
                <span>routeSummary</span>
                <strong>{flashResult.routeSummary || '-'}</strong>
                <span>firstBranch</span>
                <strong>{flashResult.firstBranch || '-'}</strong>
                <span>lastBranch</span>
                <strong>{flashResult.lastBranch || '-'}</strong>
                <span>routeRows</span>
                <strong>{flashResult.routeRows.length}</strong>
                <span>extractedAt</span>
                <strong>{new Date(flashResult.extractedAt).toLocaleString('th-TH')}</strong>
              </div>
              <pre className="code-block">{flashResult.rawText || flashResult.message || 'ไม่มี rawText'}</pre>
            </div>
          ) : (
            <p className="muted-note">ยังไม่มีผลลัพธ์จริงจาก Android WebView หรือโหมดทดสอบข้อความ</p>
          )}
        </article>

        {flashResult ? (
          <article className="feature-card action-card">
            <h2>สร้างรายการรถ</h2>
            <PrimaryButton onClick={() => handleCreateVehicleRecord(false)} disabled={!canCreateRecord}>
              <ClipboardCheck size={20} />
              <span>สร้างรายการรถ</span>
            </PrimaryButton>
            {recordErrors.length > 0 ? (
              <div className="scan-message danger">
                {recordErrors.map((error) => <span key={error}>{error}</span>)}
              </div>
            ) : null}
            {duplicateResult ? (
              <div className={duplicateResult.hasConflict ? 'scan-message danger' : 'scan-message warning'}>
                <strong>{duplicateResult.message}</strong>
                <div className="record-action-row">
                  <PrimaryButton variant="secondary" onClick={handleOpenExisting}>เปิดรายการเดิม</PrimaryButton>
                  <PrimaryButton variant="secondary" onClick={handleReplaceDraftOnly}>แทนที่ draft เท่านั้น</PrimaryButton>
                  <PrimaryButton variant="secondary" onClick={() => handleCreateVehicleRecord(true)}>สร้างเที่ยวใหม่</PrimaryButton>
                  {duplicateResult.hasConflict ? (
                    <PrimaryButton variant="danger" onClick={handleVoidFirstConflict}>Void รายการผิด</PrimaryButton>
                  ) : null}
                  <PrimaryButton variant="secondary" onClick={() => setDuplicateResult(null)}>ยกเลิก</PrimaryButton>
                </div>
              </div>
            ) : null}
          </article>
        ) : null}
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card action-card">
          <h2>โหมดเว็บ / PWA</h2>
          <p className="scan-message warning">{webFallbackMessage}</p>
          <PrimaryButton variant="secondary" onClick={handleCopyPhone}>
            <Copy size={20} />
            <span>คัดลอกเบอร์โทร</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={handleOpenLink}>
            <ExternalLink size={20} />
            <span>เปิดลิงก์ Flash เอง</span>
          </PrimaryButton>
        </article>

        <article className="feature-card">
          <h2>โหมดทดสอบข้อความ</h2>
          <p className="muted-note">โหมดทดสอบข้อความ / ยังไม่ใช่การดึงจาก Flash อัตโนมัติ</p>
          <div className="scan-form">
            <label htmlFor="manual-flash-text">วางข้อความจากหน้า Flash</label>
            <textarea
              id="manual-flash-text"
              value={manualRawText}
              onChange={(event) => setManualRawText(event.target.value)}
              rows={8}
              placeholder="วางข้อความ route/status จาก Flash เพื่อทดสอบ parser เท่านั้น"
            />
          </div>
          <PrimaryButton onClick={handleManualParse} disabled={!manualRawText.trim()}>
            <RefreshCcw size={20} />
            <span>แปลงข้อความทดสอบ</span>
          </PrimaryButton>
        </article>

        <article className="feature-card">
          <h2>ขั้นตอนถัดไป</h2>
          <p className="muted-note">การสร้าง vehicle record จะทำใน MVP-007</p>
        </article>
      </aside>
    </div>
  );
}

function attachResponsibleProfile(result: FlashProofResult, previewDraft: ScanPreviewDraft): FlashProofResult {
  return {
    ...result,
    responsibleEmployeeCode: previewDraft.responsibleEmployeeCode,
    responsibleDisplayName: previewDraft.responsibleDisplayName,
    branch: previewDraft.branch,
  };
}
