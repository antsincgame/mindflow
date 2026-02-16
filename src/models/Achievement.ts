import { z } from 'zod';

export enum AchievementType {
  FIRST_SESSION = 'first_session',
  FIVE_SESSIONS = 'five_sessions',
  TEN_SESSIONS = 'ten_sessions',
  FIFTY_SESSIONS = 'fifty_sessions',
  HUNDRED_SESSIONS = 'hundred_sessions',
  ONE_HOUR_FOCUS = 'one_hour_focus',
  FIVE_HOURS_FOCUS = 'five_hours_focus',
  TWENTY_HOURS_FOCUS = 'twenty_hours_focus',
  HUNDRED_HOURS_FOCUS = 'hundred_hours_focus',
  PERFECT_DAY = 'perfect_day',
  WEEK_STREAK = 'week_streak',
  MONTH_STREAK = 'month_streak',
  NO_SKIPS = 'no_skips',
  EARLY_BIRD = 'early_bird',
  NIGHT_OWL = 'night_owl',
  CONSISTENT_WORKER = 'consistent_worker',
  LEVEL_5 = 'level_5',
  LEVEL_10 = 'level_10',
  HUNDRED_STARS = 'hundred_stars',
  SPEED_DEMON = 'speed_demon',
  MARATHON = 'marathon',
}

export enum AchievementCategory {
  SESSIONS = 'sessions',
  TIME = 'time',
  STREAKS = 'streaks',
  CONSISTENCY = 'consistency',
  LEVELS = 'levels',
  SPECIAL = 'special',
}

export interface AchievementCondition {
  type: 'sessions' | 'focus_time' | 'streak' | 'level' | 'stars' | 'daily_goal' | 'no_breaks' | 'time_of_day';
  value: number;
  comparator?: 'equals' | 'greater_than' | 'greater_equal' | 'less_than' | 'less_equal';
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
}

export interface Achievement {
  id: number;
  type: AchievementType;
  title: string;
  description: string;
  category: AchievementCategory;
  icon: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  reward: {
    stars: number;
    xp: number;
  };
  conditions: AchievementCondition[];
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  progressMax: number;
  createdAt: string;
  updatedAt: string;
}

