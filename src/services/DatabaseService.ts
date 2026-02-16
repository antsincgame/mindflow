import * as SQLite from 'expo-sqlite';
import { Session } from '../models/Session';
import { Achievement } from '../models/Achievement';
import { Settings } from '../models/Settings';
import { UserStats } from '../models/User';

export class DatabaseService {
  private static instance: DatabaseService;
  private db: SQLite.SQLiteDatabase | null = null;

  private constructor() {}

  static getInstance(): DatabaseService {
    if (!DatabaseService.instance) {
      DatabaseService.instance = new DatabaseService();
    }
    return DatabaseService.instance;
  }

  async initialize(): Promise<void> {
    try {
      this.db = await SQLite.openDatabaseAsync('mindflow.db');
      await this.createTables();
      await this.initializeDefaultSettings();
      await this.initializeUserStats();
      await this.initializeAchievements();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const tables = [
      `CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_name TEXT,
        duration INTEGER NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0,
        paused_count INTEGER DEFAULT 0,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS breaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        duration INTEGER NOT NULL,
        skipped BOOLEAN DEFAULT 0,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      )`,
      
      `CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        unlocked BOOLEAN DEFAULT 0,
        unlocked_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_duration INTEGER DEFAULT 15,
        break_duration INTEGER DEFAULT 5,
        daily_goal INTEGER DEFAULT 5,
        sound_enabled BOOLEAN DEFAULT 1,
        vibration_enabled BOOLEAN DEFAULT 1,
        notifications_blocked BOOLEAN DEFAULT 1,
        work_start_time TEXT DEFAULT '09:00',
        work_end_time TEXT DEFAULT '17:00',
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_sessions INTEGER DEFAULT 0,
        total_focus_time INTEGER DEFAULT 0,
        total_breaks INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        stars INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      )`
    ];

    for (const table of tables) {
      await this.db.execAsync(table);
    }
  }

  private async initializeDefaultSettings(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM settings'
    );

    if (result && result.count === 0) {
      await this.db.runAsync(
        `INSERT INTO settings (session_duration, break_duration, daily_goal, sound_enabled, vibration_enabled, notifications_blocked)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [15, 5, 5, 1, 1, 1]
      );
    }
  }

  private async initializeUserStats(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_stats'
    );

    if (result && result.count === 0) {
      await this.db.runAsync(
        `INSERT INTO user_stats (total_sessions, total_focus_time, total_breaks, current_streak, best_streak, level, stars)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [0, 0, 0, 0, 0, 1, 0]
      );
    }
  }

  private async initializeAchievements(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const achievements = [
      { type: 'first_session', title: 'Первая сессия', description: 'Завершите первую сессию фокуса' },
      { type: 'five_sessions', title: 'Пять сессий', description: 'Завершите 5 сессий' },
      { type: 'ten_sessions', title: 'Десять сессий', description: 'Завершите 10 сессий' },
      { type: 'fifty_sessions', title: 'Пятьдесят сессий', description: 'Завершите 50 сессий' },
      { type: 'one_hour', title: 'Час фокуса', description: 'Накопите 1 час времени фокуса' },
      { type: 'five_hours', title: 'Пять часов', description: 'Накопите 5 часов времени фокуса' },
      { type: 'daily_goal', title: 'Дневная цель', description: 'Достигните дневной цели' },
      { type: 'week_streak', title: 'Неделя подряд', description: 'Занимайтесь 7 дней подряд' },
      { type: 'month_streak', title: 'Месяц подряд', description: 'Занимайтесь 30 дней подряд' },
      { type: 'no_pause', title: 'Без пауз', description: 'Завершите сессию без пауз' }
    ];

    for (const achievement of achievements) {
      try {
        await this.db.runAsync(
          `INSERT OR IGNORE INTO achievements (type, title, description, unlocked)
           VALUES (?, ?, ?, ?)`,
          [achievement.type, achievement.title, achievement.description, 0]
        );
      } catch (error) {
        console.error(`Error inserting achievement ${achievement.type}:`, error);
      }
    }
  }

  // Session methods
  async createSession(taskName: string, duration: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      `INSERT INTO sessions (task_name, duration, started_at)
       VALUES (?, ?, ?)`,
      [taskName || 'Сессия фокуса', duration, new Date().toISOString()]
    );

