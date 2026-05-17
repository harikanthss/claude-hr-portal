const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, (req, res) => { try { let sql='SELECT * FROM expenses WHERE 1=1'; const params=[]; if(req.user.role==='employee'){sql+=' AND employeeId=?';params.push(req.user.id);} if(req.query.status){sql+=' AND status=?';params.push(req.query.status);} sql+=' ORDER BY submittedOn DESC'; res.json(db.prepare(sql).all(...params)); } catch(err){res.status(500).json({error:err.message});} });
router.post('/', authenticateToken, (req, res) => { try { const{category,amount,description,date}=req.body; if(!category||!amount) return res.status(400).json({error:'Category and amount required'}); const emp=db.prepare('SELECT * FROM employees WHERE email=?').get(req.user.email); const id=genId('exp'); db.prepare('INSERT INTO expenses (id,employeeId,employeeName,employeeAvatar,category,amount,description,date,status,submittedOn) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,req.user.id,req.user.name,emp?.avatar||'',category,parseFloat(amount),description||'',date||new Date().toISOString().split('T')[0],'pending',new Date().toISOString()); addNotification('Expense Submitted',`${req.user.name} submitted ₹${amount} ${category}.`,'info',null); res.status(201).json({id}); } catch(err){res.status(500).json({error:err.message});} });
router.put('/:id', authenticateToken, requireManagerOrAbove, (req, res) => { try { const{status,comments}=req.body; const exp=db.prepare('SELECT * FROM expenses WHERE id=?').get(req.params.id); if(!exp) return res.status(404).json({error:'Not found'}); db.prepare('UPDATE expenses SET status=?,approvedBy=?,comments=? WHERE id=?').run(status,req.user.name,comments||null,req.params.id); addNotification(`Expense ${status}`,`Your ₹${exp.amount} ${exp.category} claim was ${status}.`,status==='approved'?'success':'error',exp.employeeId); res.json({message:`Expense ${status}`}); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
