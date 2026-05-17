const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification } = require('../utils/helpers');
const { sendEmail, templates } = require('../config/email');

router.get('/', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM leave_requests WHERE 1=1';
    const params = [];
    if (req.user.role === 'employee') { sql += ' AND employeeId=?'; params.push(req.user.id); }
    if (req.query.status) { sql += ' AND status=?'; params.push(req.query.status); }
    sql += ' ORDER BY appliedOn DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, (req, res) => {
  const { type, startDate, endDate, days, reason } = req.body;
  if (!type || !startDate || !endDate || !days) return res.status(400).json({ error: 'Missing required fields' });
  try {
    const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email);
    const id = genId('lr');
    db.prepare('INSERT INTO leave_requests (id,employeeId,employeeName,employeeAvatar,type,startDate,endDate,days,reason,status,appliedOn) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,req.user.id,req.user.name,emp?.avatar||'',type,startDate,endDate,days,reason,'pending',new Date().toISOString());
    addNotification(`Leave: ${req.user.name}`,`${req.user.name} applied for ${type} leave (${days} days).`,'warning',null);
    logAudit(req.user.id,req.user.name,'create','leave_request',id,`Applied ${type} leave`,req.ip);
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireManagerOrAbove, async (req, res) => {
  const { status, comments } = req.body;
  if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
  try {
    const lr = db.prepare('SELECT * FROM leave_requests WHERE id=?').get(req.params.id);
    if (!lr) return res.status(404).json({ error: 'Not found' });
    db.prepare('UPDATE leave_requests SET status=?,approvedBy=?,comments=? WHERE id=?').run(status,req.user.name,comments||null,req.params.id);
    if (status==='approved') db.prepare("UPDATE employees SET status='on_leave' WHERE id=?").run(lr.employeeId);
    else db.prepare("UPDATE employees SET status='active' WHERE id=? AND status='on_leave'").run(lr.employeeId);
    const emp = db.prepare('SELECT email,name FROM employees WHERE id=?').get(lr.employeeId);
    if (emp) {
      const t = status==='approved' ? templates.leaveApproved(emp.name,lr.type,lr.days,lr.startDate) : templates.leaveRejected(emp.name,lr.type,lr.days,comments);
      await sendEmail(emp.email, t.subject, t.html);
    }
    addNotification(`Leave ${status}`,`Your ${lr.type} leave was ${status}.`,status==='approved'?'success':'error',lr.employeeId);
    logAudit(req.user.id,req.user.name,status,'leave_request',req.params.id,null,req.ip);
    res.json({ message: `Leave ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, (req, res) => {
  try {
    const lr = db.prepare('SELECT * FROM leave_requests WHERE id=?').get(req.params.id);
    if (!lr) return res.status(404).json({ error: 'Not found' });
    if (lr.employeeId !== req.user.id && !['admin','hr_manager'].includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    if (lr.status !== 'pending') return res.status(400).json({ error: 'Can only cancel pending requests' });
    db.prepare('DELETE FROM leave_requests WHERE id=?').run(req.params.id);
    res.json({ message: 'Leave request cancelled' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
