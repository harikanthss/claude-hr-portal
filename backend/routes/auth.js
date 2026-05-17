const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticateToken, JWT_SECRET } = require('../middleware/auth');
const { sendEmail, templates } = require('../config/email');

const genId = (p) => `${p}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;

function logAudit(userId, userName, action, resource, details, ip) {
  try { db.prepare('INSERT INTO audit_log (id,userId,userName,action,resource,resourceId,details,ipAddress,timestamp) VALUES (?,?,?,?,?,?,?,?,?)').run(genId('audit'), userId, userName, action, resource, null, details, ip, new Date().toISOString()); } catch {}
}

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password))
      return res.status(401).json({ error: 'Invalid email or password' });
    const emp = db.prepare('SELECT * FROM employees WHERE email = ?').get(email);
    const payload = { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, department: emp?.department, position: emp?.position };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
    logAudit(user.id, user.name, 'login', 'auth', 'User logged in', req.ip);
    res.json({ token, user: payload });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/logout', authenticateToken, (req, res) => {
  try {
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (id,token,revokedAt) VALUES (?,?,?)').run(genId('rev'), req.token, new Date().toISOString());
    db.prepare("DELETE FROM revoked_tokens WHERE revokedAt < datetime('now', '-24 hours')").run();
    logAudit(req.user.id, req.user.name, 'logout', 'auth', null, req.ip);
    res.json({ message: 'Logged out' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Current password incorrect' });
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(bcrypt.hashSync(newPassword, 12), req.user.id);
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (id,token,revokedAt) VALUES (?,?,?)').run(genId('rev'), req.token, new Date().toISOString());
    logAudit(req.user.id, req.user.name, 'change_password', 'auth', null, req.ip);
    res.json({ message: 'Password changed. Please login again.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000).toISOString();
    db.prepare('UPDATE password_reset_tokens SET used=1 WHERE userId=?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (id,userId,token,expiresAt,used) VALUES (?,?,?,?,0)').run(genId('prt'), user.id, token, expiresAt);
    const { subject, html } = templates.passwordReset(user.name, token);
    await sendEmail(user.email, subject, html);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and password required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token=? AND used=0').get(token);
    if (!record) return res.status(400).json({ error: 'Invalid or used reset link' });
    if (new Date(record.expiresAt) < new Date()) return res.status(400).json({ error: 'Reset link expired. Request a new one.' });
    db.prepare('UPDATE users SET password=? WHERE id=?').run(bcrypt.hashSync(newPassword, 12), record.userId);
    db.prepare('UPDATE password_reset_tokens SET used=1 WHERE token=?').run(token);
    res.json({ message: 'Password reset. Please login.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id,name,email,role,avatar FROM users WHERE id=?').get(req.user.id);
    const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(user.email);
    res.json({ ...user, department: emp?.department, position: emp?.position });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
