const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/summary', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const employees = await supabaseDb.queryAll("select salary from public.profiles where status = 'active'");
      const totalMonthlySalary = employees.reduce((sum, emp) => sum + Number(emp.salary || 0), 0);
      const totalPF = employees.reduce((sum, emp) => sum + Math.round(Number(emp.salary || 0) * 0.5 * 0.12), 0);
      const totalESI = employees
        .filter((emp) => Number(emp.salary || 0) <= 21000)
        .reduce((sum, emp) => sum + Math.round(Number(emp.salary || 0) * 0.0075), 0);
      const totalPT = employees.length * 200;
      return res.json({
        employeeCount: employees.length,
        totalMonthlySalary,
        totalPF,
        totalESI,
        totalPT,
        esiEligible: employees.filter((emp) => Number(emp.salary || 0) <= 21000).length,
      });
    }

    const employees=db.prepare("SELECT * FROM employees WHERE status='active'").all();
    const totalPF=employees.reduce((s,e)=>s+Math.round(e.salary*0.5*0.12),0);
    const totalESI=employees.filter(e=>e.salary<=21000).reduce((s,e)=>s+Math.round(e.salary*0.0075),0);
    const totalPT=employees.length*200;
    res.json({ employeeCount:employees.length, totalMonthlySalary:employees.reduce((s,e)=>s+e.salary,0), totalPF, totalESI, totalPT, esiEligible:employees.filter(e=>e.salary<=21000).length });
  } catch(err){res.status(500).json({error:err.message});}
});
module.exports = router;
