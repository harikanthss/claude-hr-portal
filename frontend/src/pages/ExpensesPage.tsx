import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { Plus, X, Receipt, CheckCircle2, XCircle, Clock, Upload, Download } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { downloadCSV } from '../utils/exportCSV';

interface Expense {
  id: string; employeeId: string; employeeName: string; employeeAvatar: string;
  category: string; amount: number; description: string; date: string;
  status: 'pending' | 'approved' | 'rejected'; receipt?: string;
  submittedOn: string; approvedBy?: string; comments?: string;
}

const CATEGORIES = ['Travel', 'Food & Entertainment', 'Office Supplies', 'Training', 'Medical', 'Software', 'Other'];

export default function ExpensesPage() {
  const { currentUser } = useStore();
  const isHRorManager = currentUser?.role !== 'employee';
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [tab, setTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [modal, setModal] = useState(false);
  const [actionModal, setActionModal] = useState<{ exp: Expense; type: 'approve' | 'reject' } | null>(null);
  const [comment, setComment] = useState('');
  const [form, setForm] = useState({ category: 'Travel', amount: '', description: '', date: '' });

  useEffect(() => {
    api.get('/expenses').then(data => { if (Array.isArray(data)) setExpenses(data); }).catch(() => {});
  }, []);

  const filtered = expenses.filter(e => tab === 'all' || e.status === tab);
  const counts = {
    all: expenses.length, pending: expenses.filter(e => e.status === 'pending').length,
    approved: expenses.filter(e => e.status === 'approved').length, rejected: expenses.filter(e => e.status === 'rejected').length,
  };
  const totalApproved = expenses.filter(e => e.status === 'approved').reduce((s, e) => s + e.amount, 0);
  const totalPending = expenses.filter(e => e.status === 'pending').reduce((s, e) => s + e.amount, 0);

  const handleSubmit = async () => {
    if (!form.description || !form.amount || !form.date) return;
    try {
      const newExp = await api.post('/expenses', {
        employeeId: currentUser?.id || 'e1', employeeName: currentUser?.name || 'User',
        employeeAvatar: currentUser?.avatar || 'U', category: form.category,
        amount: Number(form.amount), description: form.description, date: form.date,
        submittedOn: new Date().toISOString().split('T')[0],
      });
      setExpenses(prev => [newExp, ...prev]);
      setModal(false);
      setForm({ category: 'Travel', amount: '', description: '', date: '' });
      toast.success('Expense submitted!', `₹${Number(form.amount).toLocaleString()} claim sent for approval.`);
    } catch { toast.error('Failed', 'Could not submit expense.'); }
  };

  const handleAction = async () => {
    if (!actionModal) return;
    const { exp, type } = actionModal;
    try {
      const updated = await api.put(`/expenses/${exp.id}`, {
        status: type === 'approve' ? 'approved' : 'rejected', approvedBy: currentUser?.name, comments: comment,
      });
      setExpenses(prev => prev.map(e => e.id === exp.id ? updated : e));
      if (type === 'approve') toast.success('Expense approved!', `₹${exp.amount.toLocaleString()} claim approved.`);
      else toast.error('Expense rejected', `₹${exp.amount.toLocaleString()} claim rejected.`);
    } catch { toast.error('Failed', 'Could not update expense.'); }
    setActionModal(null); setComment('');
  };

  const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    pending: { icon: <Clock size={14} />, color: '#b45309', bg: '#fef9c3' },
    approved: { icon: <CheckCircle2 size={14} />, color: '#16a34a', bg: '#dcfce7' },
    rejected: { icon: <XCircle size={14} />, color: '#dc2626', bg: '#fee2e2' },
  };

  return (
    <div className="animate-fade">
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Approved</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#22c55e' }}>₹{totalApproved.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Pending Claims</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>₹{totalPending.toLocaleString()}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Claims</div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#3b82f6' }}>{expenses.length}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div className="tab-nav" style={{ marginBottom: 0 }}>
          {(['all', 'pending', 'approved', 'rejected'] as const).map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)} ({counts[t]})
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <button className="btn btn-secondary" onClick={() => downloadCSV('expenses', filtered.map(e => ({
            Employee: e.employeeName,
            Category: e.category,
            Description: e.description,
            Amount: e.amount,
            Date: e.date,
            Status: e.status,
            'Submitted On': e.submittedOn,
            'Approved By': e.approvedBy,
            Comments: e.comments,
          }))) }><Download size={15} /> Export CSV</button>
          <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> New Expense</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr><th>Employee</th><th>Category</th><th>Description</th><th>Amount</th><th>Date</th><th>Status</th>{isHRorManager && <th>Actions</th>}</tr>
          </thead>
          <tbody>
            {filtered.map(exp => {
              const cfg = statusConfig[exp.status];
              return (
                <tr key={exp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar-sm">{exp.employeeAvatar}</div>
                      <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{exp.employeeName}</span>
                    </div>
                  </td>
                  <td><span className="badge badge-blue">{exp.category}</span></td>
                  <td style={{ fontSize: '0.85rem', maxWidth: 200 }}>{exp.description}</td>
                  <td style={{ fontWeight: 700 }}>₹{exp.amount.toLocaleString()}</td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{exp.date}</td>
                  <td><span className="badge" style={{ background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', gap: 4, width: 'fit-content' }}>{cfg.icon} {exp.status}</span></td>
                  {isHRorManager && (
                    <td>
                      {exp.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-primary btn-sm" onClick={() => setActionModal({ exp, type: 'approve' })}>Approve</button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setActionModal({ exp, type: 'reject' })}>Reject</button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
            {filtered.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No expenses found</td></tr>}
          </tbody>
        </table>
      </div>

      {/* New Expense Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header">
              <h3>Submit Expense Claim</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 24px 24px' }}>
              <div><label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div><label className="form-label">Amount (₹)</label>
                <input className="form-input" type="number" placeholder="Enter amount" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
              </div>
              <div><label className="form-label">Description</label>
                <textarea className="form-input" rows={3} placeholder="Describe the expense" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div><label className="form-label">Date</label>
                <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
              </div>
              <button className="btn btn-primary" onClick={handleSubmit} style={{ marginTop: 8 }}><Receipt size={15} /> Submit Claim</button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => { setActionModal(null); setComment(''); }}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <div className="modal-header">
              <h3>{actionModal.type === 'approve' ? 'Approve' : 'Reject'} Expense</h3>
              <button className="btn-icon" onClick={() => { setActionModal(null); setComment(''); }}><X size={18} /></button>
            </div>
            <div style={{ padding: '0 24px 24px' }}>
              <p style={{ marginBottom: 12, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                {actionModal.exp.employeeName} — ₹{actionModal.exp.amount.toLocaleString()} ({actionModal.exp.category})
              </p>
              <textarea className="form-input" rows={3} placeholder="Add a comment (optional)" value={comment} onChange={e => setComment(e.target.value)} />
              <button className={`btn ${actionModal.type === 'approve' ? 'btn-primary' : 'btn-danger'}`} onClick={handleAction} style={{ marginTop: 12, width: '100%' }}>
                {actionModal.type === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
