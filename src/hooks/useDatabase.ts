import { useEffect, useState, useCallback } from 'react';
import * as SQLite from 'expo-sqlite';
import { Session } from '../models/Session';
import { Achievement } from '../models/Achievement';
import { Settings } from '../models/Settings';

interface DatabaseContextType {
  db: SQLite.Database | null;
  isInitialized: boolean;
  error: string | null;
}

let database: SQLite.Database | null = null;

const initializeDatabase = async (): Promise<SQLite.Database> => {
  if (database) {
    return database;
  }

  try {
    database = await SQLite.openDatabaseAsync('mindflow.db');
    
    await database.execAsync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    await createTables(database);
    await initializeDefaultSettings(database);
    await initializeAchievements(database);
    await initializeUserStats(database);

    return database;
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

const createTables = async (db: SQLite.Database): Promise<void> => {
  try {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_name TEXT,
        duration INTEGER NOT NULL,
        completed BOOLEAN NOT NULL DEFAULT 0,
        paused_count INTEGER DEFAULT 0,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS breaks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id INTEGER,
        duration INTEGER NOT NULL,
        skipped BOOLEAN DEFAULT 0,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(session_id) REFERENCES sessions(id)
      );

      CREATE TABLE IF NOT EXISTS achievements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        unlocked BOOLEAN DEFAULT 0,
        unlocked_at TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS settings (
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
      );

      CREATE TABLE IF NOT EXISTS user_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        total_sessions INTEGER DEFAULT 0,
        total_focus_time INTEGER DEFAULT 0,
        total_breaks INTEGER DEFAULT 0,
        current_streak INTEGER DEFAULT 0,
        best_streak INTEGER DEFAULT 0,
        level INTEGER DEFAULT 1,
        stars INTEGER DEFAULT 0,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        sessions_count INTEGER DEFAULT 0,
        focus_time INTEGER DEFAULT 0,
        breaks_count INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);
      CREATE INDEX IF NOT EXISTS idx_breaks_session_id ON breaks(session_id);
      CREATE INDEX IF NOT EXISTS idx_breaks_created_at ON breaks(created_at);
      CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
    `);
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const initializeDefaultSettings = async (db: SQLite.Database): Promise<void> => {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM settings'
    );

    if (result && result.count === 0) {
      await db.runAsync(
        `INSERT INTO settings (
          session_duration, break_duration, daily_goal, 
          sound_enabled, vibration_enabled, notifications_blocked
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [15, 5, 5, 1, 1, 1]
      );
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
    throw error;
  }
};

const initializeAchievements = async (db: SQLite.Database): Promise<void> => {
  try {
    const achievements = [
      { type: 'first_session', title: 'Первый шаг', description: 'Завершите первую сессию' },
      { type: 'five_sessions', title: 'Пятерка', description: 'Завершите 5 сессий' },
      { type: 'ten_sessions', title: 'Десятка', description: 'Завершите 10 сессий' },
      { type: 'fifty_sessions', title: 'Половина сотни', description: 'Завершите 50 сессий' },
      { type: 'hundred_sessions', title: 'Сотня', description: 'Завершите 100 сессий' },
      { type: 'one_hour_focus', title: 'Час фокуса', description: 'Накопите 1 час фокуса' },
      { type: 'five_hour_focus', title: 'Пять часов', description: 'Накопите 5 часов фокуса' },
      { type: 'week_streak', title: 'Недельная серия', description: 'Работайте 7 дней подряд' },
      { type: 'month_streak', title: 'Месячная серия', description: 'Работайте 30 дней подряд' },
      { type: 'perfect_day', title: 'Идеальный день', description: 'Завершите дневную цель' },
    ];

    for (const achievement of achievements) {
      await db.runAsync(
        `INSERT OR IGNORE INTO achievements (type, title, description, unlocked)
         VALUES (?, ?, ?, 0)`,
        [achievement.type, achievement.title, achievement.description]
      );
    }
  } catch (error) {
    console.error('Error initializing achievements:', error);
    throw error;
  }
};

