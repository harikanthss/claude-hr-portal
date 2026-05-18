const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { genId } = require('../utils/helpers');

router.get('/', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM attendance_records WHERE 1=1';
    const params = [];
    if (req.query.employeeId) { sql += ' AND employeeId=?'; params.push(req.query.employeeId); }
    if (req.query.month) {
      const m = String(req.query.month);
      const y = req.query.year || new Date().getFullYear();
      const formatted = m.includes('-') ? m : (String(y) + '-' + m.padStart(2, '0'));
      sql += " AND strftime('%Y-%m',date)=?";
      params.push(formatted);
    }
    if (req.user.role === 'employee') { sql += ' AND employeeId=?'; params.push(req.user.id); }
    sql += ' ORDER BY date DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/check-in', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const existing = db.prepare('SELECT * FROM attendance_records WHERE employeeId=? AND date=?').get(req.user.id, today);
    if (existing && existing.checkIn) return res.status(400).json({ error: 'Already checked in today' });
    const checkIn = new Date().toTimeString().slice(0, 5);
    if (existing) {
      db.prepare('UPDATE attendance_records SET checkIn=?,status=? WHERE id=?').run(checkIn, 'present', existing.id);
    } else {
      db.prepare('INSERT INTO attendance_records (id,employeeId,date,checkIn,status) VALUES (?,?,?,?,?)').run(genId('att'), req.user.id, today, checkIn, 'present');
    }
    db.prepare('UPDATE employees SET streak=streak+1 WHERE id=?').run(req.user.id);
    res.json({ checkIn, date: today });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/check-out', authenticateToken, (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const record = db.prepare('SELECT * FROM attendance_records WHERE employeeId=? AND date=?').get(req.user.id, today);
    if (!record || !record.checkIn) return res.status(400).json({ error: 'Not checked in today' });
    if (record.checkOut) return res.status(400).json({ error: 'Already checked out' });
    const checkOut = new Date().toTimeString().slice(0, 5);
    const inParts = record.checkIn.split(':');
    const outParts = checkOut.split(':');
    const hours = Math.max(0, (parseInt(outParts[0]) * 60 + parseInt(outParts[1]) - parseInt(inParts[0]) * 60 - parseInt(inParts[1])) / 60);
    db.prepare('UPDATE attendance_records SET checkOut=?,hours=? WHERE id=?').run(checkOut, Math.round(hours * 10) / 10, record.id);
    if (hours >= 8) db.prepare('UPDATE employees SET points=points+10 WHERE id=?').run(req.user.id);
    res.json({ checkOut, hours: Math.round(hours * 10) / 10 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
