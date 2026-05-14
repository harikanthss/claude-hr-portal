import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, Home } from 'lucide-react';

const DEMO_ACCOUNTS = [
  { role: 'HR Manager', email: 'hr@grevya.com', password: 'hr123', color: '#22c55e', bg: '#f0fdf4' },
  { role: 'Manager', email: 'manager@grevya.com', password: 'mgr123', color: '#3b82f6', bg: '#eff6ff' },
  { role: 'Employee', email: 'employee@grevya.com', password: 'emp123', color: '#8b5cf6', bg: '#f5f3ff' },
];

interface LoginPageProps {
  onBack?: () => void;
}

export default function LoginPage({ onBack }: LoginPageProps) {
  const { login } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    const ok = await login(email, password);
    if (!ok) setError('Invalid credentials. Try a demo account below.');
    setLoading(false);
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f1f14 0%, #1a3a22 50%, #0d2b18 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* BG circles */}
      {[...Array(3)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          borderRadius: '50%',
          background: `rgba(34,197,94,${0.03 + i * 0.02})`,
          width: `${300 + i * 200}px`,
          height: `${300 + i * 200}px`,
          top: `${-50 + i * 100}px`,
          right: `${-100 + i * 50}px`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Back to landing */}
      {onBack && (
        <button
          onClick={onBack}
          style={{
            position: 'absolute', top: 24, left: 32,
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.75)', borderRadius: 10,
            padding: '8px 14px', cursor: 'pointer', fontFamily: 'inherit',
            fontSize: '0.8rem', fontWeight: 500, transition: 'all 200ms', backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.14)'; (e.currentTarget as HTMLElement).style.color = 'white'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.75)'; }}
        >
          <ArrowLeft size={14} /> Back to Home
        </button>
      )}

      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 24, overflow: 'hidden', boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}>
        {/* Left panel */}
        <div style={{
          background: 'linear-gradient(160deg, #1a4a28 0%, #0f2b18 100%)',
          padding: '56px 48px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 24px rgba(34,197,94,0.4)',
              }}>
                <span style={{ color: 'white', fontWeight: 800, fontSize: '1.2rem' }}>G</span>
              </div>
              <span style={{ color: 'white', fontWeight: 700, fontSize: '1.25rem', letterSpacing: '-0.02em' }}>Grevya</span>
            </div>

            <h1 style={{ color: 'white', fontSize: '2rem', fontWeight: 700, lineHeight: 1.2, marginBottom: 16 }}>
              Your people.<br />
              <span style={{ color: '#4ade80' }}>Powered by AI.</span>
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, fontSize: '0.9rem' }}>
              Modern HR management built for high-growth e-commerce teams. Smart insights, seamless workflows.
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              '🤖 AI-powered burnout detection',
              '📊 Real-time performance analytics',
              '🎮 Gamified employee engagement',
              '📱 Mobile-first design',
            ].map(feat => (
              <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', flexShrink: 0 }} />
                <span style={{ color: 'rgba(255,255,255,0.65)', fontSize: '0.85rem' }}>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right panel - Form */}
        <div style={{ background: '#ffffff', padding: '56px 48px' }}>
          <div style={{ marginBottom: 36 }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>Sign in</h2>
            <p style={{ color: '#64748b', fontSize: '0.875rem' }}>Access your HR portal dashboard</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@grevya.com"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  className="input"
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ marginTop: 8, justifyContent: 'center', fontSize: '0.9rem' }}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
                  Signing in...
                </>
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Demo accounts */}
          <div style={{ marginTop: 32 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 500 }}>DEMO ACCOUNTS</span>
              <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.role}
                  onClick={() => fillDemo(acc)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: `1px solid ${acc.color}30`,
                    background: acc.bg,
                    cursor: 'pointer',
                    transition: 'all 200ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 12px ${acc.color}20`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = 'none'; }}
                >
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem', color: acc.color }}>{acc.role}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{acc.email}</div>
                  </div>
                  <ArrowRight size={14} color={acc.color} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
