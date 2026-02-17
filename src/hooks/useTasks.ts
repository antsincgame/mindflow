import { useState, useEffect, useCallback } from 'react';
import { Task } from '../models/Task';
import * as taskService from '../services/taskService';

interface UseTasksResult {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Task>;
  updateTask: (id: number, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
  toggleTaskComplete: (id: number) => Promise<void>;
  getTaskById: (id: number) => Task | undefined;
  getTasksByDate: (date: Date) => Task[];
  getUpcomingTasks: () => Task[];
  getCompletedTasks: () => Task[];
  refreshTasks: () => Promise<void>;
}

export const useTasks = (): UseTasksResult => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const loadedTasks = await taskService.getAllTasks();
      setTasks(loadedTasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error loading tasks:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> => {
    try {
      setError(null);
      const newTask = await taskService.createTask(taskData);
      setTasks(prevTasks => [...prevTasks, newTask].sort((a, b) => {
        if (!a.scheduledTime) return 1;
        if (!b.scheduledTime) return -1;
        return a.scheduledTime - b.scheduledTime;
      }));
      return newTask;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add task';
      setError(errorMessage);
      console.error('Error adding task:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const updateTask = useCallback(async (id: number, updates: Partial<Task>): Promise<void> => {
    try {
      setError(null);
      await taskService.updateTask(id, updates);
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === id
            ? { ...task, ...updates, updatedAt: Date.now() }
            : task
        ).sort((a, b) => {
          if (!a.scheduledTime) return 1;
          if (!b.scheduledTime) return -1;
          return a.scheduledTime - b.scheduledTime;
        })
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update task';
      setError(errorMessage);
      console.error('Error updating task:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteTask = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      await taskService.deleteTask(id);
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete task';
      setError(errorMessage);
      console.error('Error deleting task:', err);
      throw new Error(errorMessage);
    }
  }, []);

  const toggleTaskComplete = useCallback(async (id: number): Promise<void> => {
    try {
      setError(null);
      const task = tasks.find(t => t.id === id);
      if (!task) {
        throw new Error('Task not found');
      }
      await taskService.updateTask(id, { completed: !task.completed });
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === id
            ? { ...t, completed: !t.completed, updatedAt: Date.now() }
            : t
        )
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to toggle task';
      setError(errorMessage);
      console.error('Error toggling task:', err);
      throw new Error(errorMessage);
    }
  }, [tasks]);

  const getTaskById = useCallback((id: number): Task | undefined => {
    return tasks.find(task => task.id === id);
  }, [tasks]);

  const getTasksByDate = useCallback((date: Date): Task[] => {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return tasks.filter(task => {
      if (!task.scheduledTime) return false;
      const taskDate = new Date(task.scheduledTime);
      return taskDate >= startOfDay && taskDate <= endOfDay;
    }).sort((a, b) => {
      if (!a.scheduledTime || !b.scheduledTime) return 0;
      return a.scheduledTime - b.scheduledTime;
    });
  }, [tasks]);

  const getUpcomingTasks = useCallback((): Task[] => {
    const now = Date.now();
    return tasks
      .filter(task => !task.completed && task.scheduledTime && task.scheduledTime >= now)
      .sort((a, b) => {
        if (!a.scheduledTime || !b.scheduledTime) return 0;
        return a.scheduledTime - b.scheduledTime;
      })
      .slice(0, 10);
  }, [tasks]);

  const getCompletedTasks = useCallback((): Task[] => {
    return tasks
      .filter(task => task.completed)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }, [tasks]);

  const refreshTasks = useCallback(async (): Promise<void> => {
    await loadTasks();
  }, [loadTasks]);

  return {
    tasks,
    loading,
    error,
    addTask,
    updateTask,
    deleteTask,
    toggleTaskComplete,
    getTaskById,
    getTasksByDate,
    getUpcomingTasks,
    getCompletedTasks,
    refreshTasks,
  };
};