    return result.lastInsertRowId as number;
  }

  async completeSession(sessionId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE sessions SET completed = 1, completed_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), sessionId]
    );
  }

  async updateSessionPauseCount(sessionId: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE sessions SET paused_count = paused_count + 1
       WHERE id = ?`,
      [sessionId]
    );
  }

  async getSession(sessionId: number): Promise<Session | null> {
    if (!this.db) throw new Error('Database not initialized');

    const session = await this.db.getFirstAsync<Session>(
      'SELECT * FROM sessions WHERE id = ?',
      [sessionId]
    );

    return session || null;
  }

  async getAllSessions(): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sessions = await this.db.getAllAsync<Session>(
      'SELECT * FROM sessions ORDER BY created_at DESC'
    );

    return sessions || [];
  }

  async getSessionsByDateRange(startDate: string, endDate: string): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');

    const sessions = await this.db.getAllAsync<Session>(
      `SELECT * FROM sessions 
       WHERE created_at >= ? AND created_at <= ?
       ORDER BY created_at DESC`,
      [startDate, endDate]
    );

    return sessions || [];
  }

  async getTodaySessions(): Promise<Session[]> {
    if (!this.db) throw new Error('Database not initialized');

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sessions = await this.db.getAllAsync<Session>(
      `SELECT * FROM sessions 
       WHERE created_at >= ? AND created_at < ?
       ORDER BY created_at DESC`,
      [today.toISOString(), tomorrow.toISOString()]
    );

    return sessions || [];
  }

  async getCompletedSessionsCount(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sessions WHERE completed = 1'
    );

    return result?.count || 0;
  }

  async getTotalFocusTime(): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ total: number }>(
      'SELECT SUM(duration) as total FROM sessions WHERE completed = 1'
    );

    return result?.total || 0;
  }

  // Break methods
  async createBreak(sessionId: number, duration: number): Promise<number> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.runAsync(
      `INSERT INTO breaks (session_id, duration, started_at)
       VALUES (?, ?, ?)`,
      [sessionId, duration, new Date().toISOString()]
    );

    return result.lastInsertRowId as number;
  }

  async completeBreak(breakId: number, skipped: boolean = false): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE breaks SET completed_at = ?, skipped = ?
       WHERE id = ?`,
      [new Date().toISOString(), skipped ? 1 : 0, breakId]
    );
  }

  async getBreaksBySessionId(sessionId: number): Promise<any[]> {
    if (!this.db) throw new Error('Database not initialized');

    const breaks = await this.db.getAllAsync(
      'SELECT * FROM breaks WHERE session_id = ? ORDER BY created_at DESC',
      [sessionId]
    );

    return breaks || [];
  }

  // Achievement methods
  async getAchievements(): Promise<Achievement[]> {
    if (!this.db) throw new Error('Database not initialized');

    const achievements = await this.db.getAllAsync<Achievement>(
      'SELECT * FROM achievements ORDER BY created_at ASC'
    );

    return achievements || [];
  }

  async unlockAchievement(type: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      `UPDATE achievements SET unlocked = 1, unlocked_at = ?
       WHERE type = ?`,
      [new Date().toISOString(), type]
    );
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    if (!this.db) throw new Error('Database not initialized');

    const achievements = await this.db.getAllAsync<Achievement>(
      'SELECT * FROM achievements WHERE unlocked = 1 ORDER BY unlocked_at DESC'
    );

    return achievements || [];
  }

  async isAchievementUnlocked(type: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');

    const result = await this.db.getFirstAsync<{ unlocked: number }>(
      'SELECT unlocked FROM achievements WHERE type = ?',
      [type]
    );

    return result?.unlocked === 1;
  }

  // Settings methods
  async getSettings(): Promise<Settings> {
    if (!this.db) throw new Error('Database not initialized');

    const settings = await this.db.getFirstAsync<Settings>(
      'SELECT * FROM settings LIMIT 1'
    );

    return settings || this.getDefaultSettings();
  }

  async updateSettings(settings: Partial<Settings>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const keys = Object.keys(settings).filter(key => key !== 'id');
    const values = keys.map(key => settings[key as keyof Settings]);
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const query = `UPDATE settings SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`;

    await this.db.runAsync(query, values);
  }

  private getDefaultSettings(): Settings {
    return {
      id: 1,
      session_duration: 15,
      break_duration: 5,
      daily_goal: 5,
      sound_enabled: true,
      vibration_enabled: true,
      notifications_blocked: true,
      work_start_time: '09:00',
      work_end_time: '17:00',
      updated_at: new Date().toISOString()
    };
  }

  // User stats methods
  async getUserStats(): Promise<UserStats> {
    if (!this.db) throw new Error('Database not initialized');

    const stats = await this.db.getFirstAsync<UserStats>(
      'SELECT * FROM user_stats LIMIT 1'
    );

    return stats || this.getDefaultUserStats();
  }

  async updateUserStats(stats: Partial<UserStats>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const keys = Object.keys(stats).filter(key => key !== 'id');
    const values = keys.map(key => stats[key as keyof UserStats]);
    
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const query = `UPDATE user_stats SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = 1`;

    await this.db.runAsync(query, values);
  }

  async incrementTotalSessions(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE user_stats SET total_sessions = total_sessions + 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
    );
  }

  async addFocusTime(minutes: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE user_stats SET total_focus_time = total_focus_time + ?, updated_at = CURRENT_TIMESTAMP WHERE id = 1',
      [minutes]
    );
  }

  async incrementBreaks(): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    await this.db.runAsync(
      'UPDATE user_stats SET total_breaks = total_breaks + 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1'
    );
  }

  async updateStreak(currentStreak: number, bestStr