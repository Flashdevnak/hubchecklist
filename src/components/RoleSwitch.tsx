import { ShieldCheck, UserRound } from 'lucide-react';
import type { AppRoleMode } from '../types';

interface RoleSwitchProps {
  mode: AppRoleMode;
  onChange: (mode: AppRoleMode) => void;
}

export default function RoleSwitch({ mode, onChange }: RoleSwitchProps) {
  return (
    <div className="role-switch" role="group" aria-label="เลือกโหมดการใช้งาน">
      <button
        type="button"
        className={mode === 'staff' ? 'active' : ''}
        onClick={() => onChange('staff')}
      >
        <UserRound size={17} />
        <span>พนักงาน</span>
      </button>
      <button
        type="button"
        className={mode === 'admin' ? 'active' : ''}
        onClick={() => onChange('admin')}
      >
        <ShieldCheck size={17} />
        <span>ผู้ดูแล</span>
      </button>
    </div>
  );
}
