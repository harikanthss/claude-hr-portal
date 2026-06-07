const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId } = require('../utils/helpers');
const { sendEmailNotification, templates } = require('../config/email');
const { notifyProfiles, REVIEW_ROLES } = require('../services/notifications');

router.get('/', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) return res.json(await supabaseHr.getCandidates());
    res.json(db.prepare('SELECT * FROM candidates ORDER BY appliedDate DESC').all());
  }
  catch(err) { res.status(500).json({ error: err.message }); }
});

router.post('/', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    const { name, email, phone, position, department, stage } = req.body;
    if (!name || !email) return res.status(400).json({ error: 'Name and email required' });
    if (supabaseDb.enabled && req.user.supabase) {
      const created = await supabaseHr.createCandidate(req.body);
      const emailTemplate = templates.recruitmentEvent(created.name, created.stage || 'applied');
      sendEmailNotification('harikanth.grevya@gmail.com', emailTemplate);
      await notifyProfiles({
        event: 'recruitment_candidate_created',
        title: 'Recruitment candidate added',
        message: `${created.name} was added to recruitment.`,
        type: 'info',
        roles: REVIEW_ROLES,
        emailSubject: emailTemplate.subject,
        emailHtml: emailTemplate.html,
      });
      return res.status(201).json(created);
    }
    const id = genId('cand');
    const avatar = name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
    db.prepare('INSERT INTO candidates (id,name,email,phone,position,department,stage,appliedDate,avatar,score) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id,name,email,phone||'',position,department,stage||'applied',new Date().toISOString().split('T')[0],avatar,0);
    const created = db.prepare('SELECT * FROM candidates WHERE id=?').get(id);
    sendEmailNotification('harikanth.grevya@gmail.com', templates.recruitmentEvent(created.name, created.stage));
    res.status(201).json(created);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    const { stage, score, note } = req.body;
    if (supabaseDb.enabled && req.user.supabase) {
      const updated = await supabaseHr.updateCandidate(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Candidate not found' });
      if (stage) {
        const emailTemplate = stage === 'hired' ? templates.candidateHired(updated.name) : templates.recruitmentEvent(updated.name, stage);
        sendEmailNotification('harikanth.grevya@gmail.com', emailTemplate);
        await notifyProfiles({
          event: stage === 'hired' ? 'recruitment_candidate_hired' : 'recruitment_stage_changed',
          title: stage === 'hired' ? 'Candidate hired' : 'Candidate stage changed',
          message: `${updated.name} moved to ${stage}.`,
          type: stage === 'hired' ? 'success' : 'info',
          roles: REVIEW_ROLES,
          emailSubject: emailTemplate.subject,
          emailHtml: emailTemplate.html,
        });
      }
      return res.json(updated);
    }
    db.prepare('UPDATE candidates SET stage=COALESCE(?,stage),score=COALESCE(?,score),note=COALESCE(?,note) WHERE id=?').run(stage,score,note,req.params.id);
    const updated = db.prepare('SELECT * FROM candidates WHERE id=?').get(req.params.id);
    if (stage) sendEmailNotification('harikanth.grevya@gmail.com', stage === 'hired' ? templates.candidateHired(updated.name) : templates.recruitmentEvent(updated.name, stage));
    res.json(updated);
  } catch(err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
