import { Employee, LeaveRequest, AttendanceRecord, Notification, AIInsight, PerformanceData, DepartmentStat, PaySlip, Badge } from '../types';

export const BADGES: Badge[] = [
  { id: 'perfect_attendance', name: 'Perfect Attendance', icon: '🏆', description: '30 days no absence', color: '#22c55e' },
  { id: 'top_performer', name: 'Top Performer', icon: '⭐', description: 'Top 10% performance score', color: '#f59e0b' },
  { id: 'team_player', name: 'Team Player', icon: '🤝', description: 'Recognized by peers 5+ times', color: '#3b82f6' },
  { id: 'streak_master', name: 'Streak Master', icon: '🔥', description: '30-day check-in streak', color: '#ef4444' },
  { id: 'early_bird', name: 'Early Bird', icon: '🌅', description: 'Consistently on time for 30 days', color: '#8b5cf6' },
  { id: 'mentor', name: 'Mentor', icon: '🎓', description: 'Mentored 3+ team members', color: '#06b6d4' },
];

export const EMPLOYEES: Employee[] = [
  {
    id: 'e1', name: 'Kiran Patel', email: 'kiran.patel@grevya.com',
    department: 'Engineering', position: 'Backend Developer',
    status: 'active', joinDate: '2022-03-15', salary: 85000,
    performance: 92, attendance: 97, avatar: 'KP',
    managerId: 'm1', phone: '+91 98765 43210', location: 'Bangalore',
    points: 2840, badges: ['perfect_attendance', 'top_performer', 'early_bird'], streak: 45,
  },
  {
    id: 'e2', name: 'Sneha Rao', email: 'sneha.rao@grevya.com',
    department: 'Content', position: 'Content Lead',
    status: 'active', joinDate: '2021-07-01', salary: 72000,
    performance: 88, attendance: 94, avatar: 'SR',
    managerId: 'm2', phone: '+91 87654 32109', location: 'Mumbai',
    points: 3120, badges: ['top_performer', 'team_player', 'mentor'], streak: 62,
  },
  {
    id: 'e3', name: 'Ravi Nair', email: 'ravi.nair@grevya.com',
    department: 'Sales', position: 'Sales Manager',
    status: 'active', joinDate: '2020-11-20', salary: 95000,
    performance: 95, attendance: 99, avatar: 'RN',
    managerId: 'm1', phone: '+91 76543 21098', location: 'Delhi',
    points: 4200, badges: ['perfect_attendance', 'top_performer', 'streak_master', 'team_player'], streak: 90,
  },
  {
    id: 'e4', name: 'Priya Sharma', email: 'priya.sharma@grevya.com',
    department: 'Design', position: 'UI/UX Designer',
    status: 'active', joinDate: '2023-01-10', salary: 78000,
    performance: 85, attendance: 91, avatar: 'PS',
    managerId: 'm2', phone: '+91 65432 10987', location: 'Hyderabad',
    points: 1950, badges: ['team_player', 'early_bird'], streak: 28,
  },
  {
    id: 'e5', name: 'Arjun Mehta', email: 'arjun.mehta@grevya.com',
    department: 'Engineering', position: 'Frontend Developer',
    status: 'on_leave', joinDate: '2022-09-05', salary: 80000,
    performance: 79, attendance: 85, avatar: 'AM',
    managerId: 'm1', phone: '+91 54321 09876', location: 'Chennai',
    points: 1620, badges: ['team_player'], streak: 12,
  },
  {
    id: 'e6', name: 'Divya Kumar', email: 'divya.kumar@grevya.com',
    department: 'HR', position: 'HR Executive',
    status: 'active', joinDate: '2021-03-22', salary: 65000,
    performance: 91, attendance: 96, avatar: 'DK',
    managerId: 'm2', phone: '+91 43210 98765', location: 'Pune',
    points: 2680, badges: ['perfect_attendance', 'mentor'], streak: 38,
  },
  {
    id: 'e7', name: 'Rahul Gupta', email: 'rahul.gupta@grevya.com',
    department: 'Finance', position: 'Financial Analyst',
    status: 'active', joinDate: '2022-06-01', salary: 88000,
    performance: 87, attendance: 93, avatar: 'RG',
    managerId: 'm1', phone: '+91 32109 87654', location: 'Kolkata',
    points: 2100, badges: ['early_bird', 'team_player'], streak: 22,
  },
  {
    id: 'e8', name: 'Ananya Singh', email: 'ananya.singh@grevya.com',
    department: 'Marketing', position: 'Marketing Specialist',
    status: 'active', joinDate: '2023-04-15', salary: 70000,
    performance: 83, attendance: 92, avatar: 'AS',
    managerId: 'm2', phone: '+91 21098 76543', location: 'Bangalore',
    points: 1780, badges: ['team_player'], streak: 18,
  },
  {
    id: 'e9', name: 'Vikram Joshi', email: 'vikram.joshi@grevya.com',
    department: 'Engineering', position: 'DevOps Engineer',
    status: 'active', joinDate: '2021-12-01', salary: 92000,
    performance: 94, attendance: 98, avatar: 'VJ',
    managerId: 'm1', phone: '+91 10987 65432', location: 'Hyderabad',
    points: 3800, badges: ['perfect_attendance', 'top_performer', 'streak_master', 'early_bird'], streak: 75,
  },
  {
    id: 'e10', name: 'Meera Iyer', email: 'meera.iyer@grevya.com',
    department: 'Operations', position: 'Operations Manager',
    status: 'inactive', joinDate: '2020-05-10', salary: 98000,
    performance: 76, attendance: 78, avatar: 'MI',
    managerId: 'm2', phone: '+91 09876 54321', location: 'Mumbai',
    points: 890, badges: [], streak: 3,
  },
  {
    id: 'e11', name: 'Suresh Pillai', email: 'suresh.pillai@grevya.com',
    department: 'Sales', position: 'Sales Executive',
    status: 'active', joinDate: '2023-07-20', salary: 62000,
    performance: 81, attendance: 89, avatar: 'SP',
    managerId: 'm1', phone: '+91 98765 12345', location: 'Chennai',
    points: 1340, badges: ['early_bird'], streak: 15,
  },
  {
    id: 'e12', name: 'Pooja Reddy', email: 'pooja.reddy@grevya.com',
    department: 'Design', position: 'Product Designer',
    status: 'active', joinDate: '2022-02-14', salary: 81000,
    performance: 90, attendance: 95, avatar: 'PR',
    managerId: 'm2', phone: '+91 87654 09876', location: 'Pune',
    points: 2560, badges: ['top_performer', 'team_player', 'early_bird'], streak: 41,
  },
];

