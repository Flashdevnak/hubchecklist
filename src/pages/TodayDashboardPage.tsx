import { ClipboardCheck, Edit3, History, ImagePlus, Search, UserCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
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
import { getActiveResponsibleProfile, getRoleMode, upsertResponsibleProfile } from '../utils';

const STATUS_FILTERS: Array<{ id: DashboardStatusFilter; label: string }> = [
  { id: 'all', label: 'à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”' },
  { id: 'active', label: 'Active' },
  { id: 'READY_FOR_PHOTO', label: 'à¸£à¸­à¸–à¹ˆà¸²à¸¢à¸£à¸¹à¸›' },
  { id: 'PENDING_PHOTO', label: 'à¸‚à¸²à¸”à¸£à¸¹à¸›' },
  { id: 'COMPLETE', label: 'à¸£à¸¹à¸›à¸„à¸£à¸š' },
  { id: 'VOIDED', label: 'Void' },
  { id: 'edited', label: 'Edited' },
  { id: 'redo', label: 'Redo/Refetch' },
  { id: 'duplicate', label: 'Duplicate warning' },
  { id: 'local_only', label: 'Local-only photos' },
  { id: 'upload_failed', label: 'Upload failed' },
];

const SORT_OPTIONS: Array<{ id: DashboardSortMode; label: string }> = [
  { id: 'latest', label: 'à¸¥à¹ˆà¸²à¸ªà¸¸à¸”à¸à¹ˆà¸­à¸™' },
  { id: 'oldest', label: 'à¹€à¸à¹ˆà¸²à¸ªà¸¸à¸”à¸à¹ˆà¸­à¸™' },
  { id: 'status', label: 'à¸ªà¸–à¸²à¸™à¸°' },
  { id: 'responsible', label: 'à¸œà¸¹à¹‰à¸£à¸±à¸šà¸œà¸´à¸”à¸Šà¸­à¸š' },
  { id: 'barcode', label: 'à¸šà¸²à¸£à¹Œà¹‚à¸„à¹‰à¸”à¸£à¸–' },
  { id: 'missing_photos', label: 'à¸‚à¸²à¸”à¸£à¸¹à¸›à¸à¹ˆà¸­à¸™' },
];

export default function TodayDashboardPage() {
  const roleMode = getRoleMode();
  const today = getLocalDateString(new Date());
  const [activeProfile, setActiveProfile] = useState(getActiveResponsibleProfile());
  const [profileForm, setProfileForm] = useState({
    employeeCode: '25845',
    displayName: 'Tui',
    branch: 'BNAK',
  });
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

  const saveStaffProfile = () => {
    if (!profileForm.employeeCode.trim() || !profileForm.displayName.trim() || !profileForm.branch.trim()) return;
    const profile = upsertResponsibleProfile(profileForm);
    setActiveProfile(profile);
    setBranch(profile.branch);
  };

  if (roleMode === 'staff') {
    const staffSummary = getDashboardSummary(staffRecords, photos, audits);
    const pendingPhotoRecords = staffRecords.filter((record) => getPhotoProgress(record, photos).missingCount > 0 && record.status !== 'VOIDED');
    return (
      <div className="dashboard-page staff-home">
        {!activeProfile ? (
          <article className="feature-card staff-setup-card">
            <div className="scan-result-heading">
              <div>
                <h2>เริ่มงานวันนี้</h2>
                <p className="muted-note">บันทึกผู้รับผิดชอบครั้งแรก แล้วเริ่มสแกนได้ทันที</p>
              </div>
              <StatusBadge label="ต้องตั้งค่า" tone="warning" />
            </div>
            <div className="profile-form-grid">
              <label>
                <span>รหัสพนักงาน</span>
                <input value={profileForm.employeeCode} onChange={(event) => setProfileForm((current) => ({ ...current, employeeCode: event.target.value }))} />
              </label>
              <label>
                <span>ชื่อ</span>
                <input value={profileForm.displayName} onChange={(event) => setProfileForm((current) => ({ ...current, displayName: event.target.value }))} />
              </label>
              <label>
                <span>สาขา</span>
                <input value={profileForm.branch} onChange={(event) => setProfileForm((current) => ({ ...current, branch: event.target.value.toUpperCase() }))} />
              </label>
            </div>
            <PrimaryButton onClick={saveStaffProfile}>บันทึกและเริ่มงาน</PrimaryButton>
          </article>
        ) : (
          <article className="feature-card primary-card staff-hero-card">
            <div>
              <StatusBadge label="à¸žà¸£à¹‰à¸­à¸¡à¹€à¸£à¸´à¹ˆà¸¡à¸‡à¸²à¸™" tone="success" />
              <h2>{activeProfile.employeeCode} {activeProfile.displayName} / {activeProfile.branch}</h2>
              <p className="muted-note">à¹‚à¸«à¸¡à¸”à¸žà¸™à¸±à¸à¸‡à¸²à¸™à¹à¸ªà¸”à¸‡à¹€à¸‰à¸žà¸²à¸°à¸‡à¸²à¸™à¸—à¸µà¹ˆà¸•à¹‰à¸­à¸‡à¹ƒà¸Šà¹‰à¸«à¸™à¹‰à¸²à¸‡à¸²à¸™à¹€à¸£à¹‡à¸§ à¹†</p>
            </div>
            <div className="scan-actions">
              <PrimaryButton onClick={() => { window.location.hash = '/scan'; }}>à¹€à¸£à¸´à¹ˆà¸¡à¸ªà¹à¸à¸™à¸£à¸–</PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => { window.location.hash = pendingPhotoRecords[0] ? `/checklist?recordId=${pendingPhotoRecords[0].id}` : '/dashboard'; }}>
                à¸–à¹ˆà¸²à¸¢à¸£à¸¹à¸›à¸‡à¸²à¸™à¸„à¹‰à¸²à¸‡
              </PrimaryButton>
            </div>
          </article>
        )}

        <section className="dashboard-summary-grid">
          <SummaryCard label="à¸‡à¸²à¸™à¸‚à¸­à¸‡à¸‰à¸±à¸™à¸§à¸±à¸™à¸™à¸µà¹‰" value={staffSummary.total} />
          <SummaryCard label="à¸£à¸­à¸–à¹ˆà¸²à¸¢à¸£à¸¹à¸›" value={staffSummary.ready + staffSummary.pending} tone="warning" />
          <SummaryCard label="à¸£à¸¹à¸›à¸„à¸£à¸š" value={staffSummary.complete} tone="success" />
          <SummaryCard label="à¸£à¸¹à¸›à¹ƒà¸™à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡" value={staffSummary.localOnlyPhotos} tone="warning" />
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
              <h2>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸‡à¸²à¸™à¸‚à¸­à¸‡à¸‰à¸±à¸™à¸§à¸±à¸™à¸™à¸µà¹‰</h2>
              <p className="muted-note">à¹€à¸¥à¸·à¸­à¸à¸œà¸¹à¹‰à¸£à¸±à¸šà¸œà¸´à¸”à¸Šà¸­à¸šà¹à¸¥à¹‰à¸§à¸à¸”à¹€à¸£à¸´à¹ˆà¸¡à¸ªà¹à¸à¸™à¸£à¸–à¹€à¸žà¸·à¹ˆà¸­à¸ªà¸£à¹‰à¸²à¸‡à¸£à¸²à¸¢à¸à¸²à¸£à¸ˆà¸²à¸à¸‡à¸²à¸™à¸ˆà¸£à¸´à¸‡</p>
              <div className="scan-actions">
                <PrimaryButton onClick={() => { window.location.hash = '/scan'; }}>à¹€à¸£à¸´à¹ˆà¸¡à¸ªà¹à¸à¸™à¸£à¸–</PrimaryButton>
                <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/responsible-profile'; }}>à¸œà¸¹à¹‰à¸£à¸±à¸šà¸œà¸´à¸”à¸Šà¸­à¸š</PrimaryButton>
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
        <SummaryCard label="à¸£à¸–à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¸§à¸±à¸™à¸™à¸µà¹‰" value={visibleSummary.total} />
        <SummaryCard label="à¸£à¸­à¸–à¹ˆà¸²à¸¢à¸£à¸¹à¸›" value={visibleSummary.ready} tone="warning" />
        <SummaryCard label="à¸‚à¸²à¸”à¸£à¸¹à¸›" value={visibleSummary.pending} tone="warning" />
        <SummaryCard label="à¸£à¸¹à¸›à¸„à¸£à¸š" value={visibleSummary.complete} tone="success" />
        <SummaryCard label="à¸¢à¸à¹€à¸¥à¸´à¸" value={visibleSummary.voided} tone="danger" />
        <SummaryCard label="à¸¡à¸µà¸à¸²à¸£à¹à¸à¹‰à¹„à¸‚" value={visibleSummary.edited} tone="warning" />
        <SummaryCard label="Redo / Refetch" value={visibleSummary.redoOrRefetch} />
        <SummaryCard label="à¸£à¸¹à¸›à¹ƒà¸™à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡" value={visibleSummary.localOnlyPhotos} tone="warning" />
        <SummaryCard label="à¸­à¸±à¸›à¹‚à¸«à¸¥à¸”à¹à¸¥à¹‰à¸§" value={visibleSummary.uploadedPhotos} tone="success" />
      </section>

      <section className="dashboard-control-grid">
        <article className="feature-card dashboard-search-card">
          <div className="scan-result-heading">
            <h2>à¸„à¹‰à¸™à¸«à¸²à¸£à¸²à¸¢à¸à¸²à¸£à¸£à¸–</h2>
            <StatusBadge label={`${filteredRecords.length} à¸£à¸²à¸¢à¸à¸²à¸£`} tone="neutral" />
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
          <h2>à¸§à¸±à¸™à¸—à¸µà¹ˆ / à¸ªà¸²à¸‚à¸² / à¹€à¸£à¸µà¸¢à¸‡à¸¥à¸³à¸”à¸±à¸š</h2>
          <div className="dashboard-quick-actions">
            <button type="button" className={dateMode === 'today' ? 'filter-chip active' : 'filter-chip'} onClick={() => setQuickDate('today')}>à¸§à¸±à¸™à¸™à¸µà¹‰</button>
            <button type="button" className={dateMode === 'yesterday' ? 'filter-chip active' : 'filter-chip'} onClick={() => setQuickDate('yesterday')}>à¹€à¸¡à¸·à¹ˆà¸­à¸§à¸²à¸™</button>
            <button type="button" className={dateMode === 'last7' ? 'filter-chip active' : 'filter-chip'} onClick={() => setQuickDate('last7')}>7 à¸§à¸±à¸™à¸¥à¹ˆà¸²à¸ªà¸¸à¸”</button>
            <button type="button" className={dateMode === 'all' ? 'filter-chip active' : 'filter-chip'} onClick={() => setQuickDate('all')}>à¸—à¸±à¹‰à¸‡à¸«à¸¡à¸”à¹ƒà¸™à¹€à¸„à¸£à¸·à¹ˆà¸­à¸‡</button>
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
              à¸à¸³à¸¥à¸±à¸‡à¸à¸£à¸­à¸‡à¸œà¸¹à¹‰à¸£à¸±à¸šà¸œà¸´à¸”à¸Šà¸­à¸š {responsibleEmployeeCode}
              <button className="inline-reset-button" type="button" onClick={() => setResponsibleEmployeeCode('')}>à¸¥à¹‰à¸²à¸‡à¸•à¸±à¸§à¸à¸£à¸­à¸‡</button>
            </p>
          ) : null}
        </article>
      </section>

      <section className="dashboard-two-column">
        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>à¸ªà¸£à¸¸à¸›à¸œà¸¹à¹‰à¸£à¸±à¸šà¸œà¸´à¸”à¸Šà¸­à¸š</h2>
            <StatusBadge label={`${responsibleSummary.length} à¸„à¸™`} tone="neutral" />
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
            <StatusBadge label="à¹„à¸¡à¹ˆà¸šà¸¥à¹‡à¸­à¸à¸‡à¸²à¸™" tone="warning" />
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
            <h2>à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µà¸£à¸²à¸¢à¸à¸²à¸£à¸—à¸µà¹ˆà¸•à¸£à¸‡à¸à¸±à¸šà¹€à¸‡à¸·à¹ˆà¸­à¸™à¹„à¸‚</h2>
            <p className="muted-note">à¸¥à¸­à¸‡à¸¥à¹‰à¸²à¸‡à¸•à¸±à¸§à¸à¸£à¸­à¸‡ à¸«à¸£à¸·à¸­à¹€à¸£à¸´à¹ˆà¸¡à¸ªà¹à¸à¸™à¸£à¸–à¸„à¸±à¸™à¹ƒà¸«à¸¡à¹ˆà¸«à¸¥à¸±à¸‡à¹€à¸¥à¸·à¸­à¸à¸œà¸¹à¹‰à¸£à¸±à¸šà¸œà¸´à¸”à¸Šà¸­à¸š</p>
            <div className="scan-actions">
              <PrimaryButton onClick={() => { window.location.hash = '/scan'; }}>
                <ClipboardCheck size={20} />
                <span>à¹„à¸›à¸ªà¹à¸à¸™</span>
              </PrimaryButton>
              <PrimaryButton variant="secondary" onClick={() => { window.location.hash = '/responsible-profile'; }}>
                <UserCog size={20} />
                <span>à¹€à¸¥à¸·à¸­à¸à¸œà¸¹à¹‰à¸£à¸±à¸šà¸œà¸´à¸”à¸Šà¸­à¸š</span>
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
          <span>à¹€à¸›à¸´à¸”à¸£à¸²à¸¢à¸à¸²à¸£</span>
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/edit-record?recordId=${record.id}`; }}>
          <Edit3 size={20} />
          <span>à¹à¸à¹‰à¹„à¸‚</span>
        </PrimaryButton>
        <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/checklist?recordId=${record.id}`; }}>
          <History size={20} />
          <span>à¸”à¸¹à¸›à¸£à¸°à¸§à¸±à¸•à¸´</span>
        </PrimaryButton>
        {progress.missingCount > 0 && record.status !== 'VOIDED' ? (
          <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/checklist?recordId=${record.id}`; }}>
            <ImagePlus size={20} />
            <span>à¸–à¹ˆà¸²à¸¢à¸£à¸¹à¸›à¸•à¹ˆà¸­</span>
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
