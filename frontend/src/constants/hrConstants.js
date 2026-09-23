export const PAY_TYPE_LABELS = {
  MONTHLY: 'Monthly salary',
  DAILY: 'Daily wage',
};

export const DEPARTMENT_LABELS = {
  KITCHEN: 'Kitchen',
  SECURITY: 'Security',
  CLEANING: 'Cleaning',
  SETUP: 'Setup / Events',
  RECEPTION: 'Reception',
  MAINTENANCE: 'Maintenance',
  OTHER: 'Other',
};

export const ADVANCE_STATUS_LABELS = {
  PENDING: 'Pending recovery',
  REPAID: 'Repaid',
  DEDUCTED: 'Deducted from salary',
};

export const WAGE_STATUS_LABELS = {
  DRAFT: 'Draft',
  PAID: 'Paid',
};

export const DEPARTMENT_OPTIONS = Object.entries(DEPARTMENT_LABELS).map(([value, label]) => ({ value, label }));
