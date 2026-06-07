const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const router = express.Router();
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR, verifySupabaseToken, looksLikeSupabaseToken } = require('../middleware/auth');
const { sendEmailNotification, templates } = require('../config/email');

const ADMIN_EMAIL = 'harikanth.grevya@gmail.com';
const VALID_ROLES = ['super_admin', 'admin', 'hr_manager', 'manager', 'employee'];
const SUPABASE_URL = process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/\/$/, '') : '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const APP_URL = process.env.APP_BASE_URL || process.env.APP_URL || 'http://localhost:5173';
const ACCESS_APPROVAL_SECRET = process.env.ACCESS_APPROVAL_SECRET || process.env.JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-access-approval-secret-change-me';
const isProduction = process.env.NODE_ENV === 'production';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeUuid(value) {
  const text = String(value || '').trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text)
    ? text
    : null;
}

function errorResponse(message, err) {
  const payload = { error: message };
  if (!isProduction && err?.message) payload.detail = err.message;
  return payload;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function ensureApprovalTokenTable() {
  await supabaseDb.query(`
    create table if not exists public.access_approval_tokens (
      jti text primary key,
      profile_id uuid not null references public.profiles(id) on delete cascade,
      email text not null,
      token_hash text not null,
      expires_at timestamptz not null,
      used_at timestamptz,
      used_action text,
      created_at timestamptz not null default now()
    )
  `);
  await supabaseDb.query(`create index if not exists idx_access_approval_tokens_profile on public.access_approval_tokens(profile_id)`);
  await supabaseDb.query(`create index if not exists idx_access_approval_tokens_expires on public.access_approval_tokens(expires_at)`);
}

async function ensureAccessReviewEvidenceColumns() {
  await supabaseDb.query(`
    alter table public.profiles
      add column if not exists reviewed_by uuid references public.profiles(id) on delete set null,
      add column if not exists reviewed_at timestamptz,
      add column if not exists decision_method text
  `);
  await supabaseDb.query(`create index if not exists idx_profiles_reviewed_by on public.profiles(reviewed_by)`);
  await supabaseDb.query(`create index if not exists idx_profiles_reviewed_at on public.profiles(reviewed_at)`);
}

async function createReviewToken(profile) {
  await ensureApprovalTokenTable();
  const jti = crypto.randomUUID();
  const expiresInSeconds = 24 * 60 * 60;
  const token = jwt.sign(
    {
      sub: profile.id,
      email: profile.email,
      typ: 'access_review',
      jti,
    },
    ACCESS_APPROVAL_SECRET,
    { algorithm: 'HS256', expiresIn: expiresInSeconds },
  );
  await supabaseDb.query(
    `insert into public.access_approval_tokens (jti, profile_id, email, token_hash, expires_at)
     values ($1, $2, $3, $4, now() + interval '24 hours')`,
    [jti, profile.id, profile.email, hashToken(token)],
  );
  return token;
}

async function validateReviewToken(token) {
  if (!token) throw new Error('Approval token is required');
  let decoded;
  try {
    decoded = jwt.verify(token, ACCESS_APPROVAL_SECRET, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') throw new Error('Approval link has expired');
    throw new Error('Invalid approval link');
  }
  if (decoded.typ !== 'access_review' || !decoded.sub || !decoded.email || !decoded.jti) throw new Error('Invalid approval link');
  await ensureApprovalTokenTable();
  const tokenRow = await supabaseDb.queryOne(
    `select jti, profile_id, email, expires_at, used_at
     from public.access_approval_tokens
     where jti = $1 and token_hash = $2`,
    [decoded.jti, hashToken(token)],
  );
  if (!tokenRow) throw new Error('Invalid approval link');
  if (tokenRow.used_at) throw new Error('Request already processed');
  if (new Date(tokenRow.expires_at).getTime() < Date.now()) throw new Error('Approval link has expired');
  const profile = await supabaseDb.queryOne(
    `select p.id, p.email, p.full_name, p.phone, p.bio, p.avatar, p.role, p.status, p.created_at
     from public.profiles p
     where p.id = $1 and lower(p.email) = lower($2)`,
    [decoded.sub, decoded.email],
  );
  if (!profile) throw new Error('Pending user not found');
  if (profile.status !== 'pending') throw new Error('Request already processed');
  return { tokenRow, profile };
}

async function markReviewTokenUsed(jti, action) {
  await supabaseDb.query(
    `update public.access_approval_tokens set used_at = now(), used_action = $2 where jti = $1 and used_at is null`,
    [jti, action],
  );
}

async function logEmailReview(action, profile, metadata = {}) {
  await supabaseDb.query(
    `insert into public.audit_log (actor_id, action, entity, entity_id, diff, metadata)
     values (null, $1, 'access_request', $2, $3::jsonb, $4::jsonb)`,
    [
      action,
      profile.id,
      JSON.stringify({ details: `Email approval link ${action} for ${profile.email}` }),
      JSON.stringify(metadata),
    ],
  ).catch((err) => console.error('[Access] Audit log failed:', err.message));
}

async function createAdminReviewEmail(profile, request = {}) {
  const token = await createReviewToken(profile);
  const reviewUrl = `${APP_URL.replace(/\/$/, '')}/access-review?token=${encodeURIComponent(token)}`;
  const requestedAt = new Date().toLocaleString('en-IN');
  return {
    subject: 'New HR Portal Access Request',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;color:#172033">
        <div style="border-left:4px solid #16a34a;padding-left:16px;margin-bottom:20px">
          <h2 style="margin:0;color:#0f172a">New HR Portal Access Request</h2>
        </div>
        <p><strong>${profile.full_name || request.name || profile.email}</strong> requested access to Grevya HR.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0">
          <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0"><strong>${profile.email}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Phone</td><td style="padding:6px 0">${request.phone || profile.phone || ''}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Message</td><td style="padding:6px 0">${request.message || profile.bio || ''}</td></tr>
          <tr><td style="padding:6px 0;color:#64748b">Request time</td><td style="padding:6px 0">${requestedAt}</td></tr>
        </table>
        <p>
          <a href="${reviewUrl}" style="display:inline-block;background:#16a34a;color:white;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:700">Review Access Request</a>
        </p>
        <p style="color:#64748b;font-size:12px;margin-top:24px">This secure link expires in 24 hours and can be used once.</p>
      </div>`,
  };
}

function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

function userNameFromClaims(claims) {
  return claims.user_metadata?.full_name
    || claims.user_metadata?.name
    || claims.email
    || 'Pending user';
}

function initials(nameOrEmail) {
  const value = String(nameOrEmail || '').trim();
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || null;
}

function hasServiceRole() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY && SUPABASE_SERVICE_ROLE_KEY.startsWith('sb_secret_'));
}

async function createAuthUser(email, fullName, preferredId = null) {
  const normalizedEmail = normalizeEmail(email);
  if (preferredId) {
    const row = await supabaseDb.queryOne(
      `
      insert into auth.users (
        id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data,
        is_super_admin, created_at, updated_at, phone, email_change_confirm_status,
        is_sso_user, is_anonymous
      )
      values (
        $3::uuid, 'authenticated', 'authenticated', $1, null,
        jsonb_build_object('provider', 'email', 'providers', array['email']),
        jsonb_build_object('full_name', $2::text, 'name', $2::text),
        false, now(), now(), null, 0, false, false
      )
      on conflict (id) do update set
        email = excluded.email,
        raw_user_meta_data = auth.users.raw_user_meta_data || excluded.raw_user_meta_data,
        updated_at = now()
      returning id, email, email_confirmed_at, raw_app_meta_data, encrypted_password
      `,
      [normalizedEmail, fullName, preferredId],
    );

    await supabaseDb.query(
      `
      insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
      values ($1::text, $2::uuid, jsonb_build_object('sub', $2::text, 'email', $1::text, 'email_verified', false, 'full_name', $3::text), 'email', now(), now())
      on conflict (provider_id, provider) do update set user_id = excluded.user_id, identity_data = excluded.identity_data, updated_at = now()
      `,
      [normalizedEmail, row.id, fullName],
    );
    return row;
  }

  if (hasServiceRole()) {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        email: normalizedEmail,
        email_confirm: false,
        user_metadata: { full_name: fullName, name: fullName },
        app_metadata: { provider: 'email', providers: ['email'] },
      }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.message || body.error || 'Unable to create Supabase Auth user');
    return body.user || body;
  }

  const row = await supabaseDb.queryOne(
    `
    insert into auth.users (
      id, aud, role, email, encrypted_password, raw_app_meta_data, raw_user_meta_data,
      is_super_admin, created_at, updated_at, phone, email_change_confirm_status,
      is_sso_user, is_anonymous
    )
    values (
      gen_random_uuid(), 'authenticated', 'authenticated', $1, null,
      jsonb_build_object('provider', 'email', 'providers', array['email']),
      jsonb_build_object('full_name', $2::text, 'name', $2::text),
      false, now(), now(), null, 0, false, false
    )
    returning id, email
    `,
    [normalizedEmail, fullName],
  );

  await supabaseDb.query(
    `
    insert into auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
    values ($1::text, $2::uuid, jsonb_build_object('sub', $2::text, 'email', $1::text, 'email_verified', false, 'full_name', $3::text), 'email', now(), now())
    on conflict (provider_id, provider) do update set user_id = excluded.user_id, identity_data = excluded.identity_data, updated_at = now()
    `,
    [normalizedEmail, row.id, fullName],
  );
  return row;
}

async function findAuthUserByEmail(email) {
  return supabaseDb.queryOne(
    `select id, email from auth.users where lower(email) = lower($1) order by created_at asc limit 1`,
    [normalizeEmail(email)],
  );
}

async function getAuthUsersByEmail(email) {
  return supabaseDb.queryAll(
    `select id, email, email_confirmed_at, raw_app_meta_data, encrypted_password, created_at
     from auth.users where lower(email) = lower($1) order by created_at asc`,
    [normalizeEmail(email)],
  );
}

async function getProfilesByEmail(email) {
  return supabaseDb.queryAll(
    `select id, email, full_name, role, status, department_id, manager_id, job_title, created_at, updated_at
     from public.profiles
     where lower(email) = lower($1)
     order by case when status = 'active' then 0 when status = 'pending' then 1 else 2 end, created_at asc`,
    [normalizeEmail(email)],
  );
}

function chooseCanonicalProfile(profiles) {
  return profiles[0] || null;
}

function activeSetupMessage() {
  return 'Your account is approved. Please check your email to set your password or use Forgot password.';
}

async function ensureAuthUserForProfile(profile) {
  if (!profile) return null;
  const email = normalizeEmail(profile.email);
  const authUsers = await getAuthUsersByEmail(email);
  const matching = authUsers.find((user) => user.id === profile.id);
  if (matching) return matching;
  if (authUsers.length > 0) return authUsers[0];
  const created = await createAuthUser(email, profile.full_name || profile.name || email, profile.id);
  sendPasswordSetupEmail(email, profile.full_name || profile.name || email);
  return created;
}

async function sendAdminInAppNotification(profile) {
  try {
    await supabaseDb.query(
      `insert into public.notifications (user_id, title, message, type, link)
       select id, 'New access request', $1, 'warning', 'access'
       from public.profiles
       where status = 'active'::public.profile_status
         and role in ('super_admin'::public.app_role, 'admin'::public.app_role, 'hr_manager'::public.app_role)`,
      [`${profile.full_name || profile.name || profile.email} requested HR Portal access.`],
    );
  } catch (err) {
    console.error('[Access] Admin notification failed:', err.message);
  }
}

async function getAccessDiagnostics(email) {
  const normalizedEmail = normalizeEmail(email);
  const profiles = await getProfilesByEmail(normalizedEmail);
  const authUsers = await getAuthUsersByEmail(normalizedEmail);
  const profile = chooseCanonicalProfile(profiles);
  const authUser = profile ? authUsers.find((user) => user.id === profile.id) || authUsers[0] || null : authUsers[0] || null;
  const duplicateProfilesCount = Math.max(0, profiles.length - 1);
  const pendingRecordsCount = profiles.filter((row) => row.status === 'pending').length;
  const providers = authUser?.raw_app_meta_data?.providers || (authUser?.raw_app_meta_data?.provider ? [authUser.raw_app_meta_data.provider] : []);
  const mappingValid = Boolean(profile && authUser && profile.id === authUser.id && normalizeEmail(profile.email) === normalizeEmail(authUser.email));
  let reason = 'Mapping is valid';
  if (!profile && !authUser) reason = 'No profile or auth user exists';
  else if (!profile) reason = 'Auth user exists but profile is missing';
  else if (!authUser) reason = 'Profile exists but Supabase Auth user is missing';
  else if (profile.id !== authUser.id) reason = 'Profile id does not match Supabase Auth user id';
  else if (duplicateProfilesCount > 0) reason = 'Duplicate profiles exist for this email';

  return {
    normalizedEmail,
    profileExists: Boolean(profile),
    profileId: profile?.id || null,
    profileStatus: profile?.status || null,
    profileRole: profile?.role || null,
    profileAuthUserId: profile?.id || null,
    authUserExists: Boolean(authUser),
    authUserId: authUser?.id || null,
    authEmail: authUser?.email || null,
    authConfirmed: Boolean(authUser?.email_confirmed_at),
    authHasPassword: Boolean(authUser?.encrypted_password),
    providers,
    duplicateProfilesCount,
    pendingRecordsCount,
    mappingValid,
    reason,
    profiles: profiles.map((row) => ({ id: row.id, email: row.email, status: row.status, role: row.role, createdAt: row.created_at })),
    authUsers: authUsers.map((row) => ({ id: row.id, email: row.email, confirmed: Boolean(row.email_confirmed_at), providers: row.raw_app_meta_data?.providers || [] })),
  };
}

async function sendPasswordSetupIfNeeded(email, fullName, diagnostics = null) {
  const status = diagnostics || await getAccessDiagnostics(email);
  if (!status.authHasPassword || !status.authConfirmed) {
    sendPasswordSetupEmail(normalizeEmail(email), fullName || normalizeEmail(email));
  }
}

async function sendPasswordSetupEmail(email, name) {
  if (!hasServiceRole()) {
    sendEmailNotification(email, templates.welcome(name, email));
    return;
  }
  try {
    const response = await fetch(`${SUPABASE_URL}/auth/v1/admin/generate_link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        type: 'recovery',
        email,
        options: { redirect_to: APP_URL },
      }),
    });
    const body = await response.json().catch(() => ({}));
    const actionLink = body.action_link || body.properties?.action_link;
    if (!response.ok || !actionLink) throw new Error(body.message || body.error || 'Unable to generate password setup link');
    sendEmailNotification(email, templates.generic(
      'Set your Grevya HR password',
      `Your access has been approved. Set your password using this secure link: <a href="${actionLink}">Set password</a>`,
    ));
  } catch (err) {
    console.error('[Access] Password setup email failed:', err.message);
    sendEmailNotification(email, templates.userApproved(name));
  }
}

