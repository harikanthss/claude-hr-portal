import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  suffix?: string;
  loading?: boolean;
}

function useCountUp(target: number, duration = 900) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

export default function StatCard({ label, value, change, changeLabel, icon, iconBg, iconColor, suffix, loading }: StatCardProps) {
  const isNumeric = typeof value === 'number';
  const animated = useCountUp(isNumeric ? (value as number) : 0);

  if (loading) {
    return (
      <div className="card stat-card">
        <div className="skeleton" style={{ height: 14, width: '60%', marginBottom: 12 }} />
        <div className="skeleton" style={{ height: 28, width: '40%', marginBottom: 8 }} />
        <div className="skeleton" style={{ height: 12, width: '50%' }} />
      </div>
    );
  }

  const isPositive = change !== undefined && change > 0;
  const isNegative = change !== undefined && change < 0;

  return (
    <div className="card stat-card animate-fade" style={{ cursor: 'default' }}>
      <div className="stat-icon" style={{ background: iconBg, color: iconColor }}>
        {icon}
      </div>
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{ color: 'var(--text-primary)' }}>
        {isNumeric ? animated : value}
        {suffix && <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)' }}>{suffix}</span>}
      </div>
      {change !== undefined && (
        <div className="stat-change" style={{ color: isPositive ? '#16a34a' : isNegative ? '#dc2626' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {isPositive ? <TrendingUp size={12} /> : isNegative ? <TrendingDown size={12} /> : <Minus size={12} />}
          {Math.abs(change)}% {changeLabel || 'vs last month'}
        </div>
      )}
    </div>
  );
}
