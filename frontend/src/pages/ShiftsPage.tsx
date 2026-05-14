import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { Clock, Plus, X, ChevronLeft, ChevronRight, Sun, Moon, Sunset } from 'lucide-react';
import { toast } from '../components/ui/Toast';

interface Shift { id: string; employeeId: string; employeeName: string; date: string; shiftType: string; startTime: string; endTime: string; status: string; notes?: string; }

const SHIFT_TYPES: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  morning: { label: 'Morning', icon: <Sun size={14} />, color: '#f59e0b', bg: '#fef9c3' },
  afternoon: { label: 'Afternoon', icon: <Sunset size={14} />, color: '#e67700', bg: '#fff7e6' },
  night: { label: 'Night', icon: <Moon size={14} />, color: '#3b82f6', bg: '#dbeafe' },
  general: { label: 'General', icon: <Clock size={14} />, color: '#22c55e', bg: '#dcfce7' },
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ShiftsPage() {
  const { currentUser, employees } = useStore();
  const isAdmin = currentUser?.role !== 'employee';
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(2024, 2, 25);
    d.setDate(d.getDate() - d.getDay() + 1);
    return d;
  });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ employeeId: '', date: '', shiftType: 'morning', startTime: '09:00', endTime: '17:00', notes: '' });

  useEffect(() => {
    const ws = weekStart.toISOString().split('T')[0];
    api.get(`/shifts?week=${ws}`).then(data => { if (Array.isArray(data)) setShifts(data); }).catch(() => {});
  }, [weekStart]);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return d;
  });

  const prevWeek = () => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() - 7); return d; });
  const nextWeek = () => setWeekStart(w => { const d = new Date(w); d.setDate(d.getDate() + 7); return d; });

  const getShiftsForDay = (date: Date) => {
    const ds = date.toISOString().split('T')[0];
    return shifts.filter(s => s.date === ds);
  };

  const handleCreate = async () => {
    if (!form.employeeId || !form.date) return;
    const emp = employees.find(e => e.id === form.employeeId);
    try {
      const newShift = await api.post('/shifts', { ...form, employeeName: emp?.name || 'Unknown' });
      setShifts(prev => [...prev, newShift]);
      setModal(false);
      setForm({ employeeId: '', date: '', shiftType: 'morning', startTime: '09:00', endTime: '17:00', notes: '' });
      toast.success('Shift scheduled!', `${emp?.name} — ${form.date}`);
    } catch { toast.error('Failed', 'Could not create shift.'); }
  };

  const handleDelete = async (id: string) => {
    try { await api.del(`/shifts/${id}`); setShifts(prev => prev.filter(s => s.id !== id)); toast.success('Deleted', 'Shift removed.'); }
    catch { toast.error('Failed', 'Could not delete.'); }
  };

  const totalShifts = shifts.length;
  const morning = shifts.filter(s => s.shiftType === 'morning').length;
  const night = shifts.filter(s => s.shiftType === 'night').length;

  return (
    <div className="animate-fade">
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Shifts</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{totalShifts}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #f59e0b' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Morning Shifts</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{morning}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Night Shifts</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>{night}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-secondary btn-sm" onClick={prevWeek}><ChevronLeft size={16} /></button>
          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>
            {weekDates[0].toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })} — {weekDates[6].toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={nextWeek}><ChevronRight size={16} /></button>
        </div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setModal(true)}><Plus size={15} /> Schedule Shift</button>}
      </div>

      <div className="card" style={{ overflow: 'auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minWidth: 700 }}>
          {weekDates.map((date, i) => {
            const dayShifts = getShiftsForDay(date);
            const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
            return (
              <div key={i} style={{ borderRight: i < 6 ? '1px solid var(--border-light)' : 'none', minHeight: 200 }}>
                <div style={{
                  padding: '12px 8px', textAlign: 'center', borderBottom: '1px solid var(--border-light)',
                  background: isToday ? 'var(--primary-subtle)' : 'var(--bg)',
                  fontWeight: 700, fontSize: '0.8rem',
                }}>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{DAYS[date.getDay()]}</div>
                  <div>{date.getDate()}</div>
                </div>
                <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {dayShifts.map(s => {
                    const cfg = SHIFT_TYPES[s.shiftType] || SHIFT_TYPES.general;
                    return (
                      <div key={s.id} style={{
                        padding: '6px 8px', borderRadius: 6, background: cfg.bg, fontSize: '0.7rem',
                        borderLeft: `3px solid ${cfg.color}`, position: 'relative', cursor: 'default',
                      }}>
                        <div style={{ fontWeight: 700, color: cfg.color, display: 'flex', alignItems: 'center', gap: 4 }}>{cfg.icon} {s.employeeName}</div>
                        <div style={{ color: 'var(--text-muted)', marginTop: 2 }}>{s.startTime} – {s.endTime}</div>
                        {isAdmin && (
                          <button onClick={() => handleDelete(s.id)} style={{ position: 'absolute', top: 4, right: 4, background: 'none', border: 'none', cursor: 'pointer', color: cfg.color, opacity: 0.6 }}>
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {dayShifts.length === 0 && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.65rem', padding: 12 }}>No shifts</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header"><h3>Schedule Shift</h3><button className="btn-icon" onClick={() => setModal(false)}><X size={18} /></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 24px 24px' }}>
              <div><label className="form-label">Employee</label>
                <select className="form-input" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                  <option value="">Select employee...</option>
                  {employees.filter(e => e.status === 'active').map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="form-label">Shift Type</label>
                <select className="form-input" value={form.shiftType} onChange={e => {
                  const t = e.target.value;
                  const times = { morning: ['09:00','17:00'], afternoon: ['13:00','21:00'], night: ['22:00','06:00'], general: ['09:00','17:00'] };
                  const [start, end] = times[t as keyof typeof times] || ['09:00','17:00'];
                  setForm(f => ({ ...f, shiftType: t, startTime: start, endTime: end }));
                }}>
                  {Object.entries(SHIFT_TYPES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div><label className="form-label">Start Time</label><input className="form-input" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} /></div>
                <div><label className="form-label">End Time</label><input className="form-input" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} /></div>
              </div>
              <div><label className="form-label">Notes</label><input className="form-input" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Optional notes" /></div>
              <button className="btn btn-primary" onClick={handleCreate}><Clock size={15} /> Schedule Shift</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
