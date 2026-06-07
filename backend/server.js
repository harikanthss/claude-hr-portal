/**
 * Grevya HR Portal — Backend Server
 * Entry point: mounts all route modules
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── CORS — restrict origins in production ─────────────────────────────────────
const ALLOWED_ORIGINS = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:3001', 'http://127.0.0.1:3001'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per window
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  message: { error: 'Rate limit exceeded. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
app.use('/api/', apiLimiter);

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ── Route modules ─────────────────────────────────────────────────────────────
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/access',        require('./routes/access'));
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
app.use('/api/announcements', require('./routes/announcements'));

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
  console.error(`[Error] ${req.method} ${req.path} — ${err.message}`);
  if (err.stack && process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }
  const status = err.status || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const server = app.listen(PORT, () => {
  const db = require('./config/database');
  console.log(`\n🌿 Grevya HR Portal`);
  console.log(`   URL  : http://localhost:${PORT}`);
  console.log(`   DB   : ${process.env.DATABASE_URL ? 'PostgreSQL' : 'SQLite (WAL)'}`);
  console.log(`   Email: ${process.env.SMTP_HOST ? 'Enabled' : 'Disabled'}`);
  console.log(`   AI   : ${process.env.ANTHROPIC_API_KEY ? 'Claude enabled' : 'Smart fallback'}\n`);
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal) {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('Server closed.');
    process.exit(0);
  });
  // Force close after 10s
  setTimeout(() => {
    console.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
