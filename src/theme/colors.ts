export const colors = {
  // Primary Colors
  primary: {
    main: '#6C63FF',
    light: '#8B84FF',
    dark: '#4D46CC',
    contrast: '#FFFFFF',
  },

  // Secondary Colors
  secondary: {
    main: '#FF6584',
    light: '#FF8BA3',
    dark: '#CC5169',
    contrast: '#FFFFFF',
  },

  // Accent Colors
  accent: {
    purple: '#9D4EDD',
    pink: '#FF006E',
    orange: '#FF9E00',
    cyan: '#00D9FF',
    green: '#06FFA5',
  },

  // Emotion Colors
  emotions: {
    anxiety: '#FF6B6B',
    stress: '#FFA94D',
    sadness: '#4DABF7',
    anger: '#FF4757',
    fear: '#A55EEA',
    joy: '#FFD93D',
    calm: '#6BCF7F',
    neutral: '#95A5A6',
  },

  // Background Colors
  background: {
    primary: '#FFFFFF',
    secondary: '#F8F9FA',
    tertiary: '#E9ECEF',
    dark: '#1A1A2E',
    darkSecondary: '#16213E',
    darkTertiary: '#0F3460',
  },

  // Surface Colors
  surface: {
    white: '#FFFFFF',
    light: '#F8F9FA',
    medium: '#E9ECEF',
    dark: '#2C3E50',
    elevated: '#FFFFFF',
    darkElevated: '#2C3E50',
  },

  // Text Colors
  text: {
    primary: '#212529',
    secondary: '#6C757D',
    tertiary: '#ADB5BD',
    disabled: '#CED4DA',
    inverse: '#FFFFFF',
    link: '#6C63FF',
    darkPrimary: '#F8F9FA',
    darkSecondary: '#ADB5BD',
    darkTertiary: '#6C757D',
  },

  // Border Colors
  border: {
    light: '#E9ECEF',
    medium: '#DEE2E6',
    dark: '#CED4DA',
    focus: '#6C63FF',
    error: '#DC3545',
    darkLight: '#495057',
    darkMedium: '#343A40',
  },

  // Status Colors
  status: {
    success: '#28A745',
    warning: '#FFC107',
    error: '#DC3545',
    info: '#17A2B8',
    successLight: '#D4EDDA',
    warningLight: '#FFF3CD',
    errorLight: '#F8D7DA',
    infoLight: '#D1ECF1',
  },

  // Gradient Colors
  gradients: {
    primary: ['#6C63FF', '#8B84FF'],
    secondary: ['#FF6584', '#FF8BA3'],
    calm: ['#667EEA', '#764BA2'],
    energy: ['#F093FB', '#F5576C'],
    success: ['#4FACFE', '#00F2FE'],
    sunset: ['#FA709A', '#FEE140'],
    ocean: ['#2E3192', '#1BFFFF'],
    forest: ['#134E5E', '#71B280'],
    fire: ['#F2994A', '#F2C94C'],
    twilight: ['#4A00E0', '#8E2DE2'],
  },

  // Chart Colors
  chart: {
    primary: '#6C63FF',
    secondary: '#FF6584',
    tertiary: '#4DABF7',
    quaternary: '#FFD93D',
    quinary: '#06FFA5',
    grid: '#E9ECEF',
    darkGrid: '#343A40',
  },

  // Heatmap Colors
  heatmap: {
    level0: '#EBEDF0',
    level1: '#C6E48B',
    level2: '#7BC96F',
    level3: '#239A3B',
    level4: '#196127',
    darkLevel0: '#161B22',
    darkLevel1: '#0E4429',
    darkLevel2: '#006D32',
    darkLevel3: '#26A641',
    darkLevel4: '#39D353',
  },

  // Achievement Colors
  achievement: {
    bronze: '#CD7F32',
    silver: '#C0C0C0',
    gold: '#FFD700',
    platinum: '#E5E4E2',
    diamond: '#B9F2FF',
  },

  // Biometric Indicator Colors
  biometric: {
    heartRate: '#FF6B6B',
    hrv: '#4DABF7',
    stress: '#FFA94D',
    recovery: '#6BCF7F',
    sleep: '#A55EEA',
  },

  // Overlay Colors
  overlay: {
    light: 'rgba(0, 0, 0, 0.3)',
    medium: 'rgba(0, 0, 0, 0.5)',
    dark: 'rgba(0, 0, 0, 0.7)',
    white: 'rgba(255, 255, 255, 0.9)',
  },

  // Shadow Colors
  shadow: {
    light: 'rgba(0, 0, 0, 0.1)',
    medium: 'rgba(0, 0, 0, 0.2)',
    dark: 'rgba(0, 0, 0, 0.3)',
    colored: 'rgba(108, 99, 255, 0.3)',
  },

  // Transparent
  transparent: 'transparent',

  // Pure Colors
  pure: {
    white: '#FFFFFF',
    black: '#000000',
  },
};

export type Colors = typeof colors;

export const lightThemeColors = {
  primary: colors.primary.main,
  background: colors.background.primary,
  surface: colors.surface.white,
  text: colors.text.primary,
  textSecondary: colors.text.secondary,
  border: colors.border.light,
  error: colors.status.error,
  success: colors.status.success,
  warning: colors.status.warning,
  info: colors.status.info,
};

export const darkThemeColors = {
  primary: colors.primary.light,
  background: colors.background.dark,
  surface: colors.surface.darkElevated,
  text: colors.text.darkPrimary,
  textSecondary: colors.text.darkSecondary,
  border: colors.border.darkLight,
  error: colors.status.error,
  success: colors.status.success,
  warning: colors.status.warning,
  info: colors.status.info,
};

export type ThemeColors = typeof lightThemeColors;