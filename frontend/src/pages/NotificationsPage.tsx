import { useRealTimeNotifications } from '../hooks/useRealTimeNotifications';
import React, { useState, useEffect } from 'react';
import { useStore, api } from '../services/store';
import AIInsightCard from '../components/ai/AIInsightCard';
import StatCard from '../components/ui/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Bell, Download, FileText, Zap, Trophy, User, Mail, Phone, MapPin, Edit2, Check, X, Shield, RefreshCw, Lock } from 'lucide-react';

const BADGES_MAP: Record<string, any> = {
  perfect_attendance: { name: 'Perfect Attendance', icon: '🏆', color: '#22c55e' },
  top_performer: { name: 'Top Performer', icon: '⭐', color: '#f59e0b' },
  team_player: { name: 'Team Player', icon: '🤝', color: '#3b82f6' },
  streak_master: { name: 'Streak Master', icon: '🔥', color: '#ef4444' },
  early_bird: { name: 'Early Bird', icon: '🌅', color: '#8b5cf6' },
  mentor: { name: 'Mentor', icon: '🎓', color: '#06b6d4' },
};


// ===================== NOTIFICATIONS =====================
export default function NotificationsPage() {
  const { notifications, markNotificationRead, markAllRead } = useStore();
  useRealTimeNotifications(); // polls every 30s
  const unread = notifications.filter((n: any) => !n.read && !n.isRead).length;

  const typeIcon: Record<string, React.ReactNode> = {
    info: <Bell size={16} color="#3b82f6" />,
    success: <Check size={16} color="#22c55e" />,
    warning: <Bell size={16} color="#f59e0b" />,
    error: <Bell size={16} color="#ef4444" />,
  };
  const typeBg: Record<string, string> = {
    info:'#dbeafe', success:'#dcfce7', warning:'#fef9c3', error:'#fee2e2'
  };

  return (
    <div className="animate-fade">
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
        <span className="badge badge-red">{unread} unread</span>
        {unread > 0 && <button className="btn btn-secondary btn-sm" onClick={markAllRead}><Check size={14}/> Mark all read</button>}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {notifications.map((n: any) => (
          <div key={n.id} className="card" style={{ padding:'16px 20px', display:'flex', alignItems:'flex-start', gap:14, cursor:'pointer', opacity:n.read||n.isRead?0.65:1, borderLeft:`3px solid ${n.type==='error'?'#ef4444':n.type==='warning'?'#f59e0b':n.type==='success'?'#22c55e':'#3b82f6'}`, transition:'opacity 200ms' }} onClick={()=>markNotificationRead(n.id)}>
            <div style={{ width:36, height:36, borderRadius:10, background:typeBg[n.type]||'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              {typeIcon[n.type]}
            </div>
            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ fontWeight:600, fontSize:'0.875rem' }}>{n.title}</span>
                <span style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{new Date(n.time||n.timestamp).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
              </div>
              <p style={{ fontSize:'0.8rem', color:'var(--text-secondary)', lineHeight:1.5 }}>{n.message}</p>
            </div>
            {!n.read && !n.isRead && <div style={{ width:8, height:8, borderRadius:'50%', background:'#3b82f6', flexShrink:0, marginTop:4 }}/>}
          </div>
        ))}
        {notifications.length === 0 && (
          <div className="card p-6" style={{ textAlign:'center', color:'var(--text-muted)' }}>
            <Bell size={32} style={{ marginBottom:8 }}/><br/>No notifications yet.
          </div>
        )}
      </div>
    </div>
  );
}