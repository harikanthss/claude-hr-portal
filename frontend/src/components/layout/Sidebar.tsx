import React from 'react';
import { useStore } from '../../services/store';
import { UserRole } from '../../types';
import {
  LayoutDashboard, Users, Calendar, Clock, BarChart3,
  LogOut, ChevronLeft, ChevronRight, Bell, User, Trophy, Zap,
  FileText, Home, Briefcase, GitBranch, FolderOpen, Shield, Sun, UserCheck
, TrendingUp } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  page: string;
  roles: UserRole[];
  badge?: number;
}

const ALL_ROLES: UserRole[] = ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'];
const HR_ROLES: UserRole[] = ['super_admin', 'admin', 'hr_manager'];
const ADMIN_HR_MANAGER_ROLES: UserRole[] = ['super_admin', 'admin', 'hr_manager', 'manager'];

const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { label: 'Dashboard',       icon: <LayoutDashboard size={18} />, page: 'dashboard',   roles: ALL_ROLES },
      { label: 'Employees',       icon: <Users size={18} />,           page: 'employees',   roles: ADMIN_HR_MANAGER_ROLES },
      { label: 'Org Chart',       icon: <GitBranch size={18} />,       page: 'orgchart',    roles: ALL_ROLES },
      { label: 'Recruitment',     icon: <Briefcase size={18} />,       page: 'recruitment', roles: ADMIN_HR_MANAGER_ROLES },
      { label: 'Onboarding',      icon: <Users size={18} />,           page: 'onboarding',  roles: ADMIN_HR_MANAGER_ROLES },
    ],
  },
  {
    label: 'HR',
    items: [
      { label: 'Leave Management', icon: <Calendar size={18} />,  page: 'leave',       roles: ALL_ROLES },
      { label: 'Attendance',       icon: <Clock size={18} />,     page: 'attendance',  roles: ALL_ROLES },
      { label: 'Performance',      icon: <BarChart3 size={18} />, page: 'performance', roles: ALL_ROLES },
      { label: 'Expenses',         icon: <FileText size={18} />,  page: 'expenses',    roles: ALL_ROLES },
      { label: 'Calendar',         icon: <Calendar size={18} />,  page: 'calendar',    roles: ALL_ROLES },
      { label: 'Reports',          icon: <FileText size={18} />,  page: 'reports',     roles: ADMIN_HR_MANAGER_ROLES },
      { label: 'Payslips',         icon: <FileText size={18} />,  page: 'payslips',    roles: ['super_admin', 'admin', 'hr_manager', 'employee'] as UserRole[] },
      { label: 'Documents',        icon: <FolderOpen size={18} />, page: 'documents',   roles: ALL_ROLES },
      { label: 'Shifts',           icon: <Sun size={18} />,        page: 'shifts',      roles: ALL_ROLES },
    ],
  },
  {
    label: 'More',
    items: [
      { label: 'Leaderboard',   icon: <Trophy size={18} />, page: 'leaderboard',   roles: ALL_ROLES },
      { label: 'AI Insights',   icon: <Zap size={18} />,    page: 'ai',            roles: ADMIN_HR_MANAGER_ROLES },
      { label: 'Access Requests', icon: <UserCheck size={18} />, page: 'access',   roles: HR_ROLES },
      { label: 'Audit Log',     icon: <Shield size={18} />, page: 'audit',         roles: HR_ROLES },
      { label: 'Compliance',     icon: <Shield size={18} />, page: 'compliance',    roles: HR_ROLES },
      { label: 'Budget Tracker',  icon: <TrendingUp size={18} />, page: 'budget',       roles: HR_ROLES },
      { label: 'Notifications', icon: <Bell size={18} />,   page: 'notifications', roles: ALL_ROLES },
      { label: 'Profile',       icon: <User size={18} />,   page: 'profile',       roles: ALL_ROLES },
    ],
  },
];

const NAV_ITEMS: NavItem[] = NAV_SECTIONS.flatMap(s => s.items);

