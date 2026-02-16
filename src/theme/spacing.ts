export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const borderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 999,
} as const;

export const sizes = {
  icon: {
    xs: 16,
    sm: 20,
    md: 24,
    lg: 32,
    xl: 48,
    xxl: 64,
  },
  button: {
    sm: {
      height: 36,
      paddingHorizontal: spacing.md,
    },
    md: {
      height: 44,
      paddingHorizontal: spacing.lg,
    },
    lg: {
      height: 52,
      paddingHorizontal: spacing.xl,
    },
  },
  input: {
    height: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  modal: {
    borderRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  screen: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
} as const;

export const screenPadding = {
  horizontal: spacing.lg,
  vertical: spacing.lg,
} as const;

export const componentSpacing = {
  gap: spacing.md,
  itemSpacing: spacing.lg,
  sectionSpacing: spacing.xxl,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Sizes = typeof sizes;