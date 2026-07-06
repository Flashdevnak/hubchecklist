import StatusBadge from '../components/StatusBadge';
import { getUnifiedHeaderLabel, UNIFIED_TABLE_TEMPLATE } from '../config/unifiedTableTemplate';

export default function AdminSettingsPage() {
  return (
    <div className="dashboard-page">
      <article className="feature-card primary-card">
        <div className="scan-result-heading">
          <div>
            <h2>Header Template</h2>
            <p className="muted-note">Backoffice review for the single unified table used by Frontline, Records, Export, Backup, and Audit.</p>
          </div>
          <StatusBadge label="RESET-001" tone="success" />
        </div>
        <p className="scan-message warning">
          โหมดทดลอง / ตรวจสอบหัวตารางก่อนบันทึก: image header import is a future Backoffice-only foundation and is not claimed as accurate OCR import yet.
        </p>
      </article>

      <article className="feature-card unified-template-card">
        <div className="unified-template-table">
          <div className="unified-template-row header">
            <strong>#</strong>
            <strong>Column</strong>
            <strong>Staff</strong>
            <strong>Backoffice</strong>
            <strong>Auto fill</strong>
          </div>
          {UNIFIED_TABLE_TEMPLATE.map((column, index) => (
            <div className="unified-template-row" key={column.columnKey}>
              <span>{index + 1}</span>
              <div>
                <strong>{getUnifiedHeaderLabel(column)}</strong>
                <small>{column.columnKey}</small>
              </div>
              <span>{column.staffVisible ? column.staffEditable ? 'visible/edit' : 'visible/read' : 'hidden'}</span>
              <span>{column.adminVisible ? column.adminEditable ? 'visible/edit' : 'visible/read' : 'hidden'}</span>
              <span>{column.autoFillSource || '-'}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}
