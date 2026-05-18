const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { genId } = require('../utils/helpers');

router.get('/', authenticateToken, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM jobs ORDER BY posted DESC').all()); }
  catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { title, department, type, location, openings } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const id = genId('job');
    db.prepare('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)').run(id,title,department,type,location,openings||1,new Date().toISOString().split('T')[0],'active');
    res.status(201).json({ id });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { status, title } = req.body;
    db.prepare('UPDATE jobs SET status=COALESCE(?,status), title=COALESCE(?,title) WHERE id=?').run(status,title,req.params.id);
    res.json({ message: 'Updated' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    db.prepare('DELETE FROM jobs WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
