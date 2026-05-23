import React from 'react';

interface SkeletonProps { width?: string; height?: number; borderRadius?: number; mb?: number; }

export function Skeleton({ width = '100%', height = 14, borderRadius = 4, mb = 8 }: SkeletonProps) {
  return (
    <div className="skeleton" style={{ width, height, borderRadius, marginBottom: mb }} />
  );
}

export function SkeletonCard({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card" style={{ padding: 24 }}>
      <Skeleton width="40%" height={20} mb={16} />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} width={i % 2 === 0 ? '100%' : '75%'} height={14} mb={10} />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
        {Array.from({ length: cols }).map((_, i) => <Skeleton key={i} height={12} mb={0} />)}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 16 }}>
          {Array.from({ length: cols }).map((_, c) => <Skeleton key={c} width={c === 0 ? '80%' : '60%'} height={12} mb={0} />)}
        </div>
      ))}
    </div>
  );
}

export function SkeletonStatCards({ count = 4 }: { count?: number }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, 1fr)`, gap: 16, marginBottom: 24 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <Skeleton width="40px" height={40} borderRadius={10} mb={0} />
            <Skeleton width="60%" height={12} mb={0} />
          </div>
          <Skeleton width="50%" height={28} mb={6} />
          <Skeleton width="35%" height={10} mb={0} />
        </div>
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="animate-fade">
      <SkeletonStatCards count={4} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        <SkeletonCard rows={6} />
        <SkeletonCard rows={6} />
      </div>
      <SkeletonTable rows={5} cols={5} />
    </div>
  );
}
