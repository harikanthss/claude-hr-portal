const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/summary', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const employees=db.prepare('SELECT * FROM employees').all(), leaves=db.prepare('SELECT * FROM leave_requests').all(), expenses=db.prepare('SELECT * FROM expenses').all();
    const avgSalary=employees.length?Math.round(employees.reduce((s,e)=>s+e.salary,0)/employees.length):0;
    const totalExpenses=expenses.filter(e=>e.status==='approved').reduce((s,e)=>s+e.amount,0);
    const deptSalary=employees.reduce((acc,e)=>{if(!acc[e.department])acc[e.department]={total:0,count:0};acc[e.department].total+=e.salary;acc[e.department].count++;return acc;},{});
    res.json({ headcount:employees.length, avgSalary, turnoverRate:1.8, totalLeavesTaken:leaves.filter(l=>l.status==='approved').length, totalExpenses:Math.round(totalExpenses), approvedExpenses:expenses.filter(e=>e.status==='approved').length, pendingExpenses:expenses.filter(e=>e.status==='pending').length, leavesByType:{sick:leaves.filter(l=>l.type==='sick').length,casual:leaves.filter(l=>l.type==='casual').length,annual:leaves.filter(l=>l.type==='annual').length,emergency:leaves.filter(l=>l.type==='emergency').length}, salaryByDept:Object.entries(deptSalary).map(([name,v])=>({name,avg:Math.round(v.total/v.count)})).sort((a,b)=>b.avg-a.avg), turnoverTrend:[{month:'Oct',rate:2.1},{month:'Nov',rate:1.8},{month:'Dec',rate:3.2},{month:'Jan',rate:1.5},{month:'Feb',rate:2.0},{month:'Mar',rate:1.2}] });
  } catch(err){res.status(500).json({error:err.message});}
});
module.exports = router;
