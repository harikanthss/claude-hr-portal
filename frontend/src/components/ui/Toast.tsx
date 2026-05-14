import React, { useEffect, useState, useCallback } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

// Global toast state
let toastListeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function notify(listeners: typeof toastListeners, newToasts: Toast[]) {
  listeners.forEach(fn => fn([...newToasts]));
}

export const toast = {
  show(type: ToastType, title: string, message?: string) {
    const id = `t${Date.now()}_${Math.random().toString(36).slice(2)}`;
    toasts = [...toasts, { id, type, title, message }];
    notify(toastListeners, toasts);
    setTimeout(() => toast.dismiss(id), 4000);
    return id;
  },
  success: (title: string, message?: string) => toast.show('success', title, message),
  error:   (title: string, message?: string) => toast.show('error',   title, message),
  warning: (title: string, message?: string) => toast.show('warning', title, message),
  info:    (title: string, message?: string) => toast.show('info',    title, message),
  dismiss(id: string) {
    toasts = toasts.filter(t => t.id !== id);
    notify(toastListeners, toasts);
  },
};

const ICONS: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  error:   <XCircle     size={16} />,
  warning: <AlertTriangle size={16} />,
  info:    <Info        size={16} />,
};

const COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: '#f0fdf4', border: '#22c55e', icon: '#16a34a', text: '#14532d' },
  error:   { bg: '#fef2f2', border: '#ef4444', icon: '#dc2626', text: '#7f1d1d' },
  warning: { bg: '#fffbeb', border: '#f59e0b', icon: '#d97706', text: '#78350f' },
  info:    { bg: '#eff6ff', border: '#3b82f6', icon: '#1d4ed8', text: '#1e3a8a' },
};

const DARK_COLORS: Record<ToastType, { bg: string; border: string; icon: string; text: string }> = {
  success: { bg: 'rgba(34,197,94,0.12)',  border: '#4ade80', icon: '#4ade80', text: '#bbf7d0' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: '#f87171', icon: '#f87171', text: '#fecaca' },
  warning: { bg: 'rgba(245,158,11,0.12)', border: '#fbbf24', icon: '#fbbf24', text: '#fef08a' },
  info:    { bg: 'rgba(59,130,246,0.12)', border: '#60a5fa', icon: '#60a5fa', text: '#bfdbfe' },
};

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const isDark = document.documentElement.classList.contains('dark');
  const c = isDark ? DARK_COLORS[t.type] : COLORS[t.type];

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 10,
        background: isDark ? '#161b22' : c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${c.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
        minWidth: 280,
        maxWidth: 360,
        transition: 'all 300ms cubic-bezier(.4,0,.2,1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(100%)',
        pointerEvents: 'all',
      }}
    >
      <span style={{ color: c.icon, flexShrink: 0, marginTop: 1 }}>{ICONS[t.type]}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.8rem', color: isDark ? '#e2e8f0' : '#0f172a', marginBottom: t.message ? 2 : 0 }}>
          {t.title}
        </div>
        {t.message && (
          <div style={{ fontSize: '0.75rem', color: isDark ? '#94a3b8' : '#475569', lineHeight: 1.4 }}>{t.message}</div>
        )}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: isDark ? '#64748b' : '#94a3b8', padding: 2, borderRadius: 4,
          display: 'flex', alignItems: 'center', flexShrink: 0,
          transition: 'color 150ms',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = isDark ? '#e2e8f0' : '#334155')}
        onMouseLeave={e => (e.currentTarget.style.color = isDark ? '#64748b' : '#94a3b8')}
      >
        <X size={14} />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const fn = (newToasts: Toast[]) => setItems([...newToasts]);
    toastListeners.push(fn);
    return () => { toastListeners = toastListeners.filter(l => l !== fn); };
  }, []);

  const dismiss = useCallback((id: string) => toast.dismiss(id), []);

  if (items.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      pointerEvents: 'none',
    }}>
      {items.map(t => (
        <ToastItem key={t.id} t={t} onDismiss={dismiss} />
      ))}
    </div>
  );
}
