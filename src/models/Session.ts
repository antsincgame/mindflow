export interface Session {
  id: string;
  exerciseId: string;
  emotionId: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  completed: boolean;
  rating?: number;
  notes?: string;
  biometricData?: {
    heartRateStart?: number;
    heartRateEnd?: number;
    heartRateAverage?: number;
    heartRateVariability?: number;
    stressLevelStart?: number;
    stressLevelEnd?: number;
    respiratoryRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
  };
  metrics?: {
    focusScore?: number;
    relaxationScore?: number;
    improvementPercentage?: number;
  };
  achievements?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionCreateInput {
  exerciseId: string;
  emotionId: string;
  startTime?: Date;
}

export interface SessionUpdateInput {
  endTime?: Date;
  duration?: number;
  completed?: boolean;
  rating?: number;
  notes?: string;
  biometricData?: {
    heartRateStart?: number;
    heartRateEnd?: number;
    heartRateAverage?: number;
    heartRateVariability?: number;
    stressLevelStart?: number;
    stressLevelEnd?: number;
    respiratoryRate?: number;
    bloodPressureSystolic?: number;
    bloodPressureDiastolic?: number;
  };
  metrics?: {
    focusScore?: number;
    relaxationScore?: number;
    improvementPercentage?: number;
  };
  achievements?: string[];
}

export interface SessionStats {
  totalSessions: number;
  completedSessions: number;
  totalDuration: number;
  averageDuration: number;
  averageRating: number;
  mostUsedExercise?: string;
  mostFrequentEmotion?: string;
  currentStreak: number;
  longestStreak: number;
  lastSessionDate?: Date;
}

export interface SessionFilter {
  exerciseId?: string;
  emotionId?: string;
  startDate?: Date;
  endDate?: Date;
  completed?: boolean;
  minRating?: number;
  maxRating?: number;
  minDuration?: number;
  maxDuration?: number;
}

export interface DailySessionSummary {
  date: Date;
  sessionCount: number;
  totalDuration: number;
  averageRating: number;
  emotions: string[];
  exercises: string[];
  completed: number;
  incomplete: number;
}

export interface WeeklySessionSummary {
  weekStart: Date;
  weekEnd: Date;
  sessionCount: number;
  totalDuration: number;
  averageRating: number;
  dailySummaries: DailySessionSummary[];
  topEmotions: Array<{ emotionId: string; count: number }>;
  topExercises: Array<{ exerciseId: string; count: number }>;
}

export interface MonthlySessionSummary {
  month: number;
  year: number;
  sessionCount: number;
  totalDuration: number;
  averageRating: number;
  weeklySummaries: WeeklySessionSummary[];
  topEmotions: Array<{ emotionId: string; count: number }>;
  topExercises: Array<{ exerciseId: string; count: number }>;
  completionRate: number;
}

export type SessionSortField = 
  | 'startTime' 
  | 'endTime' 
  | 'duration' 
  | 'rating' 
  | 'createdAt';

export type SessionSortOrder = 'asc' | 'desc';

export interface SessionSort {
  field: SessionSortField;
  order: SessionSortOrder;
}

export interface SessionWithRelations extends Session {
  exerciseName?: string;
  exerciseCategory?: string;
  emotionName?: string;
  emotionColor?: string;
}

export const DEFAULT_SESSION_DURATION = 300;
export const MIN_SESSION_DURATION = 60;
export const MAX_SESSION_DURATION = 3600;
export const MIN_RATING = 1;
export const MAX_RATING = 5;