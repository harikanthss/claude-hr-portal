import React, { useState } from 'react';
import { useStore } from '../services/store';

import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar
} from 'recharts';
import { TrendingUp, Award, Star, Target } from 'lucide-react';
import StatCard from '../components/ui/StatCard';

const COMPETENCY_DATA = [
  { subject: 'Technical', A: 92, B: 75 },
  { subject: 'Communication', A: 85, B: 80 },
  { subject: 'Leadership', A: 70, B: 65 },
  { subject: 'Delivery', A: 95, B: 82 },
  { subject: 'Innovation', A: 80, B: 70 },
  { subject: 'Teamwork', A: 88, B: 78 },
];

export default function PerformancePage() {
  const { employees, currentUser } = useStore();
  const [selected, setSelected] = useState('all');
  const isEmployee = currentUser?.role === 'employee';

  const topPerformers = [...employees].sort((a, b) => b.performance - a.performance).slice(0, 5);
  const avgPerf = Math.round(employees.reduce((s, e) => s + e.performance, 0) / employees.length);

  const quarterlyData = [
    { q: 'Q1 23', score: 78, target: 80 },
    { q: 'Q2 23', score: 82, target: 82 },
    { q: 'Q3 23', score: 85, target: 83 },
    { q: 'Q4 23', score: 88, target: 85 },
    { q: 'Q1 24', score: 91, target: 87 },
  ];

  const teamComparison = employees.slice(0, 8).map(e => ({ name: e.name.split(' ')[0], score: e.performance }));

  const perfColor = (score: number) => score >= 90 ? '#22c55e' : score >= 75 ? '#f59e0b' : '#ef4444';

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Team Avg Score" value={avgPerf} suffix="/100" change={4.8} icon={<TrendingUp size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Top Performers" value={employees.filter(e => e.performance >= 90).length} icon={<Star size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Reviews Due" value={3} icon={<Target size={20} />} iconBg="#fee2e2" iconColor="#dc2626" />
        <StatCard label="Reviews Done" value={employees.length - 3} icon={<Award size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Quarterly trend */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Quarterly Performance</h3>
          <ResponsiveContainer width="100%" height={210}>
            <AreaChart data={quarterlyData}>
              <defs>
                <linearGradient id="qPerf" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="q" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} fill="url(#qPerf)" name="Score" />
              <Area type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={1.5} fill="none" strokeDasharray="4 4" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Competency radar */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Competency Breakdown</h3>
          <ResponsiveContainer width="100%" height={210}>
            <RadarChart data={COMPETENCY_DATA}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
              <Radar name="You" dataKey="A" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
              <Radar name="Team Avg" dataKey="B" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.08} strokeWidth={1.5} strokeDasharray="4 4" />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 2, background: '#22c55e', borderRadius: 1 }} /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>You</span></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 2, background: '#3b82f6', borderRadius: 1 }} /><span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Team Avg</span></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Team comparison bar */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Team Comparison</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={teamComparison} layout="vertical" barCategoryGap={6}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} width={70} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} name="Performance">
                {teamComparison.map((entry, i) => (
                  <rect key={i} fill={perfColor(entry.score)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top performers */}
        <div className="card p-6">
          <div className="section-header">
            <h3>Top Performers</h3>
            <span className="badge badge-green">Q1 2024</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {topPerformers.map((emp, idx) => (
              <div key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: idx === 0 ? '#fbbf24' : idx === 1 ? '#94a3b8' : idx === 2 ? '#cd7c3b' : 'var(--border)',
                  color: idx < 3 ? 'white' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  flexShrink: 0,
                }}>
                  {idx + 1}
                </div>
                <div className="avatar avatar-sm">{emp.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600 }} className="truncate">{emp.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.position}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: perfColor(emp.performance) }}>{emp.performance}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>/100</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* All employees performance table */}
      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ padding: '20px 24px 16px' }}>
          <h3>All Employees — Performance Overview</h3>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Department</th>
                <th>Performance</th>
                <th>Attendance</th>
                <th>Streak</th>
                <th>Points</th>
                <th>Rating</th>
              </tr>
            </thead>
            <tbody>
              {[...employees].sort((a, b) => b.performance - a.performance).map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar avatar-sm">{emp.avatar}</div>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.name}</span>
                    </div>
                  </td>
                  <td><span className="chip">{emp.department}</span></td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 70 }}>
                        <div className="progress-bar" style={{ width: `${emp.performance}%`, background: perfColor(emp.performance) }} />
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '0.8rem', color: perfColor(emp.performance) }}>{emp.performance}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.attendance}%</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span style={{ fontSize: '0.8rem' }}>🔥</span>
                      <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.streak}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--primary)' }}>{emp.points.toLocaleString()}</td>
                  <td>
                    <span className={`badge ${emp.performance >= 90 ? 'badge-green' : emp.performance >= 75 ? 'badge-yellow' : 'badge-red'}`} style={{ fontSize: '0.7rem' }}>
                      {emp.performance >= 90 ? 'Excellent' : emp.performance >= 75 ? 'Good' : 'Needs Work'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
