-- ============================================================================
-- Seed Data — Grevya HR Portal
-- Run via: supabase db seed or manually in SQL editor
--
-- IMPORTANT: The auth.users entries below must be created via
-- Supabase Dashboard or supabase auth admin createUser API.
-- The UUIDs below are deterministic so that profiles FK references work.
-- ============================================================================

-- ── Deterministic UUIDs for demo users ──────────────────────────────────────
-- admin@grevya.com   → 00000000-0000-0000-0000-000000000001
-- hr@grevya.com      → 00000000-0000-0000-0000-000000000002
-- manager@grevya.com → 00000000-0000-0000-0000-000000000003
-- emp@grevya.com     → 00000000-0000-0000-0000-000000000004
-- (additional employees → 00000000-0000-0000-0000-00000000000X)

-- ── Departments ─────────────────────────────────────────────────────────────
insert into public.departments (id, name) values
  ('d0000000-0000-0000-0000-000000000001', 'Engineering'),
  ('d0000000-0000-0000-0000-000000000002', 'HR'),
  ('d0000000-0000-0000-0000-000000000003', 'Marketing'),
  ('d0000000-0000-0000-0000-000000000004', 'Finance'),
  ('d0000000-0000-0000-0000-000000000005', 'Sales'),
  ('d0000000-0000-0000-0000-000000000006', 'Operations')
on conflict do nothing;

-- ── Profiles (linked to auth.users) ─────────────────────────────────────────
-- NOTE: You must create these users in Supabase Auth first with matching UUIDs.
-- Use the Supabase dashboard or the admin API:
--   supabase.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name, role } })

insert into public.profiles (id, full_name, email, role, department_id, job_title, status, hire_date, salary, phone, location, avatar_url) values
  -- Admin
  ('00000000-0000-0000-0000-000000000001', 'Rajesh Sharma', 'admin@grevya.com', 'admin',
   'd0000000-0000-0000-0000-000000000001', 'CTO', 'active', '2022-01-15', 250000, '+91 98765 43210', 'Bangalore', null),

  -- HR Manager
  ('00000000-0000-0000-0000-000000000002', 'Divya Kumar', 'hr@grevya.com', 'hr_manager',
   'd0000000-0000-0000-0000-000000000002', 'HR Manager', 'active', '2022-03-01', 120000, '+91 98765 43211', 'Bangalore', null),

  -- Manager (Engineering)
  ('00000000-0000-0000-0000-000000000003', 'Arjun Patel', 'manager@grevya.com', 'manager',
   'd0000000-0000-0000-0000-000000000001', 'Engineering Manager', 'active', '2022-06-15', 180000, '+91 98765 43212', 'Bangalore', null),

  -- Employee (reports to Arjun)
  ('00000000-0000-0000-0000-000000000004', 'Priya Singh', 'emp@grevya.com', 'employee',
   'd0000000-0000-0000-0000-000000000001', 'Senior Developer', 'active', '2023-01-10', 95000, '+91 98765 43213', 'Bangalore', null),

  -- Additional employees
  ('00000000-0000-0000-0000-000000000005', 'Amit Verma', 'amit@grevya.com', 'employee',
   'd0000000-0000-0000-0000-000000000001', 'Full Stack Developer', 'active', '2023-03-20', 85000, '+91 98765 43214', 'Hyderabad', null),

  ('00000000-0000-0000-0000-000000000006', 'Sneha Reddy', 'sneha@grevya.com', 'employee',
   'd0000000-0000-0000-0000-000000000003', 'Marketing Lead', 'active', '2022-09-01', 90000, '+91 98765 43215', 'Mumbai', null),

  ('00000000-0000-0000-0000-000000000007', 'Vikram Desai', 'vikram@grevya.com', 'manager',
   'd0000000-0000-0000-0000-000000000004', 'Finance Manager', 'active', '2022-04-10', 160000, '+91 98765 43216', 'Bangalore', null),

  ('00000000-0000-0000-0000-000000000008', 'Neha Gupta', 'neha@grevya.com', 'employee',
   'd0000000-0000-0000-0000-000000000004', 'Accountant', 'active', '2023-06-01', 65000, '+91 98765 43217', 'Bangalore', null),

  ('00000000-0000-0000-0000-000000000009', 'Karthik Nair', 'karthik@grevya.com', 'employee',
   'd0000000-0000-0000-0000-000000000005', 'Sales Executive', 'active', '2023-08-15', 60000, '+91 98765 43218', 'Chennai', null),

  ('00000000-0000-0000-0000-000000000010', 'Meera Joshi', 'meera@grevya.com', 'employee',
   'd0000000-0000-0000-0000-000000000002', 'HR Executive', 'active', '2023-04-01', 55000, '+91 98765 43219', 'Bangalore', null),

  ('00000000-0000-0000-0000-000000000011', 'Rohit Menon', 'rohit@grevya.com', 'employee',
   'd0000000-0000-0000-0000-000000000001', 'DevOps Engineer', 'active', '2023-07-10', 88000, '+91 98765 43220', 'Pune', null),

  ('00000000-0000-0000-0000-000000000012', 'Ananya Das', 'ananya@grevya.com', 'employee',
   'd0000000-0000-0000-0000-000000000006', 'Operations Analyst', 'active', '2024-01-05', 58000, '+91 98765 43221', 'Bangalore', null)

