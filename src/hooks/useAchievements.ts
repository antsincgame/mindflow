import { useState, useCallback, useEffect } from 'react';
import { useDatabaseService } from './useDatabase';
import { Achievement, AchievementType } from '../models/Achievement';
import { achievementDefinitions } from '../utils/achievementDefinitions';

interface AchievementProgress {
  achievement: Achievement;
  progress: number;
  targetValue: number;
  isUnlocked: boolean;
}

interface UseAchievementsReturn {
  achievements: Achievement[];
  achievementProgress: AchievementProgress[];
  unlockedCount: number;
  totalAchievements: number;
  loadAchievements: () => Promise<void>;
  unlockAchievement: (type: AchievementType) => Promise<void>;
  getAchievementProgress: (type: AchievementType) => AchievementProgress | undefined;
  checkAndUnlockAchievements: (stats: any) => Promise<Achievement[]>;
  isLoading: boolean;
  error: string | null;
}

export const useAchievements = (): UseAchievementsReturn => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementProgress, setAchievementProgress] = useState<AchievementProgress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const databaseService = useDatabaseService();

  const loadAchievements = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!databaseService) {
        setIsLoading(false);
        return;
      }

      const loadedAchievements = await databaseService.getAchievements();
      setAchievements(loadedAchievements);

      const progress = await calculateProgress(loadedAchievements);
      setAchievementProgress(progress);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load achievements';
      setError(errorMessage);
      console.error('Error loading achievements:', err);
    } finally {
      setIsLoading(false);
    }
  }, [databaseService]);

  const calculateProgress = async (loadedAchievements: Achievement[]): Promise<AchievementProgress[]> => {
    if (!databaseService) return [];

    const userStats = await databaseService.getUserStats();
    const sessionCount = userStats.total_sessions || 0;
    const totalFocusTime = userStats.total_focus_time || 0;
    const currentStreak = userStats.current_streak || 0;
    const bestStreak = userStats.best_streak || 0;
    const level = userStats.level || 1;

    return loadedAchievements.map((achievement) => {
      const definition = achievementDefinitions.find((def) => def.type === achievement.type);
      const { targetValue, progressValue } = getProgressValues(
        achievement.type,
        sessionCount,
        totalFocusTime,
        currentStreak,
        bestStreak,
        level
      );

      return {
        achievement,
        progress: progressValue,
        targetValue,
        isUnlocked: achievement.unlocked,
      };
    });
  };

  const getProgressValues = (
    type: AchievementType,
    sessionCount: number,
    totalFocusTime: number,
    currentStreak: number,
    bestStreak: number,
    level: number
  ): { targetValue: number; progressValue: number } => {
    switch (type) {
      case 'FIRST_SESSION':
        return { targetValue: 1, progressValue: Math.min(sessionCount, 1) };
      case 'FIVE_SESSIONS':
        return { targetValue: 5, progressValue: Math.min(sessionCount, 5) };
      case 'TEN_SESSIONS':
        return { targetValue: 10, progressValue: Math.min(sessionCount, 10) };
      case 'FIFTY_SESSIONS':
        return { targetValue: 50, progressValue: Math.min(sessionCount, 50) };
      case 'HUNDRED_SESSIONS':
        return { targetValue: 100, progressValue: Math.min(sessionCount, 100) };
      case 'ONE_HOUR_FOCUS':
        return { targetValue: 60, progressValue: Math.min(totalFocusTime, 60) };
      case 'FIVE_HOURS_FOCUS':
        return { targetValue: 300, progressValue: Math.min(totalFocusTime, 300) };
      case 'TWENTY_HOURS_FOCUS':
        return { targetValue: 1200, progressValue: Math.min(totalFocusTime, 1200) };
      case 'THREE_DAY_STREAK':
        return { targetValue: 3, progressValue: Math.min(currentStreak, 3) };
      case 'SEVEN_DAY_STREAK':
        return { targetValue: 7, progressValue: Math.min(currentStreak, 7) };
      case 'THIRTY_DAY_STREAK':
        return { targetValue: 30, progressValue: Math.min(currentStreak, 30) };
      case 'EARLY_BIRD':
        return { targetValue: 5, progressValue: Math.min(sessionCount, 5) };
      case 'NIGHT_OWL':
        return { targetValue: 5, progressValue: Math.min(sessionCount, 5) };
      case 'CONSISTENCY_MASTER':
        return { targetValue: 10, progressValue: Math.min(currentStreak, 10) };
      case 'LEVEL_UP':
        return { targetValue: 2, progressValue: Math.min(level, 2) };
      case 'LEVEL_FIVE':
        return { targetValue: 5, progressValue: Math.min(level, 5) };
      case 'LEVEL_TEN':
        return { targetValue: 10, progressValue: Math.min(level, 10) };
      case 'PERFECT_SESSION':
        return { targetValue: 1, progressValue: 0 };
      case 'WEEKEND_WARRIOR':
        return { targetValue: 5, progressValue: Math.min(sessionCount, 5) };
      default:
        return { targetValue: 1, progressValue: 0 };
    }
  };

  const unlockAchievement = useCallback(
    async (type: AchievementType) => {
      try {
        if (!databaseService) return;

        const achievement = achievements.find((a) => a.type === type);
        if (achievement && !achievement.unlocked) {
          await databaseService.unlockAchievement(type);
          await loadAchievements();
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to unlock achievement';
        setError(errorMessage);
        console.error('Error unlocking achievement:', err);
      }
    },
    [databaseService, achievements, loadAchievements]
  );

  const checkAndUnlockAchievements = useCallback(
    async (stats: any): Promise<Achievement[]> => {
      try {
        if (!databaseService) return [];

        const unlockedAchievements: Achievement[] = [];

        for (const definition of achievementDefinitions) {
          const achievement = achievements.find((a) => a.type === definition.type);
          if (achievement && !achievement.unlocked) {
            const shouldUnlock = definition.condition(stats);
            if (shouldUnlock) {
              await unlockAchievement(definition.type);
              unlockedAchievements.push(achievement);
            }
          }
        }

        await loadAchievements();
        return unlockedAchievements;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to check achievements';
        setError(errorMessage);
        console.error('Error checking achievements:', err);
        return [];
      }
    },
    [databaseService, achievements, unlockAchievement, loadAchievements]
  );

  const getAchievementProgress = useCallback(
    (type: AchievementType): AchievementProgress | undefined => {
      return achievementProgress.find((ap) => ap.achievement.type === type);
    },
    [achievementProgress]
  );

  const unlockedCount = achievements.filter((a) => a.unlocked).length;
  const totalAchievements = achievements.length;

  useEffect(() => {
    loadAchievements();
  }, [loadAchievements]);

  return {
    achievements,
    achievementProgress,
    unlockedCount,
    totalAchievements,
    loadAchievements,
    unlockAchievement,
    getAchievementProgress,
    checkAndUnlockAchievements,
    isLoading,
    error,
  };
};