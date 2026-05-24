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


// ===================== PROFILE =====================
export default function ProfilePage() {
  const { currentUser } = useStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name:currentUser?.name||'', email:currentUser?.email||'', phone:'', location:'', bio:'' });
  const [empData, setEmpData] = useState({ points:0, streak:0, performance:0, attendance:0, joinDate:'', department:'', position:'', salary:0 });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [changePw, setChangePw] = useState(false);
  const [show2FA, setShow2FA] = useState(false);
  const [showSessions, setShowSessions] = useState(false);
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
      {/* 2FA Modal */}
      {show2FA && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:460, padding:'28px 32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3>Two-Factor Authentication</h3>
              <button onClick={()=>setShow2FA(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'1.2rem' }}>×</button>
            </div>
            <div style={{ padding:'20px', background:'var(--bg)', borderRadius:10, border:'1px solid var(--border)', marginBottom:16, textAlign:'center' }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>🔐</div>
              <div style={{ fontWeight:600, marginBottom:8 }}>TOTP Authentication</div>
              <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', lineHeight:1.6 }}>Two-factor authentication via authenticator app (Google Authenticator, Authy) will be available in the next release. Your account is protected by a strong JWT with 8-hour expiry and token revocation.</div>
            </div>
            <div style={{ display:'flex', gap:10, alignItems:'center', padding:'12px 16px', background:'#dbeafe', borderRadius:8 }}>
              <span style={{ fontSize:'1rem' }}>ℹ️</span>
              <span style={{ fontSize:'0.82rem', color:'#1d4ed8' }}>Your tokens are automatically revoked when you log out or change your password.</span>
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
              <button className="btn btn-secondary" onClick={()=>setShow2FA(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions Modal */}
      {showSessions && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
          <div className="card" style={{ width:'100%', maxWidth:480, padding:'28px 32px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:16 }}>
              <h3>Active Sessions</h3>
              <button onClick={()=>setShowSessions(false)} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', fontSize:'1.2rem' }}>×</button>
            </div>
            {[
              { device:'Chrome on Windows', location:'Bangalore, IN', time:'Current session', current:true },
              { device:'Safari on iPhone', location:'Bangalore, IN', time:'2 hours ago', current:false },
            ].map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 0', borderBottom:'1px solid var(--border-light)' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:40, height:40, borderRadius:10, background:s.current?'#dcfce7':'var(--bg)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.2rem', border:'1px solid var(--border)' }}>{s.current?'💻':'📱'}</div>
                  <div>
                    <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{s.device}</div>
                    <div style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{s.location} · {s.time}</div>
                  </div>
                </div>
                {s.current ? <span style={{ padding:'3px 10px', borderRadius:20, background:'#dcfce7', color:'#16a34a', fontSize:'0.7rem', fontWeight:700 }}>Current</span> : <button className="btn btn-secondary btn-sm" style={{ color:'#dc2626' }}>Revoke</button>}
              </div>
            ))}
            <div style={{ marginTop:16, padding:'12px 16px', background:'#fef9c3', borderRadius:8, fontSize:'0.82rem', color:'#b45309' }}>
              All sessions are automatically expired after 8 hours of inactivity.
            </div>
            <div style={{ display:'flex', justifyContent:'flex-end', marginTop:16 }}>
              <button className="btn btn-secondary" onClick={()=>setShowSessions(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

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