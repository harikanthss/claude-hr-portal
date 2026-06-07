import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';
import { Star, TrendingUp, Award, Target, Plus, X, Check, Download } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { downloadCSV } from '../utils/exportCSV';

const SKILLS = ['technicalScore','communicationScore','leadershipScore','deliveryScore','innovationScore','teamworkScore'];
const SKILL_LABELS: Record<string,string> = { technicalScore:'Technical', communicationScore:'Communication', leadershipScore:'Leadership', deliveryScore:'Delivery', innovationScore:'Innovation', teamworkScore:'Teamwork' };

export default function PerformancePage() {
  const { employees, currentUser } = useStore();
  const [reviews, setReviews] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<any>({ employeeId:'', period:'Q1 2024', technicalScore:80, communicationScore:80, leadershipScore:80, deliveryScore:80, innovationScore:80, teamworkScore:80, comments:'', goals:'' });
  const [submitting, setSubmitting] = useState(false);
  const isManager = ['admin','hr_manager','manager'].includes(currentUser?.role||'');

  const activeEmps = employees.filter(e => e.status !== 'inactive');
  const reviewTargets = currentUser?.role === 'manager'
    ? activeEmps.filter(e => e.managerId === currentUser.id)
    : activeEmps;
  const avgPerf = activeEmps.length ? Math.round(activeEmps.reduce((s,e)=>s+e.performance,0)/activeEmps.length) : 0;
  const top = activeEmps.filter(e => e.performance >= 90).length;
  const needsReview = activeEmps.filter(e => e.performance < 75).length;

  useEffect(() => {
    api.get('/performance').then(d => { if (Array.isArray(d)) setReviews(d); }).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!form.employeeId) return;
    setSubmitting(true);
    try {
      await api.post('/performance', form);
      const fresh = await api.get('/performance');
      if (Array.isArray(fresh)) setReviews(fresh);
      setShowForm(false);
      setForm({ employeeId:'', period:'Q1 2024', technicalScore:80, communicationScore:80, leadershipScore:80, deliveryScore:80, innovationScore:80, teamworkScore:80, comments:'', goals:'' });
    } catch {} finally { setSubmitting(false); }
  };

  const radarData = SKILLS.map(k => ({ skill: SKILL_LABELS[k], value: form[k] }));
  const topPerformers = [...activeEmps].sort((a,b) => b.performance - a.performance).slice(0, 8);
  const sortedPerformance = [...activeEmps].sort((a,b)=>b.performance-a.performance);
  const COLORS = ['#7c3aed','#3b82f6','#22c55e','#f59e0b','#ef4444','#06b6d4','#84cc16','#f97316'];

  return (
    <div className="animate-fade">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
        <button className="btn btn-secondary" style={{ marginRight: 8 }} onClick={() => downloadCSV('performance', sortedPerformance.map(emp => ({
          Employee: emp.name,
          Department: emp.department,
          Position: emp.position,
          Score: emp.performance,
          Status: emp.performance >= 90 ? 'Excellent' : emp.performance >= 75 ? 'Good' : 'Needs Review',
        }))) }><Download size={15}/> Export CSV</button>
        {isManager && <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15}/> Add Review</button>}
      </div>

      <div className="grid-4 mb-6">
        <StatCard label="Avg Performance" value={avgPerf} suffix="/100" change={4.8} icon={<TrendingUp size={20}/>} iconBg="#f3e8ff" iconColor="#7c3aed"/>
        <StatCard label="Top Performers" value={top} icon={<Star size={20}/>} iconBg="#fef9c3" iconColor="#b45309"/>
        <StatCard label="Needs Review" value={needsReview} icon={<Target size={20}/>} iconBg="#fee2e2" iconColor="#dc2626"/>
        <StatCard label="Reviews Done" value={reviews.length} icon={<Award size={20}/>} iconBg="#dcfce7" iconColor="#16a34a"/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Team Performance Scores</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={topPerformers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:11, fill:'var(--text-muted)' }}/>
              <YAxis type="category" dataKey="name" tick={{ fontSize:10, fill:'var(--text-muted)' }} width={90} tickFormatter={v=>v.split(' ')[0]}/>
              <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} formatter={(v:any)=>[`${v}/100`,'Score']}/>
              <Bar dataKey="performance" radius={[0,4,4,0]} name="Score">
                {topPerformers.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Skill Breakdown Preview</h3>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="var(--border)"/>
              <PolarAngleAxis dataKey="skill" tick={{ fontSize:10, fill:'var(--text-muted)' }}/>
              <Radar name="Team Avg" dataKey="value" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.3} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Performance Table */}
      <div className="card mb-6">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Employee</th><th>Department</th><th>Score</th><th>Trend</th><th>Status</th></tr>
            </thead>
            <tbody>
              {sortedPerformance.map(emp => (
                <tr key={emp.id}>
                  <td><div style={{ display:'flex', alignItems:'center', gap:10 }}><div className="avatar avatar-sm">{emp.avatar}</div><div><div style={{ fontWeight:600, fontSize:'0.875rem' }}>{emp.name}</div><div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{emp.position}</div></div></div></td>
                  <td><span className="chip">{emp.department}</span></td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="progress" style={{ width:80 }}><div className="progress-bar progress-green" style={{ width:`${emp.performance}%` }}/></div>
                      <span style={{ fontWeight:700, fontSize:'0.875rem' }}>{emp.performance}</span>
                    </div>
                  </td>
                  <td><span style={{ color: emp.performance >= 85 ? '#16a34a' : emp.performance >= 70 ? '#b45309' : '#dc2626', fontSize:'0.8rem', fontWeight:600 }}>{emp.performance >= 85 ? '▲ On Track' : emp.performance >= 70 ? '► Steady' : '▼ At Risk'}</span></td>
                  <td><span className={`badge ${emp.performance >= 90 ? 'badge-green' : emp.performance >= 75 ? 'badge-blue' : 'badge-red'}`}>{emp.performance >= 90 ? 'Excellent' : emp.performance >= 75 ? 'Good' : 'Needs Review'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review History */}
      {reviews.length > 0 && (
        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Recent Reviews</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {reviews.slice(0,5).map((r:any) => {
              const emp = employees.find(e=>e.id===r.employeeId);
              return (
                <div key={r.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderBottom:'1px solid var(--border-light)' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                    <div className="avatar avatar-sm">{emp?.avatar||'?'}</div>
                    <div><div style={{ fontWeight:600, fontSize:'0.875rem' }}>{emp?.name||'Unknown'}</div><div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{r.period} · Reviewed by {employees.find(e=>e.id===r.reviewerId)?.name || r.reviewerId}</div></div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                    <div style={{ textAlign:'right' }}><div style={{ fontSize:'1.25rem', fontWeight:800, color:'var(--primary)' }}>{r.overallScore}</div><div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>Overall</div></div>
                    <span className={`badge ${r.overallScore>=90?'badge-green':r.overallScore>=75?'badge-blue':'badge-red'}`}>{r.status}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Review Form Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:600, maxHeight:'90vh', overflowY:'auto', padding:'28px 32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3>Add Performance Review</h3>
              <button onClick={()=>setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'grid', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select className="input" value={form.employeeId} onChange={e=>setForm((f:any)=>({...f,employeeId:e.target.value}))}>
                  <option value="">Select employee</option>
                  {reviewTargets.map(e=><option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Review Period</label>
                <select className="input" value={form.period} onChange={e=>setForm((f:any)=>({...f,period:e.target.value}))}>
                  {['Q1 2024','Q2 2024','Q3 2024','Q4 2024','Annual 2024'].map(p=><option key={p}>{p}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {SKILLS.map(skill => (
                  <div key={skill} className="form-group">
                    <label className="form-label">{SKILL_LABELS[skill]} <span style={{ color:'var(--primary)', fontWeight:700 }}>{form[skill]}</span></label>
                    <input type="range" min={0} max={100} value={form[skill]} onChange={e=>setForm((f:any)=>({...f,[skill]:parseInt(e.target.value)}))} style={{ width:'100%', accentColor:'#7c3aed' }}/>
                  </div>
                ))}
              </div>
              <div className="form-group">
                <label className="form-label">Comments</label>
                <textarea className="input" rows={3} value={form.comments} onChange={e=>setForm((f:any)=>({...f,comments:e.target.value}))} placeholder="Overall feedback and observations..."/>
              </div>
              <div className="form-group">
                <label className="form-label">Goals for Next Quarter</label>
                <textarea className="input" rows={2} value={form.goals} onChange={e=>setForm((f:any)=>({...f,goals:e.target.value}))} placeholder="Key goals and expectations..."/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-secondary" onClick={()=>setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting||!form.employeeId}><Check size={15}/>{submitting?'Saving...':'Submit Review'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
