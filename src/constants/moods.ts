export const MOOD_EMOJIS = {
  VERY_LOW: '😫',
  LOW: '😔',
  NEUTRAL: '😐',
  GOOD: '🙂',
  EXCELLENT: '😄',
} as const;

export const MOOD_LABELS = {
  VERY_LOW: 'Очень плохо',
  LOW: 'Плохо',
  NEUTRAL: 'Нормально',
  GOOD: 'Хорошо',
  EXCELLENT: 'Отлично',
} as const;

export const ENERGY_THRESHOLDS = {
  VERY_LOW: { min: 0, max: 20 },
  LOW: { min: 21, max: 40 },
  NEUTRAL: { min: 41, max: 60 },
  GOOD: { min: 61, max: 80 },
  EXCELLENT: { min: 81, max: 100 },
} as const;

export const ENERGY_COLORS = {
  VERY_LOW: '#EF4444',
  LOW: '#F97316',
  NEUTRAL: '#F59E0B',
  GOOD: '#10B981',
  EXCELLENT: '#14B8A6',
} as const;

export const MOOD_OPTIONS = [
  {
    emoji: MOOD_EMOJIS.VERY_LOW,
    label: MOOD_LABELS.VERY_LOW,
    value: 10,
    color: ENERGY_COLORS.VERY_LOW,
  },
  {
    emoji: MOOD_EMOJIS.LOW,
    label: MOOD_LABELS.LOW,
    value: 30,
    color: ENERGY_COLORS.LOW,
  },
  {
    emoji: MOOD_EMOJIS.NEUTRAL,
    label: MOOD_LABELS.NEUTRAL,
    value: 50,
    color: ENERGY_COLORS.NEUTRAL,
  },
  {
    emoji: MOOD_EMOJIS.GOOD,
    label: MOOD_LABELS.GOOD,
    value: 70,
    color: ENERGY_COLORS.GOOD,
  },
  {
    emoji: MOOD_EMOJIS.EXCELLENT,
    label: MOOD_LABELS.EXCELLENT,
    value: 90,
    color: ENERGY_COLORS.EXCELLENT,
  },
] as const;

export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export const TASK_PRIORITY_LABELS = {
  [TASK_PRIORITIES.LOW]: 'Низкий',
  [TASK_PRIORITIES.MEDIUM]: 'Средний',
  [TASK_PRIORITIES.HIGH]: 'Высокий',
} as const;

export const TASK_PRIORITY_COLORS = {
  [TASK_PRIORITIES.LOW]: '#94A3B8',
  [TASK_PRIORITIES.MEDIUM]: '#F59E0B',
  [TASK_PRIORITIES.HIGH]: '#EF4444',
} as const;

export const TASK_TYPES = {
  FOCUSED: 'focused',
  CREATIVE: 'creative',
  ROUTINE: 'routine',
  SOCIAL: 'social',
  PHYSICAL: 'physical',
  LEARNING: 'learning',
} as const;

export const TASK_TYPE_LABELS = {
  [TASK_TYPES.FOCUSED]: 'Сфокусированная работа',
  [TASK_TYPES.CREATIVE]: 'Творческая задача',
  [TASK_TYPES.ROUTINE]: 'Рутинная работа',
  [TASK_TYPES.SOCIAL]: 'Общение',
  [TASK_TYPES.PHYSICAL]: 'Физическая активность',
  [TASK_TYPES.LEARNING]: 'Обучение',
} as const;

export const TASK_TYPE_ICONS = {
  [TASK_TYPES.FOCUSED]: '🎯',
  [TASK_TYPES.CREATIVE]: '🎨',
  [TASK_TYPES.ROUTINE]: '📋',
  [TASK_TYPES.SOCIAL]: '👥',
  [TASK_TYPES.PHYSICAL]: '💪',
  [TASK_TYPES.LEARNING]: '📚',
} as const;

export const TASK_TYPE_ENERGY_REQUIREMENTS = {
  [TASK_TYPES.FOCUSED]: { min: 70, optimal: 80 },
  [TASK_TYPES.CREATIVE]: { min: 60, optimal: 75 },
  [TASK_TYPES.ROUTINE]: { min: 30, optimal: 50 },
  [TASK_TYPES.SOCIAL]: { min: 50, optimal: 65 },
  [TASK_TYPES.PHYSICAL]: { min: 55, optimal: 70 },
  [TASK_TYPES.LEARNING]: { min: 65, optimal: 80 },
} as const;

export const TASK_DURATIONS = [
  { label: '15 минут', value: 15 },
  { label: '30 минут', value: 30 },
  { label: '45 минут', value: 45 },
  { label: '1 час', value: 60 },
  { label: '1.5 часа', value: 90 },
  { label: '2 часа', value: 120 },
  { label: '3 часа', value: 180 },
  { label: '4 часа', value: 240 },
] as const;

export const DEFAULT_TASK_DURATION = 60;

export const ENERGY_PEAK_HOURS = {
  MORNING: { start: 9, end: 11 },
  AFTERNOON: { start: 14, end: 16 },
  EVENING: { start: 19, end: 21 },
} as const;

export const ENERGY_LOW_HOURS = {
  EARLY_MORNING: { start: 6, end: 8 },
  POST_LUNCH: { start: 12, end: 14 },
  LATE_EVENING: { start: 22, end: 23 },
} as const;

export const BREAK_INTERVALS = {
  MICRO: 5,
  SHORT: 10,
  MEDIUM: 15,
  LONG: 30,
} as const;

export const BREAK_INTERVAL_LABELS = {
  [BREAK_INTERVALS.MICRO]: 'Микропауза',
  [BREAK_INTERVALS.SHORT]: 'Короткий перерыв',
  [BREAK_INTERVALS.MEDIUM]: 'Средний перерыв',
  [BREAK_INTERVALS.LONG]: 'Длинный перерыв',
} as const;

export const RECOMMENDED_BREAK_FREQUENCY = 120;

export const MIN_ENERGY_FOR_TASK = 20;

export const OPTIMAL_ENERGY_RANGE = {
  min: 60,
  max: 90,
} as const;

export const ENERGY_DECAY_RATE = 5;

export const MOOD_CHECK_INTERVALS = {
  MORNING: { hour: 9, minute: 0 },
  AFTERNOON: { hour: 14, minute: 0 },
  EVENING: { hour: 20, minute: 0 },
} as const;

export const INSIGHTS_MIN_DATA_DAYS = 14;

export const PATTERN_CONFIDENCE_THRESHOLD = 0.7;

export const TASK_COLOR_PALETTE = [
  '#6366F1',
  '#14B8A6',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#EC4899',
  '#10B981',
  '#3B82F6',
  '#F97316',
  '#06B6D4',
] as const;

export const DEFAULT_TASK_COLOR = '#6366F1';

export type MoodEmojiType = typeof MOOD_EMOJIS[keyof typeof MOOD_EMOJIS];
export type TaskPriorityType = typeof TASK_PRIORITIES[keyof typeof TASK_PRIORITIES];
export type TaskTypeType = typeof TASK_TYPES[keyof typeof TASK_TYPES];