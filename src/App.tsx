import { useEffect, useMemo, useState } from 'react';
import AppShell from './components/AppShell';
import LoginPage from './pages/LoginPage';
import ResponsibleProfilePage from './pages/ResponsibleProfilePage';
import FullScreenScanPage from './pages/FullScreenScanPage';
import ScanPreviewPage from './pages/ScanPreviewPage';
import FlashSearchPage from './pages/FlashSearchPage';
import VehicleChecklistPage from './pages/VehicleChecklistPage';
import EditRecordPage from './pages/EditRecordPage';
import TodayDashboardPage from './pages/TodayDashboardPage';
import ExportPage from './pages/ExportPage';
import BackupCleanupPage from './pages/BackupCleanupPage';
import AdminSettingsPage from './pages/AdminSettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import { pages } from './data/pages';
import type { AppRoleMode, AppRoute } from './types';
import { getActiveResponsibleProfile, getRoleMode, saveRoleMode } from './utils';

const pageMap: Record<AppRoute, JSX.Element> = {
  login: <LoginPage />,
  'responsible-profile': <ResponsibleProfilePage />,
  scan: <FullScreenScanPage />,
  'scan-preview': <ScanPreviewPage />,
  'flash-search': <FlashSearchPage />,
  checklist: <VehicleChecklistPage />,
  'edit-record': <EditRecordPage />,
  dashboard: <TodayDashboardPage />,
  export: <ExportPage />,
  'backup-cleanup': <BackupCleanupPage />,
  'admin-settings': <AdminSettingsPage />,
  'user-management': <UserManagementPage />,
};

function getRouteFromHash(): AppRoute {
  const value = window.location.hash.replace('#/', '').split('?')[0] as AppRoute;
  return pages.some((page) => page.route === value) ? value : 'dashboard';
}

export default function App() {
  const [route, setRoute] = useState<AppRoute>(getRouteFromHash());
  const [roleMode, setRoleMode] = useState<AppRoleMode>(getRoleMode());
  const [activeProfile, setActiveProfile] = useState(getActiveResponsibleProfile());

  useEffect(() => {
    const refreshShellState = () => {
      setRoute(getRouteFromHash());
      setRoleMode(getRoleMode());
      setActiveProfile(getActiveResponsibleProfile());
    };
    window.addEventListener('hashchange', refreshShellState);
    window.addEventListener('storage', refreshShellState);
    if (!window.location.hash) {
      window.location.hash = '/dashboard';
    }
    return () => {
      window.removeEventListener('hashchange', refreshShellState);
      window.removeEventListener('storage', refreshShellState);
    };
  }, []);

  const currentPage = useMemo(
    () => pages.find((page) => page.route === route) ?? pages[0],
    [route],
  );

  const navigate = (nextRoute: AppRoute) => {
    window.location.hash = `/${nextRoute}`;
    setRoute(nextRoute);
    setActiveProfile(getActiveResponsibleProfile());
  };

  const handleRoleChange = (mode: AppRoleMode) => {
    saveRoleMode(mode);
    setRoleMode(mode);
  };

  return (
    <AppShell
      activeProfile={activeProfile}
      currentPage={currentPage}
      currentRoute={route}
      roleMode={roleMode}
      onNavigate={navigate}
      onRoleChange={handleRoleChange}
    >
      {pageMap[route]}
    </AppShell>
  );
}
