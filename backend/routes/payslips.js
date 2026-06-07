const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireAdminOrHR, isAdminOrHR } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { sendEmailNotification, templates } = require('../config/email');
const { notifyProfiles, HR_ROLES } = require('../services/notifications');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.getPayslips(req.user, req.query));
    }
    let sql = 'SELECT * FROM payslips WHERE 1=1';
    const params = [];
    if (!isAdminOrHR(req.user)) {
      const employee = db.prepare('SELECT id FROM employees WHERE email = ?').get(req.user.email);
      sql += ' AND employeeId=?';
      params.push(employee?.id || req.user.id);
    } else if (req.query.employeeId) {
      sql += ' AND employeeId=?';
      params.push(req.query.employeeId);
    }
    if (req.query.month) { sql += ' AND month=?'; params.push(req.query.month); }
    if (req.query.year) { sql += ' AND year=?'; params.push(parseInt(req.query.year)); }
    sql += ' ORDER BY year DESC, month ASC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/generate', authenticateToken, requireAdminOrHR, async (req, res) => {
  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ error: 'Month and year required' });
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const { monthName, results } = await supabaseHr.generatePayslips(req.user, month, year);
      for (const result of results) {
        if (result.status !== 'generated') continue;
        addNotification('Payslip Ready', `Your payslip for ${monthName} ${year} is available.`, 'success', result.id);
        const payslipEmail = templates.payslip(result.name, monthName, year, result.net);
        await notifyProfiles({
          event: 'payslip_generated',
          title: 'Payslip ready',
          message: `Your payslip for ${monthName} ${year} is available.`,
          type: 'success',
          link: '/payslips',
          userIds: [result.id],
          emailSubject: payslipEmail.subject,
          emailHtml: payslipEmail.html,
        });
      }
      const payrollEmail = templates.payrollProcessed(monthName, year);
      await notifyProfiles({
        event: 'payroll_processed',
        title: 'Payroll processed',
        message: `Payroll for ${monthName} ${year} has been processed.`,
        type: 'success',
        link: '/payslips',
        roles: HR_ROLES,
        emailSubject: payrollEmail.subject,
        emailHtml: payrollEmail.html,
      });
      logAudit(req.user.id, req.user.name, 'generate_payslips', 'payroll', null, `${monthName} ${year}`, req.ip);
      return res.json({ message: `Payslips processed for ${monthName} ${year}`, results });
    }
    const employees = db.prepare("SELECT * FROM employees WHERE status='active'").all();
    const monthName = MONTHS[parseInt(month)-1];
    const results = [];
    for (const emp of employees) {
      const exists = db.prepare('SELECT id FROM payslips WHERE employeeId=? AND month=? AND year=?').get(emp.id, monthName, parseInt(year));
      if (exists) { results.push({ name: emp.name, status: 'already_exists' }); continue; }
      const { basic, hra, conveyance, medical, bonus, pf, tax, netSalary } = generatePayslipData(emp);
      const psId = genId('ps');
      db.prepare('INSERT INTO payslips (id,employeeId,month,year,basicSalary,hra,conveyance,medical,bonus,pf,tax,netSalary,generatedOn) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(psId,emp.id,monthName,parseInt(year),basic,hra,conveyance,medical,bonus,pf,tax,netSalary,new Date().toISOString());
      db.prepare('UPDATE employees SET points=points+50 WHERE id=?').run(emp.id);
      addNotification('Payslip Ready',`Your payslip for ${monthName} ${year} is available.`,'success',emp.id);
      const t = templates.payslip(emp.name, monthName, year, netSalary);
      sendEmailNotification(emp.email, t);
      results.push({ name: emp.name, status: 'generated', net: netSalary });
    }
    sendEmailNotification('harikanth.grevya@gmail.com', templates.payrollProcessed(monthName, year));
    logAudit(req.user.id,req.user.name,'generate_payslips','payroll',null,`${monthName} ${year}`,req.ip);
    res.json({ message: `Payslips processed for ${monthName} ${year}`, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
