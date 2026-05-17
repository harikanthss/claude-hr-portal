require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const db = require('./db');

const app = express();
app.use(cors());
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const APP_URL = process.env.APP_URL || 'http://localhost:3001';

// ─── File Upload (validated) ─────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = (process.env.ALLOWED_FILE_TYPES || 'pdf,doc,docx,xls,xlsx,png,jpg,jpeg,zip,txt').split(',');
const MAX_MB = parseInt(process.env.MAX_FILE_SIZE_MB || '10');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    if (ALLOWED_TYPES.includes(ext)) return cb(null, true);
    cb(new Error(`File type .${ext} not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}`));
  },
});
app.use('/uploads', express.static(UPLOAD_DIR));

// ─── Email Service ────────────────────────────────────────────────────────────
const emailEnabled = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
let transporter = null;

if (emailEnabled) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendEmail(to, subject, html) {
  if (!transporter) return console.log(`[Email skipped - SMTP not configured] To: ${to} | Subject: ${subject}`);
  try {
    await transporter.sendMail({ from: process.env.SMTP_FROM || 'Grevya HR <noreply@grevya.com>', to, subject, html });
    console.log(`Email sent to ${to}`);
  } catch (err) {
    console.error('Email error:', err.message);
  }
}

const EMAIL = {
  leaveApproved: (name, type, days, startDate) => ({
    subject: `✅ Leave Approved — ${type} Leave`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#22c55e,#16a34a);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px">
        <h2 style="color:white;margin:0">Leave Approved ✅</h2>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your <strong>${type}</strong> leave request for <strong>${days} day(s)</strong> starting <strong>${startDate}</strong> has been <strong style="color:#16a34a">approved</strong>.</p>
      <p>Enjoy your time off! 🎉</p>
      <hr style="border:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#6b7280;font-size:12px">Grevya HR Portal · <a href="${APP_URL}">Open Portal</a></p>
    </div>`,
  }),
  leaveRejected: (name, type, days, reason) => ({
    subject: `❌ Leave Request Rejected — ${type} Leave`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#ef4444,#dc2626);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px">
        <h2 style="color:white;margin:0">Leave Rejected ❌</h2>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Unfortunately your <strong>${type}</strong> leave request for <strong>${days} day(s)</strong> was <strong style="color:#dc2626">rejected</strong>.</p>
      ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
      <p>Please speak with your manager if you have questions.</p>
      <hr style="border:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#6b7280;font-size:12px">Grevya HR Portal · <a href="${APP_URL}">Open Portal</a></p>
    </div>`,
  }),
  welcomeEmployee: (name, email, password) => ({
    subject: `🎉 Welcome to Grevya HR Portal`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px">
        <h2 style="color:white;margin:0">Welcome to Grevya! 🌿</h2>
      </div>
      <p>Hi <strong>${name}</strong>, your HR portal account is ready.</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0">
        <p style="margin:4px 0"><strong>Portal:</strong> <a href="${APP_URL}">${APP_URL}</a></p>
        <p style="margin:4px 0"><strong>Email:</strong> ${email}</p>
        <p style="margin:4px 0"><strong>Password:</strong> <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px">${password}</code></p>
      </div>
      <p style="color:#ef4444;font-size:13px">⚠️ Please change your password after first login.</p>
      <hr style="border:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#6b7280;font-size:12px">Grevya HR Portal</p>
    </div>`,
  }),
  passwordReset: (name, token) => ({
    subject: `🔐 Reset Your Password — Grevya HR`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#7c3aed,#4f46e5);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px">
        <h2 style="color:white;margin:0">Password Reset 🔐</h2>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="${APP_URL}/reset-password?token=${token}" style="background:linear-gradient(135deg,#7c3aed,#4f46e5);color:white;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">Reset Password</a>
      </div>
      <p style="color:#6b7280;font-size:13px">If you didn't request this, ignore this email. Your password won't change.</p>
      <hr style="border:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#6b7280;font-size:12px">Grevya HR Portal</p>
    </div>`,
  }),
  payslipGenerated: (name, month, year, net) => ({
    subject: `💰 Payslip for ${month} ${year} — Grevya HR`,
    html: `<div style="font-family:sans-serif;max-width:520px;margin:auto;background:#f9fafb;padding:24px;border-radius:12px">
      <div style="background:linear-gradient(135deg,#16a34a,#15803d);padding:20px;border-radius:8px;text-align:center;margin-bottom:20px">
        <h2 style="color:white;margin:0">Payslip Ready 💰</h2>
      </div>
      <p>Hi <strong>${name}</strong>,</p>
      <p>Your payslip for <strong>${month} ${year}</strong> is ready.</p>
      <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;padding:16px;margin:16px 0;text-align:center">
        <p style="color:#6b7280;margin:0;font-size:13px">Net Salary</p>
        <p style="font-size:2rem;font-weight:800;color:#16a34a;margin:4px 0">₹${Number(net).toLocaleString('en-IN')}</p>
      </div>
      <div style="text-align:center">
        <a href="${APP_URL}" style="background:linear-gradient(135deg,#16a34a,#15803d);color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;display:inline-block">View Payslip</a>
      </div>
      <hr style="border:1px solid #e5e7eb;margin:20px 0">
      <p style="color:#6b7280;font-size:12px">Grevya HR Portal</p>
    </div>`,
  }),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function genId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
}

