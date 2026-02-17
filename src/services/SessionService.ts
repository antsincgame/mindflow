import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'mindflow_sessions';

export interface SessionRecord {
  taskName: string;
  duration: number;
  completed: boolean;
  pausedCount: number;
  startedAt: Date;
  completedAt: Date;
}

interface StoredSession {
  taskName: string;
  duration: number;
  completed: boolean;
  pausedCount: number;
  startedAt: string;
  completedAt: string;
}

export class SessionService {
  static async saveSession(session: SessionRecord): Promise<void> {
    try {
      const existing = await this.getStoredSessions();
      const stored: StoredSession = {
        ...session,
        startedAt: session.startedAt.toISOString(),
        completedAt: session.completedAt.toISOString(),
      };
      existing.push(stored);
      await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(existing));
    } catch (error) {
      console.error('SessionService.saveSession error:', error);
    }
  }

  static async getSessions(): Promise<SessionRecord[]> {
    try {
      const stored = await this.getStoredSessions();
      return stored.map((s) => ({
        ...s,
        startedAt: new Date(s.startedAt),
        completedAt: new Date(s.completedAt),
      }));
    } catch (error) {
      console.error('SessionService.getSessions error:', error);
      return [];
    }
  }

  static async clearSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(SESSIONS_KEY);
    } catch (error) {
      console.error('SessionService.clearSessions error:', error);
    }
  }

  private static async getStoredSessions(): Promise<StoredSession[]> {
    const json = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!json) return [];
    try {
      return JSON.parse(json);
    } catch {
      return [];
    }
  }
}
