import AsyncStorage from '@react-native-async-storage/async-storage';
import { Session } from '../models/Session';
import { UserSettings } from '../models/UserSettings';
import { Achievement } from '../models/Achievement';

const STORAGE_KEYS = {
  SESSIONS: '@mindful_sessions',
  SETTINGS: '@mindful_settings',
  ACHIEVEMENTS: '@mindful_achievements',
  ONBOARDING_COMPLETED: '@mindful_onboarding',
  SELECTED_EMOTION: '@mindful_selected_emotion',
  STREAK_DATA: '@mindful_streak',
  LAST_SESSION_DATE: '@mindful_last_session',
  TOTAL_SESSIONS: '@mindful_total_sessions',
  FAVORITE_EXERCISES: '@mindful_favorites',
} as const;

class StorageService {
  // Sessions
  async saveSessions(sessions: Session[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(sessions);
      await AsyncStorage.setItem(STORAGE_KEYS.SESSIONS, jsonValue);
    } catch (error) {
      console.error('Error saving sessions:', error);
      throw error;
    }
  }

  async getSessions(): Promise<Session[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SESSIONS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting sessions:', error);
      return [];
    }
  }

  async addSession(session: Session): Promise<void> {
    try {
      const sessions = await this.getSessions();
      sessions.push(session);
      await this.saveSessions(sessions);
      await this.updateLastSessionDate(session.completedAt);
      await this.incrementTotalSessions();
    } catch (error) {
      console.error('Error adding session:', error);
      throw error;
    }
  }

  async getSessionsByDateRange(startDate: Date, endDate: Date): Promise<Session[]> {
    try {
      const sessions = await this.getSessions();
      return sessions.filter(session => {
        const sessionDate = new Date(session.completedAt);
        return sessionDate >= startDate && sessionDate <= endDate;
      });
    } catch (error) {
      console.error('Error getting sessions by date range:', error);
      return [];
    }
  }

  async getSessionsByEmotion(emotionId: string): Promise<Session[]> {
    try {
      const sessions = await this.getSessions();
      return sessions.filter(session => session.emotionId === emotionId);
    } catch (error) {
      console.error('Error getting sessions by emotion:', error);
      return [];
    }
  }

  async getSessionsByExercise(exerciseId: string): Promise<Session[]> {
    try {
      const sessions = await this.getSessions();
      return sessions.filter(session => session.exerciseId === exerciseId);
    } catch (error) {
      console.error('Error getting sessions by exercise:', error);
      return [];
    }
  }

  async deleteSession(sessionId: string): Promise<void> {
    try {
      const sessions = await this.getSessions();
      const filteredSessions = sessions.filter(session => session.id !== sessionId);
      await this.saveSessions(filteredSessions);
    } catch (error) {
      console.error('Error deleting session:', error);
      throw error;
    }
  }

  async clearSessions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SESSIONS);
    } catch (error) {
      console.error('Error clearing sessions:', error);
      throw error;
    }
  }

  // Settings
  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      const jsonValue = JSON.stringify(settings);
      await AsyncStorage.setItem(STORAGE_KEYS.SETTINGS, jsonValue);
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  async getSettings(): Promise<UserSettings | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error('Error getting settings:', error);
      return null;
    }
  }

  async updateSettings(partialSettings: Partial<UserSettings>): Promise<void> {
    try {
      const currentSettings = await this.getSettings();
      const updatedSettings = { ...currentSettings, ...partialSettings } as UserSettings;
      await this.saveSettings(updatedSettings);
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  // Achievements
  async saveAchievements(achievements: Achievement[]): Promise<void> {
    try {
      const jsonValue = JSON.stringify(achievements);
      await AsyncStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, jsonValue);
    } catch (error) {
      console.error('Error saving achievements:', error);
      throw error;
    }
  }

  async getAchievements(): Promise<Achievement[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting achievements:', error);
      return [];
    }
  }

  async unlockAchievement(achievementId: string): Promise<void> {
    try {
      const achievements = await this.getAchievements();
      const achievement = achievements.find(a => a.id === achievementId);
      if (achievement && !achievement.isUnlocked) {
        achievement.isUnlocked = true;
        achievement.unlockedAt = new Date();
        await this.saveAchievements(achievements);
      }
    } catch (error) {
      console.error('Error unlocking achievement:', error);
      throw error;
    }
  }

  async getUnlockedAchievements(): Promise<Achievement[]> {
    try {
      const achievements = await this.getAchievements();
      return achievements.filter(a => a.isUnlocked);
    } catch (error) {
      console.error('Error getting unlocked achievements:', error);
      return [];
    }
  }

  // Onboarding
  async setOnboardingCompleted(completed: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETED, JSON.stringify(completed));
    } catch (error) {
      console.error('Error setting onboarding completed:', error);
      throw error;
    }
  }

  async isOnboardingCompleted(): Promise<boolean> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETED);
      return value === 'true';
    } catch (error) {
      console.error('Error checking onboarding completed:', error);
      return false;
    }
  }

  // Selected Emotion
  async saveSelectedEmotion(emotionId: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.SELECTED_EMOTION, emotionId);
    } catch (error) {
      console.error('Error saving selected emotion:', error);
      throw error;
    }
  }

  async getSelectedEmotion(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.SELECTED_EMOTION);
    } catch (error) {
      console.error('Error getting selected emotion:', error);
      return null;
    }
  }

  async clearSelectedEmotion(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.SELECTED_EMOTION);
    } catch (error) {
      console.error('Error clearing selected emotion:', error);
      throw error;
    }
  }

  // Streak Data
  async getStreakData(): Promise<{ currentStreak: number; longestStreak: number; lastSessionDate: string | null }> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.STREAK_DATA);
      return jsonValue != null
        ? JSON.parse(jsonValue)
        : { currentStreak: 0, longestStreak: 0, lastSessionDate: null };
    } catch (error) {
      console.error('Error getting streak data:', error);
      return { currentStreak: 0, longestStreak: 0, lastSessionDate: null };
    }
  }

  async updateStreakData(currentStreak: number, longestStreak: number, lastSessionDate: string): Promise<void> {
    try {
      const streakData = { currentStreak, longestStreak, lastSessionDate };
      const jsonValue = JSON.stringify(streakData);
      await AsyncStorage.setItem(STORAGE_KEYS.STREAK_DATA, jsonValue);
    } catch (error) {
      console.error('Error updating streak data:', error);
      throw error;
    }
  }

  // Last Session Date
  async updateLastSessionDate(date: Date): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SESSION_DATE, date.toISOString());
    } catch (error) {
      console.error('Error updating last session date:', error);
      throw error;
    }
  }

  async getLastSessionDate(): Promise<Date | null> {
    try {
      const dateString = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SESSION_DATE);
      return dateString ? new Date(dateString) : null;
    } catch (error) {
      console.error('Error getting last session date:', error);
      return null;
    }
  }

  // Total Sessions
  async incrementTotalSessions(): Promise<void> {
    try {
      const total = await this.getTotalSessions();
      await AsyncStorage.setItem(STORAGE_KEYS.TOTAL_SESSIONS, (total + 1).toString());
    } catch (error) {
      console.error('Error incrementing total sessions:', error);
      throw error;
    }
  }

  async getTotalSessions(): Promise<number> {
    try {
      const value = await AsyncStorage.getItem(STORAGE_KEYS.TOTAL_SESSIONS);
      return value ? parseInt(value, 10) : 0;
    } catch (error) {
      console.error('Error getting total sessions:', error);
      return 0;
    }
  }

  // Favorite Exercises
  async addFavoriteExercise(exerciseId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteExercises();
      if (!favorites.includes(exerciseId)) {
        favorites.push(exerciseId);
        await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_EXERCISES, JSON.stringify(favorites));
      }
    } catch (error) {
      console.error('Error adding favorite exercise:', error);
      throw error;
    }
  }

  async removeFavoriteExercise(exerciseId: string): Promise<void> {
    try {
      const favorites = await this.getFavoriteExercises();
      const filteredFavorites = favorites.filter(id => id !== exerciseId);
      await AsyncStorage.setItem(STORAGE_KEYS.FAVORITE_EXERCISES, JSON.stringify(filteredFavorites));
    } catch (error) {
      console.error('Error removing favorite exercise:', error);
      throw error;
    }
  }

  async getFavoriteExercises(): Promise<string[]> {
    try {
      const jsonValue = await AsyncStorage.getItem(STORAGE_KEYS.FAVORITE_EXERCISES);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (error) {
      console.error('Error getting favorite exercises:', error);
      return [];
    }
  }

  async isFavoriteExercise(exerciseId: string): Promise<boolean> {
    try {
      const favorites = await this.getFavoriteExercises();
      return favorites.includes(exerciseId);
    } catch (error) {
      console.error('Error checking favorite exercise:', error);
      return false;
    }
  }

  // Statistics
  async getSessionsCount(): Promise<number> {
    try {
      const sessions = await this.getSessions();
      return sessions.length;
    } catch (error) {
      console.error('Error getting sessions count:', error);
      return 0;
    }
  }

  async getTotalMeditationTime(): Promise<number> {
    try {
      const sessions = await this.getSessions();
      return sessions.reduce((total, session) => total + session.duration, 0);
    } catch (error) {
      console.error('Error getting total meditation time:', error);
      return 0;
    }
  }

  async getSessionsCountByMonth(year: number, month: number): Promise<number> {
    try {
      const sessions = await this.getSessions();
      return sessions.filter(session => {
        const sessionDate = new Date(session.completedAt);
        return sessionDate.getFullYear() === year && sessionDate.getMonth() === month;
      }).length;
    } catch (error) {
      console.error('Error getting sessions count by month:', error);
      return 0;
    }
  }

  async getAverageSessionDuration(): Promise<number> {
    try {
      const sessions = await this.getSessions();
      if (sessions.length === 0) return 0;
      const totalDuration = sessions.reduce((sum, session) => sum + session.duration, 0);
      return Math.round(totalDuration / sessions.length);
    } catch (error) {
      console.error('Error getting average session duration:', error);
      return 0;
    }
  }

  async getMostUsedEmotion(): Promise<string | null> {
    try {
      const sessions = await this.getSessions();
      if (sessions.length === 0) return null;

      const emotionCounts: { [key: string]: number } = {};
      sessions.forEach(session => {
        emotionCounts[session.emotionId] = (emotionCounts[session.emotionId] || 0) + 1;
      });

      return Object.keys(emotionCounts).reduce((a, b) =>
        emotionCounts[a] > emotionCounts[b] ? a : b
      );
    } catch (error) {
      console.error('Error getting most used emotion:', error);
      return null;
    }
  }

  async getMostUsedExercise(): Promise<string | null> {
    try {
      const sessions = await this.getSessions();
      if (sessions.length === 0) return null;

      const exerciseCounts: { [key: string]: number } = {};
      sessions.forEach(session => {
        exerciseCounts[session.exerciseId] = (exerciseCounts[session.exerciseId] || 0) + 1;
      });

      return Object.keys(exerciseCounts).reduce((a, b) =>
        exerciseCounts[a] > exerciseCounts[b] ? a : b
      );
    } catch (error) {
      console.error('Error getting most used exercise:', error);
      return null;
    }
  }

  // Clear All Data
  async clearAllData(): Promise<void> {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw error;
    }
  }

  // Export/Import Data
  async exportData(): Promise<string> {
    try {
      const sessions = await this.getSessions();
      const settings = await this.getSettings();
      const achievements = await this.getAchievements();
      const streakData = await this.getStreakData();
      const favorites = await this.getFavoriteExercises();

      const exportData = {
        sessions,
        settings,
        achievements,