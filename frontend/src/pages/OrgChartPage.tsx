import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Users, ChevronDown, ChevronRight, Building2 } from 'lucide-react';
import { DEPARTMENT_STATS } from '../data/mockData';

type OrgNode = {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  level: number;
  children?: OrgNode[];
};

const ORG_TREE: OrgNode = {
  id: 'ceo', name: 'Vikram Anand', position: 'Chief Executive Officer', department: 'Executive', avatar: 'VA', level: 0,
  children: [
    {
      id: 'cto', name: 'Karthik Rajan', position: 'Chief Technology Officer', department: 'Engineering', avatar: 'KR', level: 1,
      children: [
        { id: 'e1', name: 'Kiran Patel',   position: 'Backend Developer', department: 'Engineering', avatar: 'KP', level: 2 },
        { id: 'e5', name: 'Arjun Mehta',   position: 'Frontend Developer', department: 'Engineering', avatar: 'AM', level: 2 },
        { id: 'e9', name: 'Vikram Joshi',  position: 'DevOps Engineer',    department: 'Engineering', avatar: 'VJ', level: 2 },
      ],
    },
    {
      id: 'cmo', name: 'Preethi Nair', position: 'Chief Marketing Officer', department: 'Marketing', avatar: 'PN', level: 1,
      children: [
        { id: 'e8', name: 'Ananya Singh', position: 'Marketing Specialist', department: 'Marketing', avatar: 'AS', level: 2 },
        { id: 'e2', name: 'Sneha Rao',    position: 'Content Lead',         department: 'Content',   avatar: 'SR', level: 2 },
      ],
    },
    {
      id: 'vps', name: 'Ravi Nair', position: 'VP of Sales', department: 'Sales', avatar: 'RN', level: 1,
      children: [
        { id: 'e11', name: 'Suresh Pillai', position: 'Sales Executive', department: 'Sales', avatar: 'SP', level: 2 },
      ],
    },
    {
      id: 'hrd', name: 'Divya Kumar', position: 'HR Manager', department: 'HR', avatar: 'DK', level: 1,
      children: [
        { id: 'e6', name: 'Divya Kumar',  position: 'HR Executive',         department: 'HR',      avatar: 'DK', level: 2 },
        { id: 'e7', name: 'Rahul Gupta',  position: 'Financial Analyst',    department: 'Finance',  avatar: 'RG', level: 2 },
        { id: 'e10',name: 'Meera Iyer',   position: 'Operations Manager',   department: 'Operations',avatar:'MI', level: 2 },
      ],
    },
    {
      id: 'vpd', name: 'Priya Kapoor', position: 'VP of Design', department: 'Design', avatar: 'PK', level: 1,
      children: [
        { id: 'e4',  name: 'Priya Sharma', position: 'UI/UX Designer',   department: 'Design', avatar: 'PS', level: 2 },
        { id: 'e12', name: 'Pooja Reddy',  position: 'Product Designer', department: 'Design', avatar: 'PR', level: 2 },
      ],
    },
  ],
};

const LEVEL_COLORS: Record<number, { bg: string; border: string; text: string; shadow: string }> = {
  0: { bg: 'linear-gradient(135deg, #0f2b18, #1a4a28)', border: '#22c55e', text: '#4ade80', shadow: '0 8px 32px rgba(34,197,94,0.3)' },
  1: { bg: 'linear-gradient(135deg, #1e3a5f, #1d4ed8)', border: '#3b82f6', text: '#60a5fa', shadow: '0 4px 16px rgba(59,130,246,0.2)' },
  2: { bg: 'var(--bg-card)', border: 'var(--border)', text: 'var(--text-secondary)', shadow: 'var(--shadow-sm)' },
};

