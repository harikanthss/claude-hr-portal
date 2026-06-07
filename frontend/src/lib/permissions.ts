// ============================================================================
// Permission Map — Central source of truth for role-based access
// Implements the §2.2 access matrix from DOCUMENTATION.md
// ============================================================================

import type { AppRole } from '../types/database';

// ── Module definitions ──────────────────────────────────────────────────────
export type Module =
  | 'dashboard'
  | 'employees'
  | 'recruitment'
  | 'leave'
  | 'attendance'
  | 'payroll'
  | 'performance'
  | 'announcements'
  | 'settings'
  | 'audit_log';

// ── Action definitions ──────────────────────────────────────────────────────
export type Action =
  // Employees
  | 'employees.view_directory'
  | 'employees.view_full_profile'
  | 'employees.add'
  | 'employees.edit'
  | 'employees.terminate'
  // Recruitment
  | 'recruitment.view_pipeline'
  | 'recruitment.post_job'
  | 'recruitment.move_candidate'
  | 'recruitment.hire'
  // Leave
  | 'leave.view_all'
  | 'leave.view_team'
  | 'leave.view_own'
  | 'leave.apply'
  | 'leave.approve'
  | 'leave.configure_policies'
  // Attendance
  | 'attendance.clock_in_out'
  | 'attendance.view_team'
  | 'attendance.view_all'
  | 'attendance.regularize_others'
  | 'attendance.manage_policies'
  // Payroll
  | 'payroll.view_all'
  | 'payroll.view_own'
  | 'payroll.run_payroll'
  // Performance
  | 'performance.view_all'
  | 'performance.view_team'
  | 'performance.view_own'
  | 'performance.write_manager_review'
  | 'performance.submit_self_assessment'
  | 'performance.create_cycle'
  // Announcements
  | 'announcements.view'
  | 'announcements.create'
  | 'announcements.pin'
  // Settings
  | 'settings.company_profile'
  | 'settings.departments'
  | 'settings.leave_policies'
  | 'settings.user_access'
  | 'settings.notifications_own'
  // Audit
  | 'audit_log.view';

// ── Module access per role ──────────────────────────────────────────────────
const MODULE_ACCESS: Record<Module, AppRole[]> = {
  dashboard:      ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  employees:      ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  recruitment:    ['super_admin', 'admin', 'hr_manager', 'manager'],
  leave:          ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  attendance:     ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  payroll:        ['super_admin', 'admin', 'hr_manager', 'employee'], // Employee sees own only; Manager gets NO access
  performance:    ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  announcements:  ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  settings:       ['super_admin', 'admin', 'hr_manager'],
  audit_log:      ['super_admin', 'admin', 'hr_manager'],
};

