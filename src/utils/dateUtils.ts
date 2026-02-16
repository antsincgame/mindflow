import {
  format,
  formatDistanceToNow,
  startOfDay,
  startOfWeek,
  startOfMonth,
  endOfDay,
  endOfWeek,
  endOfMonth,
  subDays,
  subWeeks,
  subMonths,
  addDays,
  differenceInDays,
  differenceInMinutes,
  differenceInSeconds,
  isToday,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isSameDay,
  isBefore,
  isAfter,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  parseISO,
  isValid,
  getDay,
  getISOWeek,
  getMonth,
  getYear,
  setHours,
  setMinutes,
  setSeconds,
  compareAsc,
  compareDesc,
} from 'date-fns';
import { ru } from 'date-fns/locale';

export type PeriodType = 'week' | 'month' | 'all';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface GroupedByDay<T> {
  date: string;
  items: T[];
}

export interface GroupedByWeek<T> {
  weekStart: string;
  weekNumber: number;
  items: T[];
}

export interface GroupedByMonth<T> {
  month: string;
  year: number;
  monthIndex: number;
  items: T[];
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: Date | null;
  isActiveToday: boolean;
}

export interface HeatmapDay {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
}

// --- Formatting ---

export const formatDate = (date: Date | string, pattern: string = 'dd.MM.yyyy'): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, pattern, { locale: ru });
};

export const formatTime = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, 'HH:mm', { locale: ru });
};

export const formatDateTime = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, 'dd MMM yyyy, HH:mm', { locale: ru });
};

export const formatShortDate = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, 'dd MMM', { locale: ru });
};

export const formatRelative = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';

  if (isToday(parsed)) return 'Сегодня';
  if (isYesterday(parsed)) return 'Вчера';
  if (isThisWeek(parsed, { weekStartsOn: 1 })) {
    return format(parsed, 'EEEE', { locale: ru });
  }
  if (isThisMonth(parsed)) {
    return format(parsed, 'dd MMMM', { locale: ru });
  }
  return format(parsed, 'dd MMM yyyy', { locale: ru });
};

