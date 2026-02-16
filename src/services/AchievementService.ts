import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Achievement, AchievementProgress, AchievementCategory } from '../models/Achievement';
import { Session } from '../models/Session';
import { achievementDefinitions } from '../utils/achievementDefinitions';

const STORAGE_KEY = '@achievements_progress';
const UNLOCKED_KEY = '@achievements_unlocked';

export interface AchievementCheckResult {
  newlyUnlocked: Achievement[];
  updated: AchievementProgress[];
}

class AchievementService {
  private progressCache: Map<string, AchievementProgress> = new Map();
  private unlockedCache: Set<string> = new Set();
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      const [progressData, unlockedData] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEY),
        AsyncStorage.getItem(UNLOCKED_KEY),
      ]);

      if (progressData) {
        const progress: AchievementProgress[] = JSON.parse(progressData);
        progress.forEach(p => this.progressCache.set(p.achievementId, p));
      }

      if (unlockedData) {
        const unlocked: string[] = JSON.parse(unlockedData);
        unlocked.forEach(id => this.unlockedCache.add(id));
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize AchievementService:', error);
      throw error;
    }
  }

  async getAllAchievements(): Promise<Achievement[]> {
    await this.ensureInitialized();
    return achievementDefinitions;
  }

  async getAchievementsByCategory(category: AchievementCategory): Promise<Achievement[]> {
    await this.ensureInitialized();
    return achievementDefinitions.filter(a => a.category === category);
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    await this.ensureInitialized();
    return achievementDefinitions.filter(a => this.unlockedCache.has(a.id));
  }

  async getLockedAchievements(): Promise<Achievement[]> {
    await this.ensureInitialized();
    return achievementDefinitions.filter(a => !this.unlockedCache.has(a.id));
  }

  async getProgress(achievementId: string): Promise<AchievementProgress | null> {
    await this.ensureInitialized();
    return this.progressCache.get(achievementId) || null;
  }

  async getAllProgress(): Promise<AchievementProgress[]> {
    await this.ensureInitialized();
    return Array.from(this.progressCache.values());
  }

  async isUnlocked(achievementId: string): Promise<boolean> {
    await this.ensureInitialized();
    return this.unlockedCache.has(achievementId);
  }

  async getUnlockedCount(): Promise<number> {
    await this.ensureInitialized();
    return this.unlockedCache.size;
  }

  async getTotalPoints(): Promise<number> {
    await this.ensureInitialized();
    let total = 0;
    for (const achievementId of this.unlockedCache) {
      const achievement = achievementDefinitions.find(a => a.id === achievementId);
      if (achievement) {
        total += achievement.points;
      }
    }
    return total;
  }

  async checkAchievementsAfterSession(session: Session): Promise<AchievementCheckResult> {
    await this.ensureInitialized();

    const newlyUnlocked: Achievement[] = [];
    const updated: AchievementProgress[] = [];

    for (const achievement of achievementDefinitions) {
      if (this.unlockedCache.has(achievement.id)) {
        continue;
      }

      const progress = this.progressCache.get(achievement.id) || {
        achievementId: achievement.id,
        currentValue: 0,
        targetValue: achievement.targetValue,
        unlockedAt: null,
      };

      const newValue = this.calculateNewProgress(achievement, progress, session);

      if (newValue !== progress.currentValue) {
        progress.currentValue = newValue;
        this.progressCache.set(achievement.id, progress);
        updated.push(progress);

        if (newValue >= achievement.targetValue) {
          await this.unlockAchievement(achievement);
          newlyUnlocked.push(achievement);
        }
      }
    }

    if (updated.length > 0) {
      await this.saveProgress();
    }

    return { newlyUnlocked, updated };
  }

  async checkAllAchievements(sessions: Session[]): Promise<AchievementCheckResult> {
    await this.ensureInitialized();

    const newlyUnlocked: Achievement[] = [];
    const updated: AchievementProgress[] = [];

    for (const achievement of achievementDefinitions) {
      if (this.unlockedCache.has(achievement.id)) {
        continue;
      }

      const progress = this.progressCache.get(achievement.id) || {
        achievementId: achievement.id,
        currentValue: 0,
        targetValue: achievement.targetValue,
        unlockedAt: null,
      };

      const newValue = this.calculateProgressFromAllSessions(achievement, sessions);

      if (newValue !== progress.currentValue) {
        progress.currentValue = newValue;
        this.progressCache.set(achievement.id, progress);
        updated.push(progress);

        if (newValue >= achievement.targetValue) {
          await this.unlockAchievement(achievement);
          newlyUnlocked.push(achievement);
        }
      }
    }

    if (updated.length > 0) {
      await this.saveProgress();
    }

    return { newlyUnlocked, updated };
  }

  private calculateNewProgress(
    achievement: Achievement,
    currentProgress: AchievementProgress,
    session: Session
  ): number {
    switch (achievement.type) {
      case 'session_count':
        return currentProgress.currentValue + 1;

      case 'consecutive_days':
        return this.calculateConsecutiveDays(session);

      case 'total_duration':
        return currentProgress.currentValue + session.duration;

      case 'emotion_specific':
        if (session.emotionId === achievement.emotionId) {
          return currentProgress.currentValue + 1;
        }
        return currentProgress.currentValue;

      case 'exercise_specific':
        if (session.exerciseId === achievement.exerciseId) {
          return currentProgress.currentValue + 1;
        }
        return currentProgress.currentValue;

      case 'time_of_day':
        if (this.isTimeOfDay(session, achievement.timeOfDay!)) {
          return currentProgress.currentValue + 1;
        }
        return currentProgress.currentValue;

      case 'streak':
        return this.calculateStreak(session);

      case 'perfect_week':
        return this.checkPerfectWeek(session) ? 1 : 0;

      default:
        return currentProgress.currentValue;
    }
  }

  private calculateProgressFromAllSessions(
    achievement: Achievement,
    sessions: Session[]
  ): number {
    switch (achievement.type) {
      case 'session_count':
        return sessions.length;

      case 'consecutive_days':
        return this.calculateConsecutiveDaysFromSessions(sessions);

      case 'total_duration':
        return sessions.reduce((sum, s) => sum + s.duration, 0);

      case 'emotion_specific':
        return sessions.filter(s => s.emotionId === achievement.emotionId).length;

      case 'exercise_specific':
        return sessions.filter(s => s.exerciseId === achievement.exerciseId).length;

      case 'time_of_day':
        return sessions.filter(s => this.isTimeOfDay(s, achievement.timeOfDay!)).length;

      case 'streak':
        return this.calculateCurrentStreak(sessions);

      case 'perfect_week':
        return this.checkPerfectWeekFromSessions(sessions) ? 1 : 0;

      default:
        return 0;
    }
  }

  private calculateConsecutiveDays(session: Session): number {
    // This would need access to previous sessions
    // For now, return 1 as placeholder
    return 1;
  }

  private calculateConsecutiveDaysFromSessions(sessions: Session[]): number {
    if (sessions.length === 0) return 0;

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );

    const uniqueDays = new Set<string>();
    for (const session of sortedSessions) {
      if (session.completedAt) {
        const date = new Date(session.completedAt);
        const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        uniqueDays.add(dayKey);
      }
    }

    let consecutive = 0;
    const today = new Date();
    let currentDate = new Date(today);

    while (true) {
      const dayKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
      if (uniqueDays.has(dayKey)) {
        consecutive++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return consecutive;
  }

  private isTimeOfDay(session: Session, timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night'): boolean {
    if (!session.completedAt) return false;

    const hour = new Date(session.completedAt).getHours();

    switch (timeOfDay) {
      case 'morning':
        return hour >= 5 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 17;
      case 'evening':
        return hour >= 17 && hour < 21;
      case 'night':
        return hour >= 21 || hour < 5;
      default:
        return false;
    }
  }

  private calculateStreak(session: Session): number {
    // This would need access to all previous sessions
    // For now, return 1 as placeholder
    return 1;
  }

  private calculateCurrentStreak(sessions: Session[]): number {
    if (sessions.length === 0) return 0;

    const sortedSessions = [...sessions].sort(
      (a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime()
    );

    const uniqueDays = new Set<string>();
    for (const session of sortedSessions) {
      if (session.completedAt) {
        const date = new Date(session.completedAt);
        const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        uniqueDays.add(dayKey);
      }
    }

    let streak = 0;
    const today = new Date();
    let currentDate = new Date(today);

    while (true) {
      const dayKey = `${currentDate.getFullYear()}-${currentDate.getMonth()}-${currentDate.getDate()}`;
      if (uniqueDays.has(dayKey)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  private checkPerfectWeek(session: Session): boolean {
    // This would need access to all sessions in the current week
    // For now, return false as placeholder
    return false;
  }

  private checkPerfectWeekFromSessions(sessions: Session[]): boolean {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7);

    const weekSessions = sessions.filter(s => {
      if (!s.completedAt) return false;
      const sessionDate = new Date(s.completedAt);
      return sessionDate >= startOfWeek && sessionDate < endOfWeek;
    });

    const uniqueDays = new Set<string>();
    for (const session of weekSessions) {
      if (session.completedAt) {
        const date = new Date(session.completedAt);
        const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        uniqueDays.add(dayKey);
      }
    }

    return uniqueDays.size >= 7;
  }

  private async unlockAchievement(achievement: Achievement): Promise<void> {
    const progress = this.progressCache.get(achievement.id);
    if (progress) {
      progress.unlockedAt = new Date().toISOString();
      this.progressCache.set(achievement.id, progress);
    }

    this.unlockedCache.add(achievement.id);
    await this.saveUnlocked();

    await this.sendUnlockNotification(achievement);
  }

  private async sendUnlockNotification(achievement: Achievement): Promise<void> {
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🎉 Достижение разблокировано!',
          body: `${achievement.title}: ${achievement.description}`,
          data: { achievementId: achievement.id },
          sound: true,
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Failed to send achievement notification:', error);
    }
  }

  async resetProgress(achievementId: string): Promise<void> {
    await this.ensureInitialized();

    this.progressCache.delete(achievementId);
    this.unlockedCache.delete(achievementId);

    await Promise.all([this.saveProgress(), this.saveUnlocked()]);
  }

  async resetAllProgress(): Promise<void> {
    await this.ensureInitialized();

    this.progressCache.clear();
    this.unlockedCache.clear();

    await Promise.all([this.saveProgress(), this.saveUnlocked()]);
  }

  private async saveProgress(): Promise<void> {
    try {
      const progress = Array.from(this.progressCache.values());
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save achievement progress:', error);
      throw error;
    }
  }

  private async saveUnlocked(): Promise<void> {
    try {
      const unlocked = Array.from(this.unlockedCache);
      await AsyncStorage.setItem(UNLOCKED_KEY, JSON.stringify(unlocked));
    } catch (error) {
      console.error('Failed to save unlocked achievements:', error);
      throw error;
    }
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async getCompletionPercentage(): Promise<number> {
    await this.ensureInitialized();
    const total = achievementDefinitions.length;
    const unlocked = this.unlockedCache.size;
    return total > 0 ? (unlocked / total) * 100 : 0;
  }

  async getNextAchievements(limit: number = 3): Promise<Achievement[]> {
    await this.ensureInitialized();

    const