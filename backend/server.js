/**
 * Grevya HR Portal — Backend Server
 * Entry point: mounts all route modules
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Route modules ─────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/employees',     require('./routes/employees'));
app.use('/api/leave-requests',require('./routes/leave'));
app.use('/api/attendance',    require('./routes/attendance'));
app.use('/api/payslips',      require('./routes/payslips'));
app.use('/api/performance',   require('./routes/performance'));
app.use('/api/expenses',      require('./routes/expenses'));
app.use('/api/recruitment',   require('./routes/recruitment'));
app.use('/api/jobs',          require('./routes/jobs'));
app.use('/api/candidates',    require('./routes/candidates'));
app.use('/api/shifts',        require('./routes/shifts'));
app.use('/api/documents',     require('./routes/documents'));
app.use('/api/calendar',      require('./routes/calendar'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/onboarding',    require('./routes/onboarding'));
app.use('/api/audit-log',     require('./routes/audit'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/ai',            require('./routes/ai'));
app.use('/api/reports',       require('./routes/reports'));
app.use('/api/leaderboard',   require('./routes/leaderboard'));
app.use('/api/profile',       require('./routes/profile'));
app.use('/api/compliance',    require('./routes/compliance'));
app.use('/api/offer-letter',  require('./routes/offer-letter'));
app.use('/api/holidays',      require('./routes/holidays'));
app.use('/api/import',        require('./routes/import'));
app.use('/api/budgets',       require('./routes/budgets'));

// ── Serve built frontend in production ────────────────────────────────────────
const PUBLIC_DIR = path.join(__dirname, 'public');
if (fs.existsSync(PUBLIC_DIR)) {
  app.use(express.static(PUBLIC_DIR));
  app.get('*', (req, res) => {
    const idx = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(idx)) res.sendFile(idx);
    else res.status(404).json({ error: 'Not found' });
  });
}

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(`[Error] ${err.message}`);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  const db = require('./config/database');
  console.log(`\n🌿 Grevya HR Portal`);
  console.log(`   URL  : http://localhost:${PORT}`);
  console.log(`   DB   : ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (WAL)'}`);
  console.log(`   Email: ${process.env.SMTP_HOST ? 'Enabled' : 'Disabled'}`);
  console.log(`   AI   : ${process.env.ANTHROPIC_API_KEY ? 'Claude enabled' : 'Smart fallback'}\n`);
});
