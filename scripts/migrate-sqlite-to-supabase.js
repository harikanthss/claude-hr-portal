#!/usr/bin/env node
/*
 * Generate Supabase seed artifacts from the current SQLite database.
 *
 * Outputs:
 * - supabase/generated/seed.sql
 * - supabase/generated/auth-users.import.json
 *
 * This script does not modify SQLite. Auth passwords are not migrated; the
 * auth manifest is intended for an invite/reset-password flow.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.resolve(__dirname, '..');
const sqlitePath = process.env.SQLITE_DB || path.join(root, 'backend', 'data', 'grevya.db');
const outDir = process.env.SUPABASE_GENERATED_DIR || path.join(root, 'supabase', 'generated');
const namespace = process.env.UUID_NAMESPACE || 'grevya-hr-portal';

let Database;
try {
  Database = require(path.join(root, 'backend', 'node_modules', 'better-sqlite3'));
} catch {
  Database = require('better-sqlite3');
}

function uuidFor(key) {
  const hash = crypto.createHash('sha1').update(`${namespace}:${key}`).digest();
  hash[6] = (hash[6] & 0x0f) | 0x50;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

function q(value) {
  if (value === undefined || value === null || value === '') return 'null';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function j(value) {
  return q(JSON.stringify(value || {}));
}

function dateOrNull(value) {
  if (!value) return null;
  return String(value).split('T')[0];
}

function tsForDateTime(date, time) {
  if (!date || !time) return null;
  return `${date}T${String(time).padStart(5, '0')}:00+05:30`;
}

function table(db, name) {
  try {
    return db.prepare(`select * from ${name}`).all();
  } catch {
    return [];
  }
}

function insert(tableName, row, conflict = 'id') {
  const keys = Object.keys(row);
  const values = keys.map(k => q(row[k])).join(', ');
  return `insert into public.${tableName} (${keys.join(', ')}) values (${values}) on conflict (${conflict}) do nothing;`;
}

function upsert(tableName, row, conflict = 'id') {
  const keys = Object.keys(row);
  const values = keys.map(k => q(row[k])).join(', ');
  const updates = keys.filter(k => k !== conflict).map(k => `${k}=excluded.${k}`).join(', ');
  return `insert into public.${tableName} (${keys.join(', ')}) values (${values}) on conflict (${conflict}) do update set ${updates};`;
}

function main() {
  const db = new Database(sqlitePath, { readonly: true });
  const users = table(db, 'users');
  const employees = table(db, 'employees');
  const leaves = table(db, 'leave_requests');
  const attendance = table(db, 'attendance_records');
  const payslips = table(db, 'payslips');
  const reviews = table(db, 'performance_reviews');
  const jobs = table(db, 'jobs');
  const candidates = table(db, 'candidates');
  const expenses = table(db, 'expenses');
  const documents = table(db, 'documents');
  const shifts = table(db, 'shifts');
  const events = table(db, 'calendar_events');
  const notifications = table(db, 'notifications');
  const audit = table(db, 'audit_log');
  const onboarding = table(db, 'onboarding_tasks');
  const budgets = table(db, 'department_budgets');

  const sql = [];
  const warnings = [];

  const employeeById = new Map(employees.map(e => [e.id, e]));
  const userByEmail = new Map(users.map(u => [String(u.email).toLowerCase(), u]));
  const employeeByEmail = new Map(employees.map(e => [String(e.email).toLowerCase(), e]));

  function profileIdForEmployeeId(id) {
    const employee = employeeById.get(id);
    if (!employee) {
      warnings.push(`Missing employee for id ${id}`);
      return uuidFor(`missing-employee:${id}`);
    }
    return uuidFor(`profile:${String(employee.email).toLowerCase()}`);
  }

  function profileIdForUserId(id) {
    const user = users.find(u => u.id === id);
    if (!user) return uuidFor(`missing-user:${id}`);
    return uuidFor(`profile:${String(user.email).toLowerCase()}`);
  }

  function profileIdForName(name) {
    if (!name) return null;
    const employee = employees.find(e => e.name === name);
    if (!employee) {
      warnings.push(`Could not resolve profile by name: ${name}`);
      return null;
    }
    return uuidFor(`profile:${String(employee.email).toLowerCase()}`);
  }

  const departments = [...new Set(employees.map(e => e.department).filter(Boolean).concat(jobs.map(jb => jb.department).filter(Boolean), budgets.map(b => b.department).filter(Boolean)))];
  const departmentId = new Map(departments.map(name => [name, uuidFor(`department:${name.toLowerCase()}`)]));
  departments.forEach(name => {
    sql.push(upsert('departments', { id: departmentId.get(name), name }, 'name'));
  });

  const profileEmails = new Set([...employees.map(e => String(e.email).toLowerCase()), ...users.map(u => String(u.email).toLowerCase())]);
  const authUsers = [...profileEmails].map(email => {
    const employee = employeeByEmail.get(email);
    const user = userByEmail.get(email);
    const fallbackRole = (employee?.position || '').toLowerCase().includes('manager') ? 'manager' : 'employee';
    return {
      id: uuidFor(`profile:${email}`),
      email,
      full_name: employee?.name || user?.name || email,
      role: user?.role || fallbackRole,
      invite: true,
      password_migration: 'not_migrated_use_invite_or_reset_flow'
    };
  });

  authUsers.forEach(authUser => {
    const employee = employeeByEmail.get(authUser.email);
    const user = userByEmail.get(authUser.email);
    const managerId = employee?.managerId ? profileIdForEmployeeId(employee.managerId) : null;
    sql.push(upsert('profiles', {
      id: authUser.id,
      full_name: employee?.name || user?.name || authUser.email,
      email: authUser.email,
      avatar: employee?.avatar || user?.avatar || null,
      phone: employee?.phone || null,
      role: user?.role || authUser.role,
      department_id: employee?.department ? departmentId.get(employee.department) : null,
      manager_id: managerId,
      job_title: employee?.position || null,
      status: employee?.status || 'active',
      employment_type: 'full_time',
      location: employee?.location || null,
      hire_date: dateOrNull(employee?.joinDate),
      salary: employee?.salary ?? null,
      bio: employee?.bio || null,
      performance_score: employee?.performance ?? 80,
      attendance_score: employee?.attendance ?? 95,
      points: employee?.points ?? 0,
      streak: employee?.streak ?? 0
    }, 'id'));
  });

  const leaveTypeId = new Map(['annual','sick','casual','emergency','maternity','paternity','compensatory','unpaid'].map(name => [name, uuidFor(`leave-type:${name}`)]));
  leaveTypeId.forEach((id, name) => sql.push(upsert('leave_types', { id, name }, 'name')));

  leaves.forEach(row => {
    const type = leaveTypeId.get(row.type) || leaveTypeId.get('unpaid');
    sql.push(insert('leave_requests', {
      id: uuidFor(`leave:${row.id}`),
      employee_id: profileIdForEmployeeId(row.employeeId),
      leave_type_id: type,
      from_date: dateOrNull(row.startDate),
      to_date: dateOrNull(row.endDate),
      days: row.days || 1,
      status: row.status || 'pending',
      reason: row.reason || null,
      approver_id: profileIdForName(row.approvedBy),
      comments: row.comments || null,
      decided_at: row.approvedBy ? row.appliedOn : null,
      created_at: row.appliedOn || null
    }));
  });

  const holidayEvents = events.filter(e => e.type === 'holiday');
  holidayEvents.forEach(row => sql.push(insert('holidays', {
    id: uuidFor(`holiday:${row.date}:${row.title}`),
    date: dateOrNull(row.date),
    name: row.title,
    is_optional: false,
    created_at: row.date ? `${row.date}T00:00:00+05:30` : null
  })));

  attendance.forEach(row => {
    const workDate = dateOrNull(row.date);
    const clockIn = tsForDateTime(workDate, row.checkIn);
    const clockOut = tsForDateTime(workDate, row.checkOut);
    sql.push(insert('attendance_records', {
      id: uuidFor(`attendance:${row.id}`),
      employee_id: profileIdForEmployeeId(row.employeeId),
      work_date: workDate,
      clock_in: clockIn,
      clock_out: clockOut,
      status: row.status || 'present',
      work_mode: 'office',
      total_hours: row.hours || 0,
      source: 'sqlite_seed',
      is_incomplete: Boolean(clockIn && !clockOut && row.status !== 'holiday')
    }));
  });

  jobs.forEach(row => {
    sql.push(insert('job_postings', {
      id: uuidFor(`job:${row.id}`),
      title: row.title,
      department_id: row.department ? departmentId.get(row.department) : null,
      location: row.location || null,
      type: row.type || null,
      status: row.status || 'active',
      openings: row.openings || 1,
      posted_by: profileIdForName('Divya Kumar'),
      posted_date: dateOrNull(row.posted)
    }));
  });

  candidates.forEach(row => {
    const match = jobs.find(job => job.title === row.position && (!row.department || job.department === row.department)) || jobs.find(job => job.title === row.position);
    if (!match) warnings.push(`Candidate ${row.name} has no matching job posting for ${row.position}`);
    sql.push(insert('candidates', {
      id: uuidFor(`candidate:${row.id}`),
      job_posting_id: match ? uuidFor(`job:${match.id}`) : null,
      name: row.name,
      email: row.email,
      phone: row.phone || null,
      stage: row.stage || 'applied',
      rating: row.score ?? null,
      notes: row.note || null,
      applied_at: dateOrNull(row.appliedDate)
    }));
  });

  const runByKey = new Map();
  payslips.forEach(row => {
    const key = `${row.month}:${row.year}`;
    if (!runByKey.has(key)) {
      const runId = uuidFor(`payroll-run:${key}`);
      runByKey.set(key, runId);
      sql.push(insert('payroll_runs', {
        id: runId,
        month: row.month,
        year: row.year,
        status: 'processed',
        processed_by: profileIdForName('Divya Kumar'),
        processed_at: row.generatedOn || null
      }));
    }
    sql.push(insert('payroll_records', {
      id: uuidFor(`payroll-record:${row.id}`),
      run_id: runByKey.get(key),
      employee_id: profileIdForEmployeeId(row.employeeId),
      base_salary: row.basicSalary || 0,
      allowances: JSON.stringify({ hra: row.hra || 0, conveyance: row.conveyance || 0, medical: row.medical || 0, bonus: row.bonus || 0 }),
      deductions: JSON.stringify({ pf: row.pf || 0, tax: row.tax || 0 }),
      net_pay: row.netSalary || 0,
      status: 'paid',
      created_at: row.generatedOn || null
    }));
  });

  const cycleByPeriod = new Map();
  reviews.forEach(row => {
    const period = row.period || 'Migrated Reviews';
    if (!cycleByPeriod.has(period)) {
      const cycleId = uuidFor(`review-cycle:${period}`);
      cycleByPeriod.set(period, cycleId);
      sql.push(insert('review_cycles', {
        id: cycleId,
        name: period,
        period,
        type: period.toLowerCase().includes('annual') ? 'annual' : 'quarterly',
        status: 'completed',
        created_by: profileIdForUserId(row.reviewerId),
        created_at: row.createdAt || null
      }));
    }
    sql.push(insert('performance_reviews', {
      id: uuidFor(`performance:${row.id}`),
      cycle_id: cycleByPeriod.get(period),
      employee_id: profileIdForEmployeeId(row.employeeId),
      reviewer_id: profileIdForUserId(row.reviewerId),
      manager_review: JSON.stringify({
        technicalScore: row.technicalScore,
        communicationScore: row.communicationScore,
        leadershipScore: row.leadershipScore,
        deliveryScore: row.deliveryScore,
        innovationScore: row.innovationScore,
        teamworkScore: row.teamworkScore,
        comments: row.comments,
        goals: row.goals
      }),
      rating: row.overallScore,
      status: row.status === 'draft' ? 'draft' : 'completed',
      created_at: row.createdAt || null,
      updated_at: row.updatedAt || null
    }));
  });

  expenses.forEach(row => sql.push(insert('expenses', {
    id: uuidFor(`expense:${row.id}`),
    employee_id: profileIdForEmployeeId(row.employeeId),
    category: row.category,
    amount: row.amount || 0,
    description: row.description || null,
    expense_date: dateOrNull(row.date),
    status: row.status || 'pending',
    receipt_path: row.receipt || null,
    submitted_at: row.submittedOn || null,
    approver_id: profileIdForName(row.approvedBy),
    comments: row.comments || null
  })));

  documents.forEach(row => sql.push(insert('documents', {
    id: uuidFor(`document:${row.id}`),
    employee_id: row.employeeId ? profileIdForEmployeeId(row.employeeId) : null,
    name: row.name,
    mime_type: row.type || null,
    category: row.category || 'general',
    storage_path: row.filePath,
    file_size: row.fileSize || 0,
    uploaded_by: profileIdForName(row.uploadedBy),
    uploaded_at: row.uploadedAt || null,
    description: row.description || null
  })));

  shifts.forEach(row => sql.push(insert('shifts', {
    id: uuidFor(`shift:${row.id}`),
    employee_id: profileIdForEmployeeId(row.employeeId),
    shift_date: dateOrNull(row.date),
    shift_type: row.shiftType || 'general',
    start_time: row.startTime || null,
    end_time: row.endTime || null,
    status: row.status || 'scheduled',
    notes: row.notes || null,
    created_by: profileIdForUserId(row.createdBy)
  })));

  events.filter(e => e.type !== 'holiday').forEach(row => sql.push(insert('calendar_events', {
    id: uuidFor(`event:${row.id}`),
    title: row.title,
    start_date: dateOrNull(row.date),
    end_date: dateOrNull(row.endDate),
    type: row.type || 'meeting',
    color: row.color || '#3b82f6',
    description: row.description || null,
    created_by: profileIdForUserId(row.createdBy)
  })));

  notifications.forEach(row => sql.push(insert('notifications', {
    id: uuidFor(`notification:${row.id}`),
    user_id: row.userId ? profileIdForEmployeeId(row.userId) : null,
    title: row.title,
    message: row.message,
    type: row.type || 'info',
    is_read: Boolean(row.isRead),
    created_at: row.time || null
  })));

  audit.forEach(row => sql.push(insert('audit_log', {
    id: uuidFor(`audit:${row.id}`),
    actor_id: row.userId ? profileIdForUserId(row.userId) : null,
    action: row.action,
    entity: row.resource,
    entity_id: row.resourceId && /^[0-9a-f-]{36}$/i.test(row.resourceId) ? row.resourceId : null,
    diff: JSON.stringify({ details: row.details, legacyResourceId: row.resourceId }),
    ip_address: row.ipAddress || null,
    at: row.timestamp || null
  })));

  onboarding.forEach(row => {
    if (!employeeById.has(row.employeeId)) warnings.push(`Onboarding task ${row.id} references missing employee ${row.employeeId}`);
    sql.push(insert('onboarding_tasks', {
      id: uuidFor(`onboarding:${row.id}`),
      employee_id: employeeById.has(row.employeeId) ? profileIdForEmployeeId(row.employeeId) : null,
      task_label: row.taskLabel,
      due_day: row.taskDueDay || 0,
      notes: row.taskNotes || null,
      done: Boolean(row.done),
      start_date: dateOrNull(row.startDate)
    }));
  });

  budgets.forEach(row => {
    const depId = row.department ? departmentId.get(row.department) : null;
    if (!depId) warnings.push(`Budget ${row.id} references missing department ${row.department}`);
    sql.push(insert('department_budgets', {
      id: uuidFor(`budget:${row.id}`),
      department_id: depId,
      month: row.month,
      year: row.year,
      budget_amount: row.budgetAmount || 0,
      spent_amount: row.spentAmount || 0,
      created_by: profileIdForName(row.createdBy),
      updated_at: row.updatedAt || null
    }));
  });

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'auth-users.import.json'), JSON.stringify(authUsers, null, 2));
  fs.writeFileSync(path.join(outDir, 'seed.sql'), [
    '-- Generated by scripts/migrate-sqlite-to-supabase.js',
    '-- Run auth-users.import.json invite/reset-password flow before applying profile inserts.',
    'begin;',
    ...sql,
    'commit;'
  ].join('\n'));
  fs.writeFileSync(path.join(outDir, 'migration-warnings.txt'), warnings.join('\n'));

  console.log(`Generated ${path.join(outDir, 'seed.sql')}`);
  console.log(`Generated ${path.join(outDir, 'auth-users.import.json')}`);
  console.log(`Warnings: ${warnings.length}`);
}

main();
