const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { genId } = require('../utils/helpers');

router.get('/', authenticateToken, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM candidates ORDER BY appliedDate DESC').all()); }
  catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { name, email, phone, position, department, stage } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    const id = genId('cand');
    const avatar = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    db.prepare('INSERT INTO candidates (id,name,email,phone,position,department,stage,appliedDate,avatar,score) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,name,email,phone||'',position,department,stage||'applied',new Date().toISOString().split('T')[0],avatar,0);
    res.status(201).json({ id });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const { stage, score, note } = req.body;
    db.prepare('UPDATE candidates SET stage=COALESCE(?,stage),score=COALESCE(?,score),note=COALESCE(?,note) WHERE id=?').run(stage,score,note,req.params.id);
    res.json({ message: 'Updated' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
