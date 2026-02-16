import { Achievement } from '../models/Achievement';

export const ACHIEVEMENT_DEFINITIONS: Achievement[] = [
  {
    id: 'first_session',
    type: 'milestone',
    title: 'Первый шаг',
    description: 'Завершите вашу первую сессию фокуса',
    icon: '🚀',
    reward: 10,
    condition: (stats) => stats.totalSessions >= 1,
    rarity: 'common',
  },
  {
    id: 'five_sessions',
    type: 'milestone',
    title: 'Пять сессий',
    description: 'Завершите 5 сессий фокуса',
    icon: '⭐',
    reward: 25,
    condition: (stats) => stats.totalSessions >= 5,
    rarity: 'common',
  },
  {
    id: 'ten_sessions',
    type: 'milestone',
    title: 'Десять сессий',
    description: 'Завершите 10 сессий фокуса',
    icon: '✨',
    reward: 50,
    condition: (stats) => stats.totalSessions >= 10,
    rarity: 'uncommon',
  },
  {
    id: 'twenty_sessions',
    type: 'milestone',
    title: 'Двадцать сессий',
    description: 'Завершите 20 сессий фокуса',
    icon: '🌟',
    reward: 100,
    condition: (stats) => stats.totalSessions >= 20,
    rarity: 'uncommon',
  },
  {
    id: 'fifty_sessions',
    type: 'milestone',
    title: 'Полусотня',
    description: 'Завершите 50 сессий фокуса',
    icon: '👑',
    reward: 250,
    condition: (stats) => stats.totalSessions >= 50,
    rarity: 'rare',
  },
  {
    id: 'hundred_sessions',
    type: 'milestone',
    title: 'Столетие',
    description: 'Завершите 100 сессий фокуса',
    icon: '💎',
    reward: 500,
    condition: (stats) => stats.totalSessions >= 100,
    rarity: 'epic',
  },
  {
    id: 'one_hour_focus',
    type: 'duration',
    title: 'Час фокуса',
    description: 'Наберите 60 минут фокуса',
    icon: '⏱️',
    reward: 50,
    condition: (stats) => stats.totalFocusTime >= 60,
    rarity: 'uncommon',
  },
  {
    id: 'five_hours_focus',
    type: 'duration',
    title: 'Пять часов',
    description: 'Наберите 5 часов фокуса',
    icon: '🔥',
    reward: 150,
    condition: (stats) => stats.totalFocusTime >= 300,
    rarity: 'uncommon',
  },
  {
    id: 'ten_hours_focus',
    type: 'duration',
    title: 'Десять часов',
    description: 'Наберите 10 часов фокуса',
    icon: '⚡',
    reward: 300,
    condition: (stats) => stats.totalFocusTime >= 600,
    rarity: 'rare',
  },
  {
    id: 'fifty_hours_focus',
    type: 'duration',
    title: 'Пятьдесят часов',
    description: 'Наберите 50 часов фокуса',
    icon: '🌠',
    reward: 750,
    condition: (stats) => stats.totalFocusTime >= 3000,
    rarity: 'epic',
  },
  {
    id: 'hundred_hours_focus',
    type: 'duration',
    title: 'Сотня часов',
    description: 'Наберите 100 часов фокуса',
    icon: '🏆',
    reward: 1500,
    condition: (stats) => stats.totalFocusTime >= 6000,
    rarity: 'legendary',
  },
  {
    id: 'three_day_streak',
    type: 'streak',
    title: 'Три дня подряд',
    description: 'Завершите сессии 3 дня подряд',
    icon: '🔗',
    reward: 75,
    condition: (stats) => stats.currentStreak >= 3,
    rarity: 'uncommon',
  },
  {
    id: 'seven_day_streak',
    type: 'streak',
    title: 'Неделя фокуса',
    description: 'Завершите сессии 7 дней подряд',
    icon: '🌈',
    reward: 200,
    condition: (stats) => stats.currentStreak >= 7,
    rarity: 'rare',
  },
  {
    id: 'fourteen_day_streak',
    type: 'streak',
    title: 'Две недели',
    description: 'Завершите сессии 14 дней подряд',
    icon: '💪',
    reward: 400,
    condition: (stats) => stats.currentStreak >= 14,
    rarity: 'epic',
  },
  {
    id: 'thirty_day_streak',
    type: 'streak',
    title: 'Месячный марафон',
    description: 'Завершите сессии 30 дней подряд',
    icon: '🎯',
    reward: 1000,
    condition: (stats) => stats.currentStreak >= 30,
    rarity: 'legendary',
  },
  {
    id: 'level_five',
    type: 'level',
    title: 'Уровень 5',
    description: 'Достигните уровня 5',
    icon: '📈',
    reward: 100,
    condition: (stats) => stats.level >= 5,
    rarity: 'uncommon',
  },
  {
    id: 'level_ten',
    type: 'level',
    title: 'Уровень 10',
    description: 'Достигните уровня 10',
    icon: '⬆️',
    reward: 250,
    condition: (stats) => stats.level >= 10,
    rarity: 'rare',
  },
  {
    id: 'level_twenty',
    type: 'level',
    title: 'Уровень 20',
    description: 'Достигните уровня 20',
    icon: '🚀',
    reward: 500,
    condition: (stats) => stats.level >= 20,
    rarity: 'epic',
  },
  {
    id: 'level_fifty',
    type: 'level',
    title: 'Уровень 50',
    description: 'Достигните уровня 50',
    icon: '👑',
    reward: 1500,
    condition: (stats) => stats.level >= 50,
    rarity: 'legendary',
  },
  {
    id: 'daily_goal_once',
    type: 'goal',
    title: 'Дневная цель',
    description: 'Достигните дневную цель один раз',
    icon: '🎯',
    reward: 50,
    condition: (stats) => stats.dailyGoalsCompleted >= 1,
    rarity: 'common',
  },
  {
    id: 'daily_goal_week',
    type: 'goal',
    title: 'Неделя целей',
    description: 'Достигните дневную цель 7 дней подряд',
    icon: '📅',
    reward: 200,
    condition: (stats) => stats.dailyGoalsCompleted >= 7,
    rarity: 'uncommon',
  },
  {
    id: 'daily_goal_month',
    type: 'goal',
    title: 'Месячная цель',
    description: 'Достигните дневную цель 30 дней подряд',
    icon: '🏅',
    reward: 500,
    condition: (stats) => stats.dailyGoalsCompleted >= 30,
    rarity: 'rare',
  },
  {
    id: 'perfect_session',
    type: 'special',
    title: 'Идеальная сессия',
    description: 'Завершите сессию без пауз',
    icon: '✅',
    reward: 75,
    condition: (stats) => stats.perfectSessions >= 1,
    rarity: 'uncommon',
  },
  {
    id: 'five_perfect_sessions',
    type: 'special',
    title: 'Пять совершенств',
    description: 'Завершите 5 сессий без пауз',
    icon: '💯',
    reward: 200,
    condition: (stats) => stats.perfectSessions >= 5,
    rarity: 'rare',
  },
  {
    id: 'early_bird',
    type: 'special',
    title: 'Жаворонок',
    description: 'Завершите сессию до 9:00 утра',
    icon: '🌅',
    reward: 50,
    condition: (stats) => stats.earlyBirdSessions >= 1,
    rarity: 'uncommon',
  },
  {
    id: 'night_owl',
    type: 'special',
    title: 'Сова',
    description: 'Завершите сессию после 21:00 вечера',
    icon: '🌙',
    reward: 50,
    condition: (stats) => stats.nightOwlSessions >= 1,
    rarity: 'uncommon',
  },
  {
    id: 'consistent_user',
    type: 'special',
    title: 'Постоянный пользователь',
    description: 'Используйте приложение 30 дней подряд',
    icon: '📱',
    reward: 300,
    condition: (stats) => stats.consistentDays >= 30,
    rarity: 'rare',
  },
  {
    id: 'break_master',
    type: 'special',
    title: 'Мастер перерывов',
    description: 'Завершите 50 перерывов',
    icon: '☕',
    reward: 150,
    condition: (stats) => stats.totalBreaks >= 50,
    rarity: 'uncommon',
  },
  {
    id: 'focus_master',
    type: 'special',
    title: 'Мастер фокуса',
    description: 'Завершите 100 сессий подряд без перерыва в неделю',
    icon: '🧠',
    reward: 400,
    condition: (stats) => stats.totalSessions >= 100 && stats.currentStreak >= 7,
    rarity: 'epic',
  },
  {
    id: 'speed_demon',
    type: 'special',
    title: 'Скоростной демон',
    description: 'Завершите 10 сессий за один день',
    icon: '⚡',
    reward: 250,
    condition: (stats) => stats.sessionsTodayCount >= 10,
    rarity: 'rare',
  },
];

