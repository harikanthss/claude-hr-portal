const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const supabaseDb = require('../config/supabase');

const JWT_SECRET = process.env.JWT_SECRET;
function hasRealEnvValue(value) {
  return Boolean(value && value.trim() && !value.startsWith('replace-with-') && !value.includes('placeholder'));
}

const SUPABASE_URL = hasRealEnvValue(process.env.SUPABASE_URL)
  ? process.env.SUPABASE_URL.replace(/\/$/, '')
  : '';
const SUPABASE_JWKS_URL = SUPABASE_URL ? `${SUPABASE_URL}/auth/v1/.well-known/jwks.json` : '';
let jwksCache = { fetchedAt: 0, keys: [] };

if (!JWT_SECRET || JWT_SECRET === 'grevya-secret-change-me' || JWT_SECRET === 'replace-with-64-char-random-string') {
  console.warn('\n⚠️  WARNING: JWT_SECRET is not set or is using a default value.');
  console.warn('   Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"');
  console.warn('   Set it in your .env file or environment.\n');
}

// Fallback for development only
const SECRET = JWT_SECRET || crypto.randomBytes(64).toString('hex');

async function getSupabaseJwks() {
  const maxAgeMs = 60 * 60 * 1000;
  if (jwksCache.keys.length && Date.now() - jwksCache.fetchedAt < maxAgeMs) return jwksCache.keys;
  if (!SUPABASE_JWKS_URL) throw new Error('Supabase JWKS URL is not configured');

  const response = await fetch(SUPABASE_JWKS_URL);
  if (!response.ok) throw new Error(`Supabase JWKS fetch failed: ${response.status}`);
  const body = await response.json();
  jwksCache = { fetchedAt: Date.now(), keys: Array.isArray(body.keys) ? body.keys : [] };
  return jwksCache.keys;
}

async function getSupabaseJwtKey(token) {
  const decoded = jwt.decode(token, { complete: true });
  const header = decoded?.header || {};
  if (!header.kid) throw new Error('Supabase JWT is missing key id');
  const keys = await getSupabaseJwks();
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new Error('Supabase JWT signing key not found');
  return {
    key: crypto.createPublicKey({ key: jwk, format: 'jwk' }),
    algorithm: jwk.alg || header.alg,
  };
}

async function verifySupabaseToken(token) {
  const { key, algorithm } = await getSupabaseJwtKey(token);
  return jwt.verify(token, key, {
    algorithms: [algorithm].filter(Boolean),
    audience: 'authenticated',
    issuer: SUPABASE_URL ? `${SUPABASE_URL}/auth/v1` : undefined,
  });
}

function looksLikeSupabaseToken(token) {
  const decoded = jwt.decode(token);
  return Boolean(decoded?.iss && SUPABASE_URL && String(decoded.iss).startsWith(`${SUPABASE_URL}/auth/v1`));
}

async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  if (supabaseDb.enabled && SUPABASE_JWKS_URL && looksLikeSupabaseToken(token)) {
    try {
      const claims = await verifySupabaseToken(token);
      const profile = await supabaseDb.queryOne(
        `
        select
          p.id,
          p.email,
          p.full_name,
          p.avatar,
          p.role,
          p.status,
          p.department_id,
          d.name as department,
          p.job_title,
          p.manager_id
        from public.profiles p
        left join public.departments d on d.id = p.department_id
        where p.id = $1 or lower(p.email) = lower($2)
        order by case
          when p.status = 'active'::public.profile_status and p.role is not null and lower(p.email) = lower($2) then 0
          when p.id = $1 then 1
          else 2
        end
        limit 1
        `,
        [claims.sub, String(claims.email || '').trim().toLowerCase()],
      );
      if (!profile) return res.status(401).json({ error: 'Profile not found for authenticated user' });
      if (profile.status !== 'active' || !profile.role) {
        return res.status(403).json({ error: 'Account is not approved. Contact HR.' });
      }

      req.user = {
        id: profile.id,
        email: profile.email,
        name: profile.full_name,
        role: profile.role,
        avatar: profile.avatar,
        department: profile.department,
        position: profile.job_title,
        managerId: profile.manager_id,
        supabase: true,
      };
      req.token = token;
      return next();
    } catch (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Token expired. Please login again.'
        : 'Invalid or expired Supabase token';
      return res.status(401).json({ error: message });
    }
  }

  // Check if token has been revoked
  try {
    const revoked = db.prepare('SELECT id FROM revoked_tokens WHERE token = ?').get(token);
    if (revoked) return res.status(401).json({ error: 'Session expired. Please login again.' });
  } catch (err) {
    console.error('[Auth] Failed to check revoked tokens:', err.message);
    // Continue — don't block auth if revocation table has issues
  }

  jwt.verify(token, SECRET, (err, user) => {
    if (err) {
      const message = err.name === 'TokenExpiredError'
        ? 'Token expired. Please login again.'
        : 'Invalid or expired token';
      return res.status(401).json({ error: message });
    }
    req.user = user;
    req.token = token;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!['super_admin', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Admin only' });
  next();
}

function requireAdminOrHR(req, res, next) {
  if (!['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) return res.status(403).json({ error: 'HR or Admin only' });
  next();
}

function requireManagerOrAbove(req, res, next) {
  if (!['super_admin', 'admin', 'hr_manager', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Manager or above only' });
  next();
}

function isAdminOrHR(user) {
  return ['super_admin', 'admin', 'hr_manager'].includes(user?.role);
}

function isManager(user) {
  return user?.role === 'manager';
}

function isSelfEmployee(user, employee) {
  if (!user || !employee) return false;
  return employee.id === user.id || employee.email === user.email;
}

function isDirectReport(user, employee) {
  if (!user || !employee) return false;
  if (user.role !== 'manager') return false;
  const managerEmployee = db.prepare('SELECT id FROM employees WHERE email = ?').get(user.email);
  return employee.managerId === user.id || employee.managerId === managerEmployee?.id;
}

function canAccessEmployee(user, employee) {
  return isAdminOrHR(user) || isSelfEmployee(user, employee) || isDirectReport(user, employee);
}

function scopedEmployeeIds(user) {
  if (isAdminOrHR(user)) return null;
  const selfEmployee = db.prepare('SELECT id FROM employees WHERE email = ?').get(user.email);
  if (isManager(user)) {
    const rows = db.prepare('SELECT id FROM employees WHERE managerId = ? OR managerId = ? OR id = ? OR email = ?')
      .all(user.id, selfEmployee?.id || user.id, selfEmployee?.id || user.id, user.email);
    return rows.map(r => r.id);
  }
  return [selfEmployee?.id || user.id];
}

function requireDirectReportOrAdminHR(employeeId, user) {
  if (isAdminOrHR(user)) return true;
  const employee = db.prepare('SELECT id,email,managerId FROM employees WHERE id = ?').get(employeeId);
  return isSelfEmployee(user, employee) || isDirectReport(user, employee);
}

module.exports = {
  authenticateToken,
  requireAdmin,
  requireAdminOrHR,
  requireManagerOrAbove,
  isAdminOrHR,
  isManager,
  isSelfEmployee,
  isDirectReport,
  canAccessEmployee,
  scopedEmployeeIds,
  requireDirectReportOrAdminHR,
  verifySupabaseToken,
  looksLikeSupabaseToken,
  JWT_SECRET: SECRET
};
