import { api, useStore } from '../services/store';
import React, { useState } from 'react';
import { Plus, X, Briefcase, Users, Clock, CheckCircle2, XCircle, Search, ChevronRight, Mail, Phone, Download } from 'lucide-react';
import { toast } from '../components/ui/Toast';
import { downloadCSV } from '../utils/exportCSV';

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  stage: 'applied' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected';
  appliedDate: string;
  avatar: string;
  score?: number;
  note?: string;
}

interface JobOpening {
  id: string;
  title: string;
  department: string;
  type: 'full_time' | 'part_time' | 'contract';
  location: string;
  openings: number;
  posted: string;
  status: 'active' | 'paused' | 'closed';
}

const INITIAL_JOBS: JobOpening[] = [
  { id: 'j1', title: 'Senior Backend Engineer', department: 'Engineering', type: 'full_time', location: 'Bangalore', openings: 2, posted: '2024-03-01', status: 'active' },
  { id: 'j2', title: 'Product Designer', department: 'Design', type: 'full_time', location: 'Remote', openings: 1, posted: '2024-03-05', status: 'active' },
  { id: 'j3', title: 'Sales Executive', department: 'Sales', type: 'full_time', location: 'Delhi', openings: 3, posted: '2024-03-10', status: 'active' },
  { id: 'j4', title: 'Content Strategist', department: 'Content', type: 'part_time', location: 'Mumbai', openings: 1, posted: '2024-02-20', status: 'paused' },
];

const INITIAL_CANDIDATES: Candidate[] = [
  { id: 'c1', name: 'Aditya Verma', email: 'aditya@email.com', phone: '+91 98700 00001', position: 'Senior Backend Engineer', department: 'Engineering', stage: 'interview', appliedDate: '2024-03-10', avatar: 'AV', score: 82, note: 'Strong Python skills, needs to assess system design.' },
  { id: 'c2', name: 'Ritika Shah', email: 'ritika@email.com', phone: '+91 98700 00002', position: 'Product Designer', department: 'Design', stage: 'screening', appliedDate: '2024-03-12', avatar: 'RS', score: 75 },
  { id: 'c3', name: 'Manish Tiwari', email: 'manish@email.com', phone: '+91 98700 00003', position: 'Sales Executive', department: 'Sales', stage: 'applied', appliedDate: '2024-03-15', avatar: 'MT' },
  { id: 'c4', name: 'Neha Joshi', email: 'neha@email.com', phone: '+91 98700 00004', position: 'Senior Backend Engineer', department: 'Engineering', stage: 'offer', appliedDate: '2024-03-08', avatar: 'NJ', score: 91, note: 'Excellent candidate. Offer sent.' },
  { id: 'c5', name: 'Sameer Kulkarni', email: 'sameer@email.com', phone: '+91 98700 00005', position: 'Sales Executive', department: 'Sales', stage: 'applied', appliedDate: '2024-03-16', avatar: 'SK' },
  { id: 'c6', name: 'Prerna Mishra', email: 'prerna@email.com', phone: '+91 98700 00006', position: 'Content Strategist', department: 'Content', stage: 'rejected', appliedDate: '2024-03-01', avatar: 'PM', score: 55, note: 'Did not meet experience requirements.' },
  { id: 'c7', name: 'Rohan Bose', email: 'rohan@email.com', phone: '+91 98700 00007', position: 'Senior Backend Engineer', department: 'Engineering', stage: 'hired', appliedDate: '2024-02-20', avatar: 'RB', score: 95, note: 'Exceptional. Joining Apr 1.' },
  { id: 'c8', name: 'Juhi Arora', email: 'juhi@email.com', phone: '+91 98700 00008', position: 'Product Designer', department: 'Design', stage: 'screening', appliedDate: '2024-03-13', avatar: 'JA', score: 70 },
];

const STAGES: { key: Candidate['stage']; label: string; color: string; bg: string }[] = [
  { key: 'applied',   label: 'Applied',   color: '#64748b', bg: '#f1f5f9' },
  { key: 'screening', label: 'Screening', color: '#3b82f6', bg: '#dbeafe' },
  { key: 'interview', label: 'Interview', color: '#8b5cf6', bg: '#f3e8ff' },
  { key: 'offer',     label: 'Offer',     color: '#f59e0b', bg: '#fef9c3' },
  { key: 'hired',     label: 'Hired',     color: '#22c55e', bg: '#dcfce7' },
  { key: 'rejected',  label: 'Rejected',  color: '#ef4444', bg: '#fee2e2' },
];

