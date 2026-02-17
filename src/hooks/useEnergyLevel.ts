import { useState, useEffect, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { energyService } from '../services/energyService';
import { moodService } from '../services/moodService';

interface EnergyLevelData {
  current: number;
  trend: 'rising' | 'falling' | 'stable';
  lastUpdated: number;
  prediction: number;
  confidence: number;
}

interface UseEnergyLevelReturn {
  energy: number;
  energyData: EnergyLevelData | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  updateEnergy: (newEnergy: number) => Promise<void>;
}

const REFRESH_INTERVAL = 5 * 60 * 1000; // 5 минут
const TREND_THRESHOLD = 5; // Порог для определения тренда

export const useEnergyLevel = (): UseEnergyLevelReturn => {
  const [energy, setEnergy] = useState<number>(50);
  const [energyData, setEnergyData] = useState<EnergyLevelData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const calculateTrend = useCallback((current: number, previous: number): 'rising' | 'falling' | 'stable' => {
    const difference = current - previous;
    if (Math.abs(difference) < TREND_THRESHOLD) {
      return 'stable';
    }
    return difference > 0 ? 'rising' : 'falling';
  }, []);

  const fetchEnergyLevel = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const currentEnergy = await energyService.getCurrentEnergy();
      const previousEnergy = await energyService.getPreviousEnergy();
      const prediction = await energyService.predictNextEnergy();
      const confidence = await energyService.getConfidenceScore();

      const trend = calculateTrend(currentEnergy, previousEnergy);

      const data: EnergyLevelData = {
        current: currentEnergy,
        trend,
        lastUpdated: Date.now(),
        prediction,
        confidence,
      };

      setEnergy(currentEnergy);
      setEnergyData(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to fetch energy level');
      setError(errorMessage);
      console.error('Error fetching energy level:', err);
    } finally {
      setIsLoading(false);
    }
  }, [calculateTrend]);

  const refresh = useCallback(async () => {
    await fetchEnergyLevel();
  }, [fetchEnergyLevel]);

  const updateEnergy = useCallback(async (newEnergy: number) => {
    try {
      if (newEnergy < 0 || newEnergy > 100) {
        throw new Error('Energy level must be between 0 and 100');
      }

      const timestamp = Date.now();
      const emoji = energyService.getEmojiForEnergy(newEnergy);

      await moodService.createMood({
        timestamp,
        energy: newEnergy,
        emoji,
        note: null,
      });

      await fetchEnergyLevel();
    } catch (err) {
      const errorMessage = err instanceof Error ? err : new Error('Failed to update energy level');
      setError(errorMessage);
      console.error('Error updating energy level:', err);
      throw errorMessage;
    }
  }, [fetchEnergyLevel]);

  useEffect(() => {
    fetchEnergyLevel();

    const intervalId = setInterval(() => {
      fetchEnergyLevel();
    }, REFRESH_INTERVAL);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchEnergyLevel]);

  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        fetchEnergyLevel();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [fetchEnergyLevel]);

  return {
    energy,
    energyData,
    isLoading,
    error,
    refresh,
    updateEnergy,
  };
};