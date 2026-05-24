import React, { useState } from 'react';
import { useStore } from '../services/store';
import { Users, ChevronDown, ChevronRight, Building2 } from 'lucide-react';

interface OrgNode {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  children: OrgNode[];
}

export default function OrgChartPage() {
  const { employees } = useStore();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['root']));

  // Build org tree from live employee data
  const managers = employees.filter(e => !e.managerId || e.managerId === null || e.managerId === '');
  const subordinates = employees.filter(e => e.managerId && e.managerId !== '');

  const buildTree = (emp: any): OrgNode => ({
    id: emp.id,
    name: emp.name,
    position: emp.position,
    department: emp.department,
    avatar: emp.avatar,
    children: subordinates.filter(s => s.managerId === emp.id).map(buildTree),
  });

  const roots: OrgNode[] = managers.map(buildTree);

  // Compute dept counts from live data
  const deptMap: Record<string, number> = {};
  employees.forEach(e => { deptMap[e.department] = (deptMap[e.department] || 0) + 1; });
  const deptCounts = Object.entries(deptMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);

  const DEPT_COLORS: Record<string, string> = {
    Engineering: '#3b82f6', Design: '#8b5cf6', Sales: '#22c55e',
    HR: '#f59e0b', Finance: '#ef4444', Marketing: '#06b6d4',
    Operations: '#f97316', Content: '#84cc16',
  };

  const toggle = (id: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const OrgCard = ({ node, depth = 0 }: { node: OrgNode; depth?: number }) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children.length > 0;
    const color = DEPT_COLORS[node.department] || '#64748b';

    return (
      <div style={{ marginLeft: depth > 0 ? Math.min(40, 20) : 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0, position: 'relative' }}>
          {depth > 0 && (
            <div style={{ width: 32, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8, paddingTop: 20, flexShrink: 0 }}>
              <div style={{ width: 24, height: 1, background: 'var(--border)' }} />
            </div>
          )}
          <div
            className="card"
            style={{
              padding: '14px 18px',
              marginBottom: 10,
              flex: 1,
              borderLeft: `3px solid ${color}`,
              cursor: hasChildren ? 'pointer' : 'default',
              transition: 'all 200ms',
            }}
            onClick={() => hasChildren && toggle(node.id)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                className="avatar"
                style={{ background: `linear-gradient(135deg, ${color}88, ${color})` }}
              >
                {node.avatar}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{node.name}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{node.position}</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ padding: '3px 8px', borderRadius: 20, background: `${color}18`, color, fontSize: '0.7rem', fontWeight: 600 }}>
                  {node.department}
                </span>
                {hasChildren && (
                  <div style={{ color: 'var(--text-muted)' }}>
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>
                )}
              </div>
            </div>
            {hasChildren && (
              <div style={{ marginTop: 6, fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {node.children.length} direct report{node.children.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {isExpanded && hasChildren && (
          <div style={{ borderLeft: '1px dashed var(--border)', marginLeft: depth > 0 ? 48 : 16, paddingLeft: 0 }}>
            {node.children.map(child => (
              <OrgCard key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="animate-fade">
      {/* Department Summary */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 28 }}>
        {deptCounts.map(dept => (
          <div key={dept.name} className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, borderTop: `3px solid ${DEPT_COLORS[dept.name] || '#64748b'}` }}>
            <Building2 size={16} color={DEPT_COLORS[dept.name] || '#64748b'} />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{dept.count}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{dept.name}</div>
            </div>
          </div>
        ))}
        <div className="card" style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 10, borderTop: '3px solid var(--primary)' }}>
          <Users size={16} color="var(--primary)" />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{employees.length}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Total</div>
          </div>
        </div>
      </div>

      {/* Org Tree */}
      <div style={{ marginBottom:16, fontSize:'0.8rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:6 }}>
        ℹ️ Tap a card to expand/collapse direct reports
      </div>
      <div className="card p-6" style={{ overflowX:'auto' }}>
        <h3 style={{ marginBottom: 20 }}>Company Hierarchy</h3>
        {roots.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
            No employees found
          </div>
        ) : (
          roots.map(root => <OrgCard key={root.id} node={root} />)
        )}
      </div>
    </div>
  );
}
