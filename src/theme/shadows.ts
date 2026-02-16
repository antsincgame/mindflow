import { Platform, ViewStyle } from 'react-native';

export interface ShadowStyle {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
}

export interface ShadowLevel {
  none: ShadowStyle;
  xs: ShadowStyle;
  sm: ShadowStyle;
  md: ShadowStyle;
  lg: ShadowStyle;
  xl: ShadowStyle;
}

export interface ThemeShadows {
  light: ShadowLevel;
  dark: ShadowLevel;
}

const lightShadows: ShadowLevel = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
  },
};

const darkShadows: ShadowLevel = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 1,
  },
  sm: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

export const shadows: ThemeShadows = {
  light: lightShadows,
  dark: darkShadows,
};

export const getShadows = (isDark: boolean): ShadowLevel => {
  return isDark ? shadows.dark : shadows.light;
};

export const applyShadow = (shadow: ShadowStyle): ViewStyle => {
  if (Platform.OS === 'android') {
    return {
      elevation: shadow.elevation,
    };
  }

  return {
    shadowColor: shadow.shadowColor,
    shadowOffset: shadow.shadowOffset,
    shadowOpacity: shadow.shadowOpacity,
    shadowRadius: shadow.shadowRadius,
  };
};

// Semantic shadow aliases for common use cases
export interface SemanticShadows {
  card: ShadowStyle;
  cardHovered: ShadowStyle;
  cardPressed: ShadowStyle;
  button: ShadowStyle;
  buttonPressed: ShadowStyle;
  emotionCard: ShadowStyle;
  exerciseCard: ShadowStyle;
  modal: ShadowStyle;
  tabBar: ShadowStyle;
  widget: ShadowStyle;
  floatingAction: ShadowStyle;
  badge: ShadowStyle;
}

export const getSemanticShadows = (isDark: boolean): SemanticShadows => {
  const level = getShadows(isDark);

  return {
    card: level.sm,
    cardHovered: level.md,
    cardPressed: level.xs,
    button: level.sm,
    buttonPressed: level.none,
    emotionCard: level.md,
    exerciseCard: level.sm,
    modal: level.xl,
    tabBar: level.md,
    widget: level.sm,
    floatingAction: level.lg,
    badge: level.xs,
  };
};

// Colored shadow utilities for emotion cards
export const coloredShadow = (
  color: string,
  level: 'sm' | 'md' | 'lg' = 'md',
  isDark: boolean = false
): ShadowStyle => {
  const baseOpacity = isDark ? 0.3 : 0.15;

  const config: Record<string, { offset: number; radius: number; opacity: number; elevation: number }> = {
    sm: { offset: 2, radius: 6, opacity: baseOpacity, elevation: 2 },
    md: { offset: 4, radius: 10, opacity: baseOpacity * 1.2, elevation: 4 },
    lg: { offset: 6, radius: 16, opacity: baseOpacity * 1.4, elevation: 6 },
  };

  const cfg = config[level];

  return {
    shadowColor: color,
    shadowOffset: { width: 0, height: cfg.offset },
    shadowOpacity: cfg.opacity,
    shadowRadius: cfg.radius,
    elevation: cfg.elevation,
  };
};

export default shadows;