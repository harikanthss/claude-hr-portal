import React, { useState, useEffect } from 'react';
import { PageLoader } from '../components/ui/SkeletonLoader';
import { useStore, api } from '../services/store';
import StatCard from '../components/ui/StatCard';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Download, FileText, RefreshCw, Users, DollarSign, TrendingDown, Calendar } from 'lucide-react';
import { downloadCSV as exportToCSV } from '../utils/exportCSV';

const BADGES_MAP: Record<string, any> = {
  perfect_attendance: { name: 'Perfect Attendance', icon: '🏆', color: '#22c55e' },
  top_performer: { name: 'Top Performer', icon: '⭐', color: '#f59e0b' },
  team_player: { name: 'Team Player', icon: '🤝', color: '#3b82f6' },
  streak_master: { name: 'Streak Master', icon: '🔥', color: '#ef4444' },
  early_bird: { name: 'Early Bird', icon: '🌅', color: '#8b5cf6' },
  mentor: { name: 'Mentor', icon: '🎓', color: '#06b6d4' },
};


// ===================== REPORTS =====================
export default function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/summary').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;
  if (!data) return <div className="animate-fade"><div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Unable to load reports.</div></div>;

  const leaveTypeStats = [
    { name: 'Sick', value: data.leavesByType?.sick || 0, color: '#ef4444' },
    { name: 'Casual', value: data.leavesByType?.casual || 0, color: '#3b82f6' },
    { name: 'Annual', value: data.leavesByType?.annual || 0, color: '#22c55e' },
    { name: 'Emergency', value: data.leavesByType?.emergency || 0, color: '#f59e0b' },
  ];

  const expenseStats = [
    { name: 'Approved', value: data.approvedExpenses || 0, color: '#22c55e' },
    { name: 'Pending', value: data.pendingExpenses || 0, color: '#f59e0b' },
  ];

  return (
    <div className="animate-fade">
      <div className="grid-4 mb-6">
        <StatCard label="Total Headcount" value={data.headcount} change={8.3} icon={<FileText size={20} />} iconBg="#dcfce7" iconColor="#16a34a" />
        <StatCard label="Avg Salary" value={`₹${Math.round((data.avgSalary || 0) / 1000)}K`} change={5.2} icon={<FileText size={20} />} iconBg="#dbeafe" iconColor="#1d4ed8" />
        <StatCard label="Turnover Rate" value={data.turnoverRate} suffix="%" change={-0.6} icon={<FileText size={20} />} iconBg="#fef9c3" iconColor="#b45309" />
        <StatCard label="Leaves Approved" value={data.totalLeavesTaken} icon={<FileText size={20} />} iconBg="#f3e8ff" iconColor="#7c3aed" />
      </div>

      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16, gap:10 }}>
        <div style={{ display:'flex', gap:8 }}>
        <button className="btn btn-secondary" onClick={() => {
          if (!data) return;
          const rows = [
            { Report:'Headcount', Value:data.headcount },
            { Report:'Average Salary (₹)', Value:data.avgSalary },
            { Report:'Turnover Rate (%)', Value:data.turnoverRate },
            { Report:'Leaves Approved', Value:data.totalLeavesTaken },
            { Report:'Expenses Approved', Value:data.approvedExpenses },
            { Report:'Total Expense Value (₹)', Value:data.totalExpenses },
            { Report:'---Salary by Dept---', Value:'' },
            ...(data.salaryByDept||[]).map((d:any) => ({ Report:d.name, Value:d.avg })),
            { Report:'---Leave Types---', Value:'' },
            { Report:'Sick Leaves', Value:data.leavesByType?.sick },
            { Report:'Casual Leaves', Value:data.leavesByType?.casual },
            { Report:'Annual Leaves', Value:data.leavesByType?.annual },
            { Report:'Emergency Leaves', Value:data.leavesByType?.emergency },
          ];
          exportToCSV('hr-report-full', rows);
        }}><Download size={15}/> Export CSV</button>
        <button className="btn btn-secondary" onClick={() => window.print()}><FileText size={15}/> Print</button>
      </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Avg Salary by Department (₹)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.salaryByDept || []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" tick={{ fontSize:10, fill:'var(--text-muted)' }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}K`} />
              <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'var(--text-muted)' }} width={90} />
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} formatter={(v:any)=>[`₹${Number(v).toLocaleString()}`,'Avg Salary']} />
              <Bar dataKey="avg" fill="#3b82f6" radius={[0,4,4,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Leave Type Distribution</h3>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={leaveTypeStats} cx="50%" cy="50%" outerRadius={75} paddingAngle={4} dataKey="value">
                  {leaveTypeStats.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {leaveTypeStats.map(item=>(
                <div key={item.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:item.color }}/>
                    <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight:700 }}>{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Turnover Rate Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data.turnoverTrend||[]}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
              <XAxis dataKey="month" tick={{ fontSize:11, fill:'var(--text-muted)' }}/>
              <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} domain={[0,5]}/>
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              <Line type="monotone" dataKey="rate" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill:'#f59e0b', r:4 }} name="Turnover %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Expense Claims Summary</h3>
          <div style={{ display:'flex', alignItems:'center', gap:20 }}>
            <ResponsiveContainer width={180} height={180}>
              <PieChart>
                <Pie data={expenseStats} cx="50%" cy="50%" outerRadius={75} paddingAngle={4} dataKey="value">
                  {expenseStats.map((e,i)=><Cell key={i} fill={e.color}/>)}
                </Pie>
                <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }}/>
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex:1 }}>
              {expenseStats.map(item=>(
                <div key={item.name} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <div style={{ width:10, height:10, borderRadius:3, background:item.color }}/>
                    <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{item.name}</span>
                  </div>
                  <span style={{ fontWeight:700 }}>{item.value}</span>
                </div>
              ))}
              <div style={{ paddingTop:8, borderTop:'1px solid var(--border)' }}>
                <div style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>Total Approved Value</div>
                <div style={{ fontWeight:800, color:'#22c55e', fontSize:'1.1rem' }}>₹{(data.totalExpenses||0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}