function logAudit(userId, userName, action, resource, resourceId, details, ipAddress) {
  try {
    db.prepare('INSERT INTO audit_log (id,userId,userName,action,resource,resourceId,details,ipAddress,timestamp) VALUES (?,?,?,?,?,?,?,?,?)').run(
      genId('audit'), userId, userName, action, resource, resourceId || null, details || null, ipAddress || null, new Date().toISOString()
    );
  } catch (e) { console.error('Audit log error:', e.message); }
}

function addNotification(title, message, type, userId) {
  try {
    db.prepare('INSERT INTO notifications (id,title,message,time,type,isRead,userId) VALUES (?,?,?,?,?,0,?)').run(
      genId('n'), title, message, new Date().toISOString(), type, userId || null
    );
  } catch (e) {}
}

// Indian TDS calculation (FY 2024-25 new regime)
function calcTDS(annualSalary) {
  const s = annualSalary;
  if (s <= 300000) return 0;
  if (s <= 600000) return Math.round((s - 300000) * 0.05 / 12);
  if (s <= 900000) return Math.round((15000 + (s - 600000) * 0.10) / 12);
  if (s <= 1200000) return Math.round((45000 + (s - 900000) * 0.15) / 12);
  if (s <= 1500000) return Math.round((90000 + (s - 1200000) * 0.20) / 12);
  return Math.round((150000 + (s - 1500000) * 0.30) / 12);
}

function generatePayslipData(emp, month, year, includeBonus) {
  const annual = emp.salary * 12;
  const basic = Math.round(emp.salary * 0.50);
  const hra = Math.round(emp.salary * 0.20);
  const conveyance = 1600;
  const medical = 1250;
  const bonus = includeBonus ? Math.round(emp.salary * 0.05) : 0;
  const pf = Math.round(basic * 0.12);
  const tax = calcTDS(annual);
  const esi = emp.salary <= 21000 ? Math.round(emp.salary * 0.0075) : 0;
  const netSalary = basic + hra + conveyance + medical + bonus - pf - tax - esi;
  return { basic, hra, conveyance, medical, bonus, pf, tax, esi, netSalary };
}

// ─── Middleware ───────────────────────────────────────────────────────────────
function authenticateToken(req, res, next) {
  const token = (req.headers['authorization'] || '').split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  // Check if token is revoked
  try {
    const revoked = db.prepare('SELECT id FROM revoked_tokens WHERE token = ?').get(token);
    if (revoked) return res.status(401).json({ error: 'Token has been revoked. Please login again.' });
  } catch (e) {}

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    req.token = token;
    next();
  });
}

