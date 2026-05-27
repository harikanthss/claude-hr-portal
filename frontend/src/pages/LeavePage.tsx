import React, { useState } from 'react';
import { useStore, api } from '../services/store';
import type { LeaveRequest } from '../types';
import { Calendar, CheckCircle2, XCircle, Clock, Plus, X, Check, AlertCircle } from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import { exportLeaves } from '../utils/exportCSV';

const LEAVE_TYPES = ['sick','casual','annual','emergency','maternity','paternity','compensatory'];
const STATUS_CONFIG: Record<string,{color:string;bg:string;icon:React.ReactNode}> = {
  pending:  { color:'#b45309', bg:'#fef9c3', icon:<Clock size={12}/> },
  approved: { color:'#16a34a', bg:'#dcfce7', icon:<CheckCircle2 size={12}/> },
  rejected: { color:'#dc2626', bg:'#fee2e2', icon:<XCircle size={12}/> },
};

export default function LeavePage() {
  const { currentUser, leaveRequests, approveLeave, rejectLeave, applyLeave } = useStore();
  const isManager = ['admin','hr_manager','manager'].includes(currentUser?.role||'');

  const [showApply, setShowApply] = useState(false);
  const [form, setForm] = useState({ type:'sick', startDate:'', endDate:'', reason:'' });
  const [submitting, setSubmitting] = useState(false);
  const [actionId, setActionId] = useState<string|null>(null);
  const [comment, setComment] = useState('');
  const [activeTab, setActiveTab] = useState<string>('all');

  const myLeaves = currentUser?.role === 'employee' ? leaveRequests.filter(r => r.employeeId === currentUser.id) : leaveRequests;
  const filtered = activeTab === 'all' ? myLeaves : myLeaves.filter(r => r.status === activeTab as unknown as string);
  const pending = leaveRequests.filter(r => r.status === 'pending').length;
  const approved = leaveRequests.filter(r => r.status === 'approved').length;

  const calcDays = () => {
    if (!form.startDate || !form.endDate) return 0;
    const diff = new Date(form.endDate).getTime() - new Date(form.startDate).getTime();
    return Math.max(1, Math.ceil(diff / 86400000) + 1);
  };

  const handleApply = async () => {
    if (!form.startDate || !form.endDate) return;
    setSubmitting(true);
    try {
      await applyLeave({ ...form, type: form.type as LeaveRequest['type'], days: calcDays(), employeeId: currentUser!.id, employeeName: currentUser!.name, employeeAvatar: currentUser!.avatar, department: currentUser!.department });
      setShowApply(false);
      setForm({ type:'sick', startDate:'', endDate:'', reason:'' });
    } catch {} finally { setSubmitting(false); }
  };

  const handleAction = async (id: string, action: 'approved'|'rejected') => {
    if (action === 'approved') await approveLeave(id, comment);
    else await rejectLeave(id, comment);
    setActionId(null);
    setComment('');
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
    return (
      <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'3px 10px', borderRadius:20, background:cfg.bg, color:cfg.color, fontSize:'0.7rem', fontWeight:700 }}>
        {cfg.icon} {status.charAt(0).toUpperCase()+status.slice(1)}
      </span>
    );
  };

  return (
    <div className="animate-fade">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:20 }}>
        <button className="btn btn-secondary" onClick={() => exportLeaves(myLeaves)} style={{ marginRight:8 }}>⬇ Export CSV</button>
        <button className="btn btn-primary" onClick={() => setShowApply(true)}><Plus size={15}/> Apply for Leave</button>
      </div>

      <div className="grid-4 mb-6">
        <StatCard label="Total Requests" value={myLeaves.length} icon={<Calendar size={20}/>} iconBg="#dbeafe" iconColor="#1d4ed8"/>
        <StatCard label="Pending" value={pending} icon={<Clock size={20}/>} iconBg="#fef9c3" iconColor="#b45309"/>
        <StatCard label="Approved" value={approved} icon={<CheckCircle2 size={20}/>} iconBg="#dcfce7" iconColor="#16a34a"/>
        <StatCard label="Rejected" value={myLeaves.filter(r=>r.status==='rejected').length} icon={<XCircle size={20}/>} iconBg="#fee2e2" iconColor="#dc2626"/>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:16, background:'var(--bg)', padding:4, borderRadius:12, width:'fit-content' }}>
        {(['all','pending','approved','rejected']).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ padding:'8px 16px', borderRadius:9, border:'none', cursor:'pointer', fontSize:'0.8rem', fontWeight:600, background:activeTab===tab?'var(--bg-card)':'transparent', color:activeTab===tab?'var(--text-primary)':'var(--text-muted)', boxShadow:activeTab===tab?'var(--shadow-sm)':'none', transition:'all 200ms', textTransform:'capitalize' }}>{tab} {tab!=='all'&&<span style={{ marginLeft:4, padding:'1px 6px', borderRadius:10, background:activeTab===tab?'var(--primary)':'var(--border)', color:activeTab===tab?'white':'var(--text-muted)', fontSize:'0.65rem' }}>{myLeaves.filter(r=>tab==='all'||r.status===tab).length}</span>}</button>
        ))}
      </div>

      {/* Leave List */}
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead>
              <tr>
                {isManager && <th>Employee</th>}
                <th>Type</th><th>Start</th><th>End</th><th>Days</th><th>Reason</th><th>Applied</th><th>Status</th>
                {isManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={isManager?9:8} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>No leave requests found</td></tr>
              ) : filtered.map(req => (
                <tr key={req.id}>
                  {isManager && (
                    <td><div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="avatar avatar-sm">{req.employeeAvatar}</div>
                      <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{req.employeeName}</div>
                    </div></td>
                  )}
                  <td><span className="chip" style={{ textTransform:'capitalize' }}>{req.type}</span></td>
                  <td style={{ fontSize:'0.85rem' }}>{req.startDate}</td>
                  <td style={{ fontSize:'0.85rem' }}>{req.endDate}</td>
                  <td><span style={{ fontWeight:700 }}>{req.days}</span></td>
                  <td style={{ fontSize:'0.8rem', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-secondary)' }}>{req.reason||'—'}</td>
                  <td style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{req.appliedOn?.split('T')[0]}</td>
                  <td><StatusBadge status={req.status}/></td>
                  {isManager && (
                    <td>
                      {req.status === 'pending' ? (
                        <div style={{ display:'flex', gap:6 }}>
                          <button className="btn btn-secondary btn-sm" style={{ background:'#dcfce7', color:'#16a34a', border:'1px solid #86efac' }} onClick={()=>{setActionId(req.id+':approved');setComment('');}}><Check size={13}/> Approve</button>
                          <button className="btn btn-secondary btn-sm" style={{ background:'#fee2e2', color:'#dc2626', border:'1px solid #fecaca' }} onClick={()=>{setActionId(req.id+':rejected');setComment('');}}><X size={13}/> Reject</button>
                        </div>
                      ) : (
                        <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>by {req.approvedBy||'—'}</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Modal */}
      {actionId && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:400, padding:'24px 28px' }}>
            <h3 style={{ marginBottom:16 }}>{actionId.includes('approved') ? '✅ Approve Leave' : '❌ Reject Leave'}</h3>
            <div className="form-group">
              <label className="form-label">Comment (optional)</label>
              <textarea className="input" rows={3} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Add a comment..."/>
            </div>
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:16 }}>
              <button className="btn btn-secondary" onClick={()=>setActionId(null)}>Cancel</button>
              <button className={`btn ${actionId.includes('approved')?'btn-primary':''}`} style={actionId.includes('rejected')?{background:'#dc2626',color:'white'}:{}} onClick={()=>{const[id,action]=actionId.split(':');handleAction(id,action as any);}}>
                {actionId.includes('approved')?'Approve':'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Apply Modal */}
      {showApply && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:460, padding:'28px 32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:20 }}>
              <h3>Apply for Leave</h3>
              <button onClick={()=>setShowApply(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)' }}><X size={20}/></button>
            </div>
            <div style={{ display:'grid', gap:14 }}>
              <div className="form-group">
                <label className="form-label">Leave Type *</label>
                <select className="input" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {LEAVE_TYPES.map(t=><option key={t} value={t} style={{ textTransform:'capitalize' }}>{t.charAt(0).toUpperCase()+t.slice(1)}</option>)}
                </select>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                <div className="form-group">
                  <label className="form-label">Start Date *</label>
                  <input type="date" className="input" value={form.startDate} onChange={e=>setForm(f=>({...f,startDate:e.target.value}))} min={new Date().toISOString().split('T')[0]}/>
                </div>
                <div className="form-group">
                  <label className="form-label">End Date *</label>
                  <input type="date" className="input" value={form.endDate} onChange={e=>setForm(f=>({...f,endDate:e.target.value}))} min={form.startDate||new Date().toISOString().split('T')[0]}/>
                </div>
              </div>
              {form.startDate && form.endDate && (
                <div style={{ padding:'10px 14px', background:'var(--primary-subtle)', borderRadius:8, border:'1px solid var(--primary)', display:'flex', alignItems:'center', gap:8 }}>
                  <AlertCircle size={15} color="var(--primary)"/>
                  <span style={{ fontSize:'0.85rem', color:'var(--primary)', fontWeight:600 }}>{calcDays()} working day{calcDays()!==1?'s':''} requested</span>
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Reason</label>
                <textarea className="input" rows={3} value={form.reason} onChange={e=>setForm(f=>({...f,reason:e.target.value}))} placeholder="Brief reason for leave..."/>
              </div>
              <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
                <button className="btn btn-secondary" onClick={()=>setShowApply(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleApply} disabled={submitting||!form.startDate||!form.endDate}>{submitting?'Submitting...':'Submit Request'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
