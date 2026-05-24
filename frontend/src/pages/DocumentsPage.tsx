import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import { FileText, Upload, Trash2, Download, Search, FolderOpen, X, Plus } from 'lucide-react';
import { toast } from '../components/ui/Toast';

interface Document { id: string; employeeId?: string; name: string; type: string; category: string; filePath: string; fileSize: number; uploadedBy: string; uploadedAt: string; description?: string; }

const CATEGORIES = ['general', 'policy', 'contract', 'id_proof', 'certificate', 'payslip', 'other'];
const CATEGORY_LABELS: Record<string, string> = { general: 'General', policy: 'Policy', contract: 'Contract', id_proof: 'ID Proof', certificate: 'Certificate', payslip: 'Payslip', other: 'Other' };
const CATEGORY_COLORS: Record<string, string> = { general: '#3b82f6', policy: '#8b5cf6', contract: '#22c55e', id_proof: '#f59e0b', certificate: '#ec4899', payslip: '#06b6d4', other: '#64748b' };

export default function DocumentsPage() {
  const { currentUser, employees } = useStore();
  const [docs, setDocs] = useState<Document[]>([]);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [modal, setModal] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [form, setForm] = useState({ category: 'general', description: '', employeeId: '' });

  useEffect(() => {
    api.get('/documents').then(data => { if (Array.isArray(data)) setDocs(data); }).catch(() => {});
  }, []);

  const filtered = docs.filter(d => (catFilter === 'all' || d.category === catFilter) && (search === '' || d.name.toLowerCase().includes(search.toLowerCase())));

  const handleUpload = async () => {
    if (!file) return;
    const maxMB = 10;
    if (file.size > maxMB * 1024 * 1024) {
      alert(`File too large. Maximum size is ${maxMB}MB.`);
      return;
    }
    const allowed = ['pdf','doc','docx','xls','xlsx','png','jpg','jpeg','zip','txt'];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    if (!allowed.includes(ext)) {
      alert(`File type .${ext} is not allowed. Allowed types: ${allowed.join(', ')}`);
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', form.category);
    formData.append('description', form.description);
    if (form.employeeId) formData.append('employeeId', form.employeeId);
    try {
      const newDoc = await api.upload('/documents', formData);
      setDocs(prev => [newDoc, ...prev]);
      setModal(false); setFile(null); setForm({ category: 'general', description: '', employeeId: '' });
      toast.success('Uploaded!', file.name);
    } catch { toast.error('Upload failed', 'Could not upload document.'); }
  };

  const handleDelete = async (id: string) => {
    try { await api.del(`/documents/${id}`); setDocs(prev => prev.filter(d => d.id !== id)); toast.success('Deleted', 'Document removed.'); }
    catch { toast.error('Failed', 'Could not delete.'); }
  };

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1048576 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / 1048576).toFixed(1)} MB`;

  return (
    <div className="animate-fade">
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #3b82f6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Documents</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#3b82f6' }}>{docs.length}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #22c55e' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Categories</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#22c55e' }}>{new Set(docs.map(d => d.category)).size}</div>
        </div>
        <div className="card" style={{ padding: '20px 24px', borderLeft: '3px solid #8b5cf6' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Total Size</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#8b5cf6' }}>{formatSize(docs.reduce((s, d) => s + d.fileSize, 0))}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
          <div style={{ position: 'relative', flex: 1, maxWidth: 300 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input className="form-input" style={{ paddingLeft: 34 }} placeholder="Search documents..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-input" style={{ width: 160 }} value={catFilter} onChange={e => setCatFilter(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>
        <button className="btn btn-primary" onClick={() => setModal(true)}><Upload size={15} /> Upload</button>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr><th>Name</th><th>Category</th><th>Size</th><th>Uploaded</th><th>Actions</th></tr></thead>
          <tbody>
            {filtered.map(doc => (
              <tr key={doc.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <FileText size={18} color={CATEGORY_COLORS[doc.category] || '#64748b'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{doc.name}</div>
                      {doc.description && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{doc.description}</div>}
                    </div>
                  </div>
                </td>
                <td><span className="badge" style={{ background: `${CATEGORY_COLORS[doc.category]}20`, color: CATEGORY_COLORS[doc.category] }}>{CATEGORY_LABELS[doc.category] || doc.category}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{formatSize(doc.fileSize)}</td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={`${(import.meta.env.VITE_API_URL || 'http://localhost:3001/api').replace('/api','')}${doc.filePath}`} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm"><Download size={13} /></a>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleDelete(doc.id)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No documents found</td></tr>}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <div className="modal-header"><h3>Upload Document</h3><button className="btn-icon" onClick={() => setModal(false)}><X size={18} /></button></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '0 24px 24px' }}>
              <div>
                <label className="form-label">File</label>
                <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} style={{ fontSize: '0.85rem' }} />
              </div>
              <div><label className="form-label">Category</label>
                <select className="form-input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
                </select>
              </div>
              {currentUser?.role !== 'employee' && (
                <div><label className="form-label">Assign to Employee (optional)</label>
                  <select className="form-input" value={form.employeeId} onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}>
                    <option value="">Company-wide</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              )}
              <div><label className="form-label">Description</label><input className="form-input" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Brief description" /></div>
              <button className="btn btn-primary" onClick={handleUpload} disabled={!file}><Upload size={15} /> Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