// ── Action permissions per role ─────────────────────────────────────────────
const ACTION_PERMISSIONS: Record<Action, AppRole[]> = {
  // Employees
  'employees.view_directory':     ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  'employees.view_full_profile':  ['super_admin', 'admin', 'hr_manager', 'manager'], // manager = team only
  'employees.add':                ['super_admin', 'admin', 'hr_manager'],
  'employees.edit':               ['super_admin', 'admin', 'hr_manager'],
  'employees.terminate':          ['super_admin', 'admin', 'hr_manager'],

  // Recruitment
  'recruitment.view_pipeline':    ['super_admin', 'admin', 'hr_manager', 'manager'],
  'recruitment.post_job':         ['super_admin', 'admin', 'hr_manager'],
  'recruitment.move_candidate':   ['super_admin', 'admin', 'hr_manager'],
  'recruitment.hire':             ['super_admin', 'admin', 'hr_manager'],

  // Leave
  'leave.view_all':               ['super_admin', 'admin', 'hr_manager'],
  'leave.view_team':              ['super_admin', 'admin', 'hr_manager', 'manager'],
  'leave.view_own':               ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  'leave.apply':                  ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  'leave.approve':                ['super_admin', 'admin', 'hr_manager', 'manager'], // manager = team only
  'leave.configure_policies':     ['super_admin', 'admin', 'hr_manager'],

  // Attendance
  'attendance.clock_in_out':      ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  'attendance.view_team':         ['super_admin', 'admin', 'hr_manager', 'manager'],
  'attendance.view_all':          ['super_admin', 'admin', 'hr_manager'],
  'attendance.regularize_others': ['super_admin', 'admin', 'hr_manager', 'manager'], // manager = team only
  'attendance.manage_policies':   ['super_admin', 'admin', 'hr_manager'],

  // Payroll
  'payroll.view_all':             ['super_admin', 'admin', 'hr_manager'],
  'payroll.view_own':             ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  'payroll.run_payroll':          ['super_admin', 'admin', 'hr_manager'],

  // Performance
  'performance.view_all':              ['super_admin', 'admin', 'hr_manager'],
  'performance.view_team':             ['super_admin', 'admin', 'hr_manager', 'manager'],
  'performance.view_own':              ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  'performance.write_manager_review':  ['super_admin', 'admin', 'hr_manager', 'manager'],
  'performance.submit_self_assessment':['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  'performance.create_cycle':          ['super_admin', 'admin', 'hr_manager'],

  // Announcements
  'announcements.view':   ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],
  'announcements.create':  ['super_admin', 'admin', 'hr_manager'],
  'announcements.pin':     ['super_admin', 'admin', 'hr_manager'],

  // Settings
  'settings.company_profile':  ['super_admin', 'admin', 'hr_manager'],
  'settings.departments':      ['super_admin', 'admin', 'hr_manager'],
  'settings.leave_policies':   ['super_admin', 'admin', 'hr_manager'],
  'settings.user_access':      ['super_admin', 'admin'],
  'settings.notifications_own':['super_admin', 'admin', 'hr_manager', 'manager', 'employee'],

  // Audit
  'audit_log.view':            ['super_admin', 'admin', 'hr_manager'],
};

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Can this role access a module (see it in the sidebar)?
 */
export function canAccessModule(role: AppRole, module: Module): boolean {
  return MODULE_ACCESS[module]?.includes(role) ?? false;
}

/**
 * Can this role perform a specific action?
 */
export function canPerform(role: AppRole, action: Action): boolean {
  return ACTION_PERMISSIONS[action]?.includes(role) ?? false;
}

/**
 * Get all modules this role can access (for sidebar rendering).
 */
export function getAccessibleModules(role: AppRole): Module[] {
  return (Object.keys(MODULE_ACCESS) as Module[]).filter(m => MODULE_ACCESS[m].includes(role));
}

/**
 * Is the role an admin-level role (admin or HR)?
 */
export function isAdminOrHR(role: AppRole): boolean {
  return role === 'super_admin' || role === 'admin' || role === 'hr_manager';
}

/**
 * Sidebar nav items with permission-gated visibility.
 */
export interface NavItem {
  id: Module;
  label: string;
  icon: string; // lucide-react icon name
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard',     label: 'Dashboard',      icon: 'LayoutDashboard' },
  { id: 'employees',     label: 'Employees',       icon: 'Users' },
  { id: 'attendance',    label: 'Attendance',      icon: 'Clock' },
  { id: 'leave',         label: 'Leave',           icon: 'CalendarOff' },
  { id: 'payroll',       label: 'Payroll',         icon: 'Wallet' },
  { id: 'performance',   label: 'Performance',     icon: 'TrendingUp' },
  { id: 'recruitment',   label: 'Recruitment',     icon: 'UserPlus' },
  { id: 'announcements', label: 'Announcements',   icon: 'Megaphone' },
  { id: 'settings',      label: 'Settings',        icon: 'Settings' },
  { id: 'audit_log',     label: 'Audit Log',       icon: 'Shield' },
];

/**
 * Get nav items filtered by role permissions.
 */
export function getNavForRole(role: AppRole): NavItem[] {
  return NAV_ITEMS.filter(item => canAccessModule(role, item.id));
}
