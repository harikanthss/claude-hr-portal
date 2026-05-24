import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { Download, RefreshCw, CheckCircle2, AlertCircle, Zap, FileText } from 'lucide-react';
import { exportPayslips } from '../utils/exportCSV';

interface Payslip { id:string; employeeId:string; month:string; year:number; basicSalary:number; hra:number; conveyance:number; medical:number; bonus:number; pf:number; tax:number; netSalary:number; generatedOn?:string; }

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export default function PayslipsPage() {
  const { currentUser, employees } = useStore();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [selected, setSelected] = useState<Payslip|null>(null);
  const [loading, setLoading] = useState(true);
  const isHR = ['admin','hr_manager'].includes(currentUser?.role||'');

  // Generate payslip state
  const [genMonth, setGenMonth] = useState(String(new Date().getMonth()+1).padStart(2,'0'));
  const [genYear, setGenYear] = useState(String(new Date().getFullYear()));
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<any>(null);

  useEffect(() => {
    api.get('/payslips').then(d => {
      if (Array.isArray(d) && d.length > 0) { setPayslips(d); setSelected(d[0]); }
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleGenerate = async () => {
    setGenerating(true); setGenResult(null);
    try {
      const monthName = MONTHS[parseInt(genMonth)-1];
      const result = await api.post('/payslips/generate', { month: genMonth, year: parseInt(genYear) });
      setGenResult(result);
      // Refresh payslips
      const fresh = await api.get('/payslips');
      if (Array.isArray(fresh) && fresh.length > 0) { setPayslips(fresh); setSelected(fresh[0]); }
    } catch (err: any) {
      setGenResult({ error: err.message || 'Failed to generate' });
    } finally { setGenerating(false); }
  };

  if (loading) return <div className="animate-fade"><div style={{ textAlign:'center', padding:60, color:'var(--text-muted)' }}>Loading payslips...</div></div>;

  const gross = selected ? selected.basicSalary + selected.hra + selected.conveyance + selected.medical + selected.bonus : 0;
  const totalDed = selected ? selected.pf + selected.tax : 0;

  return (
    <div className="animate-fade">
      {/* HR: Generate Payslips */}
      {isHR && (
        <div className="card p-6 mb-6" style={{ borderLeft:'4px solid #7c3aed' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
            <div style={{ width:38, height:38, borderRadius:10, background:'#f3e8ff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Zap size={18} color="#7c3aed" />
            </div>
            <div>
              <h3 style={{ margin:0 }}>Generate Monthly Payslips</h3>
              <p style={{ margin:0, fontSize:'0.78rem', color:'var(--text-muted)' }}>Auto-calculates Basic, HRA, PF (12%), TDS (new regime slabs), ESI for all active employees</p>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:12, flexWrap:'wrap' }}>
            <div>
              <label style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Month</label>
              <select className="input" value={genMonth} onChange={e=>setGenMonth(e.target.value)} style={{ width:160 }}>
                {MONTHS.map((m,i) => <option key={m} value={String(i+1).padStart(2,'0')}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize:'0.75rem', fontWeight:600, color:'var(--text-secondary)', display:'block', marginBottom:6 }}>Year</label>
              <select className="input" value={genYear} onChange={e=>setGenYear(e.target.value)} style={{ width:100 }}>
                {[2024,2025,2026].map(y => <option key={y}>{y}</option>)}
              </select>
            </div>
            <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
              {generating ? <><div className="spinner" style={{ width:15, height:15, borderWidth:2 }}/> Generating...</> : <><Zap size={15}/> Generate & Email All</>}
            </button>
          </div>
          {genResult && (
            <div style={{ marginTop:16, padding:'14px 16px', borderRadius:10, background: genResult.error ? '#fee2e2' : '#dcfce7', border:`1px solid ${genResult.error ? '#fecaca' : '#86efac'}` }}>
              {genResult.error ? (
                <div style={{ display:'flex', alignItems:'center', gap:8, color:'#dc2626', fontSize:'0.85rem' }}><AlertCircle size={15}/> {genResult.error}</div>
              ) : (
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, color:'#16a34a', fontSize:'0.875rem', fontWeight:600, marginBottom:8 }}><CheckCircle2 size={15}/> {genResult.message?.replace("Payslips processed for", "✅ Payslips generated for")}</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                    {genResult.results?.map((r: any) => (
                      <span key={r.name} style={{ fontSize:'0.7rem', padding:'3px 8px', borderRadius:20, background:r.status==='generated'?'#dcfce7':'#f1f5f9', color:r.status==='generated'?'#16a34a':'#64748b', border:`1px solid ${r.status==='generated'?'#86efac':'#e2e8f0'}` }}>
                        {r.name}: {r.status==='generated' ? `₹${Number(r.net).toLocaleString('en-IN')}` : r.status}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {payslips.length === 0 ? (
        <div className="card p-6" style={{ textAlign:'center', color:'var(--text-muted)' }}>
          <FileText size={40} style={{ marginBottom:12 }}/><br/>
          No payslips yet. {isHR ? 'Use the generator above to create payslips.' : 'Contact HR.'}
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:20 }}>
          {/* Sidebar */}
          <div className="card" style={{ padding:16, height:'fit-content' }}>
            <h4 style={{ marginBottom:14, fontSize:'0.85rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)' }}>History</h4>
            {payslips.map(slip => (
              <div key={slip.id} onClick={()=>setSelected(slip)} style={{ padding:'12px 14px', borderRadius:10, cursor:'pointer', background:selected?.id===slip.id?'var(--primary-subtle)':'transparent', border:selected?.id===slip.id?'1px solid var(--primary)':'1px solid transparent', marginBottom:6, transition:'all 150ms' }}>
                <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{slip.month} {slip.year}</div>
                <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>Net: ₹{Number(slip.netSalary).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>

          {/* Detail */}
          {selected && (
            <div className="card p-6">
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24 }}>
                <div>
                  <h2 style={{ fontSize:'1.25rem', marginBottom:6 }}>Payslip — {selected.month} {selected.year}</h2>
                  <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                    <span style={{ padding:'3px 10px', borderRadius:20, background:'#dcfce7', color:'#16a34a', fontSize:'0.7rem', fontWeight:700 }}>PAID</span>
                    <span style={{ fontSize:'0.8rem', color:'var(--text-muted)' }}>{currentUser?.name} · {currentUser?.department}</span>
                  </div>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="btn btn-secondary" onClick={()=>exportPayslips(payslips, employees)} title="Export all payslips to CSV">⬇ Export CSV</button>
                  <button className="btn btn-primary" onClick={()=>window.print()}><Download size={15}/> Download PDF</button>
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginBottom:24 }}>
                {/* Earnings */}
                <div>
                  <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#16a34a', marginBottom:12 }}>Earnings</div>
                  {[
                    { label:'Basic Salary (50%)', val:selected.basicSalary },
                    { label:'HRA (20%)', val:selected.hra },
                    { label:'Conveyance', val:selected.conveyance },
                    { label:'Medical Allowance', val:selected.medical },
                    ...(selected.bonus ? [{ label:'Performance Bonus', val:selected.bonus }] : []),
                  ].map(item => (
                    <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:'0.85rem' }}>
                      <span style={{ color:'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight:600 }}>₹{Number(item.val).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', fontWeight:700, color:'#16a34a' }}>
                    <span>Gross Earnings</span><span>₹{gross.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div>
                  <div style={{ fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'#dc2626', marginBottom:12 }}>Deductions</div>
                  {[
                    { label:'PF (12% of Basic)', val:selected.pf },
                    { label:'Income Tax (TDS)', val:selected.tax },
                  ].map(item => (
                    <div key={item.label} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--border-light)', fontSize:'0.85rem' }}>
                      <span style={{ color:'var(--text-secondary)' }}>{item.label}</span>
                      <span style={{ fontWeight:600, color:'#dc2626' }}>−₹{Number(item.val).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                  <div style={{ display:'flex', justifyContent:'space-between', padding:'12px 0', fontWeight:700, color:'#dc2626' }}>
                    <span>Total Deductions</span><span>−₹{totalDed.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>

              {/* Net */}
              <div style={{ background:'linear-gradient(135deg,#1a4a28,#0f2b18)', borderRadius:14, padding:'24px 28px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ color:'rgba(255,255,255,0.6)', fontSize:'0.8rem', marginBottom:4 }}>Net Salary (Take Home)</div>
                  <div style={{ color:'white', fontSize:'2rem', fontWeight:800, letterSpacing:'-0.03em' }}>₹{Number(selected.netSalary).toLocaleString('en-IN')}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ color:'rgba(255,255,255,0.5)', fontSize:'0.72rem' }}>Generated</div>
                  <div style={{ color:'#4ade80', fontWeight:600, fontSize:'0.85rem' }}>{selected.generatedOn ? new Date(selected.generatedOn).toLocaleDateString('en-IN') : `28 ${selected.month} ${selected.year}`}</div>
                </div>
              </div>

              {/* Tax breakdown */}
              <div style={{ marginTop:20, padding:'14px 18px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)' }}>
                <div style={{ fontSize:'0.75rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Indian Tax Compliance</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {[
                    { label:'PF (EPFO)', val:`₹${Number(selected.pf).toLocaleString('en-IN')}/mo`, sub:'12% employer match' },
                    { label:'TDS (New Regime)', val:`₹${Number(selected.tax).toLocaleString('en-IN')}/mo`, sub:`₹${(Number(selected.tax)*12).toLocaleString('en-IN')} annual` },
                    { label:'ESI', val: Number(selected.basicSalary)*2 <= 21000 ? `₹${Math.round(Number(selected.basicSalary)*2*0.0075).toLocaleString('en-IN')}/mo` : 'Not applicable', sub: Number(selected.basicSalary)*2 <= 21000 ? '0.75% of gross' : 'Salary > ₹21k' },
                  ].map(item => (
                    <div key={item.label} style={{ textAlign:'center', padding:'10px', background:'var(--bg-card)', borderRadius:8, border:'1px solid var(--border)' }}>
                      <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', marginBottom:4 }}>{item.label}</div>
                      <div style={{ fontWeight:700, fontSize:'0.9rem' }}>{item.val}</div>
                      <div style={{ fontSize:'0.65rem', color:'var(--text-muted)' }}>{item.sub}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
