const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, scopedEmployeeIds, requireManagerOrAbove } = require('../middleware/auth');
const { genId } = require('../utils/helpers');
const { notifyProfiles, getManagerId, HR_ROLES, genericTemplate } = require('../services/notifications');

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.getAttendance(req.user, req.query));
    }
    let sql = 'SELECT * FROM attendance_records WHERE 1=1';
    const params = [];
    const allowedIds = scopedEmployeeIds(req.user);
    if (allowedIds && allowedIds.length === 0) return res.json([]);
    if (req.query.employeeId) {
      if (allowedIds && !allowedIds.includes(String(req.query.employeeId))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      sql += ' AND employeeId=?';
      params.push(req.query.employeeId);
    } else if (allowedIds) {
      sql += ` AND employeeId IN (${allowedIds.map(() => '?').join(',')})`;
      params.push(...allowedIds);
    }
    if (req.query.month) {
      const m = String(req.query.month);
      const y = req.query.year || new Date().getFullYear();
      const formatted = m.includes('-') ? m : (String(y) + '-' + m.padStart(2, '0'));
      sql += " AND strftime('%Y-%m',date)=?";
      params.push(formatted);
    }
    sql += ' ORDER BY date DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/check-in', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.checkIn(req.user));
    }
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

router.post('/check-out', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.checkOut(req.user));
    }
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

