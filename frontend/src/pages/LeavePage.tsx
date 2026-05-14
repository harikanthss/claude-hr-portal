import React, { useState } from 'react';
import { useStore } from '../services/store';
import { LeaveRequest } from '../types';
import { Search, Plus, Check, X, Calendar } from 'lucide-react';
import { toast } from '../components/ui/Toast';

const LEAVE_TYPES = ['sick', 'casual', 'annual', 'maternity', 'paternity', 'emergency'] as const;

export default function LeavePage() {
  const { currentUser, leaveRequests, approveLeave, rejectLeave, applyLeave } = useStore();
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ req: LeaveRequest; type: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [form, setForm] = useState({
    type: 'casual' as typeof LEAVE_TYPES[number],
    startDate: '',
    endDate: '',
    reason: '',
  });

  const isHRorManager = currentUser?.role !== 'employee';

  const filtered = leaveRequests
    .filter(r => tab === 'all' || r.status === tab)
    .filter(r => !search || r.employeeName.toLowerCase().includes(search.toLowerCase()) || r.type.includes(search.toLowerCase()))
    .filter(r => currentUser?.role === 'employee' ? r.employeeId === 'e1' : true);

  const counts = {
    all: leaveRequests.length,
    pending: leaveRequests.filter(r => r.status === 'pending').length,
    approved: leaveRequests.filter(r => r.status === 'approved').length,
    rejected: leaveRequests.filter(r => r.status === 'rejected').length,
  };

  const calcDays = (start: string, end: string) => {
    if (!start || !end) return 0;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    return Math.max(1, Math.ceil(diff / 86400000) + 1);
  };

  const handleApply = () => {
    if (!form.startDate || !form.endDate || !form.reason) return;
    const days = calcDays(form.startDate, form.endDate);
    applyLeave({
      employeeId: currentUser?.id || 'e1',
      employeeName: currentUser?.name || 'Kiran Patel',
      employeeAvatar: currentUser?.avatar || 'KP',
      department: currentUser?.department || 'Engineering',
      type: form.type,
      startDate: form.startDate,
      endDate: form.endDate,
      days,
      reason: form.reason,
    });
    setModal(false);
    setForm({ type: 'casual', startDate: '', endDate: '', reason: '' });
    toast.success('Leave request submitted!', `${days} day(s) of ${form.type} leave sent for approval.`);
  };

  const handleAction = () => {
    if (!actionModal) return;
    const { req, type } = actionModal;
    if (type === 'approve') {
      approveLeave(req.id, comment);
      toast.success(`Leave approved`, `${req.employeeName}'s ${req.type} leave (${req.days}d) approved.`);
    } else {
      rejectLeave(req.id, comment);
      toast.error(`Leave rejected`, `${req.employeeName}'s request has been declined.`);
    }
    setActionModal(null);
    setComment('');
  };

  const typeColor: Record<string, string> = {
    sick: 'badge-red', casual: 'badge-blue', annual: 'badge-green',
    maternity: 'badge-purple', paternity: 'badge-purple', emergency: 'badge-yellow',
  };

  const leaveBalance = [
    { type: 'Annual', used: 8, total: 18, color: '#22c55e' },
    { type: 'Sick', used: 2, total: 10, color: '#ef4444' },
    { type: 'Casual', used: 3, total: 6, color: '#3b82f6' },
  ];

  return (
    <div className="animate-fade">
      {/* Leave balance (for employees) */}
      {currentUser?.role === 'employee' && (
        <div className="grid-3 mb-6">
          {leaveBalance.map(lb => (
            <div key={lb.type} className="card" style={{ padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{lb.type} Leave</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: 4 }}>{lb.total - lb.used}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>days remaining</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{lb.used}/{lb.total} used</div>
                </div>
              </div>
              <div className="progress">
                <div className="progress-bar" style={{ width: `${(lb.used / lb.total) * 100}%`, background: lb.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="filter-row">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
          <Search size={15} />
          <input className="input search-input" placeholder="Search leaves..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38 }} />
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button className="btn btn-primary" onClick={() => setModal(true)}>
            <Plus size={16} /> Apply for Leave
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-nav">
        {(['all', 'pending', 'approved', 'rejected'] as const).map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
            <span style={{
              marginLeft: 6,
              background: tab === t ? 'var(--primary)' : 'var(--border)',
              color: tab === t ? 'white' : 'var(--text-muted)',
              borderRadius: 10,
              padding: '1px 7px',
              fontSize: '0.7rem',
              fontWeight: 600,
            }}>
              {counts[t]}
            </span>
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                {isHRorManager && <th>Employee</th>}
                <th>Type</th>
                <th>Duration</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Applied On</th>
                <th>Status</th>
                {isHRorManager && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(req => (
                <tr key={req.id}>
                  {isHRorManager && (
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div className="avatar avatar-sm">{req.employeeAvatar}</div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{req.employeeName}</div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{req.department}</div>
                        </div>
                      </div>
                    </td>
                  )}
                  <td><span className={`badge ${typeColor[req.type] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{req.type}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{req.startDate} → {req.endDate}</td>
                  <td style={{ fontWeight: 600 }}>{req.days}d</td>
                  <td style={{ fontSize: '0.8rem', maxWidth: 200 }}>
                    <span className="truncate" style={{ display: 'block' }}>{req.reason}</span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.appliedOn}</td>
                  <td>
                    <span className={`badge ${req.status === 'approved' ? 'badge-green' : req.status === 'rejected' ? 'badge-red' : 'badge-yellow'}`}>
                      {req.status}
                    </span>
                    {req.comments && (
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>"{req.comments}"</div>
                    )}
                  </td>
                  {isHRorManager && (
                    <td>
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => setActionModal({ req, type: 'approve' })}>
                            <Check size={12} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => setActionModal({ req, type: 'reject' })}>
                            <X size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Calendar size={32} />
              <h3>No leave requests found</h3>
            </div>
          )}
        </div>
      </div>

      {/* Apply Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Apply for Leave</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Leave Type</label>
                  <select className="select" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as any }))}>
                    {LEAVE_TYPES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                  </select>
                </div>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Start Date</label>
                    <input className="input" type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End Date</label>
                    <input className="input" type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} min={form.startDate} />
                  </div>
                </div>
                {form.startDate && form.endDate && (
                  <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>
                    <Calendar size={14} />
                    Duration: <strong>{calcDays(form.startDate, form.endDate)} day(s)</strong>
                  </div>
                )}
                <div className="form-group">
                  <label className="form-label">Reason</label>
                  <textarea className="textarea" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} placeholder="Brief reason for leave..." rows={3} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleApply} disabled={!form.startDate || !form.endDate || !form.reason}>
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approve/Reject Modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setActionModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{actionModal.type === 'approve' ? '✅ Approve Leave' : '❌ Reject Leave'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setActionModal(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ background: 'var(--bg)', borderRadius: 10, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)' }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>{actionModal.req.employeeName}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {actionModal.req.type} leave · {actionModal.req.days} day(s) · {actionModal.req.startDate} to {actionModal.req.endDate}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Comment (optional)</label>
                <textarea className="textarea" value={comment} onChange={e => setComment(e.target.value)} placeholder="Add a note..." rows={2} />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setActionModal(null)}>Cancel</button>
              <button
                className={`btn ${actionModal.type === 'approve' ? 'btn-primary' : 'btn-danger'}`}
                onClick={handleAction}
              >
                {actionModal.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