export const LEAVE_REQUESTS: LeaveRequest[] = [
  {
    id: 'l1', employeeId: 'e5', employeeName: 'Arjun Mehta', employeeAvatar: 'AM',
    department: 'Engineering', type: 'sick', startDate: '2024-03-18', endDate: '2024-03-22',
    days: 5, reason: 'Fever and flu, doctor recommended rest', status: 'pending',
    appliedOn: '2024-03-17',
  },
  {
    id: 'l2', employeeId: 'e4', employeeName: 'Priya Sharma', employeeAvatar: 'PS',
    department: 'Design', type: 'casual', startDate: '2024-03-25', endDate: '2024-03-26',
    days: 2, reason: 'Family function and travel', status: 'approved',
    appliedOn: '2024-03-15', approvedBy: 'Ravi Nair', comments: 'Approved. Enjoy!',
  },
  {
    id: 'l3', employeeId: 'e8', employeeName: 'Ananya Singh', employeeAvatar: 'AS',
    department: 'Marketing', type: 'annual', startDate: '2024-04-01', endDate: '2024-04-07',
    days: 7, reason: 'Annual vacation with family', status: 'pending',
    appliedOn: '2024-03-20',
  },
  {
    id: 'l4', employeeId: 'e11', employeeName: 'Suresh Pillai', employeeAvatar: 'SP',
    department: 'Sales', type: 'emergency', startDate: '2024-03-19', endDate: '2024-03-19',
    days: 1, reason: 'Medical emergency in family', status: 'approved',
    appliedOn: '2024-03-19', approvedBy: 'Kiran Patel',
  },
  {
    id: 'l5', employeeId: 'e7', employeeName: 'Rahul Gupta', employeeAvatar: 'RG',
    department: 'Finance', type: 'casual', startDate: '2024-03-28', endDate: '2024-03-29',
    days: 2, reason: 'Personal errands', status: 'rejected',
    appliedOn: '2024-03-22', approvedBy: 'Ravi Nair', comments: 'Month-end closing. Cannot be approved.',
  },
  {
    id: 'l6', employeeId: 'e2', employeeName: 'Sneha Rao', employeeAvatar: 'SR',
    department: 'Content', type: 'annual', startDate: '2024-04-15', endDate: '2024-04-20',
    days: 6, reason: 'Vacation', status: 'pending',
    appliedOn: '2024-03-25',
  },
  {
    id: 'l7', employeeId: 'e12', employeeName: 'Pooja Reddy', employeeAvatar: 'PR',
    department: 'Design', type: 'sick', startDate: '2024-03-21', endDate: '2024-03-21',
    days: 1, reason: 'Not feeling well', status: 'approved',
    appliedOn: '2024-03-21', approvedBy: 'Divya Kumar',
  },
];

