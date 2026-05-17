const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/insights', authenticateToken, (req, res) => {
  try {
    const employees = db.prepare("SELECT * FROM employees WHERE status='active'").all();
    const insights = [];
    employees.forEach(emp => {
      if (emp.attendance < 80) insights.push({ id:`att-${emp.id}`, type:'attendance', severity:'high', title:`Low Attendance: ${emp.name}`, description:`${emp.name}'s attendance is ${emp.attendance}%, below 80% threshold.`, affectedEmployee:emp.name, recommendation:'Schedule a 1:1 check-in to understand challenges.', confidence:92 });
      if (emp.performance < 75) insights.push({ id:`perf-${emp.id}`, type:'performance', severity:'medium', title:`Performance Review: ${emp.name}`, description:`${emp.name}'s score ${emp.performance}/100 is below average.`, affectedEmployee:emp.name, recommendation:'Assign mentor and set 30-day goals.', confidence:85 });
    });
    const avgAtt = employees.reduce((s,e)=>s+e.attendance,0)/(employees.length||1);
    if (avgAtt > 90) insights.push({ id:'att-positive', type:'productivity', severity:'low', title:'Excellent Team Attendance', description:`Team averaging ${Math.round(avgAtt)}% — top quartile for IT sector.`, recommendation:'Recognize top attendees at next all-hands.', confidence:98 });
    const pending = db.prepare("SELECT COUNT(*) as c FROM leave_requests WHERE status='pending'").get().c;
    if (pending > 3) insights.push({ id:'leave-pending', type:'suggestion', severity:'medium', title:`${pending} Leave Requests Pending`, description:`${pending} requests awaiting approval.`, recommendation:'Review and action pending requests promptly.', confidence:100 });
    if (!insights.length) insights.push({ id:'all-clear', type:'productivity', severity:'low', title:'All Systems Healthy', description:'All metrics are within healthy ranges.', recommendation:'Review quarterly targets.', confidence:95 });
    res.json(insights);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/chat', authenticateToken, async (req, res) => {
  const { messages: chatMessages } = req.body;
  try {
    const employees = db.prepare('SELECT * FROM employees').all();
    const leaves = db.prepare("SELECT * FROM leave_requests WHERE status='pending'").all();
    const active = employees.filter(e=>e.status==='active').length;
    const avgPerf = employees.length ? Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length) : 0;
    const avgAtt = employees.length ? Math.round(employees.reduce((s,e)=>s+e.attendance,0)/employees.length) : 0;
    const system = `You are Grevya AI, a smart HR assistant. Be concise and professional.\nLive data: ${employees.length} employees (${active} active), ${leaves.length} pending leaves, ${avgPerf}% avg performance, ${avgAtt}% avg attendance.`;
    const response = await fetch('https://api.anthropic.com/v1/messages', { method:'POST', headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY||'','anthropic-version':'2023-06-01'}, body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:512, system, messages:chatMessages.map(m=>({role:m.role,content:m.content})) }) });
    if (!response.ok) throw new Error('API unavailable');
    const data = await response.json();
    res.json({ reply: data.content?.[0]?.text || 'Could not process.' });
  } catch {
    const last = (chatMessages[chatMessages.length-1]?.content||'').toLowerCase();
    const employees = db.prepare('SELECT * FROM employees').all();
    const leaves = db.prepare("SELECT * FROM leave_requests WHERE status='pending'").all();
    const avgPerf = employees.length ? Math.round(employees.reduce((s,e)=>s+e.performance,0)/employees.length) : 0;
    const avgAtt = employees.length ? Math.round(employees.reduce((s,e)=>s+e.attendance,0)/employees.length) : 0;
    let reply = `Team has ${employees.length} employees. Avg performance: ${avgPerf}%, attendance: ${avgAtt}%.`;
    if (last.includes('leave')) reply = `${leaves.length} leave requests pending. Team attendance is ${avgAtt}%.`;
    else if (last.includes('performance')) reply = `Avg performance: ${avgPerf}/100. ${employees.filter(e=>e.performance>=90).length} top performers, ${employees.filter(e=>e.performance<75).length} need review.`;
    else if (last.includes('attendance')) reply = `Avg attendance: ${avgAtt}%. ${employees.filter(e=>e.attendance>=95).length} have excellent attendance.`;
    res.json({ reply });
  }
});

module.exports = router;
