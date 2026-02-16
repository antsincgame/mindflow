import { Session } from './Session';

export interface DailyStatistics {
  date: string;
  sessionsCount: number;
  totalFocusTime: number;
  breaksCount: number;
  totalBreakTime: number;
  sessionsCompleted: number;
  sessionsIncomplete: number;
  averageSessionDuration: number;
  averageBreakDuration: number;
  dailyGoalAchieved: boolean;
  goalProgress: number;
}

export interface WeeklyStatistics {
  weekStart: string;
  weekEnd: string;
  totalSessions: number;
  totalFocusTime: number;
  totalBreaks: number;
  totalBreakTime: number;
  averageDailyFocusTime: number;
  averageDailyBreaks: number;
  completionRate: number;
  daysActive: number;
  bestDay: string;
  bestDayFocusTime: number;
  dailyStats: DailyStatistics[];
}

export interface MonthlyStatistics {
  month: string;
  year: number;
  totalSessions: number;
  totalFocusTime: number;
  totalBreaks: number;
  totalBreakTime: number;
  averageDailyFocusTime: number;
  averageSessionDuration: number;
  completionRate: number;
  daysActive: number;
  bestWeek: string;
  bestWeekFocusTime: number;
  weeklyStats: WeeklyStatistics[];
}

export interface StreakStatistics {
  currentStreak: number;
  bestStreak: number;
  lastSessionDate: string | null;
  streakStartDate: string | null;
  totalDaysWithSessions: number;
}

export interface ProductivityMetrics {
  mostProductiveHour: number | null;
  mostProductiveDay: string | null;
  averageSessionsPerDay: number;
  averageFocusTimePerDay: number;
  preferredSessionDuration: number;
  preferredBreakDuration: number;
  totalFocusTimeAllTime: number;
  totalSessionsAllTime: number;
}

export interface AchievementProgress {
  achievementId: string;
  title: string;
  description: string;
  progress: number;
  target: number;
  percentage: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface Statistics {
  userId: string;
  lastUpdated: string;
  
  // Current stats
  currentStreak: number;
  bestStreak: number;
  level: number;
  stars: number;
  
  // Totals
  totalSessions: number;
  totalFocusTime: number;
  totalBreaks: number;
  totalBreakTime: number;
  
  // Daily
  dailyStats: DailyStatistics;
  
  // Weekly
  weeklyStats: WeeklyStatistics;
  
  // Monthly
  monthlyStats: MonthlyStatistics;
  
  // Streak info
  streakStats: StreakStatistics;
  
  // Productivity
  productivity: ProductivityMetrics;
  
  // Achievements
  achievements: AchievementProgress[];
}

export interface StatisticsSnapshot {
  timestamp: string;
  sessionId: string;
  duration: number;
  completed: boolean;
  breakDuration?: number;
  pauseCount: number;
  startTime: string;
  endTime: string | null;
}

export interface StatisticsFilter {
  startDate?: string;
  endDate?: string;
  period?: 'day' | 'week' | 'month' | 'year' | 'all';
  includeIncomplete?: boolean;
}

export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color?: string;
    strokeWidth?: number;
  }[];
}

export interface StatisticsComparison {
  current: number;
  previous: number;
  difference: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
}

export interface SessionStatistics {
  totalSessions: number;
  completedSessions: number;
  incompleteSessions: number;
  completionRate: number;
  averageDuration: number;
  medianDuration: number;
  minDuration: number;
  maxDuration: number;
  totalTime: number;
}

export interface BreakStatistics {
  totalBreaks: number;
  skippedBreaks: number;
  completedBreaks: number;
  completionRate: number;
  averageDuration: number;
  totalTime: number;
}

export interface FocusTimeDistribution {
  morning: number;
  afternoon: number;
  evening: number;
  night: number;
}

export interface StatisticsAggregation {
  sessions: SessionStatistics;
  breaks: BreakStatistics;
  focusDistribution: FocusTimeDistribution;
  dailyAverage: number;
  weeklyTotal: number;
  monthlyTotal: number;
}

export class StatisticsModel {
  static createEmpty(): Statistics {
    return {
      userId: '',
      lastUpdated: new Date().toISOString(),
      currentStreak: 0,
      bestStreak: 0,
      level: 1,
      stars: 0,
      totalSessions: 0,
      totalFocusTime: 0,
      totalBreaks: 0,
      totalBreakTime: 0,
      dailyStats: this.createEmptyDailyStats(),
      weeklyStats: this.createEmptyWeeklyStats(),
      monthlyStats: this.createEmptyMonthlyStats(),
      streakStats: {
        currentStreak: 0,
        bestStreak: 0,
        lastSessionDate: null,
        streakStartDate: null,
        totalDaysWithSessions: 0,
      },
      productivity: {
        mostProductiveHour: null,
        mostProductiveDay: null,
        averageSessionsPerDay: 0,
        averageFocusTimePerDay: 0,
        preferredSessionDuration: 15,
        preferredBreakDuration: 5,
        totalFocusTimeAllTime: 0,
        totalSessionsAllTime: 0,
      },
      achievements: [],
    };
  }

  private static createEmptyDailyStats(): DailyStatistics {
    const today = new Date().toISOString().split('T')[0];
    return {
      date: today,
      sessionsCount: 0,
      totalFocusTime: 0,
      breaksCount: 0,
      totalBreakTime: 0,
      sessionsCompleted: 0,
      sessionsIncomplete: 0,
      averageSessionDuration: 0,
      averageBreakDuration: 0,
      dailyGoalAchieved: false,
      goalProgress: 0,
    };
  }

  private static createEmptyWeeklyStats(): WeeklyStatistics {
    const now = new Date();
    const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);

    return {
      weekStart: weekStart.toISOString().split('T')[0],
      weekEnd: weekEnd.toISOString().split('T')[0],
      totalSessions: 0,
      totalFocusTime: 0,
      totalBreaks: 0,
      totalBreakTime: 0,
      averageDailyFocusTime: 0,
      averageDailyBreaks: 0,
      completionRate: 0,
      daysActive: 0,
      bestDay: '',
      bestDayFocusTime: 0,
      dailyStats: [],
    };
  }

  private static createEmptyMonthlyStats(): MonthlyStatistics {
    const now = new Date();
    return {
      month: (now.getMonth() + 1).toString().padStart(2, '0'),
      year: now.getFullYear(),
      totalSessions: 0,
      totalFocusTime: 0,
      totalBreaks: 0,
      totalBreakTime: 0,
      averageDailyFocusTime: 0,
      averageSessionDuration: 0,
      completionRate: 0,
      daysActive: 0,
      bestWeek: '',
      bestWeekFocusTime: 0,
      weeklyStats: [],
    };
  }
}