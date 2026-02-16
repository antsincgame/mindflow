import { SessionStatus } from '../utils/constants';

export interface Session {
  id: number;
  taskName: string;
  duration: number;
  completed: boolean;
  pausedCount: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface SessionData {
  taskName?: string;
  duration: number;
  completed: boolean;
  pausedCount: number;
  startedAt: string;
  completedAt?: string | null;
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number;
  averageSessionDuration: number;
  todaySessions: number;
  todayFocusTime: number;
  currentStreak: number;
  bestStreak: number;
}

export interface SessionState {
  currentSession: Session | null;
  isActive: boolean;
  isPaused: boolean;
  remainingTime: number;
  elapsedTime: number;
  status: SessionStatus;
}

export interface CreateSessionPayload {
  taskName?: string;
  duration: number;
}

export interface UpdateSessionPayload {
  pausedCount?: number;
  completed?: boolean;
  completedAt?: string;
}

export interface SessionBreakdown {
  sessionId: number;
  focusTime: number;
  breakTime: number;
  pauseDuration: number;
  totalTime: number;
  completionRate: number;
}

export interface DailySessionSummary {
  date: string;
  totalSessions: number;
  completedSessions: number;
  totalFocusTime: number;
  totalBreakTime: number;
  averageDuration: number;
  goalAchieved: boolean;
  goalProgress: number;
}

export interface WeeklySessions {
  week: string;
  sessions: DailySessionSummary[];
  totalSessions: number;
  totalFocusTime: number;
  completionRate: number;
  bestDay: string;
  worstDay: string;
}

export interface MonthlySessions {
  month: string;
  year: number;
  sessions: DailySessionSummary[];
  totalSessions: number;
  totalFocusTime: number;
  averageSessionsPerDay: number;
  completionRate: number;
  daysActive: number;
}

export interface SessionHistory {
  id: number;
  taskName: string;
  duration: number;
  completedAt: string;
  pausedCount: number;
  focusScore: number;
}

export interface SessionMetrics {
  sessionId: number;
  duration: number;
  actualDuration: number;
  pauseCount: number;
  pauseDuration: number;
  efficiency: number;
  focusQuality: number;
  timestamp: string;
}

export interface SessionGoal {
  dailyTarget: number;
  weeklyTarget: number;
  monthlyTarget: number;
  currentProgress: number;
  completionPercentage: number;
}

export interface SessionRecommendation {
  optimalDuration: number;
  bestTimeToStart: string;
  suggestedBreakDuration: number;
  confidence: number;
  reason: string;
}

export type SessionSortBy = 'date' | 'duration' | 'completion';
export type SessionFilterBy = 'all' | 'completed' | 'incomplete' | 'today' | 'week' | 'month';

export interface SessionFilters {
  sortBy: SessionSortBy;
  filterBy: SessionFilterBy;
  startDate?: string;
  endDate?: string;
  minDuration?: number;
  maxDuration?: number;
}

export interface SessionQueryResult {
  sessions: Session[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface SessionAnalytics {
  averageCompletionTime: number;
  completionRate: number;
  mostProductiveHour: number;
  mostProductiveDay: string;
  averagePausesPerSession: number;
  totalTimeInBreaks: number;
  focusConsistency: number;
  improvementTrend: number;
}

export interface SessionNotification {
  type: 'session_start' | 'session_complete' | 'break_start' | 'break_complete' | 'reminder';
  sessionId: number;
  message: string;
  timestamp: string;
  read: boolean;
}

export enum SessionErrorType {
  INVALID_DURATION = 'INVALID_DURATION',
  DATABASE_ERROR = 'DATABASE_ERROR',
  SESSION_NOT_FOUND = 'SESSION_NOT_FOUND',
  INVALID_STATE = 'INVALID_STATE',
  TIMER_ERROR = 'TIMER_ERROR',
}

export class SessionError extends Error {
  constructor(
    public type: SessionErrorType,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'SessionError';
  }
}