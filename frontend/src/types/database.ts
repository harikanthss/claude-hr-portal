import type { Database, Json } from './supabase';

export type { Database, Json };

type Tables = Database['public']['Tables'];
type Enums = Database['public']['Enums'];
type Row<T extends keyof Tables> = Tables[T]['Row'];
type Insert<T extends keyof Tables> = Tables[T]['Insert'];
type Update<T extends keyof Tables> = Tables[T]['Update'];

export type AppRole = Enums['app_role'];
export type ProfileStatus = Enums['profile_status'];
export type EmploymentType = Enums['employment_type'];
export type LeaveStatus = Enums['leave_status'];
export type AttendanceStatus = Enums['attendance_status'];
export type WorkMode = Enums['work_mode'];
export type RequestStatus = Enums['request_status'];
export type PayrollStatus = Enums['payroll_status'];
export type ReviewStatus = Enums['review_status'];
export type JobStatus = Enums['job_status'];
export type CandidateStage = Enums['candidate_stage'];
export type ExpenseStatus = Enums['expense_status'];
export type ShiftStatus = Enums['shift_status'];

export type Department = Row<'departments'>;
export type DepartmentInsert = Insert<'departments'>;
export type DepartmentUpdate = Update<'departments'>;

export type Profile = Row<'profiles'> & {
  department?: Pick<Department, 'id' | 'name'> | null;
  departments?: Pick<Department, 'id' | 'name'> | null;
  manager?: Pick<Row<'profiles'>, 'id' | 'full_name' | 'email' | 'avatar'> | null;
};
export type ProfileInsert = Insert<'profiles'>;
export type ProfileUpdate = Update<'profiles'>;

export type JobRole = Row<'job_roles'>;
export type LeaveType = Row<'leave_types'> & { description?: string | null };
export type LeaveBalance = Row<'leave_balances'> & { leave_type?: LeaveType | null };
export type LeaveRequest = Row<'leave_requests'> & {
  employee?: Pick<Profile, 'id' | 'full_name' | 'email' | 'avatar' | 'department_id'> | null;
  leave_type?: Pick<LeaveType, 'id' | 'name'> | null;
  approver?: Pick<Profile, 'id' | 'full_name'> | null;
};

export type AttendanceRecord = Row<'attendance_records'> & {
  employee?: Pick<Profile, 'id' | 'full_name' | 'avatar' | 'department_id'> | null;
};
export type AttendanceRegularization = Row<'attendance_regularizations'>;
export type WorkModeRequest = Row<'work_mode_requests'>;
export type WorkPolicy = Row<'work_policies'>;
export type Holiday = Row<'holidays'>;

export interface GeoFence {
  lat: number;
  lng: number;
  radius_meters: number;
  label: string;
}

export type JobPosting = Row<'job_postings'> & {
  department?: Department | null;
  candidates?: Candidate[];
};
export type JobPostingInsert = Insert<'job_postings'>;
export type Candidate = Row<'candidates'>;

export type PayrollRun = Row<'payroll_runs'>;
export type PayrollRecord = Row<'payroll_records'> & {
  employee?: Pick<Profile, 'id' | 'full_name' | 'email' | 'department_id' | 'job_title' | 'salary'> | null;
  run?: PayrollRun | null;
};

export type ReviewCycle = Row<'review_cycles'>;
export type PerformanceReview = Row<'performance_reviews'> & {
  employee?: Pick<Profile, 'id' | 'full_name' | 'avatar' | 'department_id' | 'job_title'> | null;
  reviewer?: Pick<Profile, 'id' | 'full_name'> | null;
  cycle?: ReviewCycle | null;
};

export interface SelfAssessment {
  goals?: string;
  achievements?: string;
  areas_of_improvement?: string;
  rating?: number;
}

export interface ManagerReview {
  technical?: number;
  communication?: number;
  leadership?: number;
  delivery?: number;
  innovation?: number;
  teamwork?: number;
  overall?: number;
  comments?: string;
}

export type Announcement = Row<'announcements'> & {
  author?: Pick<Profile, 'id' | 'full_name' | 'avatar'> | null;
};
export type NotificationPref = Row<'notification_prefs'>;
export type AuditLogEntry = Row<'audit_log'> & {
  actor?: Pick<Profile, 'id' | 'full_name' | 'email'> | null;
  created_at?: string;
};