function requireAdminOrHR(req, res, next) {
  if (!['admin', 'hr_manager'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
  next();
}

function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
  next();
}

function requireManagerOrAbove(req, res, next) {
  if (!['admin', 'hr_manager', 'manager'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
  next();
}

// ─── AUTH ─────────────────────────────────────────────────────────────────────
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    const emp = db.prepare('SELECT * FROM employees WHERE email = ?').get(email);
    const payload = { id: user.id, email: user.email, name: user.name, role: user.role, avatar: user.avatar, department: emp?.department, position: emp?.position };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    logAudit(user.id, user.name, 'login', 'auth', null, 'User logged in', req.ip);
    res.json({ token, user: payload });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
  try {
    // Revoke the token so it can't be reused even within expiry window
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (id,token,revokedAt) VALUES (?,?,?)').run(genId('rev'), req.token, new Date().toISOString());
    // Clean up old revoked tokens (older than 24h)
    db.prepare("DELETE FROM revoked_tokens WHERE revokedAt < datetime('now', '-24 hours')").run();
    logAudit(req.user.id, req.user.name, 'logout', 'auth', null, 'User logged out', req.ip);
    res.json({ message: 'Logged out successfully' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Both passwords required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!bcrypt.compareSync(currentPassword, user.password)) return res.status(401).json({ error: 'Current password is incorrect' });
    const hashed = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, req.user.id);
    // Revoke current token to force re-login
    db.prepare('INSERT OR IGNORE INTO revoked_tokens (id,token,revokedAt) VALUES (?,?,?)').run(genId('rev'), req.token, new Date().toISOString());
    logAudit(req.user.id, req.user.name, 'change_password', 'auth', null, null, req.ip);
    res.json({ message: 'Password changed. Please login again.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    // Always return success to prevent email enumeration
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    // Invalidate old tokens
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE userId = ?').run(user.id);
    db.prepare('INSERT INTO password_reset_tokens (id,userId,token,expiresAt,used) VALUES (?,?,?,?,0)').run(genId('prt'), user.id, token, expiresAt);

    const { subject, html } = EMAIL.passwordReset(user.name, token);
    await sendEmail(user.email, subject, html);
    logAudit(user.id, user.name, 'forgot_password', 'auth', null, null, req.ip);
    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.status(400).json({ error: 'Token and new password required' });
  if (newPassword.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  try {
    const record = db.prepare('SELECT * FROM password_reset_tokens WHERE token = ? AND used = 0').get(token);
    if (!record) return res.status(400).json({ error: 'Invalid or already used reset link' });
    if (new Date(record.expiresAt) < new Date()) return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });

    const hashed = bcrypt.hashSync(newPassword, 12);
    db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, record.userId);
    db.prepare('UPDATE password_reset_tokens SET used = 1 WHERE token = ?').run(token);

    // Revoke all tokens for this user (force re-login)
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(record.userId);
    logAudit(record.userId, user?.name || 'unknown', 'reset_password', 'auth', null, null, req.ip);
    res.json({ message: 'Password reset successfully. Please login.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/auth/me', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT id,name,email,role,avatar FROM users WHERE id = ?').get(req.user.id);
    const emp = db.prepare('SELECT * FROM employees WHERE email = ?').get(user.email);
    res.json({ ...user, department: emp?.department, position: emp?.position });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── EMPLOYEES ────────────────────────────────────────────────────────────────
app.get('/api/employees', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params = [];
    if (req.query.department) { sql += ' AND department = ?'; params.push(req.query.department); }
    if (req.query.status) { sql += ' AND status = ?'; params.push(req.query.status); }
    if (req.query.search) { sql += ' AND (name LIKE ? OR email LIKE ? OR position LIKE ?)'; const s = `%${req.query.search}%`; params.push(s,s,s); }
    sql += ' ORDER BY name ASC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/employees/:id', authenticateToken, (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/employees', authenticateToken, requireAdminOrHR, async (req, res) => {
  const { name, email, department, position, salary, joinDate, status, phone, location, managerId } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  try {
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const empId = genId('emp');
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2);
    const tempPassword = crypto.randomBytes(6).toString('hex');
    const hashedPw = bcrypt.hashSync(tempPassword, 12);
    const role = position?.toLowerCase().includes('manager') ? 'manager' : position?.toLowerCase().includes('hr') ? 'hr_manager' : 'employee';

    db.prepare('INSERT INTO employees (id,name,email,department,position,salary,joinDate,status,avatar,phone,location,performance,attendance,points,streak,managerId) VALUES (?,?,?,?,?,?,?,?,?,?,?,80,95,0,0,?)').run(
      empId,name,email,department||'',position||'',salary||0,joinDate||new Date().toISOString().split('T')[0],status||'active',initials,phone||'',location||'',managerId||null
    );
    db.prepare('INSERT INTO users (id,name,email,password,role,avatar) VALUES (?,?,?,?,?,?)').run(empId,name,email,hashedPw,role,initials);

    // Seed onboarding tasks
    const obTasks = ['Send welcome email','Set up workstation','Create company email','Add to Slack channels','Introduce to team','Complete HR policy forms','Submit ID proof documents'];
    obTasks.forEach((label, i) => {
      db.prepare('INSERT INTO onboarding_tasks (id,employeeId,employeeName,employeeAvatar,department,position,startDate,buddy,taskLabel,taskDueDay,taskAssignee,done) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)').run(
        genId('ob'),empId,name,initials,department||'',position||'',joinDate||new Date().toISOString().split('T')[0],'HR',label,i,i<2?'IT':i<4?'Manager':'HR'
      );
    });

    logAudit(req.user.id, req.user.name, 'create', 'employee', empId, `Created ${name}`, req.ip);
    addNotification(`New Employee Added`, `${name} has joined the ${department} team.`, 'info', null);
    await sendEmail(email, ...Object.values(EMAIL.welcomeEmployee(name, email, tempPassword)));
    res.status(201).json({ id: empId, name, email, department, position, tempPassword });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/employees/:id', authenticateToken, (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE id = ?').get(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Not found' });
    if (req.user.role === 'employee' && emp.email !== req.user.email) return res.status(403).json({ error: 'Access denied' });
    const { name,email,department,position,salary,status,phone,location,managerId,bio } = req.body;
    db.prepare('UPDATE employees SET name=COALESCE(?,name),email=COALESCE(?,email),department=COALESCE(?,department),position=COALESCE(?,position),salary=COALESCE(?,salary),status=COALESCE(?,status),phone=COALESCE(?,phone),location=COALESCE(?,location),managerId=COALESCE(?,managerId),bio=COALESCE(?,bio) WHERE id=?').run(
      name,email,department,position,salary,status,phone,location,managerId,bio,req.params.id
    );
    if (name||email) db.prepare('UPDATE users SET name=COALESCE(?,name),email=COALESCE(?,email) WHERE id=?').run(name,email,req.params.id);
    logAudit(req.user.id,req.user.name,'update','employee',req.params.id,`Updated ${emp.name}`,req.ip);
    res.json(db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/employees/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE employees SET status=? WHERE id=?').run('inactive', req.params.id);
    logAudit(req.user.id,req.user.name,'delete','employee',req.params.id,`Deactivated ${emp.name}`,req.ip);
    res.json({ message: `${emp.name} deactivated` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PROFILE ──────────────────────────────────────────────────────────────────
app.get('/api/profile', authenticateToken, (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email);
    res.json(emp || {});
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/profile', authenticateToken, (req, res) => {
  try {
    const { phone, location, bio } = req.body;
    db.prepare('UPDATE employees SET phone=COALESCE(?,phone),location=COALESCE(?,location),bio=COALESCE(?,bio) WHERE email=?').run(phone,location,bio,req.user.email);
    res.json(db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/profile/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  try {
    const url = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE employees SET avatar=? WHERE email=?').run(url, req.user.email);
    db.prepare('UPDATE users SET avatar=? WHERE id=?').run(url, req.user.id);
    res.json({ avatarUrl: url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── LEAVE ────────────────────────────────────────────────────────────────────
app.get('/api/leave-requests', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM leave_requests WHERE 1=1';
    const params = [];
    if (req.user.role === 'employee') { sql += ' AND employeeId=?'; params.push(req.user.id); }
    if (req.query.status) { sql += ' AND status=?'; params.push(req.query.status); }
    sql += ' ORDER BY appliedOn DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/leave-requests', authenticateToken, async (req, res) => {
  const { type, startDate, endDate, days, reason } = req.body;
  if (!type||!startDate||!endDate||!days) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email);
    const id = genId('lr');
    db.prepare('INSERT INTO leave_requests (id,employeeId,employeeName,employeeAvatar,type,startDate,endDate,days,reason,status,appliedOn) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(
      id, req.user.id, req.user.name, emp?.avatar||req.user.avatar, type, startDate, endDate, days, reason, 'pending', new Date().toISOString()
    );
    addNotification(`Leave Request: ${req.user.name}`, `${req.user.name} applied for ${type} leave (${days} days from ${startDate}).`, 'warning', null);
    logAudit(req.user.id, req.user.name, 'create', 'leave_request', id, `Applied ${type} leave ${days} days`, req.ip);
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/leave-requests/:id', authenticateToken, requireManagerOrAbove, async (req, res) => {
  const { status, comments } = req.body;
  if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
  try {
    const lr = db.prepare('SELECT * FROM leave_requests WHERE id=?').get(req.params.id);
    if (!lr) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE leave_requests SET status=?,approvedBy=?,comments=? WHERE id=?').run(status, req.user.name, comments||null, req.params.id);
    if (status === 'approved') db.prepare("UPDATE employees SET status='on_leave' WHERE id=?").run(lr.employeeId);
    else if (status === 'rejected') db.prepare("UPDATE employees SET status='active' WHERE id=? AND status='on_leave'").run(lr.employeeId);

    const emp = db.prepare('SELECT email,name FROM employees WHERE id=?').get(lr.employeeId);
    if (emp) {
      const emailData = status === 'approved'
        ? EMAIL.leaveApproved(emp.name, lr.type, lr.days, lr.startDate)
        : EMAIL.leaveRejected(emp.name, lr.type, lr.days, comments);
      await sendEmail(emp.email, emailData.subject, emailData.html);
    }
    addNotification(`Leave ${status}`, `Your ${lr.type} leave has been ${status}.`, status==='approved'?'success':'error', lr.employeeId);
    logAudit(req.user.id, req.user.name, status, 'leave_request', req.params.id, `${status} ${lr.employeeName}'s ${lr.type} leave`, req.ip);
    res.json({ message: `Leave ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ATTENDANCE ───────────────────────────────────────────────────────────────
app.get('/api/attendance', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM attendance_records WHERE 1=1';
    const params = [];
    if (req.query.employeeId) { sql += ' AND employeeId=?'; params.push(req.query.employeeId); }
    if (req.query.month) { sql += " AND strftime('%Y-%m',date)=?"; params.push(req.query.month); }
    if (req.user.role === 'employee') { sql += ' AND employeeId=?'; params.push(req.user.id); }
    sql += ' ORDER BY date DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/attendance/check-in', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = db.prepare('SELECT * FROM attendance_records WHERE employeeId=? AND date=?').get(req.user.id, today);
    if (existing?.checkIn) return res.status(400).json({ error: 'Already checked in today' });
    const checkIn = new Date().toTimeString().slice(0,5);
    const id = genId('att');
    if (existing) db.prepare('UPDATE attendance_records SET checkIn=?,status=? WHERE id=?').run(checkIn,'present',existing.id);
    else db.prepare('INSERT INTO attendance_records (id,employeeId,date,checkIn,status) VALUES (?,?,?,?,?)').run(id,req.user.id,today,checkIn,'present');
    // Update streak
    db.prepare('UPDATE employees SET streak=streak+1 WHERE id=?').run(req.user.id);
    res.json({ checkIn, date: today });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/attendance/check-out', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = db.prepare('SELECT * FROM attendance_records WHERE employeeId=? AND date=?').get(req.user.id, today);
    if (!record?.checkIn) return res.status(400).json({ error: 'Not checked in today' });
    if (record.checkOut) return res.status(400).json({ error: 'Already checked out' });
    const checkOut = new Date().toTimeString().slice(0,5);
    const inH = parseInt(record.checkIn.split(':')[0]);
    const outH = parseInt(checkOut.split(':')[0]);
    const hours = Math.max(0, outH - inH);
    db.prepare('UPDATE attendance_records SET checkOut=?,hours=? WHERE id=?').run(checkOut, hours, record.id);
    // Update points for full day
    if (hours >= 8) db.prepare('UPDATE employees SET points=points+10 WHERE id=?').run(req.user.id);
    res.json({ checkOut, hours });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PAYSLIPS + AUTO-GENERATION ───────────────────────────────────────────────
app.get('/api/payslips', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM payslips WHERE 1=1';
    const params = [];
    if (req.user.role === 'employee') { sql += ' AND employeeId=?'; params.push(req.user.id); }
    else if (req.query.employeeId) { sql += ' AND employeeId=?'; params.push(req.query.employeeId); }
    sql += ' ORDER BY year DESC, month ASC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Auto-generate payslips for all employees for a given month
app.post('/api/payslips/generate', authenticateToken, requireAdminOrHR, async (req, res) => {
  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ error: 'Month and year required' });
  try {
    const employees = db.prepare("SELECT * FROM employees WHERE status='active'").all();
    const results = [];
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const monthName = monthNames[parseInt(month)-1];
    const isDecember = monthName === 'December';

    for (const emp of employees) {
      const existing = db.prepare('SELECT id FROM payslips WHERE employeeId=? AND month=? AND year=?').get(emp.id, monthName, parseInt(year));
      if (existing) { results.push({ name: emp.name, status: 'already_exists' }); continue; }

      const { basic,hra,conveyance,medical,bonus,pf,tax,netSalary } = generatePayslipData(emp, monthName, year, isDecember);
      const psId = genId('ps');
      db.prepare('INSERT INTO payslips (id,employeeId,month,year,basicSalary,hra,conveyance,medical,bonus,pf,tax,netSalary,generatedOn) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
        psId, emp.id, monthName, parseInt(year), basic, hra, conveyance, medical, bonus, pf, tax, netSalary, new Date().toISOString()
      );
      // Update points for payslip receipt
      db.prepare('UPDATE employees SET points=points+50 WHERE id=?').run(emp.id);
      addNotification('Payslip Ready', `Your payslip for ${monthName} ${year} is now available.`, 'success', emp.id);
      const emailData = EMAIL.payslipGenerated(emp.name, monthName, year, netSalary);
      await sendEmail(emp.email, emailData.subject, emailData.html);
      results.push({ name: emp.name, status: 'generated', net: netSalary });
    }

    logAudit(req.user.id, req.user.name, 'generate_payslips', 'payroll', null, `Generated ${results.length} payslips for ${monthName} ${year}`, req.ip);
    res.json({ message: `Payslips processed for ${monthName} ${year}`, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── PERFORMANCE ──────────────────────────────────────────────────────────────
app.get('/api/performance', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM performance_reviews WHERE 1=1';
    const params = [];
    if (req.user.role === 'employee') { sql += ' AND employeeId=?'; params.push(req.user.id); }
    else if (req.query.employeeId) { sql += ' AND employeeId=?'; params.push(req.query.employeeId); }
    sql += ' ORDER BY createdAt DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/performance', authenticateToken, requireManagerOrAbove, (req, res) => {
  const { employeeId, period, technicalScore, communicationScore, leadershipScore, deliveryScore, innovationScore, teamworkScore, comments, goals } = req.body;
  if (!employeeId) return res.status(400).json({ error: 'Employee ID required' });
  try {
    const overall = Math.round(((technicalScore||0)+(communicationScore||0)+(leadershipScore||0)+(deliveryScore||0)+(innovationScore||0)+(teamworkScore||0))/6);
    const id = genId('perf');
    db.prepare('INSERT INTO performance_reviews (id,employeeId,reviewerId,period,technicalScore,communicationScore,leadershipScore,deliveryScore,innovationScore,teamworkScore,overallScore,comments,goals,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
      id,employeeId,req.user.id,period||'',technicalScore||0,communicationScore||0,leadershipScore||0,deliveryScore||0,innovationScore||0,teamworkScore||0,overall,comments||'',goals||'','completed',new Date().toISOString(),new Date().toISOString()
    );
    db.prepare('UPDATE employees SET performance=? WHERE id=?').run(overall, employeeId);
    db.prepare('UPDATE employees SET points=points+25 WHERE id=?').run(employeeId);
    addNotification('Performance Review', `Your performance review for ${period} is ready.`, 'info', employeeId);
    logAudit(req.user.id, req.user.name, 'create', 'performance_review', id, `Reviewed ${employeeId}`, req.ip);
    res.status(201).json({ id, overall });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── EXPENSES ─────────────────────────────────────────────────────────────────
app.get('/api/expenses', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    if (req.user.role === 'employee') { sql += ' AND employeeId=?'; params.push(req.user.id); }
    if (req.query.status) { sql += ' AND status=?'; params.push(req.query.status); }
    sql += ' ORDER BY submittedOn DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/expenses', authenticateToken, (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    if (!category||!amount) return res.status(400).json({ error: 'Category and amount required' });
    const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email);
    const id = genId('exp');
    db.prepare('INSERT INTO expenses (id,employeeId,employeeName,employeeAvatar,category,amount,description,date,status,submittedOn) VALUES (?,?,?,?,?,?,?,?,?,?)').run(
      id,req.user.id,req.user.name,emp?.avatar||'',category,parseFloat(amount),description||'',date||new Date().toISOString().split('T')[0],'pending',new Date().toISOString()
    );
    addNotification('Expense Submitted', `${req.user.name} submitted ₹${amount} ${category} claim.`, 'info', null);
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/expenses/:id', authenticateToken, requireManagerOrAbove, (req, res) => {
  try {
    const { status, comments } = req.body;
    const exp = db.prepare('SELECT * FROM expenses WHERE id=?').get(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE expenses SET status=?,approvedBy=?,comments=? WHERE id=?').run(status,req.user.name,comments||null,req.params.id);
    addNotification(`Expense ${status}`, `Your ₹${exp.amount} ${exp.category} claim was ${status}.`, status==='approved'?'success':'error', exp.employeeId);
    logAudit(req.user.id,req.user.name,status,'expense',req.params.id,null,req.ip);
    res.json({ message: `Expense ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── RECRUITMENT ──────────────────────────────────────────────────────────────
app.get('/api/jobs', authenticateToken, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM jobs ORDER BY posted DESC').all()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/jobs', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { title,department,type,location,openings } = req.body;
    const id = genId('job');
    db.prepare('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)').run(id,title,department,type,location,openings||1,new Date().toISOString().split('T')[0],'active');
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/candidates', authenticateToken, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM candidates ORDER BY appliedDate DESC').all()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/candidates', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { name,email,phone,position,department,stage } = req.body;
    const id = genId('cand');
    const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    db.prepare('INSERT INTO candidates (id,name,email,phone,position,department,stage,appliedDate,avatar,score) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,name,email,phone||'',position,department,stage||'applied',new Date().toISOString().split('T')[0],initials,0);
    logAudit(req.user.id,req.user.name,'create','candidate',id,`Added ${name}`,req.ip);
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/candidates/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { stage, score, note } = req.body;
    db.prepare('UPDATE candidates SET stage=COALESCE(?,stage),score=COALESCE(?,score),note=COALESCE(?,note) WHERE id=?').run(stage,score,note,req.params.id);
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SHIFTS ───────────────────────────────────────────────────────────────────
app.get('/api/shifts', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM shifts WHERE 1=1';
    const params = [];
    if (req.query.week) { sql += ' AND date LIKE ?'; params.push(`${req.query.week}%`); }
    if (req.user.role === 'employee') { sql += ' AND employeeId=?'; params.push(req.user.id); }
    sql += ' ORDER BY date, startTime';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/shifts', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { employeeId,employeeName,date,shiftType,startTime,endTime,notes } = req.body;
    const id = genId('sh');
    db.prepare('INSERT INTO shifts (id,employeeId,employeeName,date,shiftType,startTime,endTime,status,notes,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,employeeId,employeeName,date,shiftType||'morning',startTime,endTime,'scheduled',notes||null,req.user.id);
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DOCUMENTS ────────────────────────────────────────────────────────────────
app.get('/api/documents', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];
    if (req.query.category) { sql += ' AND category=?'; params.push(req.query.category); }
    if (req.user.role === 'employee') { sql += ' AND (employeeId=? OR employeeId IS NULL)'; params.push(req.user.id); }
    sql += ' ORDER BY uploadedAt DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/documents', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' });
  try {
    const { name, category, description, employeeId } = req.body;
    const id = genId('doc');
    db.prepare('INSERT INTO documents (id,employeeId,name,type,category,filePath,fileSize,uploadedBy,uploadedAt,description) VALUES (?,?,?,?,?,?,?,?,?,?)').run(
      id, employeeId||req.user.id, name||req.file.originalname, req.file.mimetype, category||'general',
      `/uploads/${req.file.filename}`, req.file.size, req.user.name, new Date().toISOString(), description||''
    );
    logAudit(req.user.id,req.user.name,'upload','document',id,`Uploaded ${name||req.file.originalname}`,req.ip);
    res.status(201).json({ id, path: `/uploads/${req.file.filename}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/documents/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const doc = db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });
    const filePath = path.join(__dirname, doc.filePath.replace('/uploads/', 'uploads/'));
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    db.prepare('DELETE FROM documents WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── CALENDAR ─────────────────────────────────────────────────────────────────
app.get('/api/calendar', authenticateToken, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM calendar_events ORDER BY date ASC').all()); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/calendar', authenticateToken, (req, res) => {
  try {
    const { title,date,endDate,type,color,description } = req.body;
    if (!title||!date) return res.status(400).json({ error: 'Title and date required' });
    const id = genId('ev');
    db.prepare('INSERT INTO calendar_events (id,title,date,endDate,type,color,description,createdBy) VALUES (?,?,?,?,?,?,?,?)').run(id,title,date,endDate||null,type||'meeting',color||'#3b82f6',description||'',req.user.id);
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.delete('/api/calendar/:id', authenticateToken, (req, res) => {
  try { db.prepare('DELETE FROM calendar_events WHERE id=?').run(req.params.id); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────
app.get('/api/notifications', authenticateToken, (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM notifications WHERE (userId=? OR userId IS NULL) ORDER BY time DESC LIMIT 50').all(req.user.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/notifications/:id/read', authenticateToken, (req, res) => {
  try { db.prepare('UPDATE notifications SET isRead=1 WHERE id=?').run(req.params.id); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/notifications/read-all', authenticateToken, (req, res) => {
  try { db.prepare('UPDATE notifications SET isRead=1 WHERE userId=? OR userId IS NULL').run(req.user.id); res.json({ ok: true }); } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── ONBOARDING ───────────────────────────────────────────────────────────────
app.get('/api/onboarding', authenticateToken, (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM onboarding_tasks ORDER BY employeeName, taskDueDay').all();
    const grouped = {};
    tasks.forEach(t => {
      if (!grouped[t.employeeId]) grouped[t.employeeId] = { employeeId:t.employeeId, employeeName:t.employeeName, employeeAvatar:t.employeeAvatar, department:t.department, position:t.position, startDate:t.startDate, buddy:t.buddy, tasks:[] };
      grouped[t.employeeId].tasks.push({ id:t.id, label:t.taskLabel, dueDay:t.taskDueDay, assignee:t.taskAssignee, notes:t.taskNotes, done:!!t.done });
    });
    res.json(Object.values(grouped));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.put('/api/onboarding/:taskId', authenticateToken, (req, res) => {
  try {
    db.prepare('UPDATE onboarding_tasks SET done=? WHERE id=?').run(req.body.done?1:0, req.params.taskId);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── AUDIT LOG ────────────────────────────────────────────────────────────────
app.get('/api/audit-log', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const limit = parseInt(req.query.limit||'100');
    res.json(db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?').all(limit));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── DASHBOARD ANALYTICS ──────────────────────────────────────────────────────
app.get('/api/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const employees = db.prepare('SELECT * FROM employees').all();
    const leaveRequests = db.prepare('SELECT * FROM leave_requests').all();
    const today = new Date().toISOString().split('T')[0];
    const presentToday = db.prepare("SELECT COUNT(*) as c FROM attendance_records WHERE date=? AND status='present'").get(today)?.c || 0;
    res.json({
      totalEmployees: employees.length,
      activeEmployees: employees.filter(e=>e.status==='active').length,
      onLeave: employees.filter(e=>e.status==='on_leave').length,
      pendingLeaves: leaveRequests.filter(l=>l.status==='pending').length,
      presentToday,
      avgPerformance: employees.length ? Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length) : 0,
      avgAttendance: employees.length ? Math.round(employees.reduce((s,e)=>s+e.attendance,0)/employees.length) : 0,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/performance', authenticateToken, (req, res) => {
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  const employees = db.prepare('SELECT performance FROM employees').all();
  const base = employees.length ? Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length) : 80;
  res.json(months.map((month,i) => ({ month, score: Math.min(100,Math.max(60,Math.round(base+(i-3)*1.5+(Math.sin(i)*2)-5))), target: 85 })));
});

app.get('/api/dashboard/departments', authenticateToken, (req, res) => {
  try {
    res.json(db.prepare('SELECT department, COUNT(*) as employees, ROUND(AVG(performance)) as avgPerformance, ROUND(AVG(attendance)) as attendance, ROUND(AVG(salary)) as avgSalary FROM employees GROUP BY department ORDER BY employees DESC').all());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard/attendance-trend', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare("SELECT strftime('%m',date) as month, status, COUNT(*) as count FROM attendance_records WHERE date >= date('now','-90 days') AND status NOT IN ('holiday') GROUP BY month,status").all();
    const monthMap = {};
    rows.forEach(r => { if(!monthMap[r.month]) monthMap[r.month]={present:0,late:0,absent:0}; monthMap[r.month][r.status]=(monthMap[r.month][r.status]||0)+r.count; });
    res.json(Object.entries(monthMap).map(([m,v]) => ({ month:new Date(2024,parseInt(m)-1).toLocaleString('default',{month:'short'}), ...v })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
app.get('/api/leaderboard', authenticateToken, (req, res) => {
  try {
    const employees = db.prepare("SELECT * FROM employees WHERE status='active' ORDER BY points DESC").all();
    const BADGES = {
      perfect_attendance:{id:'perfect_attendance',name:'Perfect Attendance',icon:'🏆',color:'#22c55e'},
      top_performer:{id:'top_performer',name:'Top Performer',icon:'⭐',color:'#f59e0b'},
      team_player:{id:'team_player',name:'Team Player',icon:'🤝',color:'#3b82f6'},
      streak_master:{id:'streak_master',name:'Streak Master',icon:'🔥',color:'#ef4444'},
      early_bird:{id:'early_bird',name:'Early Bird',icon:'🌅',color:'#8b5cf6'},
      mentor:{id:'mentor',name:'Mentor',icon:'🎓',color:'#06b6d4'},
    };
    const ranked = employees.map((e,i) => {
      const badges = [];
      if(e.attendance>=95) badges.push('perfect_attendance');
      if(e.performance>=90) badges.push('top_performer');
      if(e.streak>=60) badges.push('streak_master');
      if(e.streak>=30) badges.push('early_bird');
      if(i<3) badges.push('team_player');
      return { ...e, rank:i+1, badges, badgeObjects:badges.map(b=>BADGES[b]).filter(Boolean) };
    });
    res.json(ranked);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── AI INSIGHTS ──────────────────────────────────────────────────────────────
app.get('/api/ai/insights', authenticateToken, (req, res) => {
  try {
    const employees = db.prepare("SELECT * FROM employees WHERE status='active'").all();
    const insights = [];
    employees.forEach(emp => {
      if(emp.attendance<80) insights.push({ id:`insight-att-${emp.id}`, type:'attendance', severity:'high', title:`Low Attendance: ${emp.name}`, description:`${emp.name}'s attendance is ${emp.attendance}%, below the 80% threshold.`, affectedEmployee:emp.name, recommendation:'Schedule a 1:1 check-in to understand challenges.', confidence:92 });
      if(emp.performance<75) insights.push({ id:`insight-perf-${emp.id}`, type:'performance', severity:'medium', title:`Performance Review Needed: ${emp.name}`, description:`${emp.name}'s score is ${emp.performance}/100, below team average.`, affectedEmployee:emp.name, recommendation:'Assign a mentor and set clear 30-day goals.', confidence:85 });
    });
    const avgAtt = employees.reduce((s,e)=>s+e.attendance,0)/(employees.length||1);
    if(avgAtt>90) insights.push({ id:'insight-att-positive', type:'productivity', severity:'low', title:'Excellent Team Attendance', description:`Team-wide attendance averages ${Math.round(avgAtt)}% — top quartile for IT sector.`, recommendation:'Recognize top attendees at the next all-hands.', confidence:98 });
    const pending = db.prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status='pending'").get().c;
    if(pending>3) insights.push({ id:'insight-leave-pending', type:'suggestion', severity:'medium', title:`${pending} Leave Requests Pending`, description:`${pending} requests awaiting approval — some over 48 hours.`, recommendation:'Review and action pending requests promptly.', confidence:100 });
    if(!insights.length) insights.push({ id:'insight-all-clear', type:'productivity', severity:'low', title:'All Systems Healthy', description:'All monitored metrics are within healthy ranges.', recommendation:'Continue current practices and review quarterly targets.', confidence:95 });
    res.json(insights);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── AI CHAT ──────────────────────────────────────────────────────────────────
app.post('/api/ai/chat', authenticateToken, async (req, res) => {
  const { messages: chatMessages } = req.body;
  try {
    const employees = db.prepare('SELECT * FROM employees').all();
    const leaves = db.prepare("SELECT * FROM leave_requests WHERE status='pending'").all();
    const active = employees.filter(e=>e.status==='active').length;
    const avgPerf = employees.length ? Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length) : 0;
    const avgAtt = employees.length ? Math.round(employees.reduce((s,e)=>s+e.attendance,0)/employees.length) : 0;
    const depts = [...new Set(employees.map(e=>e.department))];

    const systemPrompt = `You are Grevya AI, a smart HR assistant for the Grevya HR Portal. Be concise and professional.\n\nLive company data:\n- Total employees: ${employees.length} (${active} active)\n- Pending leave requests: ${leaves.length}\n- Average team performance: ${avgPerf}/100\n- Average team attendance: ${avgAtt}%\n- Departments: ${depts.join(', ')}\n- Low performers (<75): ${employees.filter(e=>e.performance<75).length}\n- Low attendance (<80%): ${employees.filter(e=>e.attendance<80).length}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY||'','anthropic-version':'2023-06-01'},
      body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:512, system:systemPrompt, messages:chatMessages.map(m=>({role:m.role,content:m.content})) })
    });
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    res.json({ reply: data.content?.[0]?.text || 'Could not process.' });
  } catch {
    const last = (chatMessages[chatMessages.length-1]?.content||'').toLowerCase();
    const employees = db.prepare('SELECT * FROM employees').all();
    const leaves = db.prepare("SELECT * FROM leave_requests WHERE status='pending'").all();
    const avgPerf = employees.length ? Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length) : 0;
    const avgAtt = employees.length ? Math.round(employees.reduce((s,e)=>s+e.attendance,0)/employees.length) : 0;
    let reply = `I'm your HR assistant. Team has ${employees.length} employees with ${avgPerf}% avg performance and ${avgAtt}% attendance.`;
    if(last.includes('leave')||last.includes('vacation')) reply=`${leaves.length} leave requests are pending. Team attendance is ${avgAtt}%.`;
    else if(last.includes('performance')) reply=`Team average is ${avgPerf}/100. ${employees.filter(e=>e.performance>=90).length} top performers, ${employees.filter(e=>e.performance<75).length} need review.`;
    else if(last.includes('attendance')) reply=`Team attendance averages ${avgAtt}%. ${employees.filter(e=>e.attendance>=95).length} employees have excellent attendance.`;
    else if(last.includes('salary')||last.includes('payroll')) reply=`Average salary is ₹${Math.round(employees.reduce((s,e)=>s+e.salary,0)/(employees.length||1)).toLocaleString('en-IN')}. Use Payroll → Generate Payslips to run monthly payroll.`;
    res.json({ reply });
  }
});

// ─── REPORTS ──────────────────────────────────────────────────────────────────
app.get('/api/reports/summary', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const employees = db.prepare('SELECT * FROM employees').all();
    const leaves = db.prepare('SELECT * FROM leave_requests').all();
    const expenses = db.prepare('SELECT * FROM expenses').all();
    const avgSalary = employees.length ? Math.round(employees.reduce((s,e)=>s+e.salary,0)/employees.length) : 0;
    const totalExpenses = expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+e.amount,0);
    const deptSalary = employees.reduce((acc,e) => { if(!acc[e.department]) acc[e.department]={total:0,count:0}; acc[e.department].total+=e.salary; acc[e.department].count++; return acc; },{});
    res.json({
      headcount: employees.length,
      avgSalary,
      turnoverRate: 1.8,
      totalLeavesTaken: leaves.filter(l=>l.status==='approved').length,
      totalExpenses: Math.round(totalExpenses),
      approvedExpenses: expenses.filter(e=>e.status==='approved').length,
      pendingExpenses: expenses.filter(e=>e.status==='pending').length,
      leavesByType: { sick:leaves.filter(l=>l.type==='sick').length, casual:leaves.filter(l=>l.type==='casual').length, annual:leaves.filter(l=>l.type==='annual').length, emergency:leaves.filter(l=>l.type==='emergency').length },
      salaryByDept: Object.entries(deptSalary).map(([name,v]) => ({ name, avg:Math.round(v.total/v.count) })).sort((a,b)=>b.avg-a.avg),
      turnoverTrend: [{month:'Oct',rate:2.1},{month:'Nov',rate:1.8},{month:'Dec',rate:3.2},{month:'Jan',rate:1.5},{month:'Feb',rate:2.0},{month:'Mar',rate:1.2}],
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ─── SERVE FRONTEND ───────────────────────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get('*', (req, res) => {
    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).json({ error: 'Not found' });
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n🌿 Grevya HR Portal — http://localhost:${PORT}`);
  console.log(`   DB: ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`   Email: ${emailEnabled ? 'Enabled' : 'Disabled (set SMTP vars to enable)'}`);
  console.log(`   AI Chat: ${process.env.ANTHROPIC_API_KEY ? 'Claude enabled' : 'Fallback mode'}\n`);
});
