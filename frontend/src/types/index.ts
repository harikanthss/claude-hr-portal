export type UserRole = 'super_admin' | 'admin' | 'hr_manager' | 'manager' | 'employee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  position: string;
  avatar: string;
  joinDate: string;
  managerId?: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave';
  joinDate: string;
  salary: number;
  performance: number;
  attendance: number;
  avatar: string;
  managerId: string;
  phone: string;
  location: string;
  points: number;
  badges: string[];
  streak: number;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeAvatar: string;
  department: string;
  type: 'sick' | 'casual' | 'annual' | 'maternity' | 'paternity' | 'emergency' | 'compensatory';
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedOn: string;
  approvedBy?: string;
  comments?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'holiday';
  hours: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  isRead?: boolean;
  link?: string;
}

export interface AIInsight {
  id: string;
  type: 'burnout' | 'performance' | 'attendance' | 'productivity' | 'suggestion';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  affectedEmployee?: string;
  recommendation: string;
  confidence: number;
}

export interface PerformanceData {
  month: string;
  score: number;
  target: number;
}

export interface DepartmentStat {
  name: string;
  employees: number;
  avgPerformance: number;
  attendance: number;
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export interface PaySlip {
  id: string;
  employeeId: string;
  month: string;
  year: number;
  basicSalary: number;
  hra: number;
  conveyance: number;
  medical: number;
  bonus: number;
  pf: number;
  tax: number;
  netSalary: number;
}
