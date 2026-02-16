import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  ReactNode,
} from 'react';
import { Appearance, ColorSchemeName } from 'react-native';
import { lightColors, darkColors, ThemeColors } from './colors';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  colors: ThemeColors;
  isDark: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function resolveTheme(mode: ThemeMode, systemScheme: ColorSchemeName): ResolvedTheme {
  if (mode === 'auto') {
    return systemScheme === 'dark' ? 'dark' : 'light';
  }
  return mode;
}

interface ThemeProviderProps {
  children: ReactNode;
  initialMode?: ThemeMode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  initialMode = 'auto',
}) => {
  const [mode, setMode] = useState<ThemeMode>(initialMode);
  const [systemScheme, setSystemScheme] = useState<ColorSchemeName>(
    Appearance.getColorScheme()
  );

  useEffect(() => {
    const subscription = Appearance.addChangeListener(
      ({ colorScheme }: { colorScheme: ColorSchemeName }) => {
        setSystemScheme(colorScheme);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const setThemeMode = useCallback((newMode: ThemeMode) => {
    setMode(newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((current) => {
      if (current === 'auto') {
        const resolved = resolveTheme('auto', systemScheme);
        return resolved === 'light' ? 'dark' : 'light';
      }
      if (current === 'light') return 'dark';
      return 'light';
    });
  }, [systemScheme]);

  const value = useMemo<ThemeContextValue>(() => {
    const resolvedTheme = resolveTheme(mode, systemScheme);
    const isDark = resolvedTheme === 'dark';
    const colors = isDark ? darkColors : lightColors;

    return {
      mode,
      resolvedTheme,
      colors,
      isDark,
      setThemeMode,
      toggleTheme,
    };
  }, [mode, systemScheme, setThemeMode, toggleTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export function useThemeContext(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return context;
}

export default ThemeContext;