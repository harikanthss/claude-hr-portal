import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Employee } from '../types';
import {
  Search, Plus, Edit2, Trash2, X, ChevronUp, ChevronDown,
  KeyRound, Copy, Mail, RefreshCw, Eye, EyeOff, CheckCircle2
} from 'lucide-react';
import { toast } from '../components/ui/Toast';

const DEPARTMENTS = ['All', 'Engineering', 'Sales', 'Design', 'Content', 'HR', 'Finance', 'Marketing', 'Operations'];

const EMPTY_EMP: Omit<Employee, 'id'> = {
  name: '', email: '', department: 'Engineering', position: '', status: 'active',
  joinDate: '', salary: 0, performance: 80, attendance: 90, avatar: '',
  managerId: 'm1', phone: '', location: '', points: 0, badges: [], streak: 0,
};

/* Generate a deterministic-ish password from employee data */
function genPassword(emp: Employee) {
  const seed = emp.name.replace(/\s+/g, '').slice(0, 4).toLowerCase();
  const nums = String(emp.salary).slice(-3) || '123';
  return `Grevya@${seed}${nums}`;
}

interface CredInfo {
  emp: Employee;
  password: string;
}

export default function EmployeesPage() {
  const { currentUser, employees, addEmployee, updateEmployee, deleteEmployee } = useStore();
  const isHR = currentUser?.role === 'hr_manager';

  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortKey, setSortKey] = useState<keyof Employee>('name');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState<Omit<Employee, 'id'>>(EMPTY_EMP);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Credentials modal
  const [credInfo, setCredInfo] = useState<CredInfo | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState<'email' | 'pass' | 'all' | null>(null);

  const filtered = employees
    .filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        e.position.toLowerCase().includes(search.toLowerCase());
      const matchDept = dept === 'All' || e.department === dept;
      const matchStatus = status === 'All' || e.status === status;
      return matchSearch && matchDept && matchStatus;
    })
    .sort((a, b) => {
      const av = a[sortKey] as string | number;
      const bv = b[sortKey] as string | number;
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const openAdd = () => { setForm(EMPTY_EMP); setModal('add'); };
  const openEdit = (emp: Employee) => { setEditing(emp); setForm({ ...emp }); setModal('edit'); };
  const closeModal = () => { setModal(null); setEditing(null); };

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    const avatar = form.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    if (modal === 'add') {
      addEmployee({ ...form, avatar });
      toast.success('Employee added!', `${form.name} has been added to the team.`);
    } else if (editing) {
      updateEmployee(editing.id, { ...form, avatar });
      toast.success('Employee updated!', `${form.name}'s profile has been saved.`);
    }
    closeModal();
  };

  const sort = (key: keyof Employee) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const SortIcon = ({ k }: { k: keyof Employee }) =>
    sortKey === k ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />) : null;

  const statusColor = { active: 'badge-green', inactive: 'badge-gray', on_leave: 'badge-yellow' };

  // ── Credentials helpers ──────────────────────────────────
  const openCreds = (emp: Employee) => {
    setCredInfo({ emp, password: genPassword(emp) });
    setShowPassword(false);
    setCopied(null);
  };

  const copyToClipboard = async (text: string, kind: 'email' | 'pass' | 'all') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      toast.success('Copied!', `${kind === 'all' ? 'Credentials' : kind === 'email' ? 'Email' : 'Password'} copied to clipboard.`);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* fallback */
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(kind);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  const sendEmail = (info: CredInfo) => {
    const { emp, password } = info;
    const subject = encodeURIComponent(`Your Grevya HR Portal Access Credentials`);
    const body = encodeURIComponent(
      `Hi ${emp.name},\n\n` +
      `Welcome to Grevya HR Portal! 🎉\n\n` +
      `Here are your login credentials:\n\n` +
      `🌐 Portal URL: https://hr.grevya.com\n` +
      `📧 Email: ${emp.email}\n` +
      `🔑 Password: ${password}\n\n` +
      `Please log in and change your password at first sign-in.\n\n` +
      `If you have any issues accessing the portal, reach out to your HR team.\n\n` +
      `Best regards,\n` +
      `${currentUser?.name}\n` +
      `Grevya HR Team`
    );
    window.open(`mailto:${emp.email}?subject=${subject}&body=${body}`, '_blank');
    toast.success('Email client opened!', `Credentials draft ready for ${emp.name}.`);
  };

  const regeneratePassword = (info: CredInfo) => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
    const rand = Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    setCredInfo({ ...info, password: `Gr@${rand}` });
    setCopied(null);
    toast.info('Password regenerated', 'A new password has been generated.');
  };

  return (
    <div className="animate-fade">
      {/* Filters */}
      <div className="filter-row">
        <div className="search-wrap" style={{ flex: 1, maxWidth: 320 }}>
          <Search size={15} />
          <input className="input search-input" placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38 }} />
        </div>
        <select className="select" value={dept} onChange={e => setDept(e.target.value)} style={{ height: 38, width: 160 }}>
          {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
        </select>
        <select className="select" value={status} onChange={e => setStatus(e.target.value)} style={{ height: 38, width: 140 }}>
          <option>All</option>
          <option value="active">Active</option>
          <option value="on_leave">On Leave</option>
          <option value="inactive">Inactive</option>
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filtered.length} results</span>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={16} /> Add Employee</button>
        </div>
      </div>

      {/* Table */}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th onClick={() => sort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Name <SortIcon k="name" /></span>
                </th>
                <th>Contact</th>
                <th onClick={() => sort('department')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Dept <SortIcon k="department" /></span>
                </th>
                <th>Position</th>
                <th onClick={() => sort('performance')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Performance <SortIcon k="performance" /></span>
                </th>
                <th onClick={() => sort('attendance')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>Attendance <SortIcon k="attendance" /></span>
                </th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(emp => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="avatar">{emp.avatar}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.name}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.location}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ fontSize: '0.8rem' }}>{emp.email}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.phone}</div>
                  </td>
                  <td><span className="chip">{emp.department}</span></td>
                  <td style={{ fontSize: '0.8rem' }}>{emp.position}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 60 }}>
                        <div className="progress-bar progress-green" style={{ width: `${emp.performance}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{emp.performance}%</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="progress" style={{ width: 60 }}>
                        <div className={`progress-bar ${emp.attendance >= 90 ? 'progress-green' : emp.attendance >= 75 ? 'progress-amber' : 'progress-red'}`} style={{ width: `${emp.attendance}%` }} />
                      </div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{emp.attendance}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`badge ${statusColor[emp.status]}`} style={{ fontSize: '0.7rem' }}>
                      {emp.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(emp)} title="Edit">
                        <Edit2 size={14} />
                      </button>
                      {isHR && (
                        <button
                          className="btn btn-ghost btn-icon btn-sm"
                          onClick={() => openCreds(emp)}
                          title="Share Credentials"
                          style={{ color: '#8b5cf6' }}
                        >
                          <KeyRound size={14} />
                        </button>
                      )}
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(emp.id)} title="Delete" style={{ color: '#dc2626' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="empty-state">
              <Search size={32} />
              <h3>No employees found</h3>
              <p>Try adjusting your search or filters.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Add/Edit Modal ─────────────────────────────── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{modal === 'add' ? 'Add New Employee' : 'Edit Employee'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={closeModal}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div className="grid-2" style={{ gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Kiran Patel" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="kiran@grevya.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="select" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}>
                    {DEPARTMENTS.filter(d => d !== 'All').map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Position</label>
                  <input className="input" value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))} placeholder="Backend Developer" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="input" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" />
                </div>
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input className="input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Bangalore" />
                </div>
                <div className="form-group">
                  <label className="form-label">Join Date</label>
                  <input className="input" type="date" value={form.joinDate} onChange={e => setForm(f => ({ ...f, joinDate: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Salary (₹)</label>
                  <input className="input" type="number" value={form.salary} onChange={e => setForm(f => ({ ...f, salary: Number(e.target.value) }))} placeholder="85000" />
                </div>
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="select" value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="on_leave">On Leave</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Performance (0-100)</label>
                  <input className="input" type="number" min={0} max={100} value={form.performance} onChange={e => setForm(f => ({ ...f, performance: Number(e.target.value) }))} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeModal}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={!form.name || !form.email}>
                {modal === 'add' ? 'Add Employee' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ─────────────────────────────── */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Confirm Delete</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setDeleteConfirm(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)' }}>Are you sure you want to delete this employee? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => { deleteEmployee(deleteConfirm); toast.error('Employee deleted', 'The employee record has been removed.'); setDeleteConfirm(null); }}>
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Credentials Modal (HR only) ────────────────── */}
      {credInfo && isHR && (
        <div className="modal-overlay" onClick={() => setCredInfo(null)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <KeyRound size={16} color="#8b5cf6" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Share Credentials</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>For {credInfo.emp.name}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setCredInfo(null)}><X size={18} /></button>
            </div>

            <div className="modal-body">
              {/* Employee info strip */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 20 }}>
                <div className="avatar">{credInfo.emp.avatar}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{credInfo.emp.name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{credInfo.emp.position} · {credInfo.emp.department}</div>
                </div>
                <span className={`badge ${statusColor[credInfo.emp.status]}`} style={{ marginLeft: 'auto', fontSize: '0.65rem' }}>
                  {credInfo.emp.status.replace('_', ' ')}
                </span>
              </div>

              {/* Portal URL */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Portal URL</div>
                <div style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                  https://hr.grevya.com
                </div>
              </div>

              {/* Email */}
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6 }}>Login Email</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                    {credInfo.emp.email}
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyToClipboard(credInfo.emp.email, 'email')}
                    style={{ flexShrink: 0, color: copied === 'email' ? '#22c55e' : undefined, borderColor: copied === 'email' ? '#22c55e' : undefined }}
                  >
                    {copied === 'email' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>Temporary Password</div>
                  <button className="btn btn-ghost btn-sm" style={{ fontSize: '0.7rem', padding: '3px 8px' }} onClick={() => regeneratePassword(credInfo)}>
                    <RefreshCw size={11} /> Regenerate
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ flex: 1, padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)', fontSize: '0.875rem', fontFamily: 'monospace', letterSpacing: showPassword ? '0' : '0.2em' }}>
                    {showPassword ? credInfo.password : '•'.repeat(credInfo.password.length)}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowPassword(v => !v)} style={{ flexShrink: 0 }}>
                    {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => copyToClipboard(credInfo.password, 'pass')}
                    style={{ flexShrink: 0, color: copied === 'pass' ? '#22c55e' : undefined, borderColor: copied === 'pass' ? '#22c55e' : undefined }}
                  >
                    {copied === 'pass' ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>

              {/* Security note */}
              <div className="alert alert-warning" style={{ fontSize: '0.78rem', marginBottom: 0 }}>
                ⚠️ Send credentials only through a secure channel. Ask the employee to change their password after first login.
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => copyToClipboard(`Email: ${credInfo.emp.email}\nPassword: ${credInfo.password}\nPortal: https://hr.grevya.com`, 'all')}
                style={{ color: copied === 'all' ? '#22c55e' : undefined, borderColor: copied === 'all' ? '#22c55e' : undefined }}
              >
                {copied === 'all' ? <><CheckCircle2 size={14} /> Copied!</> : <><Copy size={14} /> Copy All</>}
              </button>
              <button className="btn btn-primary" onClick={() => sendEmail(credInfo)} style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <Mail size={14} /> Send via Email
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
