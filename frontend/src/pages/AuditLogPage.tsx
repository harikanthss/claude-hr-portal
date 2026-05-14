import React, { useState, useEffect } from 'react';
import { api } from '../services/store';
import { Shield, Clock, User, Activity, Filter, RefreshCw } from 'lucide-react';

interface AuditEntry { id: string; userId: string; userName: string; action: string; resource: string; resourceId?: string; details?: string; ipAddress?: string; timestamp: string; }

const ACTION_COLORS: Record<string, { color: string; bg: string }> = {
  create: { color: '#22c55e', bg: '#dcfce7' },
  update: { color: '#3b82f6', bg: '#dbeafe' },
  delete: { color: '#ef4444', bg: '#fee2e2' },
  approve: { color: '#22c55e', bg: '#dcfce7' },
  reject: { color: '#ef4444', bg: '#fee2e2' },
  login: { color: '#8b5cf6', bg: '#f3e8ff' },
  upload: { color: '#06b6d4', bg: '#cffafe' },
  check_in: { color: '#22c55e', bg: '#dcfce7' },
  check_out: { color: '#f59e0b', bg: '#fef9c3' },
};

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState({ resource: '', action: '' });
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filter.resource) params.set('resource', filter.resource);
    params.set('limit', '100');
    api.get(`/audit-log?${params}`).then(data => { if (Array.isArray(data)) setEntries(data); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, [filter.resource]);

  const resources = [...new Set(entries.map(e => e.resource))];
  const actions = [...new Set(entries.map(e => e.action))];
  const displayed = entries.filter(e => !filter.action || e.action === filter.action);

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="animate-fade">
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Actions</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>{entries.length}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Active Users</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{new Set(entries.map(e => e.userId)).size}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Resources</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{resources.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center' }}>
        <Filter size={16} color="var(--text-muted)" />
        <select className="form-input" style={{ width: 180 }} value={filter.resource} onChange={e => setFilter(f => ({ ...f, resource: e.target.value }))}>
          <option value="">All Resources</option>
          {resources.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="form-input" style={{ width: 160 }} value={filter.action} onChange={e => setFilter(f => ({ ...f, action: e.target.value }))}>
          <option value="">All Actions</option>
          {actions.map(a => <option key={a} value={a}>{a}</option>)}
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchLogs}><RefreshCw size={14} /> Refresh</button>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {displayed.map((entry, i) => {
            const cfg = ACTION_COLORS[entry.action] || { color: '#64748b', bg: '#f1f5f9' };
            return (
              <div key={entry.id} style={{
                display: 'flex', alignItems: 'flex-start', gap: 16, padding: '14px 20px',
                borderBottom: i < displayed.length - 1 ? '1px solid var(--border-light)' : 'none',
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                  <Activity size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{entry.userName}</span>
                    <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontSize: '0.65rem' }}>{entry.action}</span>
                    <span className="badge badge-blue" style={{ fontSize: '0.65rem' }}>{entry.resource}</span>
                  </div>
                  {entry.details && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{entry.details}</div>}
                </div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  <Clock size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />{formatTime(entry.timestamp)}
                </div>
              </div>
            );
          })}
          {displayed.length === 0 && (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
              <Shield size={32} style={{ marginBottom: 8, opacity: 0.5 }} />
              <div>No audit entries found</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
