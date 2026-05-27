import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { Plus, X, Check, Clock, Trash2 } from 'lucide-react';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import { toast } from '../components/ui/Toast';

const SHIFT_TYPES = [
  { id: 'morning',   label: 'Morning',   time: '09:00 – 17:00', color: '#22c55e' },
  { id: 'afternoon', label: 'Afternoon', time: '14:00 – 22:00', color: '#3b82f6' },
  { id: 'night',     label: 'Night',     time: '22:00 – 06:00', color: '#8b5cf6' },
  { id: 'general',   label: 'General',   time: '10:00 – 18:00', color: '#f59e0b' },
];

const SHIFT_COLORS: Record<string, string> = {
  morning: '#22c55e', afternoon: '#3b82f6', night: '#8b5cf6', general: '#f59e0b',
};

function getWeekDates(startDate: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });
}

function getMondayOfWeek(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.getFullYear(), d.getMonth(), diff);
}

export default function ShiftsPage() {
  const { employees, currentUser } = useStore();
  const isManager = ['admin', 'hr_manager', 'manager'].includes(currentUser?.role || '');

  const [weekStart, setWeekStart] = useState<Date>(() => getMondayOfWeek(new Date()));
  const [shifts, setShifts] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [confirmDeleteShift, setConfirmDeleteShift] = useState<string | null>(null);
  const [form, setForm] = useState({
    employeeId: '', shiftType: 'morning', date: '', startTime: '09:00', endTime: '17:00', notes: '',
  });

  const weekDates = getWeekDates(weekStart);
  const weekParam = weekStart.toISOString().split('T')[0];

  useEffect(() => {
    api.get(`/shifts?week=${weekParam}`)
      .then(d => { if (Array.isArray(d)) setShifts(d); })
      .catch(() => {});
  }, [weekParam]);

  const prevWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() - 7);
    setWeekStart(d);
  };
  const nextWeek = () => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 7);
    setWeekStart(d);
  };
  const goToday = () => setWeekStart(getMondayOfWeek(new Date()));

  const handleAdd = async () => {
    if (!form.employeeId || !form.date) return;
    const emp = employees.find(e => e.id === form.employeeId);
    try {
      const created = await api.post('/shifts', { ...form, employeeName: emp?.name || '' });
      const newShift = { ...form, id: created.id, employeeName: emp?.name, status: 'scheduled' };
      setShifts(prev => [...prev, newShift]);
      setShowForm(false);
      setForm({ employeeId: '', shiftType: 'morning', date: '', startTime: '09:00', endTime: '17:00', notes: '' });
      toast.success('Shift added', `Shift scheduled for ${emp?.name}`);
    } catch { toast.error('Failed', 'Could not add shift.'); }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.del(`/shifts/${id}`);
      setShifts(prev => prev.filter(s => s.id !== id));
      setConfirmDeleteShift(null);
      toast.success('Deleted', 'Shift removed.');
    } catch { toast.error('Failed', 'Could not delete shift.'); }
  };

  const totalShifts = shifts.length;
  const morning = shifts.filter(s => s.shiftType === 'morning').length;
  const night = shifts.filter(s => s.shiftType === 'night').length;

  return (
    <div className="animate-fade">
      {/* Stats */}
      <div className="grid-3 mb-6">
        {[
          { label: 'Total Shifts', val: totalShifts, color: '#3b82f6' },
          { label: 'Morning Shifts', val: morning, color: '#f59e0b' },
          { label: 'Night Shifts', val: night, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '20px 24px', borderLeft: `3px solid ${s.color}` }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* Week Navigation */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button className="btn btn-secondary btn-sm" onClick={prevWeek}>‹ Prev</button>
          <span style={{ fontWeight: 700, fontSize: '0.9rem', minWidth: 200, textAlign: 'center' }}>
            {weekDates[0].toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} –{' '}
            {weekDates[6].toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={nextWeek}>Next ›</button>
          <button className="btn btn-secondary btn-sm" onClick={goToday}>Today</button>
        </div>
        {isManager && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            <Plus size={15} /> Add Shift
          </button>
        )}
      </div>

      {/* Week Grid */}
      <div className="card" style={{ overflowX: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, minmax(120px, 1fr))', minWidth: 700 }}>
          {weekDates.map((date, i) => {
            const dateStr = date.toISOString().split('T')[0];
            const dayShifts = shifts.filter(s => s.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            return (
              <div key={i} style={{ borderRight: i < 6 ? '1px solid var(--border)' : 'none', minHeight: 140 }}>
                <div style={{
                  padding: '10px 12px', borderBottom: '1px solid var(--border)',
                  background: isToday ? 'var(--primary)' : isWeekend ? 'var(--bg)' : 'transparent',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.7rem', color: isToday ? 'rgba(255,255,255,0.75)' : 'var(--text-muted)', fontWeight: 600 }}>
                    {date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}
                  </div>
                  <div style={{ fontWeight: 800, fontSize: '1.1rem', color: isToday ? 'white' : isWeekend ? 'var(--text-muted)' : 'var(--text)' }}>
                    {date.getDate()}
                  </div>
                </div>
                <div style={{ padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayShifts.map(shift => {
                    const color = SHIFT_COLORS[shift.shiftType] || '#94a3b8';
                    return (
                      <div key={shift.id} style={{ padding: '6px 8px', borderRadius: 6, background: `${color}18`, border: `1px solid ${color}40`, position: 'relative' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 700, color }}>{shift.shiftType}</div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{shift.employeeName?.split(' ')[0]}</div>
                        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>{shift.startTime}–{shift.endTime}</div>
                        {isManager && (
                          <button
                            onClick={() => setConfirmDeleteShift(shift.id)}
                            style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '0.75rem', opacity: 0.5, padding: 0 }}
                            onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                            onMouseLeave={e => (e.currentTarget.style.opacity = '0.5')}
                          >×</button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* All Shifts List */}
      <div className="card mt-6" style={{ marginTop: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="table">
            <thead>
              <tr><th>Employee</th><th>Date</th><th>Shift</th><th>Time</th><th>Status</th>{isManager && <th>Actions</th>}</tr>
            </thead>
            <tbody>
              {shifts.length === 0 ? (
                <tr><td colSpan={isManager ? 6 : 5} style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>No shifts this week.</td></tr>
              ) : shifts.map(shift => {
                const color = SHIFT_COLORS[shift.shiftType] || '#94a3b8';
                return (
                  <tr key={shift.id}>
                    <td style={{ fontWeight: 600 }}>{shift.employeeName}</td>
                    <td style={{ fontSize: '0.85rem' }}>{shift.date}</td>
                    <td><span style={{ padding: '3px 10px', borderRadius: 20, background: `${color}18`, color, fontSize: '0.75rem', fontWeight: 700 }}>{shift.shiftType}</span></td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>{shift.startTime} – {shift.endTime}</td>
                    <td><span className={`badge ${shift.status === 'scheduled' ? 'badge-blue' : 'badge-green'}`}>{shift.status}</span></td>
                    {isManager && (
                      <td>
                        <button className="btn btn-secondary btn-sm" style={{ color: '#ef4444' }} onClick={() => setConfirmDeleteShift(shift.id)}>
                          <Trash2 size={13} />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Shift Modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="card" style={{ width: '100%', maxWidth: 480, padding: '28px 32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3>Add Shift</h3>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Employee *</label>
                <select className="input" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Select employee</option>
                  {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.name} — {e.department}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="input" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Shift Type</label>
                  <select className="input" value={form.shiftType} onChange={e => {
                    const st = SHIFT_TYPES.find(s => s.id === e.target.value);
                    const [start, end] = (st?.time || '09:00 – 17:00').split(' – ');
                    setForm(f => ({ ...f, shiftType: e.target.value, startTime: start, endTime: end }));
                  }}>
                    {SHIFT_TYPES.map(s => <option key={s.id} value={s.id}>{s.label} ({s.time})</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Start Time</label>
                  <input type="time" className="input" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">End Time</label>
                  <input type="time" className="input" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <input type="text" className="input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes..." />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleAdd} disabled={!form.employeeId || !form.date}><Check size={14} /> Add Shift</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDeleteShift}
        title="Delete Shift"
        message="Are you sure you want to delete this shift? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => confirmDeleteShift && handleDelete(confirmDeleteShift)}
        onCancel={() => setConfirmDeleteShift(null)}
      />
    </div>
  );
}
