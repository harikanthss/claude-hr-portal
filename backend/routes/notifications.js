const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

const mapNotification = (row) => ({
  id: row.id,
  title: row.title,
  message: row.message,
  time: row.created_at,
  timestamp: row.created_at,
  type: row.type,
  isRead: row.is_read,
  read: row.is_read,
  userId: row.user_id,
});

router.get('/', authenticateToken, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) { const rows = await supabaseDb.queryAll('select * from public.notifications where user_id = $1 or user_id is null order by created_at desc limit 50', [req.user.id]); return res.json(rows.map(mapNotification)); } res.json(db.prepare('SELECT * FROM notifications WHERE (userId=? OR userId IS NULL) ORDER BY time DESC LIMIT 50').all(req.user.id)); } catch(err){res.status(500).json({error:err.message});} });
router.put('/read-all', authenticateToken, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) { await supabaseDb.query('update public.notifications set is_read = true where user_id = $1 or user_id is null', [req.user.id]); return res.json({ok:true}); } db.prepare('UPDATE notifications SET isRead=1 WHERE userId=? OR userId IS NULL').run(req.user.id); res.json({ok:true}); } catch(err){res.status(500).json({error:err.message});} });
router.put('/:id/read', authenticateToken, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) { await supabaseDb.query('update public.notifications set is_read = true where id = $1 and (user_id = $2 or user_id is null)', [req.params.id, req.user.id]); return res.json({ok:true}); } db.prepare('UPDATE notifications SET isRead=1 WHERE id=?').run(req.params.id); res.json({ok:true}); } catch(err){res.status(500).json({error:err.message});} });
router.put('/mark-all-read', authenticateToken, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) { await supabaseDb.query('update public.notifications set is_read = true where user_id = $1 or user_id is null', [req.user.id]); return res.json({ok:true}); } db.prepare('UPDATE notifications SET isRead=1 WHERE userId=? OR userId IS NULL').run(req.user.id); res.json({ok:true}); } catch(err){res.status(500).json({error:err.message});} });
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      await supabaseDb.query('delete from public.notifications where id = $1 and (user_id = $2 or user_id is null)', [req.params.id, req.user.id]);
      return res.json({ message: 'Deleted' });
    }
    db.prepare('DELETE FROM notifications WHERE id=? AND (userId=? OR userId IS NULL)').run(req.params.id, req.user.id);
    res.json({ message: 'Deleted' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.delete('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      await supabaseDb.query('delete from public.notifications where is_read = true and (user_id = $1 or user_id is null)', [req.user.id]);
      return res.json({ message: 'Cleared read notifications' });
    }
    db.prepare('DELETE FROM notifications WHERE isRead=1 AND (userId=? OR userId IS NULL)').run(req.user.id);
    res.json({ message: 'Cleared read notifications' });
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
