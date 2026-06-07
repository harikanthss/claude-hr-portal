const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken, requireAdminOrHR } = require('../middleware/auth');
const { escapeHtml } = require('../utils/helpers');

router.get('/:candidateId', authenticateToken, requireAdminOrHR, async (req, res) => {
  try {
    const raw = supabaseDb.enabled && req.user.supabase
      ? await supabaseDb.queryOne(
        `
        select c.name, c.email, jp.title as position, d.name as department
        from public.candidates c
        left join public.job_postings jp on jp.id = c.job_posting_id
        left join public.departments d on d.id = jp.department_id
        where c.id = $1
        `,
        [req.params.candidateId],
      )
      : db.prepare('SELECT * FROM candidates WHERE id=?').get(req.params.candidateId);
    if (!raw) return res.status(404).json({ error: 'Candidate not found' });

    // Escape all user-provided fields to prevent XSS
    const c = {
      name: escapeHtml(raw.name),
      position: escapeHtml(raw.position),
      department: escapeHtml(raw.department),
      email: escapeHtml(raw.email),
    };

    const today = new Date().toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
    const joiningDate = new Date(Date.now() + 14*24*60*60*1000).toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Georgia, serif; color: #1a1a1a; padding: 60px; max-width: 800px; margin: auto; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; padding-bottom: 20px; border-bottom: 3px solid #22c55e; }
    .logo { font-size: 28px; font-weight: 800; color: #16a34a; letter-spacing: -1px; }
    .logo span { color: #0f172a; }
    .date { color: #64748b; font-size: 14px; }
    h1 { font-size: 22px; color: #0f172a; margin-bottom: 24px; text-align: center; letter-spacing: 1px; text-transform: uppercase; }
    .ref { color: #64748b; font-size: 13px; margin-bottom: 24px; }
    p { font-size: 15px; line-height: 1.8; margin-bottom: 16px; color: #374151; }
    .highlight { color: #16a34a; font-weight: bold; }
    .terms { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; margin: 24px 0; }
    .terms h3 { font-size: 16px; margin-bottom: 16px; color: #0f172a; }
    .term-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-size: 14px; }
    .term-row:last-child { border-bottom: none; }
    .term-label { color: #64748b; }
    .term-val { font-weight: 600; color: #0f172a; }
    .sign-section { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; }
    .sign-block { border-top: 1px solid #0f172a; padding-top: 8px; font-size: 13px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center; }
    @media print { body { padding: 40px; } }
  </style>
</head>
<body>
  <div class="header">
    <div><div class="logo">Grevya<span>HR</span></div><div style="font-size:12px;color:#64748b;margin-top:4px">Modern HR for modern teams</div></div>
    <div class="date">${today}</div>
  </div>

  <h1>Letter of Offer</h1>

  <div class="ref">Ref: GREVYA/OL/${new Date().getFullYear()}/${String(Math.floor(Math.random()*9000)+1000)}</div>

  <p>Dear <span class="highlight">${c.name}</span>,</p>

  <p>We are delighted to offer you the position of <span class="highlight">${c.position}</span> in our <span class="highlight">${c.department}</span> department at Grevya Technologies. After a thorough review of your application and interviews, we believe you will be a valuable addition to our team.</p>

  <div class="terms">
    <h3>Terms of Employment</h3>
    <div class="term-row"><span class="term-label">Position</span><span class="term-val">${c.position}</span></div>
    <div class="term-row"><span class="term-label">Department</span><span class="term-val">${c.department}</span></div>
    <div class="term-row"><span class="term-label">Type</span><span class="term-val">Full-Time, Permanent</span></div>
    <div class="term-row"><span class="term-label">Proposed Joining Date</span><span class="term-val">${joiningDate}</span></div>
    <div class="term-row"><span class="term-label">Work Location</span><span class="term-val">Hybrid (Office + Remote)</span></div>
    <div class="term-row"><span class="term-label">Probation Period</span><span class="term-val">6 Months</span></div>
    <div class="term-row"><span class="term-label">Working Hours</span><span class="term-val">Monday – Friday, 9 AM – 6 PM</span></div>
  </div>

  <p>This offer is subject to successful completion of background verification and submission of all required documents. Please confirm your acceptance by signing and returning a copy of this letter within <strong>7 working days</strong>.</p>

  <p>We look forward to welcoming you to the Grevya family and are confident this will be the beginning of a long and successful journey together.</p>

  <p>Warm regards,</p>

  <div class="sign-section">
    <div class="sign-block">
      <div style="margin-bottom:40px"></div>
      <div style="font-weight:600">Divya Kumar</div>
      <div style="color:#64748b;font-size:13px">HR Manager, Grevya Technologies</div>
    </div>
    <div class="sign-block">
      <div style="margin-bottom:40px"></div>
      <div style="font-weight:600">${c.name}</div>
      <div style="color:#64748b;font-size:13px">Candidate Signature & Date</div>
    </div>
  </div>

  <div class="footer">
    Grevya Technologies Pvt. Ltd. · This document is confidential and intended solely for the named recipient.
  </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `inline; filename="offer-letter-${raw.name.replace(/\s+/g,'-').replace(/[^a-zA-Z0-9-]/g,'')}.html"`);
    res.send(html);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
