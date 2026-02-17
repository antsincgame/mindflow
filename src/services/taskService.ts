import * as SQLite from 'expo-sqlite';
import { Task, TaskPriority, TaskStatus } from '../models/Task';

const db = SQLite.openDatabase('mindflow.db');

export interface CreateTaskInput {
  title: string;
  scheduledTime?: number;
  duration?: number;
  priority?: TaskPriority;
  color?: string;
  note?: string;
}

export interface UpdateTaskInput {
  title?: string;
  scheduledTime?: number;
  duration?: number;
  priority?: TaskPriority;
  color?: string;
  note?: string;
  completed?: boolean;
}

export interface TaskFilters {
  completed?: boolean;
  priority?: TaskPriority;
  startDate?: number;
  endDate?: number;
  searchQuery?: string;
}

class TaskService {
  async createTask(input: CreateTaskInput): Promise<Task> {
    return new Promise((resolve, reject) => {
      const {
        title,
        scheduledTime = null,
        duration = 60,
        priority = 'medium',
        color = '#6366F1',
        note = null,
      } = input;

      const now = Math.floor(Date.now() / 1000);

      db.transaction((tx) => {
        tx.executeSql(
          `INSERT INTO tasks (title, scheduled_time, duration, priority, color, note, completed, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
          [title, scheduledTime, duration, priority, color, note, now, now],
          (_, result) => {
            const taskId = result.insertId;
            if (taskId) {
              this.getTaskById(taskId).then(resolve).catch(reject);
            } else {
              reject(new Error('Failed to create task'));
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getTaskById(id: number): Promise<Task> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM tasks WHERE id = ?',
          [id],
          (_, { rows }) => {
            if (rows.length > 0) {
              resolve(this.mapRowToTask(rows.item(0)));
            } else {
              reject(new Error(`Task with id ${id} not found`));
            }
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getAllTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT * FROM tasks ORDER BY scheduled_time ASC, created_at DESC',
          [],
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              tasks.push(this.mapRowToTask(rows.item(i)));
            }
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getTasksByDate(date: Date): Promise<Task[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const startTimestamp = Math.floor(startOfDay.getTime() / 1000);
    const endTimestamp = Math.floor(endOfDay.getTime() / 1000);

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM tasks 
           WHERE scheduled_time >= ? AND scheduled_time <= ?
           ORDER BY scheduled_time ASC`,
          [startTimestamp, endTimestamp],
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              tasks.push(this.mapRowToTask(rows.item(i)));
            }
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getTasksByWeek(weekStart: Date): Promise<Task[]> {
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const startTimestamp = Math.floor(weekStart.getTime() / 1000);
    const endTimestamp = Math.floor(weekEnd.getTime() / 1000);

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM tasks 
           WHERE scheduled_time >= ? AND scheduled_time <= ?
           ORDER BY scheduled_time ASC`,
          [startTimestamp, endTimestamp],
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              tasks.push(this.mapRowToTask(rows.item(i)));
            }
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getFilteredTasks(filters: TaskFilters): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM tasks WHERE 1=1';
      const params: any[] = [];

      if (filters.completed !== undefined) {
        query += ' AND completed = ?';
        params.push(filters.completed ? 1 : 0);
      }

      if (filters.priority) {
        query += ' AND priority = ?';
        params.push(filters.priority);
      }

      if (filters.startDate) {
        query += ' AND scheduled_time >= ?';
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ' AND scheduled_time <= ?';
        params.push(filters.endDate);
      }

      if (filters.searchQuery) {
        query += ' AND (title LIKE ? OR note LIKE ?)';
        const searchPattern = `%${filters.searchQuery}%`;
        params.push(searchPattern, searchPattern);
      }

      query += ' ORDER BY scheduled_time ASC, created_at DESC';

      db.transaction((tx) => {
        tx.executeSql(
          query,
          params,
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              tasks.push(this.mapRowToTask(rows.item(i)));
            }
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUnscheduledTasks(): Promise<Task[]> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM tasks 
           WHERE scheduled_time IS NULL AND completed = 0
           ORDER BY priority DESC, created_at DESC`,
          [],
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              tasks.push(this.mapRowToTask(rows.item(i)));
            }
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getUpcomingTasks(limit: number = 5): Promise<Task[]> {
    const now = Math.floor(Date.now() / 1000);

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM tasks 
           WHERE scheduled_time >= ? AND completed = 0
           ORDER BY scheduled_time ASC
           LIMIT ?`,
          [now, limit],
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              tasks.push(this.mapRowToTask(rows.item(i)));
            }
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getOverdueTasks(): Promise<Task[]> {
    const now = Math.floor(Date.now() / 1000);

    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          `SELECT * FROM tasks 
           WHERE scheduled_time < ? AND completed = 0
           ORDER BY scheduled_time ASC`,
          [now],
          (_, { rows }) => {
            const tasks: Task[] = [];
            for (let i = 0; i < rows.length; i++) {
              tasks.push(this.mapRowToTask(rows.item(i)));
            }
            resolve(tasks);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async updateTask(id: number, updates: UpdateTaskInput): Promise<Task> {
    return new Promise((resolve, reject) => {
      const fields: string[] = [];
      const values: any[] = [];

      if (updates.title !== undefined) {
        fields.push('title = ?');
        values.push(updates.title);
      }
      if (updates.scheduledTime !== undefined) {
        fields.push('scheduled_time = ?');
        values.push(updates.scheduledTime);
      }
      if (updates.duration !== undefined) {
        fields.push('duration = ?');
        values.push(updates.duration);
      }
      if (updates.priority !== undefined) {
        fields.push('priority = ?');
        values.push(updates.priority);
      }
      if (updates.color !== undefined) {
        fields.push('color = ?');
        values.push(updates.color);
      }
      if (updates.note !== undefined) {
        fields.push('note = ?');
        values.push(updates.note);
      }
      if (updates.completed !== undefined) {
        fields.push('completed = ?');
        values.push(updates.completed ? 1 : 0);
      }

      if (fields.length === 0) {
        this.getTaskById(id).then(resolve).catch(reject);
        return;
      }

      const now = Math.floor(Date.now() / 1000);
      fields.push('updated_at = ?');
      values.push(now);
      values.push(id);

      const query = `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`;

      db.transaction((tx) => {
        tx.executeSql(
          query,
          values,
          () => {
            this.getTaskById(id).then(resolve).catch(reject);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async toggleTaskCompletion(id: number): Promise<Task> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'SELECT completed FROM tasks WHERE id = ?',
          [id],
          (_, { rows }) => {
            if (rows.length === 0) {
              reject(new Error(`Task with id ${id} not found`));
              return;
            }
            const currentCompleted = rows.item(0).completed;
            const newCompleted = currentCompleted === 1 ? 0 : 1;
            const now = Math.floor(Date.now() / 1000);

            tx.executeSql(
              'UPDATE tasks SET completed = ?, updated_at = ? WHERE id = ?',
              [newCompleted, now, id],
              () => {
                this.getTaskById(id).then(resolve).catch(reject);
              },
              (_, error) => {
                reject(error);
                return false;
              }
            );
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async deleteTask(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM tasks WHERE id = ?',
          [id],
          () => {
            resolve();
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async deleteCompletedTasks(): Promise<number> {
    return new Promise((resolve, reject) => {
      db.transaction((tx) => {
        tx.executeSql(
          'DELETE FROM tasks WHERE completed = 1',
          [],
          (_, result) => {
            resolve(result.rowsAffected);
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async getTaskStats(): Promise<{
    total: number;
    completed: number;
    pending: number;
    overdue: number;
    scheduled: number;
    unscheduled: number;
  }> {
    return new Promise((resolve, reject) => {
      const now = Math.floor(Date.now() / 1000);

      db.transaction((tx) => {
        tx.executeSql(
          `SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN scheduled_time < ? AND completed = 0 THEN 1 ELSE 0 END) as overdue,
            SUM(CASE WHEN scheduled_time IS NOT NULL THEN 1 ELSE 0 END) as scheduled,
            SUM(CASE WHEN scheduled_time IS NULL THEN 1 ELSE 0 END) as unscheduled
           FROM tasks`,
          [now],
          (_, { rows }) => {
            const stats = rows.item(0);
            resolve({
              total: stats.total || 0,
              completed: stats.completed || 0,
              pending: stats.pending || 0,
              overdue: stats.overdue || 0,
              scheduled: stats.scheduled || 0,
              unscheduled: stats.unscheduled || 0,
            });
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  async rescheduleTask(id: number, newScheduledTime: number): Promise<Task> {
    return this.updateTask(id, { scheduledTime: newScheduledTime });
  }

  async bulkUpdatePriority(taskIds: number[], priority: TaskPriority): Promise<void> {
    return new Promise((resolve, reject) => {
      if (taskIds.length === 0) {
        resolve();
        return;
      }

      const placeholders = taskIds.map(() => '?').join(',');
      const now = Math.floor(Date.now() / 1000);

      db.transaction((tx) => {
        tx.executeSql(
          `UPDATE tasks SET priority = ?, updated_at = ? WHERE id IN (${placeholders})`,
          [priority, now, ...taskIds],
          () => {
            resolve();
          },
          (_, error) => {
            reject(error);
            return false;
          }
        );
      });
    });
  }

  private mapRowTo