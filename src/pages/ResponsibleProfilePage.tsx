import { CheckCircle2, PencilLine, Trash2, UserCog } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import EmptyState from '../components/EmptyState';
import PrimaryButton from '../components/PrimaryButton';
import StatusBadge from '../components/StatusBadge';
import WarningCard from '../components/WarningCard';
import type { ResponsibleProfileLocal } from '../types';
import {
  deleteResponsibleProfile,
  getActiveResponsibleProfile,
  listResponsibleProfiles,
  saveActiveResponsibleProfile,
  upsertResponsibleProfile,
} from '../utils';

const emptyForm = { employeeCode: '', displayName: '', branch: 'BNAK' };

export default function ResponsibleProfilePage() {
  const [profiles, setProfiles] = useState<ResponsibleProfileLocal[]>([]);
  const [activeProfile, setActiveProfile] = useState(getActiveResponsibleProfile());
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [message, setMessage] = useState('');
  const returnTo = new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('returnTo');

  const canSave = useMemo(
    () => Boolean(form.employeeCode.trim() && form.displayName.trim() && form.branch.trim()),
    [form.branch, form.displayName, form.employeeCode],
  );

  const refresh = () => {
    setProfiles(listResponsibleProfiles());
    setActiveProfile(getActiveResponsibleProfile());
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSave = () => {
    if (!canSave) {
      setMessage('กรุณากรอกรหัสพนักงาน ชื่อ และสาขาให้ครบ');
      return;
    }
    const saved = upsertResponsibleProfile(form);
    setMessage(`เลือกใช้งาน ${saved.employeeCode} ${saved.displayName} / ${saved.branch} แล้ว`);
    setForm(emptyForm);
    setEditingId('');
    refresh();
    if (returnTo === 'scan') window.location.hash = '/scan';
  };

  const handleEdit = (profile: ResponsibleProfileLocal) => {
    setEditingId(profile.id);
    setForm({
      employeeCode: profile.employeeCode,
      displayName: profile.displayName,
      branch: profile.branch,
    });
    setMessage('แก้ไขข้อมูลแล้วกดบันทึกเพื่อเลือกใช้งาน');
  };

  const handleSelect = (profile: ResponsibleProfileLocal) => {
    saveActiveResponsibleProfile(profile);
    setMessage(`เลือกใช้งาน ${profile.employeeCode} ${profile.displayName} / ${profile.branch}`);
    refresh();
    if (returnTo === 'scan') window.location.hash = '/scan';
  };

  const handleDelete = (profile: ResponsibleProfileLocal) => {
    const confirmed = window.confirm(`ลบผู้รับผิดชอบ ${profile.employeeCode} ${profile.displayName} หรือไม่?`);
    if (!confirmed) return;
    deleteResponsibleProfile(profile.id);
    setMessage('ลบผู้รับผิดชอบแล้ว');
    if (editingId === profile.id) {
      setEditingId('');
      setForm(emptyForm);
    }
    refresh();
  };

  return (
    <div className="responsible-page">
      <section className="preview-main-stack">
        <article className="feature-card primary-card">
          <div className="card-heading-row">
            <div className="large-icon"><UserCog size={30} /></div>
            <div>
              <StatusBadge label={activeProfile ? 'พร้อมเริ่มงาน' : 'ต้องเลือกก่อนสแกน'} tone={activeProfile ? 'success' : 'warning'} />
              <h2>ผู้รับผิดชอบปัจจุบัน</h2>
            </div>
          </div>

          {activeProfile ? (
            <div className="active-profile-card">
              <strong>{activeProfile.employeeCode} {activeProfile.displayName}</strong>
              <span>{activeProfile.branch}</span>
            </div>
          ) : (
            <WarningCard
              title="กรุณาเลือกผู้รับผิดชอบก่อนเริ่มงาน"
              action={<PrimaryButton onClick={() => document.getElementById('employee-code')?.focus()}>เพิ่มผู้รับผิดชอบ</PrimaryButton>}
            >
              ข้อมูลนี้ใช้ผูกงานทุกคัน และใช้ตอน Export workbook.xlsx
            </WarningCard>
          )}
          <p className="muted-note">ผู้รับผิดชอบใช้ผูกงานและใช้ตอน Export เพื่อให้รู้ว่าใครเป็นคนทำรายการรถคันนั้น</p>
        </article>

        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>{editingId ? 'แก้ไขผู้รับผิดชอบ' : 'เพิ่มผู้รับผิดชอบ'}</h2>
            <StatusBadge label="บันทึกในเครื่อง" tone="warning" />
          </div>
          <div className="profile-form-grid">
            <label>
              <span>รหัสพนักงาน</span>
              <input
                id="employee-code"
                value={form.employeeCode}
                onChange={(event) => setForm({ ...form, employeeCode: event.target.value.trim() })}
                placeholder="25845"
              />
            </label>
            <label>
              <span>ชื่อ</span>
              <input
                value={form.displayName}
                onChange={(event) => setForm({ ...form, displayName: event.target.value })}
                placeholder="Tui"
              />
            </label>
            <label>
              <span>สาขา</span>
              <input
                value={form.branch}
                onChange={(event) => setForm({ ...form, branch: event.target.value.toUpperCase() })}
                placeholder="BNAK"
              />
            </label>
          </div>
          <div className="scan-actions">
            <PrimaryButton onClick={handleSave} disabled={!canSave}>
              <CheckCircle2 size={20} />
              <span>{editingId ? 'บันทึกและเลือกใช้งาน' : 'เพิ่มและเลือกใช้งาน'}</span>
            </PrimaryButton>
            <PrimaryButton variant="secondary" onClick={() => { setForm(emptyForm); setEditingId(''); }}>
              ยกเลิก
            </PrimaryButton>
          </div>
          {message ? <p className="scan-message success">{message}</p> : null}
        </article>
      </section>

      <aside className="preview-side-stack">
        <article className="feature-card">
          <div className="scan-result-heading">
            <h2>รายชื่อในเครื่อง</h2>
            <StatusBadge label={`${profiles.length} คน`} tone="neutral" />
          </div>
          <div className="profile-list">
            {profiles.map((profile) => {
              const isActive = activeProfile?.employeeCode === profile.employeeCode;
              return (
                <article className={isActive ? 'profile-list-card active' : 'profile-list-card'} key={profile.id}>
                  <div>
                    <strong>{profile.employeeCode} {profile.displayName}</strong>
                    <span>{profile.branch}</span>
                  </div>
                  {isActive ? <StatusBadge label="ใช้งานอยู่" tone="success" /> : null}
                  <div className="record-action-row">
                    <PrimaryButton onClick={() => handleSelect(profile)}>
                      <CheckCircle2 size={18} />
                      <span>เลือกใช้งาน</span>
                    </PrimaryButton>
                    <PrimaryButton variant="secondary" onClick={() => handleEdit(profile)}>
                      <PencilLine size={18} />
                      <span>แก้ไข</span>
                    </PrimaryButton>
                    <PrimaryButton variant="danger" onClick={() => handleDelete(profile)}>
                      <Trash2 size={18} />
                      <span>ลบ</span>
                    </PrimaryButton>
                  </div>
                </article>
              );
            })}
            {profiles.length === 0 ? (
              <EmptyState title="ยังไม่มีผู้รับผิดชอบ">
                เพิ่ม 25845 Tui / BNAK หรือผู้รับผิดชอบจริงของกะงานก่อนเริ่มสแกนรถ
              </EmptyState>
            ) : null}
          </div>
        </article>
      </aside>
    </div>
  );
}
