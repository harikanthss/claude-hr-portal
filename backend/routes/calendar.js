const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const supabaseHr = require('../data/supabaseHr');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { genId } = require('../utils/helpers');
const { sendEmailNotification, templates } = require('../config/email');
const { notifyProfiles, genericTemplate } = require('../services/notifications');

async function createEvent(req, res) {
  try {
    const { title, date, endDate, type, color, description } = req.body;
    if (!title || !date) return res.status(400).json({ error: 'Title and date required' });
    if (supabaseDb.enabled && req.user.supabase) {
      const event = await supabaseHr.createCalendarEvent(req.user, req.body);
      const email = genericTemplate('New calendar event posted', `${event.title || title} was added for ${event.date || date}.`);
      sendEmailNotification('harikanth.grevya@gmail.com', email);
      await notifyProfiles({ event: 'calendar_event_posted', title: 'New calendar event posted', message: `${event.title || title} was added for ${event.date || date}.`, type: 'info', link: '/calendar', allActive: true, emailSubject: email.subject, emailHtml: email.html });
      return res.status(201).json(event);
    }
    const id = genId('ev');
    db.prepare('INSERT INTO calendar_events (id,title,date,endDate,type,color,description,createdBy) VALUES (?,?,?,?,?,?,?,?)')
      .run(id, title, date, endDate || null, type || 'meeting', color || '#3b82f6', description || '', req.user.id);
    const event = db.prepare('SELECT * FROM calendar_events WHERE id=?').get(id);
    sendEmailNotification('harikanth.grevya@gmail.com', templates.generic('New calendar event posted', `${event.title} was added for ${event.date}.`));
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function deleteEvent(req, res) {
  try {
    if (supabaseDb.enabled && req.user.supabase) {
      await supabaseHr.deleteCalendarEvent(req.params.id);
      return res.json({ message: 'Deleted' });
    }
    db.prepare('DELETE FROM calendar_events WHERE id=?').run(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) return res.json(await supabaseHr.getCalendarEvents());
    res.json(db.prepare('SELECT * FROM calendar_events ORDER BY date ASC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/', authenticateToken, requireAdminOrHR, createEvent);
router.delete('/:id', authenticateToken, requireAdminOrHR, deleteEvent);
router.get('/events', authenticateToken, async (req, res) => {
  try {
    if (supabaseDb.enabled && req.user.supabase) return res.json(await supabaseHr.getCalendarEvents());
    res.json(db.prepare('SELECT * FROM calendar_events ORDER BY date ASC').all());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.post('/events', authenticateToken, requireAdminOrHR, createEvent);
router.delete('/events/:id', authenticateToken, requireAdminOrHR, deleteEvent);

module.exports = router;
