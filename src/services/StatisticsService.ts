import * as SQLite from 'expo-sqlite';
import { Session } from '../models/Session';
import { Statistics } from '../models/Statistics';
import { format, startOfDay, startOfWeek, startOfMonth, endOfDay, endOfWeek, endOfMonth } from 'date-fns';

export class StatisticsService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(database: SQLite.SQLiteDatabase) {
    this.db = database;
  }

  async getDailyStatistics(date: Date = new Date()): Promise<Statistics> {
    if (!this.db) throw new Error('Database not initialized');

    const dayStart = format(startOfDay(date), 'yyyy-MM-dd HH:mm:ss');
    const dayEnd = format(endOfDay(date), 'yyyy-MM-dd HH:mm:ss');

    const sessionsResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count, SUM(duration) as totalTime 
       FROM sessions 
       WHERE completed = 1 AND completed_at BETWEEN ? AND ?`,
      [dayStart, dayEnd]
    );

    const breaksResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count, SUM(duration) as totalTime 
       FROM breaks 
       WHERE skipped = 0 AND completed_at BETWEEN ? AND ?`,
      [dayStart, dayEnd]
    );

    const achievementsResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count 
       FROM achievements 
       WHERE unlocked = 1 AND unlocked_at BETWEEN ? AND ?`,
      [dayStart, dayEnd]
    );

    const sessions = (sessionsResult as any[])[0];
    const breaks = (breaksResult as any[])[0];
    const achievements = (achievementsResult as any[])[0];

    return {
      date: date.toISOString(),
      totalSessions: sessions?.count || 0,
      totalFocusTime: sessions?.totalTime || 0,
      totalBreaks: breaks?.count || 0,
      totalBreakTime: breaks?.totalTime || 0,
      achievementsUnlocked: achievements?.count || 0,
      period: 'day',
    };
  }

  async getWeeklyStatistics(date: Date = new Date()): Promise<Statistics> {
    if (!this.db) throw new Error('Database not initialized');

    const weekStart = format(startOfWeek(date), 'yyyy-MM-dd HH:mm:ss');
    const weekEnd = format(endOfWeek(date), 'yyyy-MM-dd HH:mm:ss');

    const sessionsResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count, SUM(duration) as totalTime 
       FROM sessions 
       WHERE completed = 1 AND completed_at BETWEEN ? AND ?`,
      [weekStart, weekEnd]
    );

    const breaksResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count, SUM(duration) as totalTime 
       FROM breaks 
       WHERE skipped = 0 AND completed_at BETWEEN ? AND ?`,
      [weekStart, weekEnd]
    );

    const achievementsResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count 
       FROM achievements 
       WHERE unlocked = 1 AND unlocked_at BETWEEN ? AND ?`,
      [weekStart, weekEnd]
    );

    const sessions = (sessionsResult as any[])[0];
    const breaks = (breaksResult as any[])[0];
    const achievements = (achievementsResult as any[])[0];

    return {
      date: date.toISOString(),
      totalSessions: sessions?.count || 0,
      totalFocusTime: sessions?.totalTime || 0,
      totalBreaks: breaks?.count || 0,
      totalBreakTime: breaks?.totalTime || 0,
      achievementsUnlocked: achievements?.count || 0,
      period: 'week',
    };
  }

  async getMonthlyStatistics(date: Date = new Date()): Promise<Statistics> {
    if (!this.db) throw new Error('Database not initialized');

    const monthStart = format(startOfMonth(date), 'yyyy-MM-dd HH:mm:ss');
    const monthEnd = format(endOfMonth(date), 'yyyy-MM-dd HH:mm:ss');

    const sessionsResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count, SUM(duration) as totalTime 
       FROM sessions 
       WHERE completed = 1 AND completed_at BETWEEN ? AND ?`,
      [monthStart, monthEnd]
    );

    const breaksResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count, SUM(duration) as totalTime 
       FROM breaks 
       WHERE skipped = 0 AND completed_at BETWEEN ? AND ?`,
      [monthStart, monthEnd]
    );

    const achievementsResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count 
       FROM achievements 
       WHERE unlocked = 1 AND unlocked_at BETWEEN ? AND ?`,
      [monthStart, monthEnd]
    );

    const sessions = (sessionsResult as any[])[0];
    const breaks = (breaksResult as any[])[0];
    const achievements = (achievementsResult as any[])[0];

    return {
      date: date.toISOString(),
      totalSessions: sessions?.count || 0,
      totalFocusTime: sessions?.totalTime || 0,
      totalBreaks: breaks?.count || 0,
      totalBreakTime: breaks?.totalTime || 0,
      achievementsUnlocked: achievements?.count || 0,
      period: 'month',
    };
  }

  async getAllTimeSessions(): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT * FROM sessions ORDER BY created_at DESC`
    );

    return result as Session[];
  }

  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');

    const start = format(startDate, 'yyyy-MM-dd HH:mm:ss');
    const end = format(endDate, 'yyyy-MM-dd HH:mm:ss');

    const result = await this.db.getAllAsync(
      `SELECT * FROM sessions 
       WHERE created_at BETWEEN ? AND ? 
       ORDER BY created_at DESC`,
      [start, end]
    );

    return result as Session[];
  }

  async getCompletionRate(days: number = 7): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const daysAgo = new Date();
    daysAgo.setDate(daysAgo.getDate() - days);
    const startDate = format(startOfDay(daysAgo), 'yyyy-MM-dd HH:mm:ss');
    const endDate = format(endOfDay(new Date()), 'yyyy-MM-dd HH:mm:ss');

    const result = await this.db.getAllAsync(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed
       FROM sessions 
       WHERE created_at BETWEEN ? AND ?`,
      [startDate, endDate]
    );

    const stats = (result as any[])[0];
    const total = stats?.total || 0;
    const completed = stats?.completed || 0;

    return total > 0 ? (completed / total) * 100 : 0;
  }

  async getCurrentStreak(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT current_streak FROM user_stats LIMIT 1`
    );

    return (result as any[])[0]?.current_streak || 0;
  }

  async getBestStreak(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT best_streak FROM user_stats LIMIT 1`
    );

    return (result as any[])[0]?.best_streak || 0;
  }

  async getTotalFocusTime(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT SUM(duration) as totalTime FROM sessions WHERE completed = 1`
    );

    return (result as any[])[0]?.totalTime || 0;
  }

  async getTotalSessions(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT COUNT(*) as count FROM sessions WHERE completed = 1`
    );

    return (result as any[])[0]?.count || 0;
  }

  async getAverageSessionDuration(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT AVG(duration) as avgDuration FROM sessions WHERE completed = 1`
    );

    return Math.round((result as any[])[0]?.avgDuration || 0);
  }

  async getMostProductiveHour(): Promise<number | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT strftime('%H', completed_at) as hour, COUNT(*) as count
       FROM sessions 
       WHERE completed = 1 AND completed_at IS NOT NULL
       GROUP BY hour
       ORDER BY count DESC
       LIMIT 1`
    );

    const hour = (result as any[])[0]?.hour;
    return hour ? parseInt(hour, 10) : null;
  }

  async getStreakData(): Promise<{ currentStreak: number; bestStreak: number }> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT current_streak, best_streak FROM user_stats LIMIT 1`
    );

    const stats = (result as any[])[0];
    return {
      currentStreak: stats?.current_streak || 0,
      bestStreak: stats?.best_streak || 0,
    };
  }

  async updateStreak(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(new Date(Date.now() - 86400000), 'yyyy-MM-dd');

    const todayResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count FROM sessions 
       WHERE completed = 1 AND DATE(completed_at) = ?`,
      [today]
    );

    const yesterdayResult = await this.db.getAllAsync(
      `SELECT COUNT(*) as count FROM sessions 
       WHERE completed = 1 AND DATE(completed_at) = ?`,
      [yesterday]
    );

    const hasSessionToday = (todayResult as any[])[0]?.count > 0;
    const hadSessionYesterday = (yesterdayResult as any[])[0]?.count > 0;

    const currentStats = await this.db.getAllAsync(
      `SELECT current_streak, best_streak FROM user_stats LIMIT 1`
    );

    let currentStreak = (currentStats as any[])[0]?.current_streak || 0;
    let bestStreak = (currentStats as any[])[0]?.best_streak || 0;

    if (hasSessionToday) {
      if (hadSessionYesterday) {
        currentStreak += 1;
      } else {
        currentStreak = 1;
      }

      if (currentStreak > bestStreak) {
        bestStreak = currentStreak;
      }

      await this.db.runAsync(
        `UPDATE user_stats SET current_streak = ?, best_streak = ?, updated_at = CURRENT_TIMESTAMP`,
        [currentStreak, bestStreak]
      );
    }
  }

  async getSessionsPerDay(days: number = 7): Promise<Array<{ date: string; count: number }>> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT DATE(completed_at) as date, COUNT(*) as count
       FROM sessions 
       WHERE completed = 1 AND completed_at >= datetime('now', '-${days} days')
       GROUP BY DATE(completed_at)
       ORDER BY date DESC`
    );

    return (result as any[]).map(item => ({
      date: item.date,
      count: item.count,
    }));
  }

  async getFocusTimePerDay(days: number = 7): Promise<Array<{ date: string; minutes: number }>> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT DATE(completed_at) as date, SUM(duration) as minutes
       FROM sessions 
       WHERE completed = 1 AND completed_at >= datetime('now', '-${days} days')
       GROUP BY DATE(completed_at)
       ORDER BY date DESC`
    );

    return (result as any[]).map(item => ({
      date: item.date,
      minutes: item.minutes || 0,
    }));
  }

  async getBreakSkipRate(days: number = 7): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT COUNT(*) as total, 
              SUM(CASE WHEN skipped = 1 THEN 1 ELSE 0 END) as skipped
       FROM breaks 
       WHERE created_at >= datetime('now', '-${days} days')`
    );

    const stats = (result as any[])[0];
    const total = stats?.total || 0;
    const skipped = stats?.skipped || 0;

    return total > 0 ? (skipped / total) * 100 : 0;
  }

  async getLastSessionDate(): Promise<Date | null> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT MAX(completed_at) as lastDate FROM sessions WHERE completed = 1`
    );

    const lastDate = (result as any[])[0]?.lastDate;
    return lastDate ? new Date(lastDate) : null;
  }

  async getUserLevel(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT level FROM user_stats LIMIT 1`
    );

    return (result as any[])[0]?.level || 1;
  }

  async getUserStars(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getAllAsync(
      `SELECT stars FROM user_stats LIMIT 1`
    );

    return (result as any[])[0]?.stars || 0;
  }

  async addStars(count: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE user_stats SET stars = stars + ?, updated_at = CURRENT_TIMESTAMP`,
      [count]
    );
  }

  async increaseLevel(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE user_stats SET level = level + 1, updated_at = CURRENT_TIMESTAMP`
    );
  }

  async resetDailyStreak(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE user_stats SET current_streak = 0, updated_at = CURRENT_TIMESTAMP`
    );
  }