export const ATTENDANCE_RECORDS: AttendanceRecord[] = Array.from({ length: 30 }, (_, i) => ({
  id: `a${i}`,
  employeeId: 'e1',
  date: new Date(2024, 2, i + 1).toISOString().split('T')[0],
  checkIn: i % 7 === 0 ? '' : `0${8 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
  checkOut: i % 7 === 0 ? '' : `${17 + Math.floor(Math.random() * 3)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
  status: i % 7 === 0 ? 'holiday' : i % 10 === 3 ? 'late' : i % 15 === 5 ? 'absent' : 'present',
  hours: i % 7 === 0 ? 0 : 7 + Math.random() * 3,
}));

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', title: 'Leave Request Pending', message: 'Arjun Mehta has applied for sick leave (5 days). Requires your approval.', type: 'warning', timestamp: '2024-03-17T10:30:00', read: false },
  { id: 'n2', title: 'Performance Review Due', message: 'Q1 2024 performance reviews are due by March 31st.', type: 'info', timestamp: '2024-03-15T09:00:00', read: false },
  { id: 'n3', title: 'New Employee Onboarded', message: 'Suresh Pillai has successfully completed onboarding.', type: 'success', timestamp: '2024-03-14T14:20:00', read: true },
  { id: 'n4', title: 'Attendance Alert', message: 'Meera Iyer attendance dropped below 80% threshold this month.', type: 'error', timestamp: '2024-03-13T11:00:00', read: true },
  { id: 'n5', title: 'Leave Approved', message: 'Your casual leave request for March 25-26 has been approved.', type: 'success', timestamp: '2024-03-12T16:45:00', read: true },
  { id: 'n6', title: 'Team Meeting Reminder', message: 'All-hands meeting scheduled for tomorrow at 10 AM.', type: 'info', timestamp: '2024-03-11T08:00:00', read: true },
];

