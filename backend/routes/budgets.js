const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { genId } = require('../utils/helpers');

// Create budgets table if not exists
try {
  db.prepare(`CREATE TABLE IF NOT EXISTS department_budgets (
    id TEXT PRIMARY KEY, department TEXT NOT NULL, month TEXT NOT NULL, year INTEGER NOT NULL,
    budgetAmount REAL DEFAULT 0, spentAmount REAL DEFAULT 0,
    createdBy TEXT, updatedAt TEXT, UNIQUE(department, month, year)
  )`).run();
} catch {}

router.get('/', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const budgets = db.prepare('SELECT * FROM department_budgets ORDER BY year DESC, month ASC').all();
    // Enrich with actual expense data
    const enriched = budgets.map(b => {
      const spent = db.prepare(
        "SELECT COALESCE(SUM(amount),0) as total FROM expenses WHERE department=? AND status='approved' AND strftime('%Y',date)=?"
      ).get(b.department, String(b.year));
      return { ...b, actualSpent: spent.total };
    });
    res.json(enriched);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { department, month, year, budgetAmount } = req.body;
    if (!department || !month || !year || !budgetAmount) return res.status(400).json({ error: 'All fields required' });
    const id = genId('bud');
    db.prepare('INSERT OR REPLACE INTO department_budgets (id,department,month,year,budgetAmount,createdBy,updatedAt) VALUES (?,?,?,?,?,?,?)').run(
      id, department, month, parseInt(year), parseFloat(budgetAmount), req.user.name, new Date().toISOString()
    );
    res.status(201).json({ id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { budgetAmount } = req.body;
    db.prepare('UPDATE department_budgets SET budgetAmount=?,updatedAt=? WHERE id=?').run(
      parseFloat(budgetAmount), new Date().toISOString(), req.params.id
    );
    res.json({ message: 'Updated' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/summary', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
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
