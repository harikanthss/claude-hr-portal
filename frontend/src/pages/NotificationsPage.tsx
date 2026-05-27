import React, { useState, useEffect } from 'react';
import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import { useStore, api } from '../services/store';
import { Bell, Check, X, Trash2 } from 'lucide-react';
import { toast } from '../components/ui/Toast';

export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllRead } = useStore();
  useRealTimeNotifications();

  // localNotifs syncs with store on every poll
  const [localNotifs, setLocalNotifs] = useState<any[]>(notifications);
  useEffect(() => { setLocalNotifs(notifications); }, [notifications]);

  const unread = localNotifs.filter((n: any) => !n.read && !n.isRead).length;

  const deleteNotif = async (id: string) => {
    try {
      await api.del(`/notifications/${id}`);
      setLocalNotifs(prev => prev.filter((n: any) => n.id !== id));
    } catch { toast.error('Failed', 'Could not delete notification.'); }
  };

  const clearRead = async () => {
    try {
      await api.del('/notifications');
      setLocalNotifs(prev => prev.filter((n: any) => !n.read && !n.isRead));
      toast.success('Cleared', 'Read notifications removed.');
    } catch {}
  };

  const typeIcon: Record<string, string> = {
    info: 'ℹ️', success: '✅', warning: '⚠️', error: '❌',
  };
  const typeBorder: Record<string, string> = {
    info: '#3b82f6', success: '#22c55e', warning: '#f59e0b', error: '#ef4444',
  };

  return (
    <div className="animate-fade">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <Bell size={20} color="var(--text-muted)"/>
          <span style={{ fontWeight:700, fontSize:'1rem' }}>Notifications</span>
          {unread > 0 && <span className="badge badge-red">{unread} unread</span>}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          {unread > 0 && (
            <button className="btn btn-secondary btn-sm" onClick={() => { markAllRead(); setLocalNotifs(prev => prev.map((n:any) => ({...n, read:true, isRead:true}))); }}>
              <Check size={13}/> Mark all read
            </button>
          )}
          <button className="btn btn-secondary btn-sm" onClick={clearRead} title="Remove all read notifications">
            <Trash2 size={13}/> Clear read
          </button>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {localNotifs.length === 0 ? (
          <div className="card p-6" style={{ textAlign:'center', color:'var(--text-muted)' }}>
            <Bell size={32} style={{ marginBottom:10, opacity:0.3 }}/><br/>
            No notifications yet.
          </div>
        ) : localNotifs.map((n: any) => (
          <div
            key={n.id}
            className="card"
            style={{
              padding:'14px 18px',
              display:'flex', alignItems:'flex-start', gap:14,
              cursor:'pointer',
              opacity: (n.read || n.isRead) ? 0.6 : 1,
              borderLeft: `3px solid ${typeBorder[n.type] || '#3b82f6'}`,
              transition:'opacity 200ms',
            }}
            onClick={() => { markNotificationRead(n.id); setLocalNotifs(prev => prev.map((x:any) => x.id===n.id ? {...x,read:true,isRead:true} : x)); }}
          >
            <div style={{ fontSize:'1.2rem', flexShrink:0, marginTop:2 }}>{typeIcon[n.type] || 'ℹ️'}</div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:'0.875rem' }}>{n.title}</span>
                <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>
                  {n.time ? new Date(n.time).toLocaleString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : ''}
                </span>
              </div>
              <p style={{ fontSize:'0.82rem', color:'var(--text-secondary)', lineHeight:1.5, margin:0 }}>{n.message}</p>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
              {!n.read && !n.isRead && <div style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6' }}/>}
              <button
                onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', padding:'2px 4px', borderRadius:4, opacity:0, fontSize:'0.85rem' }}
                onMouseEnter={e => (e.currentTarget.style.opacity='1')}
                onMouseLeave={e => (e.currentTarget.style.opacity='0')}
                title="Delete"
              >×</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
