import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../services/store';
import { supabase } from '../lib/supabase';
import { toast } from '../components/ui/Toast';
import { Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2, Mail, Lock, UserPlus } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'HR Manager', email: 'hr@grevya.com', password: 'hr123', color: '#22c55e', bg: '#f0fdf4' },
  { role: 'Manager', email: 'manager@grevya.com', password: 'mgr123', color: '#3b82f6', bg: '#eff6ff' },
  { role: 'Employee', email: 'employee@grevya.com', password: 'emp123', color: '#8b5cf6', bg: '#f5f3ff' },
];
const SHOW_DEMO_ACCOUNTS = import.meta.env.DEV && import.meta.env.VITE_ALLOW_DEMO_AUTH === 'true';
const ENABLE_GOOGLE_AUTH = import.meta.env.VITE_ENABLE_GOOGLE_OAUTH === 'true';
const ENABLE_APPLE_AUTH = import.meta.env.VITE_ENABLE_APPLE_OAUTH === 'true';

type View = 'login' | 'forgot' | 'reset-sent' | 'reset-password' | 'pending' | 'denied' | 'request-access';

export default function LoginPage({ onBack }: { onBack?: () => void }) {
  const { login, logout, signInWithOAuth, requestAccess, initializeAuth, authStatus, authMessage } = useStore();
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingApproval, setCheckingApproval] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<'google' | 'apple' | null>(null);
  const [error, setError] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [accessForm, setAccessForm] = useState({ name: '', email: '', phone: '', message: '' });
  const pendingMessage = authMessage || 'Your account is not yet approved. Contact HR.';

  useEffect(() => {
    if (authStatus === 'pending') setView('pending');
    if (authStatus === 'denied') setView('denied');
  }, [authStatus]);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
    const query = new URLSearchParams(window.location.search);
    if (hash.get('type') === 'recovery' || query.get('type') === 'recovery') setView('reset-password');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setView('reset-password');
    });
    return () => subscription.unsubscribe();
  }, []);

  const canSubmit = useMemo(() => email.trim() && password && !loading, [email, password, loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const result = await login(email.trim(), password);
    if (!result.ok) {
      setError(result.message);
      if (result.denied) setView('denied');
      else if (result.pending) setView('pending');
      else toast.error('Login failed', result.message);
    }
    setLoading(false);
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await requestAccess({
      ...accessForm,
      email: accessForm.email.trim(),
      name: accessForm.name.trim(),
      phone: accessForm.phone.trim(),
      message: accessForm.message.trim(),
    });
    if (!result.ok && result.pending) {
      toast.success('Access requested', 'HR has been notified.');
      setView('pending');
    } else if (!result.ok) {
      setError(result.message);
      if (result.denied) setView('denied');
      else toast.error('Access request failed', result.message);
    }
    setLoading(false);
  };

  const handleCheckApproval = async () => {
    setCheckingApproval(true);
    setError('');
    try {
      await initializeAuth();
      const latest = useStore.getState();
      if (latest.currentUser) {
        toast.success('Access approved', 'Opening your HR portal.');
        return;
      }
      if (latest.authStatus === 'denied') {
        setView('denied');
        return;
      }
      toast.info('Still pending', 'HR has not approved this account yet.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to check approval status.');
    } finally {
      setCheckingApproval(false);
    }
  };

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setError('');
    if (provider === 'google' && !ENABLE_GOOGLE_AUTH) {
      const message = 'Google sign-in is not enabled yet. Contact HR or use email and password.';
      setError(message);
      toast.error('Google sign-in unavailable', message);
      return;
    }
    setOauthLoading(provider);
    const result = await signInWithOAuth(provider);
    if (!result.ok) {
      setError(result.message);
      toast.error('Login failed', result.message);
      setOauthLoading(null);
    }
  };

  const handleForgot = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/?type=recovery`,
      });
      if (error) throw error;
      setView('reset-sent');
    } catch { setError('Something went wrong. Please try again.'); }
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password updated', 'You can now sign in with your new password.');
      await logout();
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setView('login');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update password.');
    } finally {
      setLoading(false);
    }
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

  if (view === 'reset-password') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f1f14,#1a3a22)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {BG}
      <div style={{ background:'white', borderRadius:20, padding:'48px 40px', width:'100%', maxWidth:440, position:'relative', zIndex:1 }}>
        <div style={{ width:52, height:52, borderRadius:14, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <Lock size={24} color="#16a34a" />
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>Set a new password</h2>
        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:28 }}>Choose a strong password to finish account recovery.</p>
        {error && <div style={{ padding:'12px 14px', background:'#fee2e2', border:'1px solid #fecaca', borderRadius:10, color:'#dc2626', fontSize:'0.85rem', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}><AlertCircle size={15}/>{error}</div>}
        <form onSubmit={handleResetPassword} style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151', marginBottom:6, display:'block' }}>New Password</label>
            <input type="password" className="input" value={newPassword} onChange={e=>setNewPassword(e.target.value)} placeholder="Minimum 8 characters" required />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151', marginBottom:6, display:'block' }}>Confirm Password</label>
            <input type="password" className="input" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Repeat password" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent:'center' }}>
            {loading ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Updating...</> : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );

  if (view === 'pending') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f1f14,#1a3a22)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {BG}
      <div style={{ background:'white', borderRadius:20, padding:'48px 40px', width:'100%', maxWidth:460, textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#fef3c7', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <AlertCircle size={30} color="#b45309" />
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>Access pending</h2>
        <p style={{ color:'#64748b', fontSize:'0.9rem', lineHeight:1.6, marginBottom:22 }}>{pendingMessage}</p>
        <p style={{ color:'#94a3b8', fontSize:'0.78rem', lineHeight:1.6, marginBottom:28 }}>HR or an administrator must approve your account, assign your role, department, manager, and job title before portal access is enabled.</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          <button onClick={handleCheckApproval} className="btn btn-primary" disabled={checkingApproval} style={{ justifyContent:'center', width:'100%' }}>
            {checkingApproval ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Checking...</> : 'Check approval status'}
          </button>
          <button onClick={async () => { await logout(); setView('login'); }} className="btn btn-secondary" style={{ justifyContent:'center', width:'100%' }}>Back to Sign In</button>
        </div>
      </div>
    </div>
  );

  if (view === 'denied') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f1f14,#1a3a22)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {BG}
      <div style={{ background:'white', borderRadius:20, padding:'48px 40px', width:'100%', maxWidth:460, textAlign:'center', position:'relative', zIndex:1 }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:'#fee2e2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
          <AlertCircle size={30} color="#dc2626" />
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>Access denied</h2>
        <p style={{ color:'#64748b', fontSize:'0.9rem', lineHeight:1.6, marginBottom:28 }}>{authMessage || 'Access rejected. Contact HR.'}</p>
        <button onClick={async () => { await logout(); setView('login'); }} className="btn btn-primary" style={{ justifyContent:'center', width:'100%' }}>Back to Sign In</button>
      </div>
    </div>
  );

  if (view === 'request-access') return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#0f1f14,#1a3a22)', display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      {BG}
      <div style={{ background:'white', borderRadius:20, padding:'44px 40px', width:'100%', maxWidth:480, position:'relative', zIndex:1 }}>
        <button onClick={() => { setView('login'); setError(''); }} style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', color:'#64748b', cursor:'pointer', fontSize:'0.85rem', marginBottom:24, padding:0 }}>
          <ArrowLeft size={14} /> Back to login
        </button>
        <div style={{ width:52, height:52, borderRadius:14, background:'#dcfce7', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:20 }}>
          <UserPlus size={24} color="#16a34a" />
        </div>
        <h2 style={{ fontSize:'1.5rem', fontWeight:700, marginBottom:8 }}>Request access</h2>
        <p style={{ color:'#64748b', fontSize:'0.875rem', marginBottom:24 }}>Submit your details. HR will approve your role before portal access is enabled.</p>
        {error && <div style={{ padding:'12px 14px', background:'#fee2e2', border:'1px solid #fecaca', borderRadius:10, color:'#dc2626', fontSize:'0.85rem', marginBottom:16, display:'flex', alignItems:'center', gap:8 }}><AlertCircle size={15}/>{error}</div>}
        <form onSubmit={handleRequestAccess} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151', marginBottom:6, display:'block' }}>Full Name *</label>
            <input className="input" value={accessForm.name} onChange={e=>setAccessForm(f=>({ ...f, name:e.target.value }))} placeholder="Your full name" required />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151', marginBottom:6, display:'block' }}>Email *</label>
            <input className="input" type="email" value={accessForm.email} onChange={e=>setAccessForm(f=>({ ...f, email:e.target.value }))} placeholder="you@gmail.com" required />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151', marginBottom:6, display:'block' }}>Phone</label>
            <input className="input" value={accessForm.phone} onChange={e=>setAccessForm(f=>({ ...f, phone:e.target.value }))} placeholder="+91 ..." />
          </div>
          <div>
            <label style={{ fontSize:'0.8rem', fontWeight:600, color:'#374151', marginBottom:6, display:'block' }}>Message</label>
            <textarea className="input" rows={3} value={accessForm.message} onChange={e=>setAccessForm(f=>({ ...f, message:e.target.value }))} placeholder="Optional note for HR" />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading || !accessForm.name.trim() || !accessForm.email.trim()} style={{ justifyContent:'center' }}>
            {loading ? <><div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Sending...</> : <><UserPlus size={15}/> Request Access</>}
          </button>
        </form>
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
            <button type="submit" className="btn btn-primary btn-lg" disabled={!canSubmit} style={{ marginTop:6, justifyContent:'center' }}>
              {loading?<><div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> Signing in...</>:<>Sign In <ArrowRight size={16}/></>}
            </button>
          </form>
          <div style={{ marginTop:18, display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ flex:1, height:1, background:'#e2e8f0' }}/><span style={{ fontSize:'0.7rem', color:'#94a3b8', fontWeight:600 }}>OR</span><div style={{ flex:1, height:1, background:'#e2e8f0' }}/>
            </div>
            {ENABLE_GOOGLE_AUTH ? (
              <button type="button" onClick={() => handleOAuth('google')} className="btn btn-secondary" disabled={loading || !!oauthLoading} style={{ justifyContent:'center', width:'100%', gap:10 }}>
                {oauthLoading === 'google' ? <div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> : <span style={{ width:18, height:18, display:'inline-flex', alignItems:'center', justifyContent:'center', fontWeight:800, color:'#4285f4' }}>G</span>}
                Continue with Google
              </button>
            ) : (
              <div style={{ padding:'10px 12px', border:'1px solid #e2e8f0', borderRadius:10, color:'#64748b', fontSize:'0.78rem', textAlign:'center' }}>Google login is not configured.</div>
            )}
            {ENABLE_APPLE_AUTH && (
              <button type="button" onClick={() => handleOAuth('apple')} className="btn btn-secondary" disabled={loading || !!oauthLoading} style={{ justifyContent:'center', width:'100%', gap:10 }}>
                {oauthLoading === 'apple' ? <div className="spinner" style={{ width:16, height:16, borderWidth:2 }}/> : <span style={{ fontSize:'1rem', fontWeight:800 }}>Apple</span>}
                Continue with Apple
              </button>
            )}
            <p style={{ fontSize:'0.75rem', color:'#64748b', lineHeight:1.5, textAlign:'center' }}>Contact HR for access if your account has not been approved.</p>
            <button type="button" onClick={() => { setAccessForm(f => ({ ...f, email })); setError(''); setView('request-access'); }} className="btn btn-ghost" style={{ justifyContent:'center', width:'100%', color:'#16a34a' }}>
              <UserPlus size={15}/> Request Access
            </button>
          </div>
          {SHOW_DEMO_ACCOUNTS && <div style={{ marginTop:28 }}>
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
          </div>}
        </div>
      </div>
    </div>
  );
}
