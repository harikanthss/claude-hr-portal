const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/jobs', authenticateToken, (req, res) => { try { res.json(db.prepare('SELECT * FROM jobs ORDER BY posted DESC').all()); } catch(err){res.status(500).json({error:err.message});} });
router.post('/jobs', authenticateToken, requireAdminOrHR, (req, res) => { try { const{title,department,type,location,openings}=req.body; const id=genId('job'); db.prepare('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)').run(id,title,department,type,location,openings||1,new Date().toISOString().split('T')[0],'active'); res.status(201).json({id}); } catch(err){res.status(500).json({error:err.message});} });
router.get('/candidates', authenticateToken, (req, res) => { try { res.json(db.prepare('SELECT * FROM candidates ORDER BY appliedDate DESC').all()); } catch(err){res.status(500).json({error:err.message});} });
router.post('/candidates', authenticateToken, requireAdminOrHR, (req, res) => { try { const{name,email,phone,position,department,stage}=req.body; const id=genId('cand'); db.prepare('INSERT INTO candidates (id,name,email,phone,position,department,stage,appliedDate,avatar,score) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,name,email,phone||'',position,department,stage||'applied',new Date().toISOString().split('T')[0],name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2),0); res.status(201).json({id}); } catch(err){res.status(500).json({error:err.message});} });
router.put('/candidates/:id', authenticateToken, requireAdminOrHR, (req, res) => { try { const{stage,score,note}=req.body; db.prepare('UPDATE candidates SET stage=COALESCE(?,stage),score=COALESCE(?,score),note=COALESCE(?,note) WHERE id=?').run(stage,score,note,req.params.id); res.json({message:'Updated'}); } catch(err){res.status(500).json({error:err.message});} });

// Root-level routes for when mounted directly at /api/jobs or /api/candidates
router.get('/', authenticateToken, (req, res) => {
  try { res.json(db.prepare('SELECT * FROM jobs ORDER BY posted DESC').all()); }
  catch(err){res.status(500).json({error:err.message});}
});
router.post('/', authenticateToken, requireAdminOrHR, (req, res) => {
  try {
    const{title,department,type,location,openings}=req.body;
    const id=genId('job');
    db.prepare('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)').run(id,title,department,type,location,openings||1,new Date().toISOString().split('T')[0],'active');
    res.status(201).json({id});
  } catch(err){res.status(500).json({error:err.message});}
});

module.exports = router;
