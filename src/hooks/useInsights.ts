import { useState, useEffect, useCallback } from 'react';
import { insightsService } from '../services/insightsService';
import { Insight } from '../models/Insight';

interface UseInsightsReturn {
  insights: Insight[];
  loading: boolean;
  error: string | null;
  hasEnoughData: boolean;
  refreshInsights: () => Promise<void>;
  dismissInsight: (id: number) => Promise<void>;
  generateNewInsights: () => Promise<void>;
}

export const useInsights = (): UseInsightsReturn => {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEnoughData, setHasEnoughData] = useState<boolean>(false);

  const loadInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const activeInsights = await insightsService.getActiveInsights();
      setInsights(activeInsights);

      const dataCheck = await insightsService.hasEnoughDataForInsights();
      setHasEnoughData(dataCheck);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load insights');
      console.error('Error loading insights:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshInsights = useCallback(async () => {
    await loadInsights();
  }, [loadInsights]);

  const dismissInsight = useCallback(async (id: number) => {
    try {
      await insightsService.dismissInsight(id);
      setInsights(prev => prev.filter(insight => insight.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to dismiss insight');
      console.error('Error dismissing insight:', err);
    }
  }, []);

  const generateNewInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      await insightsService.generateInsights();
      await loadInsights();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
      console.error('Error generating insights:', err);
    } finally {
      setLoading(false);
    }
  }, [loadInsights]);

  useEffect(() => {
    loadInsights();

    const interval = setInterval(() => {
      loadInsights();
    }, 300000);

    return () => clearInterval(interval);
  }, [loadInsights]);

  return {
    insights,
    loading,
    error,
    hasEnoughData,
    refreshInsights,
    dismissInsight,
    generateNewInsights,
  };
};