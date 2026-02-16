import { colors } from './colors';
import { typography } from './typography';
import { spacing } from './spacing';

export interface Theme {
  colors: typeof colors.light;
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: {
    small: number;
    medium: number;
    large: number;
    full: number;
  };
  shadows: {
    small: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    medium: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
    large: {
      shadowColor: string;
      shadowOffset: { width: number; height: number };
      shadowOpacity: number;
      shadowRadius: number;
      elevation: number;
    };
  };
  animation: {
    duration: {
      fast: number;
      normal: number;
      slow: number;
    };
    easing: {
      linear: string;
      easeIn: string;
      easeOut: string;
      easeInOut: string;
    };
  };
}

const borderRadius = {
  small: 8,
  medium: 12,
  large: 16,
  full: 9999,
};

const shadows = {
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

const animation = {
  duration: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
  easing: {
    linear: 'linear',
    easeIn: 'ease-in',
    easeOut: 'ease-out',
    easeInOut: 'ease-in-out',
  },
};

export const lightTheme: Theme = {
  colors: colors.light,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
};

export const darkTheme: Theme = {
  colors: colors.dark,
  typography,
  spacing,
  borderRadius,
  shadows: {
    small: {
      ...shadows.small,
      shadowColor: '#fff',
      shadowOpacity: 0.05,
    },
    medium: {
      ...shadows.medium,
      shadowColor: '#fff',
      shadowOpacity: 0.08,
    },
    large: {
      ...shadows.large,
      shadowColor: '#fff',
      shadowOpacity: 0.12,
    },
  },
  animation,
};

export const theme = {
  light: lightTheme,
  dark: darkTheme,
};

export type ThemeMode = 'light' | 'dark';

export default theme;