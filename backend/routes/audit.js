const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, requireAdminOrHR, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) { const rows = await supabaseDb.queryAll('select al.*, p.full_name as "userName" from public.audit_log al left join public.profiles p on p.id = al.actor_id order by al.at desc limit $1', [parseInt(req.query.limit||'100')]); return res.json(rows.map((r) => ({ id: r.id, userId: r.actor_id, userName: r.userName, action: r.action, resource: r.entity, resourceId: r.entity_id, details: r.diff?.details || null, ipAddress: r.ip_address, timestamp: r.at }))); } res.json(db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?').all(parseInt(req.query.limit||'100'))); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
