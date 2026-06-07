import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  BarChart3,
  Bell,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  GitBranch,
  Home,
  Play,
  Shield,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const STATS = [
  { value: '12K+', label: 'Employees Managed' },
  { value: '98%', label: 'Satisfaction Rate' },
  { value: '500+', label: 'Companies Trust Us' },
  { value: '4.9/5', label: 'Average Rating' },
];

const FEATURES = [
  {
    icon: <Users size={22} />, color: '#22c55e', bg: 'rgba(34,197,94,0.12)',
    title: 'Employee Management', desc: 'Centralize employee records, documents, salary data, and lifecycle events in one secure workspace.',
  },
  {
    icon: <Calendar size={22} />, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
    title: 'Smart Leave Tracking', desc: 'Run leave requests, approvals, balances, holidays, and team scoping with clear ownership.',
  },
  {
    icon: <Clock size={22} />, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
    title: 'Attendance Insights', desc: 'Track check-ins, regularization, WFH requests, late arrivals, and attendance trends.',
  },
  {
    icon: <BarChart3 size={22} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    title: 'Performance Reviews', desc: 'Manage review cycles, self-assessments, manager reviews, and performance analytics.',
  },
  {
    icon: <Zap size={22} />, color: '#ec4899', bg: 'rgba(236,72,153,0.12)',
    title: 'AI Insights', desc: 'Surface people trends, audit signals, and HR insights without losing control of approvals.',
  },
  {
    icon: <Trophy size={22} />, color: '#f97316', bg: 'rgba(249,115,22,0.12)',
    title: 'Recognition and Growth', desc: 'Support teams with leaderboards, feedback loops, documents, and employee milestones.',
  },
  {
    icon: <Briefcase size={22} />, color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',
    title: 'Recruitment Pipeline', desc: 'Manage job openings, candidates, interview stages, and hire-to-employee handoff.',
  },
  {
    icon: <GitBranch size={22} />, color: '#a78bfa', bg: 'rgba(167,139,250,0.12)',
    title: 'Org Visibility', desc: 'Keep departments, managers, role access, and reporting lines clear as the company grows.',
  },
];

const BENEFITS = [
  { title: 'Less admin drag', desc: 'Reduce repetitive HR work with connected employee records, approvals, documents, and notifications.' },
  { title: 'Better people decisions', desc: 'Give leaders a reliable view of attendance, leave, performance, payroll, and team movement.' },
  { title: 'Cleaner employee experience', desc: 'Help employees request leave, check documents, view payslips, and track updates without chasing HR.' },
];

const WORKFLOWS = [
  { title: 'Employees', desc: 'Request leave, regularize attendance, access payslips, upload documents, and follow approvals from one portal.' },
  { title: 'Managers', desc: 'Review direct reports, approve team requests, track attendance, and stay ahead of performance cycles.' },
  { title: 'HR teams', desc: 'Run onboarding, recruitment, payroll, compliance, announcements, and access approvals with role-safe controls.' },
];

