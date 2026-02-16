import { useState, useEffect, useCallback } from 'react';
import { StorageService } from '../services/StorageService';
import { Session } from '../models/Session';
import { Emotion } from '../models/Emotion';
import { startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval, format, subDays, eachDayOfInterval } from 'date-fns';

export interface DailyStats {
  date: string;
  sessionCount: number;
  totalDuration: number;
  emotions: string[];
}

export interface WeeklyStats {
  weekStart: string;
  weekEnd: string;
  sessionCount: number;
  totalDuration: number;
  averageDuration: number;
  mostFrequentEmotion: string | null;
}

export interface MonthlyStats {
  month: string;
  sessionCount: number;
  totalDuration: number;
  averageDuration: number;
  completionRate: number;
  emotionBreakdown: Record<string, number>;
}

export interface YearlyStats {
  year: number;
  sessionCount: number;
  totalDuration: number;
  averageDuration: number;
  monthlyBreakdown: Record<string, number>;
  topEmotions: Array<{ emotion: string; count: number }>;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  lastSessionDate: string | null;
}

export interface HeatmapData {
  date: string;
  count: number;
  level: number;
}

export interface EmotionTrend {
  emotion: string;
  count: number;
  percentage: number;
  trend: 'up' | 'down' | 'stable';
}

export interface TimeOfDayStats {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export interface Statistics {
  daily: DailyStats[];
  weekly: WeeklyStats;
  monthly: MonthlyStats;
  yearly: YearlyStats;
  streak: StreakStats;
  heatmap: HeatmapData[];
  emotionTrends: EmotionTrend[];
  timeOfDay: TimeOfDayStats;
  totalSessions: number;
  totalDuration: number;
  averageSessionDuration: number;
  favoriteEmotion: string | null;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEYS = {
  SESSIONS: '@sessions',
  STREAK: '@streak',
};

export const useStatistics = () => {
  const [statistics, setStatistics] = useState<Statistics>({
    daily: [],
    weekly: {
      weekStart: '',
      weekEnd: '',
      sessionCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      mostFrequentEmotion: null,
    },
    monthly: {
      month: '',
      sessionCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      completionRate: 0,
      emotionBreakdown: {},
    },
    yearly: {
      year: new Date().getFullYear(),
      sessionCount: 0,
      totalDuration: 0,
      averageDuration: 0,
      monthlyBreakdown: {},
      topEmotions: [],
    },
    streak: {
      currentStreak: 0,
      longestStreak: 0,
      lastSessionDate: null,
    },
    heatmap: [],
    emotionTrends: [],
    timeOfDay: {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    },
    totalSessions: 0,
    totalDuration: 0,
    averageSessionDuration: 0,
    favoriteEmotion: null,
    isLoading: true,
    error: null,
  });

  const calculateDailyStats = useCallback((sessions: Session[]): DailyStats[] => {
    const dailyMap = new Map<string, DailyStats>();

    sessions.forEach(session => {
      if (!session.completedAt) return;

      const dateKey = format(new Date(session.completedAt), 'yyyy-MM-dd');
      const existing = dailyMap.get(dateKey);

      if (existing) {
        existing.sessionCount += 1;
        existing.totalDuration += session.duration;
        if (!existing.emotions.includes(session.emotionId)) {
          existing.emotions.push(session.emotionId);
        }
      } else {
        dailyMap.set(dateKey, {
          date: dateKey,
          sessionCount: 1,
          totalDuration: session.duration,
          emotions: [session.emotionId],
        });
      }
    });

    return Array.from(dailyMap.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, []);

  const calculateWeeklyStats = useCallback((sessions: Session[]): WeeklyStats => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    const weekSessions = sessions.filter(session => 
      session.completedAt && isWithinInterval(new Date(session.completedAt), { start: weekStart, end: weekEnd })
    );

    const totalDuration = weekSessions.reduce((sum, session) => sum + session.duration, 0);
    const emotionCounts = new Map<string, number>();

    weekSessions.forEach(session => {
      emotionCounts.set(session.emotionId, (emotionCounts.get(session.emotionId) || 0) + 1);
    });

    let mostFrequentEmotion: string | null = null;
    let maxCount = 0;

    emotionCounts.forEach((count, emotion) => {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentEmotion = emotion;
      }
    });

    return {
      weekStart: format(weekStart, 'yyyy-MM-dd'),
      weekEnd: format(weekEnd, 'yyyy-MM-dd'),
      sessionCount: weekSessions.length,
      totalDuration,
      averageDuration: weekSessions.length > 0 ? totalDuration / weekSessions.length : 0,
      mostFrequentEmotion,
    };
  }, []);

  const calculateMonthlyStats = useCallback((sessions: Session[]): MonthlyStats => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthSessions = sessions.filter(session => 
      session.completedAt && isWithinInterval(new Date(session.completedAt), { start: monthStart, end: monthEnd })
    );

    const totalDuration = monthSessions.reduce((sum, session) => sum + session.duration, 0);
    const completedSessions = monthSessions.filter(session => session.completed).length;
    const emotionBreakdown: Record<string, number> = {};

    monthSessions.forEach(session => {
      emotionBreakdown[session.emotionId] = (emotionBreakdown[session.emotionId] || 0) + 1;
    });

    return {
      month: format(now, 'MMMM yyyy'),
      sessionCount: monthSessions.length,
      totalDuration,
      averageDuration: monthSessions.length > 0 ? totalDuration / monthSessions.length : 0,
      completionRate: monthSessions.length > 0 ? (completedSessions / monthSessions.length) * 100 : 0,
      emotionBreakdown,
    };
  }, []);

