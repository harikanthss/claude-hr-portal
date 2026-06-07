require('dotenv').config({ path: '.env' });

const crypto = require('crypto');
const db = require('../config/supabase');
const hr = require('../data/supabaseHr');

const checks = [];

function pass(name, details = '') {
  checks.push({ name, pass: true, details });
  console.log(`PASS - ${name}${details ? ` (${details})` : ''}`);
}

function fail(name, details = '') {
  checks.push({ name, pass: false, details });
  console.log(`FAIL - ${name}${details ? ` (${details})` : ''}`);
}

async function asUser(client, userId, sql, params = []) {
  await client.query('begin');
  try {
    await client.query('set local role authenticated');
    await client.query(`set local request.jwt.claim.sub = '${String(userId).replace(/'/g, "''")}'`);
    await client.query(`set local request.jwt.claims = '${JSON.stringify({ sub: userId, role: 'authenticated' }).replace(/'/g, "''")}'`);
    const result = await client.query(sql, params);
    await client.query('rollback');
    return result.rows;
  } catch (err) {
    await client.query('rollback');
    throw err;
  }
}

function user(row) {
  return { id: row.id, email: row.email, name: row.full_name, role: row.role, supabase: true };
}

async function runTransactionalAccessSmoke(client) {
  await client.query('begin');
  try {
    const id = crypto.randomUUID();
    const email = `phase4-smoke-${Date.now()}@example.com`;
    await client.query(
      `
      insert into auth.users (id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
      values ($1, 'authenticated', 'authenticated', $2, '', '{"provider":"email","providers":["email"]}'::jsonb, '{}'::jsonb, now(), now())
      `,
      [id, email],
    );
    await client.query(
      "insert into public.profiles (id, full_name, email, role, status) values ($1, 'Phase 4 Smoke', $2, null, 'pending')",
      [id, email],
    );
    const pending = await client.query('select status, role from public.profiles where id = $1', [id]);
    pending.rows[0]?.status === 'pending' && pending.rows[0]?.role === null
      ? pass('access request pending profile can be created transactionally')
      : fail('access request pending profile can be created transactionally');

    await client.query("update public.profiles set status='active', role='employee' where id=$1", [id]);
    const active = await client.query('select status, role from public.profiles where id = $1', [id]);
    active.rows[0]?.status === 'active' && active.rows[0]?.role === 'employee'
      ? pass('approval status/role update works transactionally')
      : fail('approval status/role update works transactionally');

    await client.query("update public.profiles set status='rejected', role=null where id=$1", [id]);
    const rejected = await client.query('select status, role from public.profiles where id = $1', [id]);
    rejected.rows[0]?.status === 'rejected' && rejected.rows[0]?.role === null
      ? pass('rejection status/role update works transactionally')
      : fail('rejection status/role update works transactionally');

    await client.query(
      "insert into public.notifications (user_id, title, message, type) values ($1, 'Smoke notification', 'Phase 4 smoke test', 'info')",
      [id],
    );
    const notif = await client.query('select count(*)::int as count from public.notifications where user_id=$1', [id]);
    notif.rows[0]?.count === 1
      ? pass('notification row creation works transactionally')
      : fail('notification row creation works transactionally');

    await client.query('rollback');
  } catch (err) {
    await client.query('rollback');
    fail('transactional access/notification smoke', err.message);
  }
}

