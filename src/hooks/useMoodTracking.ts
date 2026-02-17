import { useState, useEffect, useCallback } from 'react';
import { Mood } from '../models/Mood';
import { 
  addMoodRecord, 
  getMoodHistory, 
  getLatestMood, 
  getMoodsByDateRange,
  deleteMoodRecord 
} from '../services/moodService';

interface UseMoodTrackingReturn {
  currentMood: Mood | null;
  moodHistory: Mood[];
  isLoading: boolean;
  error: string | null;
  addMood: (energy: number, emoji: string, note?: string) => Promise<void>;
  getMoodsByRange: (startDate: Date, endDate: Date) => Promise<Mood[]>;
  deleteMood: (id: number) => Promise<void>;
  refreshMoodData: () => Promise<void>;
  getTodayMoods: () => Mood[];
  getWeekMoods: () => Mood[];
  getAverageEnergy: (moods?: Mood[]) => number;
  getMoodTrend: () => 'increasing' | 'decreasing' | 'stable';
}

export const useMoodTracking = (historyLimit: number = 100): UseMoodTrackingReturn => {
  const [currentMood, setCurrentMood] = useState<Mood | null>(null);
  const [moodHistory, setMoodHistory] = useState<Mood[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadMoodData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [latest, history] = await Promise.all([
        getLatestMood(),
        getMoodHistory(historyLimit)
      ]);

      setCurrentMood(latest);
      setMoodHistory(history);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load mood data';
      setError(errorMessage);
      console.error('Error loading mood data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [historyLimit]);

  useEffect(() => {
    loadMoodData();
  }, [loadMoodData]);

  const addMood = useCallback(async (energy: number, emoji: string, note?: string): Promise<void> => {
    try {
      setError(null);
      
      if (energy < 0 || energy > 100) {
        throw new Error('Energy level must be between 0 and 100');
      }

      const newMood = await addMoodRecord(energy, emoji, note);
      
      setCurrentMood(newMood);
      setMoodHistory(prev => [newMood, ...prev].slice(0, historyLimit));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add mood record';
      setError(errorMessage);
      throw err;
    }
  }, [historyLimit]);

  const getMoodsByRange = useCallback(async (startDate: Date, endDate: Date): Promise<Mood[]> => {
    try {
      setError(null);
      const moods = await getMoodsByDateRange(startDate, endDate);
      return moods;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get moods by range';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const deleteMood = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await deleteMoodRecord(id);
      
      setMoodHistory(prev => prev.filter(mood => mood.id !== id));
      
      if (currentMood?.id === id) {
        const newLatest = await getLatestMood();
        setCurrentMood(newLatest);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete mood record';
      setError(errorMessage);
      throw err;
    }
  }, [currentMood]);

  const refreshMoodData = useCallback(async (): Promise<void> => {
    await loadMoodData();
  }, [loadMoodData]);

  const getTodayMoods = useCallback((): Mood[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTimestamp = Math.floor(today.getTime() / 1000);

    return moodHistory.filter(mood => mood.timestamp >= todayTimestamp);
  }, [moodHistory]);

  const getWeekMoods = useCallback((): Mood[] => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekAgoTimestamp = Math.floor(weekAgo.getTime() / 1000);

    return moodHistory.filter(mood => mood.timestamp >= weekAgoTimestamp);
  }, [moodHistory]);

  const getAverageEnergy = useCallback((moods?: Mood[]): number => {
    const moodsToAnalyze = moods || moodHistory;
    
    if (moodsToAnalyze.length === 0) {
      return 50;
    }

    const sum = moodsToAnalyze.reduce((acc, mood) => acc + mood.energy, 0);
    return Math.round(sum / moodsToAnalyze.length);
  }, [moodHistory]);

  const getMoodTrend = useCallback((): 'increasing' | 'decreasing' | 'stable' => {
    if (moodHistory.length < 2) {
      return 'stable';
    }

    const recentMoods = moodHistory.slice(0, 5);
    const olderMoods = moodHistory.slice(5, 10);

    if (olderMoods.length === 0) {
      return 'stable';
    }

    const recentAverage = getAverageEnergy(recentMoods);
    const olderAverage = getAverageEnergy(olderMoods);

    const difference = recentAverage - olderAverage;

    if (difference > 5) {
      return 'increasing';
    } else if (difference < -5) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }, [moodHistory, getAverageEnergy]);

  return {
    currentMood,
    moodHistory,
    isLoading,
    error,
    addMood,
    getMoodsByRange,
    deleteMood,
    refreshMoodData,
    getTodayMoods,
    getWeekMoods,
    getAverageEnergy,
    getMoodTrend
  };
};