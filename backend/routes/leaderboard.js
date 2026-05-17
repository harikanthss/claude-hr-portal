const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const BADGES = { perfect_attendance:{id:'perfect_attendance',name:'Perfect Attendance',icon:'🏆',color:'#22c55e'}, top_performer:{id:'top_performer',name:'Top Performer',icon:'⭐',color:'#f59e0b'}, team_player:{id:'team_player',name:'Team Player',icon:'🤝',color:'#3b82f6'}, streak_master:{id:'streak_master',name:'Streak Master',icon:'🔥',color:'#ef4444'}, early_bird:{id:'early_bird',name:'Early Bird',icon:'🌅',color:'#8b5cf6'}, mentor:{id:'mentor',name:'Mentor',icon:'🎓',color:'#06b6d4'} };
router.get('/', authenticateToken, (req, res) => {
  try {
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
