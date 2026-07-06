import { Phone, Save, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import AuditHistory from '../components/AuditHistory';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import {
  getRequiredPhotosForChecklist,
  getVehicleRecordById,
  updateRecordWithAudit,
} from '../services/vehicleRecords';
import type { ChecklistType, VehicleRecord } from '../types';
import { validateThaiPhoneNumber, validateVehicleBarcode } from '../utils';

const CHECKLIST_TYPES: ChecklistType[] = ['NORMAL_ROUTE', 'MULTI_DROP'];
const IMPORTANT_FIELDS = ['vehicleBarcode', 'driverPhone', 'checklistType', 'routeSummary'];

export default function EditRecordPage() {
  const [record, setRecord] = useState<VehicleRecord | null>(null);
  const [form, setForm] = useState({
    vehicleBarcode: '',
    sourceUrl: '',
    driverPhone: '',
    driverName: '',
    companyName: '',
    targetBranch: '',
    transferLoadRate: '',
    routeSummary: '',
    firstBranch: '',
    lastBranch: '',
    plannedDepartureTime: '',
    actualDepartureTime: '',
    actualDepartureDateTime: '',
    smallParcelPriority: '',
    checklistType: 'NORMAL_ROUTE' as ChecklistType,
    branch: '',
    responsibleEmployeeCode: '',
    reason: '',
  });

  useEffect(() => {
    const id = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('recordId');
    const found = id ? getVehicleRecordById(id) : null;
    setRecord(found);
    if (found) {
      setForm({
        vehicleBarcode: found.vehicleBarcode,
        sourceUrl: found.sourceUrl,
        driverPhone: found.driverPhone,
        driverName: found.driverName ?? '',
        companyName: found.companyName ?? '',
        targetBranch: found.targetBranch ?? found.lastBranch ?? '',
        transferLoadRate: found.transferLoadRate ?? '',
        routeSummary: found.routeSummary ?? '',
        firstBranch: found.firstBranch ?? '',
        lastBranch: found.lastBranch ?? '',
        plannedDepartureTime: found.plannedDepartureTime ?? '',
        actualDepartureTime: found.actualDepartureTime ?? '',
        actualDepartureDateTime: found.actualDepartureDateTime ?? '',
        smallParcelPriority: found.smallParcelPriority ?? '',
        checklistType: found.checklistType,
        branch: found.branch,
        responsibleEmployeeCode: found.responsibleEmployeeCode,
        reason: '',
      });
    }
  }, []);

  const changedFields = useMemo(() => {
    if (!record) return [];
    return editableFields.filter((field) => String(record[field] ?? '') !== String(form[field] ?? ''));
  }, [form, record]);

  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (!validateVehicleBarcode(form.vehicleBarcode).isValid) errors.push('vehicleBarcode จำเป็นและต้องถูกต้อง');
    if (form.driverPhone && !validateThaiPhoneNumber(form.driverPhone).isValid) errors.push('driverPhone ต้องเป็นเบอร์ไทยที่ถูกต้อง');
    if (!form.branch.trim()) errors.push('branch จำเป็น');
    if (!form.responsibleEmployeeCode.trim()) errors.push('responsibleEmployeeCode จำเป็น');
    if (!CHECKLIST_TYPES.includes(form.checklistType)) errors.push('checklistType ไม่ถูกต้อง');
    if (changedFields.some((field) => IMPORTANT_FIELDS.includes(field)) && !form.reason.trim()) {
      errors.push('ต้องระบุเหตุผลเมื่อแก้ไข barcode, phone, checklistType หรือ routeSummary');
    }
    return errors;
  }, [changedFields, form]);

  const canSave = Boolean(record) && changedFields.length > 0 && validationErrors.length === 0;

  const handleSave = () => {
    if (!record || !canSave) return;
    const updated = updateRecordWithAudit(record.id, {
      vehicleBarcode: form.vehicleBarcode,
      sourceUrl: form.sourceUrl,
      driverPhone: form.driverPhone,
      driverName: form.driverName || undefined,
      companyName: form.companyName || undefined,
      targetBranch: form.targetBranch || undefined,
      transferLoadRate: form.transferLoadRate || undefined,
      routeSummary: form.routeSummary || undefined,
      firstBranch: form.firstBranch || undefined,
      lastBranch: form.lastBranch || undefined,
      plannedDepartureTime: form.plannedDepartureTime || undefined,
      actualDepartureTime: form.actualDepartureTime || undefined,
      actualDepartureDateTime: form.actualDepartureDateTime || undefined,
      smallParcelPriority: form.smallParcelPriority || undefined,
      checklistType: form.checklistType,
      branch: form.branch,
      responsibleEmployeeCode: form.responsibleEmployeeCode,
      requiredPhotos: getRequiredPhotosForChecklist(form.checklistType),
    }, form.reason.trim() || 'manual edit', 'user');
    if (updated) {
      window.location.hash = `/checklist?recordId=${updated.id}`;
    }
  };

  if (!record) {
    return (
      <article className="feature-card">
        <StatusBadge label="ไม่พบรายการ" tone="warning" />
        <p>กรุณาเปิดจากรายการรถที่มีอยู่</p>
      </article>
    );
  }

  return (
    <div className="record-page">
      <section className="preview-main-stack">
        <article className="feature-card primary-card">
          <StatusBadge label="MVP-009 safe edit" tone="success" />
          <h2>แก้ไข {record.vehicleBarcode}</h2>
          <div className="preview-edit-grid edit-record-grid">
            <EditInput label="vehicleBarcode" value={form.vehicleBarcode} onChange={(value) => setForm({ ...form, vehicleBarcode: value.toUpperCase() })} />
            <EditInput label="sourceUrl" value={form.sourceUrl} onChange={(value) => setForm({ ...form, sourceUrl: value })} />
            <EditInput label="driverPhone" value={form.driverPhone} onChange={(value) => setForm({ ...form, driverPhone: value })} />
            <EditInput label="driverName" value={form.driverName} onChange={(value) => setForm({ ...form, driverName: value })} />
            <EditInput label="companyName" value={form.companyName} onChange={(value) => setForm({ ...form, companyName: value })} />
            <EditInput label="targetBranch" value={form.targetBranch} onChange={(value) => setForm({ ...form, targetBranch: value })} />
            <EditInput label="transferLoadRate" value={form.transferLoadRate} onChange={(value) => setForm({ ...form, transferLoadRate: value })} />
            <EditInput label="firstBranch" value={form.firstBranch} onChange={(value) => setForm({ ...form, firstBranch: value })} />
            <EditInput label="lastBranch" value={form.lastBranch} onChange={(value) => setForm({ ...form, lastBranch: value })} />
            <EditInput label="plannedDepartureTime" value={form.plannedDepartureTime} onChange={(value) => setForm({ ...form, plannedDepartureTime: value })} />
            <EditInput label="actualDepartureTime" value={form.actualDepartureTime} onChange={(value) => setForm({ ...form, actualDepartureTime: value })} />
            <EditInput label="actualDepartureDateTime" value={form.actualDepartureDateTime} onChange={(value) => setForm({ ...form, actualDepartureDateTime: value })} />
            <EditInput label="smallParcelPriority" value={form.smallParcelPriority} onChange={(value) => setForm({ ...form, smallParcelPriority: value })} />
            <EditInput label="branch" value={form.branch} onChange={(value) => setForm({ ...form, branch: value })} />
            <EditInput label="responsibleEmployeeCode" value={form.responsibleEmployeeCode} onChange={(value) => setForm({ ...form, responsibleEmployeeCode: value })} />
            <label>
              <span>checklistType</span>
              <select value={form.checklistType} onChange={(event) => setForm({ ...form, checklistType: event.target.value as ChecklistType })}>
                <option value="NORMAL_ROUTE">NORMAL_ROUTE</option>
                <option value="MULTI_DROP">MULTI_DROP</option>
              </select>
            </label>
          </div>
          <div className="scan-form">
            <label htmlFor="route-summary">routeSummary</label>
            <textarea id="route-summary" value={form.routeSummary} onChange={(event) => setForm({ ...form, routeSummary: event.target.value })} />
          </div>
          {form.checklistType !== record.checklistType ? (
            <p className="scan-message warning">
              เปลี่ยน checklistType แล้ว requiredPhotos จะอัปเดตเป็น {getRequiredPhotosForChecklist(form.checklistType).join(', ')} และสถานะจะคำนวณใหม่
            </p>
          ) : null}
          {validationErrors.length > 0 ? (
            <div className="scan-message danger">
              {validationErrors.map((error) => <span key={error}>{error}</span>)}
            </div>
          ) : null}
          <label className="edit-reason">
            <span>เหตุผลการแก้ไข</span>
            <input value={form.reason} onChange={(event) => setForm({ ...form, reason: event.target.value })} placeholder="required for important fields" />
          </label>
          <div className="scan-actions bottom-actions">
            <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/scan-preview?redoPhoneRecordId=${record.id}`; }}>
              <Phone size={20} />
              <span>อ่านเบอร์ใหม่</span>
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => { window.location.hash = `/checklist?recordId=${record.id}`; }}>
              <X size={20} />
              <span>ยกเลิก</span>
            </PrimaryButton>
            <PrimaryButton onClick={handleSave} disabled={!canSave}>
              <Save size={20} />
              <span>บันทึก</span>
            </PrimaryButton>
          </div>
        </article>
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card">
          <h2>ก่อน / หลัง</h2>
          <div className="before-after-list">
            {editableFields.map((field) => (
              <div className={changedFields.includes(field) ? 'before-after-row changed' : 'before-after-row'} key={field}>
                <span>{field}</span>
                <strong>{String(record[field] ?? '-')}</strong>
                <strong>{String(form[field] ?? '-')}</strong>
              </div>
            ))}
          </div>
        </article>
        <article className="feature-card">
          <AuditHistory recordId={record.id} />
        </article>
      </aside>
    </div>
  );
}

const editableFields = [
  'vehicleBarcode',
  'sourceUrl',
  'driverPhone',
  'driverName',
  'companyName',
  'targetBranch',
  'transferLoadRate',
  'routeSummary',
  'firstBranch',
  'lastBranch',
  'plannedDepartureTime',
  'actualDepartureTime',
  'actualDepartureDateTime',
  'smallParcelPriority',
  'checklistType',
  'branch',
  'responsibleEmployeeCode',
] as const;

type EditableField = (typeof editableFields)[number];

function EditInput({ label, value, onChange }: {
  label: EditableField;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
