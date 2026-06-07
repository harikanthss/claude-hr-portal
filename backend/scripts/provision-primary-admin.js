require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const { Pool } = require('pg');

const ADMIN_EMAIL = 'harikanth.grevya@gmail.com';
const ADMIN_NAME = 'Harikanth Grevya';

async function main() {
  if (!process.env.SUPABASE_DB_URL) throw new Error('SUPABASE_DB_URL is required');
  const pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  try {
    let authUser = (await pool.query('select id from auth.users where lower(email) = lower($1) limit 1', [ADMIN_EMAIL])).rows[0];
    if (!authUser) {
      authUser = (await pool.query(
        `insert into auth.users (
           id, aud, role, email, encrypted_password, invited_at, confirmation_sent_at,
           raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at,
           phone, email_change_confirm_status, is_sso_user, is_anonymous
         )
         values (
           gen_random_uuid(), 'authenticated', 'authenticated', $1, null, now(), now(),
           jsonb_build_object('provider', 'email', 'providers', array['email']),
           jsonb_build_object('full_name', $2::text, 'name', $2::text),
           false, now(), now(), null, 0, false, false
         )
         returning id`,
        [ADMIN_EMAIL, ADMIN_NAME],
      )).rows[0];
      await pool.query(
        `insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
         values ($1, $2::uuid, jsonb_build_object('sub', $2::text, 'email', $1::text, 'email_verified', false, 'full_name', $3::text), 'email', now(), now())
         on conflict (provider_id, provider) do update set user_id = excluded.user_id, identity_data = excluded.identity_data, updated_at = now()`,
        [ADMIN_EMAIL, authUser.id, ADMIN_NAME],
      );
    }

    const department = (await pool.query(
      `insert into public.departments (name)
       values ('Administration')
       on conflict (name) do update set name = excluded.name
       returning id`,
    )).rows[0];

    await pool.query(
      `insert into public.profiles (
         id, full_name, email, avatar, role, status, department_id, job_title,
         employment_type, hire_date, performance_score, attendance_score, points, streak
       )
       values (
         $1, $2, $3, 'HG', 'super_admin'::public.app_role, 'active'::public.profile_status, $4, 'System Administrator',
         'full_time'::public.employment_type, current_date, 100, 100, 0, 0
       )
       on conflict (id) do update set
         full_name = excluded.full_name,
         email = excluded.email,
         role = 'super_admin'::public.app_role,
         status = 'active'::public.profile_status,
         department_id = excluded.department_id,
         job_title = excluded.job_title,
         updated_at = now()`,
      [authUser.id, ADMIN_NAME, ADMIN_EMAIL, department.id],
    );

    console.log(JSON.stringify({ ok: true, email: ADMIN_EMAIL, role: 'super_admin', status: 'active' }));
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(`[Provision admin] ${err.message}`);
  process.exit(1);
});
