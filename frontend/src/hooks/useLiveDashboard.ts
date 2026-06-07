import { useEffect, useRef, useState } from 'react';
import { api } from '../services/store';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  pendingLeaves: number;
  presentToday: number;
  avgPerformance: number;
  avgAttendance: number;
}

export function useLiveDashboard(refreshInterval = 60000) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval>>();

  const fetchStats = async () => {
    try {
      const data = await api.get('/dashboard/stats');
      setStats(data);
      setLastUpdated(new Date());
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchStats();
    timer.current = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(timer.current);
  }, [refreshInterval]);

  return { stats, lastUpdated, loading, refresh: fetchStats };
}
