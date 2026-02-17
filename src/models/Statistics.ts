export interface Statistics {
  totalSessions: number;
  totalFocusTime: number;
  currentStreak: number;
  bestStreak: number;
  averageSessionDuration?: number;
  completedTasks?: number;
}
