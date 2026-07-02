import { Download, FileArchive, FileSpreadsheet, RefreshCcw } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import {
  type ExportData,
  type ExportFilters,
  buildExportFilters,
  collectExportData,
  downloadBackupZip,
  generateBackupZip,
  getExportSummary,
} from '../services/exportBackup';
import { listVehicleRecords } from '../services/vehicleRecords';
import type { VehicleRecordStatus } from '../types';
import { getActiveResponsibleProfile } from '../utils';

export default function ExportPage() {
  const today = new Date().toISOString().slice(0, 10);
  const activeProfile = getActiveResponsibleProfile();
  const [filters, setFilters] = useState<ExportFilters>(() => buildExportFilters({
    startDate: today,
    endDate: today,
    branch: activeProfile?.branch ?? 'all',
    responsibleEmployeeCode: '',
  }));
  const [exportData, setExportData] = useState<ExportData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const records = useMemo(() => listVehicleRecords(), []);
  const branches = useMemo(() => [...new Set(records.map((record) => record.branch).filter(Boolean))].sort(), [records]);
  const responsiblePeople = useMemo(() => {
    const map = new Map<string, string>();
    records.forEach((record) => {
      if (record.responsibleEmployeeCode) {
        map.set(record.responsibleEmployeeCode, `${record.responsibleEmployeeCode} ${record.responsibleDisplayName || ''}`.trim());
      }
    });
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [records]);

  useEffect(() => {
    setExportData(collectExportData(filters));
  }, [filters]);

  const summary = exportData ? getExportSummary(exportData) : null;

  const updateFilters = (patch: Partial<ExportFilters>) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const handleGenerateZip = async () => {
    if (!exportData) return;
    setIsGenerating(true);
    setMessage('กำลังสร้าง workbook.xlsx และ backup.zip จากข้อมูลในเครื่อง');
    try {
      const blob = await generateBackupZip(exportData);
      downloadBackupZip(blob, filters.fileName);
      setMessage('สร้างและดาวน์โหลด backup.zip แล้ว');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'สร้าง ZIP ไม่สำเร็จ');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="export-page">
      <section className="preview-main-stack">
        <article className="feature-card primary-card">
          <div className="card-heading-row">
            <div className="large-icon"><FileArchive size={30} /></div>
            <div>
              <StatusBadge label="MVP-011 working export" tone="success" />
              <h2>Export XLSX/ZIP exact 21.6</h2>
            </div>
          </div>
          <p className="muted-note">
            สร้าง backup.zip แบบ offline/free จาก local records, photos และ audit history พร้อม workbook.xlsx sheet 21.6 และลิงก์รูปใน ZIP
          </p>
          <pre className="code-block">backup.zip{'\n'}├─ workbook.xlsx{'\n'}├─ photos/{'\n'}├─ flash-screenshots/{'\n'}└─ backup-manifest.json</pre>
        </article>

        <article className="feature-card">
          <h2>Export filters</h2>
          <div className="export-filter-grid">
            <label>
              <span>startDate</span>
              <input type="date" value={filters.startDate} onChange={(event) => updateFilters({ startDate: event.target.value })} />
            </label>
            <label>
              <span>endDate</span>
              <input type="date" value={filters.endDate} onChange={(event) => updateFilters({ endDate: event.target.value })} />
            </label>
            <label>
              <span>branch</span>
              <select value={filters.branch} onChange={(event) => updateFilters({ branch: event.target.value })}>
                <option value="all">All branches</option>
                <option value="BNAK">BNAK</option>
                {branches.filter((branch) => branch !== 'BNAK').map((branch) => <option value={branch} key={branch}>{branch}</option>)}
              </select>
            </label>
            <label>
              <span>responsibleEmployeeCode</span>
              <select value={filters.responsibleEmployeeCode} onChange={(event) => updateFilters({ responsibleEmployeeCode: event.target.value })}>
                <option value="">All responsible</option>
                {responsiblePeople.map(([code, label]) => <option value={code} key={code}>{label}</option>)}
              </select>
            </label>
            <label>
              <span>responsibleDisplayName</span>
              <input value={filters.responsibleDisplayName} onChange={(event) => updateFilters({ responsibleDisplayName: event.target.value })} placeholder="ชื่อผู้รับผิดชอบ" />
            </label>
            <label>
              <span>status</span>
              <select value={filters.status} onChange={(event) => updateFilters({ status: event.target.value as '' | VehicleRecordStatus })}>
                <option value="">All status</option>
                <option value="READY_FOR_PHOTO">READY_FOR_PHOTO</option>
                <option value="PENDING_PHOTO">PENDING_PHOTO</option>
                <option value="COMPLETE">COMPLETE</option>
                <option value="NEED_REVIEW">NEED_REVIEW</option>
                <option value="VOIDED">VOIDED</option>
              </select>
            </label>
            <label>
              <span>vehicleBarcode</span>
              <input value={filters.vehicleBarcode} onChange={(event) => updateFilters({ vehicleBarcode: event.target.value.toUpperCase() })} placeholder="NAK..." />
            </label>
            <label>
              <span>export file name</span>
              <input value={filters.fileName} onChange={(event) => updateFilters({ fileName: event.target.value })} />
            </label>
          </div>
          <div className="export-toggle-grid">
            <label>
              <input type="checkbox" checked={filters.includeVoided} onChange={(event) => updateFilters({ includeVoided: event.target.checked })} />
              <span>includeVoided</span>
            </label>
            <label>
              <input type="checkbox" checked={filters.includeLocalOnlyPhotos} onChange={(event) => updateFilters({ includeLocalOnlyPhotos: event.target.checked })} />
              <span>includeLocalOnlyPhotos</span>
            </label>
          </div>
        </article>

        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>Preview export summary</h2>
            <StatusBadge label={summary ? `${summary.recordCount} records` : 'no preview'} tone={summary?.recordCount ? 'success' : 'warning'} />
          </div>
          {summary ? (
            <div className="export-summary-grid">
              <SummaryItem label="backupId" value={summary.backupId} />
              <SummaryItem label="active records" value={summary.activeRecordCount} />
              <SummaryItem label="voided records" value={summary.voidedRecordCount} />
              <SummaryItem label="complete" value={summary.completeRecordCount} />
              <SummaryItem label="pending photo" value={summary.pendingPhotoCount} />
              <SummaryItem label="photos in ZIP" value={summary.photoCount} />
              <SummaryItem label="missing photos" value={summary.missingPhotoCount} tone={summary.missingPhotoCount ? 'warning' : 'success'} />
              <SummaryItem label="local-only photos" value={summary.localOnlyPhotoCount} />
              <SummaryItem label="upload failed" value={summary.uploadFailedPhotoCount} tone={summary.uploadFailedPhotoCount ? 'danger' : 'neutral'} />
            </div>
          ) : null}
          {message ? <p className={message.includes('ไม่') ? 'scan-message danger' : 'scan-message success'}>{message}</p> : null}
          <div className="scan-actions">
            <PrimaryButton variant="secondary" onClick={() => setExportData(collectExportData(filters))}>
              <RefreshCcw size={20} />
              <span>Preview export summary</span>
            </PrimaryButton>
            <PrimaryButton onClick={handleGenerateZip} disabled={!summary?.recordCount || isGenerating}>
              <Download size={20} />
              <span>{isGenerating ? 'กำลังสร้าง ZIP' : 'Generate ZIP'}</span>
            </PrimaryButton>
          </div>
        </article>
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>Workbook sheets</h2>
            <FileSpreadsheet size={26} />
          </div>
          <ul className="check-list">
            <li>21.6 with A:K, M:U, W:AE, AG:AQ blocks</li>
            <li>Route Detail</li>
            <li>Photo Index</li>
            <li>Edit History</li>
            <li>Backup Manifest</li>
            <li>Voided Records</li>
          </ul>
          <p className="scan-message warning">Backup Reminder และ Cleanup Guard จะทำใน MVP-012</p>
        </article>

        <article className="feature-card">
          <h2>Records included</h2>
          <div className="export-record-list">
            {exportData?.records.slice(0, 30).map((record) => (
              <div className="export-record-row" key={record.id}>
                <strong>{record.vehicleBarcode}</strong>
                <span>{record.workDate} / {record.branch} / {record.status}</span>
              </div>
            ))}
            {exportData && exportData.records.length > 30 ? <p className="muted-note">และอีก {exportData.records.length - 30} รายการใน workbook</p> : null}
            {exportData?.records.length === 0 ? <p className="muted-note">ไม่มีรายการตามตัวกรอง</p> : null}
          </div>
        </article>

        <article className="feature-card">
          <h2>Missing / local-only photos</h2>
          <div className="export-record-list">
            {exportData?.missingPhotos.slice(0, 24).map((entry) => (
              <div className="export-record-row" key={`${entry.record.id}-${entry.photoType}`}>
                <strong>{entry.record.vehicleBarcode} / {entry.photoType}</strong>
                <span>{entry.missingReason || 'missing'}</span>
              </div>
            ))}
            {exportData?.missingPhotos.length === 0 ? <p className="muted-note">ไม่มีรูปขาดใน preview นี้</p> : null}
          </div>
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