on conflict (id) do nothing;

-- ── Set manager relationships ───────────────────────────────────────────────
update public.profiles set manager_id = '00000000-0000-0000-0000-000000000003'
  where id in (
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000005',
    '00000000-0000-0000-0000-000000000011'
  );

update public.profiles set manager_id = '00000000-0000-0000-0000-000000000002'
  where id in (
    '00000000-0000-0000-0000-000000000006',
    '00000000-0000-0000-0000-000000000010'
  );

update public.profiles set manager_id = '00000000-0000-0000-0000-000000000007'
  where id in (
    '00000000-0000-0000-0000-000000000008',
    '00000000-0000-0000-0000-000000000009'
  );

update public.profiles set manager_id = '00000000-0000-0000-0000-000000000001'
  where id in (
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000007',
    '00000000-0000-0000-0000-000000000012'
  );

-- Set department heads
update public.departments set head_id = '00000000-0000-0000-0000-000000000003' where name = 'Engineering';
update public.departments set head_id = '00000000-0000-0000-0000-000000000002' where name = 'HR';
update public.departments set head_id = '00000000-0000-0000-0000-000000000007' where name = 'Finance';

-- ── Leave types ─────────────────────────────────────────────────────────────
insert into public.leave_types (id, name, annual_quota, carry_forward, paid, description) values
  ('lt000000-0000-0000-0000-000000000001', 'Annual Leave', 21, true, true, 'Paid annual/vacation leave'),
  ('lt000000-0000-0000-0000-000000000002', 'Sick Leave', 12, false, true, 'Paid sick leave with medical certificate'),
  ('lt000000-0000-0000-0000-000000000003', 'Casual Leave', 7, false, true, 'Short notice personal leave'),
  ('lt000000-0000-0000-0000-000000000004', 'Unpaid Leave', 0, false, false, 'Leave without pay'),
  ('lt000000-0000-0000-0000-000000000005', 'Maternity Leave', 182, false, true, '26 weeks maternity leave'),
  ('lt000000-0000-0000-0000-000000000006', 'Paternity Leave', 15, false, true, 'Paternity leave')
on conflict do nothing;

-- ── Leave balances (2026) ───────────────────────────────────────────────────
insert into public.leave_balances (employee_id, leave_type_id, year, total, used) values
  -- Priya Singh
  ('00000000-0000-0000-0000-000000000004', 'lt000000-0000-0000-0000-000000000001', 2026, 21, 5),
  ('00000000-0000-0000-0000-000000000004', 'lt000000-0000-0000-0000-000000000002', 2026, 12, 2),
  ('00000000-0000-0000-0000-000000000004', 'lt000000-0000-0000-0000-000000000003', 2026, 7, 1),
  -- Amit Verma
  ('00000000-0000-0000-0000-000000000005', 'lt000000-0000-0000-0000-000000000001', 2026, 21, 3),
  ('00000000-0000-0000-0000-000000000005', 'lt000000-0000-0000-0000-000000000002', 2026, 12, 0),
  ('00000000-0000-0000-0000-000000000005', 'lt000000-0000-0000-0000-000000000003', 2026, 7, 2),
  -- Arjun Patel (manager)
  ('00000000-0000-0000-0000-000000000003', 'lt000000-0000-0000-0000-000000000001', 2026, 21, 4),
  ('00000000-0000-0000-0000-000000000003', 'lt000000-0000-0000-0000-000000000002', 2026, 12, 1),
  ('00000000-0000-0000-0000-000000000003', 'lt000000-0000-0000-0000-000000000003', 2026, 7, 0),
  -- Divya Kumar (HR)
  ('00000000-0000-0000-0000-000000000002', 'lt000000-0000-0000-0000-000000000001', 2026, 21, 6),
  ('00000000-0000-0000-0000-000000000002', 'lt000000-0000-0000-0000-000000000002', 2026, 12, 3),
  ('00000000-0000-0000-0000-000000000002', 'lt000000-0000-0000-0000-000000000003', 2026, 7, 1)
