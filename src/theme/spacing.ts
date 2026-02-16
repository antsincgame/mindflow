export const spacing = {
  // Base spacing unit (4px)
  unit: 4,

  // Predefined spacing values
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  huge: 48,
  massive: 64,

  // Screen padding
  screenHorizontal: 20,
  screenVertical: 24,
  screenTop: 16,
  screenBottom: 24,

  // Card spacing
  cardPadding: 16,
  cardMargin: 12,
  cardGap: 16,

  // List spacing
  listItemPadding: 16,
  listItemGap: 12,
  listSectionGap: 24,

  // Button spacing
  buttonPadding: 16,
  buttonPaddingSmall: 12,
  buttonPaddingLarge: 20,
  buttonGap: 12,

  // Icon spacing
  iconMargin: 8,
  iconPadding: 4,
  iconGap: 12,

  // Input spacing
  inputPadding: 16,
  inputMargin: 12,
  inputGap: 8,

  // Header spacing
  headerPadding: 16,
  headerHeight: 56,
  headerMargin: 12,

  // Tab bar spacing
  tabBarHeight: 60,
  tabBarPadding: 8,
  tabBarIconSize: 24,

  // Modal spacing
  modalPadding: 24,
  modalMargin: 20,
  modalGap: 16,

  // Section spacing
  sectionGap: 24,
  sectionPadding: 20,
  sectionMargin: 16,

  // Border radius
  borderRadius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    base: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    full: 9999,
  },

  // Shadow/elevation spacing
  shadowOffset: {
    small: { width: 0, height: 2 },
    medium: { width: 0, height: 4 },
    large: { width: 0, height: 8 },
  },

  // Component specific spacing
  emotionCard: {
    padding: 20,
    margin: 16,
    gap: 12,
  },

  exerciseCard: {
    padding: 16,
    margin: 12,
    gap: 12,
  },

  achievementBadge: {
    padding: 12,
    margin: 8,
    gap: 8,
  },

  timer: {
    padding: 24,
    margin: 20,
    gap: 16,
  },

  chart: {
    padding: 16,
    margin: 12,
    gap: 16,
  },

  heatmap: {
    cellSize: 12,
    cellGap: 4,
    padding: 16,
  },

  // Animation distances
  swipeThreshold: 120,
  dragThreshold: 50,
  snapDistance: 100,

  // Hit slop for touchable areas
  hitSlop: {
    small: { top: 8, bottom: 8, left: 8, right: 8 },
    medium: { top: 12, bottom: 12, left: 12, right: 12 },
    large: { top: 16, bottom: 16, left: 16, right: 16 },
  },

  // Minimum touchable sizes (iOS HIG & Material Design)
  minTouchSize: 44,
  minTouchSizeAndroid: 48,

  // Safe area insets (fallback values)
  safeArea: {
    top: 44,
    bottom: 34,
    left: 0,
    right: 0,
  },
} as const;

export type Spacing = typeof spacing;

// Helper function to multiply spacing unit
export const space = (multiplier: number): number => spacing.unit * multiplier;

// Helper function to get responsive spacing based on screen size
export const getResponsiveSpacing = (
  baseValue: number,
  screenWidth: number
): number => {
  if (screenWidth < 375) {
    return baseValue * 0.875; // 87.5% for small screens
  } else if (screenWidth > 414) {
    return baseValue * 1.125; // 112.5% for large screens
  }
  return baseValue;
};

// Spacing presets for common layouts
export const spacingPresets = {
  screen: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingVertical: spacing.screenVertical,
  },
  card: {
    padding: spacing.cardPadding,
    marginBottom: spacing.cardMargin,
    borderRadius: spacing.borderRadius.base,
  },
  listItem: {
    paddingHorizontal: spacing.listItemPadding,
    paddingVertical: spacing.listItemPadding,
    marginBottom: spacing.listItemGap,
  },
  button: {
    paddingHorizontal: spacing.buttonPadding,
    paddingVertical: spacing.buttonPadding,
    borderRadius: spacing.borderRadius.md,
  },
  input: {
    paddingHorizontal: spacing.inputPadding,
    paddingVertical: spacing.inputPadding,
    borderRadius: spacing.borderRadius.md,
  },
  modal: {
    padding: spacing.modalPadding,
    margin: spacing.modalMargin,
    borderRadius: spacing.borderRadius.lg,
  },
} as const;

export default spacing;