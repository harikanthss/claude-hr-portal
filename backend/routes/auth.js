const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { sendEmail, templates } = require('../config/email');
const { genId, logAudit } = require('../utils/helpers');

function hasRealEnvValue(value) {
  return Boolean(value && value.trim() && !value.startsWith('replace-with-') && !value.includes('placeholder') && !value.startsWith('your-'));
}

const SUPABASE_URL = hasRealEnvValue(process.env.SUPABASE_URL) ? process.env.SUPABASE_URL.replace(/\/$/, '') : '';
const SUPABASE_ANON_KEY = hasRealEnvValue(process.env.SUPABASE_ANON_KEY) ? process.env.SUPABASE_ANON_KEY : '';

async function verifySupabasePassword(email, password) {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error('Supabase Auth is not configured');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });
  return response.ok;
}

// ── Login ─────────────────────────────────────────────────────────────────────
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

  // Basic email format check
  if (typeof email !== 'string' || !email.includes('@') || email.length > 254) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const emp = db.prepare('SELECT * FROM employees WHERE email = ?').get(email.trim().toLowerCase());
    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      department: emp?.department,
      position: emp?.position,
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    logAudit(user.id, user.name, 'login', 'auth', null, 'User logged in', req.ip);
    res.json({ token, user: payload });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ── Logout ────────────────────────────────────────────────────────────────────
router.post('/logout', authenticateToken, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (id,token,revokedAt) VALUES (?,?,?)')
      .run(genId('rev'), req.token, new Date().toISOString());
    // Clean up old revoked tokens (older than 24h)
    db.prepare("DELETE FROM revoked_tokens WHERE revokedAt < datetime('now', '-24 hours')").run();
    logAudit(req.user.id, req.user.name, 'logout', 'auth', null, null, req.ip);
    res.json({ message: 'Logged out' });
  } catch (err) {
    console.error('[Auth] Logout error:', err.message);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ── Change Password ───────────────────────────────────────────────────────────
router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (newPassword.length > 128) return res.status(400).json({ error: 'Password too long' });

  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const currentPasswordOk = await verifySupabasePassword(req.user.email, currentPassword);
      if (!currentPasswordOk) return res.status(401).json({ error: 'Current password incorrect' });
      await supabaseDb.query(
        `
        update auth.users
        set encrypted_password = crypt($2, gen_salt('bf')),
            updated_at = now()
        where id = $1
        `,
        [req.user.id, newPassword],
      );
      logAudit(req.user.id, req.user.name, 'change_password', 'auth', null, null, req.ip);
      return res.json({ message: 'Password changed.' });
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ error: 'Current password incorrect' });
    }
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 12), req.user.id);
    // Revoke current token to force re-login
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (id,token,revokedAt) VALUES (?,?,?)')
      .run(genId('rev'), req.token, new Date().toISOString());
    logAudit(req.user.id, req.user.name, 'change_password', 'auth', null, null, req.ip);
    res.json({ message: 'Password changed. Please login again.' });
  } catch (err) {
    console.error('[Auth] Change password error:', err.message);
    res.status(500).json({ error: 'Password change failed' });
  }
});

// ── Forgot Password ──────────────────────────────────────────────────────────
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.trim().toLowerCase());
    // Always return success to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString(); // 1 hour
    // Invalidate any existing tokens for this user
    db.prepare('UPDATE password_reset_tokens SET used=1 WHERE userId=?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (id,userId,token,expiresAt,used) VALUES (?,?,?,?,0)')
      .run(genId('prt'), user.id, token, expiresAt);
    const { subject, html } = templates.passwordReset(user.name, token);
    await sendEmail(user.email, subject, html);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('[Auth] Forgot password error:', err.message);
    res.status(500).json({ error: 'Request failed' });
  }
});

// ── Reset Password ───────────────────────────────────────────────────────────
router.post('/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and password required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (newPassword.length > 128) return res.status(400).json({ error: 'Password too long' });

  try {
    const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token=? AND used=0').get(token);
    if (!record) return res.status(400).json({ error: 'Invalid or used reset link' });
    if (new Date(record.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Reset link expired. Request a new one.' });
    }
    db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(newPassword, 12), record.userId);
    db.prepare('UPDATE password_reset_tokens SET used=1 WHERE token=?').run(token);
    res.json({ message: 'Password reset. Please login.' });
  } catch (err) {
    console.error('[Auth] Reset password error:', err.message);
    res.status(500).json({ error: 'Reset failed' });
  }
});

// ── Current User ──────────────────────────────────────────────────────────────
router.get('/me', authenticateToken, (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json({
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        avatar: req.user.avatar,
        department: req.user.department,
        position: req.user.position,
        managerId: req.user.managerId,
      });
    }
    const user = db.prepare('SELECT id,name,email,role,avatar FROM users WHERE id=?').get(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(user.email);
    res.json({ ...user, department: emp?.department, position: emp?.position });
  } catch (err) {
    console.error('[Auth] Get me error:', err.message);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

module.exports = router;
