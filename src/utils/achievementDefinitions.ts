import { Achievement } from '../models/Achievement';

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'sessions' | 'streak' | 'emotions' | 'time' | 'special';
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  requirement: number;
  checkProgress: (stats: AchievementStats) => number;
}

export interface AchievementStats {
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
  totalMinutes: number;
  emotionsExplored: string[];
  sessionsPerEmotion: Record<string, number>;
  consecutiveDays: number;
  perfectWeeks: number;
  morningSessions: number;
  eveningSessions: number;
  weekendSessions: number;
  firstSessionDate?: Date;
  lastSessionDate?: Date;
}

export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  // Session-based achievements
  {
    id: 'first_steps',
    title: 'Первые шаги',
    description: 'Завершите первую сессию',
    icon: '🎯',
    category: 'sessions',
    tier: 'bronze',
    requirement: 1,
    checkProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'getting_started',
    title: 'Начало пути',
    description: 'Завершите 5 сессий',
    icon: '🌱',
    category: 'sessions',
    tier: 'bronze',
    requirement: 5,
    checkProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'committed',
    title: 'Преданность делу',
    description: 'Завершите 10 сессий',
    icon: '💪',
    category: 'sessions',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'dedicated',
    title: 'Целеустремленность',
    description: 'Завершите 25 сессий',
    icon: '🏆',
    category: 'sessions',
    tier: 'silver',
    requirement: 25,
    checkProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'veteran',
    title: 'Ветеран',
    description: 'Завершите 50 сессий',
    icon: '⭐',
    category: 'sessions',
    tier: 'gold',
    requirement: 50,
    checkProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'master',
    title: 'Мастер практики',
    description: 'Завершите 100 сессий',
    icon: '👑',
    category: 'sessions',
    tier: 'gold',
    requirement: 100,
    checkProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'legend',
    title: 'Легенда',
    description: 'Завершите 250 сессий',
    icon: '💎',
    category: 'sessions',
    tier: 'platinum',
    requirement: 250,
    checkProgress: (stats) => stats.totalSessions,
  },
  {
    id: 'enlightened',
    title: 'Просветленный',
    description: 'Завершите 500 сессий',
    icon: '✨',
    category: 'sessions',
    tier: 'platinum',
    requirement: 500,
    checkProgress: (stats) => stats.totalSessions,
  },

  // Streak-based achievements
  {
    id: 'two_day_streak',
    title: 'Два дня подряд',
    description: 'Практикуйте 2 дня подряд',
    icon: '🔥',
    category: 'streak',
    tier: 'bronze',
    requirement: 2,
    checkProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'week_warrior',
    title: 'Воин недели',
    description: 'Практикуйте 7 дней подряд',
    icon: '🔥',
    category: 'streak',
    tier: 'silver',
    requirement: 7,
    checkProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'two_week_streak',
    title: 'Две недели силы',
    description: 'Практикуйте 14 дней подряд',
    icon: '🔥',
    category: 'streak',
    tier: 'silver',
    requirement: 14,
    checkProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'month_master',
    title: 'Мастер месяца',
    description: 'Практикуйте 30 дней подряд',
    icon: '🔥',
    category: 'streak',
    tier: 'gold',
    requirement: 30,
    checkProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'unstoppable',
    title: 'Неудержимый',
    description: 'Практикуйте 60 дней подряд',
    icon: '🔥',
    category: 'streak',
    tier: 'gold',
    requirement: 60,
    checkProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'century_streak',
    title: 'Столетие практики',
    description: 'Практикуйте 100 дней подряд',
    icon: '🔥',
    category: 'streak',
    tier: 'platinum',
    requirement: 100,
    checkProgress: (stats) => stats.currentStreak,
  },
  {
    id: 'year_champion',
    title: 'Чемпион года',
    description: 'Практикуйте 365 дней подряд',
    icon: '🔥',
    category: 'streak',
    tier: 'platinum',
    requirement: 365,
    checkProgress: (stats) => stats.currentStreak,
  },

  // Emotion exploration achievements
  {
    id: 'emotion_explorer',
    title: 'Исследователь эмоций',
    description: 'Изучите 3 разные эмоции',
    icon: '🎭',
    category: 'emotions',
    tier: 'bronze',
    requirement: 3,
    checkProgress: (stats) => stats.emotionsExplored.length,
  },
  {
    id: 'emotion_specialist',
    title: 'Специалист эмоций',
    description: 'Изучите 5 разных эмоций',
    icon: '🎨',
    category: 'emotions',
    tier: 'silver',
    requirement: 5,
    checkProgress: (stats) => stats.emotionsExplored.length,
  },
  {
    id: 'emotion_master',
    title: 'Мастер эмоций',
    description: 'Изучите все 8 эмоций',
    icon: '🌈',
    category: 'emotions',
    tier: 'gold',
    requirement: 8,
    checkProgress: (stats) => stats.emotionsExplored.length,
  },
  {
    id: 'anxiety_warrior',
    title: 'Воин спокойствия',
    description: 'Завершите 10 сессий с тревогой',
    icon: '🧘',
    category: 'emotions',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.sessionsPerEmotion['anxiety'] || 0,
  },
  {
    id: 'stress_buster',
    title: 'Победитель стресса',
    description: 'Завершите 10 сессий со стрессом',
    icon: '💆',
    category: 'emotions',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.sessionsPerEmotion['stress'] || 0,
  },
  {
    id: 'sadness_healer',
    title: 'Целитель грусти',
    description: 'Завершите 10 сессий с грустью',
    icon: '🌸',
    category: 'emotions',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.sessionsPerEmotion['sadness'] || 0,
  },
  {
    id: 'anger_tamer',
    title: 'Укротитель гнева',
    description: 'Завершите 10 сессий с гневом',
    icon: '🕊️',
    category: 'emotions',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.sessionsPerEmotion['anger'] || 0,
  },
  {
    id: 'fear_conqueror',
    title: 'Победитель страха',
    description: 'Завершите 10 сессий со страхом',
    icon: '🦁',
    category: 'emotions',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.sessionsPerEmotion['fear'] || 0,
  },

  // Time-based achievements
  {
    id: 'first_hour',
    title: 'Первый час',
    description: 'Практикуйте 60 минут в сумме',
    icon: '⏰',
    category: 'time',
    tier: 'bronze',
    requirement: 60,
    checkProgress: (stats) => stats.totalMinutes,
  },
  {
    id: 'five_hours',
    title: 'Пять часов практики',
    description: 'Практикуйте 300 минут в сумме',
    icon: '⏳',
    category: 'time',
    tier: 'silver',
    requirement: 300,
    checkProgress: (stats) => stats.totalMinutes,
  },
  {
    id: 'ten_hours',
    title: 'Десять часов мастерства',
    description: 'Практикуйте 600 минут в сумме',
    icon: '⌚',
    category: 'time',
    tier: 'gold',
    requirement: 600,
    checkProgress: (stats) => stats.totalMinutes,
  },
  {
    id: 'twenty_hours',
    title: 'Двадцать часов посвящения',
    description: 'Практикуйте 1200 минут в сумме',
    icon: '🕰️',
    category: 'time',
    tier: 'gold',
    requirement: 1200,
    checkProgress: (stats) => stats.totalMinutes,
  },
  {
    id: 'fifty_hours',
    title: 'Пятьдесят часов преданности',
    description: 'Практикуйте 3000 минут в сумме',
    icon: '⏱️',
    category: 'time',
    tier: 'platinum',
    requirement: 3000,
    checkProgress: (stats) => stats.totalMinutes,
  },

  // Special achievements
  {
    id: 'early_bird',
    title: 'Ранняя пташка',
    description: 'Завершите 10 утренних сессий (до 9:00)',
    icon: '🌅',
    category: 'special',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.morningSession,
  },
  {
    id: 'night_owl',
    title: 'Ночная сова',
    description: 'Завершите 10 вечерних сессий (после 21:00)',
    icon: '🌙',
    category: 'special',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.eveningSessions,
  },
  {
    id: 'weekend_warrior',
    title: 'Воин выходных',
    description: 'Завершите 10 сессий в выходные',
    icon: '🎉',
    category: 'special',
    tier: 'silver',
    requirement: 10,
    checkProgress: (stats) => stats.weekendSessions,
  },
  {
    id: 'perfect_week',
    title: 'Идеальная неделя',
    description: 'Практикуйте каждый день недели',
    icon: '📅',
    category: 'special',
    tier: 'gold',
    requirement: 1,
    checkProgress: (stats) => stats.perfectWeeks,
  },
  {
    id: 'consistency_king',
    title: 'Король постоянства',
    description: 'Достигните 4 идеальных недель',
    icon: '👑',
    category: 'special',
    tier: 'platinum',
    requirement: 4,
    checkProgress: (stats) => stats.perfectWeeks,
  },
  {
    id: 'quick_learner',
    title: 'Быстрый ученик',
    description: 'Завершите 5 сессий за первую неделю',
    icon: '🚀',
    category: 'special',
    tier: 'bronze',
    requirement: 5,
    checkProgress: (stats) => {
      if (!stats.firstSessionDate) return 0;
      const daysSinceFirst = Math.floor(
        (Date.now() - stats.firstSessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceFirst <= 7 ? stats.totalSessions : 0;
    },
  },
  {
    id: 'comeback_kid',
    title: 'Возвращение',
    description: 'Вернитесь к практике после перерыва в 30+ дней',
    icon: '🔄',
    category: 'special',
    tier: 'silver',
    requirement: 1,
    checkProgress: (stats) => {
      if (!stats.lastSessionDate || !stats.firstSessionDate) return 0;
      const daysSinceLast = Math.floor(
        (Date.now() - stats.lastSessionDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return daysSinceLast >= 30 && stats.totalSessions > 10 ? 1 : 0;
    },
  },
  {
    id: 'marathon_session',
    title: 'Марафон',
    description: 'Завершите сессию длительностью 30+ минут',
    icon: '🏃',
    category: 'special',
    tier: 'gold',
    requirement: 1,
    checkProgress: () => 0, // Checked separately per session
  },
  {
    id: 'zen_master',
    title: 'Дзен мастер',
    description: 'Достигните идеального показателя спок