const STAGE_NEXT: Record<string, Candidate['stage']> = {
  applied: 'screening', screening: 'interview', interview: 'offer', offer: 'hired',
};

export default function RecruitmentPage() {
  const { currentUser } = useStore();
  const canManageRecruitment = currentUser?.role === 'super_admin' || currentUser?.role === 'admin' || currentUser?.role === 'hr_manager';
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobs, setJobs] = useState<JobOpening[]>([]);

  React.useEffect(() => {
    api.get('/candidates').then(d => { if (Array.isArray(d)) setCandidates(d); }).catch(() => {});
    api.get('/jobs').then(d => { if (Array.isArray(d)) setJobs(d); }).catch(() => {});
  }, []);
  const [view, setView] = useState<'pipeline' | 'jobs'>('pipeline');
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [addJobModal, setAddJobModal] = useState(false);
  const [addCandModal, setAddCandModal] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', department: 'Engineering', type: 'full_time' as JobOpening['type'], location: '', openings: 1 });
  const [candForm, setCandForm] = useState({ name: '', email: '', phone: '', position: '', department: 'Engineering' });

  const DEPTS = ['All', 'Engineering', 'Design', 'Sales', 'Content', 'HR', 'Finance', 'Marketing'];

  const filteredCandidates = candidates.filter(c =>
    (deptFilter === 'All' || c.department === deptFilter) &&
    (!search || c.name.toLowerCase().includes(search.toLowerCase()) || c.position.toLowerCase().includes(search.toLowerCase()))
  );

  const exportCurrentView = () => {
    if (view === 'pipeline') {
      downloadCSV('recruitment-candidates', filteredCandidates.map(c => ({
        Name: c.name,
        Email: c.email,
        Phone: c.phone,
        Position: c.position,
        Department: c.department,
        Stage: c.stage,
        'Applied Date': c.appliedDate,
        Score: c.score,
        Note: c.note,
      })));
      return;
    }

    downloadCSV('recruitment-jobs', jobs.map(j => ({
      Title: j.title,
      Department: j.department,
      Type: typeLabel(j.type),
      Location: j.location,
      Openings: j.openings,
      Posted: j.posted,
      Status: j.status,
      'Active Candidates': candidates.filter(c => c.position === j.title && !['hired', 'rejected'].includes(c.stage)).length,
    })));
  };

  const advanceStage = async (id: string) => {
    const c = candidates.find(c => c.id === id);
    if (!c) return;
    const next = STAGE_NEXT[c.stage];
    if (!next) return;
    await api.put(`/candidates/${id}`, { ...c, stage: next });
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: next } : c));
    toast.success(`${c.name} advanced to ${next.charAt(0).toUpperCase() + next.slice(1)}!`);
  };

  const rejectCandidate = async (id: string) => {
    const c = candidates.find(c => c.id === id);
    if (!c) return;
    await api.put(`/candidates/${id}`, { ...c, stage: 'rejected' });
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage: 'rejected' } : c));
    toast.warning(`${c.name}'s application rejected.`);
  };

  const addJob = async () => {
    if (!jobForm.title || !jobForm.location) return;
    const newJob: Partial<JobOpening> = {
      ...jobForm,
      posted: new Date().toISOString().split('T')[0],
      status: 'active',
    };
    const savedJob = await api.post('/jobs', newJob);
    setJobs(prev => [savedJob, ...prev]);
    setAddJobModal(false);
    setJobForm({ title: '', department: 'Engineering', type: 'full_time', location: '', openings: 1 });
    toast.success('Job opening posted!', savedJob.title);
  };

  const addCandidate = async () => {
    if (!candForm.name || !candForm.email || !candForm.position) return;
    const avatar = candForm.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const nc: Partial<Candidate> = {
      ...candForm, avatar,
      stage: 'applied',
      appliedDate: new Date().toISOString().split('T')[0],
    };
    const savedCand = await api.post('/candidates', nc);
    setCandidates(prev => [savedCand, ...prev]);
    setAddCandModal(false);
    setCandForm({ name: '', email: '', phone: '', position: '', department: 'Engineering' });
    toast.success('Candidate added!', `${savedCand.name} added to pipeline.`);
  };

  const stats = {
    total: candidates.length,
    active: candidates.filter(c => !['hired', 'rejected'].includes(c.stage)).length,
    hired: candidates.filter(c => c.stage === 'hired').length,
    openRoles: jobs.filter(j => j.status === 'active').reduce((s, j) => s + j.openings, 0),
  };

  const statusStyle = (s: JobOpening['status']) => s === 'active' ? 'badge-green' : s === 'paused' ? 'badge-yellow' : 'badge-gray';
  const typeLabel = (t: JobOpening['type']) => ({ full_time: 'Full Time', part_time: 'Part Time', contract: 'Contract' }[t]);

  return (
    <div className="animate-fade">
      {/* Stats */}
      <div className="grid-4 mb-6">
        {[
          { label: 'Total Candidates', value: stats.total, color: '#3b82f6', bg: '#dbeafe', icon: <Users size={20} /> },
          { label: 'In Pipeline', value: stats.active, color: '#8b5cf6', bg: '#f3e8ff', icon: <Clock size={20} /> },
          { label: 'Hired This Month', value: stats.hired, color: '#22c55e', bg: '#dcfce7', icon: <CheckCircle2 size={20} /> },
          { label: 'Open Positions', value: stats.openRoles, color: '#f59e0b', bg: '#fef9c3', icon: <Briefcase size={20} /> },
        ].map(s => (
          <div key={s.label} className="card stat-card">
            <div className="stat-icon" style={{ background: s.bg }}><span style={{ color: s.color }}>{s.icon}</span></div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Tab controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12 }}>
        <div className="tab-nav" style={{ marginBottom: 0, borderBottom: 'none' }}>
          {(['pipeline', 'jobs'] as const).map(v => (
            <button key={v} className={`tab-btn ${view === v ? 'active' : ''}`} onClick={() => setView(v)}
              style={{ borderBottom: view === v ? '2px solid var(--primary)' : '2px solid transparent', paddingBottom: 8 }}>
              {v === 'pipeline' ? '🗂 Candidate Pipeline' : '💼 Job Openings'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-secondary" onClick={exportCurrentView}><Download size={15} /> Export CSV</button>
          {canManageRecruitment && view === 'pipeline' && <button className="btn btn-primary" onClick={() => setAddCandModal(true)}><Plus size={15} /> Add Candidate</button>}
          {canManageRecruitment && view === 'jobs' && <button className="btn btn-primary" onClick={() => setAddJobModal(true)}><Plus size={15} /> Post Job</button>}
        </div>
      </div>

      {view === 'pipeline' && (
        <>
          {/* Filters */}
          <div className="filter-row">
            <div className="search-wrap" style={{ flex: 1, maxWidth: 300 }}>
              <Search size={15} />
              <input className="input search-input" placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} style={{ height: 38 }} />
            </div>
            <select className="select" value={deptFilter} onChange={e => setDeptFilter(e.target.value)} style={{ height: 38, width: 150 }}>
              {DEPTS.map(d => <option key={d}>{d}</option>)}
            </select>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filteredCandidates.length} candidates</span>
          </div>

          {/* Kanban board */}
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${STAGES.length}, minmax(180px, 1fr))`, gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
            {STAGES.map(stage => {
              const cards = filteredCandidates.filter(c => c.stage === stage.key);
              return (
                <div key={stage.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '6px 12px', borderRadius: 20, background: stage.bg }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                    <span style={{ fontWeight: 700, fontSize: '0.78rem', color: stage.color }}>{stage.label}</span>
                    <span style={{ marginLeft: 'auto', fontWeight: 700, fontSize: '0.75rem', color: stage.color }}>{cards.length}</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {cards.map(c => (
                      <div key={c.id} className="card" style={{ padding: '14px', cursor: 'pointer' }} onClick={() => setSelectedCandidate(c)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                          <div className="avatar avatar-sm" style={{ flexShrink: 0 }}>{c.avatar}</div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '0.8rem' }} className="truncate">{c.name}</div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }} className="truncate">{c.position}</div>
                          </div>
                        </div>
                        {c.score !== undefined && (
                          <div style={{ marginBottom: 10 }}>
                            <div className="progress">
                              <div className="progress-bar" style={{ width: `${c.score}%`, background: c.score >= 80 ? '#22c55e' : c.score >= 60 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 4 }}>Score: {c.score}/100</div>
                          </div>
                        )}
                        {canManageRecruitment && !['hired', 'rejected'].includes(c.stage) && (
                          <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                            {STAGE_NEXT[c.stage] && (
                              <button className="btn btn-primary btn-sm" style={{ flex: 1, fontSize: '0.7rem', padding: '4px 8px' }} onClick={() => advanceStage(c.id)}>
                                <ChevronRight size={12} /> Advance
                              </button>
                            )}
                            <button className="btn btn-danger btn-sm" style={{ padding: '4px 8px' }} onClick={() => rejectCandidate(c.id)}>
                              <XCircle size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {cards.length === 0 && (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.75rem', border: '2px dashed var(--border)', borderRadius: 10 }}>
                        No candidates
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {view === 'jobs' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {jobs.map(job => (
            <div key={job.id} className="card" style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, border: '1px solid var(--primary)' }}>
                <Briefcase size={20} color="var(--primary)" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{job.title}</span>
                  <span className={`badge ${statusStyle(job.status)}`} style={{ fontSize: '0.65rem' }}>{job.status}</span>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    job.department,
                    typeLabel(job.type),
                    `📍 ${job.location}`,
                    `${job.openings} opening${job.openings > 1 ? 's' : ''}`,
                    `Posted ${job.posted}`,
                  ].map((item, i) => (
                    <span key={i} style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{item}</span>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {candidates.filter(c => c.position === job.title && !['hired', 'rejected'].includes(c.stage)).length} active
                </span>
                {canManageRecruitment && <button className="btn btn-secondary btn-sm"
                  onClick={async () => {
                    const nextStatus = job.status === 'active' ? 'paused' : 'active';
                    await api.put(`/jobs/${job.id}`, { ...job, status: nextStatus });
                    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: nextStatus } : j));
                  }}>
                  {job.status === 'active' ? 'Pause' : 'Activate'}
                </button>}
                {canManageRecruitment && <button className="btn btn-danger btn-sm"
                  onClick={async () => { 
                    await api.put(`/jobs/${job.id}`, { ...job, status: 'closed' });
                    setJobs(prev => prev.map(j => j.id === job.id ? { ...j, status: 'closed' } : j)); 
                    toast.info('Job closed', job.title); 
                  }}>
                  Close
                </button>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Candidate detail modal */}
      {selectedCandidate && (
        <div className="modal-overlay" onClick={() => setSelectedCandidate(null)}>
          <div className="modal" style={{ maxWidth: 500 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="avatar avatar-lg">{selectedCandidate.avatar}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedCandidate.name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedCandidate.position}</div>
                </div>
              </div>
              <button className="btn btn-ghost btn-icon" onClick={() => setSelectedCandidate(null)}><X size={18} /></button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                {[
                  { icon: <Mail size={14} />, label: 'Email', value: selectedCandidate.email },
                  { icon: <Phone size={14} />, label: 'Phone', value: selectedCandidate.phone },
                  { icon: <Briefcase size={14} />, label: 'Department', value: selectedCandidate.department },
                  { icon: <Clock size={14} />, label: 'Applied', value: selectedCandidate.appliedDate },
                ].map(f => (
                  <div key={f.label} style={{ padding: '10px 14px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, color: 'var(--text-muted)' }}>{f.icon}<span style={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{f.label}</span></div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 500 }}>{f.value}</div>
                  </div>
                ))}
              </div>
              {selectedCandidate.score !== undefined && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Candidate Score</span>
                    <span style={{ fontWeight: 700, color: selectedCandidate.score >= 80 ? '#22c55e' : selectedCandidate.score >= 60 ? '#f59e0b' : '#ef4444' }}>
                      {selectedCandidate.score}/100
                    </span>
                  </div>
                  <div className="progress" style={{ height: 8 }}>
                    <div className="progress-bar" style={{ width: `${selectedCandidate.score}%`, background: selectedCandidate.score >= 80 ? '#22c55e' : selectedCandidate.score >= 60 ? '#f59e0b' : '#ef4444' }} />
                  </div>
                </div>
              )}
              {selectedCandidate.note && (
                <div className="alert alert-info" style={{ fontSize: '0.8rem' }}>{selectedCandidate.note}</div>
              )}
              <div style={{ marginTop: 14 }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Stage</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {STAGES.map(s => (
                    <span key={s.key} style={{ padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: s.key === selectedCandidate.stage ? s.bg : 'var(--bg)', color: s.key === selectedCandidate.stage ? s.color : 'var(--text-muted)',
                      border: `1px solid ${s.key === selectedCandidate.stage ? s.color : 'var(--border)'}` }}>
                      {s.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCandidate(null)}>Close</button>
              {canManageRecruitment && STAGE_NEXT[selectedCandidate.stage] && (
                <button className="btn btn-primary" onClick={() => { advanceStage(selectedCandidate.id); setSelectedCandidate(null); }}>
                  <ChevronRight size={14} /> Advance to {STAGE_NEXT[selectedCandidate.stage]}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Job modal */}
      {addJobModal && (
        <div className="modal-overlay" onClick={() => setAddJobModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Post New Job</h3><button className="btn btn-ghost btn-icon" onClick={() => setAddJobModal(false)}><X size={18} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="form-group"><label className="form-label">Job Title *</label><input className="input" value={jobForm.title} onChange={e => setJobForm(f => ({ ...f, title: e.target.value }))} placeholder="Senior Backend Engineer" /></div>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group"><label className="form-label">Department</label>
                    <select className="select" value={jobForm.department} onChange={e => setJobForm(f => ({ ...f, department: e.target.value }))}>
                      {['Engineering', 'Design', 'Sales', 'Content', 'HR', 'Finance', 'Marketing'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="select" value={jobForm.type} onChange={e => setJobForm(f => ({ ...f, type: e.target.value as any }))}>
                      <option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option>
                    </select>
                  </div>
                </div>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group"><label className="form-label">Location *</label><input className="input" value={jobForm.location} onChange={e => setJobForm(f => ({ ...f, location: e.target.value }))} placeholder="Bangalore / Remote" /></div>
                  <div className="form-group"><label className="form-label">Openings</label><input className="input" type="number" min={1} value={jobForm.openings} onChange={e => setJobForm(f => ({ ...f, openings: Number(e.target.value) }))} /></div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAddJobModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addJob} disabled={!jobForm.title || !jobForm.location}><Plus size={14} /> Post Job</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Candidate modal */}
      {addCandModal && (
        <div className="modal-overlay" onClick={() => setAddCandModal(false)}>
          <div className="modal" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Candidate</h3><button className="btn btn-ghost btn-icon" onClick={() => setAddCandModal(false)}><X size={18} /></button></div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group"><label className="form-label">Full Name *</label><input className="input" value={candForm.name} onChange={e => setCandForm(f => ({ ...f, name: e.target.value }))} placeholder="Aditya Verma" /></div>
                  <div className="form-group"><label className="form-label">Email *</label><input className="input" type="email" value={candForm.email} onChange={e => setCandForm(f => ({ ...f, email: e.target.value }))} placeholder="aditya@email.com" /></div>
                </div>
                <div className="grid-2" style={{ gap: 14 }}>
                  <div className="form-group"><label className="form-label">Phone</label><input className="input" value={candForm.phone} onChange={e => setCandForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98700 00000" /></div>
                  <div className="form-group"><label className="form-label">Department</label>
                    <select className="select" value={candForm.department} onChange={e => setCandForm(f => ({ ...f, department: e.target.value }))}>
                      {['Engineering', 'Design', 'Sales', 'Content', 'HR', 'Finance', 'Marketing'].map(d => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Position Applied *</label><input className="input" value={candForm.position} onChange={e => setCandForm(f => ({ ...f, position: e.target.value }))} placeholder="Senior Backend Engineer" /></div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setAddCandModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addCandidate} disabled={!candForm.name || !candForm.email || !candForm.position}><Plus size={14} /> Add Candidate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
