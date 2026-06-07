import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, Download } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { downloadCSV } from '../utils/exportCSV';

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const HOLIDAYS = [
  { date: '2024-01-26', name: "Republic Day", type: "national" },
  { date: '2024-03-25', name: "Holi", type: "national" },
  { date: '2024-04-14', name: "Dr. Ambedkar Jayanti", type: "national" },
  { date: '2024-08-15', name: "Independence Day", type: "national" },
  { date: '2024-10-02', name: "Gandhi Jayanti", type: "national" },
  { date: '2024-10-12', name: "Dussehra", type: "national" },
  { date: '2024-11-01', name: "Diwali", type: "national" },
  { date: '2024-12-25', name: "Christmas Day", type: "national" },
];

const BIRTHDAYS = [
  { date: '03-14', name: 'Kiran Patel', avatar: 'KP' },
  { date: '07-01', name: 'Sneha Rao', avatar: 'SR' },
  { date: '11-20', name: 'Ravi Nair', avatar: 'RN' },
  { date: '04-15', name: 'Ananya Singh', avatar: 'AS' },
  { date: '03-22', name: 'Divya Kumar', avatar: 'DK' },
  { date: '12-01', name: 'Vikram Joshi', avatar: 'VJ' },
];

interface CalendarEvent { id: string; title: string; date: string; endDate?: string; type: string; color: string; description?: string; }

