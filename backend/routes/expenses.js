const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireManagerOrAbove, isAdminOrHR, isDirectReport, scopedEmployeeIds } = require('../middleware/auth');
const { genId, addNotification } = require('../utils/helpers');
const { sendEmailNotification, templates } = require('../config/email');
const { notifyProfiles, getManagerId, HR_ROLES } = require('../services/notifications');

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.getExpenses(req.user, req.query));
    }
    let sql = 'SELECT * FROM expenses WHERE 1=1';
    const params = [];
    const allowedIds = scopedEmployeeIds(req.user);
    if (allowedIds && allowedIds.length === 0) return res.json([]);
    if (allowedIds) {
      sql += ` AND employeeId IN (${allowedIds.map(() => '?').join(',')})`;
      params.push(...allowedIds);
    }
    if (req.query.status) {
      sql += ' AND status=?';
      params.push(req.query.status);
    }
    sql += ' ORDER BY submittedOn DESC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;
    if (!category || !amount) return res.status(400).json({ error: 'Category and amount required' });
    if (supabaseDb.enabled && req.user.supabase) {
      const expense = await supabaseHr.createExpense(req.user, req.body);
      addNotification('Expense Submitted', `${req.user.name} submitted INR ${amount} ${category}.`, 'info', null);
      const managerId = await getManagerId(req.user.id);
      const email = templates.expenseSubmitted(req.user.name, amount, category);
      await notifyProfiles({
        event: 'expense_submitted',
        title: 'Expense submitted',
        message: `${req.user.name} submitted INR ${amount} ${category}.`,
        type: 'info',
        link: '/expenses',
        userIds: managerId ? [managerId] : [],
        roles: HR_ROLES,
        emailSubject: email.subject,
        emailHtml: email.html,
      });
      return res.status(201).json(expense);
    }
    const emp = db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email);
    const id = genId('exp');
    db.prepare('INSERT INTO expenses (id,employeeId,employeeName,employeeAvatar,category,amount,description,date,status,submittedOn) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .run(id, req.user.id, req.user.name, emp?.avatar || '', category, parseFloat(amount), description || '', date || new Date().toISOString().split('T')[0], 'pending', new Date().toISOString());
    addNotification('Expense Submitted', `${req.user.name} submitted INR ${amount} ${category}.`, 'info', null);
    sendEmailNotification('harikanth.grevya@gmail.com', templates.expenseSubmitted(req.user.name, amount, category));
    res.status(201).json(db.prepare('SELECT * FROM expenses WHERE id=?').get(id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    const { status, comments } = req.body;
    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ error: 'Status must be approved or rejected' });
    if (supabaseDb.enabled && req.user.supabase) {
      const result = await supabaseHr.decideExpense(req.user, req.params.id, status, comments);
      if (result === null) return res.status(404).json({ error: 'Not found' });
      if (result === false) return res.status(403).json({ error: 'Managers can only approve direct reports' });
      addNotification(`Expense ${status}`, `Your expense claim was ${status}.`, status === 'approved' ? 'success' : 'error', result.employeeId);
      const target = await supabaseDb.queryOne('select email, full_name from public.profiles where id = $1', [result.employeeId]);
      if (target) {
        const email = templates.expenseDecision(target.full_name, result.amount, result.category, status, comments);
        await notifyProfiles({
          event: status === 'approved' ? 'expense_approved' : 'expense_rejected',
          title: `Expense ${status}`,
          message: `Your expense claim was ${status}.`,
          type: status === 'approved' ? 'success' : 'error',
          link: '/expenses',
          userIds: [result.employeeId],
          emailSubject: email.subject,
          emailHtml: email.html,
        });
      }
      return res.json(result);
    }
    const exp = db.prepare('SELECT * FROM expenses WHERE id=?').get(req.params.id);
    if (!exp) return res.status(404).json({ error: 'Not found' });
    const target = db.prepare('SELECT id,email,managerId FROM employees WHERE id=?').get(exp.employeeId);
    if (!isAdminOrHR(req.user) && !isDirectReport(req.user, target)) {
      return res.status(403).json({ error: 'Managers can only approve direct reports' });
    }
    db.prepare('UPDATE expenses SET status=?,approvedBy=?,comments=? WHERE id=?')
      .run(status, req.user.name, comments || null, req.params.id);
    addNotification(`Expense ${status}`, `Your INR ${exp.amount} ${exp.category} claim was ${status}.`, status === 'approved' ? 'success' : 'error', exp.employeeId);
    const emp = db.prepare('SELECT email,name FROM employees WHERE id=?').get(exp.employeeId);
    if (emp) sendEmailNotification(emp.email, templates.expenseDecision(emp.name, exp.amount, exp.category, status, comments));
    res.json(db.prepare('SELECT * FROM expenses WHERE id=?').get(req.params.id));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
