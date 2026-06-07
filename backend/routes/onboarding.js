const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR, requireManagerOrAbove } = require('../middleware/auth');
const { genId, logAudit, addNotification, generatePayslipData } = require('../utils/helpers');
const { upload } = require('../middleware/upload');
const path = require('path');
const fs = require('fs');

function groupOnboardingTasks(tasks) {
  const grouped = {};
  tasks.forEach((task) => {
    if (!grouped[task.employeeId]) {
    grouped[task.employeeId] = {
        id: task.employeeId,
        employeeId: task.employeeId,
        name: task.employeeName,
        employeeName: task.employeeName,
        avatar: task.employeeAvatar,
        employeeAvatar: task.employeeAvatar,
        department: task.department,
        position: task.position,
        startDate: task.startDate,
        buddy: task.buddy,
        checklist: [],
        tasks: [],
      };
    }
    const assignee = ['HR', 'IT', 'Manager', 'Employee'].includes(task.taskAssignee)
      ? task.taskAssignee
      : 'HR';
    const item = {
      id: task.id,
      label: task.taskLabel,
      dueDay: task.taskDueDay,
      assignee,
      notes: task.taskNotes,
      done: !!task.done,
    };
    grouped[task.employeeId].checklist.push(item);
    grouped[task.employeeId].tasks.push(item);
  });
  return Object.values(grouped).map((employee) => ({
    ...employee,
    progress: employee.checklist.length
      ? Math.round((employee.checklist.filter((item) => item.done).length / employee.checklist.length) * 100)
      : 0,
  }));
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const params = [];
      const where = [];
      if (!['super_admin', 'admin', 'hr_manager'].includes(req.user.role)) {
        params.push(req.user.id);
        if (req.user.role === 'manager') where.push(`(ot.employee_id = $1 or p.manager_id = $1)`);
        else where.push(`ot.employee_id = $1`);
      }
      const rows = await supabaseDb.queryAll(
        `
        select
          ot.id,
          ot.employee_id as "employeeId",
          p.full_name as "employeeName",
          p.avatar as "employeeAvatar",
          d.name as department,
          p.job_title as position,
          ot.start_date as "startDate",
          buddy.full_name as buddy,
          ot.task_label as "taskLabel",
          ot.due_day as "taskDueDay",
          assignee.full_name as "taskAssignee",
          ot.notes as "taskNotes",
          ot.done
        from public.onboarding_tasks ot
        left join public.profiles p on p.id = ot.employee_id
        left join public.departments d on d.id = p.department_id
        left join public.profiles buddy on buddy.id = ot.buddy_id
        left join public.profiles assignee on assignee.id = ot.assignee_id
        ${where.length ? `where ${where.join(' and ')}` : ''}
        order by p.full_name, ot.due_day
        `,
        params,
      );
      return res.json(groupOnboardingTasks(rows));
    }

    const tasks = db.prepare('SELECT * FROM onboarding_tasks ORDER BY employeeName, taskDueDay').all();
    res.json(groupOnboardingTasks(tasks));
  } catch(err){res.status(500).json({error:err.message});}
});
router.put('/:taskId', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const task = await supabaseDb.queryOne(
        `
        select ot.employee_id, p.manager_id
        from public.onboarding_tasks ot
        left join public.profiles p on p.id = ot.employee_id
        where ot.id = $1
        `,
        [req.params.taskId],
      );
      if (!task) return res.status(404).json({ error: 'Task not found' });
      const canUpdate = ['super_admin', 'admin', 'hr_manager'].includes(req.user.role)
        || task.employee_id === req.user.id
        || (req.user.role === 'manager' && task.manager_id === req.user.id);
      if (!canUpdate) return res.status(403).json({ error: 'Access denied' });
      const completedAt = req.body.done ? 'now()' : 'null';
      await supabaseDb.query(
        `update public.onboarding_tasks set done = $1, completed_at = ${completedAt}, updated_at = now() where id = $2`,
        [!!req.body.done, req.params.taskId],
      );
      return res.json({ok:true});
    }
    db.prepare('UPDATE onboarding_tasks SET done=? WHERE id=?').run(req.body.done?1:0,req.params.taskId);
    res.json({ok:true});
  } catch(err){res.status(500).json({error:err.message});}
});
module.exports = router;
