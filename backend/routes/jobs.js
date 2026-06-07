const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId } = require('../utils/helpers');

router.get('/', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) return res.json(await supabaseHr.getJobs());
    res.json(db.prepare('SELECT * FROM jobs ORDER BY posted DESC').all());
  }
  catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    const { title, department, type, location, openings } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    if (supabaseDb.enabled && req.user.supabase) return res.status(201).json(await supabaseHr.createJob(req.user, req.body));
    const id = genId('job');
    db.prepare('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)').run(id,title,department,type,location,openings||1,new Date().toISOString().split('T')[0],'active');
    res.status(201).json(db.prepare('SELECT * FROM jobs WHERE id=?').get(id));
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    const { status, title } = req.body;
    if (supabaseDb.enabled && req.user.supabase) {
      const updated = await supabaseHr.updateJob(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Job not found' });
      return res.json(updated);
    }
    db.prepare('UPDATE jobs SET status=COALESCE(?,status), title=COALESCE(?,title) WHERE id=?').run(status,title,req.params.id);
    res.json(db.prepare('SELECT * FROM jobs WHERE id=?').get(req.params.id));
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      await supabaseHr.deleteJob(req.params.id);
      return res.json({ message: 'Deleted' });
    }
    db.prepare('DELETE FROM jobs WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
