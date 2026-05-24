import React, { useState, useEffect } from 'react';
import { api } from '../services/store';
import { Search, Filter, Download, RefreshCw, Shield } from 'lucide-react';
import { downloadCSV } from '../utils/exportCSV';

const ACTION_LABELS: Record<string, string> = {
  create: 'Created', update: 'Updated', delete: 'Deleted', deactivate: 'Deactivated',
  login: 'Logged in', logout: 'Logged out', approved: 'Approved leave',
  rejected: 'Rejected leave', change_password: 'Changed password',
  forgot_password: 'Password reset requested', reset_password: 'Password reset',
  generate_payslips: 'Generated payslips', upload: 'Uploaded document',
  bulk_import: 'Bulk employee import', 'check-in': 'Checked in', 'check-out': 'Checked out',
};
const humanAction = (action: string) =>
  ACTION_LABELS[action] || action.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const RESOURCE_LABELS: Record<string, string> = {
  employee: 'Employee', leave_request: 'Leave', auth: 'Authentication',
  payroll: 'Payroll', expense: 'Expense', document: 'Document',
  employees: 'Employees', performance_review: 'Performance',
};
const humanResource = (r: string) => RESOURCE_LABELS[r] || r?.replace(/_/g, ' ') || '';

const ACTION_TYPES = ['All Actions', 'login', 'logout', 'create', 'update', 'delete',
  'approved', 'rejected', 'generate_payslips', 'bulk_import', 'upload'];

const SEVERITY: Record<string, { bg: string; color: string }> = {
  login:    { bg: '#dbeafe', color: '#1d4ed8' },
  logout:   { bg: '#f1f5f9', color: '#64748b' },
  create:   { bg: '#dcfce7', color: '#16a34a' },
  update:   { bg: '#fef9c3', color: '#b45309' },
  delete:   { bg: '#fee2e2', color: '#dc2626' },
  deactivate: { bg: '#fee2e2', color: '#dc2626' },
  approved: { bg: '#dcfce7', color: '#16a34a' },
  rejected: { bg: '#fee2e2', color: '#dc2626' },
  generate_payslips: { bg: '#f3e8ff', color: '#7c3aed' },
  bulk_import: { bg: '#dbeafe', color: '#1d4ed8' },
};