async function ensureDepartment(nameOrId) {
  const value = String(nameOrId || '').trim();
  if (!value) return null;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)) return value;
  const row = await supabaseDb.queryOne(
    `insert into public.departments (name)
     values ($1)
     on conflict (name) do update set name = excluded.name
     returning id`,
    [value],
  );
  return row.id;
}

async function ensurePrimaryAdminProfile(claims) {
  const email = normalizeEmail(claims.email);
  if (email !== ADMIN_EMAIL) return null;
  const fullName = userNameFromClaims(claims) || 'Grevya Admin';
  const avatar = fullName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || 'GA';
  const departmentId = await ensureDepartment('Administration');
  const existingByEmail = await supabaseDb.queryOne(
    `update public.profiles
     set role = 'super_admin'::public.app_role,
         status = 'active'::public.profile_status,
         department_id = coalesce(department_id, $2),
         job_title = coalesce(job_title, 'System Administrator'),
         updated_at = now()
     where lower(email) = lower($1)
     returning id, email, full_name, avatar, role, status, department_id, job_title, manager_id`,
    [email, departmentId],
  );
  if (existingByEmail) return existingByEmail;

  return supabaseDb.queryOne(
    `insert into public.profiles (
       id, full_name, email, avatar, role, status, department_id, job_title,
       employment_type, hire_date, performance_score, attendance_score, points, streak
     )
     values (
       $1, $2, $3, $4, 'super_admin'::public.app_role, 'active'::public.profile_status, $5, 'System Administrator',
       'full_time'::public.employment_type, current_date, 100, 100, 0, 0
     )
     on conflict (id) do update set
       full_name = excluded.full_name,
       email = excluded.email,
       avatar = coalesce(public.profiles.avatar, excluded.avatar),
       role = 'super_admin'::public.app_role,
       status = 'active'::public.profile_status,
       department_id = coalesce(public.profiles.department_id, excluded.department_id),
       job_title = coalesce(public.profiles.job_title, excluded.job_title),
       updated_at = now()
     returning id, email, full_name, avatar, role, status, department_id, job_title, manager_id`,
    [claims.sub, fullName, email, avatar, departmentId],
  );
}

