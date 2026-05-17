const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, (req, res) => { try { res.json(db.prepare('SELECT * FROM notifications WHERE (userId=? OR userId IS NULL) ORDER BY time DESC LIMIT 50').all(req.user.id)); } catch(err){res.status(500).json({error:err.message});} });
router.put('/read-all', authenticateToken, (req, res) => { try { db.prepare('UPDATE notifications SET isRead=1 WHERE userId=? OR userId IS NULL').run(req.user.id); res.json({ok:true}); } catch(err){res.status(500).json({error:err.message});} });
router.put('/:id/read', authenticateToken, (req, res) => { try { db.prepare('UPDATE notifications SET isRead=1 WHERE id=?').run(req.params.id); res.json({ok:true}); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