export const formatTimeAgo = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return formatDistanceToNow(parsed, { addSuffix: true, locale: ru });
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatDurationLong = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours} ч ${mins} мин`;
  }
  if (mins > 0) {
    return `${mins} мин ${secs} сек`;
  }
  return `${secs} сек`;
};

export const formatDayOfWeek = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, 'EE', { locale: ru });
};

export const formatMonthYear = (date: Date | string): string => {
  const parsed = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(parsed)) return '';
  return format(parsed, 'LLLL yyyy', { locale: ru });
};

// --- Date Range / Period ---

export const getDateRange = (period: PeriodType, referenceDate: Date = new Date()): DateRange => {
  const now = referenceDate;

  switch (period) {
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
      };
    case 'all':
      return {
        start: subMonths(startOfDay(now), 12),
        end: endOfDay(now),
      };
    default:
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfDay(now),
      };
  }
};

export const getHeatmapRange = (months: number = 3): DateRange => {
  const now = new Date();
  return {
    start: startOfDay(subMonths(now, months)),
    end: endOfDay(now),
  };
};

export const getDaysInRange = (range: DateRange): Date[] => {
  return eachDayOfInterval({ start: range.start, end: range.end });
};

export const getWeeksInRange = (range: DateRange): Date[] => {
  return eachWeekOfInterval({ start: range.start, end: range.end }, { weekStartsOn: 1 });
};

export const getMonthsInRange = (range: DateRange): Date[] => {
  return eachMonthOfInterval({ start: range.start, end: range.end });
};

export const isDateInRange = (date: Date, range: DateRange): boolean => {
  return (
    (isAfter(date, range.start) || isSameDay(date, range.start)) &&
    (isBefore(date, range.end) || isSameDay(date, range.end))
  );
};

// --- Grouping ---

export const groupByDay = <T extends { date?: string; startDate?: string; createdAt?: string }>(
  items: T[],
): GroupedByDay<T>[] => {
  const groups = new Map<string, T[]>();

  items.forEach((item) => {
    const dateStr = item.date || item.startDate || item.createdAt;
    if (!dateStr) return;

    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(parsed)) return;

    const dayKey = format(parsed as Date, 'yyyy-MM-dd');
    const existing = groups.get(dayKey) || [];
    existing.push(item);
    groups.set(dayKey, existing);
  });

  return Array.from(groups.entries())
    .map(([date, items]) => ({ date, items }))
    .sort((a, b) => compareDesc(parseISO(a.date), parseISO(b.date)));
};

export const groupByWeek = <T extends { date?: string; startDate?: string; createdAt?: string }>(
  items: T[],
): GroupedByWeek<T>[] => {
  const groups = new Map<string, { weekNumber: number; items: T[] }>();

  items.forEach((item) => {
    const dateStr = item.date || item.startDate || item.createdAt;
    if (!dateStr) return;

    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(parsed)) return;

    const weekStart = startOfWeek(parsed as Date, { weekStartsOn: 1 });
    const weekKey = format(weekStart, 'yyyy-MM-dd');
    const weekNumber = getISOWeek(parsed as Date);

    const existing = groups.get(weekKey) || { weekNumber, items: [] };
    existing.items.push(item);
    groups.set(weekKey, existing);
  });

  return Array.from(groups.entries())
    .map(([weekStart, { weekNumber, items }]) => ({ weekStart, weekNumber, items }))
    .sort((a, b) => compareDesc(parseISO(a.weekStart), parseISO(b.weekStart)));
};

export const groupByMonth = <T extends { date?: string; startDate?: string; createdAt?: string }>(
  items: T[],
): GroupedByMonth<T>[] => {
  const groups = new Map<string, { year: number; monthIndex: number; items: T[] }>();

  items.forEach((item) => {
    const dateStr = item.date || item.startDate || item.createdAt;
    if (!dateStr) return;

    const parsed = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
    if (!isValid(parsed)) return;

    const monthKey = format(parsed as Date, 'yyyy-MM');
    const year = getYear(parsed as Date);
    const monthIndex = getMonth(parsed as Date);

    const existing = groups.get(monthKey) || { year, monthIndex, items: [] };
    existing.items.push(item);
    groups.set(monthKey, existing);
  });

  return Array.from(groups.entries())
    .map(([month, { year, monthIndex, items }]) => ({ month, year, monthIndex, items }))
    .sort((a, b) => compareDesc(parseISO(`${a.month}-01`), parseISO(`${b.month}-01`)));
};

// --- Streaks ---

export const calculateStreak = (dates: (Date | string)[]): StreakInfo => {
  if (dates.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      isActiveToday: false,
    };
  }

  const uniqueDays = new Set<string>();
  dates.forEach((d) => {
    const parsed = typeof d === 'string' ? parseISO(d) : d;
    if (isValid(parsed)) {
      uniqueDays.add(format(startOfDay(parsed), 'yyyy-MM-dd'));
    }
  });

  const sortedDays = Array.from(uniqueDays)
    .map((d) => parseISO(d))
    .sort(compareAsc);

  if (sortedDays.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: null,
      isActiveToday: false,
    };
  }

  const lastActive = sortedDays[sortedDays.length - 1];
  const activeToday = isToday(lastActive);

  // Calculate longest streak
  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < sortedDays.length; i++) {
    const diff = differenceInDays(sortedDays[i], sortedDays[i - 1]);
    if (diff === 1) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else if (diff > 1) {
      currentRun = 1;
    }
    // diff === 0 means same day, skip
  }

  // Calculate current streak (from today or yesterday backwards)
  let currentStreak = 0;
  const today = startOfDay(new Date());
  const yesterday = startOfDay(subDays(today, 1));

  const daySet = new Set(sortedDays.map((d) => format(d, 'yyyy-MM-dd')));

  let checkDate: Date;
  if (daySet.has(format(today, 'yyyy-MM-dd'))) {
    checkDate = today;
  } else if (daySet.has(format(yesterday, 'yyyy-MM-dd'))) {
    checkDate = yesterday;
  } else {
    return {
      currentStreak: 0,
      longestStreak,
      lastActiveDate: lastActive,
      isActiveToday: activeToday,
    };
  }

  while (daySet.has(format(checkDate, 'yyyy-MM-dd'))) {
    currentStreak++;
    checkDate = subDays(checkDate, 1);
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak),
    lastActiveDate: lastActive,
    isActiveToday: activeToday,
  };
};

// --- Heatmap ---

export const generateHeatmapData = (
  sessionDates: (Date | string)[],
  months: number = 3,
): HeatmapDay[] => {
  const range = getHeatmapRange(months);
  const days = getDaysInRange(range);

  const countMap = new Map<string, number>();
  sessionDates.forEach((d) => {
    const parsed = typeof d === 'string' ? parseISO(d) : d;
    if (!isValid(parsed)) return;
    const key = format(startOfDay(parsed), 'yyyy-MM-dd');
    countMap.set(key, (countMap.get(key) || 0) + 1);
  });

  const maxCount = Math.max(1, ...Array.from(countMap.values()));

  return days.map((day) => {
    const key = format(day, 'yyyy-MM-dd');
    const count = countMap.get(key) || 0;

    let intensity: 0 | 1 | 2 | 3 | 4;
    if (count === 0) {
      intensity = 0;
    } else if (count <= maxCount * 0.25) {
      intensity = 1;
    } else if (count <= maxCount * 0.5) {
      intensity = 2;
    } else if (count <= maxCount * 0.75) {
      intensity = 3;
    } else {
      intensity = 4;
    }

    return { date: key, count, intensity };
  });
};

// --- Week days helpers ---

export const getWeekDayLabels = (short: boolean = true): string[] => {
  const baseDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => {
    const day = addDays(baseDate, i);
    return format(day, short ? 'EE' :