on conflict do nothing;

-- ── Leave requests ──────────────────────────────────────────────────────────
insert into public.leave_requests (employee_id, leave_type_id, from_date, to_date, days, reason, status, approver_id) values
  ('00000000-0000-0000-0000-000000000004', 'lt000000-0000-0000-0000-000000000001', '2026-06-10', '2026-06-12', 3, 'Family vacation', 'pending', null),
  ('00000000-0000-0000-0000-000000000005', 'lt000000-0000-0000-0000-000000000002', '2026-06-05', '2026-06-06', 2, 'Not feeling well', 'approved', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000004', 'lt000000-0000-0000-0000-000000000003', '2026-05-20', '2026-05-20', 1, 'Personal errand', 'approved', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000006', 'lt000000-0000-0000-0000-000000000001', '2026-06-15', '2026-06-18', 4, 'Travel plans', 'pending', null),
  ('00000000-0000-0000-0000-000000000008', 'lt000000-0000-0000-0000-000000000002', '2026-06-03', '2026-06-03', 1, 'Doctor appointment', 'rejected', '00000000-0000-0000-0000-000000000007')
on conflict do nothing;

-- ── Work policies ───────────────────────────────────────────────────────────
insert into public.work_policies (name, start_time, end_time, grace_minutes, half_day_hours, standard_hours, work_days, overtime_multiplier, auto_clockout_time, allowed_geofences) values
  ('Default Office Policy', '09:00', '18:00', 15, 4.0, 8.0, '{1,2,3,4,5}', 1.5, '23:59',
   '[{"lat": 12.9716, "lng": 77.5946, "radius_meters": 500, "label": "Bangalore Office"}]')
on conflict do nothing;

-- ── Holidays (2026) ─────────────────────────────────────────────────────────
insert into public.holidays (date, name, is_optional) values
  ('2026-01-01', 'New Year''s Day', false),
  ('2026-01-26', 'Republic Day', false),
  ('2026-03-14', 'Holi', false),
  ('2026-04-03', 'Good Friday', false),
  ('2026-05-01', 'May Day', false),
  ('2026-08-15', 'Independence Day', false),
  ('2026-10-02', 'Gandhi Jayanti', false),
  ('2026-10-20', 'Dussehra', false),
  ('2026-11-10', 'Diwali', false),
  ('2026-12-25', 'Christmas', false)
on conflict do nothing;

-- ── Job postings ────────────────────────────────────────────────────────────
insert into public.job_postings (title, department_id, location, type, status, description, posted_by) values
  ('Senior Frontend Developer', 'd0000000-0000-0000-0000-000000000001', 'Bangalore', 'full_time', 'active',
   'Looking for an experienced React developer to join our engineering team.', '00000000-0000-0000-0000-000000000003'),
  ('HR Coordinator', 'd0000000-0000-0000-0000-000000000002', 'Bangalore', 'full_time', 'active',
   'Support HR operations including onboarding, compliance, and employee engagement.', '00000000-0000-0000-0000-000000000002'),
  ('Marketing Intern', 'd0000000-0000-0000-0000-000000000003', 'Remote', 'intern', 'active',
   'Summer internship for marketing students.', '00000000-0000-0000-0000-000000000002'),
  ('DevOps Engineer', 'd0000000-0000-0000-0000-000000000001', 'Pune', 'full_time', 'active',
   'Cloud infrastructure and CI/CD pipelines.', '00000000-0000-0000-0000-000000000003'),
  ('Sales Manager', 'd0000000-0000-0000-0000-000000000005', 'Mumbai', 'full_time', 'draft',
   'Lead our growing sales team.', '00000000-0000-0000-0000-000000000001')
on conflict do nothing;

-- ── Candidates ──────────────────────────────────────────────────────────────
-- Use a subquery for job_posting_id since we don't have deterministic IDs
insert into public.candidates (job_posting_id, name, email, source, stage, rating, notes)
select jp.id, c.name, c.email, c.source, c.stage, c.rating, c.notes
from (values
  ('Senior Frontend Developer', 'Rahul Mehra', 'rahul.m@gmail.com', 'linkedin', 'interview', 4, 'Strong React portfolio'),
  ('Senior Frontend Developer', 'Kavya Iyer', 'kavya.i@gmail.com', 'referral', 'screening', 3, 'Referred by Priya'),
  ('HR Coordinator', 'Deepa Krishnan', 'deepa.k@gmail.com', 'naukri', 'offer', 5, 'Excellent HR background'),
  ('DevOps Engineer', 'Sanjay Rao', 'sanjay.r@gmail.com', 'indeed', 'applied', 0, 'AWS certified'),
  ('Marketing Intern', 'Anitha Bhat', 'anitha.b@gmail.com', 'direct', 'interview', 3, 'MBA student')
) as c(job_title, name, email, source, stage, rating, notes)
join public.job_postings jp on jp.title = c.job_title;

