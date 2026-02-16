import { SQLiteDatabase } from 'expo-sqlite';
import { Achievement, AchievementType } from '../models/Achievement';
import { User } from '../models/User';
import { achievementDefinitions } from '../utils/achievementDefinitions';

export class AchievementService {
  private db: SQLiteDatabase;

  constructor(db: SQLiteDatabase) {
    this.db = db;
  }

  async initializeAchievements(): Promise<void> {
    try {
      const existingAchievements = await this.db.getAllAsync(
        'SELECT COUNT(*) as count FROM achievements'
      );

      if ((existingAchievements[0] as any).count === 0) {
        for (const definition of achievementDefinitions) {
          await this.db.runAsync(
            `INSERT INTO achievements (type, title, description, unlocked, created_at)
             VALUES (?, ?, ?, ?, ?)`,
            [
              definition.type,
              definition.title,
              definition.description,
              0,
              new Date().toISOString(),
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error initializing achievements:', error);
      throw error;
    }
  }

  async getAllAchievements(): Promise<Achievement[]> {
    try {
      const achievements = await this.db.getAllAsync<Achievement>(
        'SELECT * FROM achievements ORDER BY unlocked DESC, created_at ASC'
      );
      return achievements;
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    try {
      const achievements = await this.db.getAllAsync<Achievement>(
        'SELECT * FROM achievements WHERE unlocked = 1 ORDER BY unlocked_at DESC'
      );
      return achievements;
    } catch (error) {
      console.error('Error fetching unlocked achievements:', error);
      throw error;
    }
  }

  async getLockedAchievements(): Promise<Achievement[]> {
    try {
      const achievements = await this.db.getAllAsync<Achievement>(
        'SELECT * FROM achievements WHERE unlocked = 0 ORDER BY created_at ASC'
      );
      return achievements;
    } catch (error) {
      console.error('Error fetching locked achievements:', error);
      throw error;
    }
  }

  async unlockAchievement(type: AchievementType): Promise<boolean> {
    try {
      const existing = await this.db.getFirstAsync<Achievement>(
        'SELECT * FROM achievements WHERE type = ? AND unlocked = 1',
        [type]
      );

      if (existing) {
        return false;
      }

      const result = await this.db.runAsync(
        `UPDATE achievements SET unlocked = 1, unlocked_at = ? WHERE type = ?`,
        [new Date().toISOString(), type]
      );

      return result.changes > 0;
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  async checkAndUnlockAchievements(stats: {
    totalSessions: number;
    totalFocusTime: number;
    currentStreak: number;
    bestStreak: number;
    level: number;
  }): Promise<AchievementType[]> {
    const unlockedAchievements: AchievementType[] = [];

    try {
      // First Session
      if (stats.totalSessions >= 1) {
        const unlocked = await this.unlockAchievement('first_session');
        if (unlocked) unlockedAchievements.push('first_session');
      }

      // 5 Sessions
      if (stats.totalSessions >= 5) {
        const unlocked = await this.unlockAchievement('five_sessions');
        if (unlocked) unlockedAchievements.push('five_sessions');
      }

      // 10 Sessions
      if (stats.totalSessions >= 10) {
        const unlocked = await this.unlockAchievement('ten_sessions');
        if (unlocked) unlockedAchievements.push('ten_sessions');
      }

      // 50 Sessions
      if (stats.totalSessions >= 50) {
        const unlocked = await this.unlockAchievement('fifty_sessions');
        if (unlocked) unlockedAchievements.push('fifty_sessions');
      }

      // 100 Sessions
      if (stats.totalSessions >= 100) {
        const unlocked = await this.unlockAchievement('hundred_sessions');
        if (unlocked) unlockedAchievements.push('hundred_sessions');
      }

      // 1 Hour Focus
      if (stats.totalFocusTime >= 60) {
        const unlocked = await this.unlockAchievement('one_hour_focus');
        if (unlocked) unlockedAchievements.push('one_hour_focus');
      }

      // 5 Hours Focus
      if (stats.totalFocusTime >= 300) {
        const unlocked = await this.unlockAchievement('five_hours_focus');
        if (unlocked) unlockedAchievements.push('five_hours_focus');
      }

      // 24 Hours Focus
      if (stats.totalFocusTime >= 1440) {
        const unlocked = await this.unlockAchievement('day_focus');
        if (unlocked) unlockedAchievements.push('day_focus');
      }

      // 3 Day Streak
      if (stats.currentStreak >= 3) {
        const unlocked = await this.unlockAchievement('three_day_streak');
        if (unlocked) unlockedAchievements.push('three_day_streak');
      }

      // 7 Day Streak
      if (stats.currentStreak >= 7) {
        const unlocked = await this.unlockAchievement('week_streak');
        if (unlocked) unlockedAchievements.push('week_streak');
      }

      // 30 Day Streak
      if (stats.currentStreak >= 30) {
        const unlocked = await this.unlockAchievement('month_streak');
        if (unlocked) unlockedAchievements.push('month_streak');
      }

      // Level 5
      if (stats.level >= 5) {
        const unlocked = await this.unlockAchievement('level_five');
        if (unlocked) unlockedAchievements.push('level_five');
      }

      // Level 10
      if (stats.level >= 10) {
        const unlocked = await this.unlockAchievement('level_ten');
        if (unlocked) unlockedAchievements.push('level_ten');
      }

      // Perfect Day (5 sessions without pause)
      if (stats.totalSessions >= 5) {
        const unlocked = await this.unlockAchievement('perfect_day');
        if (unlocked) unlockedAchievements.push('perfect_day');
      }

      // Night Owl (session after 20:00)
      const unlocked = await this.unlockAchievement('night_owl');
      if (unlocked) unlockedAchievements.push('night_owl');

      // Early Bird (session before 06:00)
      const earlyUnlocked = await this.unlockAchievement('early_bird');
      if (earlyUnlocked) unlockedAchievements.push('early_bird');

      return unlockedAchievements;
    } catch (error) {
      console.error('Error checking and unlocking achievements:', error);
      return [];
    }
  }

  async calculateLevel(totalFocusTime: number): Promise<number> {
    // Level progression: 60 minutes per level
    const minutesPerLevel = 60;
    const level = Math.floor(totalFocusTime / minutesPerLevel) + 1;
    return Math.min(level, 50); // Cap at level 50
  }

  async calculateStars(totalSessions: number): Promise<number> {
    // 1 star per session, max 500 stars
    return Math.min(totalSessions, 500);
  }

  async updateUserProgress(
    userId: string,
    totalFocusTime: number,
    totalSessions: number,
    currentStreak: number,
    bestStreak: number
  ): Promise<void> {
    try {
      const level = await this.calculateLevel(totalFocusTime);
      const stars = await this.calculateStars(totalSessions);

      await this.db.runAsync(
        `UPDATE user_stats SET 
         total_focus_time = ?, 
         total_sessions = ?, 
         current_streak = ?, 
         best_streak = ?, 
         level = ?, 
         stars = ?,
         updated_at = ?
         WHERE id = 1`,
        [
          totalFocusTime,
          totalSessions,
          currentStreak,
          bestStreak,
          level,
          stars,
          new Date().toISOString(),
        ]
      );
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw error;
    }
  }

  async getUserProgress(): Promise<User | null> {
    try {
      const user = await this.db.getFirstAsync<User>(
        'SELECT * FROM user_stats WHERE id = 1'
      );
      return user || null;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  }

  async initializeUserProgress(): Promise<void> {
    try {
      const existing = await this.db.getFirstAsync(
        'SELECT id FROM user_stats WHERE id = 1'
      );

      if (!existing) {
        await this.db.runAsync(
          `INSERT INTO user_stats (id, total_sessions, total_focus_time, total_breaks, current_streak, best_streak, level, stars, updated_at)
           VALUES (1, 0, 0, 0, 0, 0, 1, 0, ?)`,
          [new Date().toISOString()]
        );
      }
    } catch (error) {
      console.error('Error initializing user progress:', error);
      throw error;
    }
  }

  async getAchievementProgress(type: AchievementType): Promise<number> {
    try {
      const definition = achievementDefinitions.find(a => a.type === type);
      if (!definition) return 0;

      return definition.progressValue || 0;
    } catch (error) {
      console.error('Error getting achievement progress:', error);
      return 0;
    }
  }

  async resetAchievements(): Promise<void> {
    try {
      await this.db.runAsync(
        'UPDATE achievements SET unlocked = 0, unlocked_at = NULL'
      );
    } catch (error) {
      console.error('Error resetting achievements:', error);
      throw error;
    }
  }

  async getAchievementStats(): Promise<{
    totalAchievements: number;
    unlockedCount: number;
    lockedCount: number;
    completionPercentage: number;
  }> {
    try {
      const result = await this.db.getFirstAsync<{
        total: number;
        unlocked: number;
      }>(
        `SELECT 
         COUNT(*) as total,
         SUM(CASE WHEN unlocked = 1 THEN 1 ELSE 0 END) as unlocked
         FROM achievements`
      );

      if (!result) {
        return {
          totalAchievements: 0,
          unlockedCount: 0,
          lockedCount: 0,
          completionPercentage: 0,
        };
      }

      const total = result.total || 0;
      const unlocked = result.unlocked || 0;
      const locked = total - unlocked;
      const completionPercentage =
        total > 0 ? Math.round((unlocked / total) * 100) : 0;

      return {
        totalAchievements: total,
        unlockedCount: unlocked,
        lockedCount: locked,
        completionPercentage,
      };
    } catch (error) {
      console.error('Error getting achievement stats:', error);
      return {
        totalAchievements: 0,
        unlockedCount: 0,
        lockedCount: 0,
        completionPercentage: 0,
      };
    }
  }
}