const initializeUserStats = async (db: SQLite.Database): Promise<void> => {
  try {
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM user_stats'
    );

    if (result && result.count === 0) {
      await db.runAsync(
        `INSERT INTO user_stats (
          total_sessions, total_focus_time, total_breaks,
          current_streak, best_streak, level, stars
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [0, 0, 0, 0, 0, 1, 0]
      );
    }
  } catch (error) {
    console.error('Error initializing user stats:', error);
    throw error;
  }
};

export const useDatabase = () => {
  const [state, setState] = useState<DatabaseContextType>({
    db: null,
    isInitialized: false,
    error: null,
  });

  useEffect(() => {
    const init = async () => {
      try {
        const db = await initializeDatabase();
        setState({
          db,
          isInitialized: true,
          error: null,
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState({
          db: null,
          isInitialized: false,
          error: errorMessage,
        });
      }
    };

    init();
  }, []);

  const executeQuery = useCallback(
    async <T,>(query: string, params: any[] = []): Promise<T[]> => {
      if (!state.db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await state.db.getAllAsync<T>(query, params);
        return result || [];
      } catch (error) {
        console.error('Query execution error:', error);
        throw error;
      }
    },
    [state.db]
  );

  const executeSingle = useCallback(
    async <T,>(query: string, params: any[] = []): Promise<T | null> => {
      if (!state.db) {
        throw new Error('Database not initialized');
      }
      try {
        const result = await state.db.getFirstAsync<T>(query, params);
        return result || null;
      } catch (error) {
        console.error('Single query execution error:', error);
        throw error;
      }
    },
    [state.db]
  );

  const executeUpdate = useCallback(
    async (query: string, params: any[] = []): Promise<void> => {
      if (!state.db) {
        throw new Error('Database not initialized');
      }
      try {
        await state.db.runAsync(query, params);
      } catch (error) {
        console.error('Update execution error:', error);
        throw error;
      }
    },
    [state.db]
  );

  const createSession = useCallback(
    async (taskName: string, duration: number): Promise<number> => {
      const startedAt = new Date().toISOString();
      await executeUpdate(
        `INSERT INTO sessions (task_name, duration, started_at)
         VALUES (?, ?, ?)`,
        [taskName || 'Фокус сессия', duration, startedAt]
      );
      const result = await executeSingle<{ id: number }>(
        'SELECT id FROM sessions ORDER BY id DESC LIMIT 1'
      );
      return result?.id || 0;
    },
    [executeUpdate, executeSingle]
  );

  const completeSession = useCallback(
    async (sessionId: number): Promise<void> => {
      const completedAt = new Date().toISOString();
      await executeUpdate(
        `UPDATE sessions SET completed = 1, completed_at = ? WHERE id = ?`,
        [completedAt, sessionId]
      );
    },
    [executeUpdate]
  );

  const createBreak = useCallback(
    async (sessionId: number, duration: number): Promise<number> => {
      const startedAt = new Date().toISOString();
      await executeUpdate(
        `INSERT INTO breaks (session_id, duration, started_at)
         VALUES (?, ?, ?)`,
        [sessionId, duration, startedAt]
      );
      const result = await executeSingle<{ id: number }>(
        'SELECT id FROM breaks ORDER BY id DESC LIMIT 1'
      );
      return result?.id || 0;
    },
    [executeUpdate, executeSingle]
  );

  const completeBreak = useCallback(
    async (breakId: number): Promise<void> => {
      const completedAt = new Date().toISOString();
      await executeUpdate(
        `UPDATE breaks SET completed_at = ? WHERE id = ?`,
        [completedAt, breakId]
      );
    },
    [executeUpdate]
  );

  const getSettings = useCallback(
    async (): Promise<Settings | null> => {
      return executeSingle<Settings>(
        'SELECT * FROM settings LIMIT 1'
      );
    },
    [executeSingle]
  );

  const updateSettings = useCallback(
    async (settings: Partial<Settings>): Promise<void> => {
      const updates = Object.entries(settings)
        .filter(([_, value]) => value !== undefined)
        .map(([key]) => `${key} = ?`)
        .join(', ');

      const values = Object.entries(settings)
        .filter(([_, value]) => value !== undefined)
        .map(([_, value]) => value);

      if (updates) {
        values.push(new Date().toISOString());
        await executeUpdate(
          `UPDATE settings SET ${updates}, updated_at = ?`,
          values
        );
      }
    },
    [executeUpdate]
  );

  const getSessions = useCallback(
    async (limit?: number): Promise<Session[]> => {
      const query = limit
        ? 'SELECT * FROM sessions ORDER BY created_at DESC LIMIT ?'
        : 'SELECT * FROM sessions ORDER BY created_at DESC';
      const params = limit ? [limit] : [];
      return executeQuery<Session>(query, params);
    },
    [executeQuery]
  );

  const getSessionsForDate = useCallback(
    async (date: string): Promise<Session[]> => {
      return executeQuery<Session>(
        `SELECT * FROM sessions 
         WHERE DATE(created_at) = ? 
         ORDER BY created_at DESC`,
        [date]
      );
    },
    [executeQuery]
  );

  const getAchievements = useCallback(
    async (): Promise<Achievement[]> => {
      return executeQuery<Achievement>(
        'SELECT * FROM achievements ORDER BY created_at ASC'
      );
    },
    [executeQuery]
  );

  const unlockAchievement = useCallback(
    async (type: string): Promise<void> => {
      const unlockedAt = new Date().toISOString();
      await executeUpdate(
        `UPDATE achievements SET unlocked = 1, unlocked_at = ? WHERE type = ?`,
        [unlockedAt, type]
      );
    },
    [executeUpdate]
  );

  const getUserStats = useCallback(
    async () => {
      return executeSingle(
        'SELECT * FROM user_stats LIMIT 1'
      );
    },
    [executeSingle]
  );

  const updateUserStats = useCallback(
    async (stats: any): Promise<void> => {
      const updates = Object.entries(stats)
        .map(([key]) => `${key} = ?`)
        .join(', ');

      const values = Object.entries(stats)
        .map(([_, value]) => value);

      values.push(new Date().toISOString());
      await executeUpdate(
        `UPDATE user_stats SET ${updates}, updated_at = ?`,
        values
      );
    },
    [executeUpdate]
  );

  const clearDatabase = useCallback(
    async (): Promise<void> => {
      if (!state.db) {
        throw new Error('Database not initialized');
      }
      try {
        await state.db.execAsync(`
          DELETE FROM breaks;
          DELETE FROM sessions;
          DELETE FROM daily_stats;
          UPDATE user_stats SET 
            total_sessions = 0,
            total_focus_time = 0,
            total_breaks = 0,
            current_streak = 0,
            level = 1,
            stars = 0;
        `);
      } catch (error) {
        console.error('Error clearing database:', error);
        throw error;
      }
    },
    [state.db]
  );

  return {
    ...state,
    executeQuery,
    executeSingle,
    executeUpdate,
    createSession,
    completeSession,
    createBreak,
    completeBreak,
    getSettings,
    updateSettings,
    getSessions,
    getSessionsForDate,
    getAchievements,
    unlockAchievement,
    getUserStats,
    updateUserStats,
    clearDatabase,
  };
};

export default useDatabase;