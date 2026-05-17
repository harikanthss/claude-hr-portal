const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, requireAdminOrHR, (req, res) => { try { res.json(db.prepare('SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?').all(parseInt(req.query.limit||'100'))); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
