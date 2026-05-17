const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, (req, res) => { try { let sql='SELECT * FROM documents WHERE 1=1'; const params=[]; if(req.query.category){sql+=' AND category=?';params.push(req.query.category);} if(req.user.role==='employee'){sql+=' AND (employeeId=? OR employeeId IS NULL)';params.push(req.user.id);} sql+=' ORDER BY uploadedAt DESC'; res.json(db.prepare(sql).all(...params)); } catch(err){res.status(500).json({error:err.message});} });
router.post('/', authenticateToken, upload.single('file'), (req, res) => { if(!req.file) return res.status(400).json({error:'No file'}); try { const{name,category,description,employeeId}=req.body; const id=genId('doc'); db.prepare('INSERT INTO documents (id,employeeId,name,type,category,filePath,fileSize,uploadedBy,uploadedAt,description) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,employeeId||req.user.id,name||req.file.originalname,req.file.mimetype,category||'general',`/uploads/${req.file.filename}`,req.file.size,req.user.name,new Date().toISOString(),description||''); res.status(201).json({id,path:`/uploads/${req.file.filename}`}); } catch(err){res.status(500).json({error:err.message});} });
router.delete('/:id', authenticateToken, requireAdminOrHR, (req, res) => { try { const doc=db.prepare('SELECT * FROM documents WHERE id=?').get(req.params.id); if(!doc) return res.status(404).json({error:'Not found'}); const fp=path.join(__dirname,'../uploads',path.basename(doc.filePath)); if(fs.existsSync(fp)) fs.unlinkSync(fp); db.prepare('DELETE FROM documents WHERE id=?').run(req.params.id); res.json({message:'Deleted'}); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
