import { PageLoader } from '../components/ui/SkeletonLoader';
import React, { useState, useEffect } from 'react';
import { api } from '../services/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Plus, TrendingUp, AlertTriangle, CheckCircle2, X, Check } from 'lucide-react';
import { downloadCSV } from '../utils/exportCSV';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DEPT_COLORS: Record<string, string> = {
  Engineering:'#3b82f6', Design:'#8b5cf6', Sales:'#22c55e',
  HR:'#f59e0b', Finance:'#ef4444', Marketing:'#06b6d4', Operations:'#f97316', General:'#94a3b8',
};

export default function BudgetPage() {
  const [summary, setSummary] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ department:'Engineering', month:'March', year:'2024', budgetAmount:'' });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState('2024');

  const fetchSummary = () => {
    setLoading(true);
    api.get(`/budgets/summary?year=${parseInt(year)}`)
      .then(d => { if (Array.isArray(d)) setSummary(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSummary(); }, [year]);

  const handleSave = async () => {
    if (!form.budgetAmount) return;
    setSaving(true);
    try {
      await api.post('/budgets', { ...form, year: parseInt(form.year) });
      setShowForm(false);
      setForm({ department:'Engineering', month:'March', year:'2024', budgetAmount:'' });
      fetchSummary();
    } catch {} finally { setSaving(false); }
  };

  const totalBudget = summary.reduce((s, d) => s + d.budget, 0);
  const totalSpent = summary.reduce((s, d) => s + d.spent, 0);
  const overBudget = summary.filter(d => d.budget > 0 && d.spent > d.budget);

  const barData = summary.filter(d => d.budget > 0).map(d => ({
    name: d.department,
    Budget: Math.round(d.budget / 1000),
    Spent: Math.round(d.spent / 1000),
  }));

  return (
    <div className="animate-fade">
      {loading && summary.length === 0 ? <PageLoader /> : null}
      <div style={{ display:'flex', justifyContent:'flex-end', gap:8, marginBottom:20 }}>
        <select className="input" value={year} onChange={e => setYear(e.target.value)} style={{ width:100 }}>
          {['2023','2024','2025'].map(y => <option key={y}>{y}</option>)}
        </select>
        <button className="btn btn-secondary" onClick={() => downloadCSV('budget-report', summary)}>⬇ Export</button>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}><Plus size={15}/> Set Budget</button>
      </div>

      {/* KPI row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Total Annual Budget', val:`₹${(totalBudget/100000).toFixed(1)}L`, icon:<TrendingUp size={20}/>, bg:'#dbeafe', color:'#1d4ed8' },
          { label:'Total Spent', val:`₹${(totalSpent/100000).toFixed(1)}L`, icon:<TrendingUp size={20}/>, bg:'#dcfce7', color:'#16a34a' },
          { label:'Budget Utilisation', val:`${totalBudget ? Math.round((totalSpent/totalBudget)*100) : 0}%`, icon:<CheckCircle2 size={20}/>, bg:'#f3e8ff', color:'#7c3aed' },
          { label:'Depts Over Budget', val:overBudget.length, icon:<AlertTriangle size={20}/>, bg:'#fee2e2', color:'#dc2626' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'18px 20px', borderTop:`3px solid ${s.color}` }}>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:6 }}>
              <div style={{ width:36, height:36, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center' }}>{React.cloneElement(s.icon, { color: s.color })}</div>
            </div>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:20 }}>
        {/* Bar chart */}
        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Budget vs Actual Spend (₹K)</h3>
          {barData.length === 0 ? (
            <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No budgets set yet. Click "Set Budget" to begin.</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={barData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/>
                <XAxis dataKey="name" tick={{ fontSize:10, fill:'var(--text-muted)' }}/>
                <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} tickFormatter={v=>`₹${v}K`}/>
                <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} formatter={(v:any)=>[`₹${Number(v)}K`,'']}/>
                <Bar dataKey="Budget" fill="#dbeafe" stroke="#3b82f6" strokeWidth={1} radius={[4,4,0,0]} name="Budget"/>
                <Bar dataKey="Spent" radius={[4,4,0,0]} name="Spent">
                  {barData.map((entry, i) => <Cell key={i} fill={entry.Spent > entry.Budget ? '#ef4444' : '#22c55e'}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Utilization bars */}
        <div className="card p-6">
          <h3 style={{ marginBottom:16 }}>Department Utilisation</h3>
          <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
            {summary.filter(d => d.budget > 0).map(d => {
              const pct = Math.min(120, Math.round((d.spent / d.budget) * 100));
              const over = pct > 100;
              const color = DEPT_COLORS[d.department] || '#94a3b8';
              return (
                <div key={d.department}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5, fontSize:'0.82rem' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:10, height:10, borderRadius:3, background:color }}/>
                      <span style={{ fontWeight:600 }}>{d.department}</span>
                      {over && <span style={{ fontSize:'0.65rem', background:'#fee2e2', color:'#dc2626', padding:'1px 6px', borderRadius:10, fontWeight:700 }}>OVER BUDGET</span>}
                    </div>
                    <span style={{ color: over ? '#dc2626' : 'var(--text-muted)', fontWeight:over?700:400 }}>
                      ₹{Math.round(d.spent/1000)}K / ₹{Math.round(d.budget/1000)}K ({pct}%)
                    </span>
                  </div>
                  <div style={{ height:8, background:'var(--border)', borderRadius:4, overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background: over ? '#ef4444' : color, borderRadius:4, transition:'width 600ms' }}/>
                  </div>
                </div>
              );
            })}
            {summary.filter(d => d.budget > 0).length === 0 && (
              <div style={{ color:'var(--text-muted)', textAlign:'center', padding:20 }}>Set budgets per department to see utilisation.</div>
            )}
          </div>
        </div>
      </div>

      {/* Department table */}
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead><tr><th>Department</th><th>Headcount</th><th>Annual Budget</th><th>Spent</th><th>Remaining</th><th>Utilisation</th><th>Status</th></tr></thead>
            <tbody>
              {summary.map(d => {
                const remaining = d.budget - d.spent;
                const pct = d.budget ? Math.round((d.spent / d.budget) * 100) : 0;
                const over = d.budget > 0 && d.spent > d.budget;
                return (
                  <tr key={d.department}>
                    <td><div style={{ display:'flex', alignItems:'center', gap:8 }}><div style={{ width:10, height:10, borderRadius:3, background:DEPT_COLORS[d.department]||'#94a3b8' }}/><span style={{ fontWeight:600 }}>{d.department}</span></div></td>
                    <td style={{ fontWeight:600 }}>{d.headcount}</td>
                    <td style={{ fontWeight:600 }}>₹{d.budget > 0 ? Number(d.budget).toLocaleString('en-IN') : '—'}</td>
                    <td style={{ color: over?'#dc2626':'var(--text)', fontWeight:over?700:400 }}>₹{Number(d.spent).toLocaleString('en-IN')}</td>
                    <td style={{ color: remaining < 0 ? '#dc2626' : '#16a34a', fontWeight:600 }}>{d.budget > 0 ? `₹${Math.abs(remaining).toLocaleString('en-IN')}${remaining<0?' over':''}` : '—'}</td>
                    <td>
                      {d.budget > 0 ? (
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div className="progress" style={{ width:60 }}><div style={{ height:'100%', width:`${Math.min(100,pct)}%`, background:over?'#ef4444':'#22c55e', borderRadius:4 }}/></div>
                          <span style={{ fontSize:'0.8rem', fontWeight:600, color:over?'#dc2626':'#16a34a' }}>{pct}%</span>
                        </div>
                      ) : '—'}
                    </td>
                    <td>
                      {d.budget > 0 ? (
                        <span style={{ padding:'3px 10px', borderRadius:20, fontSize:'0.7rem', fontWeight:700, background:over?'#fee2e2':'#dcfce7', color:over?'#dc2626':'#16a34a' }}>
                          {over ? '⚠ Over Budget' : '✓ On Track'}
                        </span>
                      ) : <span style={{ color:'var(--text-muted)', fontSize:'0.75rem' }}>No budget set</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Set Budget Modal */}
      {showForm && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:420, padding:'28px 32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3>Set Department Budget</h3>
              <button onClick={() => setShowForm(false)} style={{ background:'none', border:'none', cursor:'pointer' }}><X size={18}/></button>
            </div>
            <div style={{ display:'grid', gap:14 }}>
              {[
                { label:'Department', key:'department', type:'select', options:['Engineering','Design','Sales','HR','Finance','Marketing','Operations'] },
                { label:'Month', key:'month', type:'select', options:MONTHS },
                { label:'Year', key:'year', type:'select', options:['2024','2025'] },
              ].map(f => (
                <div key={f.key} className="form-group">
                  <label className="form-label">{f.label}</label>
                  <select className="input" value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({...p,[f.key]:e.target.value}))}>
                    {f.options.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              ))}
              <div className="form-group">
                <label className="form-label">Budget Amount (₹)</label>
                <input type="number" className="input" value={form.budgetAmount} onChange={e => setForm(p => ({...p,budgetAmount:e.target.value}))} placeholder="e.g. 500000"/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving||!form.budgetAmount}><Check size={14}/> {saving?'Saving...':'Set Budget'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
