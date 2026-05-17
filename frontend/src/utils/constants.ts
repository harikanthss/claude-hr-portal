export const DEPARTMENTS = ['Engineering','Design','Sales','HR','Finance','Marketing','Operations','Content'];

export const LEAVE_TYPES = ['sick','casual','annual','emergency','maternity','paternity','compensatory'];

export const EXPENSE_CATEGORIES = ['Travel','Food','Software','Hardware','Training','Office Supplies','Medical','Other'];

export const SHIFT_TYPES = [
  { id:'morning', label:'Morning', time:'09:00 – 17:00', color:'#22c55e' },
  { id:'afternoon', label:'Afternoon', time:'14:00 – 22:00', color:'#3b82f6' },
  { id:'night', label:'Night', time:'22:00 – 06:00', color:'#8b5cf6' },
  { id:'general', label:'General', time:'10:00 – 18:00', color:'#f59e0b' },
];

export const ROLES = {
  admin: 'Administrator',
  hr_manager: 'HR Manager',
  manager: 'Manager',
  employee: 'Employee',
};

export const BADGE_COLORS: Record<string, string> = {
  Engineering: '#3b82f6',
  Design: '#8b5cf6',
  Sales: '#22c55e',
  HR: '#f59e0b',
  Finance: '#ef4444',
  Marketing: '#06b6d4',
  Operations: '#f97316',
  Content: '#84cc16',
};
