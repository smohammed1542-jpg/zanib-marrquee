import { useAuth } from '../context/AuthContext';
import { useAppType } from './useAppType';

/**
 * Central role checks - use everywhere instead of inline user?.role.
 * Unknown/missing role is treated as HR (least privilege).
 */
export function usePermissions() {
  const { user, loading, isAuthenticated } = useAuth();
  const { isGuestHouse } = useAppType();
  const cachedRole =
    typeof window !== 'undefined' ? localStorage.getItem('user_role') : '';
  const role = String(user?.role || cachedRole || '').toUpperCase();

  const isAdmin = role === 'ADMIN';
  const isManager = role === 'MANAGER';
  const isHr = role === 'HR';

  const canOperate = isAdmin || isManager;
  const canManage = canOperate;
  const canReadStaff = isAdmin || isHr;
  const canWriteStaff = isAdmin || isHr;

  return {
    user,
    loading,
    role: role || 'HR',
    isAdmin,
    isManager,
    isHr,
    isGuestHouse,
    canManage,
    canOperate,
    canReadStaff,
    canWriteStaff,
    canCancelStay: canOperate,
    canAccessExpenses: isAdmin,
    canAccessReports: isAdmin,
    canAccessNotifications: isAdmin,
    canAccessStaff: canReadStaff,
    canAccessPayroll: isHr || isAdmin,
    canAccessHrSecurity: isHr || isAdmin,
    canAccessSettings: canOperate || isHr,
    canAccessDashboard: isAdmin,
    canAccessPayments: canOperate,
  };
}
