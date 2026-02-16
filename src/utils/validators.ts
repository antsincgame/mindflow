import { Session } from '../models/Session';
import { Settings } from '../models/Settings';

export const validators = {
  isValidSessionDuration: (duration: number): boolean => {
    return Number.isInteger(duration) && duration > 0 && duration <= 480;
  },

  isValidBreakDuration: (duration: number): boolean => {
    return Number.isInteger(duration) && duration > 0 && duration <= 60;
  },

  isValidDailyGoal: (goal: number): boolean => {
    return Number.isInteger(goal) && goal > 0 && goal <= 100;
  },

  isValidTaskName: (name: string): boolean => {
    if (typeof name !== 'string') return false;
    const trimmed = name.trim();
    return trimmed.length > 0 && trimmed.length <= 255;
  },

  isValidTime: (time: string): boolean => {
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  },

  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isValidSettings: (settings: Partial<Settings>): boolean => {
    if (settings.session_duration !== undefined && !validators.isValidSessionDuration(settings.session_duration)) {
      return false;
    }

    if (settings.break_duration !== undefined && !validators.isValidBreakDuration(settings.break_duration)) {
      return false;
    }

    if (settings.daily_goal !== undefined && !validators.isValidDailyGoal(settings.daily_goal)) {
      return false;
    }

    if (settings.work_start_time !== undefined && !validators.isValidTime(settings.work_start_time)) {
      return false;
    }

    if (settings.work_end_time !== undefined && !validators.isValidTime(settings.work_end_time)) {
      return false;
    }

    if (typeof settings.sound_enabled !== 'undefined' && typeof settings.sound_enabled !== 'boolean') {
      return false;
    }

    if (typeof settings.vibration_enabled !== 'undefined' && typeof settings.vibration_enabled !== 'boolean') {
      return false;
    }

    if (typeof settings.notifications_blocked !== 'undefined' && typeof settings.notifications_blocked !== 'boolean') {
      return false;
    }

    return true;
  },

  isValidSession: (session: Partial<Session>): boolean => {
    if (session.duration !== undefined && !validators.isValidSessionDuration(session.duration)) {
      return false;
    }

    if (session.task_name !== undefined && !validators.isValidTaskName(session.task_name)) {
      return false;
    }

    if (typeof session.completed !== 'undefined' && typeof session.completed !== 'boolean') {
      return false;
    }

    if (session.paused_count !== undefined && (!Number.isInteger(session.paused_count) || session.paused_count < 0)) {
      return false;
    }

    return true;
  },

  isValidStreak: (streak: number): boolean => {
    return Number.isInteger(streak) && streak >= 0;
  },

  isValidLevel: (level: number): boolean => {
    return Number.isInteger(level) && level > 0 && level <= 100;
  },

  isValidStars: (stars: number): boolean => {
    return Number.isInteger(stars) && stars >= 0;
  },

  sanitizeTaskName: (name: string): string => {
    return name.trim().replace(/[<>\"']/g, '').slice(0, 255);
  },

  validateAndSanitizeSettings: (settings: Partial<Settings>): Partial<Settings> | null => {
    if (!validators.isValidSettings(settings)) {
      return null;
    }

    const sanitized: Partial<Settings> = {};

    if (settings.session_duration !== undefined) {
      sanitized.session_duration = Math.min(Math.max(settings.session_duration, 1), 480);
    }

    if (settings.break_duration !== undefined) {
      sanitized.break_duration = Math.min(Math.max(settings.break_duration, 1), 60);
    }

    if (settings.daily_goal !== undefined) {
      sanitized.daily_goal = Math.min(Math.max(settings.daily_goal, 1), 100);
    }

    if (settings.work_start_time !== undefined) {
      sanitized.work_start_time = settings.work_start_time;
    }

    if (settings.work_end_time !== undefined) {
      sanitized.work_end_time = settings.work_end_time;
    }

    if (typeof settings.sound_enabled !== 'undefined') {
      sanitized.sound_enabled = Boolean(settings.sound_enabled);
    }

    if (typeof settings.vibration_enabled !== 'undefined') {
      sanitized.vibration_enabled = Boolean(settings.vibration_enabled);
    }

    if (typeof settings.notifications_blocked !== 'undefined') {
      sanitized.notifications_blocked = Boolean(settings.notifications_blocked);
    }

    return sanitized;
  },

  validateAndSanitizeSession: (session: Partial<Session>): Partial<Session> | null => {
    if (!validators.isValidSession(session)) {
      return null;
    }

    const sanitized: Partial<Session> = {};

    if (session.task_name !== undefined) {
      sanitized.task_name = validators.sanitizeTaskName(session.task_name);
    }

    if (session.duration !== undefined) {
      sanitized.duration = Math.min(Math.max(session.duration, 1), 480);
    }

    if (typeof session.completed !== 'undefined') {
      sanitized.completed = Boolean(session.completed);
    }

    if (session.paused_count !== undefined) {
      sanitized.paused_count = Math.max(0, Math.floor(session.paused_count));
    }

    return sanitized;
  },

  isValidTimeRange: (startTime: string, endTime: string): boolean => {
    if (!validators.isValidTime(startTime) || !validators.isValidTime(endTime)) {
      return false;
    }

    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);

    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    return startTotalMin < endTotalMin;
  },

  isWithinWorkHours: (time: string, workStartTime: string, workEndTime: string): boolean => {
    if (!validators.isValidTime(time) || !validators.isValidTimeRange(workStartTime, workEndTime)) {
      return false;
    }

    const [hour, min] = time.split(':').map(Number);
    const [startHour, startMin] = workStartTime.split(':').map(Number);
    const [endHour, endMin] = workEndTime.split(':').map(Number);

    const totalMin = hour * 60 + min;
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    return totalMin >= startTotalMin && totalMin <= endTotalMin;
  },
};

export default validators;