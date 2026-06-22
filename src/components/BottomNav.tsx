import { ClipboardCheck, Download, Home, ScanLine, UserCog } from 'lucide-react';
import type { AppRoute } from '../types';

const quickItems: Array<{ route: AppRoute; label: string; icon: typeof Home }> = [
  { route: 'dashboard', label: 'วันนี้', icon: Home },
  { route: 'responsible-profile', label: 'ผู้รับผิดชอบ', icon: UserCog },
  { route: 'scan', label: 'สแกน', icon: ScanLine },
  { route: 'checklist', label: 'รูป', icon: ClipboardCheck },
  { route: 'export', label: 'Export', icon: Download },
];

interface BottomNavProps {
  currentRoute: AppRoute;
  onNavigate: (route: AppRoute) => void;
}

export default function BottomNav({ currentRoute, onNavigate }: BottomNavProps) {
  return (
    <nav className="bottom-nav" aria-label="เมนูมือถือ">
      {quickItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.route}
            type="button"
            className={currentRoute === item.route ? 'bottom-nav-item active' : 'bottom-nav-item'}
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