-- ── Announcements ───────────────────────────────────────────────────────────
insert into public.announcements (title, body, category, pinned, posted_by) values
  ('Welcome to Grevya HR Portal! 🎉', 'We are excited to launch our new HR management system. Please explore all the features and let us know your feedback.', 'general', true, '00000000-0000-0000-0000-000000000001'),
  ('Updated Leave Policy', 'Starting Q3 2026, unused annual leave can be carried forward up to 5 days. Please review the full policy in Settings.', 'policy', false, '00000000-0000-0000-0000-000000000002'),
  ('Company Outing — July 2026', 'Mark your calendars! Our annual team outing is scheduled for July 18-19 at Coorg. Details will follow.', 'event', true, '00000000-0000-0000-0000-000000000002'),
  ('Q2 Performance Reviews Due', 'All managers: please complete your team''s Q2 performance reviews by June 30th.', 'urgent', false, '00000000-0000-0000-0000-000000000002')
on conflict do nothing;

-- ── Review cycles ───────────────────────────────────────────────────────────
insert into public.review_cycles (id, name, period, type, status, due_date, created_by) values
  ('rc000000-0000-0000-0000-000000000001', 'Q2 2026 Performance Review', 'Q2 2026', 'quarterly', 'active', '2026-06-30', '00000000-0000-0000-0000-000000000002'),
  ('rc000000-0000-0000-0000-000000000002', 'H1 2026 Mid-Year Review', 'H1 2026', 'half_yearly', 'draft', '2026-07-15', '00000000-0000-0000-0000-000000000002')
on conflict do nothing;

-- ── Performance reviews ─────────────────────────────────────────────────────
insert into public.performance_reviews (cycle_id, employee_id, reviewer_id, status, self_assessment, manager_review, rating) values
  ('rc000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000003', 'self_review',
   '{"goals": "Deliver 3 major features", "achievements": "Shipped auth module and dashboard", "areas_of_improvement": "Better test coverage"}',
   '{}', null),
  ('rc000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000003', 'completed',
   '{"goals": "API performance optimization", "achievements": "Reduced response time by 40%", "areas_of_improvement": "Documentation"}',
   '{"technical": 4.5, "communication": 4, "leadership": 3.5, "delivery": 5, "overall": 4.2, "comments": "Excellent technical contributor"}',
   4.2),
  ('rc000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'pending',
   '{}', '{}', null)
on conflict do nothing;

-- ── Payroll run + records (May 2026 — completed) ────────────────────────────
insert into public.payroll_runs (id, month, status, processed_by, processed_at) values
  ('pr000000-0000-0000-0000-000000000001', '2026-05', 'completed', '00000000-0000-0000-0000-000000000002', '2026-05-28T10:00:00Z')
on conflict do nothing;

insert into public.payroll_records (run_id, employee_id, base_salary, hra, conveyance, medical, bonus, pf_deduction, tax_deduction, net_pay, status) values
  ('pr000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 250000, 100000, 3200, 1250, 0, 21600, 45000, 287850, 'paid'),
  ('pr000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 120000, 48000, 3200, 1250, 0, 10800, 18000, 143650, 'paid'),
  ('pr000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 180000, 72000, 3200, 1250, 0, 16200, 30000, 210250, 'paid'),
  ('pr000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000004', 95000, 38000, 3200, 1250, 0, 8550, 12000, 116900, 'paid'),
  ('pr000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000005', 85000, 34000, 3200, 1250, 0, 7650, 10000, 105800, 'paid')
on conflict do nothing;

-- ── Audit log seed ──────────────────────────────────────────────────────────
insert into public.audit_log (actor_id, action, entity, entity_id, diff) values
  ('00000000-0000-0000-0000-000000000001', 'create', 'system', null, '{"detail": "System initialized"}'),
  ('00000000-0000-0000-0000-000000000002', 'create', 'profile', '00000000-0000-0000-0000-000000000004', '{"detail": "Created employee Priya Singh"}')
on conflict do nothing;
