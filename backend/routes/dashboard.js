const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, isAdminOrHR, scopedEmployeeIds } = require('../middleware/auth');

function employeeScope(user, alias = '') {
  const ids = scopedEmployeeIds(user);
  if (!ids) return { clause: '', params: [] };
  if (ids.length === 0) return { clause: ' AND 1=0', params: [] };
  const prefix = alias ? `${alias}.` : '';
  return { clause: ` AND ${prefix}id IN (${ids.map(() => '?').join(',')})`, params: ids };
}

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const employeeWhere = isAdminOrHR(req.user)
        ? ''
        : req.user.role === 'manager'
          ? 'where id = $1 or manager_id = $1'
          : 'where id = $1';
      const params = isAdminOrHR(req.user) ? [] : [req.user.id];
      const employees = await supabaseDb.queryAll(`select status, performance_score, attendance_score from public.profiles ${employeeWhere}`, params);
      const pendingLeaves = await supabaseDb.queryOne(
        `
        select count(*)::int as count
        from public.leave_requests lr
        join public.profiles p on p.id = lr.employee_id
        where lr.status = 'pending'
        ${isAdminOrHR(req.user) ? '' : req.user.role === 'manager' ? 'and (lr.employee_id = $1 or p.manager_id = $1)' : 'and lr.employee_id = $1'}
        `,
        params,
      );
      const presentToday = await supabaseDb.queryOne(
        `
        select count(*)::int as count
        from public.attendance_records ar
        join public.profiles p on p.id = ar.employee_id
        where ar.work_date = current_date and ar.status = 'present'
        ${isAdminOrHR(req.user) ? '' : req.user.role === 'manager' ? 'and (ar.employee_id = $1 or p.manager_id = $1)' : 'and ar.employee_id = $1'}
        `,
        params,
      );
      return res.json({
        totalEmployees: employees.length,
        activeEmployees: employees.filter((e) => e.status === 'active').length,
        onLeave: employees.filter((e) => e.status === 'on_leave').length,
        pendingLeaves: pendingLeaves?.count || 0,
        presentToday: presentToday?.count || 0,
        avgPerformance: employees.length ? Math.round(employees.reduce((s, e) => s + e.performance_score, 0) / employees.length) : 0,
        avgAttendance: employees.length ? Math.round(employees.reduce((s, e) => s + e.attendance_score, 0) / employees.length) : 0,
      });
    }
    const scope = employeeScope(req.user);
    const employees = db.prepare(`SELECT * FROM employees WHERE 1=1${scope.clause}`).all(...scope.params);
    const leaves = db.prepare(`SELECT * FROM leave_requests WHERE 1=1${scope.clause.replace(/\bid\b/g, 'employeeId')}`).all(...scope.params);
    const today = new Date().toISOString().split('T')[0];
    const attScope = employeeScope(req.user);
    const presentToday = db.prepare(`SELECT COUNT(*) as c FROM attendance_records WHERE date=? AND status='present'${attScope.clause.replace(/\bid\b/g, 'employeeId')}`).get(today, ...attScope.params)?.c || 0;
    res.json({ totalEmployees:employees.length, activeEmployees:employees.filter(e=>e.status==='active').length, onLeave:employees.filter(e=>e.status==='on_leave').length, pendingLeaves:leaves.filter(l=>l.status==='pending').length, presentToday, avgPerformance:employees.length?Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length):0, avgAttendance:employees.length?Math.round(employees.reduce((s,e)=>s+e.attendance,0)/employees.length):0 });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/performance', authenticateToken, async (req, res) => {
  if (supabaseDb.enabled && req.user.supabase) {
    const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
    const params = isAdminOrHR(req.user) ? [] : [req.user.id];
    const where = isAdminOrHR(req.user) ? '' : req.user.role === 'manager' ? 'where id = $1 or manager_id = $1' : 'where id = $1';
    const rows = await supabaseDb.queryAll(`select performance_score from public.profiles ${where}`, params);
    const base = rows.length ? Math.round(rows.reduce((s, e) => s + e.performance_score, 0) / rows.length) : 80;
    return res.json(months.map((month,i) => ({ month, score:Math.min(100,Math.max(60,Math.round(base+(i-3)*1.5+(Math.sin(i)*2)-5))), target:85 })));
  }
  const months = ['Oct','Nov','Dec','Jan','Feb','Mar'];
  const scope = employeeScope(req.user);
  const employees = db.prepare(`SELECT performance FROM employees WHERE 1=1${scope.clause}`).all(...scope.params);
  const base = employees.length ? Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length) : 80;
  res.json(months.map((month,i) => ({ month, score:Math.min(100,Math.max(60,Math.round(base+(i-3)*1.5+(Math.sin(i)*2)-5))), target:85 })));
});