interface SidebarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { currentUser, sidebarOpen, toggleSidebar, setSidebarOpen, logout, notifications } = useStore();
  const unread = notifications.filter(n => !n.read && !n.isRead).length;

  if (!currentUser) return null;

  const filtered = NAV_ITEMS.filter(item => item.roles.includes(currentUser.role));

  const ROLE_MAP: Record<string, string> = {
    super_admin: 'Founder',
    admin: 'Administrator',
    hr_manager: 'HR Manager',
    manager: 'Manager',
    employee: 'Employee',
  };
  const roleLabel = ROLE_MAP[currentUser.role] || currentUser.role;

  return (
    <>
    <aside
      className={`layout-sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}
      style={{
        width: sidebarOpen ? 'var(--sidebar-w)' : '72px',
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        background: 'var(--bg-sidebar)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 230,
        transition: 'width 200ms cubic-bezier(.4,0,.2,1)',
        overflow: 'hidden',
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      }}
    >
      {/* Unified User & Workspace Identity */}
      <div 
        style={{
          padding: sidebarOpen ? '20px 16px 20px' : '20px 12px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderBottom: '1px solid rgba(255,255,255,0.05)',
          cursor: 'pointer',
          transition: 'background 200ms',
          minHeight: 72,
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.03)')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      >
        <div style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          background: 'linear-gradient(135deg, #22c55e, #16a34a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          color: 'white',
          fontWeight: 700,
          fontSize: '1rem',
          boxShadow: '0 4px 12px rgba(34,197,94,0.3)',
          border: '1px solid rgba(255,255,255,0.15)',
        }}>
          {currentUser.avatar}
        </div>
        
        {sidebarOpen && (
          <div style={{ overflow: 'hidden', flex: 1 }}>
            <div style={{ color: 'white', fontWeight: 600, fontSize: '0.9rem', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
              {currentUser.name}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.65rem', fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Grevya</span>
              <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ color: '#4ade80', fontSize: '0.7rem', fontWeight: 500, whiteSpace: 'nowrap' }}>
                {roleLabel}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_SECTIONS.map(section => {
          const sectionItems = section.items.filter(item => item.roles.includes(currentUser.role));
          if (sectionItems.length === 0) return null;
          return (
            <div key={section.label} style={{ marginBottom: 8 }}>
              {sidebarOpen && (
                <div style={{ color: 'rgba(255,255,255,0.22)', fontSize: '0.6rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px 4px' }}>
                  {section.label}
                </div>
              )}
              {sectionItems.map(item => {
                const isActive = currentPage === item.page;
                const badgeCount = item.page === 'notifications' ? unread : 0;
                return (
                  <button
                    key={item.page}
                    aria-label={item.label}
                    title={item.label}
                    onClick={() => onNavigate(item.page)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      padding: sidebarOpen ? '9px 12px' : '10px',
                      borderRadius: 10,
                      border: 'none',
                      cursor: 'pointer',
                      background: isActive ? 'rgba(34,197,94,0.15)' : 'transparent',
                      color: isActive ? '#4ade80' : 'rgba(255,255,255,0.5)',
                      marginBottom: 1,
                      transition: 'all 200ms',
                      justifyContent: sidebarOpen ? 'flex-start' : 'center',
                      position: 'relative',
                    }}
                    onMouseEnter={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.85)';
                    }}
                    onMouseLeave={e => {
                      if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                      if (!isActive) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.5)';
                    }}
                  >
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)',
                        width: 3, height: 20, background: '#4ade80', borderRadius: '0 4px 4px 0',
                      }} />
                    )}
                    <span style={{ flexShrink: 0, display: 'flex' }}>{item.icon}</span>
                    {sidebarOpen && (
                      <span style={{ fontSize: '0.85rem', fontWeight: isActive ? 600 : 400, whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>
                        {item.label}
                      </span>
                    )}
                    {sidebarOpen && badgeCount > 0 && (
                      <span style={{ background: '#ef4444', color: 'white', borderRadius: 20, padding: '1px 7px', fontSize: '0.65rem', fontWeight: 700, minWidth: 18, textAlign: 'center' }}>
                        {badgeCount}
                      </span>
                    )}
                    {!sidebarOpen && badgeCount > 0 && (
                      <span style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, background: '#ef4444', borderRadius: '50%' }} />
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </nav>

      {/* Bottom */}
      <div style={{ padding: '12px 10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={() => logout()}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            width: '100%',
            padding: sidebarOpen ? '10px 12px' : '10px',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
            background: 'transparent',
            color: 'rgba(255,255,255,0.4)',
            transition: 'all 200ms',
            justifyContent: sidebarOpen ? 'flex-start' : 'center',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(239,68,68,0.12)'; (e.currentTarget as HTMLElement).style.color = '#f87171'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.4)'; }}
        >
          <LogOut size={18} />
          {sidebarOpen && <span style={{ fontSize: '0.875rem' }}>Logout</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={toggleSidebar}
        className="sidebar-collapse-toggle"
        style={{
          position: 'absolute',
          top: 22,
          right: -12,
          width: 24,
          height: 24,
          borderRadius: '50%',
          border: '2px solid var(--border)',
          background: 'var(--bg-card)',
          color: 'var(--text-secondary)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10,
          transition: 'all 200ms',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {sidebarOpen ? <ChevronLeft size={12} /> : <ChevronRight size={12} />}
      </button>
    </aside>
    {sidebarOpen && <button className="sidebar-overlay" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    </>
  );
}
