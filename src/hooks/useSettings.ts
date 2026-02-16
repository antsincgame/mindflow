import { useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Settings } from '../models/Settings';
import { DatabaseService } from '../services/DatabaseService';

const SETTINGS_STORAGE_KEY = 'mindflow_settings';

const DEFAULT_SETTINGS: Settings = {
  sessionDuration: 25,
  breakDuration: 5,
  dailyGoal: 5,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsBlocked: true,
  workStartTime: '09:00',
  workEndTime: '17:00',
  theme: 'light',
  language: 'en',
};

export const useSettings = () => {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const db = await DatabaseService.getInstance();
      const dbSettings = await db.getSettings();

      if (dbSettings) {
        setSettings(dbSettings);
      } else {
        setSettings(DEFAULT_SETTINGS);
      }

      const cachedSettings = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
      if (cachedSettings) {
        const parsed = JSON.parse(cachedSettings);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load settings';
      setError(errorMessage);
      console.error('Error loading settings:', err);
      setSettings(DEFAULT_SETTINGS);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateSettings = useCallback(
    async (newSettings: Partial<Settings>) => {
      try {
        setError(null);
        const updatedSettings = { ...settings, ...newSettings };
        setSettings(updatedSettings);

        const db = await DatabaseService.getInstance();
        await db.updateSettings(updatedSettings);

        await AsyncStorage.setItem(
          SETTINGS_STORAGE_KEY,
          JSON.stringify(updatedSettings)
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to update settings';
        setError(errorMessage);
        console.error('Error updating settings:', err);
        await loadSettings();
      }
    },
    [settings, loadSettings]
  );

  const updateSessionDuration = useCallback(
    async (duration: number) => {
      if (duration < 1 || duration > 120) {
        setError('Session duration must be between 1 and 120 minutes');
        return;
      }
      await updateSettings({ sessionDuration: duration });
    },
    [updateSettings]
  );

  const updateBreakDuration = useCallback(
    async (duration: number) => {
      if (duration < 1 || duration > 60) {
        setError('Break duration must be between 1 and 60 minutes');
        return;
      }
      await updateSettings({ breakDuration: duration });
    },
    [updateSettings]
  );

  const updateDailyGoal = useCallback(
    async (goal: number) => {
      if (goal < 1 || goal > 100) {
        setError('Daily goal must be between 1 and 100 sessions');
        return;
      }
      await updateSettings({ dailyGoal: goal });
    },
    [updateSettings]
  );

  const toggleSound = useCallback(async () => {
    await updateSettings({ soundEnabled: !settings.soundEnabled });
  }, [settings.soundEnabled, updateSettings]);

  const toggleVibration = useCallback(async () => {
    await updateSettings({ vibrationEnabled: !settings.vibrationEnabled });
  }, [settings.vibrationEnabled, updateSettings]);

  const toggleNotificationsBlocked = useCallback(async () => {
    await updateSettings({ notificationsBlocked: !settings.notificationsBlocked });
  }, [settings.notificationsBlocked, updateSettings]);

  const updateWorkStartTime = useCallback(
    async (time: string) => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        setError('Invalid time format. Use HH:MM');
        return;
      }
      await updateSettings({ workStartTime: time });
    },
    [updateSettings]
  );

  const updateWorkEndTime = useCallback(
    async (time: string) => {
      const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(time)) {
        setError('Invalid time format. Use HH:MM');
        return;
      }
      await updateSettings({ workEndTime: time });
    },
    [updateSettings]
  );

  const updateTheme = useCallback(
    async (theme: 'light' | 'dark') => {
      await updateSettings({ theme });
    },
    [updateSettings]
  );

  const updateLanguage = useCallback(
    async (language: string) => {
      await updateSettings({ language });
    },
    [updateSettings]
  );

  const resetToDefaults = useCallback(async () => {
    try {
      setError(null);
      setSettings(DEFAULT_SETTINGS);

      const db = await DatabaseService.getInstance();
      await db.updateSettings(DEFAULT_SETTINGS);

      await AsyncStorage.setItem(
        SETTINGS_STORAGE_KEY,
        JSON.stringify(DEFAULT_SETTINGS)
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reset settings';
      setError(errorMessage);
      console.error('Error resetting settings:', err);
    }
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSettings,
    updateSessionDuration,
    updateBreakDuration,
    updateDailyGoal,
    toggleSound,
    toggleVibration,
    toggleNotificationsBlocked,
    updateWorkStartTime,
    updateWorkEndTime,
    updateTheme,
    updateLanguage,
    resetToDefaults,
    loadSettings,
  };
};