async function getProfileForSession(claims) {
  return supabaseDb.queryOne(
    `select id, email, full_name, avatar, role, status, department_id, job_title, manager_id
     from public.profiles
     where id = $1 or lower(email) = lower($2)
     order by case
       when status = 'active'::public.profile_status and role is not null and lower(email) = lower($2) then 0
       when id = $1 then 1
       else 2
     end
     limit 1`,
    [claims.sub, normalizeEmail(claims.email)],
  );
}

async function debugHandler(req, res) {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email) return res.status(400).json({ error: 'Email is required' });
    return res.json(await getAccessDiagnostics(email));
  } catch (err) {
    console.error('[Access] Debug error:', err.message);
    return res.status(500).json(errorResponse('Unable to load access diagnostics', err));
  }
}

if (isProduction) {
  router.get('/debug', authenticateToken, requireAdminOrHR, debugHandler);
} else {
  router.get('/debug', debugHandler);
}

router.get('/status', async (req, res) => {
  try {
    const email = normalizeEmail(req.query.email);
    if (!email) return res.status(400).json({ error: 'Email is required' });
    const diagnostics = await getAccessDiagnostics(email);
    const profiles = await getProfilesByEmail(email);
    const profile = chooseCanonicalProfile(profiles);

    if (!profile) {
      return res.json({
        status: 'missing',
        message: 'No access request found. Request access from HR.',
        diagnostics,
      });
    }

    if (profile.status === 'active' && profile.role) {
      await ensureAuthUserForProfile(profile);
      await sendPasswordSetupIfNeeded(email, profile.full_name, diagnostics);
      return res.json({
        status: 'active',
        message: activeSetupMessage(),
        profile,
        diagnostics: await getAccessDiagnostics(email),
      });
    }

    if (profile.status === 'rejected') {
      return res.json({
        status: 'rejected',
        message: 'Access rejected. Contact HR.',
        profile,
        diagnostics,
      });
    }

    return res.json({
      status: 'pending',
      message: 'Access pending approval.',
      profile,
      diagnostics,
    });
  } catch (err) {
    console.error('[Access] Status error:', err.message);
    return res.status(500).json(errorResponse('Unable to check access status', err));
  }
});

