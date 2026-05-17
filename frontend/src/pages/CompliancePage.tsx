import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Download, FileText, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function CompliancePage() {
  const { employees } = useStore();
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    api.get('/reports/summary').then(d => setSummary(d)).catch(() => {});
  }, []);

  const active = employees.filter(e => e.status === 'active');
  const totalSalary = active.reduce((s, e) => s + e.salary, 0);
  const totalPF = active.reduce((s, e) => s + Math.round(e.salary * 0.5 * 0.12), 0);
  const totalESI = active.filter(e => e.salary <= 21000).reduce((s, e) => s + Math.round(e.salary * 0.0075), 0);
  const totalPT = active.length * 200; // Professional Tax ₹200/mo standard

  const reports = [
    { id:'pf', name:'EPF/PF Return', due:'15th every month', form:'ECR Upload', status:'due', color:'#3b82f6', amount:totalPF, desc:'Employees Provident Fund — 12% employer + 12% employee contribution' },
    { id:'esi', name:'ESI Return', due:'15th every month', form:'Form 5', status:'due', color:'#22c55e', amount:totalESI, desc:'Employee State Insurance — 0.75% employee, 3.25% employer (salary ≤ ₹21,000)' },
    { id:'pt', name:'Professional Tax', due:'Last day of month', form:'State Form', status:'due', color:'#f59e0b', amount:totalPT, desc:'State-level professional tax — ₹200/employee/month (Karnataka, Maharashtra, etc.)' },
    { id:'tds', name:'TDS Return (24Q)', due:'31st Oct / 31st Jan / 31st May', form:'Form 24Q', status:'quarterly', color:'#7c3aed', amount:summary?.avgSalary ? Math.round(summary.avgSalary * 0.1 * active.length) : 0, desc:'Tax Deducted at Source on salary — filed quarterly with ITD' },
    { id:'pf-annual', name:'PF Annual Return', due:'30th April', form:'Form 3A + 6A', status:'annual', color:'#06b6d4', amount: totalPF * 12, desc:'Annual reconciliation of provident fund contributions' },
    { id:'pt-annual', name:'PT Annual Return', due:'31st March', form:'State Specific', status:'annual', color:'#ef4444', amount: totalPT * 12, desc:'Annual professional tax return — varies by state' },
  ];

  const pfData = active.slice(0, 8).map(e => ({
    name: e.name.split(' ')[0],
    employee: Math.round(e.salary * 0.5 * 0.12),
    employer: Math.round(e.salary * 0.5 * 0.12),
  }));

  const statusBadge = (status: string) => {
    const map: Record<string, any> = {
      due: { label:'Monthly', bg:'#dbeafe', color:'#1d4ed8' },
      quarterly: { label:'Quarterly', bg:'#f3e8ff', color:'#7c3aed' },
      annual: { label:'Annual', bg:'#fef9c3', color:'#b45309' },
    };
    const s = map[status] || map.due;
    return <span style={{ padding:'3px 8px', borderRadius:20, background:s.bg, color:s.color, fontSize:'0.7rem', fontWeight:700 }}>{s.label}</span>;
  };

  return (
    <div className="animate-fade">
      {/* Header stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:24 }}>
        {[
          { label:'Monthly PF Liability', val:`₹${totalPF.toLocaleString('en-IN')}`, sub:'Employer + Employee share', color:'#3b82f6', bg:'#dbeafe' },
          { label:'ESI Liability', val:`₹${totalESI.toLocaleString('en-IN')}`, sub:`${active.filter(e=>e.salary<=21000).length} eligible employees`, color:'#22c55e', bg:'#dcfce7' },
          { label:'Prof. Tax (Monthly)', val:`₹${totalPT.toLocaleString('en-IN')}`, sub:`${active.length} employees × ₹200`, color:'#f59e0b', bg:'#fef9c3' },
          { label:'Annual CTC Payout', val:`₹${(totalSalary*12/100000).toFixed(1)}L`, sub:`${active.length} active employees`, color:'#7c3aed', bg:'#f3e8ff' },
        ].map(stat => (
          <div key={stat.label} className="card" style={{ padding:'18px 20px', borderTop:`3px solid ${stat.color}` }}>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color:stat.color, marginBottom:4 }}>{stat.val}</div>
            <div style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', marginBottom:2 }}>{stat.label}</div>
            <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      {/* Compliance Reports Table */}
      <div className="card p-6 mb-6">
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
          <Shield size={20} color="var(--primary)" />
          <h3>Statutory Compliance Reports</h3>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {reports.map(report => (
            <div key={report.id} style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto', alignItems:'center', gap:16, padding:'16px 20px', borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', transition:'all 200ms' }}>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:10, background:`${report.color}15`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <FileText size={18} color={report.color} />
                </div>
                <div>
                  <div style={{ fontWeight:700, fontSize:'0.875rem' }}>{report.name}</div>
                  <div style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{report.desc}</div>
                </div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:2 }}>Filing</div>
                <div style={{ fontSize:'0.8rem', fontWeight:600 }}>{statusBadge(report.status)}</div>
              </div>
              <div style={{ textAlign:'center' }}>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:2 }}>Due</div>
                <div style={{ fontSize:'0.78rem', fontWeight:500 }}>{report.due}</div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:4 }}>Amount</div>
                <div style={{ fontWeight:800, color:report.color, fontSize:'1rem' }}>₹{report.amount.toLocaleString('en-IN')}</div>
                <button className="btn btn-secondary btn-sm" style={{ marginTop:8 }} onClick={()=>window.print()}>
                  <Download size={12}/> Export
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PF Chart */}
      <div className="card p-6 mb-6">
        <h3 style={{ marginBottom:16 }}>PF Contribution by Employee (Monthly)</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={pfData}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="name" tick={{ fontSize:11, fill:'var(--text-muted)' }} />
            <YAxis tick={{ fontSize:11, fill:'var(--text-muted)' }} tickFormatter={v=>`₹${(v/1000).toFixed(0)}k`} />
            <Tooltip contentStyle={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:8, fontSize:12 }} formatter={(v:any)=>[`₹${Number(v).toLocaleString('en-IN')}`,'']} />
            <Bar dataKey="employee" fill="#3b82f6" radius={[4,4,0,0]} name="Employee PF" />
            <Bar dataKey="employer" fill="#22c55e" radius={[4,4,0,0]} name="Employer PF" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Compliance checklist */}
      <div className="card p-6">
        <h3 style={{ marginBottom:16 }}>Monthly Compliance Checklist</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
          {[
            { label:'Generate payslips for all active employees', done:true },
            { label:'Deposit PF by 15th of the month', done:false },
            { label:'File ESI return & deposit by 15th', done:false },
            { label:'Deduct & deposit TDS with TRACES', done:true },
            { label:'Issue Form 16 by June 15th (annual)', done:true },
            { label:'Submit PF ECR upload to EPFO', done:false },
            { label:'File quarterly 24Q with ITD', done:false },
            { label:'PT deposit to state government', done:false },
          ].map((item, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 14px', borderRadius:10, background:item.done?'#dcfce7':'var(--bg)', border:`1px solid ${item.done?'#86efac':'var(--border)'}` }}>
              {item.done ? <CheckCircle2 size={16} color="#16a34a" /> : <AlertCircle size={16} color="#f59e0b" />}
              <span style={{ fontSize:'0.82rem', color:item.done?'#16a34a':'var(--text)', fontWeight:item.done?500:400 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
