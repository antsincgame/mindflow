export interface Task {
  id: string | number;
  title: string;
  description?: string;
  completed?: number | boolean;
  priority?: 'low' | 'medium' | 'high';
  scheduledTime?: number;
  duration?: number;
  color?: string;
  createdAt?: string;
}
