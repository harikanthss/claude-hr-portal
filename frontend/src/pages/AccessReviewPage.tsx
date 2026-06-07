import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Shield, XCircle } from 'lucide-react';
import { toast } from '../components/ui/Toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

type Role = 'admin' | 'hr_manager' | 'manager' | 'employee';

interface ReviewData {
  request: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    message?: string;
    status: string;
    createdAt?: string;
  };
  departments: { id: string; name: string }[];
  managers: { id: string; name: string; email: string; jobTitle?: string }[];
  roles: Role[];
}

export default function AccessReviewPage() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    role: '' as Role | '',
    departmentId: '',
    jobTitle: '',
    managerId: '',
  });

  useEffect(() => {
    setLoading(true);
    fetch(`${API_URL}/access/review?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body.detail || body.error || 'Invalid or expired approval link.');
        return body as ReviewData;
      })
      .then((body) => {
        setData(body);
        setForm((prev) => ({
          ...prev,
          departmentId: body.departments[0]?.id || '',
        }));
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'Invalid or expired approval link.'))
      .finally(() => setLoading(false));
  }, [token]);

  const submit = async (action: 'approve' | 'reject') => {
    setError('');
    if (action === 'approve' && (!form.role || !form.departmentId || !form.jobTitle.trim())) {
      setError('Role, department, and job title are required before approval.');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`${API_URL}/access/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          action,
          role: form.role,
          departmentId: form.departmentId,
          jobTitle: form.jobTitle.trim(),
          managerId: form.managerId || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.detail || body.error || 'Unable to process request.');
      const message = action === 'approve'
        ? `${data?.request.email} has been approved.`
        : `${data?.request.email} has been rejected.`;
      setSuccess(message);
      toast.success(action === 'approve' ? 'Access approved' : 'Access rejected', message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to process request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#0f1f14,#1a3a22)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: 'white', borderRadius: 20, padding: '40px', width: '100%', maxWidth: 620, boxShadow: '0 32px 80px rgba(0,0,0,0.35)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ width: 46, height: 46, borderRadius: 12, background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Shield size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', color: '#0f172a' }}>Review Access Request</h1>
            <p style={{ margin: '3px 0 0', color: '#64748b', fontSize: '0.85rem' }}>This secure link expires and can be used once.</p>
          </div>
        </div>

        {loading && <div style={{ color: '#64748b', textAlign: 'center', padding: 32 }}>Loading request...</div>}

        {!loading && error && !data && (
          <div style={{ padding: 18, borderRadius: 12, background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', display: 'flex', gap: 10 }}>
            <AlertCircle size={18} /> <span>{error}</span>
          </div>
        )}

        {!loading && success && (
          <div style={{ padding: 18, borderRadius: 12, background: '#dcfce7', border: '1px solid #86efac', color: '#16a34a', display: 'flex', gap: 10 }}>
            <CheckCircle2 size={18} /> <span>{success}</span>
          </div>
        )}

        {!loading && data && !success && (
          <>
            <div style={{ display: 'grid', gap: 8, padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 18 }}>
              <div><strong>{data.request.name}</strong></div>
              <div style={{ color: '#64748b', fontSize: '0.86rem' }}>{data.request.email}</div>
              {data.request.phone && <div style={{ color: '#64748b', fontSize: '0.86rem' }}>Phone: {data.request.phone}</div>}
              {data.request.message && <div style={{ color: '#64748b', fontSize: '0.86rem' }}>Message: {data.request.message}</div>}
            </div>

            {error && (
              <div style={{ padding: 12, borderRadius: 10, background: '#fee2e2', border: '1px solid #fecaca', color: '#dc2626', fontSize: '0.85rem', marginBottom: 14 }}>
                {error}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
              <div>
                <label className="form-label">Role *</label>
                <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role | '' }))}>
                  <option value="">Select role</option>
                  {data.roles.map((role) => <option key={role} value={role}>{role === 'hr_manager' ? 'HR Manager' : role.charAt(0).toUpperCase() + role.slice(1)}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Department *</label>
                <select className="input" value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}>
                  {data.departments.map((department) => <option key={department.id} value={department.id}>{department.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Job Title *</label>
                <input className="input" value={form.jobTitle} onChange={(e) => setForm((f) => ({ ...f, jobTitle: e.target.value }))} placeholder="Software Engineer" />
              </div>
              <div>
                <label className="form-label">Manager</label>
                <select className="input" value={form.managerId} onChange={(e) => setForm((f) => ({ ...f, managerId: e.target.value }))}>
                  <option value="">No manager</option>
                  {data.managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" disabled={saving} onClick={() => submit('reject')} style={{ color: '#dc2626' }}>
                <XCircle size={15} /> Reject
              </button>
              <button className="btn btn-primary" disabled={saving} onClick={() => submit('approve')}>
                <CheckCircle2 size={15} /> {saving ? 'Processing...' : 'Approve Access'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
