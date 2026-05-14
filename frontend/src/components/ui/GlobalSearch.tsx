import React, { useEffect, useState, useRef } from 'react';
import { useStore } from '../../services/store';
import { Search, Users, Calendar, Clock, BarChart3, X, ArrowRight, Zap, FileText, Trophy } from 'lucide-react';

interface GlobalSearchProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (page: string) => void;
}

const PAGE_LINKS = [
  { page: 'dashboard',   label: 'Dashboard',            icon: <BarChart3 size={15} />,  color: '#22c55e', category: 'Pages' },
  { page: 'employees',   label: 'Employee Management',  icon: <Users size={15} />,      color: '#3b82f6', category: 'Pages' },
  { page: 'leave',       label: 'Leave Management',     icon: <Calendar size={15} />,   color: '#8b5cf6', category: 'Pages' },
  { page: 'attendance',  label: 'Attendance',           icon: <Clock size={15} />,      color: '#f59e0b', category: 'Pages' },
  { page: 'performance', label: 'Performance',          icon: <BarChart3 size={15} />,  color: '#ec4899', category: 'Pages' },
  { page: 'recruitment', label: 'Recruitment Pipeline', icon: <Users size={15} />,      color: '#06b6d4', category: 'Pages' },
  { page: 'calendar',    label: 'Calendar',             icon: <Calendar size={15} />,   color: '#f97316', category: 'Pages' },
  { page: 'expenses',    label: 'Expense Claims',       icon: <FileText size={15} />,   color: '#22c55e', category: 'Pages' },
  { page: 'onboarding',  label: 'Onboarding',           icon: <Users size={15} />,      color: '#8b5cf6', category: 'Pages' },
  { page: 'reports',     label: 'Reports & Analytics',  icon: <FileText size={15} />,   color: '#94a3b8', category: 'Pages' },
  { page: 'ai',          label: 'AI Insights',          icon: <Zap size={15} />,        color: '#f59e0b', category: 'Pages' },
  { page: 'leaderboard', label: 'Leaderboard',          icon: <Trophy size={15} />,     color: '#f59e0b', category: 'Pages' },
  { page: 'payslips',    label: 'Payslips',             icon: <FileText size={15} />,   color: '#22c55e', category: 'Pages' },
  { page: 'profile',     label: 'My Profile',           icon: <Users size={15} />,      color: '#94a3b8', category: 'Pages' },
];

