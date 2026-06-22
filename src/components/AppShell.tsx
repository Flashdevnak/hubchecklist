import type { ReactNode } from 'react';
import { pages } from '../data/pages';
import type { AppRoute, PageDefinition } from '../types';
import BottomNav from './BottomNav';
import PageHeader from './PageHeader';
import SupabaseStatusNotice from './SupabaseStatusNotice';

interface AppShellProps {
  children: ReactNode;
  currentRoute: AppRoute;
  currentPage: PageDefinition;
  onNavigate: (route: AppRoute) => void;
}

export default function AppShell({ children, currentRoute, currentPage, onNavigate }: AppShellProps) {
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
        <nav className="side-nav">
          {pages.map((page) => {
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
        <SupabaseStatusNotice />
        <PageHeader page={currentPage} />
        <section className="page-content">{children}</section>
      </main>

      <BottomNav currentRoute={currentRoute} onNavigate={onNavigate} />
    </div>
  );
}
