import { PageLoader } from '../components/ui/SkeletonLoader';
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


// ===================== AI INSIGHTS PAGE =====================
export default function AIPage() {
  const [insights, setInsights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInsights = () => {
    setLoading(true);
    api.get('/ai/insights').then(d => { setInsights(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchInsights(); }, []);

  const stats = {
    high: insights.filter(i => i.severity === 'high').length,
    medium: insights.filter(i => i.severity === 'medium').length,
    low: insights.filter(i => i.severity === 'low').length,
  };

  return (
    <div className="animate-fade">
      <div className="grid-3 mb-6">
        <div className="card" style={{ padding:'20px 24px', borderLeft:'3px solid #ef4444' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#ef4444', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>High Severity</div>
          <div style={{ fontSize:'2rem', fontWeight:800, color:'#ef4444' }}>{stats.high}</div>
        </div>
        <div className="card" style={{ padding:'20px 24px', borderLeft:'3px solid #f59e0b' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Medium Severity</div>
          <div style={{ fontSize:'2rem', fontWeight:800, color:'#f59e0b' }}>{stats.medium}</div>
        </div>
        <div className="card" style={{ padding:'20px 24px', borderLeft:'3px solid #22c55e' }}>
          <div style={{ fontSize:'0.75rem', fontWeight:600, color:'#22c55e', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>Low / Info</div>
          <div style={{ fontSize:'2rem', fontWeight:800, color:'#22c55e' }}>{stats.low}</div>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <h3>Active Insights {!loading && <span className="badge badge-purple" style={{ marginLeft:8 }}>{insights.length} total</span>}</h3>
        <button className="btn btn-secondary btn-sm" onClick={fetchInsights} disabled={loading}>
          <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }}/> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign:'center', padding:40, color:'var(--text-muted)' }}>Analyzing live data...</div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
          {insights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} onDismiss={id => setInsights(prev => prev.filter(i => i.id !== id))} />
          ))}
          {insights.length === 0 && (
            <div className="card" style={{ gridColumn:'1/-1' }}>
              <div className="empty-state"><Zap size={32}/><h3>All clear!</h3><p>No active insights. The AI is monitoring your team.</p></div>
            </div>
          )}
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}