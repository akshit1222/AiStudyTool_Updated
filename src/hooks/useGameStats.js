import { useState, useCallback, useEffect } from 'react';
import { apiFetch } from '../services/api';

export function useGameStats() {
  const [stats, setStats] = useState(null);

  const refresh = useCallback(async () => {
    try {
      setStats(await apiFetch('/api/game/stats'));
    } catch {
      /* stats are decorative; ignore failures */
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return { stats, refresh };
}
