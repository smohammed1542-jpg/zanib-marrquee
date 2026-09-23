import { Navigate } from 'react-router-dom';
import { usePermissions } from '../hooks/usePermissions';
import { useAppType } from '../hooks/useAppType';
import AppLoader from './AppLoader';

/** Only ADMIN */
export function AdminRoute({ children }) {
  const { loading, isAdmin, isHr } = usePermissions();
  const { isGuestHouse } = useAppType();
  const hrHome = isGuestHouse ? '/gh/employees' : '/employees';
  const managerHome = isGuestHouse ? '/gh/calendar' : '/calendar';

  if (loading) return <AppLoader fullScreen />;
  if (!isAdmin) {
    return <Navigate to={isHr ? hrHome : managerHome} replace />;
  }
  return children;
}

/** ADMIN + MANAGER (blocks HR) */
export function ManagerRoute({ children }) {
  const { loading, canManage } = usePermissions();
  const { isGuestHouse } = useAppType();
  const fallback = isGuestHouse ? '/gh/employees' : '/employees';

  if (loading) return <AppLoader fullScreen />;
  if (!canManage) return <Navigate to={fallback} replace />;
  return children;
}

/** ADMIN, MANAGER, or HR — settings and profile */
export function SettingsRoute({ children }) {
  const { loading, canAccessSettings } = usePermissions();
  const { isGuestHouse } = useAppType();
  const fallback = isGuestHouse ? '/gh/profile' : '/profile';

  if (loading) return <AppLoader fullScreen />;
  if (!canAccessSettings) return <Navigate to={fallback} replace />;
  return children;
}

/** Blocks HR from operational pages (bookings, calendar, etc.) */
export function OperationalRoute({ children }) {
  const { loading, isHr } = usePermissions();
  const { isGuestHouse } = useAppType();
  const fallback = isGuestHouse ? '/gh/employees' : '/employees';

  if (loading) return <AppLoader fullScreen />;
  if (isHr) return <Navigate to={fallback} replace />;
  return children;
}

/** HR portal pages — payroll, security (HR and Admin) */
export function HrPortalRoute({ children }) {
  const { loading, isHr, isAdmin } = usePermissions();
  const { isGuestHouse } = useAppType();
  const fallback = isGuestHouse ? '/gh/employees' : '/employees';

  if (loading) return <AppLoader fullScreen />;
  if (!isHr && !isAdmin) return <Navigate to={fallback} replace />;
  return children;
}

/** Dashboard and accounting are admin-only. */
export function StaffBlockedRoute({ children }) {
  const { loading, canAccessDashboard, isManager } = usePermissions();
  const { isGuestHouse } = useAppType();
  const managerHome = isGuestHouse ? '/gh/calendar' : '/calendar';
  const hrHome = isGuestHouse ? '/gh/employees' : '/employees';

  if (loading) return <AppLoader fullScreen />;
  if (!canAccessDashboard) return <Navigate to={isManager ? managerHome : hrHome} replace />;
  return children;
}
