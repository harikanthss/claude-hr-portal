import React, { useState } from 'react';
import { useStore, api } from '../services/store';
import { Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Mail, Lock } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'HR Manager', email: 'hr@grevya.com', password: 'hr123', color: '#22c55e', bg: '#f0fdf4' },
  { role: 'Manager', email: 'manager@grevya.com', password: 'mgr123', color: '#3b82f6', bg: '#eff6ff' },
  { role: 'Employee', email: 'employee@grevya.com', password: 'emp123', color: '#8b5cf6', bg: '#f5f3ff' },
];

type View = 'login' | 'forgot' | 'reset-sent';

export default function LoginPage({ onBack }: { onBack?: () => void }) {
  const { login } = useStore();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    const ok = await login(email, password);
    if (!ok) setError('Invalid credentials. Try a demo account below.');
    setLoading(false);
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email: forgotEmail });
      setView('reset-sent');
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => { setEmail(acc.email); setPassword(acc.password); setError(''); };

  const BG = (
    <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
      {[...Array(3)].map((_,i) => (
        <div key={i} style={{ position:'absolute', borderRadius:'50%', background:`rgba(34,197,94,${0.03+i*0.02})`, width:`${300+i*200}px`, height:`${300+i*200}px`, top:`${-50+i*100}px`, right:`${-100+i*50}px` }} />
      ))}
    </div>
  );

  const leftPanel = (
    <div style={{ background:'linear-gradient(135deg,#0f1f14,#1a3a22)', padding:'56px 48px', display:'flex', flexDirection:'column', justifyContent:'space-between', position:'relative', overflow:'hidden' }}>
      {BG}
      <div style={{ position:'relative' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48 }}>
          <div style={{ width:44, height:44, borderRadius:12, background:'linear-gradient(135deg,#22c55e,#16a34a)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 8px 24px rgba(34,197,94,0.4)' }}>
            <span style={{ color:'white', fontWeight:800, fontSize:'1.2rem' }}>G</span>
          </div>
          <span style={{ color:'white', fontWeight:700, fontSize:'1.25rem', letterSpacing:'-0.02em' }}>Grevya</span>
        </div>
        <h1 style={{ color:'white', fontSize:'2rem', fontWeight:700, lineHeight:1.2, marginBottom:16 }}>Your people.<br /><span style={{ color:'#4ade80' }}>Powered by AI.</span></h1>
        <p style={{ color:'rgba(255,255,255,0.55)', lineHeight:1.7, fontSize:'0.9rem' }}>Modern HR management built for high-growth IT teams. Smart insights, seamless workflows.</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:12, position:'relative' }}>
        {['🤖 AI-powered insights','📊 Real-time analytics','🎮 Gamified engagement','📱 Mobile-first PWA','🔐 Enterprise security'].map(f => (
          <div key={f} style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:6, height:6, borderRadius:'50%', background:'#4ade80', flexShrink:0 }} />
            <span style={{ color:'rgba(255,255,255,0.65)', fontSize:'0.85rem' }}>{f}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Forgot Password view ──────────────────────────────────────────────────
  if (view === 'forgot') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f1f14,#1a3a22)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {BG}
      <div style={{ background:'white', borderRadius:20, padding:'48px 40px', width:'100%', maxWidth:440, position:'relative', zIndex:1 }}>
        <button onClick={() => setView('login')} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.85rem', marginBottom:28, padding:0 }}>
          <ArrowLeft size={14} /> Back to login
        </button>
        <div style={{ width:52, height:52, borderRadius:14, background:'#f3e8ff', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <Lock size={24} color="#7c3aed" />
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>Forgot password?</h2>
        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:28 }}>Enter your work email and we'll send a reset link.</p>
        {error && <div style={{ padding:'12px 14px', background:'#fee2e2', border:'1px solid #fecaca', borderRadius:10, color:'#dc2626', fontSize:'0.85rem', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}><AlertCircle size={15}/>{error}</div>}
        <form onSubmit={handleForgot} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151', marginBottom:6, display:'block' }}>Work Email</label>
            <input type="email" className="input" value={forgotEmail} onChange={e=>setForgotEmail(e.target.value)} placeholder="you@company.com" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent:'center' }}>
            {loading ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Sending...</> : <><Mail size={15}/> Send Reset Link</>}
          </button>
        </form>
      </div>
    </div>
  );

  // ── Reset sent view ───────────────────────────────────────────────────────
  if (view === 'reset-sent') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f1f14,#1a3a22)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {BG}
      <div style={{ background:'white', borderRadius:20, padding:'48px 40px', width:'100%', maxWidth:440, textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <CheckCircle2 size={32} color="#16a34a" />
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>Check your inbox</h2>
        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:28 }}>If <strong>{forgotEmail}</strong> is registered, a reset link has been sent. It expires in 1 hour.</p>
        <button onClick={() => setView('login')} className="btn btn-primary" style={{ justifyContent:'center', width:'100%' }}>Back to Login</button>
      </div>
    </div>
  );

  // ── Login view (default) ──────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f1f14,#1a3a22)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, position:'relative', overflow:'hidden' }}>
      {BG}
      {onBack && (
        <button onClick={onBack} style={{ position:'absolute', top:24, left:32, display:'flex', alignItems:'center', gap:6, background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.15)', color:'rgba(255,255,255,0.75)', borderRadius:10, padding:'8px 14px', cursor:'pointer', fontFamily:'inherit', fontSize:'0.8rem', fontWeight:500, zIndex:2 }}>
          <ArrowLeft size={14} /> Back to Home
        </button>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', width:'100%', maxWidth:900, borderRadius:24, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.5)', position:'relative', zIndex:1 }}>
        {leftPanel}
        <div style={{ background:'#ffffff', padding:'56px 48px', overflowY:'auto' }}>
          <div style={{ marginBottom:32 }}>
            <h2 style={{ fontSize:'1.5rem', fontWeight:700, color:'#0f172a', marginBottom:6 }}>Sign in</h2>
            <p style={{ color:'#64748b', fontSize:'0.875rem' }}>Access your HR portal dashboard</p>
          </div>
          <form onSubmit={handleLogin} style={{ display:'flex', flexDirection:'column', gap:16 }}>
            {error && <div style={{ padding:'12px 14px', background:'#fee2e2', border:'1px solid #fecaca', borderRadius:10, color:'#dc2626', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:8 }}><AlertCircle size={15}/>{error}</div>}
            <div>
              <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151', marginBottom:6, display:'block' }}>Email Address</label>
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@grevya.com" required />
            </div>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151' }}>Password</label>
                <button type="button" onClick={()=>setView('forgot')} style={{ background:'none', border:'none', color:'#7c3aed', fontSize:'0.75rem', cursor:'pointer', fontWeight:600, padding:0 }}>Forgot password?</button>
              </div>
              <div style={{ position:'relative' }}>
                <input className="input" type={showPw?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight:44 }}/>
                <button type="button" onClick={()=>setShowPw(v=>!v)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#94a3b8' }}>
                  {showPw?<EyeOff size={16}/>:<Eye size={16}/>}
                </button>
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg" disabled={loading} style={{ marginTop:6, justifyContent:'center' }}>
              {loading?<><div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Signing in...</>:<>Sign In <ArrowRight size={16}/></>}
            </button>
          </form>
          <div style={{ marginTop:28 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
              <div style={{ flex:1, height:1, background:'#e2e8f0' }}/><span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:600 }}>DEMO ACCOUNTS</span><div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button key={acc.role} onClick={()=>fillDemo(acc)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderRadius:10, border:`1px solid ${acc.color}30`, background:acc.bg, cursor:'pointer' }}>
                  <div><div style={{ fontWeight:600, fontSize:'0.8rem', color:acc.color }}>{acc.role}</div><div style={{ fontSize:'0.7rem', color:'#64748b' }}>{acc.email}</div></div>
                  <ArrowRight size={14} color={acc.color}/>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
