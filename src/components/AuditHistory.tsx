import StatusBadge from './StatusBadge';
import { listAuditEntries } from '../services/vehicleRecords';

interface AuditHistoryProps {
  recordId: string;
}

const ACTION_LABELS: Record<string, string> = {
  FIELD_EDIT: 'แก้ไขข้อมูล',
  PHONE_EDIT: 'แก้ไขเบอร์โทร',
  ROUTE_EDIT: 'แก้ไขเส้นทาง',
  CHECKLIST_TYPE_CHANGE: 'เปลี่ยนประเภท Checklist',
  REDO_QR_SCAN: 'สแกน QR ใหม่',
  REDO_PHONE_OCR: 'อ่านเบอร์ใหม่',
  REFETCH_FLASH: 'ดึงข้อมูล Flash ใหม่',
  PHOTO_RETAKE: 'ถ่ายรูปใหม่',
  VOID_RECORD: 'Void รายการ',
  RESTORE_RECORD: 'กู้คืนรายการ',
  STATUS_CHANGE: 'เปลี่ยนสถานะ',
};

export default function AuditHistory({ recordId }: AuditHistoryProps) {
  const entries = listAuditEntries(recordId);

  return (
    <details className="audit-history" open>
      <summary>
        <span>ประวัติการแก้ไข</span>
        <StatusBadge label={`${entries.length} รายการ`} tone={entries.length > 0 ? 'success' : 'neutral'} />
      </summary>
      {entries.length === 0 ? (
        <p className="muted-note">ยังไม่มีประวัติการแก้ไขสำหรับรายการนี้</p>
      ) : (
        <div className="audit-list">
          {entries.slice(0, 20).map((entry) => (
            <article className="audit-entry" key={entry.id}>
              <div className="scan-result-heading">
                <strong>{ACTION_LABELS[entry.actionType] ?? entry.actionType}</strong>
                <StatusBadge label={entry.source} tone="neutral" />
              </div>
              <div className="audit-grid">
                <span>field</span><strong>{entry.fieldName}</strong>
                <span>ก่อน</span><strong>{entry.oldValue || '-'}</strong>
                <span>หลัง</span><strong>{entry.newValue || '-'}</strong>
                <span>เวลา</span><strong>{new Date(entry.editedAt).toLocaleString('th-TH')}</strong>
                <span>เหตุผล</span><strong>{entry.reason || '-'}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </details>
  );
}
