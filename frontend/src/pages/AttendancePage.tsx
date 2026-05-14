import React, { useState, useEffect } from 'react';
import { useStore } from '../services/store';
import { api } from '../services/store';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Clock, CheckCircle2, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { toast } from '../components/ui/Toast';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface AttendanceRecord {
  id: string; employeeId: string; date: string;
  checkIn: string; checkOut: string; status: string; hours: number;
}

export default function AttendancePage() {
  const { employees, currentUser } = useStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [tab, setTab] = useState<'overview' | 'employee' | 'calendar'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/attendance?month=3&year=2024').then(data => {
      if (Array.isArray(data)) setRecords(data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const presentToday = records.filter(r => r.status === 'present' && r.date === new Date().toISOString().split('T')[0]).length;
  const absentToday = records.filter(r => r.status === 'absent' && r.date === new Date().toISOString().split('T')[0]).length;
  const lateToday = records.filter(r => r.status === 'late' && r.date === new Date().toISOString().split('T')[0]).length;

  const weeklyData = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => {
    const dayRecords = records.filter(r => {
      const d = new Date(r.date);
      return DAYS[d.getDay()] === day && r.status !== 'holiday';
    });
    return {
      day,
      present: dayRecords.filter(r => r.status === 'present').length,
      absent: dayRecords.filter(r => r.status === 'absent').length,
      late: dayRecords.filter(r => r.status === 'late').length,
    };
  });

  const totalWorking = records.filter(r => r.status !== 'holiday').length;
  const totalPresent = records.filter(r => r.status === 'present' || r.status === 'late').length;
  const monthlyRate = totalWorking > 0 ? Math.round((totalPresent / totalWorking) * 100) : 0;

  const monthlyTrend = [
    { month: 'Oct', rate: 91 }, { month: 'Nov', rate: 93 },
    { month: 'Dec', rate: 88 }, { month: 'Jan', rate: 94 },
    { month: 'Feb', rate: 92 }, { month: 'Mar', rate: monthlyRate || 95 },
  ];

  const handleCheckIn = async () => {
    const emp = employees.find(e => e.email === currentUser?.email);
    if (!emp) return;
    try {
      await api.post('/attendance/check-in', { employeeId: emp.id });
      toast.success('Checked in!', `Checked in at ${new Date().toTimeString().slice(0, 5)}`);
      const data = await api.get('/attendance?month=3&year=2024');
      if (Array.isArray(data)) setRecords(data);
    } catch { toast.error('Check-in failed', 'You may have already checked in today.'); }
  };

  const handleCheckOut = async () => {
    const emp = employees.find(e => e.email === currentUser?.email);
    if (!emp) return;
    try {
      await api.post('/attendance/check-out', { employeeId: emp.id });
      toast.success('Checked out!', `Checked out at ${new Date().toTimeString().slice(0, 5)}`);
      const data = await api.get('/attendance?month=3&year=2024');
      if (Array.isArray(data)) setRecords(data);
    } catch { toast.error('Check-out failed', 'No check-in found or already checked out.'); }
  };

  const statusConfig: Record<string, { bg: string; color: string; label: string }> = {
    present: { bg: '#dcfce7', color: '#16a34a', label: 'Present' },
    absent: { bg: '#fee2e2', color: '#dc2626', label: 'Absent' },
    late: { bg: '#fef9c3', color: '#b45309', label: 'Late' },
    holiday: { bg: '#f1f5f9', color: '#94a3b8', label: 'Holiday' },
    half_day: { bg: '#dbeafe', color: '#1d4ed8', label: 'Half Day' },
  };

  const todayAttendance = employees.slice(0, 12).map((e, idx) => {
    const todayRecord = records.find(r => r.employeeId === e.id && r.date === new Date().toISOString().split('T')[0]);
    return {
      ...e,
      checkIn: todayRecord?.checkIn || '',
      checkOut: todayRecord?.checkOut || '',
      todayStatus: todayRecord?.status || 'absent',
    };
  });

  // Calendar view
  const viewMonth = new Date(2024, 2); // March 2024
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const emp = employees.find(e => e.email === currentUser?.email);
  const myRecords = records.filter(r => r.employeeId === (emp?.id || 'e1'));

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Present Today" value={presentToday || employees.filter(e => e.status === 'active').length} suffix={`/${employees.length}`} change={null as any} icon={<CheckCircle2 size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Absent Today" value={absentToday || 1} icon={<XCircle size={20} />} iconBg="#fee2e2" iconColor="#dc2626" />
        <StatCard label="Late Today" value={lateToday || 1} icon={<AlertCircle size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Monthly Rate" value={monthlyRate || 95} suffix="%" change={3} icon={<TrendingUp size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
      </div>

      {currentUser?.role === 'employee' && (
        <div className="card p-4 mb-6" style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-primary" onClick={handleCheckIn}><Clock size={15} /> Check In</button>
          <button className="btn btn-secondary" onClick={handleCheckOut}><Clock size={15} /> Check Out</button>
        </div>
      )}

      <div className="tab-nav">
        {[{ key: 'overview', label: 'Overview' }, { key: 'employee', label: "Today's Log" }, { key: 'calendar', label: 'My Calendar' }].map(t => (
          <button key={t.key} className={`tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key as any)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card p-6">
            <h3 style={{ marginBottom: 16 }}>Weekly Attendance</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={weeklyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="present" fill="#22c55e" radius={[4, 4, 0, 0]} name="Present" />
                <Bar dataKey="absent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Absent" />
                <Bar dataKey="late" fill="#f59e0b" radius={[4, 4, 0, 0]} name="Late" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card p-6">
            <h3 style={{ marginBottom: 16 }}>Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <YAxis domain={[80, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Line type="monotone" dataKey="rate" stroke="#22c55e" strokeWidth={2.5} dot={{ fill: '#22c55e', r: 4 }} name="Rate %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {tab === 'employee' && (
        <div className="card">
          <table className="table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {todayAttendance.map(e => {
                const cfg = statusConfig[e.todayStatus] || statusConfig.absent;
                return (
                  <tr key={e.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="avatar-sm">{e.avatar}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{e.name}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.position}</div>
                        </div>
                      </div>
                    </td>
                    <td>{e.department}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{e.checkIn || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{e.checkOut || '—'}</td>
                    <td><span className="badge" style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'calendar' && (
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>March 2024 — Attendance Calendar</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: 6 }}>{d}</div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const record = myRecords.find(r => r.date === `2024-03-${String(day).padStart(2, '0')}`);
              const status = record?.status || 'present';
              const cfg = statusConfig[status] || statusConfig.present;
              return (
                <div key={day} style={{
                  padding: '8px 4px', textAlign: 'center', borderRadius: 8,
                  background: cfg.bg, color: cfg.color,
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'default',
                }}>
                  {day}
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 16, flexWrap: 'wrap' }}>
            {Object.entries(statusConfig).map(([key, cfg]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 12, height: 12, borderRadius: 4, background: cfg.bg, border: `1px solid ${cfg.color}` }} />
                <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{cfg.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
