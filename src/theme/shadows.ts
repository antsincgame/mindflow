import { Platform } from 'react-native';

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  small: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  medium: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  large: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.25,
    shadowRadius: 12,
    elevation: 12,
  },
  extraLarge: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: Platform.OS === 'ios' ? 0.12 : 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  button: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.15 : 0.22,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonPressed: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: Platform.OS === 'ios' ? 0.1 : 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  modal: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: Platform.OS === 'ios' ? 0.3 : 0.35,
    shadowRadius: 20,
    elevation: 20,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  timer: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: Platform.OS === 'ios' ? 0.25 : 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  achievement: {
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: Platform.OS === 'ios' ? 0.2 : 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
} as const;

export type ShadowType = keyof typeof shadows;

export const getShadowStyle = (shadowType: ShadowType = 'medium') => {
  return shadows[shadowType];
};

export const combineShadows = (
  primaryShadow: ShadowType = 'medium',
  secondaryShadow?: ShadowType,
) => {
  if (!secondaryShadow) {
    return shadows[primaryShadow];
  }

  const primary = shadows[primaryShadow];
  const secondary = shadows[secondaryShadow];

  return {
    shadowColor: primary.shadowColor,
    shadowOffset: {
      width: Math.max(primary.shadowOffset.width, secondary.shadowOffset.width),
      height: Math.max(primary.shadowOffset.height, secondary.shadowOffset.height),
    },
    shadowOpacity: Math.max(primary.shadowOpacity, secondary.shadowOpacity),
    shadowRadius: Math.max(primary.shadowRadius, secondary.shadowRadius),
    elevation: Math.max(primary.elevation, secondary.elevation),
  };
};