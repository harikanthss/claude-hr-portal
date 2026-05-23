import { PageLoader } from '../components/ui/SkeletonLoader';
import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { useLiveDashboard } from '../hooks/useLiveDashboard';
import StatCard from '../components/ui/StatCard';
import AIInsightCard from '../components/ai/AIInsightCard';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { Users, Clock, Calendar, TrendingUp, CheckCircle2, AlertCircle, XCircle, UserCheck } from 'lucide-react';

export default function HRDashboard() {
  const { employees, leaveRequests } = useStore();
  const { stats: liveStats, lastUpdated } = useLiveDashboard(60000);
  const [perfData, setPerfData] = useState<any[]>([]);
  const [deptData, setDeptData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/stats'),
      api.get('/dashboard/performance'),
      api.get('/dashboard/departments'),
      api.get('/ai/insights'),
    ]).then(([s, p, d, ai]) => {
      setStats(s);
      setPerfData(Array.isArray(p) ? p : []);
      setDeptData(Array.isArray(d) ? d : []);
      setInsights(Array.isArray(ai) ? ai : []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const active = employees.filter(e => e.status === 'active').length;
  const onLeave = employees.filter(e => e.status === 'on_leave').length;
  const inactive = employees.filter(e => e.status === 'inactive').length;
  const pending = liveStats?.pendingLeaves ?? leaveRequests.filter(r => r.status === 'pending').length;
  const avgPerf = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.performance, 0) / employees.length) : 0;
  const avgAtt = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.attendance, 0) / employees.length) : 0;

  const pieData = [
    { name: 'Active', value: active, color: '#22c55e' },
    { name: 'On Leave', value: onLeave, color: '#f59e0b' },
    { name: 'Inactive', value: inactive, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const leaveTypeData = [
    { name: 'Sick', value: leaveRequests.filter(r => r.type === 'sick').length, fill: '#ef4444' },
    { name: 'Casual', value: leaveRequests.filter(r => r.type === 'casual').length, fill: '#3b82f6' },
    { name: 'Annual', value: leaveRequests.filter(r => r.type === 'annual').length, fill: '#22c55e' },
    { name: 'Emergency', value: leaveRequests.filter(r => r.type === 'emergency').length, fill: '#f59e0b' },
  ];

  const recentLeaves = leaveRequests.slice(0, 5);

  const StatusBadge = ({ status }: { status: string }) => {
    const map: Record<string, any> = {
      pending: { label: 'Pending', icon: <AlertCircle size={12} />, color: '#f59e0b', bg: '#fef9c3' },
      approved: { label: 'Approved', icon: <CheckCircle2 size={12} />, color: '#22c55e', bg: '#dcfce7' },
      rejected: { label: 'Rejected', icon: <XCircle size={12} />, color: '#ef4444', bg: '#fee2e2' },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: s.bg, color: s.color, fontSize: '0.7rem', fontWeight: 600 }}>
        {s.icon} {s.label}
      </span>
    );
  };

  if (loading) return <div className="animate-fade"><div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>Loading dashboard...</div></div>;

  return (
    <div className="animate-fade">
      {lastUpdated && (
        <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
          <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>
            🔄 Live · Updated {lastUpdated.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}
          </span>
        </div>
      )}
      {/* KPI Stats */}
      <div className="grid-4 mb-6">
        <StatCard label="Total Employees" value={employees.length} change={8.3} icon={<Users size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Avg Attendance" value={avgAtt} suffix="%" change={2.1} icon={<Clock size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Pending Leaves" value={pending} icon={<Calendar size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Avg Performance" value={avgPerf} suffix="/100" change={4.8} icon={<TrendingUp size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Performance Trend */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Performance Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={perfData}>
              <defs>
                <linearGradient id="perfGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={2.5} fill="url(#perfGrad)" name="Avg Score" />
              <Area type="monotone" dataKey="target" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 4" fill="none" name="Target" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Headcount by Dept */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Headcount by Department</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={deptData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="department" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={90} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="employees" fill="#22c55e" radius={[0, 4, 4, 0]} name="Employees" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Employee Status Pie */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Employee Status Overview</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={78} paddingAngle={3} dataKey="value">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1 }}>
              {pieData.map(item => (
                <div key={item.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: item.color }} />
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{item.value}</span>
                </div>
              ))}
              <div style={{ paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total</span>
                  <span style={{ fontWeight: 700 }}>{employees.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Leave Breakdown */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Leave Type Breakdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={leaveTypeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]} name="Requests">
                {leaveTypeData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Leaves + AI Insights */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Recent Leave Requests</h3>
          {recentLeaves.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-muted)' }}>No leave requests</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {recentLeaves.map(lr => (
                <div key={lr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="avatar avatar-sm">{lr.employeeAvatar}</div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{lr.employeeName}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lr.type} · {lr.days} day{lr.days > 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <StatusBadge status={lr.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h3 style={{ marginBottom: 14 }}>AI Insights</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {insights.slice(0, 3).map(insight => (
              <AIInsightCard key={insight.id} insight={insight} onDismiss={id => setInsights(prev => prev.filter(i => i.id !== id))} />
            ))}
            {insights.length === 0 && (
              <div className="card p-6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
                All metrics are healthy ✓
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
