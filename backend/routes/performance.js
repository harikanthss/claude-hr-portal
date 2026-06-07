const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireManagerOrAbove, isAdminOrHR, isDirectReport, scopedEmployeeIds } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { sendEmailNotification, templates } = require('../config/email');
const { notifyProfiles } = require('../services/notifications');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      return res.json(await supabaseHr.getPerformance(req.user, req.query));
    }
    let sql='SELECT * FROM performance_reviews WHERE 1=1';
    const params=[];
    const allowedIds = scopedEmployeeIds(req.user);
    if (allowedIds && allowedIds.length === 0) return res.json([]);
    if (req.query.employeeId) {
      if (allowedIds && !allowedIds.includes(String(req.query.employeeId))) {
        return res.status(403).json({ error: 'Access denied' });
      }
      sql+=' AND employeeId=?';
      params.push(req.query.employeeId);
    } else if (allowedIds) {
      sql += ` AND employeeId IN (${allowedIds.map(() => '?').join(',')})`;
      params.push(...allowedIds);
    }
    sql+=' ORDER BY createdAt DESC';
    res.json(db.prepare(sql).all(...params));
  } catch(err){res.status(500).json({error:err.message});}
});

router.post('/', authenticateToken, requireManagerOrAbove, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const created = await supabaseHr.createPerformance(req.user, req.body);
      if (created === null) return res.status(404).json({ error: 'Employee not found' });
      if (created === false) return res.status(403).json({ error: 'Managers can only review direct reports' });
      addNotification('Performance Review', `Your review for ${req.body.period || 'this cycle'} is ready.`, 'info', req.body.employeeId);
      const target = await supabaseDb.queryOne('select email, full_name from public.profiles where id = $1', [req.body.employeeId]);
      if (target) {
        const email = templates.performanceReview(target.full_name, req.body.period, created.overall);
        await notifyProfiles({
          event: 'performance_review_completed',
          title: 'Performance review completed',
          message: `Your review for ${req.body.period || 'this cycle'} is ready.`,
          type: 'info',
          link: '/performance',
          userIds: [req.body.employeeId],
          emailSubject: email.subject,
          emailHtml: email.html,
        });
      }
      return res.status(201).json(created);
    }
    const{employeeId,period,technicalScore,communicationScore,leadershipScore,deliveryScore,innovationScore,teamworkScore,comments,goals}=req.body;
    if(!employeeId) return res.status(400).json({error:'Employee ID required'});
    const target = db.prepare('SELECT id,email,managerId FROM employees WHERE id=?').get(employeeId);
    if (!target) return res.status(404).json({ error: 'Employee not found' });
    if (!isAdminOrHR(req.user) && !isDirectReport(req.user, target)) {
      return res.status(403).json({ error: 'Managers can only review direct reports' });
    }
    const overall=Math.round(((technicalScore||0)+(communicationScore||0)+(leadershipScore||0)+(deliveryScore||0)+(innovationScore||0)+(teamworkScore||0))/6);
    const id=genId('perf');
    db.prepare('INSERT INTO performance_reviews (id,employeeId,reviewerId,period,technicalScore,communicationScore,leadershipScore,deliveryScore,innovationScore,teamworkScore,overallScore,comments,goals,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(id,employeeId,req.user.id,period||'',technicalScore||0,communicationScore||0,leadershipScore||0,deliveryScore||0,innovationScore||0,teamworkScore||0,overall,comments||'',goals||'','completed',new Date().toISOString(),new Date().toISOString());
    db.prepare('UPDATE employees SET performance=?,points=points+25 WHERE id=?').run(overall,employeeId);
    addNotification('Performance Review',`Your review for ${period} is ready.`,'info',employeeId);
    const reviewed = db.prepare('SELECT email,name FROM employees WHERE id=?').get(employeeId);
    if (reviewed) sendEmailNotification(reviewed.email, templates.performanceReview(reviewed.name, period, overall));
    res.status(201).json({id,overall});
  } catch(err){res.status(500).json({error:err.message});}
});
module.exports = router;
