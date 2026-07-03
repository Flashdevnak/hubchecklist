import { ClipboardCheck, Edit3, History, ImagePlus, Search, UserCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import WarningCard from '../components/WarningCard';
import { formatBytes as formatBackupBytes, getBackupCleanupSummary } from '../services/backupCleanup';
import {
  type DashboardDateMode,
  type DashboardSortMode,
  type DashboardStatusFilter,
  filterVehicleRecords,
  getBranchOptions,
  getDashboardSummary,
  getLocalDateString,
  getOperationalAlerts,
  getPhotoProgress,
  getRecordOperationalFlags,
  getResponsibleSummary,
  sortVehicleRecords,
} from '../services/dashboardSelectors';
import { getPhotoStorageMode, listVehiclePhotos } from '../services/photos';
import { getVehicleRecordStorageStatus, listAuditEntries, listVehicleRecords } from '../services/vehicleRecords';
import type { EditHistoryEntry, VehiclePhoto, VehicleRecord } from '../types';
import { getActiveResponsibleProfile, getRoleMode } from '../utils';

const STATUS_FILTERS: Array<{ id: DashboardStatusFilter; label: string }> = [
  { id: 'all', label: 'ทั้งหมด' },
  { id: 'active', label: 'Active' },
  { id: 'READY_FOR_PHOTO', label: 'รอถ่ายรูป' },
  { id: 'PENDING_PHOTO', label: 'ขาดรูป' },
  { id: 'COMPLETE', label: 'รูปครบ' },
  { id: 'VOIDED', label: 'Void' },
  { id: 'edited', label: 'Edited' },
  { id: 'redo', label: 'Redo/Refetch' },
  { id: 'duplicate', label: 'Duplicate warning' },
  { id: 'local_only', label: 'Local-only photos' },
  { id: 'upload_failed', label: 'Upload failed' },
];

const SORT_OPTIONS: Array<{ id: DashboardSortMode; label: string }> = [
  { id: 'latest', label: 'ล่าสุดก่อน' },
  { id: 'oldest', label: 'เก่าสุดก่อน' },
  { id: 'status', label: 'สถานะ' },
  { id: 'responsible', label: 'ผู้รับผิดชอบ' },
  { id: 'barcode', label: 'บาร์โค้ดรถ' },
  { id: 'missing_photos', label: 'ขาดรูปก่อน' },
];

export default function TodayDashboardPage() {
  const activeProfile = getActiveResponsibleProfile();
  const roleMode = getRoleMode();
  const today = getLocalDateString(new Date());
  const [records, setRecords] = useState<VehicleRecord[]>([]);
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [audits, setAudits] = useState<EditHistoryEntry[]>([]);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>('active');
  const [dateMode, setDateMode] = useState<DashboardDateMode>('today');
  const [selectedDate, setSelectedDate] = useState(today);
  const [branch, setBranch] = useState(activeProfile?.branch ?? 'all');
  const [responsibleEmployeeCode, setResponsibleEmployeeCode] = useState('');
  const [sortMode, setSortMode] = useState<DashboardSortMode>('latest');
  const vehicleStorage = getVehicleRecordStorageStatus();
  const photoStorage = getPhotoStorageMode();
  const backupSummary = getBackupCleanupSummary();

  useEffect(() => {
    setRecords(listVehicleRecords());
    setPhotos(listVehiclePhotos());
    setAudits(listAuditEntries());
  }, []);

  const baseFilteredRecords = useMemo(() => filterVehicleRecords(records, photos, audits, {
    query,
    statusFilter,
    dateMode,
    selectedDate,
    branch,
    responsibleEmployeeCode,
  }), [audits, branch, dateMode, photos, query, records, responsibleEmployeeCode, selectedDate, statusFilter]);

  const filteredRecords = useMemo(() => sortVehicleRecords(baseFilteredRecords, photos, sortMode), [baseFilteredRecords, photos, sortMode]);
  const visibleSummary = useMemo(() => getDashboardSummary(baseFilteredRecords, photos, audits), [audits, baseFilteredRecords, photos]);
  const allSummary = useMemo(() => getDashboardSummary(records, photos, audits), [audits, photos, records]);
  const responsibleSummary = useMemo(() => getResponsibleSummary(baseFilteredRecords, photos, audits), [audits, baseFilteredRecords, photos]);
  const alerts = useMemo(() => getOperationalAlerts(baseFilteredRecords, photos, audits), [audits, baseFilteredRecords, photos]);
  const branches = useMemo(() => getBranchOptions(records), [records]);
  const staffRecords = useMemo(
    () => records.filter((record) => (
      activeProfile &&
      record.responsibleEmployeeCode === activeProfile.employeeCode &&
      record.workDate === today
    )),
    [activeProfile, records, today],
  );

  const setQuickDate = (mode: DashboardDateMode) => {
    setDateMode(mode);
    if (mode === 'today') setSelectedDate(today);
    if (mode === 'yesterday') {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      setSelectedDate(getLocalDateString(date));
    }
  };

  if (roleMode === 'staff') {
    const staffSummary = getDashboardSummary(staffRecords, photos, audits);
    const pendingPhotoRecords = staffRecords.filter((record) => getPhotoProgress(record, photos).missingCount > 0 && record.status !== 'VOIDED');
    return (
      <div className="dashboard-page staff-home">
        {!activeProfile ? (
          <WarningCard
            title="กรุณาเลือกผู้รับผิดชอบก่อนเริ่มงาน"
            action={<PrimaryButton onClick={() => { window.location.hash = '/responsible-profile'; }}>เลือกผู้รับผิดชอบ</PrimaryButton>}
          >
            เมื่อเลือกแล้ว ระบบจะผูกงานสแกน รูปถ่าย และ Export กับชื่อนั้น
          </WarningCard>
        ) : (
          <article className="feature-card primary-card staff-hero-card">
            <div>
              <StatusBadge label="พร้อมเริ่มงาน" tone="success" />
              <h2>{activeProfile.employeeCode} {activeProfile.displayName} / {activeProfile.branch}</h2>
              <p className="muted-note">โหมดพนักงานแสดงเฉพาะงานที่ต้องใช้หน้างานเร็ว ๆ</p>
            </div>
            <div className="scan-actions">
              <PrimaryButton onClick={() => { window.location.hash = '/scan'; }}>เริ่มสแกนรถ</PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => { window.location.hash = pendingPhotoRecords[0] ? `/checklist?recordId=${pendingPhotoRecords[0].id}` : '/dashboard'; }}>
                ถ่ายรูปงานค้าง
              </PrimaryButton>
            </div>
          </article>
        )}

        <section className="dashboard-summary-grid">
          <SummaryCard label="งานของฉันวันนี้" value={staffSummary.total} />
          <SummaryCard label="รอถ่ายรูป" value={staffSummary.ready + staffSummary.pending} tone="warning" />
          <SummaryCard label="รูปครบ" value={staffSummary.complete} tone="success" />
          <SummaryCard label="รูปในเครื่อง" value={staffSummary.localOnlyPhotos} tone="warning" />
        </section>

        <section className="record-card-grid">
          {staffRecords.map((record) => (
            <DashboardRecordCard
              audits={audits}
              key={record.id}
              photos={photos}
              record={record}
              records={records}
            />
          ))}
          {staffRecords.length === 0 ? (
            <article className="feature-card dashboard-empty-state">
              <Search size={38} />
              <h2>ยังไม่มีงานของฉันวันนี้</h2>
              <p className="muted-note">เลือกผู้รับผิดชอบแล้วกดเริ่มสแกนรถเพื่อสร้างรายการจากงานจริง</p>
              <div className="scan-actions">
                <PrimaryButton onClick={() => { window.location.hash = '/scan'; }}>เริ่มสแกนรถ</PrimaryButton>
                <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/responsible-profile'; }}>ผู้รับผิดชอบ</PrimaryButton>
              </div>
            </article>
          ) : null}
        </section>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-summary-grid">
        <SummaryCard label="รถทั้งหมดวันนี้" value={visibleSummary.total} />
        <SummaryCard label="รอถ่ายรูป" value={visibleSummary.ready} tone="warning" />
        <SummaryCard label="ขาดรูป" value={visibleSummary.pending} tone="warning" />
        <SummaryCard label="รูปครบ" value={visibleSummary.complete} tone="success" />
        <SummaryCard label="ยกเลิก" value={visibleSummary.voided} tone="danger" />
        <SummaryCard label="มีการแก้ไข" value={visibleSummary.edited} tone="warning" />
        <SummaryCard label="Redo / Refetch" value={visibleSummary.redoOrRefetch} />
        <SummaryCard label="รูปในเครื่อง" value={visibleSummary.localOnlyPhotos} tone="warning" />
        <SummaryCard label="อัปโหลดแล้ว" value={visibleSummary.uploadedPhotos} tone="success" />
      </section>

      <section className="dashboard-control-grid">
        <article className="feature-card dashboard-search-card">
          <div className="scan-result-heading">
            <h2>ค้นหารายการรถ</h2>
            <StatusBadge label={`${filteredRecords.length} รายการ`} tone="neutral" />
          </div>
          <label className="dashboard-search-input">
            <span>barcode / phone / route / branch / responsible / status</span>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="NAK1R7XJ45 / 0643042911 / BNAK / COMPLETE"
            />
          </label>
          <div className="dashboard-chip-grid">
            {STATUS_FILTERS.map((filter) => (
              <button
                className={filter.id === statusFilter ? 'filter-chip active' : 'filter-chip'}
                key={filter.id}
                type="button"
                onClick={() => setStatusFilter(filter.id)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </article>

        <article className="feature-card">
          <h2>วันที่ / สาขา / เรียงลำดับ</h2>
          <div className="dashboard-quick-actions">
            <button type="button" className={dateMode === 'today' ? 'filter-chip active' : 'filter-chip'} onClick={() => setQuickDate('today')}>วันนี้</button>
            <button type="button" className={dateMode === 'yesterday' ? 'filter-chip active' : 'filter-chip'} onClick={() => setQuickDate('yesterday')}>เมื่อวาน</button>
            <button type="button" className={dateMode === 'last7' ? 'filter-chip active' : 'filter-chip'} onClick={() => setQuickDate('last7')}>7 วันล่าสุด</button>
            <button type="button" className={dateMode === 'all' ? 'filter-chip active' : 'filter-chip'} onClick={() => setQuickDate('all')}>ทั้งหมดในเครื่อง</button>
          </div>
          <div className="dashboard-filters">
            <label>
              <span>workDate</span>
              <input type="date" value={selectedDate} onChange={(event) => { setSelectedDate(event.target.value); setDateMode('custom'); }} />
            </label>
            <label>
              <span>branch</span>
              <select value={branch} onChange={(event) => setBranch(event.target.value)}>
                <option value="all">All branches</option>
                <option value="BNAK">BNAK</option>
                {branches.filter((item) => item !== 'BNAK').map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>sort</span>
              <select value={sortMode} onChange={(event) => setSortMode(event.target.value as DashboardSortMode)}>
                {SORT_OPTIONS.map((option) => <option value={option.id} key={option.id}>{option.label}</option>)}
              </select>
            </label>
          </div>
          {responsibleEmployeeCode ? (
            <p className="scan-message warning">
              กำลังกรองผู้รับผิดชอบ {responsibleEmployeeCode}
              <button className="inline-reset-button" type="button" onClick={() => setResponsibleEmployeeCode('')}>ล้างตัวกรอง</button>
            </p>
          ) : null}
        </article>
      </section>

      <section className="dashboard-two-column">
        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>สรุปผู้รับผิดชอบ</h2>
            <StatusBadge label={`${responsibleSummary.length} คน`} tone="neutral" />
          </div>
          <div className="responsible-summary-grid">
            {responsibleSummary.map((item) => (
              <button
                className={responsibleEmployeeCode === item.employeeCode ? 'responsible-summary-card active' : 'responsible-summary-card'}
                key={item.key}
                type="button"
                onClick={() => setResponsibleEmployeeCode(item.employeeCode === '-' ? '' : item.employeeCode)}
              >
                <strong>{item.employeeCode} {item.displayName}</strong>
                <span>{item.branch}</span>
                <div>
                  <StatusBadge label={`total ${item.total}`} />
                  <StatusBadge label={`complete ${item.complete}`} tone="success" />
                  <StatusBadge label={`pending ${item.pendingPhoto}`} tone="warning" />
                  <StatusBadge label={`void ${item.voided}`} tone={item.voided ? 'danger' : 'neutral'} />
                  <StatusBadge label={`edited ${item.edited}`} tone={item.edited ? 'warning' : 'neutral'} />
                </div>
                <small>updated {formatDateTime(item.lastUpdatedAt)}</small>
              </button>
            ))}
          </div>
        </article>

        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>Operational alerts</h2>
            <StatusBadge label="ไม่บล็อกงาน" tone="warning" />
          </div>
          <div className="alert-grid">
            {alerts.map((alert) => (
              <button
                className={alert.count > 0 ? 'alert-item active' : 'alert-item'}
                type="button"
                key={alert.id}
                onClick={() => applyAlertFilter(alert.id, setStatusFilter)}
              >
                <StatusBadge label={String(alert.count)} tone={alert.count > 0 ? alert.tone : 'neutral'} />
                <span>{alert.label}</span>
              </button>
            ))}
          </div>
        </article>
      </section>

      <article className="feature-card">
        <div className="scan-result-heading">
          <h2>Local / Cloud status</h2>
          <StatusBadge label={vehicleStorage.mode === 'local_only' ? 'Local-first' : 'Supabase configured'} tone={vehicleStorage.mode === 'local_only' ? 'warning' : 'success'} />
        </div>
        <div className="storage-status-grid">
          <StatusLine label="Supabase" value={vehicleStorage.message} />
          <StatusLine label="R2 signed upload" value={photoStorage.message} />
          <StatusLine label="Local-only photo count" value={String(allSummary.localOnlyPhotos)} />
          <StatusLine label="Uploaded photo count" value={String(allSummary.uploadedPhotos)} />
          <StatusLine label="Upload failed count" value={String(allSummary.uploadFailedPhotos)} />
          <StatusLine label="Estimated local photo size" value={formatBytes(allSummary.estimatedLocalPhotoBytes)} />
          <StatusLine label="Backup warning" value={`${backupSummary.warningLevel}: ${backupSummary.warningMessage}`} />
          <StatusLine label="Photos not backed up" value={String(backupSummary.photosNotBackedUp)} />
          <StatusLine label="Eligible for cleanup" value={`${backupSummary.photosEligibleForCleanup} / ${formatBackupBytes(backupSummary.estimatedPhotoStorageBytes)}`} />
        </div>
        <div className="scan-actions">
          <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/backup-cleanup'; }}>
            <span>Backup / Cleanup Guard</span>
          </PrimaryButton>
        </div>
      </article>

      <section className="record-card-grid">
        {filteredRecords.map((record) => (
          <DashboardRecordCard
            audits={audits}
            key={record.id}
            photos={photos}
            record={record}
            records={records}
          />
        ))}
        {filteredRecords.length === 0 ? (
          <article className="feature-card dashboard-empty-state">
            <Search size={38} />
            <h2>ยังไม่มีรายการที่ตรงกับเงื่อนไข</h2>
            <p className="muted-note">ลองล้างตัวกรอง หรือเริ่มสแกนรถคันใหม่หลังเลือกผู้รับผิดชอบ</p>
            <div className="scan-actions">
              <PrimaryButton onClick={() => { window.location.hash = '/scan'; }}>
                <ClipboardCheck size={20} />
                <span>ไปสแกน</span>
              </PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/responsible-profile'; }}>
                <UserCog size={20} />
                <span>เลือกผู้รับผิดชอบ</span>
              </PrimaryButton>
            </div>
          </article>
        ) : null}
      </section>
    </div>
  );
}

function DashboardRecordCard({ record, records, photos, audits }: {
  record: VehicleRecord;
  records: VehicleRecord[];
  photos: VehiclePhoto[];
  audits: EditHistoryEntry[];
}) {
  const progress = getPhotoProgress(record, photos);
  const flags = getRecordOperationalFlags(record, records, photos, audits);
  return (
    <article className="feature-card record-card dashboard-record-card">
      <div className="scan-result-heading">
        <div>
          <h3>{record.vehicleBarcode || 'Missing barcode'}</h3>
          <p className="muted-note">{record.driverPhone || 'missing phone'}</p>
        </div>
        <StatusBadge label={record.status} tone={record.status === 'VOIDED' ? 'danger' : record.status === 'COMPLETE' ? 'success' : 'warning'} />
      </div>
      <div className="record-indicators">
        <StatusBadge label={record.checklistType} />
        <StatusBadge label={`${progress.completeCount}/${progress.requiredCount} photos`} tone={progress.missingCount > 0 ? 'warning' : 'success'} />
        {flags.edited ? <StatusBadge label="edited" tone="warning" /> : null}
        {flags.redoOrRefetch ? <StatusBadge label="redo/refetch" tone="neutral" /> : null}
        {flags.voided ? <StatusBadge label="voided" tone="danger" /> : null}
        {flags.duplicateWarning ? <StatusBadge label="duplicate/conflict" tone="danger" /> : null}
        {flags.localOnlyPhotos ? <StatusBadge label="local photos" tone="warning" /> : null}
        {flags.uploadFailed ? <StatusBadge label="upload failed" tone="danger" /> : null}
      </div>
      <div className="scan-result-grid compact-grid">
        <span>responsible</span><strong>{record.responsibleEmployeeCode || '-'} {record.responsibleDisplayName || ''}</strong>
        <span>branch</span><strong>{record.branch || '-'}</strong>
        <span>route</span><strong>{record.routeSummary || record.sourceUrl || '-'}</strong>
        <span>updated</span><strong>{formatDateTime(record.updatedAt)}</strong>
      </div>
      <div className="record-action-row">
        <PrimaryButton onClick={() => { window.location.hash = `/checklist?recordId=${record.id}`; }}>
          <ClipboardCheck size={20} />
          <span>เปิดรายการ</span>
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/edit-record?recordId=${record.id}`; }}>
          <Edit3 size={20} />
          <span>แก้ไข</span>
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/checklist?recordId=${record.id}`; }}>
          <History size={20} />
          <span>ดูประวัติ</span>
        </PrimaryButton>
        {progress.missingCount > 0 && record.status !== 'VOIDED' ? (
          <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/checklist?recordId=${record.id}`; }}>
            <ImagePlus size={20} />
            <span>ถ่ายรูปต่อ</span>
          </PrimaryButton>
        ) : null}
      </div>
    </article>
  );
}

function SummaryCard({ label, value, tone = 'neutral' }: { label: string; value: number; tone?: 'warning' | 'success' | 'neutral' | 'danger' }) {
  return (
    <article className="feature-card summary-card">
      <strong>{value}</strong>
      <span>{label}</span>
      <StatusBadge label={tone} tone={tone} />
    </article>
  );
}

function StatusLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="status-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function applyAlertFilter(alertId: string, setStatusFilter: (filter: DashboardStatusFilter) => void) {
  const map: Record<string, DashboardStatusFilter> = {
    missing_photos: 'PENDING_PHOTO',
    voided_today: 'VOIDED',
    edited_today: 'edited',
    upload_failed: 'upload_failed',
    duplicate: 'duplicate',
    missing_responsible: 'all',
    missing_phone: 'all',
    missing_barcode: 'all',
  };
  setStatusFilter(map[alertId] ?? 'all');
}

function formatDateTime(value: string): string {
  if (!value) return '-';
  return new Date(value).toLocaleString('th-TH');
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
