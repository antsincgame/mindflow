export enum AchievementCategory {
  CONSISTENCY = 'consistency',
  MILESTONE = 'milestone',
  MASTERY = 'mastery',
  EXPLORATION = 'exploration',
  WELLNESS = 'wellness',
}

export enum AchievementTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum',
}

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  progress: AchievementProgress;
  isUnlocked: boolean;
  unlockedAt?: Date;
  points: number;
  requirements: AchievementRequirement[];
}

export interface AchievementRequirement {
  type: RequirementType;
  value: number;
  description: string;
}

export enum RequirementType {
  TOTAL_SESSIONS = 'total_sessions',
  CONSECUTIVE_DAYS = 'consecutive_days',
  SPECIFIC_EMOTION = 'specific_emotion',
  SPECIFIC_EXERCISE = 'specific_exercise',
  SESSION_DURATION = 'session_duration',
  WEEKLY_GOAL = 'weekly_goal',
  MONTHLY_GOAL = 'monthly_goal',
  STRESS_REDUCTION = 'stress_reduction',
  ALL_EMOTIONS = 'all_emotions',
  ALL_EXERCISES = 'all_exercises',
  PERFECT_WEEK = 'perfect_week',
  EARLY_BIRD = 'early_bird',
  NIGHT_OWL = 'night_owl',
  WEEKEND_WARRIOR = 'weekend_warrior',
}

export interface UnlockedAchievement extends Achievement {
  unlockedAt: Date;
  isNew: boolean;
}

export interface AchievementStats {
  totalUnlocked: number;
  totalPoints: number;
  byCategory: Record<AchievementCategory, number>;
  byTier: Record<AchievementTier, number>;
  recentUnlocks: UnlockedAchievement[];
  nextToUnlock: Achievement[];
}

export interface AchievementNotification {
  achievement: Achievement;
  timestamp: Date;
  shown: boolean;
}

export const ACHIEVEMENT_POINTS: Record<AchievementTier, number> = {
  [AchievementTier.BRONZE]: 10,
  [AchievementTier.SILVER]: 25,
  [AchievementTier.GOLD]: 50,
  [AchievementTier.PLATINUM]: 100,
};

export const ACHIEVEMENT_CATEGORY_ICONS: Record<AchievementCategory, string> = {
  [AchievementCategory.CONSISTENCY]: '🔥',
  [AchievementCategory.MILESTONE]: '🎯',
  [AchievementCategory.MASTERY]: '👑',
  [AchievementCategory.EXPLORATION]: '🧭',
  [AchievementCategory.WELLNESS]: '💚',
};

export const ACHIEVEMENT_TIER_COLORS: Record<AchievementTier, string> = {
  [AchievementTier.BRONZE]: '#CD7F32',
  [AchievementTier.SILVER]: '#C0C0C0',
  [AchievementTier.GOLD]: '#FFD700',
  [AchievementTier.PLATINUM]: '#E5E4E2',
};