router.post('/pending', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token || !looksLikeSupabaseToken(token)) return res.status(401).json({ error: 'Supabase token required' });
    const claims = await verifySupabaseToken(token);
    const email = normalizeEmail(claims.email);
    if (!email) return res.status(400).json({ error: 'Supabase user email is required' });

    const primaryAdmin = await ensurePrimaryAdminProfile(claims);
    if (primaryAdmin) return res.json({ status: 'active', profile: primaryAdmin });

    const emailProfiles = await getProfilesByEmail(email);
    const canonical = chooseCanonicalProfile(emailProfiles);
    if (canonical?.status === 'active' && canonical.role) {
      await ensureAuthUserForProfile(canonical);
      return res.json({ status: 'active', profile: canonical });
    }
    if (canonical?.status === 'rejected') return res.json({ status: 'rejected', profile: canonical });

    const existing = await getProfileForSession(claims);
    if (existing?.status === 'active' && existing.role) return res.json({ status: 'active', profile: existing });
    if (existing) return res.json({ status: existing.status || 'pending', profile: existing });
    if (canonical) return res.json({ status: canonical.status || 'pending', profile: canonical });

    const fullName = userNameFromClaims(claims);
    const avatar = fullName.split(' ').map((part) => part[0]).join('').toUpperCase().slice(0, 2) || null;
    const profile = await supabaseDb.queryOne(
      `insert into public.profiles (id, full_name, email, avatar, role, status)
       values ($1, $2, $3, $4, null, 'pending'::public.profile_status)
       on conflict (id) do update set
         full_name = excluded.full_name,
         email = excluded.email,
         avatar = coalesce(public.profiles.avatar, excluded.avatar),
         status = case when public.profiles.status = 'active'::public.profile_status then public.profiles.status else 'pending'::public.profile_status end,
         updated_at = now()
       returning id, email, full_name, avatar, role, status, department_id, job_title, manager_id`,
      [claims.sub, fullName, email.toLowerCase(), avatar],
    );
    sendEmailNotification(ADMIN_EMAIL, await createAdminReviewEmail(
      profile,
      {},
    ));
    await sendAdminInAppNotification(profile);
    return res.status(201).json({ status: profile.status || 'pending', profile });
  } catch (err) {
    console.error('[Access] Pending request error:', err.message);
    return res.status(500).json(errorResponse('Unable to create pending access request', err));
  }
});

