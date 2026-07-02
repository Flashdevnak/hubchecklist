import { ClipboardCheck, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import { getPhotoCompletionStatus } from '../services/photos';
import { getVehicleRecordStorageStatus, listAuditEntries, listVehicleRecords } from '../services/vehicleRecords';
import type { VehicleRecord } from '../types';

export default function TodayDashboardPage() {
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [groupFilter, setGroupFilter] = useState('active');
  const storage = getVehicleRecordStorageStatus();

  useEffect(() => {
    setRecords(listVehicleRecords());
  }, []);

  const filteredRecords = useMemo(() => {
    const listed = listVehicleRecords({ query, status });
    if (groupFilter === 'active') return listed.filter((record) => record.status !== 'VOIDED');
    if (groupFilter === 'voided') return listed.filter((record) => record.status === 'VOIDED');
    if (groupFilter === 'complete') return listed.filter((record) => record.status === 'COMPLETE');
    if (groupFilter === 'pending') return listed.filter((record) => ['READY_FOR_PHOTO', 'PENDING_PHOTO', 'NEED_REVIEW'].includes(record.status));
    return listed;
  }, [groupFilter, query, status, records]);
  const counts = useMemo(() => ({
    total: records.length,
    ready: records.filter((record) => record.status === 'READY_FOR_PHOTO').length,
    pending: records.filter((record) => record.status === 'PENDING_PHOTO').length,
    complete: records.filter((record) => record.status === 'COMPLETE').length,
    voided: records.filter((record) => record.status === 'VOIDED').length,
  }), [records]);

  return (
    <div className="dashboard-page">
      <section className="stat-grid">
        <article className="feature-card"><strong>{counts.total}</strong><span>total</span></article>
        <article className="feature-card"><strong>{counts.ready}</strong><span>READY_FOR_PHOTO</span></article>
        <article className="feature-card"><strong>{counts.pending}</strong><span>PENDING_PHOTO</span></article>
        <article className="feature-card"><strong>{counts.complete}</strong><span>COMPLETE</span></article>
        <article className="feature-card"><strong>{counts.voided}</strong><span>VOIDED</span></article>
      </section>

      <article className="feature-card">
        <div className="scan-result-heading">
          <h2>รายการรถวันนี้</h2>
          <StatusBadge label={storage.mode === 'local_only' ? 'Local mode' : 'Supabase configured'} tone={storage.mode === 'local_only' ? 'warning' : 'success'} />
        </div>
        <p className="muted-note">{storage.message}</p>
        <div className="dashboard-filters">
          <label>
            <span>ค้นหา barcode / phone / responsible</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="NAK1R7XJ45 / 0643042911 / 25845" />
          </label>
          <label>
            <span>status</span>
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              <option value="">ทั้งหมด</option>
              <option value="READY_FOR_PHOTO">READY_FOR_PHOTO</option>
              <option value="PENDING_PHOTO">PENDING_PHOTO</option>
              <option value="COMPLETE">COMPLETE</option>
              <option value="NEED_REVIEW">NEED_REVIEW</option>
              <option value="VOIDED">VOIDED</option>
            </select>
          </label>
          <label>
            <span>filter</span>
            <select value={groupFilter} onChange={(event) => setGroupFilter(event.target.value)}>
              <option value="active">active</option>
              <option value="voided">voided</option>
              <option value="complete">complete</option>
              <option value="pending">pending</option>
              <option value="all">all</option>
            </select>
          </label>
        </div>
      </article>

      <section className="record-card-grid">
        {filteredRecords.map((record) => {
          const auditEntries = listAuditEntries(record.id);
          const hasManualEdit = auditEntries.some((entry) => ['FIELD_EDIT', 'PHONE_EDIT', 'ROUTE_EDIT', 'CHECKLIST_TYPE_CHANGE'].includes(entry.actionType));
          const hasRedo = auditEntries.some((entry) => ['REDO_QR_SCAN', 'REDO_PHONE_OCR', 'REFETCH_FLASH'].includes(entry.actionType));
          return (
          <article className="feature-card record-card" key={record.id}>
            <div className="scan-result-heading">
              <h3>{record.vehicleBarcode}</h3>
              <StatusBadge label={record.status} tone={record.status === 'VOIDED' ? 'danger' : 'success'} />
            </div>
            <div className="record-indicators">
              {hasManualEdit ? <StatusBadge label="manual edit" tone="warning" /> : null}
              {hasRedo ? <StatusBadge label="redo/refetch" tone="neutral" /> : null}
              {record.status === 'VOIDED' ? <StatusBadge label="searchable voided" tone="danger" /> : null}
            </div>
            <p>{record.driverPhone} / {record.responsibleEmployeeCode} {record.responsibleDisplayName}</p>
            <p className="muted-note">
              รูปถ่าย {getPhotoCompletionStatus(record).completeCount}/{getPhotoCompletionStatus(record).requiredCount}
            </p>
            <p className="muted-note">{record.routeSummary || record.sourceUrl}</p>
            <PrimaryButton onClick={() => { window.location.hash = `/checklist?recordId=${record.id}`; }}>
              <ClipboardCheck size={20} />
              <span>เปิดรายการ</span>
            </PrimaryButton>
          </article>
        );
        })}
        {filteredRecords.length === 0 ? (
          <article className="feature-card">
            <Search size={32} />
            <p className="muted-note">ยังไม่มีรายการรถที่ตรงกับเงื่อนไข</p>
          </article>
        ) : null}
      </section>
    </div>
  );
}
