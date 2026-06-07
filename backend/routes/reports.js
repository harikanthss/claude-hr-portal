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
      const employees = await supabaseDb.queryAll(`
        select p.id, p.salary, d.name as department
        from public.profiles p
        left join public.departments d on d.id = p.department_id
        where p.status != 'inactive'
      `);
      const leaves = await supabaseDb.queryAll(`
        select lr.status, lt.name as type
        from public.leave_requests lr
        left join public.leave_types lt on lt.id = lr.leave_type_id
      `);
      const expenses = await supabaseDb.queryAll('select amount, status from public.expenses');

      const avgSalary = employees.length
        ? Math.round(employees.reduce((sum, emp) => sum + Number(emp.salary || 0), 0) / employees.length)
        : 0;
      const totalExpenses = expenses
        .filter((expense) => expense.status === 'approved')
        .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
      const deptSalary = employees.reduce((acc, emp) => {
        const department = emp.department || 'Unassigned';
        if (!acc[department]) acc[department] = { total: 0, count: 0 };
        acc[department].total += Number(emp.salary || 0);
        acc[department].count += 1;
        return acc;
      }, {});

      return res.json({
        headcount: employees.length,
        avgSalary,
        turnoverRate: 1.8,
        totalLeavesTaken: leaves.filter((leave) => leave.status === 'approved').length,
        totalExpenses: Math.round(totalExpenses),
        approvedExpenses: expenses.filter((expense) => expense.status === 'approved').length,
        pendingExpenses: expenses.filter((expense) => expense.status === 'pending').length,
        leavesByType: {
          sick: leaves.filter((leave) => leave.type === 'sick').length,
          casual: leaves.filter((leave) => leave.type === 'casual').length,
          annual: leaves.filter((leave) => leave.type === 'annual').length,
          emergency: leaves.filter((leave) => leave.type === 'emergency').length,
        },
        salaryByDept: Object.entries(deptSalary)
          .map(([name, value]) => ({ name, avg: Math.round(value.total / value.count) }))
          .sort((a, b) => b.avg - a.avg),
        turnoverTrend: [{month:'Oct',rate:2.1},{month:'Nov',rate:1.8},{month:'Dec',rate:3.2},{month:'Jan',rate:1.5},{month:'Feb',rate:2.0},{month:'Mar',rate:1.2}],
      });
    }

    const employees=db.prepare('SELECT * FROM employees').all(), leaves=db.prepare('SELECT * FROM leave_requests').all(), expenses=db.prepare('SELECT * FROM expenses').all();
    const avgSalary=employees.length?Math.round(employees.reduce((s,e)=>s+e.salary,0)/employees.length):0;
    const totalExpenses=expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+e.amount,0);
    const deptSalary=employees.reduce((acc,e)=>{if(!acc[e.department])acc[e.department]={total:0,count:0};acc[e.department].total+=e.salary;acc[e.department].count++;return acc;},{});
    res.json({ headcount:employees.length, avgSalary, turnoverRate:1.8, totalLeavesTaken:leaves.filter(l=>l.status==='approved').length, totalExpenses:Math.round(totalExpenses), approvedExpenses:expenses.filter(e=>e.status==='approved').length, pendingExpenses:expenses.filter(e=>e.status==='pending').length, leavesByType:{sick:leaves.filter(l=>l.type==='sick').length,casual:leaves.filter(l=>l.type==='casual').length,annual:leaves.filter(l=>l.type==='annual').length,emergency:leaves.filter(l=>l.type==='emergency').length}, salaryByDept:Object.entries(deptSalary).map(([name,v])=>({name,avg:Math.round(v.total/v.count)})).sort((a,b)=>b.avg-a.avg), turnoverTrend:[{month:'Oct',rate:2.1},{month:'Nov',rate:1.8},{month:'Dec',rate:3.2},{month:'Jan',rate:1.5},{month:'Feb',rate:2.0},{month:'Mar',rate:1.2}] });
  } catch(err){res.status(500).json({error:err.message});}
});
module.exports = router;
