import React from 'react';
import { AlertTriangle, Trash2, X, Check } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open, title, message, confirmLabel = 'Confirm', cancelLabel = 'Cancel',
  danger = true, onConfirm, onCancel
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}
      onClick={onCancel}
    >
      <div
        className="card"
        style={{ width:'100%', maxWidth:400, padding:'28px 32px' }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ display:'flex', alignItems:'flex-start', gap:14, marginBottom:20 }}>
          <div style={{
            width:44, height:44, borderRadius:'50%', flexShrink:0,
            background: danger ? '#fee2e2' : '#dbeafe',
            display:'flex', alignItems:'center', justifyContent:'center'
          }}>
            {danger ? <AlertTriangle size={20} color="#dc2626"/> : <AlertTriangle size={20} color="#1d4ed8"/>}
          </div>
          <div>
            <h3 style={{ fontSize:'1rem', marginBottom:6 }}>{title}</h3>
            <p style={{ fontSize:'0.875rem', color:'var(--text-secondary)', lineHeight:1.6 }}>{message}</p>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button className="btn btn-secondary" onClick={onCancel}><X size={14}/> {cancelLabel}</button>
          <button
            className="btn"
            style={{ background: danger ? '#dc2626' : 'var(--primary)', color:'white' }}
            onClick={onConfirm}
          >
            {danger ? <Trash2 size={14}/> : <Check size={14}/>} {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
