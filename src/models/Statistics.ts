export enum AggregationPeriod {
  Week = 'week',
  Month = 'month',
  AllTime = 'all_time',
}

export enum TrendDirection {
  Up = 'up',
  Down = 'down',
  Stable = 'stable',
}

export enum ChartType {
  Line = 'line',
  Bar = 'bar',
}

export enum MetricType {
  Stress = 'stress',
  Sleep = 'sleep',
  Sessions = 'sessions',
  HeartRate = 'heart_rate',
  HRV = 'hrv',
}

export interface HeatmapDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  count: number; // number of sessions
  intensity: number; // 0-4 scale for color gradient (0 = empty, 4 = max)
}

export interface HeatmapData {
  startDate: string;
  endDate: string;
  points: HeatmapDataPoint[];
  maxCount: number;
  totalSessions: number;
}

export interface ChartDataPoint {
  date: string; // ISO date string (YYYY-MM-DD)
  value: number;
  label?: string;
}

export interface ChartData {
  points: ChartDataPoint[];
  metricType: MetricType;
  chartType: ChartType;
  minValue: number;
  maxValue: number;
  averageValue: number;
  unit: string;
}

export interface TrendData {
  direction: TrendDirection;
  percentageChange: number;
  currentValue: number;
  previousValue: number;
  period: AggregationPeriod;
  metricType: MetricType;
}

export interface DailySummary {
  date: string;
  sessionsCount: number;
  totalDuration: number; // in seconds
  averageStressBefore: number;
  averageStressAfter: number;
  stressReduction: number;
  averageHeartRate: number | null;
  sleepQuality: number | null;
  emotionsUsed: string[]; // emotion IDs
  exercisesCompleted: string[]; // exercise IDs
}

export interface WeeklySummary {
  weekStartDate: string;
  weekEndDate: string;
  dailySummaries: DailySummary[];
  totalSessions: number;
  totalDuration: number;
  averageStressReduction: number;
  averageSleepQuality: number | null;
  streakDays: number;
  mostUsedEmotion: string | null;
  mostUsedExercise: string | null;
}

export interface MonthlySummary {
  month: number; // 1-12
  year: number;
  weeklySummaries: WeeklySummary[];
  totalSessions: number;
  totalDuration: number;
  averageStressReduction: number;
  averageSleepQuality: number | null;
  longestStreak: number;
  activeDays: number;
  mostUsedEmotion: string | null;
  mostUsedExercise: string | null;
}

export interface StatisticsOverview {
  period: AggregationPeriod;
  heatmapData: HeatmapData;
  stressChart: ChartData;
  sleepChart: ChartData;
  sessionsChart: ChartData;
  stressTrend: TrendData;
  sleepTrend: TrendData;
  sessionsTrend: TrendData;
  totalSessions: number;
  totalDuration: number; // in seconds
  currentStreak: number;
  longestStreak: number;
  averageSessionsPerDay: number;
  averageStressReduction: number;
}

export interface SessionResultStatistics {
  sessionDuration: number; // in seconds
  stressBefore: number;
  stressAfter: number;
  stressChange: number;
  heartRateBefore: number | null;
  heartRateAfter: number | null;
  heartRateChange: number | null;
  weeklyStressChart: ChartData;
  weeklySessionsChart: ChartData;
  weeklySleepChart: ChartData;
}