#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const { Client } = require(path.join(rootDir, 'backend', 'node_modules', 'pg'));
const authUsersPath = path.join(rootDir, 'supabase', 'generated', 'auth-users.import.json');

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

async function seedAuthUser(client, user) {
  await client.query(
    `
    insert into auth.users (
      id,
      aud,
      role,
      email,
      encrypted_password,
      invited_at,
      confirmation_sent_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      created_at,
      updated_at,
      phone,
      email_change_confirm_status,
      is_sso_user,
      is_anonymous
    )
    values (
      $1::uuid,
      'authenticated',
      'authenticated',
      $2::text,
      null,
      now(),
      now(),
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', $3::text, 'name', $3::text, 'role', $4::text),
      false,
      now(),
      now(),
      null,
      0,
      false,
      false
    )
    on conflict (id) do update set
      email = excluded.email,
      raw_app_meta_data = excluded.raw_app_meta_data,
      raw_user_meta_data = excluded.raw_user_meta_data,
      updated_at = now()
    `,
    [user.id, user.email, user.full_name, user.role],
  );

  await client.query(
    `
    insert into auth.identities (
      provider_id,
      user_id,
      identity_data,
      provider,
      created_at,
      updated_at
    )
    values (
      $1::text,
      $2::uuid,
      jsonb_build_object('sub', $2::text, 'email', $1::text, 'email_verified', false, 'full_name', $3::text),
      'email',
      now(),
      now()
    )
    on conflict (provider_id, provider) do update set
      user_id = excluded.user_id,
      identity_data = excluded.identity_data,
      updated_at = now()
    `,
    [user.email, user.id, user.full_name],
  );
}

async function main() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error('Set SUPABASE_DB_URL or DATABASE_URL before running this script.');
  }

  const users = JSON.parse(fs.readFileSync(authUsersPath, 'utf8'));
  const client = new Client({
    connectionString,
    ssl: shouldUseSsl(connectionString) ? { rejectUnauthorized: false } : false,
  });

  await client.connect();
  try {
    await client.query('begin');
    for (const user of users) {
      await seedAuthUser(client, user);
      console.log(`PASS auth user ready: ${user.email}`);
    }
    await client.query('commit');
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exit(1);
});
