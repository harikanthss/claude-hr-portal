const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireManagerOrAbove, isAdminOrHR, isDirectReport, scopedEmployeeIds } = require('../middleware/auth');
const { genId, logAudit, addNotification } = require('../utils/helpers');
const { sendEmail, sendEmailNotification, templates } = require('../config/email');
const { notifyProfiles, getManagerId, HR_ROLES } = require('../services/notifications');

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.getLeaveRequests(req.user, req.query));
    }
    let sql = 'SELECT * FROM leave_requests WHERE 1=1';
    const params = [];
    const allowedIds = scopedEmployeeIds(req.user);
    if (allowedIds && allowedIds.length === 0) return res.json([]);
    if (allowedIds) {
      sql += ` AND employeeId IN (${allowedIds.map(() => '?').join(',')})`;
      params.push(...allowedIds);
    }
    if (req.query.status) { sql += ' AND status=?'; params.push(req.query.status); }
    sql += ' ORDER BY appliedOn DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, async (req, res) => {
  const { type, startDate, endDate, days, reason } = req.body;
  if (!type || !startDate || !endDate || !days) return res.status(400).json({ error: 'Missing required fields' });
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const created = await supabaseHr.createLeaveRequest(req.user, req.body);
      addNotification(`Leave: ${req.user.name}`, `${req.user.name} applied for ${type} leave (${days} days).`, 'warning', null);
      const managerId = await getManagerId(req.user.id);
      const email = templates.leaveApplied(req.user.name, type, days, startDate);
      await notifyProfiles({
        event: 'leave_applied',
        title: `Leave request: ${req.user.name}`,
        message: `${req.user.name} applied for ${type} leave (${days} days).`,
        type: 'warning',
        link: '/leave',
        userIds: managerId ? [managerId] : [],
        roles: HR_ROLES,
        emailSubject: email.subject,
        emailHtml: email.html,
      });
      logAudit(req.user.id, req.user.name, 'create', 'leave_request', created.id, `Applied ${type} leave`, req.ip);
      return res.status(201).json({ id: created.id });
    }
    const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email);
    const id = genId('lr');
    db.prepare('INSERT INTO leave_requests (id,employeeId,employeeName,employeeAvatar,type,startDate,endDate,days,reason,status,appliedOn) VALUES (?,?,?,?,?,?,?,?,?,?,?)').run(id,req.user.id,req.user.name,emp?.avatar||'',type,startDate,endDate,days,reason,'pending',new Date().toISOString());
    addNotification(`Leave: ${req.user.name}`,`${req.user.name} applied for ${type} leave (${days} days).`,'warning',null);
    sendEmailNotification('harikanth.grevya@gmail.com', templates.leaveApplied(req.user.name, type, days, startDate));
    logAudit(req.user.id,req.user.name,'create','leave_request',id,`Applied ${type} leave`,req.ip);
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireManagerOrAbove, async (req, res) => {
  const { status, comments } = req.body;
  if (!['approved','rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const result = await supabaseHr.decideLeaveRequest(req.user, req.params.id, status, comments);
      if (result === null) return res.status(404).json({ error: 'Not found' });
      if (result === false) return res.status(403).json({ error: 'Managers can only approve direct reports' });
      addNotification(`Leave ${status}`, `Your ${result.type || 'leave'} request was ${status}.`, status === 'approved' ? 'success' : 'error', result.employeeId);
      if (result.email) {
        const template = status === 'approved'
          ? templates.leaveApproved(result.name, result.type, result.days, result.startDate)
          : templates.leaveRejected(result.name, result.type, result.days, comments);
        await notifyProfiles({
          event: status === 'approved' ? 'leave_approved' : 'leave_rejected',
          title: `Leave ${status}`,
          message: `Your ${result.type || 'leave'} request was ${status}.`,
          type: status === 'approved' ? 'success' : 'error',
          link: '/leave',
          userIds: [result.employeeId],
          emailSubject: template.subject,
          emailHtml: template.html,
        });
      }
      logAudit(req.user.id, req.user.name, status, 'leave_request', req.params.id, null, req.ip);
      return res.json({ message: `Leave ${status}` });
    }
    const lr = db.prepare('SELECT * FROM leave_requests WHERE id=?').get(req.params.id);
    if (!lr) return res.status(404).json({ error: 'Not found' });
    const target = db.prepare('SELECT id,email,managerId FROM employees WHERE id=?').get(lr.employeeId);
    if (!isAdminOrHR(req.user) && !isDirectReport(req.user, target)) {
      return res.status(403).json({ error: 'Managers can only approve direct reports' });
    }
    db.prepare('UPDATE leave_requests SET status=?,approvedBy=?,comments=? WHERE id=?').run(status,req.user.name,comments||null,req.params.id);
    if (status==='approved') db.prepare("UPDATE employees SET status='on_leave' WHERE id=?").run(lr.employeeId);
    else db.prepare("UPDATE employees SET status='active' WHERE id=? AND status='on_leave'").run(lr.employeeId);
    const emp = db.prepare('SELECT email,name FROM employees WHERE id=?').get(lr.employeeId);
    if (emp) {
      const t = status==='approved' ? templates.leaveApproved(emp.name,lr.type,lr.days,lr.startDate) : templates.leaveRejected(emp.name,lr.type,lr.days,comments);
      sendEmailNotification(emp.email, t);
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
