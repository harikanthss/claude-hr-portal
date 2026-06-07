const express = require('express');
const router = express.Router();
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { notifyProfiles, genericTemplate } = require('../services/notifications');

router.post('/', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    if (!supabaseDb.enabled || !req.user.supabase) return res.status(501).json({ error: 'Supabase announcements are required' });
    const { title, body, category, pinned } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body are required' });
    const row = await supabaseDb.queryOne(
      `
      insert into public.announcements (title, body, category, pinned, posted_by)
      values ($1, $2, $3, $4, $5)
      returning *
      `,
      [title, body, category || 'general', !!pinned, req.user.id],
    );
    const email = genericTemplate('New announcement posted', `${title}: ${body}`);
    await notifyProfiles({
      event: 'announcement_posted',
      title: 'New announcement posted',
      message: title,
      type: category === 'urgent' ? 'warning' : 'info',
      link: '/announcements',
      allActive: true,
      emailSubject: email.subject,
      emailHtml: email.html,
    });
    return res.status(201).json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
