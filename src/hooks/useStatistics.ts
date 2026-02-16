import { useState, useCallback, useEffect } from 'react';
import { useDatabase } from './useDatabase';
import { Statistics } from '../models/Statistics';
import { StatisticsService } from '../services/StatisticsService';

interface UseStatisticsReturn {
  statistics: Statistics | null;
  loading: boolean;
  error: string | null;
  refreshStatistics: () => Promise<void>;
  getDailyStatistics: () => Promise<Statistics | null>;
  getWeeklyStatistics: () => Promise<Statistics | null>;
  getMonthlyStatistics: () => Promise<Statistics | null>;
  updateStatistics: (sessionDuration: number, completed: boolean) => Promise<void>;
}

export const useStatistics = (): UseStatisticsReturn => {
  const { db, isReady } = useDatabase();
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshStatistics = useCallback(async () => {
    if (!db || !isReady) {
      setError('Database not ready');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const stats = await StatisticsService.getDailyStatistics(db);
      setStatistics(stats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load statistics';
      setError(errorMessage);
      console.error('useStatistics - refreshStatistics error:', err);
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  const getDailyStatistics = useCallback(async (): Promise<Statistics | null> => {
    if (!db || !isReady) {
      setError('Database not ready');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const stats = await StatisticsService.getDailyStatistics(db);
      setStatistics(stats);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load daily statistics';
      setError(errorMessage);
      console.error('useStatistics - getDailyStatistics error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  const getWeeklyStatistics = useCallback(async (): Promise<Statistics | null> => {
    if (!db || !isReady) {
      setError('Database not ready');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const stats = await StatisticsService.getWeeklyStatistics(db);
      setStatistics(stats);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load weekly statistics';
      setError(errorMessage);
      console.error('useStatistics - getWeeklyStatistics error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  const getMonthlyStatistics = useCallback(async (): Promise<Statistics | null> => {
    if (!db || !isReady) {
      setError('Database not ready');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const stats = await StatisticsService.getMonthlyStatistics(db);
      setStatistics(stats);
      return stats;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load monthly statistics';
      setError(errorMessage);
      console.error('useStatistics - getMonthlyStatistics error:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [db, isReady]);

  const updateStatistics = useCallback(
    async (sessionDuration: number, completed: boolean) => {
      if (!db || !isReady) {
        setError('Database not ready');
        return;
      }

      try {
        setError(null);

        await StatisticsService.updateSessionStatistics(
          db,
          sessionDuration,
          completed
        );

        await refreshStatistics();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update statistics';
        setError(errorMessage);
        console.error('useStatistics - updateStatistics error:', err);
      }
    },
    [db, isReady, refreshStatistics]
  );

  useEffect(() => {
    if (isReady && db) {
      refreshStatistics();
    }
  }, [isReady, db, refreshStatistics]);

  return {
    statistics,
    loading,
    error,
    refreshStatistics,
    getDailyStatistics,
    getWeeklyStatistics,
    getMonthlyStatistics,
    updateStatistics,
  };
};