const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { sendEmail, templates } = require('../config/email');
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

router.get('/', authenticateToken, (req, res) => {
  try {
    let sql = 'SELECT * FROM payslips WHERE 1=1';
    const params = [];
    if (req.user.role==='employee') { sql+=' AND employeeId=?'; params.push(req.user.id); }
    else if (req.query.employeeId) { sql+=' AND employeeId=?'; params.push(req.query.employeeId); }
    sql += ' ORDER BY year DESC, month ASC';
    res.json(db.prepare(sql).all(...params));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/generate', authenticateToken, requireAdminOrHR, async (req, res) => {
  const { month, year } = req.body;
  if (!month || !year) return res.status(400).json({ error: 'Month and year required' });
  try {
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
      await sendEmail(emp.email, t.subject, t.html);
      results.push({ name: emp.name, status: 'generated', net: netSalary });
    }
    logAudit(req.user.id,req.user.name,'generate_payslips','payroll',null,`${monthName} ${year}`,req.ip);
    res.json({ message: `Payslips processed for ${monthName} ${year}`, results });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