  const calculateYearlyStats = useCallback((sessions: Session[]): YearlyStats => {
    const now = new Date();
    const year = now.getFullYear();
    const yearStart = startOfYear(now);
    const yearEnd = endOfYear(now);

    const yearSessions = sessions.filter(session => 
      session.completedAt && isWithinInterval(new Date(session.completedAt), { start: yearStart, end: yearEnd })
    );

    const totalDuration = yearSessions.reduce((sum, session) => sum + session.duration, 0);
    const monthlyBreakdown: Record<string, number> = {};
    const emotionCounts = new Map<string, number>();

    yearSessions.forEach(session => {
      if (!session.completedAt) return;

      const month = format(new Date(session.completedAt), 'MMM');
      monthlyBreakdown[month] = (monthlyBreakdown[month] || 0) + 1;

      emotionCounts.set(session.emotionId, (emotionCounts.get(session.emotionId) || 0) + 1);
    });

    const topEmotions = Array.from(emotionCounts.entries())
      .map(([emotion, count]) => ({ emotion, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      year,
      sessionCount: yearSessions.length,
      totalDuration,
      averageDuration: yearSessions.length > 0 ? totalDuration / yearSessions.length : 0,
      monthlyBreakdown,
      topEmotions,
    };
  }, []);

  const calculateStreakStats = useCallback((sessions: Session[]): StreakStats => {
    const completedSessions = sessions
      .filter(session => session.completed && session.completedAt)
      .sort((a, b) => new Date(b.completedAt!).getTime() - new Date(a.completedAt!).getTime());

    if (completedSessions.length === 0) {
      return {
        currentStreak: 0,
        longestStreak: 0,
        lastSessionDate: null,
      };
    }

    const lastSessionDate = completedSessions[0].completedAt!;
    const uniqueDates = Array.from(new Set(
      completedSessions.map(session => format(new Date(session.completedAt!), 'yyyy-MM-dd'))
    )).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;

    const today = format(new Date(), 'yyyy-MM-dd');
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');

    if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
      currentStreak = 1;
      
      for (let i = 1; i < uniqueDates.length; i++) {
        const prevDate = new Date(uniqueDates[i - 1]);
        const currDate = new Date(uniqueDates[i]);
        const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          currentStreak++;
        } else {
          break;
        }
      }
    }

    for (let i = 1; i < uniqueDates.length; i++) {
      const prevDate = new Date(uniqueDates[i - 1]);
      const currDate = new Date(uniqueDates[i]);
      const dayDiff = Math.floor((prevDate.getTime() - currDate.getTime()) / (1000 * 60 * 60 * 24));

      if (dayDiff === 1) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 1;
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return {
      currentStreak,
      longestStreak,
      lastSessionDate,
    };
  }, []);

  const calculateHeatmapData = useCallback((sessions: Session[]): HeatmapData[] => {
    const now = new Date();
    const startDate = subDays(now, 364);
    const dateRange = eachDayOfInterval({ start: startDate, end: now });

    const sessionCountMap = new Map<string, number>();

    sessions.forEach(session => {
      if (!session.completedAt) return;
      const dateKey = format(new Date(session.completedAt), 'yyyy-MM-dd');
      sessionCountMap.set(dateKey, (sessionCountMap.get(dateKey) || 0) + 1);
    });

    const maxCount = Math.max(...Array.from(sessionCountMap.values()), 1);

    return dateRange.map(date => {
      const dateKey = format(date, 'yyyy-MM-dd');
      const count = sessionCountMap.get(dateKey) || 0;
      const level = count === 0 ? 0 : Math.ceil((count / maxCount) * 4);

      return {
        date: dateKey,
        count,
        level: Math.min(level, 4),
      };
    });
  }, []);

  const calculateEmotionTrends = useCallback((sessions: Session[]): EmotionTrend[] => {
    const now = new Date();
    const thisMonth = startOfMonth(now);
    const lastMonth = startOfMonth(subDays(thisMonth, 1));

    const thisMonthSessions = sessions.filter(session => 
      session.completedAt && isWithinInterval(new Date(session.completedAt), { start: thisMonth, end: now })
    );

    const lastMonthSessions = sessions.filter(session => 
      session.completedAt && isWithinInterval(new Date(session.completedAt), { start: lastMonth, end: subDays(thisMonth, 1) })
    );

    const thisMonthCounts = new Map<string, number>();
    const lastMonthCounts = new Map<string, number>();

    thisMonthSessions.forEach(session => {
      thisMonthCounts.set(session.emotionId, (thisMonthCounts.get(session.emotionId) || 0) + 1);
    });

    lastMonthSessions.forEach(session => {
      lastMonthCounts.set(session.emotionId, (lastMonthCounts.get(session.emotionId) || 0) + 1);
    });

    const totalThisMonth = thisMonthSessions.length;
    const allEmotions = new Set([...thisMonthCounts.keys(), ...lastMonthCounts.keys()]);

    return Array.from(allEmotions).map(emotion => {
      const thisCount = thisMonthCounts.get(emotion) || 0;
      const lastCount = lastMonthCounts.get(emotion) || 0;
      const percentage = totalThisMonth > 0 ? (thisCount / totalThisMonth) * 100 : 0;

      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (thisCount > lastCount) trend = 'up';
      else if (thisCount < lastCount) trend = 'down';

      return {
        emotion,
        count: thisCount,
        percentage,
        trend,
      };
    }).sort((a, b) => b.count - a.count);
  }, []);

  const calculateTimeOfDayStats = useCallback((sessions: Session[]): TimeOfDayStats => {
    const stats: TimeOfDayStats = {
      morning: 0,
      afternoon: 0,
      evening: 0,
      night: 0,
    };

    sessions.forEach(session => {
      if (!session.completedAt)