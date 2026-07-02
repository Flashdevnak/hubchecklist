import { ArrowLeft, ClipboardCheck, PencilLine, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import { getVehicleRecordById, voidVehicleRecord } from '../services/vehicleRecords';
import type { VehicleRecord } from '../types';

export default function VehicleChecklistPage() {
  const [record, setRecord] = useState<VehicleRecord | null>(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('recordId');
    setRecord(id ? getVehicleRecordById(id) : null);
  }, []);

  const handleVoid = () => {
    if (!record) return;
    const reason = window.prompt('กรุณาระบุเหตุผลการยกเลิกรายการ');
    if (!reason) return;
    const next = voidVehicleRecord(record.id, reason);
    if (next) setRecord(next);
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
            <span>sync</span><strong>{record.syncMessage || record.syncStatus}</strong>
            {record.voidReason ? <><span>voidReason</span><strong>{record.voidReason}</strong></> : null}
          </div>
        </article>

        <article className="feature-card">
          <h2>รูปถ่าย Checklist</h2>
          <p className="scan-message warning">การถ่ายรูปจะทำใน MVP-008</p>
          <ul className="check-list">
            {record.requiredPhotos.map((photo) => <li key={photo}>{photo}</li>)}
          </ul>
        </article>
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card action-card">
          <h2>การทำงาน</h2>
          <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/edit-record?recordId=${record.id}`; }}>
            <PencilLine size={20} />
            <span>แก้ไขข้อมูล</span>
          </PrimaryButton>
          <PrimaryButton variant="danger" onClick={handleVoid} disabled={record.status === 'VOIDED'}>
            <XCircle size={20} />
            <span>ยกเลิกรายการ / Void</span>
          </PrimaryButton>
          <PrimaryButton onClick={() => { window.location.hash = '/dashboard'; }}>
            <ArrowLeft size={20} />
            <span>กลับ Dashboard</span>
          </PrimaryButton>
        </article>
      </aside>
    </div>
  );
}