router.post('/request', async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const fullName = String(req.body.name || req.body.fullName || '').trim();
    const phone = String(req.body.phone || '').trim();
    const message = String(req.body.message || '').trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email is required' });
    if (!fullName) return res.status(400).json({ error: 'Full name is required' });

    if (email === ADMIN_EMAIL) {
      const authUser = await findAuthUserByEmail(email);
      if (!authUser) return res.status(400).json({ error: 'Primary admin auth user is not configured yet.' });
      const profile = await ensurePrimaryAdminProfile({ sub: authUser.id, email, user_metadata: { full_name: fullName } });
      return res.json({ status: 'active', profile });
    }

    let profile = chooseCanonicalProfile(await getProfilesByEmail(email));

    if (profile?.status === 'active' && profile.role) {
      await ensureAuthUserForProfile(profile);
      await sendPasswordSetupIfNeeded(email, profile.full_name);
      return res.json({ status: 'active', profile, message: activeSetupMessage() });
    }
    if (profile?.status === 'rejected') return res.status(403).json({ status: 'rejected', error: 'Access rejected. Contact HR.' });
    if (profile) {
      sendEmailNotification(ADMIN_EMAIL, await createAdminReviewEmail(profile, { name: fullName, phone, message }));
      await sendAdminInAppNotification(profile);
      return res.json({ status: profile.status || 'pending', profile });
    }

    let authUser = await findAuthUserByEmail(email);
    if (!authUser) authUser = await createAuthUser(email, fullName);

    profile = await supabaseDb.queryOne(
      `
      insert into public.profiles (id, full_name, email, avatar, phone, role, status, bio)
      values ($1, $2, $3, $4, $5, null, 'pending'::public.profile_status, $6)
      on conflict (id) do update set
        full_name = excluded.full_name,
        email = excluded.email,
        avatar = coalesce(public.profiles.avatar, excluded.avatar),
        phone = coalesce(nullif(excluded.phone, ''), public.profiles.phone),
        role = null,
        status = case when public.profiles.status = 'rejected'::public.profile_status then public.profiles.status else 'pending'::public.profile_status end,
        bio = coalesce(nullif(excluded.bio, ''), public.profiles.bio),
        updated_at = now()
      returning id, email, full_name, role, status
      `,
      [authUser.id, fullName, email, initials(fullName), phone || null, message || null],
    );

    sendEmailNotification(ADMIN_EMAIL, await createAdminReviewEmail(profile, { name: fullName, phone, message }));
    await sendAdminInAppNotification(profile);
    return res.status(201).json({ status: profile.status || 'pending', profile });
  } catch (err) {
    console.error('[Access] Public request error:', err.message);
    return res.status(500).json(errorResponse('Unable to create access request', err));
  }
});