export const AI_INSIGHTS: AIInsight[] = [
  {
    id: 'ai1', type: 'burnout', severity: 'high',
    title: 'Burnout Risk Detected',
    description: 'Arjun Mehta has logged 60+ hours in the last 2 weeks with declining performance scores.',
    affectedEmployee: 'Arjun Mehta',
    recommendation: 'Consider scheduling a 1:1 check-in and potentially reassigning 20% of workload.',
    confidence: 87,
  },
  {
    id: 'ai2', type: 'attendance', severity: 'medium',
    title: 'Irregular Attendance Pattern',
    description: 'Meera Iyer shows Monday absences in 3 of last 4 weeks — possible disengagement signal.',
    affectedEmployee: 'Meera Iyer',
    recommendation: 'Initiate a casual check-in conversation. May need flexible work arrangements.',
    confidence: 73,
  },
  {
    id: 'ai3', type: 'performance', severity: 'low',
    title: 'High Performer Recognition Due',
    description: 'Ravi Nair and Vikram Joshi have consistently scored 90+ for 4 consecutive months.',
    affectedEmployee: 'Ravi Nair, Vikram Joshi',
    recommendation: 'Consider recognition awards or compensation review to retain top talent.',
    confidence: 95,
  },
  {
    id: 'ai4', type: 'productivity', severity: 'medium',
    title: 'Team Productivity Dip',
    description: 'Engineering team productivity dropped 12% this sprint. Possible reasons: unclear requirements or tech debt.',
    recommendation: 'Review sprint backlog quality and consider a retrospective focused on blockers.',
    confidence: 68,
  },
  {
    id: 'ai5', type: 'suggestion', severity: 'low',
    title: 'Optimal Leave Planning',
    description: 'April has 3 overlapping leave requests in the Design team. Staffing may be impacted.',
    recommendation: 'Stagger leave approvals or plan for temporary resource allocation.',
    confidence: 91,
  },
];

export const PERFORMANCE_DATA: PerformanceData[] = [
  { month: 'Oct', score: 78, target: 80 },
  { month: 'Nov', score: 82, target: 80 },
  { month: 'Dec', score: 79, target: 82 },
  { month: 'Jan', score: 85, target: 82 },
  { month: 'Feb', score: 88, target: 85 },
  { month: 'Mar', score: 91, target: 85 },
];

export const DEPARTMENT_STATS: DepartmentStat[] = [
  { name: 'Engineering', employees: 3, avgPerformance: 88, attendance: 93 },
  { name: 'Sales', employees: 2, avgPerformance: 88, attendance: 94 },
  { name: 'Design', employees: 2, avgPerformance: 87, attendance: 93 },
  { name: 'Content', employees: 1, avgPerformance: 88, attendance: 94 },
  { name: 'HR', employees: 1, avgPerformance: 91, attendance: 96 },
  { name: 'Finance', employees: 1, avgPerformance: 87, attendance: 93 },
  { name: 'Marketing', employees: 1, avgPerformance: 83, attendance: 92 },
  { name: 'Operations', employees: 1, avgPerformance: 76, attendance: 78 },
];

export const PAYSLIPS: PaySlip[] = [
  { id: 'p1', employeeId: 'e1', month: 'March', year: 2024, basicSalary: 85000, hra: 17000, conveyance: 1600, medical: 1250, bonus: 5000, pf: 10200, tax: 8500, netSalary: 91150 },
  { id: 'p2', employeeId: 'e1', month: 'February', year: 2024, basicSalary: 85000, hra: 17000, conveyance: 1600, medical: 1250, bonus: 0, pf: 10200, tax: 8500, netSalary: 86150 },
  { id: 'p3', employeeId: 'e1', month: 'January', year: 2024, basicSalary: 85000, hra: 17000, conveyance: 1600, medical: 1250, bonus: 10000, pf: 10200, tax: 8500, netSalary: 96150 },
];

export const LEADERBOARD = EMPLOYEES
  .filter(e => e.status === 'active')
  .sort((a, b) => b.points - a.points)
  .slice(0, 8);

export const DEMO_USERS = [
  { id: 'u1', name: 'Divya Kumar', email: 'hr@grevya.com', password: 'hr123', role: 'hr_manager' as const, department: 'HR', position: 'HR Manager', avatar: 'DK', joinDate: '2021-03-22', managerId: undefined },
  { id: 'u2', name: 'Ravi Nair', email: 'manager@grevya.com', password: 'mgr123', role: 'manager' as const, department: 'Sales', position: 'Sales Manager', avatar: 'RN', joinDate: '2020-11-20', managerId: 'u1' },
  { id: 'u3', name: 'Kiran Patel', email: 'employee@grevya.com', password: 'emp123', role: 'employee' as const, department: 'Engineering', position: 'Backend Developer', avatar: 'KP', joinDate: '2022-03-15', managerId: 'u2' },
];
