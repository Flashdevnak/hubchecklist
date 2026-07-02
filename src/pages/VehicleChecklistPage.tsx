import { ArrowLeft, ClipboardCheck, FileSearch, PencilLine, Phone, RotateCcw, ScanLine, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import AuditHistory from '../components/AuditHistory';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import {
  getPhotoByType,
  getPhotoCompletionStatus,
  getPhotoStorageMode,
  PHOTO_TYPE_LABELS,
  retakePhoto,
} from '../services/photos';
import { getVehicleRecordById, restoreRecordWithAudit, voidRecordWithAudit } from '../services/vehicleRecords';
import type { PhotoType, VehiclePhoto, VehicleRecord } from '../types';

export default function VehicleChecklistPage() {
  const [record, setRecord] = useState<VehicleRecord | null>(null);
  const [photos, setPhotos] = useState<Record<string, VehiclePhoto | null>>({});
  const [photoMessage, setPhotoMessage] = useState('');

  useEffect(() => {
    const id = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('recordId');
    const found = id ? getVehicleRecordById(id) : null;
    setRecord(found);
    if (found) refreshPhotos(found);
  }, []);

  const handleVoid = () => {
    if (!record) return;
    const reason = window.prompt('กรุณาระบุเหตุผลการยกเลิกรายการ');
    if (!reason) return;
    const confirmed = window.confirm('Void รายการนี้หรือไม่? ระบบจะเก็บรูปและประวัติไว้ ไม่ลบข้อมูลถาวร');
    if (!confirmed) return;
    const next = voidRecordWithAudit(record.id, reason);
    if (next) setRecord(next);
  };

  const handleRestore = () => {
    if (!record) return;
    const reason = window.prompt('ระบุเหตุผลในการกู้คืนรายการ');
    if (!reason) return;
    const confirmed = window.confirm('กู้คืนรายการนี้และคำนวณสถานะใหม่หรือไม่?');
    if (!confirmed) return;
    const next = restoreRecordWithAudit(record.id, reason);
    if (next) setRecord(next);
  };

  const refreshPhotos = (nextRecord: VehicleRecord) => {
    const nextPhotos: Record<string, VehiclePhoto | null> = {};
    nextRecord.requiredPhotos.forEach((type) => {
      nextPhotos[type] = getPhotoByType(nextRecord.id, type as PhotoType);
    });
    setPhotos(nextPhotos);
  };

  const handlePhotoSelected = async (photoType: PhotoType, file: File | undefined) => {
    if (!record || !file) return;
    try {
      setPhotoMessage('กำลังบีบอัดและบันทึกรูป');
      await retakePhoto(record, photoType, file);
      const updated = getVehicleRecordById(record.id);
      if (updated) {
        setRecord(updated);
        refreshPhotos(updated);
      }
      setPhotoMessage(getPhotoStorageMode().message);
    } catch (error) {
      setPhotoMessage(error instanceof Error ? error.message : 'บันทึกรูปไม่สำเร็จ');
    }
  };

  if (!record) {
    return (
      <div className="record-page single-column">
        <article className="feature-card primary-card">
          <div className="card-heading-row">
            <div className="large-icon"><ClipboardCheck size={30} /></div>
            <div>
              <StatusBadge label="ไม่พบรายการ" tone="warning" />
              <h2>ยังไม่มี vehicle record ที่เลือก</h2>
            </div>
          </div>
          <p className="muted-note">กรุณาสร้างรายการรถจากหน้า Flash ก่อนเข้าหน้า Checklist</p>
          <PrimaryButton onClick={() => { window.location.hash = '/dashboard'; }}>
            <ArrowLeft size={20} />
            <span>กลับ Dashboard</span>
          </PrimaryButton>
        </article>
      </div>
    );
  }

  const completion = getPhotoCompletionStatus(record);
  const storageMode = getPhotoStorageMode();

  return (
    <div className="record-page">
      <section className="preview-main-stack">
        <article className="feature-card primary-card">
          <div className="card-heading-row">
            <div className="large-icon"><ClipboardCheck size={30} /></div>
            <div>
              <StatusBadge label={record.status} tone={record.status === 'VOIDED' ? 'danger' : 'success'} />
              <h2>{record.vehicleBarcode}</h2>
            </div>
          </div>

          <div className="scan-result-grid">
            <span>driverPhone</span><strong>{record.driverPhone}</strong>
            <span>driverName</span><strong>{record.driverName || '-'}</strong>
            <span>companyName</span><strong>{record.companyName || '-'}</strong>
            <span>ผู้รับผิดชอบ</span><strong>{record.responsibleEmployeeCode} {record.responsibleDisplayName}</strong>
            <span>branch</span><strong>{record.branch}</strong>
            <span>routeSummary</span><strong>{record.routeSummary || '-'}</strong>
            <span>first / last</span><strong>{record.firstBranch || '-'} / {record.lastBranch || '-'}</strong>
            <span>routeRows</span><strong>{record.routeRows.length}</strong>
            <span>checklistType</span><strong>{record.checklistType}</strong>
            <span>requiredPhotos</span><strong>{record.requiredPhotos.join(', ')}</strong>
            <span>photo progress</span><strong>{completion.completeCount}/{completion.requiredCount}</strong>
            <span>sync</span><strong>{record.syncMessage || record.syncStatus}</strong>
            {record.voidReason ? <><span>voidReason</span><strong>{record.voidReason}</strong></> : null}
          </div>
        </article>

        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>รูปถ่าย Checklist</h2>
            <StatusBadge label={storageMode.mode === 'local_only' ? 'Local photos' : 'R2 signed upload'} tone={storageMode.mode === 'local_only' ? 'warning' : 'success'} />
          </div>
          <p className={completion.isComplete ? 'scan-message success' : 'scan-message warning'}>
            {completion.isComplete ? 'ถ่ายครบแล้ว' : `ยังขาดรูป: ${completion.missingTypes.map((type) => PHOTO_TYPE_LABELS[type]).join(', ')}`}
          </p>
          <p className="muted-note">{photoMessage || storageMode.message}</p>
          <div className="photo-card-grid">
            {completion.required.map((photoType) => {
              const photo = photos[photoType];
              return (
                <article className="photo-card" key={photoType}>
                  <div>
                    <strong>{PHOTO_TYPE_LABELS[photoType]}</strong>
                    <StatusBadge
                      label={photo ? photo.uploadStatus === 'UPLOADED' ? 'อัปโหลดแล้ว' : photo.uploadStatus === 'LOCAL_ONLY' ? 'เก็บในเครื่อง' : 'ถ่ายแล้ว' : 'ยังไม่มีรูป'}
                      tone={photo ? 'success' : 'warning'}
                    />
                  </div>
                  {photo?.localObjectUrl ? <img src={photo.localObjectUrl} alt={PHOTO_TYPE_LABELS[photoType]} /> : <div className="photo-empty">ยังไม่มีรูป</div>}
                  {photo ? (
                    <p className="muted-note">
                      เดิม {(photo.originalSizeBytes / 1024).toFixed(0)} KB / บีบอัด {(photo.sizeBytes / 1024).toFixed(0)} KB<br />
                      {photo.width}x{photo.height} / {photo.uploadError ?? storageMode.message}
                    </p>
                  ) : null}
                  <label className="photo-input-button">
                    <span>{photo ? 'ถ่ายใหม่ / Retake' : 'ถ่ายหรืออัปโหลดรูป'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={(event) => handlePhotoSelected(photoType, event.target.files?.[0])}
                    />
                  </label>
                </article>
              );
            })}
          </div>
        </article>
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card action-card">
          <h2>การทำงาน</h2>
          <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/edit-record?recordId=${record.id}`; }}>
            <PencilLine size={20} />
            <span>แก้ไขข้อมูล</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/scan?redoRecordId=${record.id}`; }}>
            <ScanLine size={20} />
            <span>สแกน QR ใหม่</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/scan-preview?redoPhoneRecordId=${record.id}`; }}>
            <Phone size={20} />
            <span>อ่านเบอร์ใหม่</span>
          </PrimaryButton>
          <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/flash-search?refetchRecordId=${record.id}`; }}>
            <FileSearch size={20} />
            <span>ดึงข้อมูล Flash ใหม่</span>
          </PrimaryButton>
          <PrimaryButton variant="danger" onClick={handleVoid} disabled={record.status === 'VOIDED'}>
            <XCircle size={20} />
            <span>ยกเลิกรายการ / Void</span>
          </PrimaryButton>
          {record.status === 'VOIDED' ? (
            <PrimaryButton variant="secondary" onClick={handleRestore}>
              <RotateCcw size={20} />
              <span>กู้คืนรายการ</span>
            </PrimaryButton>
          ) : null}
          <PrimaryButton onClick={() => { window.location.hash = '/dashboard'; }}>
            <ArrowLeft size={20} />
            <span>กลับ Dashboard</span>
          </PrimaryButton>
        </article>
        <article className="feature-card">
          <AuditHistory recordId={record.id} />
        </article>
      </aside>
    </div>
  );
}
