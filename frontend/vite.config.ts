import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          // Page chunks by feature area
          'pages-dashboards': [
            './src/pages/HRDashboard',
            './src/pages/ManagerDashboard',
            './src/pages/EmployeeDashboard',
          ],
          'pages-hr': [
            './src/pages/EmployeesPage',
            './src/pages/LeavePage',
            './src/pages/AttendancePage',
            './src/pages/PerformancePage',
          ],
          'pages-finance': [
            './src/pages/PayslipsPage',
            './src/pages/ExpensesPage',
            './src/pages/BudgetPage',
            './src/pages/CompliancePage',
          ],
          'pages-ops': [
            './src/pages/RecruitmentPage',
            './src/pages/OnboardingPage',
            './src/pages/ShiftsPage',
            './src/pages/DocumentsPage',
            './src/pages/CalendarPage',
            './src/pages/OrgChartPage',
          ],
          'pages-reports': [
            './src/pages/ReportsPage',
            './src/pages/LeaderboardPage',
            './src/pages/AIInsightsPage',
            './src/pages/AuditLogPage',
          ],
          'pages-user': [
            './src/pages/ProfilePage',
            './src/pages/NotificationsPage',
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
