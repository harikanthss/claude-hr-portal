import { PageLoader } from '../components/ui/SkeletonLoader';
import React, { useState, useEffect } from 'react';
import { downloadCSV } from '../utils/exportCSV';
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


// ===================== LEADERBOARD =====================
export default function LeaderboardPage() {
  const [ranked, setRanked] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/leaderboard').then(d => { setRanked(Array.isArray(d) ? d : []); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  if (loading) return <PageLoader />;

  const top3 = [ranked[1], ranked[0], ranked[2]].filter(Boolean);
  const podiumOrder = [{ h:140, medal:'🥈', bg:'linear-gradient(135deg,#94a3b8,#64748b)' }, { h:170, medal:'🥇', bg:'linear-gradient(135deg,#fbbf24,#d97706)' }, { h:120, medal:'🥉', bg:'linear-gradient(135deg,#cd7c3b,#a16207)' }];

  return (
    <div className="animate-fade">
      <div style={{ display:'flex', justifyContent:'flex-end', marginBottom:16 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => downloadCSV('leaderboard', ranked.map(e => ({ Rank:e.rank, Name:e.name, Department:e.department, Points:e.points, Streak:e.streak, Performance:e.performance, Badges:e.badges?.join(', ') })))}>⬇ Export CSV</button>
      </div>
      {/* Podium */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.1fr 1fr', gap:16, marginBottom:28 }}>
        {top3.map((emp, idx) => {
          if (!emp) return <div key={idx}/>;
          const conf = podiumOrder[idx];
          return (
            <div key={emp.id} className="card p-6" style={{ textAlign:'center', borderTop:`4px solid ${idx===1?'#fbbf24':idx===0?'#94a3b8':'#cd7c3b'}` }}>
              <div style={{ fontSize:'2rem', marginBottom:8 }}>{conf.medal}</div>
              <div className="avatar avatar-lg" style={{ margin:'0 auto 12px' }}>{emp.avatar}</div>
              <div style={{ fontWeight:700, marginBottom:4 }}>{emp.name}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:12 }}>{emp.department}</div>
              <div style={{ fontSize:'1.5rem', fontWeight:800, color:'var(--primary)', marginBottom:8 }}>{(emp.points||0).toLocaleString()}</div>
              <div style={{ fontSize:'0.75rem', color:'var(--text-muted)', marginBottom:12 }}>🔥 {emp.streak||0} day streak</div>
              <div style={{ display:'flex', gap:4, justifyContent:'center', flexWrap:'wrap' }}>
                {(emp.badges||[]).slice(0,3).map((bid: string) => {
                  const b = BADGES_MAP[bid];
                  return b ? <span key={bid} title={b.name} style={{ fontSize:'1.1rem' }}>{b.icon}</span> : null;
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Ranking Table */}
      <div className="card">
        <div style={{ overflowX:'auto' }}>
          <table className="table">
            <thead>
              <tr>
                <th>Rank</th><th>Employee</th><th>Department</th>
                <th>Points</th><th>Streak</th><th>Badges</th><th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((emp: any, i: number) => (
                <tr key={emp.id}>
                  <td>
                    <div style={{ width:28, height:28, borderRadius:'50%', background:i===0?'#fbbf24':i===1?'#94a3b8':i===2?'#cd7c3b':'var(--border)', color:i<3?'white':'var(--text-muted)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:800 }}>{i+1}</div>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div className="avatar avatar-sm">{emp.avatar}</div>
                      <div>
                        <div style={{ fontWeight:600, fontSize:'0.875rem' }}>{emp.name}</div>
                        <div style={{ fontSize:'0.7rem', color:'var(--text-muted)' }}>{emp.position}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="chip">{emp.department}</span></td>
                  <td style={{ fontWeight:700, color:'var(--primary)', fontSize:'1rem' }}>{(emp.points||0).toLocaleString()}</td>
                  <td><div style={{ display:'flex', alignItems:'center', gap:4 }}>🔥 <span style={{ fontWeight:600 }}>{emp.streak||0}</span></div></td>
                  <td>
                    <div style={{ display:'flex', gap:4 }}>
                      {(emp.badges||[]).slice(0,4).map((bid: string) => {
                        const b = BADGES_MAP[bid];
                        return b ? <span key={bid} title={b.name} style={{ fontSize:'1rem' }}>{b.icon}</span> : null;
                      })}
                    </div>
                  </td>
                  <td>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div className="progress" style={{ width:60 }}><div className="progress-bar progress-green" style={{ width:`${emp.performance||0}%` }}/></div>
                      <span style={{ fontSize:'0.8rem', fontWeight:600 }}>{emp.performance||0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}