import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import StatCard from '../components/ui/StatCard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { TrendingUp, Clock, Star, Flame } from 'lucide-react';

const BADGES_MAP: Record<string, any> = {
  perfect_attendance: { name: 'Perfect Attendance', icon: '🏆', color: '#22c55e' },
  top_performer: { name: 'Top Performer', icon: '⭐', color: '#f59e0b' },
  team_player: { name: 'Team Player', icon: '🤝', color: '#3b82f6' },
  streak_master: { name: 'Streak Master', icon: '🔥', color: '#ef4444' },
  early_bird: { name: 'Early Bird', icon: '🌅', color: '#8b5cf6' },
  mentor: { name: 'Mentor', icon: '🎓', color: '#06b6d4' },
};

export default function EmployeeDashboard() {
  const { currentUser, leaveRequests } = useStore();
  const [profile, setProfile] = useState<any>(null);
  const [payslips, setPayslips] = useState<any[]>([]);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/profile'),
      api.get('/payslips'),
      api.get('/leaderboard'),
    ]).then(([p, ps, lb]) => {
      setProfile(p);
      setPayslips(Array.isArray(ps) ? ps : []);
      setLeaderboard(Array.isArray(lb) ? lb : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const myLeaves = leaveRequests.filter(r => r.employeeName === currentUser?.name);
  const latestPayslip = payslips[0];
  const myRank = leaderboard.findIndex(e => e.email === currentUser?.email) + 1;

  const perfChartData = [
    { month: 'Oct', score: Math.max(50, (profile?.performance || 80) - 12) },
    { month: 'Nov', score: Math.max(55, (profile?.performance || 80) - 8) },
    { month: 'Dec', score: Math.max(60, (profile?.performance || 80) - 5) },
    { month: 'Jan', score: Math.max(65, (profile?.performance || 80) - 3) },
    { month: 'Feb', score: Math.max(70, (profile?.performance || 80) - 1) },
    { month: 'Mar', score: profile?.performance || 80 },
  ];

  const radarData = [
    { skill: 'Technical', value: profile?.performance || 80 },
    { skill: 'Delivery', value: Math.round((profile?.performance || 80) * 0.97) },
    { skill: 'Teamwork', value: Math.round((profile?.performance || 80) * 0.95) },
    { skill: 'Innovation', value: Math.round((profile?.performance || 80) * 0.88) },
    { skill: 'Communication', value: Math.round((profile?.performance || 80) * 0.92) },
  ];

  const myBadges = ['perfect_attendance', 'top_performer', 'early_bird']
    .filter(b => (profile?.attendance >= 95 || b !== 'perfect_attendance') && (profile?.performance >= 90 || b !== 'top_performer'));

  if (loading) return <div className="animate-fade"><div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading...</div></div>;

  return (
    <div className="animate-fade">
      {/* Welcome Banner */}
      <div className="card p-6 mb-6" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', border: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', marginBottom: 4 }}>Welcome back</div>
            <h2 style={{ color: 'white', fontSize: '1.5rem', marginBottom: 8 }}>{currentUser?.name}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{currentUser?.position}</span>
              <span style={{ color: 'rgba(255,255,255,0.5)' }}>·</span>
              <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>{currentUser?.department}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.75rem', marginBottom: 4 }}>Leaderboard Rank</div>
            <div style={{ color: 'white', fontSize: '2.5rem', fontWeight: 800 }}>#{myRank || '–'}</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid-4 mb-6">
        <StatCard label="Performance Score" value={profile?.performance || 0} suffix="/100" change={3.5} icon={<TrendingUp size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
        <StatCard label="Attendance Rate" value={profile?.attendance || 0} suffix="%" change={1.2} icon={<Clock size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Points Earned" value={(profile?.points || 0).toLocaleString()} icon={<Star size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Current Streak" value={profile?.streak || 0} suffix=" days" icon={<Flame size={20} />} iconBg="#fee2e2" iconColor="#dc2626" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Performance Trend */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>My Performance Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={perfChartData}>
              <defs>
                <linearGradient id="myPerfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} fill="url(#myPerfGrad)" name="Score" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Skill Radar */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Skill Breakdown</h3>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Radar name="You" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Latest Payslip */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Latest Payslip</h3>
          {latestPayslip ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{latestPayslip.month} {latestPayslip.year}</span>
                <span className="badge badge-green">Paid</span>
              </div>
              {[
                { label: 'Basic Salary', val: latestPayslip.basicSalary, color: undefined },
                { label: 'HRA', val: latestPayslip.hra, color: undefined },
                { label: 'Bonus', val: latestPayslip.bonus, color: '#16a34a' },
                { label: 'PF Deduction', val: -latestPayslip.pf, color: '#dc2626' },
                { label: 'TDS', val: -latestPayslip.tax, color: '#dc2626' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.825rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight: 600, color: item.color || 'var(--text)' }}>
                    {item.val < 0 ? `-₹${Math.abs(item.val).toLocaleString()}` : `₹${item.val.toLocaleString()}`}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, padding: '12px 16px', background: 'linear-gradient(135deg, #1a4a28, #0f2b18)', borderRadius: 10 }}>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>Net Salary</span>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>₹{latestPayslip.netSalary.toLocaleString()}</span>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No payslips yet</div>
          )}
        </div>

        {/* Badges & My Leaves */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card p-6">
            <h3 style={{ marginBottom: 14 }}>My Badges</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {myBadges.map(bid => {
                const b = BADGES_MAP[bid];
                return b ? (
                  <div key={bid} title={b.name} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 20, background: `${b.color}15`, border: `1px solid ${b.color}30`, fontSize: '0.8rem', fontWeight: 500, color: b.color }}>
                    <span style={{ fontSize: '1rem' }}>{b.icon}</span> {b.name}
                  </div>
                ) : null;
              })}
            </div>
          </div>
          <div className="card p-6" style={{ flex: 1 }}>
            <h3 style={{ marginBottom: 14 }}>My Recent Leaves</h3>
            {myLeaves.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No leave requests yet.</div>
            ) : (
              myLeaves.slice(0, 4).map(lr => (
                <div key={lr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)', fontSize: '0.825rem' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{lr.type} leave</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lr.startDate} · {lr.days} days</div>
                  </div>
                  <span style={{ padding: '3px 8px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600, background: lr.status === 'approved' ? '#dcfce7' : lr.status === 'rejected' ? '#fee2e2' : '#fef9c3', color: lr.status === 'approved' ? '#16a34a' : lr.status === 'rejected' ? '#dc2626' : '#b45309' }}>{lr.status}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
