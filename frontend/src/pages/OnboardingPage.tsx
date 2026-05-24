import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { CheckCircle2, Circle, Clock, Users, Laptop, FileText, BookOpen, MessageSquare, Plus, ChevronDown, ChevronRight } from 'lucide-react';
import { toast } from '../components/ui/Toast';

interface CheckItem { id: string; label: string; done: boolean; dueDay: number; assignee: string; notes?: string; }
interface OnboardingEmployee {
  id: string; name: string; avatar: string; department: string; position: string;
  startDate: string; buddy: string; progress: number; checklist: CheckItem[];
}

const ASSIGNEE_COLORS: Record<string, string> = { HR: '#3b82f6', IT: '#22c55e', Manager: '#8b5cf6', Employee: '#f59e0b' };
const PHASE_ICONS: Record<string, React.ReactNode> = {
  HR: <Users size={13} />, IT: <Laptop size={13} />, Manager: <MessageSquare size={13} />, Employee: <FileText size={13} />,
};

export default function OnboardingPage() {
  const { currentUser } = useStore();
  const isHR = currentUser?.role === 'hr_manager';
  const [employees, setEmployees] = useState<OnboardingEmployee[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [expanded, setExpanded] = useState<string[]>([]);

  useEffect(() => {
    api.get('/onboarding').then(data => {
      if (Array.isArray(data) && data.length > 0) {
        setEmployees(data);
        setSelected(data[0].id);
      }
    }).catch(() => {});
  }, []);

  const selectedEmployee = employees.find(e => e.id === selected);

  const toggleItem = async (empId: string, itemId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;
    const item = emp.checklist.find(c => c.id === itemId);
    if (!item) return;
    const newDone = !item.done;
    try {
      await api.put(`/onboarding/${itemId}`, { done: newDone });
      setEmployees(prev => prev.map(e => {
        if (e.id !== empId) return e;
        const checklist = e.checklist.map(c => c.id === itemId ? { ...c, done: newDone } : c);
        const progress = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);
        return { ...e, checklist, progress };
      }));
      if (newDone) toast.success('Task completed!', item.label);
    } catch { toast.error('Failed', 'Could not update task.'); }
  };

  const phases = ['HR', 'IT', 'Manager', 'Employee'] as const;
  const avgProgress = employees.length > 0 ? Math.round(employees.reduce((s, e) => s + e.progress, 0) / employees.length) : 0;

  return (
    <div className="animate-fade">
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Active Onboarding</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{employees.length}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Avg Completion</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{avgProgress}%</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Completed</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>{employees.filter(e => e.progress === 100).length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', fontWeight: 700, fontSize: '0.85rem' }}>New Hires</div>
          {employees.map(emp => (
            <div key={emp.id} onClick={() => setSelected(emp.id)} style={{
              padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer',
              background: selected === emp.id ? 'var(--primary-subtle)' : 'transparent',
              borderLeft: selected === emp.id ? '3px solid var(--primary)' : '3px solid transparent',
              transition: 'all 150ms',
            }}>
              <div className="avatar-sm">{emp.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{emp.name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{emp.department}</div>
              </div>
              <div style={{ width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.65rem', fontWeight: 800, background: emp.progress >= 80 ? '#dcfce7' : emp.progress >= 40 ? '#fef9c3' : '#fee2e2', color: emp.progress >= 80 ? '#16a34a' : emp.progress >= 40 ? '#b45309' : '#dc2626' }}>
                {emp.progress}%
              </div>
            </div>
          ))}
        </div>

        {selectedEmployee && (
          <div className="card p-6">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <div className="avatar-lg">{selectedEmployee.avatar}</div>
              <div>
                <h3>{selectedEmployee.name}</h3>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedEmployee.position} · {selectedEmployee.department}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Start: {selectedEmployee.startDate} · Buddy: {selectedEmployee.buddy}
                </div>
              </div>
              <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: selectedEmployee.progress >= 80 ? '#22c55e' : '#f59e0b' }}>{selectedEmployee.progress}%</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Complete</div>
              </div>
            </div>

            <div style={{ height: 6, background: 'var(--border-light)', borderRadius: 3, marginBottom: 24, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${selectedEmployee.progress}%`, background: 'linear-gradient(90deg, #22c55e, #16a34a)', borderRadius: 3, transition: 'width 300ms' }} />
            </div>

            {phases.map(phase => {
              const items = selectedEmployee.checklist.filter(c => c.assignee === phase);
              if (items.length === 0) return null;
              const isExpanded = expanded.includes(phase);
              const phaseProgress = Math.round((items.filter(c => c.done).length / items.length) * 100);
              return (
                <div key={phase} style={{ marginBottom: 12 }}>
                  <div onClick={() => setExpanded(prev => isExpanded ? prev.filter(p => p !== phase) : [...prev, phase])} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', cursor: 'pointer',
                    borderRadius: 8, background: 'var(--bg)', transition: 'background 150ms',
                  }}>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    <div style={{ width: 24, height: 24, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', background: `${ASSIGNEE_COLORS[phase]}20`, color: ASSIGNEE_COLORS[phase] }}>{PHASE_ICONS[phase]}</div>
                    <span style={{ fontWeight: 700, fontSize: '0.8rem', flex: 1 }}>{phase}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{items.filter(c => c.done).length}/{items.length}</span>
                    <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: `${phaseProgress}%`, height: '100%', background: ASSIGNEE_COLORS[phase], borderRadius: 2 }} />
                    </div>
                  </div>
                  {isExpanded && items.map(item => (
                    <div key={item.id} onClick={() => toggleItem(selectedEmployee.id, item.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px 10px 48px', cursor: 'pointer',
                      borderBottom: '1px solid var(--border-light)',
                    }}>
                      {item.done ? <CheckCircle2 size={16} color="#22c55e" /> : <Circle size={16} color="var(--text-muted)" />}
                      <span style={{ fontSize: '0.8rem', textDecoration: item.done ? 'line-through' : 'none', color: item.done ? 'var(--text-muted)' : 'var(--text-primary)', flex: 1 }}>{item.label}</span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>Day {item.dueDay}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
