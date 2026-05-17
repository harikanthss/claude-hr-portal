const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || require('crypto').randomBytes(64).toString('hex');

function authenticateToken(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const revoked = db.prepare('SELECT id FROM revoked_tokens WHERE token = ?').get(token);
    if (revoked) return res.status(401).json({ error: 'Session expired. Please login again.' });
  } catch {}
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    req.token = token;
    next();
  });
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

function requireAdminOrHR(req, res, next) {
  if (!['admin', 'hr_manager'].includes(req.user.role)) return res.status(403).json({ error: 'HR or Admin only' });
  next();
}

function requireManagerOrAbove(req, res, next) {
  if (!['admin', 'hr_manager', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Manager or above only' });
  next();
}

module.exports = { authenticateToken, requireAdmin, requireAdminOrHR, requireManagerOrAbove, JWT_SECRET };
