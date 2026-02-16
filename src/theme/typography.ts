import { TextStyle } from 'react-native';
import { Platform } from 'react-native';

const fontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semiBold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
};

const fontWeights = {
  regular: '400' as TextStyle['fontWeight'],
  medium: '500' as TextStyle['fontWeight'],
  semiBold: '600' as TextStyle['fontWeight'],
  bold: '700' as TextStyle['fontWeight'],
};

export const typography = {
  // Display styles
  display1: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeights.bold,
    fontSize: 48,
    lineHeight: 56,
    letterSpacing: -0.5,
  } as TextStyle,

  display2: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeights.bold,
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.5,
  } as TextStyle,

  // Heading styles
  h1: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeights.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,

  h2: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeights.bold,
    fontSize: 28,
    lineHeight: 36,
    letterSpacing: -0.5,
  } as TextStyle,

  h3: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.25,
  } as TextStyle,

  h4: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 20,
    lineHeight: 28,
    letterSpacing: -0.25,
  } as TextStyle,

  h5: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  h6: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  } as TextStyle,

  // Body styles
  body1: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  } as TextStyle,

  body2: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
  } as TextStyle,

  body1Medium: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  } as TextStyle,

  body2Medium: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
  } as TextStyle,

  // Caption styles
  caption: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  captionMedium: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  // Overline styles
  overline: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 10,
    lineHeight: 16,
    letterSpacing: 1.5,
    textTransform: 'uppercase' as TextStyle['textTransform'],
  } as TextStyle,

  // Button styles
  button: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.5,
    textTransform: 'none' as TextStyle['textTransform'],
  } as TextStyle,

  buttonSmall: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.5,
    textTransform: 'none' as TextStyle['textTransform'],
  } as TextStyle,

  buttonLarge: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 18,
    lineHeight: 26,
    letterSpacing: 0.5,
    textTransform: 'none' as TextStyle['textTransform'],
  } as TextStyle,

  // Label styles
  label: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.25,
  } as TextStyle,

  labelSmall: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.25,
  } as TextStyle,

  // Special styles for specific use cases
  timer: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeights.bold,
    fontSize: 72,
    lineHeight: 80,
    letterSpacing: -1,
  } as TextStyle,

  emotionTitle: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeights.bold,
    fontSize: 36,
    lineHeight: 44,
    letterSpacing: -0.5,
  } as TextStyle,

  exerciseTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.25,
  } as TextStyle,

  statisticValue: {
    fontFamily: fontFamily.bold,
    fontWeight: fontWeights.bold,
    fontSize: 32,
    lineHeight: 40,
    letterSpacing: -0.5,
  } as TextStyle,

  statisticLabel: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  achievementTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 16,
    lineHeight: 22,
    letterSpacing: 0,
  } as TextStyle,

  achievementDescription: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.15,
  } as TextStyle,

  tabLabel: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.5,
  } as TextStyle,

  navigationTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 17,
    lineHeight: 22,
    letterSpacing: -0.25,
  } as TextStyle,

  cardTitle: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: 0,
  } as TextStyle,

  cardSubtitle: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
  } as TextStyle,

  inputLabel: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
  } as TextStyle,

  inputText: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: 0.15,
  } as TextStyle,

  errorText: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  helperText: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  tooltipText: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.4,
  } as TextStyle,

  badgeText: {
    fontFamily: fontFamily.semiBold,
    fontWeight: fontWeights.semiBold,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.5,
  } as TextStyle,

  chipText: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.15,
  } as TextStyle,

  link: {
    fontFamily: fontFamily.medium,
    fontWeight: fontWeights.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0.15,
    textDecorationLine: 'underline' as TextStyle['textDecorationLine'],
  } as TextStyle,

  quote: {
    fontFamily: fontFamily.regular,
    fontWeight: fontWeights.regular,
    fontSize: 18,
    lineHeight: 28,
    letterSpacing: 0.15,
    fontStyle: 'italic' as TextStyle['fontStyle'],
  } as TextStyle,

  code: {
    fontFamily: Platform.select({
      ios: 'Menlo',
      android: 'monospace',
      default: 'monospace',
    }),
    fontWeight: fontWeights.regular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  } as TextStyle,
};

export const fontSizes = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
  huge: 32,
  massive: 48,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
  loose: 2,
};

export const letterSpacings = {
  tighter: -0.5,
  tight: -0.25,
  normal: 0,
  wide: 0.15,
  wider: 0.4,
  widest: 1.5,
};

export type Typography = typeof typography;
export type FontSize = keyof typeof fontSizes;
export type LineHeight = keyof typeof lineHeights;
export type LetterSpacing = keyof typeof letterSpacings;

export default typography;