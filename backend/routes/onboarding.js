const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

router.get('/', authenticateToken, (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM onboarding_tasks ORDER BY employeeName, taskDueDay').all();
    const grouped = {};
    tasks.forEach(t => { if(!grouped[t.employeeId]) grouped[t.employeeId]={employeeId:t.employeeId,employeeName:t.employeeName,employeeAvatar:t.employeeAvatar,department:t.department,position:t.position,startDate:t.startDate,buddy:t.buddy,tasks:[]}; grouped[t.employeeId].tasks.push({id:t.id,label:t.taskLabel,dueDay:t.taskDueDay,assignee:t.taskAssignee,notes:t.taskNotes,done:!!t.done}); });
    res.json(Object.values(grouped));
  } catch(err){res.status(500).json({error:err.message});}
});
router.put('/:taskId', authenticateToken, (req, res) => { try { db.prepare('UPDATE onboarding_tasks SET done=? WHERE id=?').run(req.body.done?1:0,req.params.taskId); res.json({ok:true}); } catch(err){res.status(500).json({error:err.message});} });
module.exports = router;