router.get('/review', async (req, res) => {
  try {
    const { profile } = await validateReviewToken(String(req.query.token || ''));
    const [departments, managers] = await Promise.all([
      supabaseDb.queryAll(`select id, name from public.departments order by name`),
      supabaseDb.queryAll(
        `select id, full_name as name, email, job_title as "jobTitle"
         from public.profiles
         where status = 'active'::public.profile_status
           and role in ('super_admin'::public.app_role, 'admin'::public.app_role, 'hr_manager'::public.app_role, 'manager'::public.app_role)
         order by full_name`,
      ),
    ]);
    return res.json({
      request: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        phone: profile.phone,
        message: profile.bio,
        status: profile.status,
        createdAt: profile.created_at,
      },
      departments,
      managers,
      roles: VALID_ROLES,
    });
  } catch (err) {
    return res.status(400).json(errorResponse(err.message || 'Invalid approval link', err));
  }
});

router.post('/review', async (req, res) => {
  try {
    await ensureAccessReviewEvidenceColumns();
    const { token, action, role, departmentId, department_id: departmentIdSnake, department, managerId, manager_id: managerIdSnake, jobTitle, job_title: jobTitleSnake } = req.body;
    const { tokenRow, profile } = await validateReviewToken(String(token || ''));
    const decision = String(action || '').toLowerCase();
    if (!['approve', 'reject'].includes(decision)) return res.status(400).json({ error: 'Valid action is required' });

    if (decision === 'reject') {
      const row = await supabaseDb.queryOne(
        `update public.profiles
         set role = null,
             status = 'rejected'::public.profile_status,
             reviewed_by = null,
             reviewed_at = now(),
             decision_method = 'email_reject',
             updated_at = now()
         where id = $1 and status = 'pending'::public.profile_status
         returning id, email, full_name as name, status, reviewed_at as "reviewedAt", decision_method as "decisionMethod"`,
        [profile.id],
      );
      if (!row) throw new Error('Request already processed');
      await markReviewTokenUsed(tokenRow.jti, 'reject');
      await logEmailReview('email_reject', profile, { tokenJti: tokenRow.jti });
      sendEmailNotification(row.email, templates.userRejected(row.name));
      return res.json({ status: 'rejected', profile: row });
    }

    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Valid role is required' });
    if (role === 'super_admin') return res.status(403).json({ error: 'Super Admin assignment requires a logged-in Super Admin.' });
    const selectedDepartment = departmentId || departmentIdSnake || department || 'Unassigned';
    const title = String(jobTitle || jobTitleSnake || '').trim();
    if (!title) return res.status(400).json({ error: 'Job title is required' });
    const departmentIdValue = await ensureDepartment(selectedDepartment);
    const row = await supabaseDb.queryOne(
      `update public.profiles
       set role = $2::public.app_role,
           status = 'active'::public.profile_status,
           department_id = $3,
           manager_id = $4,
           job_title = $5,
           reviewed_by = null,
           reviewed_at = now(),
           decision_method = 'email_approve',
           updated_at = now()
        where id = $1 and status = 'pending'::public.profile_status
        returning id, email, full_name as name, role, status, reviewed_at as "reviewedAt", decision_method as "decisionMethod"`,
      [profile.id, role, departmentIdValue, managerId || managerIdSnake || null, title],
    );
    if (!row) throw new Error('Request already processed');
    await markReviewTokenUsed(tokenRow.jti, 'approve');
    await logEmailReview('email_approve', profile, { tokenJti: tokenRow.jti, role });
    await ensureAuthUserForProfile(row);
    sendEmailNotification(row.email, templates.userApproved(row.name));
    sendPasswordSetupEmail(row.email, row.name);
    return res.json({ status: 'active', profile: row });
  } catch (err) {
    return res.status(400).json(errorResponse(err.message || 'Unable to process access request', err));
  }
});