export const getAchievementById = (id: string): Achievement | undefined => {
  return ACHIEVEMENT_DEFINITIONS.find((achievement) => achievement.id === id);
};

export const checkAchievements = (stats: any): string[] => {
  const unlockedAchievements: string[] = [];

  ACHIEVEMENT_DEFINITIONS.forEach((achievement) => {
    if (achievement.condition(stats)) {
      unlockedAchievements.push(achievement.id);
    }
  });

  return unlockedAchievements;
};

export const getAchievementsByRarity = (rarity: string): Achievement[] => {
  return ACHIEVEMENT_DEFINITIONS.filter((achievement) => achievement.rarity === rarity);
};

export const getAchievementsByType = (type: string): Achievement[] => {
  return ACHIEVEMENT_DEFINITIONS.filter((achievement) => achievement.type === type);
};

export const getTotalReward = (achievementIds: string[]): number => {
  return achievementIds.reduce((total, id) => {
    const achievement = getAchievementById(id);
    return total + (achievement?.reward || 0);
  }, 0);
};

export const getNextAchievements = (stats: any, limit: number = 5): Achievement[] => {
  const locked = ACHIEVEMENT_DEFINITIONS.filter((achievement) => !achievement.condition(stats));
  return locked.slice(0, limit);
};

export const getAchievementProgress = (achievement: Achievement, stats: any): number => {
  switch (achievement.type) {
    case 'milestone':
      if (achievement.id.includes('session')) {
        const target = parseInt(achievement.title.match(/\d+/)?.[0] || '1');
        return Math.min((stats.totalSessions / target) * 100, 100);
      }
      break;
    case 'duration':
      if (achievement.id.includes('hour')) {
        const target = parseInt(achievement.title.match(/\d+/)?.[0] || '1') * 60;
        return Math.min((stats.totalFocusTime / target) * 100, 100);
      }
      break;
    case 'streak':
      if (achievement.id.includes('day')) {
        const target = parseInt(achievement.title.match(/\d+/)?.[0] || '1');
        return Math.min((stats.currentStreak / target) * 100, 100);
      }
      break;
    case 'level':
      const levelTarget = parseInt(achievement.title.match(/\d+/)?.[0] || '1');
      return Math.min((stats.level / levelTarget) * 100, 100);
    default:
      return achievement.condition(stats) ? 100 : 0;
  }
  return 0;
};