const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');
const { sendEmailNotification, templates } = require('../config/email');
const { notifyProfiles, REVIEW_ROLES, genericTemplate } = require('../services/notifications');

router.get('/jobs', authenticateToken, requireManagerOrAbove, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) return res.json(await supabaseHr.getJobs()); res.json(db.prepare('SELECT * FROM jobs ORDER BY posted DESC').all()); } catch(err){res.status(500).json({error:err.message});} });
router.post('/jobs', authenticateToken, requireAdminOrHR, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) return res.status(201).json(await supabaseHr.createJob(req.user, req.body)); const{title,department,type,location,openings}=req.body; const id=genId('job'); db.prepare('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)').run(id,title,department,type,location,openings||1,new Date().toISOString().split('T')[0],'active'); res.status(201).json(db.prepare('SELECT * FROM jobs WHERE id=?').get(id)); } catch(err){res.status(500).json({error:err.message});} });
router.get('/candidates', authenticateToken, requireManagerOrAbove, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) return res.json(await supabaseHr.getCandidates()); res.json(db.prepare('SELECT * FROM candidates ORDER BY appliedDate DESC').all()); } catch(err){res.status(500).json({error:err.message});} });
router.post('/candidates', authenticateToken, requireAdminOrHR, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) { const created = await supabaseHr.createCandidate(req.body); const email = templates.recruitmentEvent(created.name, created.stage || 'applied'); sendEmailNotification('harikanth.grevya@gmail.com', email); await notifyProfiles({ event: 'recruitment_candidate_created', title: 'Recruitment candidate added', message: `${created.name} was added to recruitment.`, type: 'info', roles: REVIEW_ROLES, emailSubject: email.subject, emailHtml: email.html }); return res.status(201).json(created); } const{name,email,phone,position,department,stage}=req.body; const id=genId('cand'); db.prepare('INSERT INTO candidates (id,name,email,phone,position,department,stage,appliedDate,avatar,score) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,name,email,phone||'',position,department,stage||'applied',new Date().toISOString().split('T')[0],name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2),0); const created = db.prepare('SELECT * FROM candidates WHERE id=?').get(id); sendEmailNotification('harikanth.grevya@gmail.com', templates.recruitmentEvent(created.name, created.stage)); res.status(201).json(created); } catch(err){res.status(500).json({error:err.message});} });
router.put('/candidates/:id', authenticateToken, requireAdminOrHR, async (req, res) => { try { if (supabaseDb.enabled && req.user.supabase) { const updated = await supabaseHr.updateCandidate(req.params.id, req.body); if (req.body.stage) { const email = req.body.stage === 'hired' ? templates.candidateHired(updated.name) : templates.recruitmentEvent(updated.name, req.body.stage); sendEmailNotification('harikanth.grevya@gmail.com', email); await notifyProfiles({ event: req.body.stage === 'hired' ? 'recruitment_candidate_hired' : 'recruitment_stage_changed', title: req.body.stage === 'hired' ? 'Candidate hired' : 'Candidate stage changed', message: `${updated.name} moved to ${req.body.stage}.`, type: req.body.stage === 'hired' ? 'success' : 'info', roles: REVIEW_ROLES, emailSubject: email.subject, emailHtml: email.html }); } return res.json(updated); } const{stage,score,note}=req.body; db.prepare('UPDATE candidates SET stage=COALESCE(?,stage),score=COALESCE(?,score),note=COALESCE(?,note) WHERE id=?').run(stage,score,note,req.params.id); const updated = db.prepare('SELECT * FROM candidates WHERE id=?').get(req.params.id); if (stage) sendEmailNotification('harikanth.grevya@gmail.com', stage === 'hired' ? templates.candidateHired(updated.name) : templates.recruitmentEvent(updated.name, stage)); res.json(updated); } catch(err){res.status(500).json({error:err.message});} });

// Root-level routes for when mounted directly at /api/jobs or /api/candidates
router.get('/', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try { if (supabaseDb.enabled && req.user.supabase) return res.json(await supabaseHr.getJobs()); res.json(db.prepare('SELECT * FROM jobs ORDER BY posted DESC').all()); }
  catch(err){res.status(500).json({error:err.message});}
});
router.post('/', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) return res.status(201).json(await supabaseHr.createJob(req.user, req.body));
    const{title,department,type,location,openings}=req.body;
    const id=genId('job');
    db.prepare('INSERT INTO jobs (id,title,department,type,location,openings,posted,status) VALUES (?,?,?,?,?,?,?,?)').run(id,title,department,type,location,openings||1,new Date().toISOString().split('T')[0],'active');
    res.status(201).json(db.prepare('SELECT * FROM jobs WHERE id=?').get(id));
  } catch(err){res.status(500).json({error:err.message});}
});

module.exports = router;
