import React, { useEffect, useState } from 'react';
import { useStore } from './services/store';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import HRDashboard from './pages/HRDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeesPage from './pages/EmployeesPage';
import LeavePage from './pages/LeavePage';
import AttendancePage from './pages/AttendancePage';
import PerformancePage from './pages/PerformancePage';
import RecruitmentPage from './pages/RecruitmentPage';
import OrgChartPage from './pages/OrgChartPage';
import ExpensesPage from './pages/ExpensesPage';
import OnboardingPage from './pages/OnboardingPage';
import CalendarPage from './pages/CalendarPage';
import {
  ReportsPage, NotificationsPage, LeaderboardPage, AIPage, PayslipsPage, ProfilePage
} from './pages/OtherPages';
import DocumentsPage from './pages/DocumentsPage';
import ShiftsPage from './pages/ShiftsPage';
import AuditLogPage from './pages/AuditLogPage';
import AIChat from './components/ai/AIChat';
import { ToastContainer } from './components/ui/Toast';

function PageContent({ page }: { page: string }) {
  const { currentUser } = useStore();

  if (page === 'dashboard') {
    if (currentUser?.role === 'hr_manager') return <HRDashboard />;
    if (currentUser?.role === 'manager') return <ManagerDashboard />;
    return <EmployeeDashboard />;
  }
  if (page === 'employees') return <EmployeesPage />;
  if (page === 'leave') return <LeavePage />;
  if (page === 'attendance') return <AttendancePage />;
  if (page === 'performance') return <PerformancePage />;
  if (page === 'reports') return <ReportsPage />;
  if (page === 'notifications') return <NotificationsPage />;
  if (page === 'leaderboard') return <LeaderboardPage />;
  if (page === 'ai') return <AIPage />;
  if (page === 'payslips') return <PayslipsPage />;
  if (page === 'profile') return <ProfilePage />;
  if (page === 'recruitment') return <RecruitmentPage />;
  if (page === 'orgchart') return <OrgChartPage />;
  if (page === 'expenses') return <ExpensesPage />;
  if (page === 'onboarding') return <OnboardingPage />;
  if (page === 'calendar') return <CalendarPage />;
  if (page === 'documents') return <DocumentsPage />;
  if (page === 'shifts') return <ShiftsPage />;
  if (page === 'audit') return <AuditLogPage />;
  return <HRDashboard />;
}

export default function App() {
  const { currentUser, darkMode, sidebarOpen } = useStore();
  const [page, setPage] = useState('dashboard');
  const [appView, setAppView] = useState<'landing' | 'login' | 'app'>('landing');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // Once user logs in, switch to app view
  useEffect(() => {
    if (currentUser && appView !== 'app') setAppView('app');
    if (!currentUser && appView === 'app') setAppView('landing');
  }, [currentUser]);

  if (appView === 'landing') {
    return (
      <>
        <LandingPage onGetStarted={() => setAppView('login')} />
        <ToastContainer />
      </>
    );
  }

  if (appView === 'login' && !currentUser) {
    return (
      <>
        <LoginPage onBack={() => setAppView('landing')} />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="app-layout">
      <Sidebar currentPage={page} onNavigate={setPage} />
      <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        <Topbar currentPage={page} onNavigate={setPage} />
        <main className="page-content">
          <div className="page-header">
            <PageHeader page={page} />
          </div>
          <PageContent page={page} />
        </main>
      </div>
      <AIChat />
      <ToastContainer />
    </div>
  );
}

const PAGE_META: Record<string, { title: string; desc: string }> = {
  dashboard: { title: 'Dashboard', desc: 'Overview of your HR operations' },
  employees: { title: 'Employee Management', desc: 'Manage your team and their details' },
  leave: { title: 'Leave Management', desc: 'Track and approve leave requests' },
  attendance: { title: 'Attendance', desc: 'Monitor team attendance and logs' },
  performance: { title: 'Performance', desc: 'Performance reviews and analytics' },
  reports: { title: 'Reports & Analytics', desc: 'Insights and data exports' },
  notifications: { title: 'Notifications', desc: 'Stay updated on important activities' },
  leaderboard: { title: 'Leaderboard', desc: 'Top performers and team rankings' },
  ai: { title: 'AI Insights', desc: 'Smart recommendations powered by AI' },
  payslips: { title: 'Payslips', desc: 'View and download your salary slips' },
  profile: { title: 'My Profile', desc: 'Manage your account settings' },
  recruitment: { title: 'Recruitment', desc: 'Manage jobs, candidates and hiring pipeline' },
  orgchart: { title: 'Org Chart', desc: 'Visual company hierarchy and department structure' },
  expenses: { title: 'Expense Claims', desc: 'Submit and approve employee expenses' },
  onboarding: { title: 'Onboarding', desc: 'Track new hire tasks and progress' },
  calendar: { title: 'Calendar', desc: 'Company events, leaves and holidays' },
  documents: { title: 'Documents', desc: 'Upload, manage and download company documents' },
  shifts: { title: 'Shift Scheduling', desc: 'Schedule and manage employee shifts' },
  audit: { title: 'Audit Log', desc: 'Track all system activities and changes' },
};

function PageHeader({ page }: { page: string }) {
  const meta = PAGE_META[page] || { title: page, desc: '' };
  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, marginBottom: 2 }}>{meta.title}</h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>{meta.desc}</p>
    </div>
  );
}
