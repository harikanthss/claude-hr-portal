import { useEffect, useRef } from 'react';
import { useStore, api } from '../services/store';

export function useRealTimeNotifications() {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await api.get('/notifications');
        if (Array.isArray(data)) {
          useStore.setState({ notifications: data });
        }
      } catch {}
    };
    poll();
    intervalRef.current = setInterval(poll, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);
}