router.get('/departments', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const params = isAdminOrHR(req.user) ? [] : [req.user.id];
      const where = isAdminOrHR(req.user) ? '' : req.user.role === 'manager' ? 'where p.id = $1 or p.manager_id = $1' : 'where p.id = $1';
      const salarySelect = isAdminOrHR(req.user) ? ', round(avg(p.salary)) as "avgSalary"' : '';
      const rows = await supabaseDb.queryAll(
        `
        select d.name as department, count(*)::int as employees,
          round(avg(p.performance_score)) as "avgPerformance",
          round(avg(p.attendance_score)) as attendance
          ${salarySelect}
        from public.profiles p
        left join public.departments d on d.id = p.department_id
        ${where}
        group by d.name
        order by employees desc
        `,
        params,
      );
      return res.json(rows);
    }
    const scope = employeeScope(req.user);
    const select = isAdminOrHR(req.user)
      ? 'department, COUNT(*) as employees, ROUND(AVG(performance)) as avgPerformance, ROUND(AVG(attendance)) as attendance, ROUND(AVG(salary)) as avgSalary'
      : 'department, COUNT(*) as employees, ROUND(AVG(performance)) as avgPerformance, ROUND(AVG(attendance)) as attendance';
    res.json(db.prepare(`SELECT ${select} FROM employees WHERE 1=1${scope.clause} GROUP BY department ORDER BY employees DESC`).all(...scope.params));
  }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/attendance-trend', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const params = isAdminOrHR(req.user) ? [] : [req.user.id];
      const scope = isAdminOrHR(req.user) ? '' : req.user.role === 'manager' ? 'and (ar.employee_id = $1 or p.manager_id = $1)' : 'and ar.employee_id = $1';
      const rows = await supabaseDb.queryAll(
        `
        select to_char(ar.work_date, 'MM') as month, ar.status, count(*)::int as count
        from public.attendance_records ar
        join public.profiles p on p.id = ar.employee_id
        where ar.work_date >= current_date - interval '90 days'
          and ar.status <> 'holiday'
          ${scope}
        group by month, ar.status
        `,
        params,
      );
      const map = {};
      rows.forEach(r => { if(!map[r.month]) map[r.month]={present:0,late:0,absent:0}; map[r.month][r.status]=(map[r.month][r.status]||0)+r.count; });
      return res.json(Object.entries(map).map(([m,v]) => ({ month:new Date(2024,parseInt(m)-1).toLocaleString('default',{month:'short'}), ...v })));
    }
    const ids = scopedEmployeeIds(req.user);
    let sql = "SELECT strftime('%m',date) as month, status, COUNT(*) as count FROM attendance_records WHERE date>=date('now','-90 days') AND status NOT IN ('holiday')";
    const params = [];
    if (ids) {
      if (ids.length === 0) return res.json([]);
      sql += ` AND employeeId IN (${ids.map(() => '?').join(',')})`;
      params.push(...ids);
    }
    sql += ' GROUP BY month,status';
    const rows = db.prepare(sql).all(...params);
    const map = {};
    rows.forEach(r => { if(!map[r.month]) map[r.month]={present:0,late:0,absent:0}; map[r.month][r.status]=(map[r.month][r.status]||0)+r.count; });
    res.json(Object.entries(map).map(([m,v]) => ({ month:new Date(2024,parseInt(m)-1).toLocaleString('default',{month:'short'}), ...v })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
