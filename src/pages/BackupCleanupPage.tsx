import { Archive, CheckCircle2, Download, ShieldAlert, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import {
  CLEANUP_CONFIRMATION_TEXT,
  type CleanupFilters,
  type LocalBackupJob,
  confirmBackupJob,
  formatBytes,
  generateBackupJob,
  getBackupCleanupSummary,
  getDefaultBackupFilters,
  getDefaultCleanupFilters,
  listBackupJobs,
  listCleanupJobs,
  previewBackup,
  previewCleanup,
  runCleanup,
} from '../services/backupCleanup';
import { type ExportData, type ExportFilters, getExportSummary } from '../services/exportBackup';
import { listVehicleRecords } from '../services/vehicleRecords';
import type { VehicleRecordStatus } from '../types';
import { getActiveResponsibleProfile } from '../utils';

export default function BackupCleanupPage() {
  const activeProfile = getActiveResponsibleProfile();
  const [backupFilters, setBackupFilters] = useState<ExportFilters>(() => getDefaultBackupFilters());
  const [cleanupFilters, setCleanupFilters] = useState<CleanupFilters>(() => getDefaultCleanupFilters());
  const [backupPreview, setBackupPreview] = useState<ExportData | null>(null);
  const [backupJobs, setBackupJobs] = useState<LocalBackupJob[]>([]);
  const [cleanupJobs, setCleanupJobs] = useState(listCleanupJobs());
  const [generatedJob, setGeneratedJob] = useState<LocalBackupJob | null>(null);
  const [cleanupPhrase, setCleanupPhrase] = useState('');
  const [message, setMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const records = useMemo(() => listVehicleRecords(), []);
  const branches = useMemo(() => [...new Set(records.map((record) => record.branch).filter(Boolean))].sort(), [records]);
  const responsiblePeople = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((record) => {
      if (record.responsibleEmployeeCode) map.set(record.responsibleEmployeeCode, `${record.responsibleEmployeeCode} ${record.responsibleDisplayName || ''}`.trim());
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [records]);

  const refresh = () => {
    setBackupJobs(listBackupJobs());
    setCleanupJobs(listCleanupJobs());
  };

  useEffect(() => {
    const filters = getDefaultBackupFilters();
    setBackupFilters({ ...filters, branch: activeProfile?.branch ?? 'all' });
    setBackupPreview(previewBackup({ ...filters, branch: activeProfile?.branch ?? 'all' }));
    refresh();
  }, []);

  const summary = getBackupCleanupSummary();
  const previewSummary = backupPreview ? getExportSummary(backupPreview) : null;
  const cleanupPreview = previewCleanup(cleanupFilters);

  const updateBackupFilters = (patch: Partial<ExportFilters>) => {
    setBackupFilters((current) => {
      const next = { ...current, ...patch };
      setBackupPreview(previewBackup(next));
      return next;
    });
  };

  const updateCleanupFilters = (patch: Partial<CleanupFilters>) => {
    setCleanupFilters((current) => ({ ...current, ...patch }));
  };

  const handleGenerateBackup = async () => {
    setIsGenerating(true);
    setMessage('กำลังสร้าง Backup ZIP');
    try {
      const result = await generateBackupJob(backupFilters, activeProfile?.employeeCode ?? 'local-user');
      setGeneratedJob(result.job);
      setBackupPreview(result.data);
      refresh();
      setMessage(result.job.status === 'GENERATED'
        ? 'ระบบสร้างไฟล์ Backup แล้ว กรุณาตรวจสอบว่าไฟล์ถูกดาวน์โหลดแล้ว'
        : 'สร้าง Backup ไม่สำเร็จ');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmBackup = (jobId: string) => {
    const confirmed = confirmBackupJob(jobId, activeProfile?.employeeCode ?? 'local-user');
    refresh();
    if (confirmed) {
      setGeneratedJob(confirmed);
      setMessage('ยืนยันว่าเก็บไฟล์ Backup แล้ว สามารถ Cleanup รูปที่สำรองแล้วได้');
    } else {
      setMessage('ต้องยืนยันว่าเก็บไฟล์ Backup แล้วก่อน');
    }
  };

  const handleCleanup = () => {
    const job = runCleanup(cleanupFilters, cleanupPhrase, activeProfile?.employeeCode ?? 'local-user');
    refresh();
    setCleanupPhrase('');
    setMessage(job.status === 'COMPLETED' || job.status === 'PARTIAL'
      ? `Cleanup เสร็จ ${job.cleanedPhotoCount} รูป / ข้าม ${job.skippedPhotoCount} รูป`
      : job.warnings.join(', '));
  };

  return (
    <div className="backup-page">
      <section className="preview-main-stack">
        <article className={`feature-card primary-card backup-warning-${summary.warningLevel}`}>
          <div className="card-heading-row">
            <div className="large-icon"><ShieldAlert size={30} /></div>
            <div>
              <StatusBadge label={summary.warningLevel} tone={summary.warningLevel === 'normal' ? 'success' : summary.warningLevel === 'critical' || summary.warningLevel === 'red' ? 'danger' : 'warning'} />
              <h2>Backup Reminder + Cleanup Guard</h2>
            </div>
          </div>
          <p className="muted-note">ประมาณการจากข้อมูลในระบบ ไม่ใช่ข้อมูล billing จริงจาก cloud</p>
          <div className="backup-summary-grid">
            <SummaryItem label="vehicle records" value={summary.totalVehicleRecords} />
            <SummaryItem label="total photos" value={summary.totalPhotos} />
            <SummaryItem label="local-only photos" value={summary.localOnlyPhotos} />
            <SummaryItem label="uploaded photos" value={summary.uploadedPhotos} />
            <SummaryItem label="not backed up" value={summary.photosNotBackedUp} tone={summary.photosNotBackedUp ? 'warning' : 'success'} />
            <SummaryItem label="backed up" value={summary.photosBackedUp} tone="success" />
            <SummaryItem label="eligible cleanup" value={summary.photosEligibleForCleanup} />
            <SummaryItem label="estimated size" value={formatBytes(summary.estimatedPhotoStorageBytes)} />
            <SummaryItem label="usage of 10GB" value={`${summary.usagePercent.toFixed(1)}%`} tone={summary.warningLevel === 'normal' ? 'success' : 'warning'} />
            <SummaryItem label="oldest unbacked date" value={summary.oldestUnbackedUpDate} />
            <SummaryItem label="latest backup" value={summary.latestBackupDate} />
          </div>
          <p className={summary.warningLevel === 'normal' ? 'scan-message success' : 'scan-message warning'}>{summary.warningMessage}</p>
        </article>

        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>Create Backup</h2>
            <StatusBadge label={previewSummary ? `${previewSummary.recordCount} records` : 'preview'} tone={previewSummary?.recordCount ? 'success' : 'warning'} />
          </div>
          <div className="export-filter-grid">
            <label><span>startDate</span><input type="date" value={backupFilters.startDate} onChange={(event) => updateBackupFilters({ startDate: event.target.value })} /></label>
            <label><span>endDate</span><input type="date" value={backupFilters.endDate} onChange={(event) => updateBackupFilters({ endDate: event.target.value })} /></label>
            <label>
              <span>branch</span>
              <select value={backupFilters.branch} onChange={(event) => updateBackupFilters({ branch: event.target.value })}>
                <option value="all">All branches</option>
                <option value="BNAK">BNAK</option>
                {branches.filter((branch) => branch !== 'BNAK').map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </label>
            <label>
              <span>responsible</span>
              <select value={backupFilters.responsibleEmployeeCode} onChange={(event) => updateBackupFilters({ responsibleEmployeeCode: event.target.value })}>
                <option value="">All responsible</option>
                {responsiblePeople.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>status</span>
              <select value={backupFilters.status} onChange={(event) => updateBackupFilters({ status: event.target.value as '' | VehicleRecordStatus })}>
                <option value="">All status</option>
                <option value="READY_FOR_PHOTO">READY_FOR_PHOTO</option>
                <option value="PENDING_PHOTO">PENDING_PHOTO</option>
                <option value="COMPLETE">COMPLETE</option>
                <option value="NEED_REVIEW">NEED_REVIEW</option>
                <option value="VOIDED">VOIDED</option>
              </select>
            </label>
            <label><span>fileName</span><input value={backupFilters.fileName} onChange={(event) => updateBackupFilters({ fileName: event.target.value })} /></label>
          </div>
          <div className="export-toggle-grid">
            <label><input type="checkbox" checked={backupFilters.includeVoided} onChange={(event) => updateBackupFilters({ includeVoided: event.target.checked })} /><span>includeVoided</span></label>
            <label><input type="checkbox" checked={backupFilters.includeLocalOnlyPhotos} onChange={(event) => updateBackupFilters({ includeLocalOnlyPhotos: event.target.checked })} /><span>includeLocalOnlyPhotos</span></label>
          </div>
          {previewSummary ? (
            <div className="backup-mini-summary">
              <StatusBadge label={`${previewSummary.photoCount} photos`} />
              <StatusBadge label={`${previewSummary.missingPhotoCount} missing`} tone={previewSummary.missingPhotoCount ? 'warning' : 'success'} />
              <StatusBadge label={`${previewSummary.voidedRecordCount} voided`} />
            </div>
          ) : null}
          <div className="scan-actions">
            <PrimaryButton variant="secondary" onClick={() => setBackupPreview(previewBackup(backupFilters))}>Preview included records/photos</PrimaryButton>
            <PrimaryButton onClick={handleGenerateBackup} disabled={isGenerating || !previewSummary?.recordCount}>
              <Download size={20} />
              <span>{isGenerating ? 'กำลังสร้าง Backup' : 'Create Backup'}</span>
            </PrimaryButton>
          </div>
          {generatedJob?.status === 'GENERATED' ? (
            <div className="scan-message warning">
              <strong>ระบบสร้างไฟล์ Backup แล้ว กรุณาตรวจสอบว่าไฟล์ถูกดาวน์โหลดแล้ว</strong>
              <PrimaryButton onClick={() => handleConfirmBackup(generatedJob.id)}>
                <CheckCircle2 size={20} />
                <span>ยืนยันว่าเก็บไฟล์ Backup แล้ว</span>
              </PrimaryButton>
            </div>
          ) : null}
          {message ? <p className={message.includes('ไม่ได้') || message.includes('ไม่สำเร็จ') ? 'scan-message danger' : 'scan-message success'}>{message}</p> : null}
        </article>

        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>Cleanup Guard</h2>
            <StatusBadge label={cleanupPreview.canCleanup ? `${cleanupPreview.eligible.length} eligible` : 'blocked'} tone={cleanupPreview.canCleanup ? 'success' : 'danger'} />
          </div>
          <div className="export-filter-grid">
            <label><span>startDate</span><input type="date" value={cleanupFilters.startDate} onChange={(event) => updateCleanupFilters({ startDate: event.target.value })} /></label>
            <label><span>endDate</span><input type="date" value={cleanupFilters.endDate} onChange={(event) => updateCleanupFilters({ endDate: event.target.value })} /></label>
            <label><span>photos older than</span><input type="date" value={cleanupFilters.olderThanDate} onChange={(event) => updateCleanupFilters({ olderThanDate: event.target.value })} /></label>
            <label>
              <span>branch</span>
              <select value={cleanupFilters.branch} onChange={(event) => updateCleanupFilters({ branch: event.target.value })}>
                <option value="all">All branches</option>
                <option value="BNAK">BNAK</option>
                {branches.filter((branch) => branch !== 'BNAK').map((branch) => <option key={branch} value={branch}>{branch}</option>)}
              </select>
            </label>
            <label>
              <span>responsible</span>
              <select value={cleanupFilters.responsibleEmployeeCode} onChange={(event) => updateCleanupFilters({ responsibleEmployeeCode: event.target.value })}>
                <option value="">All responsible</option>
                {responsiblePeople.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
              </select>
            </label>
          </div>
          <div className="backup-summary-grid">
            <SummaryItem label="eligible photos" value={cleanupPreview.eligible.length} />
            <SummaryItem label="blocked photos" value={cleanupPreview.blocked.length} tone={cleanupPreview.blocked.length ? 'warning' : 'success'} />
            <SummaryItem label="estimated freed" value={formatBytes(cleanupPreview.estimatedFreedBytes)} />
            <SummaryItem label="records affected" value={cleanupPreview.affectedRecordIds.length} />
          </div>
          <p className="scan-message warning">ระบบจะไม่ลบข้อมูลรถและประวัติการแก้ไข</p>
          {cleanupPreview.blockReason ? <p className="scan-message danger">{cleanupPreview.blockReason}</p> : null}
          <label className="edit-reason">
            <span>พิมพ์ข้อความยืนยัน: {CLEANUP_CONFIRMATION_TEXT}</span>
            <input value={cleanupPhrase} onChange={(event) => setCleanupPhrase(event.target.value)} />
          </label>
          <PrimaryButton variant="danger" onClick={handleCleanup} disabled={!cleanupPreview.canCleanup || cleanupPhrase.trim() !== CLEANUP_CONFIRMATION_TEXT}>
            <Trash2 size={20} />
            <span>Cleanup รูปที่สำรองแล้ว</span>
          </PrimaryButton>
        </article>
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>Backup history</h2>
            <Archive size={24} />
          </div>
          <div className="export-record-list">
            {backupJobs.map((job) => (
              <div className="export-record-row" key={job.id}>
                <strong>{job.fileName}</strong>
                <span>{new Date(job.createdAt).toLocaleString('th-TH')} / {job.status}</span>
                <span>{job.recordCount} records / {job.photoCount} photos / missing {job.missingPhotoCount}</span>
                {job.status === 'GENERATED' ? <PrimaryButton onClick={() => handleConfirmBackup(job.id)}>ยืนยันว่าเก็บไฟล์ Backup แล้ว</PrimaryButton> : null}
              </div>
            ))}
            {backupJobs.length === 0 ? <p className="muted-note">ยังไม่มี backup history</p> : null}
          </div>
        </article>

        <article className="feature-card">
          <h2>Cleanup jobs</h2>
          <div className="export-record-list">
            {cleanupJobs.map((job) => (
              <div className="export-record-row" key={job.id}>
                <strong>{job.status}</strong>
                <span>{new Date(job.createdAt).toLocaleString('th-TH')}</span>
                <span>cleaned {job.cleanedPhotoCount} / skipped {job.skippedPhotoCount} / freed {formatBytes(job.estimatedFreedBytes)}</span>
              </div>
            ))}
            {cleanupJobs.length === 0 ? <p className="muted-note">ยังไม่มี cleanup job</p> : null}
          </div>
        </article>

        <article className="feature-card">
          <h2>Cleanup blocking rules</h2>
          <ul className="check-list">
            <li>ยังลบไม่ได้ เพราะยังไม่ได้ Backup</li>
            <li>ต้องยืนยันว่าเก็บไฟล์ Backup แล้วก่อน</li>
            <li>รายการนี้ถูกสำรองแล้ว สามารถ Cleanup รูปได้</li>
            <li>ระบบจะไม่ลบข้อมูลรถและประวัติการแก้ไข</li>
            <li>ยังไม่ได้เชื่อมระบบลบไฟล์ R2 / ลบเฉพาะข้อมูลรูปในเครื่องที่สำรองแล้ว</li>
          </ul>
        </article>
      </aside>
    </div>
  );
}

function SummaryItem({ label, value, tone = 'neutral' }: { label: string; value: string | number; tone?: 'warning' | 'success' | 'neutral' | 'danger' }) {
  return (
    <div className="status-line">
      <span>{label}</span>
      <strong>{value}</strong>
      <StatusBadge label={tone} tone={tone} />
    </div>
  );
}
