import { ShieldCheck, UserRound } from 'lucide-react';
import type { AppRoleMode } from '../types';

interface ModeBadgeProps {
  mode: AppRoleMode;
}

export default function ModeBadge({ mode }: ModeBadgeProps) {
  const Icon = mode === 'admin' ? ShieldCheck : UserRound;
  return (
    <span className={`mode-badge ${mode}`}>
      <Icon size={15} />
      <span>{mode === 'admin' ? 'โหมดผู้ดูแล' : 'โหมดพนักงาน'}</span>
    </span>
  );
}
