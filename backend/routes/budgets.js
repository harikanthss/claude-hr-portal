const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { genId } = require('../utils/helpers');

// Table created by database.js schema — no inline creation needed

router.get('/', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const rows = await supabaseDb.queryAll(
        `
        select b.*, d.name as department
        from public.department_budgets b
        join public.departments d on d.id = b.department_id
        order by b.year desc, b.month asc
        `,
      );
      return res.json(rows.map((b) => ({
        id: b.id,
        department: b.department,
        month: b.month,
        year: b.year,
        budgetAmount: Number(b.budget_amount || 0),
        spentAmount: Number(b.spent_amount || 0),
        actualSpent: Number(b.spent_amount || 0),
        createdBy: b.created_by,
        updatedAt: b.updated_at,
      })));
    }
    const budgets = db.prepare('SELECT * FROM department_budgets ORDER BY year DESC, month ASC').all();
    // Enrich with actual expense data
    const enriched = budgets.map(b => {
      const spent = db.prepare(
        "SELECT COALESCE(SUM(e.amount),0) as total FROM expenses e INNER JOIN employees emp ON e.employeeId=emp.id WHERE emp.department=? AND e.status='approved' AND strftime('%Y',e.date)=?"
      ).get(b.department, String(b.year));
      return { ...b, actualSpent: spent?.total || 0 };
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    const { department, month, year, budgetAmount } = req.body;
    if (!department || !month || !year || !budgetAmount) return res.status(400).json({ error: 'All fields required' });
    if (supabaseDb.enabled && req.user.supabase) {
      const dept = await supabaseDb.queryOne(
        'insert into public.departments (name) values ($1) on conflict (name) do update set name = excluded.name returning id',
        [department],
      );
      const row = await supabaseDb.queryOne(
        `
        insert into public.department_budgets (department_id, month, year, budget_amount, created_by)
        values ($1, $2, $3, $4, $5)
        on conflict (department_id, month, year)
        do update set budget_amount = excluded.budget_amount, updated_at = now()
        returning id
        `,
        [dept.id, month, parseInt(year), parseFloat(budgetAmount), req.user.id],
      );
      return res.status(201).json({ id: row.id });
    }
    const id = genId('bud');
    db.prepare('INSERT OR REPLACE INTO department_budgets (id,department,month,year,budgetAmount,createdBy,updatedAt) VALUES (?,?,?,?,?,?,?)').run(
      id, department, month, parseInt(year), parseFloat(budgetAmount), req.user.name, new Date().toISOString()
    );
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    const { budgetAmount } = req.body;
    if (supabaseDb.enabled && req.user.supabase) {
      await supabaseDb.query('update public.department_budgets set budget_amount = $1, updated_at = now() where id = $2', [parseFloat(budgetAmount), req.params.id]);
      return res.json({ message: 'Updated' });
    }
    db.prepare('UPDATE department_budgets SET budgetAmount=?,updatedAt=? WHERE id=?').run(
      parseFloat(budgetAmount), new Date().toISOString(), req.params.id
    );
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const year = Number(req.query.year || new Date().getFullYear());
      const rows = await supabaseDb.queryAll(
        `
        select
          d.name as department,
          coalesce(sum(b.budget_amount), 0) as budget,
          coalesce(sum(b.spent_amount), 0) as spent,
          count(distinct p.id)::int as headcount
        from public.departments d
        left join public.department_budgets b on b.department_id = d.id and b.year = $1
        left join public.profiles p on p.department_id = d.id and p.status = 'active'
        group by d.name
        order by d.name
        `,
        [year],
      );
      return res.json(rows.map((row) => ({
        department: row.department,
        budget: Number(row.budget || 0),
        spent: Number(row.spent || 0),
        headcount: row.headcount || 0,
        utilization: Number(row.budget) ? Math.round((Number(row.spent || 0) / Number(row.budget)) * 100) : 0,
      })));
    }
    const year = req.query.year || new Date().getFullYear();
    const depts = db.prepare('SELECT DISTINCT department FROM employees WHERE status!=?').all('inactive').map((d) => d.department);
    const summary = depts.map(dept => {
      const budgetRow = db.prepare('SELECT SUM(budgetAmount) as total FROM department_budgets WHERE department=? AND year=?').get(dept, parseInt(year ));
      const spentRow = db.prepare("SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE employeeId IN (SELECT id FROM employees WHERE department=?) AND status='approved'").get(dept);
      const headcount = db.prepare("SELECT COUNT(*) as c FROM employees WHERE department=? AND status='active'").get(dept);
      return {
        department: dept,
        budget: budgetRow?.total || 0,
        spent: spentRow?.total || 0,
        headcount: headcount?.c || 0,
        utilization: budgetRow?.total ? Math.round((spentRow?.total / budgetRow?.total) * 100) : 0,
      };
    });
    res.json(summary);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
