import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import { getEditHistory, getRequiredPhotosForChecklist, getVehicleRecordById, updateVehicleRecord } from '../services/vehicleRecords';
import type { ChecklistType, EditHistoryEntry, VehicleRecord } from '../types';

export default function EditRecordPage() {
  const [record, setRecord] = useState<VehicleRecord | null>(null);
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [form, setForm] = useState({
    driverPhone: '',
    driverName: '',
    companyName: '',
    routeSummary: '',
    checklistType: 'NORMAL_ROUTE' as ChecklistType,
    reason: 'manual correction',
  });

  useEffect(() => {
    const id = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('recordId');
    const found = id ? getVehicleRecordById(id) : null;
    setRecord(found);
    if (found) {
      setForm({
        driverPhone: found.driverPhone,
        driverName: found.driverName ?? '',
        companyName: found.companyName ?? '',
        routeSummary: found.routeSummary ?? '',
        checklistType: found.checklistType,
        reason: 'manual correction',
      });
      setHistory(getEditHistory(found.id));
    }
  }, []);

  const handleSave = () => {
    if (!record) return;
    const updated = updateVehicleRecord(record.id, {
      driverPhone: form.driverPhone,
      driverName: form.driverName,
      companyName: form.companyName,
      routeSummary: form.routeSummary,
      checklistType: form.checklistType,
      requiredPhotos: getRequiredPhotosForChecklist(form.checklistType),
    }, form.reason);
    if (updated) {
      setRecord(updated);
      setHistory(getEditHistory(updated.id));
    }
  };

  if (!record) {
    return <article className="feature-card"><StatusBadge label="ไม่พบรายการ" tone="warning" /><p>กรุณาเปิดจากรายการรถที่มีอยู่</p></article>;
  }

  return (
    <div className="record-page">
      <section className="preview-main-stack">
        <article className="feature-card primary-card">
          <StatusBadge label="Basic edit MVP-007" tone="success" />
          <h2>แก้ไข {record.vehicleBarcode}</h2>
          <div className="preview-edit-grid">
            <label><span>driverPhone</span><input value={form.driverPhone} onChange={(event) => setForm({ ...form, driverPhone: event.target.value })} /></label>
            <label><span>driverName</span><input value={form.driverName} onChange={(event) => setForm({ ...form, driverName: event.target.value })} /></label>
            <label><span>companyName</span><input value={form.companyName} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></label>
            <label><span>checklistType</span><select value={form.checklistType} onChange={(event) => setForm({ ...form, checklistType: event.target.value as ChecklistType })}><option value="NORMAL_ROUTE">NORMAL_ROUTE</option><option value="MULTI_DROP">MULTI_DROP</option></select></label>
          </div>
          {form.checklistType !== record.checklistType ? (
            <p className="scan-message warning">การเปลี่ยน checklistType จะเปลี่ยนรายการรูปที่ต้องถ่าย</p>
          ) : null}
          <div className="scan-form">
            <label htmlFor="route-summary">routeSummary</label>
            <textarea id="route-summary" value={form.routeSummary} onChange={(event) => setForm({ ...form, routeSummary: event.target.value })} />
          </div>
          <label className="edit-reason"><span>เหตุผล</span><input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} /></label>
          <PrimaryButton onClick={handleSave}><Save size={20} /><span>บันทึก</span></PrimaryButton>
          <p className="muted-note">ฟิลด์อื่น ๆ และ workflow แก้ไขเต็มรูปแบบจะทำใน MVP ถัดไป</p>
        </article>
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card">
          <h2>Edit history</h2>
          <ul className="check-list">
            {history.map((entry) => (
              <li key={entry.id}>{entry.fieldName}: {entry.oldValue} → {entry.newValue} ({entry.reason})</li>
            ))}
          </ul>
        </article>
      </aside>
    </div>
  );
}