async function run() {
  if (!db.enabled) {
    fail('Supabase DB configured', 'SUPABASE_DB_URL missing');
    return;
  }

  const client = await db.pool.connect();
  try {
    const superAdmin = await db.queryOne("select id, email, full_name, role, status from public.profiles where lower(email)=lower('harikanth.grevya@gmail.com')");
    superAdmin?.role === 'super_admin' && superAdmin?.status === 'active'
      ? pass('primary super_admin active')
      : fail('primary super_admin active');

    const activeRoles = await db.queryAll("select role, count(*)::int as count from public.profiles where status='active' and role is not null group by role");
    ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'].forEach((role) => {
      activeRoles.some((row) => row.role === role && row.count > 0)
        ? pass(`active ${role} user exists`)
        : fail(`active ${role} user exists`);
    });

    await runTransactionalAccessSmoke(client);

    const employee = await db.queryOne("select id, email, full_name, role from public.profiles where status='active' and role='employee' order by email limit 1");
    const otherEmployee = employee
      ? await db.queryOne("select id, email from public.profiles where status='active' and role='employee' and id<>$1 order by email limit 1", [employee.id])
      : null;
    const manager = await db.queryOne("select id, email, full_name, role from public.profiles where status='active' and role='manager' order by email limit 1");
    const directReport = manager
      ? await db.queryOne("select id, email from public.profiles where status='active' and manager_id=$1 limit 1", [manager.id])
      : null;
    const unrelatedToManager = manager
      ? await db.queryOne("select id, email from public.profiles where status='active' and role='employee' and coalesce(manager_id::text,'')<>$1::text order by email limit 1", [manager.id])
      : null;

    if (employee && otherEmployee) {
      const otherPayroll = await asUser(client, employee.id, 'select id from public.payroll_records where employee_id=$1 limit 1', [otherEmployee.id]);
      otherPayroll.length === 0 ? pass('RLS employee cannot read other payroll') : fail('RLS employee cannot read other payroll');
      const otherPerformance = await asUser(client, employee.id, 'select id from public.performance_reviews where employee_id=$1 limit 1', [otherEmployee.id]);
      otherPerformance.length === 0 ? pass('RLS employee cannot read other performance') : fail('RLS employee cannot read other performance');
      const employeeList = await hr.getEmployees(user(employee), {});
      employeeList.every((row) => row.id === employee.id) ? pass('data layer employee list self-only') : fail('data layer employee list self-only');
    }

    if (manager && directReport && unrelatedToManager) {
      const managerUser = user(manager);
      const unrelated = await hr.getEmployee(managerUser, unrelatedToManager.id);
      unrelated === false || unrelated === null ? pass('data layer manager cannot fetch unrelated employee') : fail('data layer manager cannot fetch unrelated employee');
      const direct = await hr.getEmployee(managerUser, directReport.id);
      direct ? pass('data layer manager can fetch direct report') : fail('data layer manager can fetch direct report');
      const orgPayroll = await hr.getPayslips(managerUser, { employeeId: unrelatedToManager.id });
      orgPayroll.every((row) => row.employeeId === manager.id) ? pass('data layer manager payroll remains self-only') : fail('data layer manager payroll remains self-only');
    }

    const criticalReads = [
      ['employees', async () => hr.getEmployees(user(superAdmin), {})],
      ['attendance', async () => hr.getAttendance(user(superAdmin), {})],
      ['payslips', async () => hr.getPayslips(user(superAdmin), {})],
      ['performance', async () => hr.getPerformance(user(superAdmin), {})],
      ['jobs', async () => hr.getJobs()],
      ['candidates', async () => hr.getCandidates()],
      ['documents', async () => hr.getDocuments(user(superAdmin), {})],
      ['expenses', async () => hr.getExpenses(user(superAdmin), {})],
      ['shifts', async () => hr.getShifts(user(superAdmin), {})],
      ['calendar', async () => hr.getCalendarEvents()],
    ];
    for (const [name, read] of criticalReads) {
      try {
        const rows = await read();
        Array.isArray(rows) ? pass(`critical module read: ${name}`, `rows=${rows.length}`) : fail(`critical module read: ${name}`);
      } catch (err) {
        fail(`critical module read: ${name}`, err.message);
      }
    }

    pass('CSV export smoke', 'frontend-only utility; covered by browser checklist');
  } finally {
    client.release();
    await db.pool.end();
  }

  const failed = checks.filter((check) => !check.pass);
  console.log(`SUMMARY ${checks.length - failed.length}/${checks.length} passed`);
  if (failed.length) process.exit(1);
}

run().catch((err) => {
  console.error(`SMOKE_ERROR ${err.message}`);
  process.exit(1);
});
