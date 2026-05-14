import React, { useEffect, useRef, useState } from 'react';
import {
  Users, BarChart3, Calendar, Clock, Zap, Trophy, ArrowRight,
  Shield, TrendingUp, CheckCircle2, Star, ChevronRight, Home,
  Bell, GitBranch, Briefcase, Play
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const STATS = [
  { value: '12K+', label: 'Employees Managed' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '500+', label: 'Companies Trust Us' },
  { value: '4.9★', label: 'Average Rating' },
];

const FEATURES = [
  {
    icon: <Users size={22} />, color: '#22c55e', bg: 'rgba(34,197,94,0.12)',
    title: 'Employee Management', desc: 'Centralize all employee data, docs, and lifecycle events in one beautiful interface.',
  },
  {
    icon: <Calendar size={22} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
    title: 'Smart Leave Tracking', desc: 'Automate leave requests, approvals, and balance tracking with real-time notifications.',
  },
  {
    icon: <Clock size={22} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
    title: 'Attendance Insights', desc: 'Track check-ins, late arrivals, and attendance trends with detailed analytics.',
  },
  {
    icon: <BarChart3 size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    title: 'Performance Reviews', desc: 'Run quarterly reviews, radar charts and team comparisons effortlessly.',
  },
  {
    icon: <Zap size={22} />, color: '#ec4899', bg: 'rgba(236,72,153,0.12)',
    title: 'AI Insights', desc: 'Detect burnout risks, attendance patterns and high-performer recognition with AI.',
  },
  {
    icon: <Trophy size={22} />, color: '#f97316', bg: 'rgba(249,115,22,0.12)',
    title: 'Gamified Leaderboard', desc: 'Motivate teams through points, badges, streaks and live leaderboards.',
  },
  {
    icon: <Briefcase size={22} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',
    title: 'Recruitment Pipeline', desc: 'Manage job openings, track candidates and advance them through hiring stages.',
  },
  {
    icon: <GitBranch size={22} />, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',
    title: 'Org Chart', desc: 'Visualize your company hierarchy with an interactive, collapsible org tree.',
  },
];

const TESTIMONIALS = [
  { name: 'Divya Kumar', role: 'HR Manager, TechNova', avatar: 'DK', text: 'Grevya cut our HR admin time by 60%. The AI burnout alerts alone saved us two critical team members.' },
  { name: 'Ravi Nair', role: 'VP Sales, Flexi Corp', avatar: 'RN', text: 'The leaderboard feature transformed our team culture. Engagement has never been higher.' },
  { name: 'Sneha Rao', role: 'Content Lead, BrandSpace', avatar: 'SR', text: 'Best HR portal I have used. Clean UI, fast, and the payslip module is chef\'s kiss.' },
];

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#070d0a', color: '#e2e8f0', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Navbar */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 48px', height: 64,
        background: scrolled ? 'rgba(7,13,10,0.85)' : 'transparent',
        backdropFilter: scrolled ? 'blur(16px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(34,197,94,0.12)' : 'none',
        transition: 'all 300ms',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(34,197,94,0.4)',
          }}>
            <Home size={16} color="white" />
          </div>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white', letterSpacing: '-0.02em' }}>Grevya</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(34,197,94,0.7)', fontWeight: 600, marginLeft: 2 }}>HR</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={onGetStarted}
            style={{
              padding: '8px 20px', borderRadius: 24, border: '1px solid rgba(34,197,94,0.4)',
              background: 'transparent', color: '#4ade80', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'all 200ms', fontFamily: 'inherit',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(34,197,94,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            Sign In
          </button>
          <button
            onClick={onGetStarted}
            style={{
              padding: '8px 20px', borderRadius: 24, border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white', fontWeight: 600, fontSize: '0.875rem',
              cursor: 'pointer', transition: 'all 200ms', fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(34,197,94,0.35)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(34,197,94,0.5)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(34,197,94,0.35)'; }}
          >
            Get Started →
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow blobs */}
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '6px 16px', borderRadius: 24,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)',
          marginBottom: 28,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#22c55e', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: '0.78rem', color: '#4ade80', fontWeight: 600 }}>Now with AI-powered HR insights</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(2.4rem, 6vw, 4.5rem)', fontWeight: 800,
          textAlign: 'center', lineHeight: 1.1, letterSpacing: '-0.04em',
          maxWidth: 820, marginBottom: 24,
        }}>
          The HR Platform{' '}
          <span style={{
            background: 'linear-gradient(135deg, #22c55e, #4ade80, #86efac)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Your Team Deserves
          </span>
        </h1>

        <p style={{
          fontSize: '1.125rem', color: '#94a3b8', textAlign: 'center',
          maxWidth: 580, lineHeight: 1.7, marginBottom: 40,
        }}>
          Manage employees, leaves, attendance, performance, and recruitment — all in one intelligent platform built for modern teams.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 60 }}>
          <button
            onClick={onGetStarted}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 32px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white', fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer', transition: 'all 250ms', fontFamily: 'inherit',
              boxShadow: '0 8px 28px rgba(34,197,94,0.4)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 36px rgba(34,197,94,0.55)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(34,197,94,0.4)'; }}
          >
            Start Free Trial <ArrowRight size={18} />
          </button>
          <button
            onClick={onGetStarted}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 14,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(255,255,255,0.05)',
              color: '#e2e8f0', fontWeight: 600, fontSize: '1rem',
              cursor: 'pointer', transition: 'all 250ms', fontFamily: 'inherit',
              backdropFilter: 'blur(8px)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
          >
            <Play size={16} /> Watch Demo
          </button>
        </div>

        {/* Dashboard preview card */}
        <div style={{
          width: '100%', maxWidth: 960, borderRadius: 20,
          border: '1px solid rgba(34,197,94,0.2)',
          background: 'rgba(15,31,20,0.8)',
          backdropFilter: 'blur(20px)',
          padding: '28px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.1)',
        }}>
          {/* Mini topbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>grevya.hr/dashboard</span>
            </div>
          </div>
          {/* Mini stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Employees', val: '247', color: '#22c55e', icon: '👥' },
              { label: 'Attendance Rate', val: '94%', color: '#3b82f6', icon: '🕐' },
              { label: 'Pending Leaves', val: '12', color: '#f59e0b', icon: '📅' },
              { label: 'Avg Performance', val: '88/100', color: '#8b5cf6', icon: '📈' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '1.1rem', marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: s.color, marginBottom: 2 }}>{s.val}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Mini chart placeholder */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {['📊 Performance Trend', '🧩 AI Insights'].map(t => (
              <div key={t} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '16px', border: '1px solid rgba(255,255,255,0.06)', minHeight: 80 }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(34,197,94,0.7)', fontWeight: 600, marginBottom: 12 }}>{t}</div>
                {/* Mini bars */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 40 }}>
                  {[55, 70, 62, 80, 74, 88, 92].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: `rgba(34,197,94,${0.2 + i * 0.08})`, borderRadius: '3px 3px 0 0', transition: '300ms' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section style={{
        padding: '48px 48px',
        background: 'rgba(34,197,94,0.05)',
        borderTop: '1px solid rgba(34,197,94,0.1)',
        borderBottom: '1px solid rgba(34,197,94,0.1)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.03em', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features grid */}
      <section style={{ padding: '96px 48px' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Everything You Need</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginTop: 12, letterSpacing: '-0.03em', color: 'white' }}>
            Powerful features, zero complexity
          </h2>
          <p style={{ color: '#64748b', marginTop: 14, maxWidth: 480, margin: '14px auto 0', fontSize: '0.95rem', lineHeight: 1.7 }}>
            From day-one onboarding to performance reviews — Grevya handles it all.
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, maxWidth: 1100, margin: '0 auto' }}>
          {FEATURES.map(f => (
            <div
              key={f.title}
              style={{
                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                borderRadius: 16, padding: '24px',
                transition: 'all 250ms', cursor: 'default',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                (e.currentTarget as HTMLElement).style.borderColor = `${f.color}40`;
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)';
                (e.currentTarget as HTMLElement).style.boxShadow = `0 12px 32px rgba(0,0,0,0.3)`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                (e.currentTarget as HTMLElement).style.transform = '';
                (e.currentTarget as HTMLElement).style.boxShadow = '';
              }}
            >
              <div style={{ width: 44, height: 44, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, marginBottom: 16, border: `1px solid ${f.color}25` }}>
                {f.icon}
              </div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'white', marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', lineHeight: 1.6 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '80px 48px', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em' }}>Loved by HR teams</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, maxWidth: 960, margin: '0 auto' }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '24px' }}>
              <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} size={14} fill="#f59e0b" color="#f59e0b" />)}
              </div>
              <p style={{ fontSize: '0.875rem', color: '#94a3b8', lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.7rem', color: 'white' }}>{t.avatar}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'white' }}>{t.name}</div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '96px 48px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 24,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)', borderRadius: 24, padding: '48px 64px',
          maxWidth: 680, width: '100%', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ready to get started?</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1.2, margin: 0 }}>
            Transform your HR operations today
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            Join 500+ companies using Grevya to manage their most valuable asset — their people.
          </p>
          <button
            onClick={onGetStarted}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '14px 36px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: 'white', fontWeight: 700, fontSize: '1rem',
              cursor: 'pointer', transition: 'all 250ms', fontFamily: 'inherit',
              boxShadow: '0 8px 28px rgba(34,197,94,0.45)',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLElement).style.boxShadow = '0 14px 40px rgba(34,197,94,0.6)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = ''; (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(34,197,94,0.45)'; }}
          >
            Access the Portal <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '32px 48px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={12} color="white" />
          </div>
          <span style={{ fontWeight: 700, color: 'white', fontSize: '0.875rem' }}>Grevya HR</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#475569' }}>© 2024 Grevya. Built with ❤ for HR teams everywhere.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          {['Privacy', 'Terms', 'Support'].map(l => (
            <span key={l} style={{ fontSize: '0.78rem', color: '#475569', cursor: 'pointer' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#4ade80'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#475569'; }}>
              {l}
            </span>
          ))}
        </div>
      </footer>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}
