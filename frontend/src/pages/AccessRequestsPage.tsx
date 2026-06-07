import React, { useEffect, useState } from 'react';
import { CheckCircle2, RefreshCw, Shield, XCircle } from 'lucide-react';
import { api, useStore } from '../services/store';
import { toast } from '../components/ui/Toast';
import type { UserRole } from '../types';

interface PendingUser {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: UserRole | null;
  status: 'pending' | 'rejected' | 'active';
  department?: string;
  jobTitle?: string;
  managerId?: string;
  createdAt?: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  reviewerName?: string | null;
  reviewerEmail?: string | null;
  decisionMethod?: string | null;
}

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'super_admin', label: 'Super Admin / Founder' },
  { value: 'employee', label: 'Employee' },
  { value: 'manager', label: 'Manager' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'admin', label: 'Admin' },
];

export default function AccessRequestsPage() {
  const { employees, currentUser } = useStore();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [forms, setForms] = useState<Record<string, { role: UserRole | ''; department: string; managerId: string; jobTitle: string }>>({});
  const managers = employees.filter((employee) => employee.status === 'active' && ['manager', 'hr_manager', 'admin'].some((role) => employee.position?.toLowerCase().includes(role.replace('_', ' ')) || employee.position?.toLowerCase().includes(role)));
  const assignableRoles = currentUser?.role === 'super_admin'
    ? ROLES
    : ROLES.filter((role) => role.value !== 'super_admin');

  const load = async () => {
    setLoading(true);
    try {
      const rows = await api.get(`/access/pending?status=${encodeURIComponent(statusFilter)}`);
      const pendingUsers = Array.isArray(rows) ? rows : [];
      setUsers(pendingUsers);
      setForms((prev) => {
        const next = { ...prev };
        pendingUsers.forEach((user: PendingUser) => {
          if (!next[user.id]) {
            next[user.id] = {
              role: user.role || '',
              department: user.department || '',
              managerId: user.managerId || '',
              jobTitle: user.jobTitle || '',
            };
          }
        });
        return next;
      });
    } catch (err) {
      toast.error('Access requests failed', err instanceof Error ? err.message : 'Unable to load access requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const updateForm = (id: string, patch: Partial<(typeof forms)[string]>) => {
    setForms((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const formatDateTime = (value?: string | null) => {
    if (!value) return '-';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? '-' : parsed.toLocaleString();
  };

  const formatDecisionMethod = (value?: string | null) => {
    if (!value) return '-';
    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const approve = async (user: PendingUser) => {
    const form = forms[user.id];
    if (!form?.role || !form.department.trim() || !form.jobTitle.trim()) {
      toast.error('Missing approval details', 'Role, department, and job title are required.');
      return;
    }
    setSavingId(user.id);
    try {
      const approved = await api.put(`/access/${user.id}/approve`, form);
      toast.success('User approved', `${user.email} can now access the portal after setting their password from the email link.`);
      setUsers(prev => statusFilter === 'pending'
        ? prev.filter(row => row.id !== user.id)
        : prev.map(row => row.id === user.id ? { ...row, ...approved, status: 'active' } : row));
    } catch (err) {
      toast.error('Approval failed', err instanceof Error ? err.message : 'Unable to approve user.');
    } finally {
      setSavingId(null);
    }
  };

  const reject = async (user: PendingUser) => {
    setSavingId(user.id);
    try {
      const rejected = await api.put(`/access/${user.id}/reject`, {});
      toast.success('User rejected', `${user.email} remains blocked from portal access.`);
      setUsers(prev => statusFilter === 'pending'
        ? prev.filter(row => row.id !== user.id)
        : prev.map(row => row.id === user.id ? { ...row, ...rejected, status: 'rejected', role: null } : row));
    } catch (err) {
      toast.error('Reject failed', err instanceof Error ? err.message : 'Unable to reject user.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div className="animate-fade">
      <div className="card p-5 mb-4" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={22} />
          </div>
          <div>
            <h3 style={{ margin: 0 }}>Pending Access</h3>
            <p style={{ margin: '2px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>Approve users only after assigning role, department, manager, and job title.</p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {(['pending', 'approved', 'rejected', 'all'] as const).map((filter) => (
            <button
              key={filter}
              className={`btn btn-sm ${statusFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => setStatusFilter(filter)}
              disabled={loading}
              style={{ textTransform: 'capitalize' }}
            >
              {filter}
            </button>
          ))}
          <button className="btn btn-secondary btn-sm" onClick={load} disabled={loading}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Status</th>
              <th>Role</th>
              <th>Department</th>
              <th>Manager ID</th>
              <th>Job Title</th>
              <th>Reviewed By</th>
              <th>Decision</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i}><td colSpan={9}><div className="skeleton" style={{ height: 18, borderRadius: 5 }} /></td></tr>
              ))
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: 36, color: 'var(--text-muted)' }}>No access requests for this filter.</td>
              </tr>
            ) : users.map((user) => {
              const form = forms[user.id] || { role: '' as const, department: '', managerId: '', jobTitle: '' };
              return (
                <tr key={user.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{user.name || user.email}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{user.email}</div>
                  </td>
                  <td><span className={`badge ${user.status === 'active' ? 'badge-green' : user.status === 'pending' ? 'badge-yellow' : 'badge-red'}`}>{user.status === 'active' ? 'approved' : user.status}</span></td>
                  <td>
                    <select className="input" value={form.role} onChange={(e) => updateForm(user.id, { role: e.target.value as UserRole | '' })}>
                      <option value="">Select role</option>
                      {assignableRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                    </select>
                  </td>
                  <td><input className="input" value={form.department} onChange={(e) => updateForm(user.id, { department: e.target.value })} placeholder="Engineering" /></td>
                  <td>
                    <select className="input" value={form.managerId} onChange={(e) => updateForm(user.id, { managerId: e.target.value })}>
                      <option value="">No manager</option>
                      {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                    </select>
                  </td>
                  <td><input className="input" value={form.jobTitle} onChange={(e) => updateForm(user.id, { jobTitle: e.target.value })} placeholder="Software Engineer" /></td>
                  <td>
                    <div style={{ fontWeight: 600, fontSize: '0.78rem' }}>{user.reviewerName || '-'}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{user.reviewerEmail || ''}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>{formatDateTime(user.reviewedAt)}</div>
                  </td>
                  <td>
                    <span className="badge badge-gray">{formatDecisionMethod(user.decisionMethod)}</span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                      <button className="btn btn-primary btn-sm" disabled={savingId === user.id || user.status === 'active'} onClick={() => approve(user)}><CheckCircle2 size={14} /> Approve</button>
                      <button className="btn btn-secondary btn-sm" disabled={savingId === user.id || user.status === 'rejected'} onClick={() => reject(user)}><XCircle size={14} /> Reject</button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
