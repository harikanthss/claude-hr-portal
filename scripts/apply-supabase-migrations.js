#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const { Client } = require(path.join(rootDir, 'backend', 'node_modules', 'pg'));

const migrationFiles = [
  'supabase/migrations/001_initial_schema.sql',
  'supabase/migrations/002_rls_policies.sql',
  'supabase/generated/seed.sql',
];

const expectedTables = [
  'departments',
  'profiles',
  'job_roles',
  'leave_types',
  'leave_balances',
  'leave_requests',
  'work_policies',
  'holidays',
  'attendance_records',
  'attendance_regularizations',
  'work_mode_requests',
  'job_postings',
  'candidates',
  'payroll_runs',
  'payroll_records',
  'review_cycles',
  'performance_reviews',
  'expenses',
  'documents',
  'shifts',
  'calendar_events',
  'notifications',
  'notification_prefs',
  'audit_log',
  'onboarding_tasks',
  'department_budgets',
  'announcements',
];

const expectedFunctions = ['set_updated_at', 'auth_role', 'is_manager_of', 'is_admin_or_hr'];
const reportPath = path.join(rootDir, 'supabase', 'generated', 'migration-validation-report.md');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const text = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const separator = line.indexOf('=');
    if (separator === -1) continue;

    const key = line.slice(0, separator).trim();
    const value = line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function getConnectionString() {
  loadEnvFile(path.join(rootDir, '.env'));
  loadEnvFile(path.join(rootDir, 'backend', '.env'));

  return process.env.SUPABASE_DB_URL || process.env.DATABASE_URL || '';
}

function shouldUseSsl(connectionString) {
  if (process.env.PGSSLMODE === 'disable') return false;
  return /supabase\.(co|com)|pooler\.supabase\.com/i.test(connectionString);
}

function formatStatus(ok) {
  return ok ? 'PASS' : 'FAIL';
}

