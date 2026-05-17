const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, (req, res) => { try { let sql='SELECT * FROM shifts WHERE 1=1'; const params=[]; if(req.query.week){sql+=' AND date LIKE ?';params.push(`${req.query.week}%`);} if(req.user.role==='employee'){sql+=' AND employeeId=?';params.push(req.user.id);} sql+=' ORDER BY date,startTime'; res.json(db.prepare(sql).all(...params)); } catch(err){res.status(500).json({error:err.message});} });
router.post('/', authenticateToken, requireAdminOrHR, (req, res) => { try { const{employeeId,employeeName,date,shiftType,startTime,endTime,notes}=req.body; const id=genId('sh'); db.prepare('INSERT INTO shifts (id,employeeId,employeeName,date,shiftType,startTime,endTime,status,notes,createdBy) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,employeeId,employeeName,date,shiftType||'morning',startTime,endTime,'scheduled',notes||null,req.user.id); res.status(201).json({id}); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
