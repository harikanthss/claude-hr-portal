const express = require('express');
const router = express.Router();
const db = require('../config/database');
const supabaseDb = require('../config/supabase');
const { authenticateToken } = require('../middleware/auth');

async function getScopedHrSnapshot(user) {
  if (!(supabaseDb.enabled && user.supabase)) {
    const employees = db.prepare('SELECT * FROM employees').all();
    const leaves = db.prepare("SELECT * FROM leave_requests WHERE status='pending'").all();
    return { employees, leaves };
  }

  const params = [];
  const where = ["p.status = 'active'"];
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    params.push(user.id);
    if (user.role === 'manager') where.push(`(p.id = $${params.length} or p.manager_id = $${params.length})`);
    else where.push(`p.id = $${params.length}`);
  }

  const employees = await supabaseDb.queryAll(
    `
    select
      p.id,
      p.full_name as name,
      p.attendance_score as attendance,
      p.performance_score as performance,
      p.status
    from public.profiles p
    where ${where.join(' and ')}
    order by p.full_name
    `,
    params,
  );

  const leaveParams = [];
  const leaveWhere = ["lr.status = 'pending'"];
  if (!['super_admin', 'admin', 'hr_manager'].includes(user.role)) {
    leaveParams.push(user.id);
    if (user.role === 'manager') leaveWhere.push(`(lr.employee_id = $${leaveParams.length} or p.manager_id = $${leaveParams.length})`);
    else leaveWhere.push(`lr.employee_id = $${leaveParams.length}`);
  }
  const leaves = await supabaseDb.queryAll(
    `
    select lr.id
    from public.leave_requests lr
    join public.profiles p on p.id = lr.employee_id
    where ${leaveWhere.join(' and ')}
    `,
    leaveParams,
  );

  return { employees, leaves };
}

// ── AI Insights (rule-based from live data) ───────────────────────────────────
router.get('/insights', authenticateToken, async (req, res) => {
  try {
    const { employees, leaves } = await getScopedHrSnapshot(req.user);
    const insights = [];

    employees.forEach(emp => {
      if (emp.attendance < 80) {
        insights.push({
          id: `att-${emp.id}`, type: 'attendance', severity: 'high',
          title: `Low Attendance: ${emp.name}`,
          description: `${emp.name}'s attendance is ${emp.attendance}%, below 80% threshold.`,
          affectedEmployee: emp.name,
          recommendation: 'Schedule a 1:1 check-in to understand challenges.',
          confidence: 92,
        });
      }
      if (emp.performance < 75) {
        insights.push({
          id: `perf-${emp.id}`, type: 'performance', severity: 'medium',
          title: `Performance Review: ${emp.name}`,
          description: `${emp.name}'s score ${emp.performance}/100 is below average.`,
          affectedEmployee: emp.name,
          recommendation: 'Assign mentor and set 30-day goals.',
          confidence: 85,
        });
      }
    });

    const avgAtt = employees.reduce((s, e) => s + e.attendance, 0) / (employees.length || 1);
    if (avgAtt > 90) {
      insights.push({
        id: 'att-positive', type: 'productivity', severity: 'low',
        title: 'Excellent Team Attendance',
        description: `Team averaging ${Math.round(avgAtt)}% — top quartile for IT sector.`,
        recommendation: 'Recognize top attendees at next all-hands.',
        confidence: 98,
      });
    }

    const pending = leaves.length;
    if (pending > 3) {
      insights.push({
        id: 'leave-pending', type: 'suggestion', severity: 'medium',
        title: `${pending} Leave Requests Pending`,
        description: `${pending} requests awaiting approval.`,
        recommendation: 'Review and action pending requests promptly.',
        confidence: 100,
      });
    }

    if (!insights.length) {
      insights.push({
        id: 'all-clear', type: 'productivity', severity: 'low',
        title: 'All Systems Healthy',
        description: 'All metrics are within healthy ranges.',
        recommendation: 'Review quarterly targets.',
        confidence: 95,
      });
    }

    res.json(insights);
  } catch (err) {
    console.error('[AI] Insights error:', err.message);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// ── AI Chat (Claude API with smart fallback) ──────────────────────────────────
router.post('/chat', authenticateToken, async (req, res) => {
  const { messages: chatMessages } = req.body;

  if (!chatMessages || !Array.isArray(chatMessages) || chatMessages.length === 0) {
    return res.status(400).json({ error: 'Messages array required' });
  }

  const { employees, leaves } = await getScopedHrSnapshot(req.user);
  const active = employees.filter(e => e.status === 'active').length;
  const avgPerf = employees.length ? Math.round(employees.reduce((s, e) => s + e.performance, 0) / employees.length) : 0;
  const avgAtt = employees.length ? Math.round(employees.reduce((s, e) => s + e.attendance, 0) / employees.length) : 0;

  // Try Claude API if key is available
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const system = `You are Grevya AI, a smart HR assistant. Be concise and professional.\nLive data: ${employees.length} employees (${active} active), ${leaves.length} pending leaves, ${avgPerf}% avg performance, ${avgAtt}% avg attendance.`;

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 512,
          system,
          messages: chatMessages.map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return res.json({ reply: data.content?.[0]?.text || 'Could not process.' });
      }
      // If API call failed, fall through to fallback
      console.warn('[AI] Claude API returned status:', response.status);
    } catch (err) {
      console.error('[AI] Claude API error:', err.message);
      // Fall through to smart fallback
    }
  }

  // ── Smart fallback (no API key or API failure) ────────────────────────────
  const last = (chatMessages[chatMessages.length - 1]?.content || '').toLowerCase();
  let reply = `Team has ${employees.length} employees. Avg performance: ${avgPerf}%, attendance: ${avgAtt}%.`;

  if (last.includes('leave')) {
    reply = `${leaves.length} leave requests pending. Team attendance is ${avgAtt}%.`;
  } else if (last.includes('performance')) {
    const topPerformers = employees.filter(e => e.performance >= 90).length;
    const needReview = employees.filter(e => e.performance < 75).length;
    reply = `Avg performance: ${avgPerf}/100. ${topPerformers} top performers, ${needReview} need review.`;
  } else if (last.includes('attendance')) {
    const excellent = employees.filter(e => e.attendance >= 95).length;
    reply = `Avg attendance: ${avgAtt}%. ${excellent} have excellent attendance.`;
  }

  res.json({ reply });
});

module.exports = router;
