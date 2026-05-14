import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import StatCard from '../components/ui/StatCard';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Users, TrendingUp, Clock, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ManagerDashboard() {
  const { employees, leaveRequests } = useStore();
  const [deptData, setDeptData] = useState<any[]>([]);
  const [insights, setInsights] = useState<any[]>([]);

  useEffect(() => {
    api.get('/dashboard/departments').then(d => setDeptData(Array.isArray(d) ? d : [])).catch(() => {});
    api.get('/ai/insights').then(d => setInsights(Array.isArray(d) ? d.slice(0, 2) : [])).catch(() => {});
  }, []);

  const myTeam = employees.filter(e => e.status !== 'inactive');
  const avgPerf = myTeam.length > 0 ? Math.round(myTeam.reduce((s, e) => s + e.performance, 0) / myTeam.length) : 0;
  const avgAtt = myTeam.length > 0 ? Math.round(myTeam.reduce((s, e) => s + e.attendance, 0) / myTeam.length) : 0;
  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending').length;

  const radarData = [
    { skill: 'Delivery', value: avgPerf },
    { skill: 'Attendance', value: avgAtt },
    { skill: 'Teamwork', value: Math.round(avgPerf * 0.95) },
    { skill: 'Innovation', value: Math.round(avgPerf * 0.88) },
    { skill: 'Communication', value: Math.round(avgPerf * 0.92) },
  ];

  const topPerformers = [...myTeam].sort((a, b) => b.performance - a.performance).slice(0, 5);
  const perfColors = ['#7c3aed', '#3b82f6', '#22c55e', '#f59e0b', '#ef4444'];

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Team Size" value={myTeam.length} change={5.2} icon={<Users size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
        <StatCard label="Avg Performance" value={avgPerf} suffix="/100" change={3.1} icon={<TrendingUp size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Team Attendance" value={avgAtt} suffix="%" change={1.8} icon={<Clock size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Pending Approvals" value={pendingLeaves} icon={<AlertCircle size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Team Competency Radar */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Team Competency Radar</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <Radar name="Team" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Performers */}
        <div className="card p-6">
          <h3 style={{ marginBottom: 16 }}>Top Performers</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topPerformers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} width={90} />
              <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v: any) => [`${v}/100`, 'Performance']} />
              <Bar dataKey="performance" radius={[0, 4, 4, 0]} name="Score">
                {topPerformers.map((_, i) => <Cell key={i} fill={perfColors[i] || '#94a3b8'} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Department Stats Table */}
      <div className="card p-6 mb-5">
        <h3 style={{ marginBottom: 16 }}>Department Overview</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Employees</th>
                <th>Avg Performance</th>
                <th>Avg Attendance</th>
                <th>Avg Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {deptData.map((dept: any) => (
                <tr key={dept.department}>
                  <td><span className="chip">{dept.department}</span></td>
                  <td style={{ fontWeight: 600 }}>{dept.employees}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 60 }}>
                        <div className="progress-bar progress-green" style={{ width: `${dept.avgPerformance}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{dept.avgPerformance}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 60 }}>
                        <div className="progress-bar progress-blue" style={{ width: `${dept.attendance}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{dept.attendance}%</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>₹{Number(dept.avgSalary || 0).toLocaleString()}</td>
                  <td>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 20, background: dept.avgPerformance >= 85 ? '#dcfce7' : '#fef9c3', color: dept.avgPerformance >= 85 ? '#16a34a' : '#b45309', fontSize: '0.7rem', fontWeight: 600 }}>
                      {dept.avgPerformance >= 85 ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />}
                      {dept.avgPerformance >= 85 ? 'On Track' : 'Review'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Leave Requests */}
      <div className="card p-6">
        <h3 style={{ marginBottom: 16 }}>Pending Leave Approvals</h3>
        {leaveRequests.filter(r => r.status === 'pending').length === 0 ? (
          <div style={{ textAlign: 'center', padding: 24, color: 'var(--text-muted)' }}><CheckCircle2 size={28} style={{ marginBottom: 8 }} /><br />No pending approvals</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {leaveRequests.filter(r => r.status === 'pending').slice(0, 6).map(lr => (
              <div key={lr.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid var(--border-light)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="avatar avatar-sm">{lr.employeeAvatar}</div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{lr.employeeName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{lr.type} leave · {lr.days} days · {lr.startDate}</div>
                  </div>
                </div>
                <span style={{ padding: '3px 10px', borderRadius: 20, background: '#fef9c3', color: '#b45309', fontSize: '0.7rem', fontWeight: 600 }}>Pending</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