router.get('/pending', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    await ensureAccessReviewEvidenceColumns();
    const statusFilter = String(req.query.status || 'pending').toLowerCase();
    const includeTests = String(req.query.includeTests || '').toLowerCase() === 'true';
    const statuses = {
      pending: ['pending'],
      approved: ['active'],
      active: ['active'],
      rejected: ['rejected'],
      all: ['pending', 'active', 'rejected'],
    }[statusFilter] || ['pending'];
    const rows = await supabaseDb.queryAll(
      `select p.id, p.email, p.full_name as name, p.avatar, p.role, p.status, p.job_title as "jobTitle",
              p.manager_id as "managerId", d.name as department, p.created_at as "createdAt",
              p.reviewed_at as "reviewedAt",
              p.decision_method as "decisionMethod",
              reviewer.id as "reviewedBy",
              reviewer.email as "reviewerEmail",
              reviewer.full_name as "reviewerName"
       from public.profiles p
       left join public.departments d on d.id = p.department_id
       left join public.profiles reviewer on reviewer.id = p.reviewed_by
       where p.status = any($1::public.profile_status[])
         and (
           $2::boolean
           or (
             lower(p.email) not like 'qa-request-%'
             and lower(p.email) not like 'qa-email-review-%'
           )
         )
       order by p.created_at desc`,
      [statuses, includeTests],
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/approve', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    await ensureAccessReviewEvidenceColumns();
    const { role, department, managerId, jobTitle } = req.body;
    const reviewerId = normalizeUuid(req.user.id);
    if (!VALID_ROLES.includes(role)) return res.status(400).json({ error: 'Valid role is required' });
    if (role === 'super_admin' && req.user.role !== 'super_admin') return res.status(403).json({ error: 'Only a Super Admin can assign Super Admin access.' });
    if (!department) return res.status(400).json({ error: 'Department is required' });
    if (!jobTitle) return res.status(400).json({ error: 'Job title is required' });

    const departmentId = await ensureDepartment(department);
    const row = await supabaseDb.queryOne(
      `update public.profiles
       set role = $2::public.app_role,
           status = 'active'::public.profile_status,
            department_id = $3,
            manager_id = $4,
            job_title = $5,
            reviewed_by = $6,
            reviewed_at = now(),
            decision_method = 'portal_approve',
            updated_at = now()
        where id = $1
        returning id, email, full_name as name, role, status, job_title as "jobTitle",
                  reviewed_at as "reviewedAt", decision_method as "decisionMethod",
                  $6::uuid as "reviewedBy", $7::text as "reviewerEmail", $8::text as "reviewerName"`,
      [req.params.id, role, departmentId, managerId || null, jobTitle, reviewerId, req.user.email || null, req.user.name || null],
    );
    if (!row) return res.status(404).json({ error: 'Pending user not found' });
    await ensureAuthUserForProfile(row);
    sendEmailNotification(row.email, templates.userApproved(row.name));
    sendPasswordSetupEmail(row.email, row.name);
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/reject', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    await ensureAccessReviewEvidenceColumns();
    const reviewerId = normalizeUuid(req.user.id);
    const row = await supabaseDb.queryOne(
      `update public.profiles
       set role = null,
           status = 'rejected'::public.profile_status,
           reviewed_by = $2,
           reviewed_at = now(),
           decision_method = 'portal_reject',
           updated_at = now()
        where id = $1
        returning id, email, full_name as name, status, role,
                  reviewed_at as "reviewedAt", decision_method as "decisionMethod",
                  $2::uuid as "reviewedBy", $3::text as "reviewerEmail", $4::text as "reviewerName"`,
      [req.params.id, reviewerId, req.user.email || null, req.user.name || null],
    );
    if (!row) return res.status(404).json({ error: 'Pending user not found' });
    sendEmailNotification(row.email, templates.userRejected(row.name));
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
