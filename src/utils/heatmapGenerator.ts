import { format, subDays, startOfDay, endOfDay, eachDayOfInterval, isToday, isWithinInterval } from 'date-fns';

export interface HeatmapDay {
  date: string;
  count: number;
  level: number;
  sessions: number;
  totalMinutes: number;
}

export interface HeatmapWeek {
  days: HeatmapDay[];
}

export interface HeatmapData {
  weeks: HeatmapWeek[];
  maxCount: number;
  totalSessions: number;
  currentStreak: number;
  longestStreak: number;
}

export interface SessionData {
  date: Date;
  duration: number;
  completed: boolean;
}

const DAYS_TO_SHOW = 84; // 12 недель
const LEVEL_THRESHOLDS = [0, 1, 2, 3, 4]; // 0-4 уровня интенсивности

/**
 * Определяет уровень интенсивности на основе количества сессий
 */
const getIntensityLevel = (count: number, maxCount: number): number => {
  if (count === 0) return 0;
  if (maxCount === 0) return 1;
  
  const ratio = count / maxCount;
  
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.25) return 2;
  return 1;
};

/**
 * Группирует сессии по дням
 */
const groupSessionsByDay = (sessions: SessionData[]): Map<string, SessionData[]> => {
  const grouped = new Map<string, SessionData[]>();
  
  sessions.forEach(session => {
    const dateKey = format(startOfDay(session.date), 'yyyy-MM-dd');
    const existing = grouped.get(dateKey) || [];
    grouped.set(dateKey, [...existing, session]);
  });
  
  return grouped;
};

/**
 * Вычисляет текущую серию дней с упражнениями
 */
const calculateCurrentStreak = (sessionsByDay: Map<string, SessionData[]>): number => {
  let streak = 0;
  let currentDate = new Date();
  
  while (true) {
    const dateKey = format(startOfDay(currentDate), 'yyyy-MM-dd');
    const daySessions = sessionsByDay.get(dateKey);
    
    if (!daySessions || daySessions.length === 0) {
      // Если сегодня еще не было сессий, проверяем вчера
      if (isToday(currentDate) && streak === 0) {
        currentDate = subDays(currentDate, 1);
        continue;
      }
      break;
    }
    
    streak++;
    currentDate = subDays(currentDate, 1);
  }
  
  return streak;
};

/**
 * Вычисляет самую длинную серию дней с упражнениями
 */
const calculateLongestStreak = (sessionsByDay: Map<string, SessionData[]>): number => {
  const sortedDates = Array.from(sessionsByDay.keys()).sort();
  
  if (sortedDates.length === 0) return 0;
  
  let longestStreak = 1;
  let currentStreak = 1;
  
  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);
    
    const daysDiff = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    
    if (daysDiff === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }
  
  return longestStreak;
};

/**
 * Создает данные для одного дня
 */
const createDayData = (
  date: Date,
  sessions: SessionData[] = []
): HeatmapDay => {
  const completedSessions = sessions.filter(s => s.completed);
  const totalMinutes = completedSessions.reduce((sum, s) => sum + s.duration, 0);
  
  return {
    date: format(date, 'yyyy-MM-dd'),
    count: completedSessions.length,
    level: 0, // Будет установлен позже
    sessions: completedSessions.length,
    totalMinutes: Math.round(totalMinutes)
  };
};

/**
 * Группирует дни по неделям
 */
const groupDaysByWeeks = (days: HeatmapDay[]): HeatmapWeek[] => {
  const weeks: HeatmapWeek[] = [];
  let currentWeek: HeatmapDay[] = [];
  
  days.forEach((day, index) => {
    currentWeek.push(day);
    
    // Каждые 7 дней или последний день
    if (currentWeek.length === 7 || index === days.length - 1) {
      // Дополняем неделю пустыми днями если нужно
      while (currentWeek.length < 7) {
        const lastDate = new Date(currentWeek[currentWeek.length - 1].date);
        const nextDate = subDays(lastDate, 1);
        currentWeek.unshift(createDayData(nextDate));
      }
      
      weeks.push({ days: [...currentWeek] });
      currentWeek = [];
    }
  });
  
  return weeks.reverse();
};

/**
 * Генерирует данные для тепловой карты
 */
export const generateHeatmapData = (sessions: SessionData[]): HeatmapData => {
  const endDate = new Date();
  const startDate = subDays(endDate, DAYS_TO_SHOW - 1);
  
  // Группируем сессии по дням
  const sessionsByDay = groupSessionsByDay(sessions);
  
  // Создаем массив всех дней в диапазоне
  const allDays = eachDayOfInterval({ start: startDate, end: endDate });
  
  // Создаем данные для каждого дня
  const dayData = allDays.map(date => {
    const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
    const daySessions = sessionsByDay.get(dateKey) || [];
    return createDayData(date, daySessions);
  });
  
  // Находим максимальное количество сессий в день
  const maxCount = Math.max(...dayData.map(d => d.count), 1);
  
  // Устанавливаем уровни интенсивности
  dayData.forEach(day => {
    day.level = getIntensityLevel(day.count, maxCount);
  });
  
  // Группируем дни по неделям
  const weeks = groupDaysByWeeks(dayData);
  
  // Вычисляем статистику
  const totalSessions = sessions.filter(s => s.completed).length;
  const currentStreak = calculateCurrentStreak(sessionsByDay);
  const longestStreak = calculateLongestStreak(sessionsByDay);
  
  return {
    weeks,
    maxCount,
    totalSessions,
    currentStreak,
    longestStreak
  };
};

