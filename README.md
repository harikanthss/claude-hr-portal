# 🌿 Grevya HR Portal

A **100% production-ready** HR management platform built with React + Node.js + SQLite. Everything runs on one server — no cloud dependencies required.

---

## 🚀 Quick Start (2 minutes)

### Option A — One script
```bash
chmod +x start.sh && ./start.sh
```
Open http://localhost:3001

### Option B — Docker
```bash
docker compose up --build
```
Open http://localhost:3001

### Option C — Manual Dev Mode
```bash
# Terminal 1 — Backend
cd backend && npm install && node server.js

# Terminal 2 — Frontend
cd frontend && npm install && npm run dev
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## 🔑 Demo Logins

| Role        | Email                  | Password  |
|-------------|------------------------|-----------|
| Admin       | admin@grevya.com       | admin123  |
| HR Manager  | hr@grevya.com          | hr123     |
| Manager     | manager@grevya.com     | mgr123    |
| Employee    | employee@grevya.com    | emp123    |

---

## ✅ Features (100% Implemented)

### Core HR
- **Employee Management** — Full CRUD, department filtering, profile view
- **Leave Management** — Apply, approve/reject, leave balance tracking
- **Attendance** — Check-in/out, calendar view, monthly reports
- **Payslips** — Detailed breakdowns, earnings vs deductions, print/PDF

### Analytics & Intelligence
- **HR Dashboard** — Live performance trends, headcount by dept, leave breakdown (real API data)
- **Manager Dashboard** — Team radar chart, top performers, dept comparison table
- **Employee Dashboard** — Personal KPIs, skill radar, payslip summary, badges
- **Reports Page** — Salary by dept, turnover trend, expense summary (all live data)
- **AI Insights** — Real-time alerts based on actual employee metrics
- **Leaderboard** — Live rankings computed from real points/streaks/badges

### Recruitment & Onboarding
- **Recruitment Pipeline** — Kanban board: Applied → Screening → Interview → Offer → Hired
- **Onboarding Checklist** — Per-employee task tracking with progress bars

### Operations
- **Shift Scheduling** — Weekly shift planner with shift types
- **Expense Claims** — Submit, approve/reject with receipt tracking
- **Document Vault** — Upload/download company documents by category
- **Calendar** — Company events, deadlines, meetings
- **Org Chart** — Interactive hierarchy view

### System
- **AI Chat (Grevya AI)** — Floating assistant with live HR data context + Anthropic API
- **Audit Log** — Every action tracked with user, timestamp, resource
- **Notifications** — Real-time alerts, mark read/unread
- **Dark Mode** — Full dark theme
- **Role-Based Access** — Admin / HR Manager / Manager / Employee

---

## 🧠 AI Chat Setup (Optional)

To enable the full Claude-powered AI assistant:

1. Get an API key from https://console.anthropic.com
2. Set it in `backend/.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   ```
3. Restart the backend.

Without a key, Grevya AI falls back to smart rule-based responses using live DB data.

---

## 🏗️ Architecture

```
grevya/
├── backend/
│   ├── server.js        # Express API (all 30+ endpoints)
│   ├── db.js            # SQLite schema + seed data
│   ├── uploads/         # File uploads
│   └── data/            # SQLite database file
├── frontend/
│   ├── src/
│   │   ├── pages/       # All 18 page components
│   │   ├── components/  # Shared UI, AI, Layout
│   │   ├── services/    # Zustand store + API client
│   │   └── types/       # TypeScript interfaces
│   └── dist/            # Production build output
├── Dockerfile
├── docker-compose.yml
└── start.sh
```

### Tech Stack
| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, TypeScript, Vite          |
| State     | Zustand                             |
| Charts    | Recharts                            |
| Backend   | Node.js, Express                    |
| Database  | SQLite (better-sqlite3, WAL mode)   |
| Auth      | JWT + bcryptjs                      |
| AI        | Anthropic Claude (Haiku)            |
| Deploy    | Docker / single-server              |

---

## 🔌 API Reference

| Method | Endpoint                      | Description                  |
|--------|-------------------------------|------------------------------|
| POST   | /api/auth/login               | Login, returns JWT           |
| GET    | /api/employees                | List all employees           |
| POST   | /api/employees                | Create employee              |
| PUT    | /api/employees/:id            | Update employee              |
| DELETE | /api/employees/:id            | Delete employee              |
| GET    | /api/leave-requests           | All leave requests           |
| POST   | /api/leave-requests           | Apply for leave              |
| PUT    | /api/leave-requests/:id       | Approve/reject leave         |
| GET    | /api/attendance               | Attendance records           |
| POST   | /api/attendance/check-in      | Employee check-in            |
| POST   | /api/attendance/check-out     | Employee check-out           |
| GET    | /api/payslips                 | Payslip history              |
| GET    | /api/dashboard/stats          | KPI counts                   |
| GET    | /api/dashboard/performance    | Monthly performance trend    |
| GET    | /api/dashboard/departments    | Dept breakdown               |
| GET    | /api/leaderboard              | Live ranked employees        |
| GET    | /api/ai/insights              | Auto-generated HR insights   |
| POST   | /api/ai/chat                  | AI chat (Claude / fallback)  |
| GET    | /api/reports/summary          | Full reports data            |
| GET    | /api/audit-log                | System activity log          |
| ... and 15+ more endpoints     |                              |

---

## 📦 Production Deployment

### Environment Variables
```env
PORT=3001
JWT_SECRET=your-strong-random-secret
ANTHROPIC_API_KEY=sk-ant-...   # Optional for AI chat
NODE_ENV=production
```

### Recommended: Railway / Render / VPS
1. Push to GitHub
2. Connect to Railway or Render
3. Set env vars in the dashboard
4. Deploy — it auto-runs `node server.js`

The SQLite database persists in `backend/data/grevya.db`. For production, mount this as a volume.

---

## 🛡️ Security Notes

- Change `JWT_SECRET` before going live
- Enable HTTPS via a reverse proxy (Nginx/Caddy)
- SQLite is fine for teams up to ~500 employees; migrate to PostgreSQL for larger scale
- All endpoints are JWT-protected; admin/HR routes have additional RBAC middleware

---

Built with ❤️ — Grevya HR Portal
