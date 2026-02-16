import { useState, useEffect, useCallback } from 'react';
import { Achievement } from '../models/Achievement';
import { AchievementService } from '../services/AchievementService';
import { StorageService } from '../services/StorageService';
import { Session } from '../models/Session';

interface UseAchievementsReturn {
  achievements: Achievement[];
  unlockedAchievements: Achievement[];
  lockedAchievements: Achievement[];
  recentlyUnlocked: Achievement[];
  totalPoints: number;
  completionPercentage: number;
  isLoading: boolean;
  error: string | null;
  checkAchievements: (session: Session) => Promise<Achievement[]>;
  markAchievementAsSeen: (achievementId: string) => Promise<void>;
  refreshAchievements: () => Promise<void>;
  getAchievementById: (id: string) => Achievement | undefined;
  getAchievementsByCategory: (category: string) => Achievement[];
  getNextMilestone: () => Achievement | undefined;
}

export const useAchievements = (): UseAchievementsReturn => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [recentlyUnlocked, setRecentlyUnlocked] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const achievementService = AchievementService.getInstance();
  const storageService = StorageService.getInstance();

  const loadAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const allAchievements = await achievementService.getAllAchievements();
      setAchievements(allAchievements);

      const recent = await storageService.getRecentlyUnlockedAchievements();
      setRecentlyUnlocked(recent);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
      console.error('Error loading achievements:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const lockedAchievements = achievements.filter(a => !a.isUnlocked);

  const totalPoints = unlockedAchievements.reduce((sum, a) => sum + a.points, 0);

  const completionPercentage = achievements.length > 0
    ? (unlockedAchievements.length / achievements.length) * 100
    : 0;

  const checkAchievements = useCallback(async (session: Session): Promise<Achievement[]> => {
    try {
      const newlyUnlocked = await achievementService.checkAndUnlockAchievements(session);
      
      if (newlyUnlocked.length > 0) {
        await loadAchievements();
        
        const updatedRecent = [...recentlyUnlocked, ...newlyUnlocked];
        setRecentlyUnlocked(updatedRecent);
        await storageService.saveRecentlyUnlockedAchievements(updatedRecent);
      }

      return newlyUnlocked;
    } catch (err) {
      console.error('Error checking achievements:', err);
      return [];
    }
  }, [recentlyUnlocked, loadAchievements]);

  const markAchievementAsSeen = useCallback(async (achievementId: string): Promise<void> => {
    try {
      const updated = recentlyUnlocked.filter(a => a.id !== achievementId);
      setRecentlyUnlocked(updated);
      await storageService.saveRecentlyUnlockedAchievements(updated);
    } catch (err) {
      console.error('Error marking achievement as seen:', err);
    }
  }, [recentlyUnlocked]);

  const refreshAchievements = useCallback(async (): Promise<void> => {
    await loadAchievements();
  }, [loadAchievements]);

  const getAchievementById = useCallback((id: string): Achievement | undefined => {
    return achievements.find(a => a.id === id);
  }, [achievements]);

  const getAchievementsByCategory = useCallback((category: string): Achievement[] => {
    return achievements.filter(a => a.category === category);
  }, [achievements]);

  const getNextMilestone = useCallback((): Achievement | undefined => {
    const sortedLocked = lockedAchievements
      .filter(a => a.progress !== undefined)
      .sort((a, b) => {
        const progressA = (a.progress || 0) / (a.target || 1);
        const progressB = (b.progress || 0) / (b.target || 1);
        return progressB - progressA;
      });

    return sortedLocked[0];
  }, [lockedAchievements]);

  return {
    achievements,
    unlockedAchievements,
    lockedAchievements,
    recentlyUnlocked,
    totalPoints,
    completionPercentage,
    isLoading,
    error,
    checkAchievements,
    markAchievementAsSeen,
    refreshAchievements,
    getAchievementById,
    getAchievementsByCategory,
    getNextMilestone,
  };
};