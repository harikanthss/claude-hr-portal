export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      "announcements": {
        Row: {
          "id": string
          "title": string
          "body": string
          "category": string | null
          "pinned": boolean
          "posted_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "title": string
          "body": string
          "category"?: string | null
          "pinned"?: boolean
          "posted_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "title"?: string
          "body"?: string
          "category"?: string | null
          "pinned"?: boolean
          "posted_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "attendance_records": {
        Row: {
          "id": string
          "employee_id": string
          "work_date": string
          "clock_in": string | null
          "clock_out": string | null
          "status": Database["public"]["Enums"]["attendance_status"]
          "work_mode": Database["public"]["Enums"]["work_mode"]
          "total_hours": number
          "notes": string | null
          "source": string
          "latitude": number | null
          "longitude": number | null
          "ip_address": unknown | null
          "out_of_fence": boolean
          "overtime_hours": number
          "is_incomplete": boolean
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id": string
          "work_date": string
          "clock_in"?: string | null
          "clock_out"?: string | null
          "status"?: Database["public"]["Enums"]["attendance_status"]
          "work_mode"?: Database["public"]["Enums"]["work_mode"]
          "total_hours"?: number
          "notes"?: string | null
          "source"?: string
          "latitude"?: number | null
          "longitude"?: number | null
          "ip_address"?: unknown | null
          "out_of_fence"?: boolean
          "overtime_hours"?: number
          "is_incomplete"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string
          "work_date"?: string
          "clock_in"?: string | null
          "clock_out"?: string | null
          "status"?: Database["public"]["Enums"]["attendance_status"]
          "work_mode"?: Database["public"]["Enums"]["work_mode"]
          "total_hours"?: number
          "notes"?: string | null
          "source"?: string
          "latitude"?: number | null
          "longitude"?: number | null
          "ip_address"?: unknown | null
          "out_of_fence"?: boolean
          "overtime_hours"?: number
          "is_incomplete"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "attendance_regularizations": {
        Row: {
          "id": string
          "attendance_id": string | null
          "employee_id": string
          "requested_in": string | null
          "requested_out": string | null
          "reason": string
          "status": Database["public"]["Enums"]["request_status"]
          "approver_id": string | null
          "decided_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "attendance_id"?: string | null
          "employee_id": string
          "requested_in"?: string | null
          "requested_out"?: string | null
          "reason": string
          "status"?: Database["public"]["Enums"]["request_status"]
          "approver_id"?: string | null
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "attendance_id"?: string | null
          "employee_id"?: string
          "requested_in"?: string | null
          "requested_out"?: string | null
          "reason"?: string
          "status"?: Database["public"]["Enums"]["request_status"]
          "approver_id"?: string | null
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "audit_log": {
        Row: {
          "id": string
          "actor_id": string | null
          "action": string
          "entity": string
          "entity_id": string | null
          "diff": Json
          "ip_address": unknown | null
          "request_id": string | null
          "metadata": Json
          "at": string
        }
        Insert: {
          "id"?: string
          "actor_id"?: string | null
          "action": string
          "entity": string
          "entity_id"?: string | null
          "diff"?: Json
          "ip_address"?: unknown | null
          "request_id"?: string | null
          "metadata"?: Json
          "at"?: string
        }
        Update: {
          "id"?: string
          "actor_id"?: string | null
          "action"?: string
          "entity"?: string
          "entity_id"?: string | null
          "diff"?: Json
          "ip_address"?: unknown | null
          "request_id"?: string | null
          "metadata"?: Json
          "at"?: string
        }
        Relationships: []
      }
      "calendar_events": {
        Row: {
          "id": string
          "title": string
          "start_date": string
          "end_date": string | null
          "type": string
          "color": string
          "description": string | null
          "visibility": string
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "title": string
          "start_date": string
          "end_date"?: string | null
          "type"?: string
          "color"?: string
          "description"?: string | null
          "visibility"?: string
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "title"?: string
          "start_date"?: string
          "end_date"?: string | null
          "type"?: string
          "color"?: string
          "description"?: string | null
          "visibility"?: string
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "candidates": {
        Row: {
          "id": string
          "job_posting_id": string | null
          "name": string
          "email": string
          "phone": string | null
          "source": string | null
          "stage": Database["public"]["Enums"]["candidate_stage"]
          "rating": number | null
          "notes": string | null
          "applied_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "job_posting_id"?: string | null
          "name": string
          "email": string
          "phone"?: string | null
          "source"?: string | null
          "stage"?: Database["public"]["Enums"]["candidate_stage"]
          "rating"?: number | null
          "notes"?: string | null
          "applied_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "job_posting_id"?: string | null
          "name"?: string
          "email"?: string
          "phone"?: string | null
          "source"?: string | null
          "stage"?: Database["public"]["Enums"]["candidate_stage"]
          "rating"?: number | null
          "notes"?: string | null
          "applied_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "department_budgets": {
        Row: {
          "id": string
          "department_id": string
          "month": string
          "year": number
          "budget_amount": number
          "spent_amount": number
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "department_id": string
          "month": string
          "year": number
          "budget_amount"?: number
          "spent_amount"?: number
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "department_id"?: string
          "month"?: string
          "year"?: number
          "budget_amount"?: number
          "spent_amount"?: number
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "departments": {
        Row: {
          "id": string
          "name": string
          "head_id": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "name": string
          "head_id"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "name"?: string
          "head_id"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "documents": {
        Row: {
          "id": string
          "employee_id": string | null
          "name": string
          "mime_type": string | null
          "category": string
          "storage_path": string
          "file_size": number
          "uploaded_by": string | null
          "uploaded_at": string
          "description": string | null
          "visibility": string
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id"?: string | null
          "name": string
          "mime_type"?: string | null
          "category"?: string
          "storage_path": string
          "file_size"?: number
          "uploaded_by"?: string | null
          "uploaded_at"?: string
          "description"?: string | null
          "visibility"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string | null
          "name"?: string
          "mime_type"?: string | null
          "category"?: string
          "storage_path"?: string
          "file_size"?: number
          "uploaded_by"?: string | null
          "uploaded_at"?: string
          "description"?: string | null
          "visibility"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "expenses": {
        Row: {
          "id": string
          "employee_id": string
          "category": string
          "amount": number
          "description": string | null
          "expense_date": string | null
          "status": Database["public"]["Enums"]["expense_status"]
          "receipt_path": string | null
          "submitted_at": string
          "approver_id": string | null
          "comments": string | null
          "decided_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id": string
          "category": string
          "amount": number
          "description"?: string | null
          "expense_date"?: string | null
          "status"?: Database["public"]["Enums"]["expense_status"]
          "receipt_path"?: string | null
          "submitted_at"?: string
          "approver_id"?: string | null
          "comments"?: string | null
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string
          "category"?: string
          "amount"?: number
          "description"?: string | null
          "expense_date"?: string | null
          "status"?: Database["public"]["Enums"]["expense_status"]
          "receipt_path"?: string | null
          "submitted_at"?: string
          "approver_id"?: string | null
          "comments"?: string | null
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "holidays": {
        Row: {
          "id": string
          "date": string
          "name": string
          "is_optional": boolean
          "created_at": string
        }
        Insert: {
          "id"?: string
          "date": string
          "name": string
          "is_optional"?: boolean
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "date"?: string
          "name"?: string
          "is_optional"?: boolean
          "created_at"?: string
        }
        Relationships: []
      }
      "job_postings": {
        Row: {
          "id": string
          "title": string
          "department_id": string | null
          "location": string | null
          "type": string | null
          "status": Database["public"]["Enums"]["job_status"]
          "description": string | null
          "openings": number
          "posted_by": string | null
          "posted_date": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "title": string
          "department_id"?: string | null
          "location"?: string | null
          "type"?: string | null
          "status"?: Database["public"]["Enums"]["job_status"]
          "description"?: string | null
          "openings"?: number
          "posted_by"?: string | null
          "posted_date"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "title"?: string
          "department_id"?: string | null
          "location"?: string | null
          "type"?: string | null
          "status"?: Database["public"]["Enums"]["job_status"]
          "description"?: string | null
          "openings"?: number
          "posted_by"?: string | null
          "posted_date"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "job_roles": {
        Row: {
          "id": string
          "title": string
          "department_id": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "title": string
          "department_id"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "title"?: string
          "department_id"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "leave_balances": {
        Row: {
          "id": string
          "employee_id": string
          "leave_type_id": string
          "year": number
          "total": number
          "used": number
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id": string
          "leave_type_id": string
          "year": number
          "total"?: number
          "used"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string
          "leave_type_id"?: string
          "year"?: number
          "total"?: number
          "used"?: number
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "leave_requests": {
        Row: {
          "id": string
          "employee_id": string
          "leave_type_id": string
          "from_date": string
          "to_date": string
          "days": number
          "status": Database["public"]["Enums"]["leave_status"]
          "reason": string | null
          "approver_id": string | null
          "comments": string | null
          "decided_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id": string
          "leave_type_id": string
          "from_date": string
          "to_date": string
          "days": number
          "status"?: Database["public"]["Enums"]["leave_status"]
          "reason"?: string | null
          "approver_id"?: string | null
          "comments"?: string | null
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string
          "leave_type_id"?: string
          "from_date"?: string
          "to_date"?: string
          "days"?: number
          "status"?: Database["public"]["Enums"]["leave_status"]
          "reason"?: string | null
          "approver_id"?: string | null
          "comments"?: string | null
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "leave_types": {
        Row: {
          "id": string
          "name": string
          "annual_quota": number
          "carry_forward": boolean
          "paid": boolean
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "name": string
          "annual_quota"?: number
          "carry_forward"?: boolean
          "paid"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "name"?: string
          "annual_quota"?: number
          "carry_forward"?: boolean
          "paid"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "notification_prefs": {
        Row: {
          "id": string
          "employee_id": string
          "event": string
          "email": boolean
          "in_app": boolean
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id": string
          "event": string
          "email"?: boolean
          "in_app"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string
          "event"?: string
          "email"?: boolean
          "in_app"?: boolean
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "notifications": {
        Row: {
          "id": string
          "user_id": string | null
          "title": string
          "message": string
          "type": string
          "is_read": boolean
          "link": string | null
          "read_at": string | null
          "created_at": string
        }
        Insert: {
          "id"?: string
          "user_id"?: string | null
          "title": string
          "message": string
          "type"?: string
          "is_read"?: boolean
          "link"?: string | null
          "read_at"?: string | null
          "created_at"?: string
        }
        Update: {
          "id"?: string
          "user_id"?: string | null
          "title"?: string
          "message"?: string
          "type"?: string
          "is_read"?: boolean
          "link"?: string | null
          "read_at"?: string | null
          "created_at"?: string
        }
        Relationships: []
      }
      "onboarding_tasks": {
        Row: {
          "id": string
          "employee_id": string | null
          "task_label": string
          "due_day": number
          "assignee_id": string | null
          "buddy_id": string | null
          "notes": string | null
          "done": boolean
          "start_date": string | null
          "completed_at": string | null
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id"?: string | null
          "task_label": string
          "due_day"?: number
          "assignee_id"?: string | null
          "buddy_id"?: string | null
          "notes"?: string | null
          "done"?: boolean
          "start_date"?: string | null
          "completed_at"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string | null
          "task_label"?: string
          "due_day"?: number
          "assignee_id"?: string | null
          "buddy_id"?: string | null
          "notes"?: string | null
          "done"?: boolean
          "start_date"?: string | null
          "completed_at"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "payroll_records": {
        Row: {
          "id": string
          "run_id": string
          "employee_id": string
          "base_salary": number
          "allowances": Json
          "deductions": Json
          "net_pay": number
          "status": Database["public"]["Enums"]["payroll_status"]
          "payslip_pdf_path": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "run_id": string
          "employee_id": string
          "base_salary"?: number
          "allowances"?: Json
          "deductions"?: Json
          "net_pay"?: number
          "status"?: Database["public"]["Enums"]["payroll_status"]
          "payslip_pdf_path"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "run_id"?: string
          "employee_id"?: string
          "base_salary"?: number
          "allowances"?: Json
          "deductions"?: Json
          "net_pay"?: number
          "status"?: Database["public"]["Enums"]["payroll_status"]
          "payslip_pdf_path"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "payroll_runs": {
        Row: {
          "id": string
          "month": string
          "year": number
          "status": Database["public"]["Enums"]["payroll_status"]
          "processed_by": string | null
          "processed_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "month": string
          "year": number
          "status"?: Database["public"]["Enums"]["payroll_status"]
          "processed_by"?: string | null
          "processed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "month"?: string
          "year"?: number
          "status"?: Database["public"]["Enums"]["payroll_status"]
          "processed_by"?: string | null
          "processed_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "performance_reviews": {
        Row: {
          "id": string
          "cycle_id": string | null
          "employee_id": string
          "reviewer_id": string | null
          "self_assessment": Json
          "manager_review": Json
          "rating": number | null
          "status": Database["public"]["Enums"]["review_status"]
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "cycle_id"?: string | null
          "employee_id": string
          "reviewer_id"?: string | null
          "self_assessment"?: Json
          "manager_review"?: Json
          "rating"?: number | null
          "status"?: Database["public"]["Enums"]["review_status"]
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "cycle_id"?: string | null
          "employee_id"?: string
          "reviewer_id"?: string | null
          "self_assessment"?: Json
          "manager_review"?: Json
          "rating"?: number | null
          "status"?: Database["public"]["Enums"]["review_status"]
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "profiles": {
        Row: {
          "id": string
          "full_name": string
          "email": string
          "avatar": string | null
          "phone": string | null
          "role": Database["public"]["Enums"]["app_role"] | null
          "department_id": string | null
          "manager_id": string | null
          "job_title": string | null
          "status": Database["public"]["Enums"]["profile_status"]
          "employment_type": Database["public"]["Enums"]["employment_type"]
          "location": string | null
          "hire_date": string | null
          "salary": number | null
          "dob": string | null
          "gender": string | null
          "emergency_contact": Json
          "bio": string | null
          "performance_score": number
          "attendance_score": number
          "points": number
          "streak": number
          "reviewed_by": string | null
          "reviewed_at": string | null
          "decision_method": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id": string
          "full_name": string
          "email": string
          "avatar"?: string | null
          "phone"?: string | null
          "role"?: Database["public"]["Enums"]["app_role"] | null
          "department_id"?: string | null
          "manager_id"?: string | null
          "job_title"?: string | null
          "status"?: Database["public"]["Enums"]["profile_status"]
          "employment_type"?: Database["public"]["Enums"]["employment_type"]
          "location"?: string | null
          "hire_date"?: string | null
          "salary"?: number | null
          "dob"?: string | null
          "gender"?: string | null
          "emergency_contact"?: Json
          "bio"?: string | null
          "performance_score"?: number
          "attendance_score"?: number
          "points"?: number
          "streak"?: number
          "reviewed_by"?: string | null
          "reviewed_at"?: string | null
          "decision_method"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "full_name"?: string
          "email"?: string
          "avatar"?: string | null
          "phone"?: string | null
          "role"?: Database["public"]["Enums"]["app_role"] | null
          "department_id"?: string | null
          "manager_id"?: string | null
          "job_title"?: string | null
          "status"?: Database["public"]["Enums"]["profile_status"]
          "employment_type"?: Database["public"]["Enums"]["employment_type"]
          "location"?: string | null
          "hire_date"?: string | null
          "salary"?: number | null
          "dob"?: string | null
          "gender"?: string | null
          "emergency_contact"?: Json
          "bio"?: string | null
          "performance_score"?: number
          "attendance_score"?: number
          "points"?: number
          "streak"?: number
          "reviewed_by"?: string | null
          "reviewed_at"?: string | null
          "decision_method"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "review_cycles": {
        Row: {
          "id": string
          "name": string
          "period": string
          "type": string
          "status": Database["public"]["Enums"]["review_status"]
          "due_date": string | null
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "name": string
          "period": string
          "type"?: string
          "status"?: Database["public"]["Enums"]["review_status"]
          "due_date"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "name"?: string
          "period"?: string
          "type"?: string
          "status"?: Database["public"]["Enums"]["review_status"]
          "due_date"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "shifts": {
        Row: {
          "id": string
          "employee_id": string
          "shift_date": string
          "shift_type": string
          "start_time": string | null
          "end_time": string | null
          "status": Database["public"]["Enums"]["shift_status"]
          "notes": string | null
          "created_by": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id": string
          "shift_date": string
          "shift_type"?: string
          "start_time"?: string | null
          "end_time"?: string | null
          "status"?: Database["public"]["Enums"]["shift_status"]
          "notes"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string
          "shift_date"?: string
          "shift_type"?: string
          "start_time"?: string | null
          "end_time"?: string | null
          "status"?: Database["public"]["Enums"]["shift_status"]
          "notes"?: string | null
          "created_by"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "work_mode_requests": {
        Row: {
          "id": string
          "employee_id": string
          "work_date": string
          "mode": Database["public"]["Enums"]["work_mode"]
          "reason": string | null
          "status": Database["public"]["Enums"]["request_status"]
          "approver_id": string | null
          "decided_at": string | null
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "employee_id": string
          "work_date": string
          "mode"?: Database["public"]["Enums"]["work_mode"]
          "reason"?: string | null
          "status"?: Database["public"]["Enums"]["request_status"]
          "approver_id"?: string | null
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "employee_id"?: string
          "work_date"?: string
          "mode"?: Database["public"]["Enums"]["work_mode"]
          "reason"?: string | null
          "status"?: Database["public"]["Enums"]["request_status"]
          "approver_id"?: string | null
          "decided_at"?: string | null
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
      "work_policies": {
        Row: {
          "id": string
          "name": string
          "start_time": string
          "end_time": string
          "grace_minutes": number
          "half_day_hours": number
          "standard_hours": number
          "work_days": unknown[]
          "allowed_geofences": Json
          "allowed_ip_ranges": unknown[]
          "overtime_multiplier": number
          "auto_clockout_time": string
          "created_at": string
          "updated_at": string
        }
        Insert: {
          "id"?: string
          "name": string
          "start_time"?: string
          "end_time"?: string
          "grace_minutes"?: number
          "half_day_hours"?: number
          "standard_hours"?: number
          "work_days"?: unknown[]
          "allowed_geofences"?: Json
          "allowed_ip_ranges"?: unknown[]
          "overtime_multiplier"?: number
          "auto_clockout_time"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Update: {
          "id"?: string
          "name"?: string
          "start_time"?: string
          "end_time"?: string
          "grace_minutes"?: number
          "half_day_hours"?: number
          "standard_hours"?: number
          "work_days"?: unknown[]
          "allowed_geofences"?: Json
          "allowed_ip_ranges"?: unknown[]
          "overtime_multiplier"?: number
          "auto_clockout_time"?: string
          "created_at"?: string
          "updated_at"?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      "app_role": "super_admin" | "admin" | "hr_manager" | "manager" | "employee"
      "attendance_status": "present" | "absent" | "late" | "half_day" | "holiday" | "leave" | "wfh" | "incomplete"
      "candidate_stage": "applied" | "screening" | "interview" | "offer" | "hired" | "rejected"
      "employment_type": "full_time" | "part_time" | "contract" | "intern"
      "expense_status": "pending" | "approved" | "rejected"
      "job_status": "active" | "paused" | "closed"
      "leave_status": "pending" | "approved" | "rejected" | "cancelled"
      "payroll_status": "draft" | "processing" | "processed" | "paid" | "cancelled"
      "profile_status": "active" | "inactive" | "on_leave" | "pending" | "rejected"
      "request_status": "pending" | "approved" | "rejected" | "cancelled"
      "review_status": "draft" | "self_assessment" | "manager_review" | "completed" | "archived"
      "shift_status": "scheduled" | "completed" | "cancelled"
      "work_mode": "office" | "remote" | "hybrid"
    }
    CompositeTypes: Record<string, never>
  }
}
