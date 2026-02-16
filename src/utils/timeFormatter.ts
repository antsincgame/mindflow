import { format, formatDistance, differenceInSeconds, parse } from 'date-fns';
import { ru } from 'date-fns/locale';

export const timeFormatter = {
  formatTime: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  formatTimeShort: (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },

  formatTimeLong: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts: string[] = [];

    if (hours > 0) {
      parts.push(`${hours}ч`);
    }
    if (minutes > 0) {
      parts.push(`${minutes}м`);
    }
    if (secs > 0 || parts.length === 0) {
      parts.push(`${secs}с`);
    }

    return parts.join(' ');
  },

  formatDuration: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }

    return `${minutes}м`;
  },

  formatDate: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'd MMMM yyyy', { locale: ru });
  },

  formatDateTime: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'd MMMM yyyy, HH:mm', { locale: ru });
  },

  formatTime24: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'HH:mm', { locale: ru });
  },

  formatTime12: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'hh:mm a', { locale: ru });
  },

  formatDateShort: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'd MMM', { locale: ru });
  },

  formatDateRelative: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return formatDistance(dateObj, new Date(), { locale: ru, addSuffix: true });
  },

  formatWeekday: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'EEEE', { locale: ru });
  },

  formatMonth: (date: Date | string): string => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, 'MMMM yyyy', { locale: ru });
  },

  getTimeOfDay: (date: Date | string): 'morning' | 'afternoon' | 'evening' | 'night' => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const hour = dateObj.getHours();

    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  },

  getGreeting: (date: Date | string = new Date()): string => {
    const timeOfDay = timeFormatter.getTimeOfDay(date);

    const greetings = {
      morning: 'Доброе утро',
      afternoon: 'Добрый день',
      evening: 'Добрый вечер',
      night: 'Доброй ночи',
    };

    return greetings[timeOfDay];
  },

  isSameDay: (date1: Date | string, date2: Date | string): boolean => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;

    return (
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate()
    );
  },

  isToday: (date: Date | string): boolean => {
    return timeFormatter.isSameDay(date, new Date());
  },

  isYesterday: (date: Date | string): boolean => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return timeFormatter.isSameDay(date, yesterday);
  },

  getStartOfDay: (date: Date | string = new Date()): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const start = new Date(dateObj);
    start.setHours(0, 0, 0, 0);
    return start;
  },

  getEndOfDay: (date: Date | string = new Date()): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const end = new Date(dateObj);
    end.setHours(23, 59, 59, 999);
    return end;
  },

  getStartOfWeek: (date: Date | string = new Date()): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const day = dateObj.getDay();
    const diff = dateObj.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(dateObj.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  },

  getEndOfWeek: (date: Date | string = new Date()): Date => {
    const start = timeFormatter.getStartOfWeek(date);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  },

  getStartOfMonth: (date: Date | string = new Date()): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const start = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
  },

  getEndOfMonth: (date: Date | string = new Date()): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const end = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
    return end;
  },

  parseTime: (timeString: string, format: string = 'HH:mm'): Date => {
    return parse(timeString, format, new Date());
  },

  secondsBetween: (date1: Date | string, date2: Date | string): number => {
    const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
    const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
    return differenceInSeconds(d2, d1);
  },

  minutesBetween: (date1: Date | string, date2: Date | string): number => {
    return Math.floor(timeFormatter.secondsBetween(date1, date2) / 60);
  },

  hoursBetween: (date1: Date | string, date2: Date | string): number => {
    return Math.floor(timeFormatter.secondsBetween(date1, date2) / 3600);
  },

  daysBetween: (date1: Date | string, date2: Date | string): number => {
    return Math.floor(timeFormatter.secondsBetween(date1, date2) / 86400);
  },

  addSeconds: (date: Date | string, seconds: number): Date => {
    const dateObj = typeof date === 'string' ? new Date(date) : new Date(date);
    dateObj.setSeconds(dateObj.getSeconds() + seconds);
    return dateObj;
  },

  addMinutes: (date: Date | string, minutes: number): Date => {
    return timeFormatter.addSeconds(date, minutes * 60);
  },

  addHours: (date: Date | string, hours: number): Date => {
    return timeFormatter.addSeconds(date, hours * 3600);
  },

  addDays: (date: Date | string, days: number): Date => {
    return timeFormatter.addSeconds(date, days * 86400);
  },

  formatTimeRange: (startDate: Date | string, endDate: Date | string): string => {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

    const startTime = format(start, 'HH:mm', { locale: ru });
    const endTime = format(end, 'HH:mm', { locale: ru });

    return `${startTime} - ${endTime}`;
  },

  formatSessionTime: (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
      return `${hours}ч ${minutes}м`;
    }

    return `${minutes}м`;
  },

  isBetweenTimes: (date: Date | string, startTime: string, endTime: string): boolean => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const currentTime = format(dateObj, 'HH:mm', { locale: ru });

    return currentTime >= startTime && currentTime <= endTime;
  },

  getPercentageOfDay: (date: Date | string = new Date()): number => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const start = timeFormatter.getStartOfDay(dateObj);
    const end = timeFormatter.getEndOfDay(dateObj);

    const elapsed = dateObj.getTime() - start.getTime();
    const total = end.getTime() - start.getTime();

    return Math.round((elapsed / total) * 100);
  },

  formatCountdown: (targetDate: Date | string): string => {
    const target = typeof targetDate === 'string' ? new Date(targetDate) : targetDate;
    const now = new Date();

    if (target <= now) {
      return 'Истекло';
    }

    const seconds = differenceInSeconds(target, now);
    return timeFormatter.formatTimeLong(seconds);
  },
};

export default timeFormatter;