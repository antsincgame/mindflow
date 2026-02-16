export interface User {
  id: number;
  level: number;
  stars: number;
  totalSessions: number;
  totalFocusTime: number;
  totalBreaks: number;
  currentStreak: number;
  bestStreak: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserProgress {
  currentLevel: number;
  starsInCurrentLevel: number;
  starsNeededForNextLevel: number;
  progressPercentage: number;
  nextMilestone: number;
}

export interface UserStats {
  totalSessions: number;
  totalFocusTime: number;
  totalBreaks: number;
  currentStreak: number;
  bestStreak: number;
  averageSessionDuration: number;
  sessionsThisWeek: number;
  sessionsThisMonth: number;
  totalBreakTime: number;
}

export interface UserLevel {
  level: number;
  minStars: number;
  maxStars: number;
  title: string;
  description: string;
  badge: string;
}

export const USER_LEVELS: UserLevel[] = [
  {
    level: 1,
    minStars: 0,
    maxStars: 10,
    title: 'Новичок',
    description: 'Начинаешь свой путь к сосредоточенности',
    badge: '🌱',
  },
  {
    level: 2,
    minStars: 10,
    maxStars: 25,
    title: 'Ученик',
    description: 'Развиваешь навыки концентрации',
    badge: '📚',
  },
  {
    level: 3,
    minStars: 25,
    maxStars: 50,
    title: 'Практик',
    description: 'Уверенно работаешь над задачами',
    badge: '⚡',
  },
  {
    level: 4,
    minStars: 50,
    maxStars: 100,
    title: 'Мастер',
    description: 'Достиг высокого уровня продуктивности',
    badge: '🎯',
  },
  {
    level: 5,
    minStars: 100,
    maxStars: 200,
    title: 'Гроссмейстер',
    description: 'Легендарный уровень сосредоточенности',
    badge: '👑',
  },
];

export const getDefaultUser = (): User => ({
  id: 1,
  level: 1,
  stars: 0,
  totalSessions: 0,
  totalFocusTime: 0,
  totalBreaks: 0,
  currentStreak: 0,
  bestStreak: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

export const getUserProgress = (user: User): UserProgress => {
  const currentLevelData = USER_LEVELS.find((l) => l.level === user.level) || USER_LEVELS[0];
  const nextLevelData = USER_LEVELS.find((l) => l.level === user.level + 1);

  const starsInCurrentLevel = user.stars - currentLevelData.minStars;
  const starsNeededForNextLevel = currentLevelData.maxStars - currentLevelData.minStars;
  const progressPercentage = (starsInCurrentLevel / starsNeededForNextLevel) * 100;

  return {
    currentLevel: user.level,
    starsInCurrentLevel,
    starsNeededForNextLevel: starsNeededForNextLevel - starsInCurrentLevel,
    progressPercentage: Math.min(progressPercentage, 100),
    nextMilestone: nextLevelData?.minStars || user.stars,
  };
};

export const getUserLevelData = (level: number): UserLevel => {
  return USER_LEVELS.find((l) => l.level === level) || USER_LEVELS[0];
};

export const calculateUserStats = (user: User): UserStats => {
  const averageSessionDuration =
    user.totalSessions > 0 ? Math.round(user.totalFocusTime / user.totalSessions) : 0;

  return {
    totalSessions: user.totalSessions,
    totalFocusTime: user.totalFocusTime,
    totalBreaks: user.totalBreaks,
    currentStreak: user.currentStreak,
    bestStreak: user.bestStreak,
    averageSessionDuration,
    sessionsThisWeek: 0,
    sessionsThisMonth: 0,
    totalBreakTime: user.totalBreaks * 5,
  };
};