export interface AchievementProgress {
  achievementId: AchievementType;
  currentValue: number;
  targetValue: number;
  percentage: number;
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface AchievementUnlockEvent {
  achievementType: AchievementType;
  unlockedAt: string;
  reward: {
    stars: number;
    xp: number;
  };
}

export const AchievementSchema = z.object({
  id: z.number(),
  type: z.nativeEnum(AchievementType),
  title: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  category: z.nativeEnum(AchievementCategory),
  icon: z.string(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary']),
  reward: z.object({
    stars: z.number().min(0),
    xp: z.number().min(0),
  }),
  conditions: z.array(z.object({
    type: z.enum(['sessions', 'focus_time', 'streak', 'level', 'stars', 'daily_goal', 'no_breaks', 'time_of_day']),
    value: z.number().min(0),
    comparator: z.enum(['equals', 'greater_than', 'greater_equal', 'less_than', 'less_equal']).optional(),
    timeframe: z.enum(['daily', 'weekly', 'monthly', 'all_time']).optional(),
  })),
  unlocked: z.boolean(),
  unlockedAt: z.string().nullable(),
  progress: z.number().min(0),
  progressMax: z.number().min(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AchievementValidated = z.infer<typeof AchievementSchema>;

export const AchievementProgressSchema = z.object({
  achievementId: z.nativeEnum(AchievementType),
  currentValue: z.number().min(0),
  targetValue: z.number().min(0),
  percentage: z.number().min(0).max(100),
  isUnlocked: z.boolean(),
  unlockedAt: z.string().nullable(),
});

export type AchievementProgressValidated = z.infer<typeof AchievementProgressSchema>;

export const ACHIEVEMENT_DEFINITIONS: Record<AchievementType, Omit<Achievement, 'id' | 'unlocked' | 'unlockedAt' | 'progress' | 'progressMax' | 'createdAt' | 'updatedAt'>> = {
  [AchievementType.FIRST_SESSION]: {
    type: AchievementType.FIRST_SESSION,
    title: 'Первый шаг',
    description: 'Завершите вашу первую сессию фокуса',
    category: AchievementCategory.SESSIONS,
    icon: '🎯',
    rarity: 'common',
    reward: { stars: 10, xp: 50 },
    conditions: [{ type: 'sessions', value: 1, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.FIVE_SESSIONS]: {
    type: AchievementType.FIVE_SESSIONS,
    title: 'Пять сессий',
    description: 'Завершите 5 сессий фокуса',
    category: AchievementCategory.SESSIONS,
    icon: '⭐',
    rarity: 'uncommon',
    reward: { stars: 25, xp: 100 },
    conditions: [{ type: 'sessions', value: 5, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.TEN_SESSIONS]: {
    type: AchievementType.TEN_SESSIONS,
    title: 'Десять сессий',
    description: 'Завершите 10 сессий фокуса',
    category: AchievementCategory.SESSIONS,
    icon: '✨',
    rarity: 'uncommon',
    reward: { stars: 50, xp: 200 },
    conditions: [{ type: 'sessions', value: 10, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.FIFTY_SESSIONS]: {
    type: AchievementType.FIFTY_SESSIONS,
    title: 'Полвека сессий',
    description: 'Завершите 50 сессий фокуса',
    category: AchievementCategory.SESSIONS,
    icon: '🏆',
    rarity: 'rare',
    reward: { stars: 100, xp: 500 },
    conditions: [{ type: 'sessions', value: 50, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.HUNDRED_SESSIONS]: {
    type: AchievementType.HUNDRED_SESSIONS,
    title: 'Столетие сессий',
    description: 'Завершите 100 сессий фокуса',
    category: AchievementCategory.SESSIONS,
    icon: '👑',
    rarity: 'epic',
    reward: { stars: 250, xp: 1000 },
    conditions: [{ type: 'sessions', value: 100, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.ONE_HOUR_FOCUS]: {
    type: AchievementType.ONE_HOUR_FOCUS,
    title: 'Час фокуса',
    description: 'Накопите 1 час времени фокуса',
    category: AchievementCategory.TIME,
    icon: '⏰',
    rarity: 'uncommon',
    reward: { stars: 30, xp: 150 },
    conditions: [{ type: 'focus_time', value: 60, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.FIVE_HOURS_FOCUS]: {
    type: AchievementType.FIVE_HOURS_FOCUS,
    title: 'Пять часов фокуса',
    description: 'Накопите 5 часов времени фокуса',
    category: AchievementCategory.TIME,
    icon: '⏳',
    rarity: 'rare',
    reward: { stars: 75, xp: 400 },
    conditions: [{ type: 'focus_time', value: 300, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.TWENTY_HOURS_FOCUS]: {
    type: AchievementType.TWENTY_HOURS_FOCUS,
    title: 'Двадцать часов фокуса',
    description: 'Накопите 20 часов времени фокуса',
    category: AchievementCategory.TIME,
    icon: '🌟',
    rarity: 'epic',
    reward: { stars: 150, xp: 800 },
    conditions: [{ type: 'focus_time', value: 1200, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.HUNDRED_HOURS_FOCUS]: {
    type: AchievementType.HUNDRED_HOURS_FOCUS,
    title: 'Сотня часов фокуса',
    description: 'Накопите 100 часов времени фокуса',
    category: AchievementCategory.TIME,
    icon: '💎',
    rarity: 'legendary',
    reward: { stars: 500, xp: 2000 },
    conditions: [{ type: 'focus_time', value: 6000, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.PERFECT_DAY]: {
    type: AchievementType.PERFECT_DAY,
    title: 'Идеальный день',
    description: 'Достигните дневную цель сессий',
    category: AchievementCategory.CONSISTENCY,
    icon: '☀️',
    rarity: 'uncommon',
    reward: { stars: 40, xp: 200 },
    conditions: [{ type: 'daily_goal', value: 1, comparator: 'greater_equal', timeframe: 'daily' }],
  },
  [AchievementType.WEEK_STREAK]: {
    type: AchievementType.WEEK_STREAK,
    title: 'Неделя подряд',
    description: 'Сохраняйте серию в течение 7 дней',
    category: AchievementCategory.STREAKS,
    icon: '🔥',
    rarity: 'rare',
    reward: { stars: 100, xp: 500 },
    conditions: [{ type: 'streak', value: 7, comparator: 'greater_equal', timeframe: 'weekly' }],
  },
  [AchievementType.MONTH_STREAK]: {
    type: AchievementType.MONTH_STREAK,
    title: 'Месяц подряд',
    description: 'Сохраняйте серию в течение 30 дней',
    category: AchievementCategory.STREAKS,
    icon: '🌪️',
    rarity: 'epic',
    reward: { stars: 300, xp: 1500 },
    conditions: [{ type: 'streak', value: 30, comparator: 'greater_equal', timeframe: 'monthly' }],
  },
  [AchievementType.NO_SKIPS]: {
    type: AchievementType.NO_SKIPS,
    title: 'Без пропусков',
    description: 'Завершите сессию без пропуска перерывов',
    category: AchievementCategory.CONSISTENCY,
    icon: '✅',
    rarity: 'common',
    reward: { stars: 15, xp: 75 },
    conditions: [{ type: 'no_breaks', value: 1, comparator: 'equals', timeframe: 'daily' }],
  },
  [AchievementType.EARLY_BIRD]: {
    type: AchievementType.EARLY_BIRD,
    title: 'Ранняя пташка',
    description: 'Завершите сессию до 8 утра',
    category: AchievementCategory.SPECIAL,
    icon: '🌅',
    rarity: 'uncommon',
    reward: { stars: 25, xp: 125 },
    conditions: [{ type: 'time_of_day', value: 8, comparator: 'less_than', timeframe: 'daily' }],
  },
  [AchievementType.NIGHT_OWL]: {
    type: AchievementType.NIGHT_OWL,
    title: 'Ночная сова',
    description: 'Завершите сессию после 10 вечера',
    category: AchievementCategory.SPECIAL,
    icon: '🌙',
    rarity: 'uncommon',
    reward: { stars: 25, xp: 125 },
    conditions: [{ type: 'time_of_day', value: 22, comparator: 'greater_equal', timeframe: 'daily' }],
  },
  [AchievementType.CONSISTENT_WORKER]: {
    type: AchievementType.CONSISTENT_WORKER,
    title: 'Последовательный работник',
    description: 'Завершите сессию каждый день в течение недели',
    category: AchievementCategory.CONSISTENCY,
    icon: '💪',
    rarity: 'rare',
    reward: { stars: 80, xp: 400 },
    conditions: [{ type: 'daily_goal', value: 7, comparator: 'greater_equal', timeframe: 'weekly' }],
  },
  [AchievementType.LEVEL_5]: {
    type: AchievementType.LEVEL_5,
    title: 'Уровень 5',
    description: 'Достигните уровня 5',
    category: AchievementCategory.LEVELS,
    icon: '📈',
    rarity: 'uncommon',
    reward: { stars: 50, xp: 250 },
    conditions: [{ type: 'level', value: 5, comparator: 'greater_equal', timeframe: 'all_time' }],
  },
  [AchievementType.LEVEL_10]: {
    type: AchievementType.LEVEL