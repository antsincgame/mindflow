import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Session } from '../models/Session';
import { Statistics } from '../models/Statistics';
import { Achievement } from '../models/Achievement';
import { Settings } from '../models/Settings';
import { User } from '../models/User';

interface AppContextType {
  // Session state
  currentSession: Session | null;
  setCurrentSession: (session: Session | null) => void;
  isSessionActive: boolean;
  setIsSessionActive: (active: boolean) => void;
  isSessionPaused: boolean;
  setIsSessionPaused: (paused: boolean) => void;

  // Statistics state
  statistics: Statistics | null;
  setStatistics: (stats: Statistics) => void;
  updateStatistics: (updates: Partial<Statistics>) => void;

  // Achievements state
  achievements: Achievement[];
  setAchievements: (achievements: Achievement[]) => void;
  addAchievement: (achievement: Achievement) => void;
  unlockAchievement: (achievementId: number) => void;

  // Settings state
  settings: Settings | null;
  setSettings: (settings: Settings) => void;
  updateSettings: (updates: Partial<Settings>) => void;

  // User state
  user: User | null;
  setUser: (user: User) => void;
  updateUser: (updates: Partial<User>) => void;

  // UI state
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  error: string | null;
  setError: (error: string | null) => void;
  showNotification: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Session management
  startSession: (taskName?: string, duration?: number) => void;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => void;
  completeSession: () => void;

  // Reset
  reset: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  // Session state
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isSessionPaused, setIsSessionPaused] = useState(false);

  // Statistics state
  const [statistics, setStatistics] = useState<Statistics | null>(null);

  // Achievements state
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  // Settings state
  const [settings, setSettings] = useState<Settings | null>(null);

  // User state
  const [user, setUser] = useState<User | null>(null);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>>([]);

  // Statistics update
  const updateStatistics = useCallback((updates: Partial<Statistics>) => {
    setStatistics((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // Settings update
  const updateSettings = useCallback((updates: Partial<Settings>) => {
    setSettings((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // User update
  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  // Achievement management
  const addAchievement = useCallback((achievement: Achievement) => {
    setAchievements((prev) => [...prev, achievement]);
  }, []);

  const unlockAchievement = useCallback((achievementId: number) => {
    setAchievements((prev) =>
      prev.map((achievement) =>
        achievement.id === achievementId
          ? {
              ...achievement,
              unlocked: true,
              unlockedAt: new Date().toISOString(),
            }
          : achievement
      )
    );
  }, []);

  // Notification management
  const showNotification = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      const id = Math.random().toString(36).substr(2, 9);
      setNotifications((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        setNotifications((prev) => prev.filter((notif) => notif.id !== id));
      }, 3000);
    },
    []
  );

  // Session management
  const startSession = useCallback((taskName?: string, duration?: number) => {
    const newSession: Session = {
      id: Math.random(),
      taskName: taskName || 'Unnamed Task',
      duration: duration || (settings?.sessionDuration || 25) * 60,
      completed: false,
      pausedCount: 0,
      startedAt: new Date().toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
    };

    setCurrentSession(newSession);
    setIsSessionActive(true);
    setIsSessionPaused(false);
    showNotification('Сессия начата', 'success');
  }, [settings, showNotification]);

  const pauseSession = useCallback(() => {
    if (currentSession) {
      setIsSessionPaused(true);
      setCurrentSession({
        ...currentSession,
        pausedCount: currentSession.pausedCount + 1,
      });
      showNotification('Сессия поставлена на паузу', 'info');
    }
  }, [currentSession, showNotification]);

  const resumeSession = useCallback(() => {
    setIsSessionPaused(false);
    showNotification('Сессия продолжена', 'success');
  }, [showNotification]);

  const stopSession = useCallback(() => {
    setCurrentSession(null);
    setIsSessionActive(false);
    setIsSessionPaused(false);
    showNotification('Сессия остановлена', 'info');
  }, [showNotification]);

  const completeSession = useCallback(() => {
    if (currentSession) {
      const completedSession: Session = {
        ...currentSession,
        completed: true,
        completedAt: new Date().toISOString(),
      };

      setCurrentSession(completedSession);
      setIsSessionActive(false);
      setIsSessionPaused(false);

      if (statistics) {
        updateStatistics({
          totalSessions: statistics.totalSessions + 1,
          totalFocusTime: statistics.totalFocusTime + currentSession.duration,
          currentStreak: statistics.currentStreak + 1,
          bestStreak: Math.max(
            statistics.bestStreak,
            statistics.currentStreak + 1
          ),
        });
      }

      showNotification('Сессия завершена! 🎉', 'success');
    }
  }, [currentSession, statistics, updateStatistics, showNotification]);

  // Reset all state
  const reset = useCallback(() => {
    setCurrentSession(null);
    setIsSessionActive(false);
    setIsSessionPaused(false);
    setStatistics(null);
    setAchievements([]);
    setSettings(null);
    setUser(null);
    setIsLoading(false);
    setError(null);
    setNotifications([]);
  }, []);

  const value: AppContextType = {
    // Session state
    currentSession,
    setCurrentSession,
    isSessionActive,
    setIsSessionActive,
    isSessionPaused,
    setIsSessionPaused,

    // Statistics state
    statistics,
    setStatistics,
    updateStatistics,

    // Achievements state
    achievements,
    setAchievements,
    addAchievement,
    unlockAchievement,

    // Settings state
    settings,
    setSettings,
    updateSettings,

    // User state
    user,
    setUser,
    updateUser,

    // UI state
    isLoading,
    setIsLoading,
    error,
    setError,
    showNotification,

    // Session management
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    completeSession,

    // Reset
    reset,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export default AppContext;