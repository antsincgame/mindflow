import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme, ThemeColors, ThemeType } from '../theme/theme';

const THEME_STORAGE_KEY = '@breath_theme_preference';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  themeMode: ThemeMode;
  activeTheme: ThemeType;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

export const useTheme = (): UseThemeReturn => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [isLoading, setIsLoading] = useState(true);

  // Определяем активную тему на основе режима
  const getActiveTheme = useCallback((): ThemeType => {
    if (themeMode === 'system') {
      return systemColorScheme === 'dark' ? 'dark' : 'light';
    }
    return themeMode;
  }, [themeMode, systemColorScheme]);

  const activeTheme = getActiveTheme();
  const colors = theme[activeTheme];
  const isDark = activeTheme === 'dark';

  // Загрузка сохраненной темы при монтировании
  useEffect(() => {
    loadThemePreference();
  }, []);

  // Сохранение темы при изменении
  useEffect(() => {
    if (!isLoading) {
      saveThemePreference(themeMode);
    }
  }, [themeMode, isLoading]);

  const loadThemePreference = async (): Promise<void> => {
    try {
      const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'system')) {
        setThemeModeState(savedTheme as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = async (mode: ThemeMode): Promise<void> => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const setThemeMode = async (mode: ThemeMode): Promise<void> => {
    setThemeModeState(mode);
  };

  const toggleTheme = async (): Promise<void> => {
    const newMode: ThemeMode = activeTheme === 'light' ? 'dark' : 'light';
    await setThemeMode(newMode);
  };

  return {
    themeMode,
    activeTheme,
    colors,
    isDark,
    setThemeMode,
    toggleTheme,
  };
};

export default useTheme;