function escapeLiteral(value) {
  return String(value).replace(/'/g, "''");
}

async function applySqlFile(client, file) {
  const absolutePath = path.join(rootDir, file);
  const sql = fs.readFileSync(absolutePath, 'utf8');
  await client.query(sql);
}

async function fetchValidation(client) {
  const tables = await client.query(
    `
    select c.relname as name, c.relrowsecurity as rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname = any($1::text[])
    order by c.relname
    `,
    [expectedTables],
  );

  const policies = await client.query(
    `
    select schemaname, tablename, policyname, cmd
    from pg_policies
    where schemaname = 'public'
    order by tablename, policyname
    `,
  );

  const functions = await client.query(
    `
    select p.proname as name
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = any($1::text[])
    order by p.proname
    `,
    [expectedFunctions],
  );

  const foreignKeys = await client.query(
    `
    select conrelid::regclass::text as table_name, conname
    from pg_constraint
    where contype = 'f'
      and connamespace = 'public'::regnamespace
    order by table_name, conname
    `,
  );

  const indexes = await client.query(
    `
    select tablename, indexname
    from pg_indexes
    where schemaname = 'public'
      and indexname like 'idx_%'
    order by tablename, indexname
    `,
  );

  const triggers = await client.query(
    `
    select event_object_table as table_name, trigger_name
    from information_schema.triggers
    where trigger_schema = 'public'
      and trigger_name like 'set_%_updated_at'
    order by event_object_table, trigger_name
    `,
  );

  const rowCounts = {};
  for (const table of expectedTables) {
    const result = await client.query(`select count(*)::int as count from public.${table}`);
    rowCounts[table] = result.rows[0].count;
  }

  return {
    tables: tables.rows,
    policies: policies.rows,
    functions: functions.rows,
    foreignKeys: foreignKeys.rows,
    indexes: indexes.rows,
    triggers: triggers.rows,
    rowCounts,
  };
}

async function runRlsProbe(client, validation) {
  const rows = await client.query(
    `
    select
      id,
      email,
      role::text as role,
      manager_id
    from public.profiles
    where email in ('admin@grevya.com', 'hr@grevya.com', 'manager@grevya.com', 'employee@grevya.com', 'vikram@grevya.com')
    order by email
    `,
  );

  const profiles = Object.fromEntries(rows.rows.map((row) => [row.email, row]));
  const employee = profiles['employee@grevya.com'];
  const peer = profiles['vikram@grevya.com'];
  const manager = profiles['manager@grevya.com'];
  const hr = profiles['hr@grevya.com'];
  const admin = profiles['admin@grevya.com'];

  if (!employee || !peer || !manager || !hr || !admin) {
    return {
      status: 'SKIPPED',
      reason: 'Required seed profiles are not present. Create auth.users and run seed.sql first.',
      checks: [],
    };
  }

  const checks = [];

  async function asUser(profile, name, query, expected) {
    await client.query('begin');
    try {
      await client.query('set local role authenticated');
      await client.query(`set local request.jwt.claim.sub = '${escapeLiteral(profile.id)}'`);
      await client.query(`set local request.jwt.claim.role = 'authenticated'`);
      const result = await client.query(query);
      checks.push({ name, actual: result.rows[0].count, expected });
    } finally {
      await client.query('rollback');
    }
  }

  await asUser(
    employee,
    'Employee cannot read peer payroll',
    `select count(*)::int as count from public.payroll_records where employee_id = '${peer.id}'`,
    0,
  );
  await asUser(
    manager,
    'Manager cannot read non-self payroll',
    `select count(*)::int as count from public.payroll_records where employee_id <> '${manager.id}'`,
    0,
  );
  await asUser(
    manager,
    'Manager can read direct reports',
    `select count(*)::int as count from public.profiles where manager_id = '${manager.id}'`,
    '> 0',
  );
  await asUser(
    employee,
    'Employee leave scoped to self',
    `select count(*)::int as count from public.leave_requests where employee_id <> '${employee.id}'`,
    0,
  );
  await asUser(
    employee,
    'Employee attendance scoped to self',
    `select count(*)::int as count from public.attendance_records where employee_id <> '${employee.id}'`,
    0,
  );
  await asUser(
    employee,
    'Employee performance scoped to self',
    `select count(*)::int as count from public.performance_reviews where employee_id <> '${employee.id}'`,
    0,
  );
  await asUser(
    hr,
    'HR can read payroll records',
    'select count(*)::int as count from public.payroll_records',
    '> 0',
  );
  await asUser(
    admin,
    'Admin can read profiles',
    'select count(*)::int as count from public.profiles',
    '> 0',
  );

  return { status: 'COMPLETED', checks };
}

function writeReport({ applied, errors, validation, rlsProbe }) {
  const tableNames = new Set(validation.tables.map((row) => row.name));
  const functionNames = new Set(validation.functions.map((row) => row.name));
  const rlsMap = new Map(validation.tables.map((row) => [row.name, row.rls_enabled]));

  const missingTables = expectedTables.filter((table) => !tableNames.has(table));
  const missingFunctions = expectedFunctions.filter((name) => !functionNames.has(name));
  const tablesWithoutRls = expectedTables.filter((table) => tableNames.has(table) && !rlsMap.get(table));

  const lines = [
    '# Supabase Migration Validation Report',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Migration Files',
    ...migrationFiles.map((file) => `- ${applied.includes(file) ? 'PASS' : 'PENDING'} ${file}`),
    '',
    '## SQL Errors',
    ...(errors.length ? errors.map((error) => `- ${error.file}: ${error.message}`) : ['- PASS No SQL errors recorded by this runner.']),
    '',
    '## Schema Validation',
    `- ${formatStatus(missingTables.length === 0)} Tables present: ${validation.tables.length}/${expectedTables.length}`,
    `- ${formatStatus(missingFunctions.length === 0)} Helper functions present: ${validation.functions.length}/${expectedFunctions.length}`,
    `- ${formatStatus(tablesWithoutRls.length === 0)} RLS enabled on expected tables: ${expectedTables.length - tablesWithoutRls.length}/${expectedTables.length}`,
    `- Foreign keys found: ${validation.foreignKeys.length}`,
    `- Indexes found: ${validation.indexes.length}`,
    `- Updated-at triggers found: ${validation.triggers.length}`,
    `- RLS policies found: ${validation.policies.length}`,
    '',
    '## Missing Objects',
    `- Missing tables: ${missingTables.length ? missingTables.join(', ') : 'none'}`,
    `- Missing functions: ${missingFunctions.length ? missingFunctions.join(', ') : 'none'}`,
    `- Tables without RLS: ${tablesWithoutRls.length ? tablesWithoutRls.join(', ') : 'none'}`,
    '',
    '## Row Counts',
    ...expectedTables.map((table) => `- ${table}: ${validation.rowCounts[table] ?? 'n/a'}`),
    '',
    '## RLS Probe',
    `- Status: ${rlsProbe.status}`,
    ...(rlsProbe.reason ? [`- Reason: ${rlsProbe.reason}`] : []),
    ...(rlsProbe.checks || []).map((check) => `- ${check.actual === check.expected || (check.expected === '> 0' && check.actual > 0) ? 'PASS' : 'FAIL'} ${check.name}: actual ${check.actual}, expected ${check.expected}`),
    '',
    '## Notes',
    '- This runner uses the Priority 2 blueprint migrations only: 001_initial_schema.sql, 002_rls_policies.sql, and generated seed.sql.',
    '- The older split migration family in supabase/migrations is intentionally not applied by this runner because it conflicts with the blueprint schema.',
    '- Seed requires matching auth.users IDs before profile inserts can succeed in a real Supabase project.',
  ];

  fs.writeFileSync(reportPath, `${lines.join('\n')}\n`);
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const apply = args.has('--apply');
  const validateOnly = args.has('--validate-only');
  const skipSeed = args.has('--skip-seed');
  const connectionString = getConnectionString();

  if (!connectionString) {
    throw new Error('Set SUPABASE_DB_URL or DATABASE_URL before running this script.');
  }

  const client = new Client({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
  });

  const applied = [];
  const errors = [];

  await client.connect();
  try {
    if (apply && !validateOnly) {
      for (const file of migrationFiles) {
        if (skipSeed && file.endsWith('seed.sql')) continue;

        try {
          await applySqlFile(client, file);
          applied.push(file);
          console.log(`PASS applied ${file}`);
        } catch (error) {
          errors.push({ file, message: error.message });
          console.error(`FAIL applying ${file}: ${error.message}`);
          break;
        }
      }
    }

    const validation = await fetchValidation(client);
    const rlsProbe = await runRlsProbe(client, validation);
    writeReport({ applied, errors, validation, rlsProbe });
    console.log(`PASS wrote ${path.relative(rootDir, reportPath)}`);

    if (errors.length) process.exitCode = 1;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
