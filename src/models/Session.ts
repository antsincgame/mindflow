export interface Session {
  id: string | number;
  taskName: string;
  duration: number;
  completed: boolean;
  pausedCount: number;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}
