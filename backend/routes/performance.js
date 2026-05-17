const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, (req, res) => { try { let sql='SELECT * FROM performance_reviews WHERE 1=1'; const params=[]; if(req.user.role==='employee'){sql+=' AND employeeId=?';params.push(req.user.id);} else if(req.query.employeeId){sql+=' AND employeeId=?';params.push(req.query.employeeId);} sql+=' ORDER BY createdAt DESC'; res.json(db.prepare(sql).all(...params)); } catch(err){res.status(500).json({error:err.message});} });
router.post('/', authenticateToken, requireManagerOrAbove, (req, res) => { try { const{employeeId,period,technicalScore,communicationScore,leadershipScore,deliveryScore,innovationScore,teamworkScore,comments,goals}=req.body; if(!employeeId) return res.status(400).json({error:'Employee ID required'}); const overall=Math.round(((technicalScore||0)+(communicationScore||0)+(leadershipScore||0)+(deliveryScore||0)+(innovationScore||0)+(teamworkScore||0))/6); const id=genId('perf'); db.prepare('INSERT INTO performance_reviews (id,employeeId,reviewerId,period,technicalScore,communicationScore,leadershipScore,deliveryScore,innovationScore,teamworkScore,overallScore,comments,goals,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,employeeId,req.user.id,period||'',technicalScore||0,communicationScore||0,leadershipScore||0,deliveryScore||0,innovationScore||0,teamworkScore||0,overall,comments||'',goals||'','completed',new Date().toISOString(),new Date().toISOString()); db.prepare('UPDATE employees SET performance=?,points=points+25 WHERE id=?').run(overall,employeeId); addNotification('Performance Review',`Your review for ${period} is ready.`,'info',employeeId); res.status(201).json({id,overall}); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
