const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireManagerOrAbove, isAdminOrHR, isDirectReport, scopedEmployeeIds } = require('../middleware/auth');
const { genId } = require('../utils/helpers');

function canManageShiftFor(user, employeeId) {
  if (isAdminOrHR(user)) return true;
  const target = db.prepare('SELECT id,email,managerId FROM employees WHERE id=?').get(employeeId);
  return isDirectReport(user, target);
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.getShifts(req.user, req.query));
    }
    let sql = 'SELECT * FROM shifts WHERE 1=1';
    const params = [];
    if (req.query.week) {
      sql += ' AND date LIKE ?';
      params.push(`${req.query.week}%`);
    }
    const allowedIds = scopedEmployeeIds(req.user);
    if (allowedIds && allowedIds.length === 0) return res.json([]);
    if (allowedIds) {
      sql += ` AND employeeId IN (${allowedIds.map(() => '?').join(',')})`;
      params.push(...allowedIds);
    }
    sql += ' ORDER BY date,startTime';
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    const { employeeId, employeeName, date, shiftType, startTime, endTime, notes } = req.body;
    if (!employeeId || !date) return res.status(400).json({ error: 'Employee and date required' });
    if (supabaseDb.enabled && req.user.supabase) {
      const shift = await supabaseHr.createShift(req.user, req.body);
      if (shift === false) return res.status(403).json({ error: 'Access denied' });
      return res.status(201).json(shift);
    }
    if (!canManageShiftFor(req.user, employeeId)) return res.status(403).json({ error: 'Access denied' });
    const id = genId('sh');
    const emp = db.prepare('SELECT name FROM employees WHERE id=?').get(employeeId);
    db.prepare('INSERT INTO shifts (id,employeeId,employeeName,date,shiftType,startTime,endTime,status,notes,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, employeeId, employeeName || emp?.name || '', date, shiftType || 'morning', startTime, endTime, 'scheduled', notes || null, req.user.id);
    res.status(201).json(db.prepare('SELECT * FROM shifts WHERE id=?').get(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const shift = await supabaseHr.updateShift(req.user, req.params.id, req.body);
      if (shift === null) return res.status(404).json({ error: 'Shift not found' });
      if (shift === false) return res.status(403).json({ error: 'Access denied' });
      return res.json(shift);
    }
    const shift = db.prepare('SELECT * FROM shifts WHERE id=?').get(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    if (!canManageShiftFor(req.user, shift.employeeId)) return res.status(403).json({ error: 'Access denied' });
    const { status, shiftType, startTime, endTime, notes } = req.body;
    db.prepare('UPDATE shifts SET status=COALESCE(?,status),shiftType=COALESCE(?,shiftType),startTime=COALESCE(?,startTime),endTime=COALESCE(?,endTime),notes=COALESCE(?,notes) WHERE id=?')
      .run(status, shiftType, startTime, endTime, notes, req.params.id);
    res.json(db.prepare('SELECT * FROM shifts WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const result = await supabaseHr.deleteShift(req.user, req.params.id);
      if (result === null) return res.status(404).json({ error: 'Shift not found' });
      if (result === false) return res.status(403).json({ error: 'Access denied' });
      return res.json({ message: 'Shift deleted' });
    }
    const shift = db.prepare('SELECT * FROM shifts WHERE id=?').get(req.params.id);
    if (!shift) return res.status(404).json({ error: 'Shift not found' });
    if (!canManageShiftFor(req.user, shift.employeeId)) return res.status(403).json({ error: 'Access denied' });
    db.prepare('DELETE FROM shifts WHERE id=?').run(req.params.id);
    res.json({ message: 'Shift deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