export default function CalendarPage() {
  const { leaveRequests, currentUser } = useStore();
  const isAdmin = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'hr_manager';
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [year, setYear] = useState(2024);
  const [month, setMonth] = useState(2);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ title: '', date: '', type: 'meeting', color: '#3b82f6', description: '' });

  useEffect(() => {
    api.get('/calendar/events').then(data => { if (Array.isArray(data)) setEvents(data); }).catch(() => {});
  }, []);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const dateStr = (d: number) => `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  const mmdd = (d: number) => `${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;

  const getEventsForDay = (d: number) => {
    const ds = dateStr(d);
    const mmd = mmdd(d);
    return {
      leaves: leaveRequests.filter(r => r.startDate <= ds && r.endDate >= ds),
      holidays: HOLIDAYS.filter(h => h.date === ds),
      birthdays: BIRTHDAYS.filter(b => b.date === mmd),
      events: events.filter(e => e.date === ds),
    };
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const monthLeaves = leaveRequests.filter(r => {
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0);
    return new Date(r.startDate) <= monthEnd && new Date(r.endDate) >= monthStart;
  });

  const selectedEvents = selectedDate ? getEventsForDay(parseInt(selectedDate.split('-')[2])) : null;

  const exportCurrentMonth = () => {
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    const rows = [
      ...events.filter(e => e.date.startsWith(monthPrefix)).map(e => ({
        Date: e.date,
        Type: e.type,
        Title: e.title,
        Description: e.description,
        Status: '',
      })),
      ...HOLIDAYS.filter(h => h.date.startsWith(monthPrefix)).map(h => ({
        Date: h.date,
        Type: h.type,
        Title: h.name,
        Description: '',
        Status: '',
      })),
      ...BIRTHDAYS.filter(b => b.date.startsWith(String(month + 1).padStart(2, '0'))).map(b => ({
        Date: `${year}-${b.date}`,
        Type: 'birthday',
        Title: `${b.name} Birthday`,
        Description: '',
        Status: '',
      })),
      ...monthLeaves.map(l => ({
        Date: `${l.startDate} to ${l.endDate}`,
        Type: `${l.type} leave`,
        Title: l.employeeName,
        Description: '',
        Status: l.status,
      })),
    ];
    downloadCSV('calendar', rows);
  };

  const handleAddEvent = async () => {
    if (!form.title || !form.date) return;
    try {
      const newEvent = await api.post('/calendar/events', form);
      setEvents(prev => [...prev, newEvent]);
      setModal(false);
      setForm({ title: '', date: '', type: 'meeting', color: '#3b82f6', description: '' });
      toast.success('Event created!', form.title);
    } catch { toast.error('Failed', 'Could not create event.'); }
  };


  const handleDeleteEvent = async (id: string) => {
    try {
      await api.del(`/calendar/events/${id}`);
      setEvents(prev => prev.filter(e => e.id !== id));
      toast.success('Event deleted', 'Calendar event removed.');
    } catch { toast.error('Failed', 'Could not delete event.'); }
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        <div className="card p-6">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <button className="btn btn-secondary btn-sm" onClick={prevMonth}><ChevronLeft size={16} /></button>
            <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{MONTHS[month]} {year}</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={exportCurrentMonth}><Download size={14} /> Export CSV</button>
              {isAdmin && <button className="btn btn-primary btn-sm" onClick={() => setModal(true)}><Plus size={14} /> Add Event</button>}
              <button className="btn btn-secondary btn-sm" onClick={nextMonth}><ChevronRight size={16} /></button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            {DAYS.map(d => (
              <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: 6 }}>{d}</div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const ds = dateStr(day);
              const dayEvents = getEventsForDay(day);
              const hasItems = dayEvents.leaves.length + dayEvents.holidays.length + dayEvents.birthdays.length + dayEvents.events.length > 0;
              const isSelected = selectedDate === ds;
              return (
                <div key={day} onClick={() => setSelectedDate(ds)} style={{
                  padding: '8px 4px', textAlign: 'center', borderRadius: 8, cursor: 'pointer',
                  background: isSelected ? 'var(--primary)' : dayEvents.holidays.length ? '#fef9c3' : 'transparent',
                  color: isSelected ? 'white' : 'var(--text-primary)',
                  fontSize: '0.8rem', fontWeight: 600, position: 'relative',
                  border: `1px solid ${isSelected ? 'var(--primary)' : 'transparent'}`,
                  transition: 'all 150ms',
                }}>
                  {day}
                  {hasItems && !isSelected && (
                    <div style={{ display: 'flex', gap: 2, justifyContent: 'center', marginTop: 2 }}>
                      {dayEvents.events.length > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#3b82f6' }} />}
                      {dayEvents.leaves.length > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#f59e0b' }} />}
                      {dayEvents.birthdays.length > 0 && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#ec4899' }} />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {selectedDate && selectedEvents && (
            <div className="card p-5">
              <h4 style={{ marginBottom: 12, fontSize: '0.85rem' }}>{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
              {selectedEvents.holidays.map(h => (
                <div key={h.name} style={{ padding: '8px 12px', borderRadius: 8, background: '#fef9c3', marginBottom: 8, fontSize: '0.8rem', fontWeight: 600, color: '#b45309' }}>{h.name}</div>
              ))}
              {selectedEvents.birthdays.map(b => (
                <div key={b.name} style={{ padding: '8px 12px', borderRadius: 8, background: '#fce7f3', marginBottom: 8, fontSize: '0.8rem', color: '#be185d' }}>🎂 {b.name}'s Birthday</div>
              ))}
              {selectedEvents.events.map(e => (
                <div key={e.id} style={{ padding: '8px 12px', borderRadius: 8, background: `${e.color}15`, borderLeft: `3px solid ${e.color}`, marginBottom: 8, fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    {e.description && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>{e.description}</div>}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteEvent(e.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '1rem', padding: '0 4px', opacity: 0.6, flexShrink: 0 }}
                      onMouseEnter={ev => (ev.currentTarget.style.opacity = '1')}
                      onMouseLeave={ev => (ev.currentTarget.style.opacity = '0.6')}
                      title="Delete event"
                    >×</button>
                  )}
                </div>
              ))}
              {selectedEvents.leaves.map(l => (
                <div key={l.id} style={{ padding: '8px 12px', borderRadius: 8, background: '#fef3c7', marginBottom: 8, fontSize: '0.8rem' }}>
                  <span style={{ fontWeight: 600 }}>{l.employeeName}</span> — {l.type} leave
                  <span className="badge" style={{ marginLeft: 8, background: l.status === 'approved' ? '#dcfce7' : '#fef9c3', color: l.status === 'approved' ? '#16a34a' : '#b45309', fontSize: '0.65rem' }}>{l.status}</span>
                </div>
              ))}
              {Object.values(selectedEvents).every(arr => arr.length === 0) && (
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No events on this day</p>
              )}
            </div>
          )}

          <div className="card p-5">
            <h4 style={{ marginBottom: 12, fontSize: '0.85rem' }}>Upcoming Events</h4>
            {events.slice(0, 5).map(e => (
              <div key={e.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 4, height: 28, borderRadius: 2, background: e.color }} />
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{e.title}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{e.date}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card p-5">
            <h4 style={{ marginBottom: 12, fontSize: '0.85rem' }}>Leaves This Month</h4>
            {monthLeaves.slice(0, 5).map(l => (
              <div key={l.id} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.8rem' }}>
                <div className="avatar-xs">{l.employeeAvatar}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{l.employeeName}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{l.startDate} → {l.endDate}</div>
                </div>
                <span className="badge" style={{ background: l.status === 'approved' ? '#dcfce7' : '#fef9c3', color: l.status === 'approved' ? '#16a34a' : '#b45309', fontSize: '0.65rem' }}>{l.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <h3>Add Event</h3>
              <button className="btn-icon" onClick={() => setModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 24px 24px' }}>
              <div><label className="form-label">Title</label><input className="form-input" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} /></div>
              <div><label className="form-label">Date</label><input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              <div><label className="form-label">Type</label>
                <select className="form-input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
                  <option value="meeting">Meeting</option><option value="training">Training</option><option value="deadline">Deadline</option><option value="event">Event</option>
                </select>
              </div>
              <div><label className="form-label">Description</label><textarea className="form-input" rows={2} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} /></div>
              <button className="btn btn-primary" onClick={handleAddEvent}>Create Event</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
