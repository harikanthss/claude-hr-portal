import React, { useEffect, useState, Suspense, lazy } from 'react';
import { useStore } from './services/store';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/layout/Sidebar';
import Topbar from './components/layout/Topbar';
import AIChat from './components/ai/AIChat';
import { ToastContainer } from './components/ui/Toast';

// ── Lazy-loaded pages (code-split for performance) ────────────────────────────
const LandingPage = lazy(() => import('./pages/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const HRDashboard = lazy(() => import('./pages/HRDashboard'));
const ManagerDashboard = lazy(() => import('./pages/ManagerDashboard'));
const EmployeeDashboard = lazy(() => import('./pages/EmployeeDashboard'));
const EmployeesPage = lazy(() => import('./pages/EmployeesPage'));
const LeavePage = lazy(() => import('./pages/LeavePage'));
const AttendancePage = lazy(() => import('./pages/AttendancePage'));
const PerformancePage = lazy(() => import('./pages/PerformancePage'));
const RecruitmentPage = lazy(() => import('./pages/RecruitmentPage'));
const OrgChartPage = lazy(() => import('./pages/OrgChartPage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const ReportsPage = lazy(() => import('./pages/ReportsPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const LeaderboardPage = lazy(() => import('./pages/LeaderboardPage'));
const AIInsightsPage = lazy(() => import('./pages/AIInsightsPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const PayslipsPage = lazy(() => import('./pages/PayslipsPage'));
const CompliancePage = lazy(() => import('./pages/CompliancePage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const DocumentsPage = lazy(() => import('./pages/DocumentsPage'));
const ShiftsPage = lazy(() => import('./pages/ShiftsPage'));
const AuditLogPage = lazy(() => import('./pages/AuditLogPage'));
const AccessRequestsPage = lazy(() => import('./pages/AccessRequestsPage'));
const AccessReviewPage = lazy(() => import('./pages/AccessReviewPage'));

// ── Suspense loading fallback ─────────────────────────────────────────────────
function PageLoader() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 12 }}>
      <div className="spinner" />
      <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Loading…</span>
    </div>
  );
}

function PageContent({ page }: { page: string }) {
  const { currentUser } = useStore();

  const getPage = () => {
    if (page === 'dashboard') {
      if (currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'hr_manager') return <HRDashboard />;
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
    if (page === 'ai') return <AIInsightsPage />;
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
    if (page === 'access') return <AccessRequestsPage />;
    if (page === 'compliance') return <CompliancePage />;
    if (page === 'budget') return <BudgetPage />;
    return <HRDashboard />;
  };

  return (
    <ErrorBoundary key={page}>
      <Suspense fallback={<PageLoader />}>
        {getPage()}
      </Suspense>
    </ErrorBoundary>
  );
}

export default function App() {
  const { currentUser, darkMode, sidebarOpen, authStatus, initializeAuth, setSidebarOpen } = useStore();
  const [page, setPage] = useState(() => localStorage.getItem('currentPage') || 'dashboard');
  const [appView, setAppView] = useState<'landing' | 'login' | 'app'>('landing');
  const isAccessReview = window.location.pathname === '/access-review';

  const navigate = (nextPage: string) => {
    setPage(nextPage);
    localStorage.setItem('currentPage', nextPage);
    if (window.innerWidth <= 900) setSidebarOpen(false);
  };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    initializeAuth().catch((err) => console.error('[Auth] Session restore failed:', err));
  }, [initializeAuth]);

  useEffect(() => {
    let wasMobile = window.innerWidth <= 900;
    const handleResize = () => {
      const isMobile = window.innerWidth <= 900;
      if (isMobile !== wasMobile) {
        setSidebarOpen(!isMobile);
        wasMobile = isMobile;
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setSidebarOpen]);

  // Once user logs in, switch to app view
  useEffect(() => {
    if (currentUser && appView !== 'app') setAppView('app');
    if (!currentUser && ['pending', 'denied'].includes(authStatus) && appView !== 'login') setAppView('login');
    if (!currentUser && appView === 'app') setAppView('landing');
  }, [currentUser, authStatus, appView]);

  if (isAccessReview) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <AccessReviewPage />
        </Suspense>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  if (authStatus === 'checking') {
    return (
      <ErrorBoundary>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
          <PageLoader />
        </div>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  if (appView === 'landing') {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <LandingPage onGetStarted={() => setAppView('login')} />
        </Suspense>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  if (appView === 'login' && !currentUser) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <LoginPage onBack={() => setAppView('landing')} />
        </Suspense>
        <ToastContainer />
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className="app-layout">
        <Sidebar currentPage={page} onNavigate={navigate} />
        <div className={`main-content ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
          <Topbar currentPage={page} onNavigate={navigate} />
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
    </ErrorBoundary>
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
  access: { title: 'Access Requests', desc: 'Approve or reject pending portal users' },
  compliance: { title: 'Compliance Reports', desc: 'PF, ESI, TDS and statutory filing reports' },
  budget: { title: 'Budget Tracker', desc: 'Department budget allocation and tracking' },
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
