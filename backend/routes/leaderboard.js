const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');
const BADGES = { perfect_attendance:{id:'perfect_attendance',name:'Perfect Attendance',icon:'🏆',color:'#22c55e'}, top_performer:{id:'top_performer',name:'Top Performer',icon:'⭐',color:'#f59e0b'}, team_player:{id:'team_player',name:'Team Player',icon:'🤝',color:'#3b82f6'}, streak_master:{id:'streak_master',name:'Streak Master',icon:'🔥',color:'#ef4444'}, early_bird:{id:'early_bird',name:'Early Bird',icon:'🌅',color:'#8b5cf6'}, mentor:{id:'mentor',name:'Mentor',icon:'🎓',color:'#06b6d4'} };
router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const rows = await supabaseDb.queryAll(
        `
        select p.*, d.name as department
        from public.profiles p
        left join public.departments d on d.id = p.department_id
        where p.status = 'active'
        order by p.points desc
        `,
      );
      return res.json(rows.map((e,i) => {
        const badges = [];
        if(e.attendance_score>=95) badges.push('perfect_attendance');
        if(e.performance_score>=90) badges.push('top_performer');
        if(e.streak>=60) badges.push('streak_master');
        if(e.streak>=30) badges.push('early_bird');
        if(i<3) badges.push('team_player');
        return {
          id: e.id, name: e.full_name, email: e.email, department: e.department || '',
          position: e.job_title || '', status: e.status, joinDate: e.hire_date,
          performance: e.performance_score, attendance: e.attendance_score, avatar: e.avatar || '',
          points: e.points, streak: e.streak, managerId: e.manager_id, rank:i+1,
          badges, badgeObjects:badges.map(b=>BADGES[b]).filter(Boolean)
        };
      }));
    }
    const employees = db.prepare("SELECT * FROM employees WHERE status='active' ORDER BY points DESC").all();
    res.json(employees.map((e,i) => {
      const badges = [];
      if(e.attendance>=95) badges.push('perfect_attendance');
      if(e.performance>=90) badges.push('top_performer');
      if(e.streak>=60) badges.push('streak_master');
      if(e.streak>=30) badges.push('early_bird');
      if(i<3) badges.push('team_player');
      return { ...e, rank:i+1, badges, badgeObjects:badges.map(b=>BADGES[b]).filter(Boolean) };
    }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
