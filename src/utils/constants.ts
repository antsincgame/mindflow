export const SESSION_DEFAULTS = {
  DURATION: 15 * 60, // 15 minutes in seconds
  MIN_DURATION: 5 * 60, // 5 minutes
  MAX_DURATION: 120 * 60, // 120 minutes
  DEFAULT_DAILY_GOAL: 5, // sessions per day
  MIN_DAILY_GOAL: 1,
  MAX_DAILY_GOAL: 20,
};

export const BREAK_DEFAULTS = {
  DURATION: 5 * 60, // 5 minutes in seconds
  MIN_DURATION: 1 * 60, // 1 minute
  MAX_DURATION: 30 * 60, // 30 minutes
  SHORT_BREAK: 5 * 60,
  LONG_BREAK: 15 * 60,
  LONG_BREAK_INTERVAL: 4, // after 4 sessions
};

export const TIMER_CONSTANTS = {
  TICK_INTERVAL: 1000, // 1 second in milliseconds
  WARNING_THRESHOLD: 60, // Show warning at 60 seconds remaining
  CRITICAL_THRESHOLD: 10, // Show critical at 10 seconds remaining
};

export const STORAGE_KEYS = {
  SESSIONS: '@mindflow_sessions',
  BREAKS: '@mindflow_breaks',
  ACHIEVEMENTS: '@mindflow_achievements',
  SETTINGS: '@mindflow_settings',
  USER_STATS: '@mindflow_user_stats',
  CURRENT_SESSION: '@mindflow_current_session',
  LAST_SESSION_DATE: '@mindflow_last_session_date',
  USER_PREFERENCES: '@mindflow_user_preferences',
  NOTIFICATION_TOKENS: '@mindflow_notification_tokens',
  APP_THEME: '@mindflow_app_theme',
  ONBOARDING_COMPLETED: '@mindflow_onboarding_completed',
};

export const DATABASE_CONSTANTS = {
  DB_NAME: 'mindflow.db',
  DB_VERSION: 1,
  TABLES: {
    SESSIONS: 'sessions',
    BREAKS: 'breaks',
    ACHIEVEMENTS: 'achievements',
    SETTINGS: 'settings',
    USER_STATS: 'user_stats',
  },
};

export const ACHIEVEMENT_TYPES = {
  FIRST_SESSION: 'first_session',
  FIVE_SESSIONS: 'five_sessions',
  TEN_SESSIONS: 'ten_sessions',
  FIFTY_SESSIONS: 'fifty_sessions',
  HUNDRED_SESSIONS: 'hundred_sessions',
  ONE_HOUR_FOCUS: 'one_hour_focus',
  FIVE_HOURS_FOCUS: 'five_hours_focus',
  TWENTY_HOURS_FOCUS: 'twenty_hours_focus',
  SEVEN_DAY_STREAK: 'seven_day_streak',
  THIRTY_DAY_STREAK: 'thirty_day_streak',
  PERFECT_DAY: 'perfect_day',
  EARLY_BIRD: 'early_bird',
  NIGHT_OWL: 'night_owl',
  CONSISTENT_WORKER: 'consistent_worker',
  FOCUS_MASTER: 'focus_master',
  NO_BREAKS_SKIPPED: 'no_breaks_skipped',
  LEVEL_5: 'level_5',
  LEVEL_10: 'level_10',
  LEVEL_25: 'level_25',
};

export const LEVELS = {
  MIN_LEVEL: 1,
  MAX_LEVEL: 50,
  XP_PER_SESSION: 10,
  XP_PER_MINUTE_FOCUS: 1,
  XP_MULTIPLIER_STREAK: 1.5,
  XP_FOR_LEVEL_UP: 100,
};

export const REWARDS = {
  STARS_PER_SESSION: 1,
  STARS_PER_HOUR_FOCUS: 5,
  BONUS_STARS_STREAK: 2,
  BONUS_STARS_DAILY_GOAL: 10,
};

export const NOTIFICATIONS = {
  CHANNELS: {
    SESSION: 'session_notifications',
    BREAK: 'break_notifications',
    ACHIEVEMENT: 'achievement_notifications',
    REMINDER: 'reminder_notifications',
  },
  TIMES: {
    MORNING_REMINDER: '09:00',
    EVENING_REMINDER: '17:00',
  },
};

export const TIME_PERIODS = {
  EARLY_MORNING: { start: 5, end: 9 }, // 5 AM - 9 AM
  MORNING: { start: 9, end: 12 }, // 9 AM - 12 PM
  AFTERNOON: { start: 12, end: 17 }, // 12 PM - 5 PM
  EVENING: { start: 17, end: 21 }, // 5 PM - 9 PM
  NIGHT: { start: 21, end: 5 }, // 9 PM - 5 AM
};

