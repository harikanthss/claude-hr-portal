const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { genId } = require('../utils/helpers');

const INDIAN_HOLIDAYS_2024 = [
  { date:'2024-01-26', title:"Republic Day", type:'holiday', color:'#ef4444' },
  { date:'2024-03-25', title:"Holi", type:'holiday', color:'#f59e0b' },
  { date:'2024-03-29', title:"Good Friday", type:'holiday', color:'#3b82f6' },
  { date:'2024-04-14', title:"Dr. Ambedkar Jayanti", type:'holiday', color:'#8b5cf6' },
  { date:'2024-04-17', title:"Ram Navami", type:'holiday', color:'#f97316' },
  { date:'2024-04-21', title:"Mahavir Jayanti", type:'holiday', color:'#06b6d4' },
  { date:'2024-05-23', title:"Buddha Purnima", type:'holiday', color:'#22c55e' },
  { date:'2024-06-17', title:"Eid ul-Adha", type:'holiday', color:'#16a34a' },
  { date:'2024-07-17', title:"Muharram", type:'holiday', color:'#7c3aed' },
  { date:'2024-08-15', title:"Independence Day", type:'holiday', color:'#ef4444' },
  { date:'2024-09-16', title:"Milad-un-Nabi", type:'holiday', color:'#22c55e' },
  { date:'2024-10-02', title:"Gandhi Jayanti", type:'holiday', color:'#f59e0b' },
  { date:'2024-10-12', title:"Dussehra", type:'holiday', color:'#f97316' },
  { date:'2024-10-31', title:"Halloween / Sardar Patel Jayanti", type:'holiday', color:'#8b5cf6' },
  { date:'2024-11-01', title:"Diwali", type:'holiday', color:'#f59e0b' },
  { date:'2024-11-15', title:"Guru Nanak Jayanti", type:'holiday', color:'#22c55e' },
  { date:'2024-12-25', title:"Christmas Day", type:'holiday', color:'#ef4444' },
];

router.post('/seed', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      let added = 0;
      for (const h of INDIAN_HOLIDAYS_2024) {
        const exists = await supabaseDb.queryOne('select id from public.holidays where date = $1 and name = $2', [h.date, h.title]);
        if (!exists) {
          await supabaseDb.query('insert into public.holidays (date, name) values ($1, $2)', [h.date, h.title]);
          added++;
        }
      }
      return res.json({ message: `${added} holidays added`, total: INDIAN_HOLIDAYS_2024.length });
    }
    let added = 0;
    for (const h of INDIAN_HOLIDAYS_2024) {
      const exists = db.prepare("SELECT id FROM calendar_events WHERE date=? AND title=?").get(h.date, h.title);
      if (!exists) {
        db.prepare('INSERT INTO calendar_events (id,title,date,endDate,type,color,description,createdBy) VALUES (?,?,?,?,?,?,?,?)').run(
          genId('holiday'), h.title, h.date, null, h.type, h.color, 'Indian National Holiday', 'system'
        );
        added++;
      }
    }
    res.json({ message: `${added} holidays added`, total: INDIAN_HOLIDAYS_2024.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      const rows = await supabaseDb.queryAll('select date, name as title from public.holidays order by date');
      return res.json(rows.map((row) => ({ date: row.date, title: row.title, type: 'holiday', color: '#ef4444' })));
    }
    res.json(INDIAN_HOLIDAYS_2024);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
