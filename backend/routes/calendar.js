const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, (req, res) => { try { res.json(db.prepare('SELECT * FROM calendar_events ORDER BY date ASC').all()); } catch(err){res.status(500).json({error:err.message});} });
router.post('/', authenticateToken, (req, res) => { try { const{title,date,endDate,type,color,description}=req.body; if(!title||!date) return res.status(400).json({error:'Title and date required'}); const id=genId('ev'); db.prepare('INSERT INTO calendar_events (id,title,date,endDate,type,color,description,createdBy) VALUES (?,?,?,?,?,?,?,?)').run(id,title,date,endDate||null,type||'meeting',color||'#3b82f6',description||'',req.user.id); res.status(201).json({id}); } catch(err){res.status(500).json({error:err.message});} });
router.delete('/:id', authenticateToken, (req, res) => { try { db.prepare('DELETE FROM calendar_events WHERE id=?').run(req.params.id); res.json({message:'Deleted'}); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
