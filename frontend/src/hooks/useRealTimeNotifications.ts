import { useEffect, useRef } from 'react';
import { useStore, api } from '../services/store';

export function useRealTimeNotifications() {
  const store = useStore();
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    const poll = async () => {
      try {
        const data = await api.get('/notifications');
        if (Array.isArray(data) && store.notifications !== undefined) {
          // Update store notifications if the store supports it
          useStore.setState({ notifications: data });
        }
      } catch {}
    };
    poll();
    intervalRef.current = setInterval(poll, 30000);
    return () => clearInterval(intervalRef.current);
  }, []);
}
