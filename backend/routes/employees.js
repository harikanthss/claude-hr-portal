const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { genId, logAudit, addNotification } = require('../utils/helpers');
const { sendEmail, templates } = require('../config/email');

router.get('/', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM employees WHERE 1=1';
    const params = [];
    if (req.query.department) { sql += ' AND department=?'; params.push(req.query.department); }
    if (req.query.status) { sql += ' AND status=?'; params.push(req.query.status); }
    if (req.query.search) { sql += ' AND (name LIKE ? OR email LIKE ? OR position LIKE ?)'; const s=`%${req.query.search}%`; params.push(s,s,s); }
    sql += ' ORDER BY name ASC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireAdminOrHR, async (req, res) => {
  const { name, email, department, position, salary, joinDate, status, phone, location, managerId } = req.body;
  if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
  try {
    if (db.prepare('SELECT id FROM users WHERE email=?').get(email)) return res.status(400).json({ error: 'Email already exists' });
    const empId = genId('emp');
    const initials = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    const tempPw = crypto.randomBytes(6).toString('hex');
    const role = position?.toLowerCase().includes('manager') ? 'manager' : position?.toLowerCase().includes('hr') ? 'hr_manager' : 'employee';
    db.prepare('INSERT INTO employees (id,name,email,department,position,salary,joinDate,status,avatar,phone,location,performance,attendance,points,streak,managerId) VALUES (?,?,?,?,?,?,?,?,?,?,?,80,95,0,0,?)').run(empId,name,email,department||'',position||'',salary||0,joinDate||new Date().toISOString().split('T')[0],status||'active',initials,phone||'',location||'',managerId||null);
    db.prepare('INSERT INTO users (id,name,email,password,role,avatar) VALUES (?,?,?,?,?,?)').run(empId,name,email,bcrypt.hashSync(tempPw,12),role,initials);
    const obTasks = ['Send welcome email','Set up workstation','Create company email','Add to Slack','Introduce to team','Complete HR policy','Submit ID proof'];
    obTasks.forEach((label,i) => db.prepare('INSERT INTO onboarding_tasks (id,employeeId,employeeName,employeeAvatar,department,position,startDate,buddy,taskLabel,taskDueDay,taskAssignee,done) VALUES (?,?,?,?,?,?,?,?,?,?,?,0)').run(genId('ob'),empId,name,initials,department||'',position||'',joinDate||new Date().toISOString().split('T')[0],'HR',label,i,i<2?'IT':'HR'));
    logAudit(req.user.id,req.user.name,'create','employee',empId,`Created ${name}`,req.ip);
    addNotification('New Employee',`${name} joined ${department}.`,'info',null);
    const { subject, html } = templates.welcome(name, email, tempPw);
    await sendEmail(email, subject, html);
    res.status(201).json({ id: empId, name, email, tempPassword: tempPw });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Not found' });
    if (req.user.role==='employee' && emp.email!==req.user.email) return res.status(403).json({ error: 'Access denied' });
    const { name,email,department,position,salary,status,phone,location,managerId,bio } = req.body;
    db.prepare('UPDATE employees SET name=COALESCE(?,name),email=COALESCE(?,email),department=COALESCE(?,department),position=COALESCE(?,position),salary=COALESCE(?,salary),status=COALESCE(?,status),phone=COALESCE(?,phone),location=COALESCE(?,location),managerId=COALESCE(?,managerId),bio=COALESCE(?,bio) WHERE id=?').run(name,email,department,position,salary,status,phone,location,managerId,bio,req.params.id);
    if (name||email) db.prepare('UPDATE users SET name=COALESCE(?,name),email=COALESCE(?,email) WHERE id=?').run(name,email,req.params.id);
    logAudit(req.user.id,req.user.name,'update','employee',req.params.id,`Updated ${emp.name}`,req.ip);
    res.json(db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE id=?').get(req.params.id);
    if (!emp) return res.status(404).json({ error: 'Not found' });
    db.prepare("UPDATE employees SET status='inactive' WHERE id=?").run(req.params.id);
    logAudit(req.user.id,req.user.name,'deactivate','employee',req.params.id,`Deactivated ${emp.name}`,req.ip);
    res.json({ message: `${emp.name} deactivated` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Profile
router.get('/profile/me', authenticateToken, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email) || {}); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/profile/me', authenticateToken, (req, res) => {
  try {
    const { phone, location, bio } = req.body;
    db.prepare('UPDATE employees SET phone=COALESCE(?,phone),location=COALESCE(?,location),bio=COALESCE(?,bio) WHERE email=?').run(phone,location,bio,req.user.email);
    res.json(db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/profile/avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  try {
    const url = `/uploads/${req.file.filename}`;
    db.prepare('UPDATE employees SET avatar=? WHERE email=?').run(url, req.user.email);
    db.prepare('UPDATE users SET avatar=? WHERE id=?').run(url, req.user.id);
    res.json({ avatarUrl: url });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
