import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import AIInsightCard from '../components/ai/AIInsightCard';
import StatCard from '../components/ui/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Bell, Download, FileText, Zap, Trophy, User, Mail, Phone, MapPin, Edit2, Check, X, Shield, RefreshCw, Lock } from 'lucide-react';

const BADGES_MAP: Record<string, any> = {
  perfect_attendance: { name: 'Perfect Attendance', icon: '🏆', color: '#22c55e' },
  top_performer: { name: 'Top Performer', icon: '⭐', color: '#f59e0b' },
  team_player: { name: 'Team Player', icon: '🤝', color: '#3b82f6' },
  streak_master: { name: 'Streak Master', icon: '🔥', color: '#ef4444' },
  early_bird: { name: 'Early Bird', icon: '🌅', color: '#8b5cf6' },
  mentor: { name: 'Mentor', icon: '🎓', color: '#06b6d4' },
};

// ===================== REPORTS =====================
export function ReportsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/reports/summary').then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-fade"><div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Loading reports...</div></div>;
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
        <button className="btn btn-secondary" onClick={() => window.print()}><Download size={15} /> Export PDF</button>
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

// ===================== NOTIFICATIONS =====================
export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllRead } = useStore();
  const unread = notifications.filter((n: any) => !n.read && !n.isRead).length;

  const typeIcon: Record<string, React.ReactNode> = {
    info: <Bell size={16} color="#3b82f6" />,
    success: <Check size={16} color="#22c55e" />,
    warning: <Bell size={16} color="#f59e0b" />,
    error: <Bell size={16} color="#ef4444" />,
  };
  const typeBg: Record<string, string> = {
    info:'#dbeafe', success:'#dcfce7', warning:'#fef9c3', error:'#fee2e2'
  };

  return (
    <div className="animate-fade">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <span className="badge badge-red">{unread} unread</span>
        {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead}><Check size={14}/> Mark all read</button>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {notifications.map((n: any) => (
          <div key={n.id} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:14, cursor:'pointer', opacity:n.read||n.isRead?0.65:1, borderLeft:`3px solid ${n.type==='error'?'#ef4444':n.type==='warning'?'#f59e0b':n.type==='success'?'#22c55e':'#3b82f6'}`, transition:'opacity 200ms' }} onClick={()=>markNotificationRead(n.id)}>
            <div style={{ width:36, height:36, borderRadius:10, background:typeBg[n.type]||'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {typeIcon[n.type]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:'0.875rem' }}>{n.title}</span>
                <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{new Date(n.time||n.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
              <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{n.message}</p>
            </div>
            {!n.read && !n.isRead && <div style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6', flexShrink:0, marginTop:4 }}/>}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="card p-6" style={{ textAlign:'center', color:'var(--text-muted)' }}>
            <Bell size={32} style={{ marginBottom:8 }}/><br/>No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== LEADERBOARD =====================
export function LeaderboardPage() {
  const [ranked, setRanked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard').then(d => { setRanked(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="animate-fade"><div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Loading leaderboard...</div></div>;

  const top3 = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
  const podiumOrder = [{ h:140, medal:'🥈', bg:'linear-gradient(135deg,#94a3b8,#64748b)' }, { h:170, medal:'🥇', bg:'linear-gradient(135deg,#fbbf24,#d97706)' }, { h:120, medal:'🥉', bg:'linear-gradient(135deg,#cd7c3b,#a16207)' }];

  return (
    <div className="animate-fade">
      {/* Podium */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr 1fr', gap:16, marginBottom:28 }}>
        {top3.map((emp, idx) => {
          if (!emp) return <div key={idx}/>;
          const conf = podiumOrder[idx];
          return (
            <div key={emp.id} className="card p-6" style={{ textAlign:'center', borderTop:`4px solid ${idx===1?'#fbbf24':idx===0?'#94a3b8':'#cd7c3b'}` }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>{conf.medal}</div>
              <div className="avatar avatar-lg" style={{ margin:'0 auto 12px' }}>{emp.avatar}</div>
              <div style={{ fontWeight:700, marginBottom:4 }}>{emp.name}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:12 }}>{emp.department}</div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--primary)', marginBottom:8 }}>{(emp.points||0).toLocaleString()}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:12 }}>🔥 {emp.streak||0} day streak</div>
              <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
                {(emp.badges||[]).slice(0,3).map((bid: string) => {
                  const b = BADGES_MAP[bid];
                  return b ? <span key={bid} title={b.name} style={{ fontSize:'1.1rem' }}>{b.icon}</span> : null;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Ranking Table */}
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th><th>Employee</th><th>Department</th>
                <th>Points</th><th>Streak</th><th>Badges</th><th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((emp: any, i: number) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:i===0?'#fbbf24':i===1?'#94a3b8':i===2?'#cd7c3b':'var(--border)', color:i<3?'white':'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800 }}>{i+1}</div>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="avatar avatar-sm">{emp.avatar}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{emp.name}</div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{emp.position}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="chip">{emp.department}</span></td>
                  <td style={{ fontWeight:700, color:'var(--primary)', fontSize:'1rem' }}>{(emp.points||0).toLocaleString()}</td>
                  <td><div style={{ display:'flex', alignItems:'center', gap:4 }}>🔥 <span style={{ fontWeight:600 }}>{emp.streak||0}</span></div></td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      {(emp.badges||[]).slice(0,4).map((bid: string) => {
                        const b = BADGES_MAP[bid];
                        return b ? <span key={bid} title={b.name} style={{ fontSize:'1rem' }}>{b.icon}</span> : null;
                      })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="progress" style={{ width:60 }}><div className="progress-bar progress-green" style={{ width:`${emp.performance||0}%` }}/></div>
                      <span style={{ fontSize:'0.8rem', fontWeight:600 }}>{emp.performance||0}%</span>
                    </div>
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

// ===================== AI INSIGHTS PAGE =====================
export function AIPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = () => {
    setLoading(true);
    api.get('/ai/insights').then(d => { setInsights(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchInsights(); }, []);

  const stats = {
    high: insights.filter(i => i.severity === 'high').length,
    medium: insights.filter(i => i.severity === 'medium').length,
    low: insights.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="animate-fade">
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding:'20px 24px', borderLeft:'3px solid #ef4444' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>High Severity</div>
          <div style={{ fontSize:'2rem', fontWeight:800, color:'#ef4444' }}>{stats.high}</div>
        </div>
        <div className="card" style={{ padding:'20px 24px', borderLeft:'3px solid #f59e0b' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Medium Severity</div>
          <div style={{ fontSize:'2rem', fontWeight:800, color:'#f59e0b' }}>{stats.medium}</div>
        </div>
        <div className="card" style={{ padding:'20px 24px', borderLeft:'3px solid #22c55e' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#22c55e', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Low / Info</div>
          <div style={{ fontSize:'2rem', fontWeight:800, color:'#22c55e' }}>{stats.low}</div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h3>Active Insights {!loading && <span className="badge badge-purple" style={{ marginLeft:8 }}>{insights.length} total</span>}</h3>
        <button className="btn btn-secondary btn-sm" onClick={fetchInsights} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Analyzing live data...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {insights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} onDismiss={id => setInsights(prev => prev.filter(i => i.id !== id))} />
          ))}
          {insights.length === 0 && (
            <div className="card" style={{ gridColumn:'1/-1' }}>
              <div className="empty-state"><Zap size={32}/><h3>All clear!</h3><p>No active insights. The AI is monitoring your team.</p></div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ===================== PAYSLIPS =====================
interface PayslipData { id:string; employeeId:string; month:string; year:number; basicSalary:number; hra:number; conveyance:number; medical:number; bonus:number; pf:number; tax:number; netSalary:number; generatedOn?:string; }

export function PayslipsPage() {
  const [payslips, setPayslips] = useState<PayslipData[]>([]);
  const [selected, setSelected] = useState<PayslipData|null>(null);
  const { currentUser } = useStore();

  useEffect(() => {
    api.get('/payslips').then(data => {
      if (Array.isArray(data) && data.length > 0) { setPayslips(data); setSelected(data[0]); }
    }).catch(()=>{});
  }, []);

  if (!selected) return <div className="animate-fade"><div className="card p-6" style={{ textAlign:'center', color:'var(--text-muted)' }}>Loading payslips...</div></div>;

  const gross = selected.basicSalary + selected.hra + selected.conveyance + selected.medical + selected.bonus;
  const totalDeductions = selected.pf + selected.tax;

  return (
    <div className="animate-fade">
      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:20 }}>
        <div className="card" style={{ padding:16, height:'fit-content' }}>
          <h3 style={{ marginBottom:14, fontSize:'0.9rem' }}>Payslip History</h3>
          {payslips.map(slip => (
            <div key={slip.id} onClick={()=>setSelected(slip)} style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer', background:selected.id===slip.id?'var(--primary-subtle)':'transparent', border:selected.id===slip.id?'1px solid var(--primary)':'1px solid transparent', marginBottom:6, transition:'all 200ms' }}>
              <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{slip.month} {slip.year}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Net: ₹{slip.netSalary.toLocaleString()}</div>
            </div>
          ))}
        </div>

        <div className="card p-6">
          {/* Header */}
          <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
            <div>
              <h2 style={{ fontSize:'1.25rem', marginBottom:4 }}>Payslip — {selected.month} {selected.year}</h2>
              <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                <span className="badge badge-green">Paid</span>
                <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{currentUser?.name} · {currentUser?.department}</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={()=>window.print()}><Download size={15}/> Download PDF</button>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
            <div>
              <div style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:12 }}>Earnings</div>
              {[
                { label:'Basic Salary', value:selected.basicSalary },
                { label:'House Rent Allowance', value:selected.hra },
                { label:'Conveyance', value:selected.conveyance },
                { label:'Medical Allowance', value:selected.medical },
                { label:'Performance Bonus', value:selected.bonus },
              ].map(item=>(
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:'0.85rem' }}>
                  <span style={{ color:'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight:600 }}>₹{item.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', fontWeight:700, color:'#16a34a', fontSize:'0.95rem' }}>
                <span>Gross Earnings</span>
                <span>₹{gross.toLocaleString()}</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize:'0.75rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:12 }}>Deductions</div>
              {[
                { label:'Provident Fund (12%)', value:selected.pf },
                { label:'Income Tax (TDS)', value:selected.tax },
              ].map(item=>(
                <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:'0.85rem' }}>
                  <span style={{ color:'var(--text-secondary)' }}>{item.label}</span>
                  <span style={{ fontWeight:600, color:'#dc2626' }}>- ₹{item.value.toLocaleString()}</span>
                </div>
              ))}
              <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', fontWeight:700, color:'#dc2626', fontSize:'0.95rem' }}>
                <span>Total Deductions</span>
                <span>- ₹{totalDeductions.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div style={{ background:'linear-gradient(135deg,#1a4a28 0%,#0f2b18 100%)', borderRadius:14, padding:'24px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.8rem', marginBottom:4 }}>Net Salary</div>
              <div style={{ color:'white', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.03em' }}>₹{selected.netSalary.toLocaleString()}</div>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.75rem' }}>Credited on</div>
              <div style={{ color:'#4ade80', fontWeight:600 }}>31 {selected.month} {selected.year}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===================== PROFILE =====================
export function ProfilePage() {
  const { currentUser } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name:currentUser?.name||'', email:currentUser?.email||'', phone:'', location:'', bio:'' });
  const [empData, setEmpData] = useState({ points:0, streak:0, performance:0, attendance:0, joinDate:'', department:'', position:'', salary:0 });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [changePw, setChangePw] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', next: '', confirm: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  useEffect(() => {
    api.get('/profile').then(data => {
      if (data) {
        setForm(f => ({ ...f, phone:data.phone||'', location:data.location||'', bio:data.bio||'' }));
        setEmpData({ points:data.points||0, streak:data.streak||0, performance:data.performance||0, attendance:data.attendance||0, joinDate:data.joinDate||'', department:data.department||'', position:data.position||'', salary:data.salary||0 });
      }
    }).catch(()=>{});
  }, []);

  const handleChangePw = async () => {
    setPwError('');
    if (pwForm.next.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    if (pwForm.next !== pwForm.confirm) { setPwError('Passwords do not match.'); return; }
    setPwSaving(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.next });
      setPwSuccess(true);
      setPwForm({ current:'', next:'', confirm:'' });
      setTimeout(() => { setChangePw(false); setPwSuccess(false); }, 2000);
    } catch (e: any) { setPwError(e.message || 'Failed to change password.'); }
    finally { setPwSaving(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/profile', { phone:form.phone, location:form.location, bio:form.bio });
      setEditing(false);
      setSuccess(true);
      setTimeout(()=>setSuccess(false), 3000);
    } catch {} finally { setSaving(false); }
  };

  const myBadges: string[] = [];
  if (empData.attendance >= 95) myBadges.push('perfect_attendance');
  if (empData.performance >= 90) myBadges.push('top_performer');
  if (empData.streak >= 30) myBadges.push('early_bird');
  if (empData.streak >= 60) myBadges.push('streak_master');

  return (
    <div className="animate-fade">
      {/* Change Password Modal */}
      {changePw && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:999, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:420, padding:'32px 36px' }}>
            <h3 style={{ marginBottom:20 }}>Change Password</h3>
            {pwSuccess && <div style={{ padding:'12px', background:'#dcfce7', border:'1px solid #86efac', borderRadius:8, color:'#16a34a', fontSize:'0.85rem', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}><Check size={15}/> Password changed! Logging you out...</div>}
            {pwError && <div style={{ padding:'12px', background:'#fee2e2', border:'1px solid #fecaca', borderRadius:8, color:'#dc2626', fontSize:'0.85rem', marginBottom:14 }}>{pwError}</div>}
            {[
              { label:'Current Password', key:'current', placeholder:'Enter current password' },
              { label:'New Password', key:'next', placeholder:'Min 8 characters' },
              { label:'Confirm New Password', key:'confirm', placeholder:'Repeat new password' },
            ].map(f => (
              <div key={f.key} className="form-group" style={{ marginBottom:14 }}>
                <label className="form-label">{f.label}</label>
                <input type="password" className="input" placeholder={f.placeholder} value={pwForm[f.key as keyof typeof pwForm]} onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} />
              </div>
            ))}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:20 }}>
              <button className="btn btn-secondary" onClick={() => { setChangePw(false); setPwError(''); }}>Cancel</button>
              <button className="btn btn-primary" onClick={handleChangePw} disabled={pwSaving}><Lock size={14}/> {pwSaving ? 'Saving...' : 'Update Password'}</button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div style={{ padding:'12px 20px', background:'#dcfce7', border:'1px solid #22c55e', borderRadius:10, marginBottom:16, color:'#16a34a', display:'flex', alignItems:'center', gap:8, fontSize:'0.875rem', fontWeight:600 }}>
          <Check size={16}/> Profile updated successfully!
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20 }}>
        {/* Left card */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card p-6" style={{ textAlign:'center' }}>
            <div className="avatar avatar-xl" style={{ margin:'0 auto 16px' }}>{currentUser?.avatar}</div>
            <h3 style={{ marginBottom:4 }}>{currentUser?.name}</h3>
            <div style={{ color:'var(--primary)', fontWeight:600, marginBottom:4 }}>{empData.position}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.8rem', marginBottom:16 }}>{empData.department}</div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
              <div style={{ padding:10, background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'1.25rem', fontWeight:700, color:'var(--primary)' }}>{empData.points.toLocaleString()}</div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Total Points</div>
              </div>
              <div style={{ padding:10, background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'1.25rem', fontWeight:700, color:'#f59e0b' }}>🔥 {empData.streak}</div>
                <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Day Streak</div>
              </div>
            </div>

            <div style={{ display:'flex', gap:6, justifyContent:'center', flexWrap:'wrap' }}>
              {myBadges.map(bid => {
                const b = BADGES_MAP[bid];
                return b ? (
                  <div key={bid} title={b.name} style={{ padding:'6px 10px', borderRadius:20, background:`${b.color}18`, border:`1px solid ${b.color}30`, fontSize:'0.8rem', color:b.color, fontWeight:500 }}>
                    {b.icon} {b.name}
                  </div>
                ) : null;
              })}
            </div>
          </div>

          <div className="card p-6">
            <h4 style={{ marginBottom:14 }}>Quick Stats</h4>
            {[
              { label:'Performance', value:empData.performance, color:'#22c55e', cls:'progress-green' },
              { label:'Attendance', value:empData.attendance, color:'#3b82f6', cls:'progress-blue' },
            ].map(stat=>(
              <div key={stat.label} style={{ marginBottom:12 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-secondary)' }}>{stat.label}</span>
                  <span style={{ fontSize:'0.8rem', fontWeight:700, color:stat.color }}>{stat.value}%</span>
                </div>
                <div className="progress"><div className={`progress-bar ${stat.cls}`} style={{ width:`${stat.value}%` }}/></div>
              </div>
            ))}
            <div style={{ paddingTop:12, borderTop:'1px solid var(--border)' }}>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:4 }}>Monthly Salary</div>
              <div style={{ fontWeight:700, color:'var(--primary)', fontSize:'1.1rem' }}>₹{empData.salary.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Right */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div className="card p-6">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
              <h3>Personal Information</h3>
              <button className="btn btn-secondary btn-sm" onClick={()=>setEditing(v=>!v)}>
                {editing?<X size={14}/>:<Edit2 size={14}/>} {editing?'Cancel':'Edit'}
              </button>
            </div>

            <div className="grid-2" style={{ gap:16 }}>
              {[
                { icon:<User size={16}/>, label:'Full Name', key:'name', editable:false },
                { icon:<Mail size={16}/>, label:'Email', key:'email', editable:false },
                { icon:<Phone size={16}/>, label:'Phone', key:'phone', editable:true },
                { icon:<MapPin size={16}/>, label:'Location', key:'location', editable:true },
              ].map(field=>(
                <div key={field.key} className="form-group">
                  <label className="form-label" style={{ display:'flex', alignItems:'center', gap:6 }}>{field.icon} {field.label}</label>
                  {editing && field.editable ? (
                    <input className="input" value={form[field.key as keyof typeof form]} onChange={e=>setForm(f=>({...f,[field.key]:e.target.value}))}/>
                  ) : (
                    <div style={{ padding:'10px 14px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.875rem' }}>{form[field.key as keyof typeof form] || '—'}</div>
                  )}
                </div>
              ))}
            </div>

            <div className="form-group" style={{ marginTop:16 }}>
              <label className="form-label">Bio</label>
              {editing ? (
                <textarea className="input" rows={3} style={{ resize:'vertical' }} value={form.bio} onChange={e=>setForm(f=>({...f,bio:e.target.value}))} placeholder="Tell us about yourself..."/>
              ) : (
                <div style={{ padding:'10px 14px', background:'var(--bg)', borderRadius:8, border:'1px solid var(--border)', fontSize:'0.875rem', minHeight:60, color:form.bio?'var(--text)':'var(--text-muted)' }}>{form.bio || 'No bio added yet.'}</div>
              )}
            </div>

            {editing && (
              <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:20 }}>
                <button className="btn btn-secondary" onClick={()=>setEditing(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving}><Check size={14}/> {saving?'Saving...':'Save Changes'}</button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 style={{ marginBottom:16 }}>Employment Details</h3>
            <div className="grid-2" style={{ gap:14 }}>
              {[
                { label:'Employee ID', value:currentUser?.id||'—' },
                { label:'Department', value:empData.department||currentUser?.department },
                { label:'Position', value:empData.position||currentUser?.position },
                { label:'Role', value:currentUser?.role==='hr_manager'?'HR Manager':currentUser?.role==='manager'?'Manager':'Employee' },
                { label:'Join Date', value:empData.joinDate||'—' },
                { label:'Work Type', value:'Hybrid' },
              ].map(item=>(
                <div key={item.label}>
                  <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:4 }}>{item.label}</div>
                  <div style={{ fontSize:'0.875rem', fontWeight:500 }}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <Shield size={18} color="var(--primary)"/>
              <h3>Security</h3>
            </div>
            {[
              { label:'Change Password', desc:'Update your account password' },
              { label:'Two-Factor Authentication', desc:'Add extra layer of security' },
              { label:'Active Sessions', desc:'Manage your login sessions' },
            ].map(item=>(
              <div key={item.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border-light)' }}>
                <div>
                  <div style={{ fontSize:'0.875rem', fontWeight:500 }}>{item.label}</div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{item.desc}</div>
                </div>
                <button className="btn btn-secondary btn-sm">Manage</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