export default function GlobalSearch({ open, onClose, onNavigate }: GlobalSearchProps) {
  const { employees, leaveRequests, currentUser } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState(0);

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [open]);

  const empResults = query.length > 0
    ? employees.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase()) ||
        e.email.toLowerCase().includes(query.toLowerCase()) ||
        e.department.toLowerCase().includes(query.toLowerCase()) ||
        e.position.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5)
    : [];

  const leaveResults = query.length > 0
    ? leaveRequests.filter(r =>
        r.employeeName.toLowerCase().includes(query.toLowerCase()) ||
        r.type.includes(query.toLowerCase())
      ).slice(0, 3)
    : [];

  const pageResults = PAGE_LINKS.filter(p =>
    p.label.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const allResults = [
    ...pageResults.map(p => ({ type: 'page' as const, data: p })),
    ...empResults.map(e => ({ type: 'employee' as const, data: e })),
    ...leaveResults.map(r => ({ type: 'leave' as const, data: r })),
  ];

  const displayResults = query.length > 0
    ? allResults
    : PAGE_LINKS.slice(0, 8).map(p => ({ type: 'page' as const, data: p }));

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, displayResults.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && displayResults[selected]) {
        const item = displayResults[selected];
        if (item.type === 'page') { onNavigate((item.data as typeof PAGE_LINKS[0]).page); onClose(); }
        else if (item.type === 'employee') { onNavigate('employees'); onClose(); }
        else { onNavigate('leave'); onClose(); }
      }
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, selected, displayResults]);

  if (!open) return null;

  const handleItemClick = (item: typeof displayResults[0]) => {
    if (item.type === 'page') { onNavigate((item.data as typeof PAGE_LINKS[0]).page); }
    else if (item.type === 'employee') { onNavigate('employees'); }
    else { onNavigate('leave'); }
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        padding: '100px 20px 20px',
        animation: 'fadeIn 0.15s ease',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxWidth: 580,
          background: 'var(--bg-card)', borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          animation: 'scaleIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <Search size={18} color="var(--primary)" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search pages, employees, leaves..."
            style={{
              flex: 1, border: 'none', outline: 'none',
              background: 'transparent', fontSize: '1rem',
              color: 'var(--text-primary)', fontFamily: 'var(--font)',
            }}
          />
          <kbd style={{ padding: '2px 8px', borderRadius: 6, background: 'var(--border-light)', border: '1px solid var(--border)', fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>ESC</kbd>
          <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} onClick={onClose}><X size={16} /></button>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {!query && (
            <div style={{ padding: '8px 20px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quick Navigation
            </div>
          )}
          {query && empResults.length === 0 && leaveResults.length === 0 && pageResults.length === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No results for "{query}"
            </div>
          )}

          {/* Page results */}
          {pageResults.length > 0 && query && (
            <div style={{ padding: '8px 20px 4px', fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Pages</div>
          )}
          {displayResults.map((item, idx) => {
            const isSelected = idx === selected;
            if (item.type === 'page') {
              const p = item.data as typeof PAGE_LINKS[0];
              return (
                <div
                  key={`page-${p.page}`}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 20px', cursor: 'pointer',
                    background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                    borderLeft: isSelected ? `3px solid var(--primary)` : '3px solid transparent',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={() => setSelected(idx)}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${p.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: p.color, flexShrink: 0 }}>
                    {p.icon}
                  </div>
                  <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', flex: 1 }}>{p.label}</span>
                  {isSelected && <ArrowRight size={14} color="var(--primary)" />}
                </div>
              );
            }
            if (item.type === 'employee') {
              const e = item.data as typeof employees[0];
              const globalIdx = displayResults.slice(0, idx).filter(r => r.type === 'page').length;
              return (
                <div
                  key={`emp-${e.id}`}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 20px', cursor: 'pointer',
                    background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                    borderLeft: isSelected ? `3px solid var(--primary)` : '3px solid transparent',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={() => setSelected(idx)}
                >
                  <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{e.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>{e.name}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.position} · {e.department}</div>
                  </div>
                  <span className={`badge ${e.status === 'active' ? 'badge-green' : e.status === 'on_leave' ? 'badge-yellow' : 'badge-gray'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                    {e.status.replace('_', ' ')}
                  </span>
                </div>
              );
            }
            if (item.type === 'leave') {
              const r = item.data as typeof leaveRequests[0];
              return (
                <div
                  key={`leave-${r.id}`}
                  onClick={() => handleItemClick(item)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '10px 20px', cursor: 'pointer',
                    background: isSelected ? 'var(--primary-subtle)' : 'transparent',
                    borderLeft: isSelected ? `3px solid var(--primary)` : '3px solid transparent',
                    transition: 'all 150ms',
                  }}
                  onMouseEnter={() => setSelected(idx)}
                >
                  <div className="avatar avatar-sm" style={{ flexShrink: 0, background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>{r.employeeAvatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{r.employeeName}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{r.type} leave · {r.days}d · {r.startDate}</div>
                  </div>
                  <span className={`badge ${r.status === 'approved' ? 'badge-green' : r.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`} style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                    {r.status}
                  </span>
                </div>
              );
            }
            return null;
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center' }}>
          {[['↑↓', 'Navigate'], ['↵', 'Open'], ['Esc', 'Close']].map(([key, action]) => (
            <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <kbd style={{ padding: '2px 6px', borderRadius: 4, background: 'var(--border-light)', border: '1px solid var(--border)', fontSize: '0.65rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>{key}</kbd>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{action}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