export default function AuditLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('All Actions');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit, setLimit] = useState(100);

  const fetchLogs = (l = limit) => {
    setLoading(true);
    api.get(`/audit-log?limit=${l}`)
      .then(d => { if (Array.isArray(d)) { setLogs(d); } })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchLogs(); }, []);

  useEffect(() => {
    let result = [...logs];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.userName?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q) ||
        l.resource?.toLowerCase().includes(q) ||
        l.details?.toLowerCase().includes(q)
      );
    }
    if (actionFilter !== 'All Actions') result = result.filter(l => l.action === actionFilter);
    if (dateFrom) result = result.filter(l => l.timestamp >= dateFrom);
    if (dateTo) result = result.filter(l => l.timestamp <= dateTo + 'T23:59:59');
    setFiltered(result);
  }, [logs, search, actionFilter, dateFrom, dateTo]);

  const sev = (action: string) => SEVERITY[action] || { bg: '#f1f5f9', color: '#64748b' };

  return (
    <div className="animate-fade">
      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          { label:'Total Entries', val:logs.length, color:'#3b82f6', bg:'#dbeafe' },
          { label:'Filtered Results', val:filtered.length, color:'#7c3aed', bg:'#f3e8ff' },
          { label:'Today', val:logs.filter(l=>l.timestamp?.startsWith(new Date().toISOString().split('T')[0])).length, color:'#22c55e', bg:'#dcfce7' },
          { label:'Security Events', val:logs.filter(l=>['login','logout','change_password','reset_password'].includes(l.action)).length, color:'#f59e0b', bg:'#fef9c3' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding:'16px 18px', borderLeft:`3px solid ${s.color}` }}>
            <div style={{ fontSize:'1.5rem', fontWeight:800, color:s.color }}>{s.val}</div>
            <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginTop:2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto auto auto auto auto', gap:10, alignItems:'center' }}>
          <div style={{ position:'relative' }}>
            <Search size={15} style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'var(--text-muted)' }}/>
            <input
              className="input" placeholder="Search user, action, resource..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ paddingLeft:34 }}
            />
          </div>
          <select className="input" value={actionFilter} onChange={e => setActionFilter(e.target.value)} style={{ width:160 }}>
            {ACTION_TYPES.map(a => <option key={a}>{a}</option>)}
          </select>
          <input type="date" className="input" value={dateFrom} onChange={e => setDateFrom(e.target.value)} style={{ width:140 }} title="From date"/>
          <input type="date" className="input" value={dateTo} onChange={e => setDateTo(e.target.value)} style={{ width:140 }} title="To date"/>
          <button className="btn btn-secondary btn-sm" onClick={() => { setSearch(''); setActionFilter('All Actions'); setDateFrom(''); setDateTo(''); }}>
            <Filter size={13}/> Clear
          </button>
          <div style={{ display:'flex', gap:6 }}>
            <button className="btn btn-secondary btn-sm" onClick={() => fetchLogs()} disabled={loading}>
              <RefreshCw size={13} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/>
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV('audit-log', filtered.map(l => ({
              Timestamp: l.timestamp, User: l.userName, Action: humanAction(l.action),
              Resource: humanResource(l.resource), Details: l.details || '', IP: l.ipAddress || ''
            })))}>
              <Download size={13}/>
            </button>
          </div>
        </div>
        {(search || actionFilter !== 'All Actions' || dateFrom || dateTo) && (
          <div style={{ marginTop:8, fontSize:'0.75rem', color:'var(--text-muted)' }}>
            Showing {filtered.length} of {logs.length} entries
          </div>
        )}
      </div>

      {/* Load more */}
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:8 }}>
        <select className="input" value={limit} onChange={e => { setLimit(Number(e.target.value)); fetchLogs(Number(e.target.value)); }} style={{ width:130, fontSize:'0.8rem' }}>
          {[50,100,250,500].map(n => <option key={n} value={n}>Show {n}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflowX:'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width:150 }}>Timestamp</th>
              <th>User</th>
              <th>Action</th>
              <th>Resource</th>
              <th>Details</th>
              <th>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({length:8}).map((_,i) => (
                <tr key={i}>
                  {Array.from({length:6}).map((__,j) => (
                    <td key={j}><div className="skeleton" style={{ height:14, borderRadius:4 }}/></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>
                <Shield size={28} style={{ marginBottom:8, display:'block', margin:'0 auto 8px' }}/>
                No audit entries match your filters.
              </td></tr>
            ) : filtered.map(log => {
              const s = sev(log.action);
              return (
                <tr key={log.id}>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--text-muted)', whiteSpace:'nowrap' }}>
                    {log.timestamp ? new Date(log.timestamp).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' }) : '—'}
                  </td>
                  <td>
                    <div style={{ fontWeight:600, fontSize:'0.85rem' }}>{log.userName || 'System'}</div>
                    <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{log.userId || ''}</div>
                  </td>
                  <td>
                    <span style={{ display:'inline-block', padding:'3px 9px', borderRadius:20, background:s.bg, color:s.color, fontSize:'0.7rem', fontWeight:700, whiteSpace:'nowrap' }}>
                      {humanAction(log.action)}
                    </span>
                  </td>
                  <td>
                    <span className="chip" style={{ fontSize:'0.72rem' }}>{humanResource(log.resource)}</span>
                  </td>
                  <td style={{ fontSize:'0.8rem', color:'var(--text-secondary)', maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }} title={log.details}>
                    {log.details || '—'}
                  </td>
                  <td style={{ fontFamily:'var(--font-mono)', fontSize:'0.72rem', color:'var(--text-muted)' }}>
                    {log.ipAddress || '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
