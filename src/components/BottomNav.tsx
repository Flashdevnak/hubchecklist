import { ClipboardCheck, Download, Home, ScanLine, Settings, ShieldCheck } from 'lucide-react';
import type { AppRoleMode, AppRoute } from '../types';

const staffItems: Array<{ route: AppRoute; label: string; icon: typeof Home }> = [
  { route: 'dashboard', label: 'วันนี้', icon: Home },
  { route: 'scan', label: 'สแกน', icon: ScanLine },
  { route: 'checklist', label: 'รูป', icon: ClipboardCheck },
  { route: 'dashboard', label: 'งานของฉัน', icon: ClipboardCheck },
];

const adminItems: Array<{ route: AppRoute; label: string; icon: typeof Home }> = [
  { route: 'dashboard', label: 'Dashboard', icon: Home },
  { route: 'dashboard', label: 'Records', icon: ShieldCheck },
  { route: 'checklist', label: 'Photos', icon: ClipboardCheck },
  { route: 'export', label: 'Export', icon: Download },
  { route: 'backup-cleanup', label: 'Backup', icon: ClipboardCheck },
  { route: 'admin-settings', label: 'Settings', icon: Settings },
  { route: 'user-management', label: 'Audit', icon: ShieldCheck },
];

interface BottomNavProps {
  currentRoute: AppRoute;
  roleMode: AppRoleMode;
  onNavigate: (route: AppRoute) => void;
}

export default function BottomNav({ currentRoute, roleMode, onNavigate }: BottomNavProps) {
  const quickItems = roleMode === 'staff' ? staffItems : adminItems;
  return (
    <nav className="bottom-nav" aria-label="เมนูมือถือ">
      {quickItems.map((item, index) => {
        const Icon = item.icon;
        const isDuplicateDashboardShortcut = item.route === 'dashboard' && index > 0;
        return (
          <button
            key={`${item.route}-${item.label}-${index}`}
            type="button"
            className={currentRoute === item.route && !isDuplicateDashboardShortcut ? 'bottom-nav-item active' : 'bottom-nav-item'}
            onClick={() => onNavigate(item.route)}
          >
            <Icon size={19} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