function OrgCard({ node, isLast }: { node: OrgNode; isLast: boolean }) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  const c = LEVEL_COLORS[Math.min(node.level, 2)];
  const isRoot = node.level === 0;
  const isMid = node.level === 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Card */}
      <div
        style={{
          background: c.bg,
          border: `1.5px solid ${c.border}`,
          borderRadius: 14,
          padding: '16px 20px',
          boxShadow: c.shadow,
          minWidth: isRoot ? 200 : isMid ? 160 : 140,
          maxWidth: isRoot ? 220 : 180,
          textAlign: 'center',
          position: 'relative',
          cursor: hasChildren ? 'pointer' : 'default',
          transition: 'all 200ms',
          userSelect: 'none',
        }}
        onClick={() => hasChildren && setExpanded(v => !v)}
      >
        <div
          className="avatar"
          style={{
            margin: '0 auto 10px',
            width: isRoot ? 52 : isMid ? 40 : 32,
            height: isRoot ? 52 : isMid ? 40 : 32,
            fontSize: isRoot ? '1.1rem' : isMid ? '0.875rem' : '0.7rem',
            borderRadius: isRoot ? 14 : 10,
            background: isRoot ? 'linear-gradient(135deg, #22c55e, #16a34a)' : isMid ? 'linear-gradient(135deg, #60a5fa, #3b82f6)' : 'linear-gradient(135deg, #6ee7b7, #22c55e)',
          }}
        >
          {node.avatar}
        </div>
        <div style={{ fontWeight: 700, fontSize: isRoot ? '0.9rem' : '0.8rem', color: isRoot || isMid ? 'white' : 'var(--text-primary)', marginBottom: 2, lineHeight: 1.3 }}>
          {node.name}
        </div>
        <div style={{ fontSize: '0.7rem', color: isRoot ? '#4ade80' : isMid ? '#93c5fd' : 'var(--text-muted)', lineHeight: 1.3 }}>
          {node.position}
        </div>
        {hasChildren && (
          <div style={{
            position: 'absolute', bottom: -12, left: '50%', transform: 'translateX(-50%)',
            width: 22, height: 22, borderRadius: '50%',
            background: 'var(--bg-card)', border: '1.5px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--primary)', zIndex: 2, boxShadow: 'var(--shadow-sm)',
          }}>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
          </div>
        )}
      </div>

      {/* Connector + children */}
      {hasChildren && expanded && (
        <>
          {/* Vertical line down */}
          <div style={{ width: 2, height: 28, background: 'var(--border)', marginTop: 12 }} />
          {/* Horizontal bar */}
          {node.children!.length > 1 && (
            <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: `calc(100% - 80px)`,
                height: 2,
                background: 'var(--border)',
              }} />
            </div>
          )}
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', paddingTop: node.children!.length > 1 ? 0 : 0 }}>
            {node.children!.map((child, idx) => (
              <div key={child.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                {/* Vertical line up to horizontal bar */}
                <div style={{ width: 2, height: 20, background: 'var(--border)' }} />
                <OrgCard node={child} isLast={idx === node.children!.length - 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function OrgChartPage() {
  const { employees } = useStore();

  const deptCounts = DEPARTMENT_STATS.map(d => ({
    name: d.name,
    count: d.employees,
    avg: d.avgPerformance,
    att: d.attendance,
  }));

  const deptColors: Record<string, string> = {
    Engineering: '#3b82f6', Sales: '#22c55e', Design: '#8b5cf6',
    Content: '#f59e0b', HR: '#ec4899', Finance: '#06b6d4',
    Marketing: '#f97316', Operations: '#94a3b8',
  };

  return (
    <div className="animate-fade">
      {/* Dept summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {deptCounts.map(d => (
          <div key={d.name} className="card" style={{
            padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10,
            borderLeft: `3px solid ${deptColors[d.name] || '#94a3b8'}`,
          }}>
            <Building2 size={16} color={deptColors[d.name] || '#94a3b8'} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.8rem' }}>{d.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{d.count} member{d.count !== 1 ? 's' : ''} · {d.avg}% perf</div>
            </div>
          </div>
        ))}
      </div>

      {/* Org tree */}
      <div className="card" style={{ padding: '40px 24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 900 }}>
          <OrgCard node={ORG_TREE} isLast={true} />
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 20, marginTop: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'Executive (C-Level)', color: '#22c55e', shape: 'circle' },
          { label: 'VP / Director', color: '#3b82f6', shape: 'circle' },
          { label: 'Individual Contributor', color: 'var(--border)', shape: 'circle' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }} />
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