export const STATISTICS_RANGES = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
  ALL_TIME: 'all_time',
};

export const API_CONSTANTS = {
  REQUEST_TIMEOUT: 30000, // 30 seconds
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000, // 1 second
};

export const ANIMATION_DURATIONS = {
  FAST: 200,
  NORMAL: 300,
  SLOW: 500,
  VERY_SLOW: 800,
};

export const VALIDATION_RULES = {
  MIN_TASK_NAME_LENGTH: 1,
  MAX_TASK_NAME_LENGTH: 100,
  MIN_SESSION_DURATION: 60, // 1 minute
  MAX_SESSION_DURATION: 7200, // 2 hours
  MIN_BREAK_DURATION: 60, // 1 minute
  MAX_BREAK_DURATION: 1800, // 30 minutes
};

export const ERROR_MESSAGES = {
  SESSION_NOT_FOUND: 'Session not found',
  DATABASE_ERROR: 'Database error occurred',
  INVALID_DURATION: 'Invalid duration provided',
  INVALID_TASK_NAME: 'Invalid task name',
  NOTIFICATION_PERMISSION_DENIED: 'Notification permission denied',
  STORAGE_ERROR: 'Storage error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred',
};

export const SUCCESS_MESSAGES = {
  SESSION_STARTED: 'Session started successfully',
  SESSION_COMPLETED: 'Session completed successfully',
  SESSION_PAUSED: 'Session paused',
  SESSION_RESUMED: 'Session resumed',
  SESSION_STOPPED: 'Session stopped',
  BREAK_COMPLETED: 'Break completed successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  ACHIEVEMENT_UNLOCKED: 'Achievement unlocked',
};

export const SOUND_FILES = {
  SESSION_COMPLETE: 'session-complete',
  BREAK_COMPLETE: 'break-complete',
  NOTIFICATION: 'notification',
  TIMER_TICK: 'timer-tick',
  WARNING: 'warning',
};

export const HAPTIC_PATTERNS = {
  LIGHT: 'light',
  MEDIUM: 'medium',
  HEAVY: 'heavy',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
};

export const COLORS_PALETTE = {
  PRIMARY: '#6366F1',
  PRIMARY_DARK: '#4F46E5',
  PRIMARY_LIGHT: '#818CF8',
  SECONDARY: '#EC4899',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6',
  NEUTRAL_50: '#F9FAFB',
  NEUTRAL_100: '#F3F4F6',
  NEUTRAL_200: '#E5E7EB',
  NEUTRAL_300: '#D1D5DB',
  NEUTRAL_400: '#9CA3AF',
  NEUTRAL_500: '#6B7280',
  NEUTRAL_600: '#4B5563',
  NEUTRAL_700: '#374151',
  NEUTRAL_800: '#1F2937',
  NEUTRAL_900: '#111827',
};

export const SPACING_SCALE = {
  XS: 4,
  SM: 8,
  MD: 12,
  LG: 16,
  XL: 24,
  XXL: 32,
  XXXL: 48,
};

export const BORDER_RADIUS = {
  SMALL: 4,
  MEDIUM: 8,
  LARGE: 12,
  EXTRA_LARGE: 16,
  ROUND: 999,
};

export const FEATURE_FLAGS = {
  ENABLE_AI_ADAPTATION: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_SOUND: true,
  ENABLE_HAPTICS: true,
  ENABLE_BACKGROUND_TASKS: true,
  ENABLE_ANALYTICS: false,
  ENABLE_DARK_MODE: true,
  ENABLE_OFFLINE_MODE: true,
};

export const APP_INFO = {
  NAME: 'MindFlow',
  VERSION: '1.0.0',
  BUILD_NUMBER: 1,
  AUTHOR: 'MindFlow Team',
  SUPPORT_EMAIL: 'support@mindflow.app',
  WEBSITE: 'https://mindflow.app',
};

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  TIME_FORMAT: /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/,
  TASK_NAME: /^[a-zA-Z0-9\s\-_]{1,100}$/,
};

export const DATE_FORMATS = {
  DISPLAY_DATE: 'MMM dd, yyyy',
  DISPLAY_TIME: 'HH:mm',
  DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
  ISO_DATE: 'yyyy-MM-dd',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
  SHORT_TIME: 'HH:mm',
  FULL_TIME: 'HH:mm:ss',
};