router.get('/regularizations', authenticateToken, async (req, res) => {
  try {
    if (!supabaseDb.enabled || !req.user.supabase) return res.json([]);
    const params = [];
    const where = [];
    if (!HR_ROLES.includes(req.user.role)) {
      params.push(req.user.id);
      where.push(req.user.role === 'manager'
        ? `(ar.employee_id = $${params.length} or p.manager_id = $${params.length})`
        : `ar.employee_id = $${params.length}`);
    }
    if (req.query.status) {
      params.push(req.query.status);
      where.push(`ar.status = $${params.length}`);
    }
    const rows = await supabaseDb.queryAll(
      `
      select ar.*, p.full_name as employee_name, p.avatar as employee_avatar
      from public.attendance_regularizations ar
      join public.profiles p on p.id = ar.employee_id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      order by ar.created_at desc
      `,
      params,
    );
    return res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/regularizations', authenticateToken, async (req, res) => {
  try {
    if (!supabaseDb.enabled || !req.user.supabase) return res.status(501).json({ error: 'Supabase attendance regularization is required' });
    const { attendance_id: attendanceId, requested_in: requestedIn, requested_out: requestedOut, reason } = req.body;
    if (!requestedIn || !requestedOut || !reason) return res.status(400).json({ error: 'Requested in, requested out, and reason are required' });
    const row = await supabaseDb.queryOne(
      `
      insert into public.attendance_regularizations (attendance_id, employee_id, requested_in, requested_out, reason)
      values ($1, $2, $3, $4, $5)
      returning *
      `,
      [attendanceId || null, req.user.id, requestedIn, requestedOut, reason],
    );
    const managerId = await getManagerId(req.user.id);
    const email = genericTemplate('Attendance regularization submitted', `${req.user.name} submitted an attendance regularization request.`);
    await notifyProfiles({
      event: 'attendance_regularization_submitted',
      title: 'Attendance regularization submitted',
      message: `${req.user.name} submitted an attendance regularization request.`,
      type: 'warning',
      userIds: managerId ? [managerId] : [],
      roles: HR_ROLES,
      emailSubject: email.subject,
      emailHtml: email.html,
    });
    return res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/regularizations/:id', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    if (!supabaseDb.enabled || !req.user.supabase) return res.status(501).json({ error: 'Supabase attendance regularization is required' });
    const status = req.body.status || (req.body.approved ? 'approved' : 'rejected');
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
    const request = await supabaseDb.queryOne(
      `
      select ar.*, p.full_name, p.email, p.manager_id
      from public.attendance_regularizations ar
      join public.profiles p on p.id = ar.employee_id
      where ar.id = $1
      `,
      [req.params.id],
    );
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (!HR_ROLES.includes(req.user.role) && !(req.user.role === 'manager' && request.manager_id === req.user.id)) {
      return res.status(403).json({ error: 'Managers can only decide direct reports' });
    }
    await supabaseDb.query(
      `
      update public.attendance_regularizations
      set status = $2, approver_id = $3, decided_at = now()
      where id = $1
      `,
      [req.params.id, status, req.user.id],
    );
    if (status === 'approved' && request.attendance_id && request.requested_in && request.requested_out) {
      const hours = (new Date(request.requested_out).getTime() - new Date(request.requested_in).getTime()) / 3600000;
      await supabaseDb.query(
        `
        update public.attendance_records
        set clock_in = $1, clock_out = $2, total_hours = $3, is_incomplete = false
        where id = $4
        `,
        [request.requested_in, request.requested_out, Math.round(hours * 10) / 10, request.attendance_id],
      );
    }
    const email = genericTemplate(`Attendance regularization ${status}`, `Your attendance regularization request was ${status}.`);
    await notifyProfiles({
      event: `attendance_regularization_${status}`,
      title: `Attendance regularization ${status}`,
      message: `Your attendance regularization request was ${status}.`,
      type: status === 'approved' ? 'success' : 'error',
      userIds: [request.employee_id],
      emailSubject: email.subject,
      emailHtml: email.html,
    });
    return res.json({ message: `Regularization ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/work-mode-requests', authenticateToken, async (req, res) => {
  try {
    if (!supabaseDb.enabled || !req.user.supabase) return res.json([]);
    const params = [];
    const where = [];
    if (!HR_ROLES.includes(req.user.role)) {
      params.push(req.user.id);
      where.push(req.user.role === 'manager'
        ? `(wm.employee_id = $${params.length} or p.manager_id = $${params.length})`
        : `wm.employee_id = $${params.length}`);
    }
    if (req.query.status) {
      params.push(req.query.status);
      where.push(`wm.status = $${params.length}`);
    }
    const rows = await supabaseDb.queryAll(
      `
      select wm.*, p.full_name as employee_name, p.avatar as employee_avatar
      from public.work_mode_requests wm
      join public.profiles p on p.id = wm.employee_id
      ${where.length ? `where ${where.join(' and ')}` : ''}
      order by wm.created_at desc
      `,
      params,
    );
    return res.json(rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/work-mode-requests', authenticateToken, async (req, res) => {
  try {
    if (!supabaseDb.enabled || !req.user.supabase) return res.status(501).json({ error: 'Supabase work mode requests are required' });
    const { work_date: workDate, mode, reason } = req.body;
    if (!workDate) return res.status(400).json({ error: 'Work date is required' });
    const row = await supabaseDb.queryOne(
      `
      insert into public.work_mode_requests (employee_id, work_date, mode, reason)
      values ($1, $2, $3, $4)
      on conflict (employee_id, work_date)
      do update set mode = excluded.mode, reason = excluded.reason, status = 'pending', approver_id = null, decided_at = null
      returning *
      `,
      [req.user.id, workDate, mode || 'wfh', reason || ''],
    );
    const managerId = await getManagerId(req.user.id);
    const email = genericTemplate('WFH request submitted', `${req.user.name} submitted a ${row.mode} request for ${row.work_date}.`);
    await notifyProfiles({
      event: 'work_mode_request_submitted',
      title: 'WFH request submitted',
      message: `${req.user.name} submitted a ${row.mode} request for ${row.work_date}.`,
      type: 'warning',
      userIds: managerId ? [managerId] : [],
      roles: HR_ROLES,
      emailSubject: email.subject,
      emailHtml: email.html,
    });
    return res.status(201).json(row);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/work-mode-requests/:id', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    if (!supabaseDb.enabled || !req.user.supabase) return res.status(501).json({ error: 'Supabase work mode requests are required' });
    const status = req.body.status || (req.body.approved ? 'approved' : 'rejected');
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
    const request = await supabaseDb.queryOne(
      `
      select wm.*, p.full_name, p.email, p.manager_id
      from public.work_mode_requests wm
      join public.profiles p on p.id = wm.employee_id
      where wm.id = $1
      `,
      [req.params.id],
    );
    if (!request) return res.status(404).json({ error: 'Not found' });
    if (!HR_ROLES.includes(req.user.role) && !(req.user.role === 'manager' && request.manager_id === req.user.id)) {
      return res.status(403).json({ error: 'Managers can only decide direct reports' });
    }
    await supabaseDb.query(
      `
      update public.work_mode_requests
      set status = $2, approver_id = $3, decided_at = now()
      where id = $1
      `,
      [req.params.id, status, req.user.id],
    );
    if (status === 'approved') {
      await supabaseDb.query(
        `
        insert into public.attendance_records (employee_id, work_date, status, work_mode, source)
        values ($1, $2, 'present', $3, 'api')
        on conflict (employee_id, work_date)
        do update set work_mode = excluded.work_mode, status = 'present'
        `,
        [request.employee_id, request.work_date, request.mode],
      );
    }
    const email = genericTemplate(`WFH request ${status}`, `Your ${request.mode} request for ${request.work_date} was ${status}.`);
    await notifyProfiles({
      event: `work_mode_request_${status}`,
      title: `WFH request ${status}`,
      message: `Your ${request.mode} request for ${request.work_date} was ${status}.`,
      type: status === 'approved' ? 'success' : 'error',
      userIds: [request.employee_id],
      emailSubject: email.subject,
      emailHtml: email.html,
    });
    return res.json({ message: `Work mode request ${status}` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
