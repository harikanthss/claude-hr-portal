const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { genId, logAudit, addNotification } = require('../utils/helpers');
const { sendEmail, templates } = require('../config/email');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, ''));
  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
    const obj = {};
    headers.forEach((h, i) => { obj[h] = vals[i] || ''; });
    return obj;
  }).filter(r => r.name && r.email);
}

router.post('/employees', authenticateToken, requireAdminOrHR, upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'CSV file required' });

  const text = req.file.buffer.toString('utf8');
  const rows = parseCSV(text);

  if (!rows.length) return res.status(400).json({ error: 'No valid rows found. Ensure CSV has name and email columns.' });

  const results = [];
  let created = 0, skipped = 0, failed = 0;

  for (const row of rows) {
    try {
      if (supabaseDb.enabled && req.user.supabase) {
        const exists = await supabaseDb.queryOne('select id from public.profiles where email = $1', [row.email.trim().toLowerCase()]);
        if (exists) {
          results.push({ name: row.name, email: row.email, status: 'skipped', reason: 'Email already exists' });
          skipped++;
          continue;
        }

        const createdEmployee = await supabaseHr.createEmployee({
          name: row.name,
          email: row.email,
          department: row.department || 'General',
          position: row.position || row.designation || 'Employee',
          salary: parseFloat(row.salary || row.ctc || '60000') || 60000,
          joinDate: row.join_date || row.joining_date || new Date().toISOString().split('T')[0],
          phone: row.phone || row.mobile || '',
          location: row.location || row.city || '',
        });
        logAudit(req.user.id, req.user.name, 'create', 'employee', createdEmployee.id, `Bulk import: ${row.name}`, req.ip);
        results.push({ name: row.name, email: row.email, status: 'created', inviteRequired: true });
        created++;
        continue;
      }

      const exists = db.prepare('SELECT id FROM users WHERE email=?').get(row.email);
      if (exists) { results.push({ name: row.name, email: row.email, status: 'skipped', reason: 'Email already exists' }); skipped++; continue; }

      const empId = genId('emp');
      const initials = row.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
      const tempPw = crypto.randomBytes(6).toString('hex');
      const salary = parseFloat(row.salary || row.ctc || '60000') || 60000;
      const role = (row.role || 'employee').toLowerCase();
      const validRole = ['admin','hr_manager','manager','employee'].includes(role) ? role : 'employee';

      db.prepare('INSERT INTO employees (id,name,email,department,position,salary,joinDate,status,avatar,phone,location,performance,attendance,points,streak,managerId) VALUES (?,?,?,?,?,?,?,?,?,?,?,80,95,0,0,?)').run(
        empId, row.name, row.email,
        row.department || 'General',
        row.position || row.designation || 'Employee',
        salary,
        row.join_date || row.joining_date || new Date().toISOString().split('T')[0],
        'active', initials,
        row.phone || row.mobile || '',
        row.location || row.city || '',
        null
      );

      db.prepare('INSERT INTO users (id,name,email,password,role,avatar) VALUES (?,?,?,?,?,?)').run(
        empId, row.name, row.email, bcrypt.hashSync(tempPw, 10), validRole, initials
      );

      const { subject, html } = templates.welcome(row.name, row.email, tempPw);
      await sendEmail(row.email, subject, html);

      logAudit(req.user.id, req.user.name, 'create', 'employee', empId, `Bulk import: ${row.name}`, req.ip);
      results.push({ name: row.name, email: row.email, status: 'created', tempPassword: tempPw });
      created++;
    } catch (e) {
      results.push({ name: row.name, email: row.email, status: 'failed', reason: e.message });
      failed++;
    }
  }

  addNotification('Bulk Import Complete', `${created} employees imported, ${skipped} skipped, ${failed} failed.`, 'info', null);
  logAudit(req.user.id, req.user.name, 'bulk_import', 'employees', null, `${created} created, ${skipped} skipped`, req.ip);
  res.json({ message: `Import complete: ${created} created, ${skipped} skipped, ${failed} failed`, results });
});

// Download CSV template
router.get('/template', authenticateToken, requireAdminOrHR, (req, res) => {
  const csv = [
    'name,email,department,position,salary,join_date,phone,location,role',
    'John Doe,john@company.com,Engineering,Software Engineer,75000,2024-04-01,+91 9876543210,Bangalore,employee',
    'Jane Smith,jane@company.com,Design,UI Designer,65000,2024-04-01,+91 9876543211,Mumbai,employee',
  ].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="employee-import-template.csv"');
  res.send(csv);
});

module.exports = router;