/**
 * Получает цвет для уровня интенсивности
 */
export const getColorForLevel = (
  level: number,
  isDark: boolean = false
): string => {
  const lightColors = [
    '#EBEDF0', // level 0 - нет активности
    '#C6E48B', // level 1 - низкая
    '#7BC96F', // level 2 - средняя
    '#239A3B', // level 3 - высокая
    '#196127'  // level 4 - очень высокая
  ];
  
  const darkColors = [
    '#161B22', // level 0
    '#0E4429', // level 1
    '#006D32', // level 2
    '#26A641', // level 3
    '#39D353'  // level 4
  ];
  
  const colors = isDark ? darkColors : lightColors;
  return colors[Math.min(level, 4)] || colors[0];
};

/**
 * Получает данные за определенный период
 */
export const getHeatmapForPeriod = (
  sessions: SessionData[],
  startDate: Date,
  endDate: Date
): HeatmapData => {
  const filteredSessions = sessions.filter(session => 
    isWithinInterval(session.date, { start: startDate, end: endDate })
  );
  
  return generateHeatmapData(filteredSessions);
};

/**
 * Получает данные для конкретного дня
 */
export const getDayData = (
  heatmapData: HeatmapData,
  date: Date
): HeatmapDay | null => {
  const dateKey = format(startOfDay(date), 'yyyy-MM-dd');
  
  for (const week of heatmapData.weeks) {
    const day = week.days.find(d => d.date === dateKey);
    if (day) return day;
  }
  
  return null;
};

/**
 * Получает среднее количество сессий в день
 */
export const getAverageSessions = (heatmapData: HeatmapData): number => {
  const allDays = heatmapData.weeks.flatMap(w => w.days);
  const daysWithSessions = allDays.filter(d => d.count > 0);
  
  if (daysWithSessions.length === 0) return 0;
  
  const totalSessions = daysWithSessions.reduce((sum, d) => sum + d.count, 0);
  return Math.round((totalSessions / daysWithSessions.length) * 10) / 10;
};

/**
 * Получает общее время упражнений
 */
export const getTotalMinutes = (heatmapData: HeatmapData): number => {
  const allDays = heatmapData.weeks.flatMap(w => w.days);
  return allDays.reduce((sum, d) => sum + d.totalMinutes, 0);
};

/**
 * Получает самый активный день недели
 */
export const getMostActiveWeekday = (heatmapData: HeatmapData): string => {
  const weekdayCounts = new Map<number, number>();
  
  heatmapData.weeks.forEach(week => {
    week.days.forEach((day, index) => {
      if (day.count > 0) {
        const current = weekdayCounts.get(index) || 0;
        weekdayCounts.set(index, current + day.count);
      }
    });
  });
  
  if (weekdayCounts.size === 0) return 'Нет данных';
  
  let maxWeekday = 0;
  let maxCount = 0;
  
  weekdayCounts.forEach((count, weekday) => {
    if (count > maxCount) {
      maxCount = count;
      maxWeekday = weekday;
    }
  });
  
  const weekdays = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  return weekdays[maxWeekday];
};

/**
 * Получает процент дней с активностью
 */
export const getActivityPercentage = (heatmapData: HeatmapData): number => {
  const allDays = heatmapData.weeks.flatMap(w => w.days);
  const activeDays = allDays.filter(d => d.count > 0).length;
  
  if (allDays.length === 0) return 0;
  
  return Math.round((activeDays / allDays.length) * 100);
};

/**
 * Генерирует mock данные для тестирования
 */
export const generateMockSessions = (days: number = 90): SessionData[] => {
  const sessions: SessionData[] = [];
  const endDate = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = subDays(endDate, i);
    
    // Случайное количество сессий (0-3)
    const sessionCount = Math.floor(Math.random() * 4);
    
    for (let j = 0; j < sessionCount; j++) {
      sessions.push({
        date,
        duration: Math.floor(Math.random() * 20) + 5, // 5-25 минут
        completed: Math.random() > 0.1 // 90% завершенных
      });
    }
  }
  
  return sessions;
};

export default {
  generateHeatmapData,
  getColorForLevel,
  getHeatmapForPeriod,
  getDayData,
  getAverageSessions,
  getTotalMinutes,
  getMostActiveWeekday,
  getActivityPercentage,
  generateMockSessions
};