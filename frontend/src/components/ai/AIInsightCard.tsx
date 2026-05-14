import React, { useState } from 'react';
import { AIInsight } from '../../types';
import { Zap, AlertTriangle, TrendingUp, Users, Lightbulb, ChevronDown, ChevronUp, X } from 'lucide-react';

interface AIInsightCardProps {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
}

const TYPE_CONFIG = {
  burnout: { icon: <AlertTriangle size={16} />, color: '#ef4444', bg: '#fee2e2', label: 'Burnout Risk' },
  performance: { icon: <TrendingUp size={16} />, color: '#22c55e', bg: '#dcfce7', label: 'Performance' },
  attendance: { icon: <Users size={16} />, color: '#f59e0b', bg: '#fef9c3', label: 'Attendance' },
  productivity: { icon: <Zap size={16} />, color: '#3b82f6', bg: '#dbeafe', label: 'Productivity' },
  suggestion: { icon: <Lightbulb size={16} />, color: '#8b5cf6', bg: '#f3e8ff', label: 'Suggestion' },
};

const SEVERITY_COLOR = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

export default function AIInsightCard({ insight, onDismiss }: AIInsightCardProps) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[insight.type];

  return (
    <div className="card animate-fade" style={{
      padding: '16px 20px',
      borderLeft: `3px solid ${cfg.color}`,
      position: 'relative',
    }}>
      {onDismiss && (
        <button
          onClick={() => onDismiss(insight.id)}
          style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
        >
          <X size={14} />
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: cfg.bg,
          color: cfg.color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}>
          {cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
            <span className="badge" style={{ background: cfg.bg, color: cfg.color, fontSize: '0.65rem' }}>
              {cfg.label}
            </span>
            <span className="badge" style={{
              background: `${SEVERITY_COLOR[insight.severity]}15`,
              color: SEVERITY_COLOR[insight.severity],
              fontSize: '0.65rem',
            }}>
              {insight.severity.toUpperCase()} SEVERITY
            </span>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
              {insight.confidence}% confidence
            </span>
          </div>

          <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: 4 }}>{insight.title}</h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            {insight.description}
          </p>

          {expanded && (
            <div className="alert alert-info" style={{ marginTop: 10 }}>
              <Lightbulb size={14} style={{ flexShrink: 0, marginTop: 1 }} />
              <span style={{ fontSize: '0.8rem' }}><strong>Recommendation:</strong> {insight.recommendation}</span>
            </div>
          )}

          <button
            onClick={() => setExpanded(v => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: cfg.color,
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: 0,
            }}
          >
            {expanded ? 'Hide recommendation' : 'View recommendation'}
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>
    </div>
  );
}
