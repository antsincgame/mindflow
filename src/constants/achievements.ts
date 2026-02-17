import { Achievement } from '../models/Achievement';

export const ACHIEVEMENT_CATEGORIES = {
  STREAK: 'streak',
  SESSION_COUNT: 'session_count',
  TOTAL_TIME: 'total_time',
} as const;

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'streak_3',
    title: 'Начало пути',
    description: 'Практикуйте 3 дня подряд',
    category: 'streak',
    icon: '🔥',
    tier: 'bronze',
    isUnlocked: false,
    progress: { current: 0, total: 3 },
    unlockedAt: null,
  },
];