const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/stats', authenticateToken, (req, res) => {
  try {
    const employees = db.prepare('SELECT * FROM employees').all();
    const leaves = db.prepare('SELECT * FROM leave_requests').all();
    const today = new Date().toISOString().split('T')[0];
    const presentToday = db.prepare("SELECT COUNT(*) as c FROM attendance_records WHERE date=? AND status='present'").get(today)?.c || 0;
    res.json({ totalEmployees:employees.length, activeEmployees:employees.filter(e=>e.status==='active').length, onLeave:employees.filter(e=>e.status==='on_leave').length, pendingLeaves:leaves.filter(l=>l.status==='pending').length, presentToday, avgPerformance:employees.length?Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length):0, avgAttendance:employees.length?Math.round(employees.reduce((s,e)=>s+e.attendance,0)/employees.length):0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/performance', authenticateToken, (req, res) => {
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  const employees = db.prepare('SELECT performance FROM employees').all();
  const base = employees.length ? Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length) : 80;
  res.json(months.map((month,i) => ({ month, score:Math.min(100,Math.max(60,Math.round(base+(i-3)*1.5+(Math.sin(i)*2)-5))), target:85 })));
});

router.get('/departments', authenticateToken, (req, res) => {
  try { res.json(db.prepare('SELECT department, COUNT(*) as employees, ROUND(AVG(performance)) as avgPerformance, ROUND(AVG(attendance)) as attendance, ROUND(AVG(salary)) as avgSalary FROM employees GROUP BY department ORDER BY employees DESC').all()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/attendance-trend', authenticateToken, (req, res) => {
  try {
    const rows = db.prepare("SELECT strftime('%m',date) as month, status, COUNT(*) as count FROM attendance_records WHERE date>=date('now','-90 days') AND status NOT IN ('holiday') GROUP BY month,status").all();
    const map = {};
    rows.forEach(r => { if(!map[r.month]) map[r.month]={present:0,late:0,absent:0}; map[r.month][r.status]=(map[r.month][r.status]||0)+r.count; });
    res.json(Object.entries(map).map(([m,v]) => ({ month:new Date(2024,parseInt(m)-1).toLocaleString('default',{month:'short'}), ...v })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