const WHY_CHOOSE = [
  { icon: <Shield size={18} />, title: 'Built for HR privacy', desc: 'Role-based access keeps payroll, salary, performance, and employee data scoped to the right people.' },
  { icon: <TrendingUp size={18} />, title: 'Operational visibility', desc: 'Dashboards and reports help HR leaders spot bottlenecks before they become people problems.' },
  { icon: <Bell size={18} />, title: 'Action stays moving', desc: 'Email and in-app notifications keep approvals, reviews, and hiring events from going quiet.' },
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
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 clamp(16px, 4vw, 48px)', height: 64,
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
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'white' }}>Grevya</span>
          <span style={{ fontSize: '0.7rem', color: 'rgba(34,197,94,0.7)', fontWeight: 600 }}>HR</span>
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
            Get Started
          </button>
        </div>
      </nav>

      <section ref={heroRef} style={{
        minHeight: '100vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '100px 24px 60px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', top: '15%', left: '10%', width: 500, height: 500, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />

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
          textAlign: 'center', lineHeight: 1.1, letterSpacing: '-0.02em',
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
          maxWidth: 620, lineHeight: 1.7, marginBottom: 40,
        }}>
          Manage employees, leave, attendance, payroll, performance, and recruitment in one intelligent platform built for modern teams.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 46 }}>
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

        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Product Preview
          </div>
          <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: 6 }}>
            A quick look at the Grevya HR command center your teams use every day.
          </div>
        </div>

        <div style={{
          width: '100%', maxWidth: 960, borderRadius: 20,
          border: '1px solid rgba(34,197,94,0.2)',
          background: 'rgba(15,31,20,0.8)',
          backdropFilter: 'blur(20px)',
          padding: '28px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.1)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#ef4444', '#f59e0b', '#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
              <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>grevya.hr/dashboard</span>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
            {[
              { label: 'Total Employees', val: '247', color: '#22c55e', icon: 'EMP' },
              { label: 'Attendance Rate', val: '94%', color: '#3b82f6', icon: 'ATT' },
              { label: 'Pending Leaves', val: '12', color: '#f59e0b', icon: 'LEV' },
              { label: 'Avg Performance', val: '88/100', color: '#8b5cf6', icon: 'PER' },
            ].map(s => (
              <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ fontSize: '0.62rem', color: s.color, fontWeight: 800, letterSpacing: '0.08em', marginBottom: 6 }}>{s.icon}</div>
                <div style={{ fontWeight: 800, fontSize: '1.25rem', color: s.color, marginBottom: 2 }}>{s.val}</div>
                <div style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
            {['Performance Trend', 'AI Insights'].map(t => (
              <div key={t} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '16px', border: '1px solid rgba(255,255,255,0.06)', minHeight: 80 }}>
                <div style={{ fontSize: '0.7rem', color: 'rgba(34,197,94,0.7)', fontWeight: 600, marginBottom: 12 }}>{t}</div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', height: 40 }}>
                  {[55, 70, 62, 80, 74, 88, 92].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: `rgba(34,197,94,${0.2 + i * 0.08})`, borderRadius: '3px 3px 0 0' }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{
        padding: '48px clamp(20px, 5vw, 48px)',
        background: 'rgba(34,197,94,0.05)',
        borderTop: '1px solid rgba(34,197,94,0.1)',
        borderBottom: '1px solid rgba(34,197,94,0.1)',
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 24, maxWidth: 900, margin: '0 auto' }}>
          {STATS.map(s => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#22c55e', letterSpacing: '-0.02em', marginBottom: 6 }}>{s.value}</div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '96px clamp(20px, 5vw, 48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Everything You Need</span>
          <h2 style={{ fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 800, marginTop: 12, letterSpacing: '-0.02em', color: 'white' }}>
            Powerful features, zero complexity
          </h2>
          <p style={{ color: '#64748b', marginTop: 14, maxWidth: 520, margin: '14px auto 0', fontSize: '0.95rem', lineHeight: 1.7 }}>
            From day-one onboarding to performance reviews, Grevya handles the complete employee lifecycle.
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
                (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 32px rgba(0,0,0,0.3)';
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

      <section style={{ padding: '80px clamp(20px, 5vw, 48px)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32, alignItems: 'start' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Built for teams</span>
            <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, marginTop: 12, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Benefits for HR leaders and growing organizations
            </h2>
            <p style={{ color: '#64748b', marginTop: 14, fontSize: '0.95rem', lineHeight: 1.7 }}>
              Grevya keeps people operations organized without making employees learn a complicated system.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {BENEFITS.map(b => (
              <div key={b.title} style={{ background: 'rgba(7,13,10,0.72)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: 22 }}>
                <CheckCircle2 size={18} color="#22c55e" style={{ marginBottom: 12 }} />
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>{b.title}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.6 }}>{b.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '88px clamp(20px, 5vw, 48px)' }}>
        <div style={{ textAlign: 'center', marginBottom: 44 }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Workflow Overview</span>
          <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, marginTop: 12, color: 'white', letterSpacing: '-0.02em' }}>
            Clear paths for employees, managers, and HR
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18, maxWidth: 1000, margin: '0 auto' }}>
          {WORKFLOWS.map((item, index) => (
            <div key={item.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem', marginBottom: 16 }}>
                {index + 1}
              </div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>{item.title}</div>
              <div style={{ color: '#64748b', fontSize: '0.82rem', lineHeight: 1.65 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: '80px clamp(20px, 5vw, 48px)', background: 'rgba(34,197,94,0.05)', borderTop: '1px solid rgba(34,197,94,0.1)', borderBottom: '1px solid rgba(34,197,94,0.1)' }}>
        <div style={{ maxWidth: 1060, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', marginBottom: 34 }}>
            <div>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Why Choose Grevya</span>
              <h2 style={{ fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, margin: '12px 0 0', color: 'white', letterSpacing: '-0.02em' }}>
                Secure, focused, and built for everyday HR work
              </h2>
            </div>
            <button
              onClick={onGetStarted}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(34,197,94,0.35)',
                background: 'rgba(34,197,94,0.08)', color: '#4ade80', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              Explore Portal <ChevronRight size={16} />
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
            {WHY_CHOOSE.map(item => (
              <div key={item.title} style={{ background: 'rgba(7,13,10,0.72)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 24 }}>
                <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(34,197,94,0.12)', color: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  {item.icon}
                </div>
                <div style={{ color: 'white', fontWeight: 700, fontSize: '0.95rem', marginBottom: 8 }}>{item.title}</div>
                <div style={{ color: '#64748b', fontSize: '0.8rem', lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px clamp(20px, 5vw, 48px)', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>Loved by HR teams</h2>
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

      <section style={{ padding: '96px clamp(20px, 5vw, 48px)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,197,94,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 24,
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(12px)', borderRadius: 24, padding: '48px clamp(24px, 6vw, 64px)',
          maxWidth: 680, width: '100%', flexDirection: 'column',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ready to get started?</div>
          <h2 style={{ fontSize: '2.2rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.2, margin: 0 }}>
            Transform your HR operations today
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>
            Join 500+ companies using Grevya to manage their most valuable asset: their people.
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

      <footer style={{ padding: '32px clamp(20px, 5vw, 48px)', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: 'linear-gradient(135deg, #22c55e, #16a34a)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Home size={12} color="white" />
          </div>
          <span style={{ fontWeight: 700, color: 'white', fontSize: '0.875rem' }}>Grevya HR</span>
        </div>
        <div style={{ fontSize: '0.78rem', color: '#475569' }}>(c) 2026 Grevya. Built for HR teams everywhere.</div>
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
