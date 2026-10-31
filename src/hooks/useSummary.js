import { useState, useCallback } from 'react';
import { apiFetch } from '../services/api';

export function useSummary() {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadSummary = useCallback(async (text) => {
    setLoading(true);
    setError(null);
    setSummary('');

    try {
      const result = await apiFetch('/api/generate/summary', {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      setSummary(result.summary);
    } catch (err) {
      setError(err.message || 'Failed to generate summary');
    } finally {
      setLoading(false);
    }
  }, []);

  const setSummaryFromSaved = useCallback((summary) => {
    setSummary(summary);
  }, []);

  return {
    summary,
    loading,
    error,
    loadSummary,
    setSummaryFromSaved,
    setError,
  };
}
