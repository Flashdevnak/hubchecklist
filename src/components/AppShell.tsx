import type { ReactNode } from 'react';
import { pages } from '../data/pages';
import type { ActiveResponsibleProfile, AppRoleMode, AppRoute, PageDefinition } from '../types';
import BottomNav from './BottomNav';
import ModeBadge from './ModeBadge';
import PageHeader from './PageHeader';
import RoleSwitch from './RoleSwitch';
import SupabaseStatusNotice from './SupabaseStatusNotice';

interface AppShellProps {
  activeProfile: ActiveResponsibleProfile | null;
  children: ReactNode;
  currentRoute: AppRoute;
  currentPage: PageDefinition;
  roleMode: AppRoleMode;
  onNavigate: (route: AppRoute) => void;
  onRoleChange: (mode: AppRoleMode) => void;
}

const staffRoutes: AppRoute[] = ['dashboard', 'responsible-profile', 'scan', 'scan-preview', 'flash-search', 'checklist'];
const adminRoutes: AppRoute[] = ['dashboard', 'export', 'backup-cleanup', 'admin-settings', 'user-management', 'edit-record'];

export default function AppShell({
  activeProfile,
  children,
  currentRoute,
  currentPage,
  roleMode,
  onNavigate,
  onRoleChange,
}: AppShellProps) {
  const visiblePages = pages.filter((page) => (roleMode === 'staff' ? staffRoutes : adminRoutes).includes(page.route));

  return (
    <div className="app-shell">
      <aside className="app-sidebar" aria-label="เมนูหลัก">
        <div className="brand-card">
          <div className="brand-mark">HC</div>
          <div>
            <strong>Hub Capture</strong>
            <span>Vehicle Proof</span>
          </div>
        </div>
        <RoleSwitch mode={roleMode} onChange={onRoleChange} />
        <p className="local-mode-note">โหมดภายในเครื่อง / ยังไม่ได้เชื่อมระบบ Login กลาง</p>
        <nav className="side-nav">
          {visiblePages.map((page) => {
            const Icon = page.icon;
            return (
              <button
                key={page.route}
                type="button"
                className={page.route === currentRoute ? 'nav-item active' : 'nav-item'}
                onClick={() => onNavigate(page.route)}
              >
                <Icon size={18} />
                <span>{page.shortTitle}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="app-main">
        <div className="top-status-row">
          <ModeBadge mode={roleMode} />
          {activeProfile ? (
            <span className="profile-pill">{activeProfile.employeeCode} {activeProfile.displayName} / {activeProfile.branch}</span>
          ) : (
            <span className="profile-pill warning">ยังไม่ได้เลือกผู้รับผิดชอบ</span>
          )}
          <SupabaseStatusNotice compact />
        </div>
        <PageHeader page={currentPage} />
        <section className="page-content">{children}</section>
      </main>

      <BottomNav currentRoute={currentRoute} roleMode={roleMode} onNavigate={onNavigate} />
    </div>
  );
}
