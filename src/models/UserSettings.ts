export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  dailyReminderTime: string; // HH:mm format
  sessionReminders: boolean;
  achievementAlerts: boolean;
  weeklyReport: boolean;
  weeklyReportDay: number; // 0-6 (Sunday-Saturday)
}

export interface BiometricSettings {
  trackHeartRate: boolean;
  trackHRV: boolean;
  trackSteps: boolean;
  trackSleep: boolean;
  trackMindfulMinutes: boolean;
  syncEnabled: boolean;
  lastSyncDate?: Date;
}

export interface AppearanceSettings {
  theme: 'light' | 'dark' | 'system';
  language: string;
  fontSize: 'small' | 'medium' | 'large';
  reducedMotion: boolean;
  highContrast: boolean;
}

export interface ExerciseSettings {
  defaultSessionDuration: number; // in minutes
  autoStartTimer: boolean;
  soundEnabled: boolean;
  voiceGuidanceEnabled: boolean;
  hapticFeedbackEnabled: boolean;
  backgroundMusicEnabled: boolean;
  musicVolume: number; // 0-1
}

export interface PrivacySettings {
  shareAnonymousData: boolean;
  allowCrashReports: boolean;
  allowAnalytics: boolean;
  dataSharingConsent: boolean;
  consentDate?: Date;
}

export interface GoalSettings {
  dailySessionGoal: number; // number of sessions per day
  weeklySessionGoal: number; // number of sessions per week
  streakGoalDays: number;
  mindfulMinutesGoal: number; // per week
  customGoals: CustomGoal[];
}

export interface CustomGoal {
  id: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  metric: 'sessions' | 'minutes' | 'days' | 'emotions';
  timeframe: 'daily' | 'weekly' | 'monthly';
  createdAt: Date;
  isActive: boolean;
}

export interface BackupSettings {
  autoBackupEnabled: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  lastBackupDate?: Date;
  cloudBackupEnabled: boolean;
  cloudProvider?: 'icloud' | 'google';
}

export interface AccessibilitySettings {
  screenReaderEnabled: boolean;
  largeText: boolean;
  boldText: boolean;
  buttonShapes: boolean;
  increaseContrast: boolean;
  reduceTransparency: boolean;
  voiceOverEnabled: boolean;
}

export interface OnboardingState {
  completed: boolean;
  currentStep: number;
  skipped: boolean;
  completedAt?: Date;
  version: string;
}

export interface UserSettings {
  id: string;
  userId?: string;
  notifications: NotificationSettings;
  biometric: BiometricSettings;
  appearance: AppearanceSettings;
  exercise: ExerciseSettings;
  privacy: PrivacySettings;
  goals: GoalSettings;
  backup: BackupSettings;
  accessibility: AccessibilitySettings;
  onboarding: OnboardingState;
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  dailyReminder: true,
  dailyReminderTime: '09:00',
  sessionReminders: true,
  achievementAlerts: true,
  weeklyReport: true,
  weeklyReportDay: 1, // Monday
};

export const DEFAULT_BIOMETRIC_SETTINGS: BiometricSettings = {
  trackHeartRate: true,
  trackHRV: true,
  trackSteps: false,
  trackSleep: true,
  trackMindfulMinutes: true,
  syncEnabled: true,
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: 'system',
  language: 'en',
  fontSize: 'medium',
  reducedMotion: false,
  highContrast: false,
};

export const DEFAULT_EXERCISE_SETTINGS: ExerciseSettings = {
  defaultSessionDuration: 5,
  autoStartTimer: false,
  soundEnabled: true,
  voiceGuidanceEnabled: true,
  hapticFeedbackEnabled: true,
  backgroundMusicEnabled: false,
  musicVolume: 0.5,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  shareAnonymousData: false,
  allowCrashReports: true,
  allowAnalytics: false,
  dataSharingConsent: false,
};

export const DEFAULT_GOAL_SETTINGS: GoalSettings = {
  dailySessionGoal: 1,
  weeklySessionGoal: 5,
  streakGoalDays: 7,
  mindfulMinutesGoal: 30,
  customGoals: [],
};

export const DEFAULT_BACKUP_SETTINGS: BackupSettings = {
  autoBackupEnabled: true,
  backupFrequency: 'weekly',
  cloudBackupEnabled: false,
};

export const DEFAULT_ACCESSIBILITY_SETTINGS: AccessibilitySettings = {
  screenReaderEnabled: false,
  largeText: false,
  boldText: false,
  buttonShapes: false,
  increaseContrast: false,
  reduceTransparency: false,
  voiceOverEnabled: false,
};

export const DEFAULT_ONBOARDING_STATE: OnboardingState = {
  completed: false,
  currentStep: 0,
  skipped: false,
  version: '1.0.0',
};

export const DEFAULT_USER_SETTINGS: Omit<UserSettings, 'id' | 'createdAt' | 'updatedAt'> = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  biometric: DEFAULT_BIOMETRIC_SETTINGS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  exercise: DEFAULT_EXERCISE_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  goals: DEFAULT_GOAL_SETTINGS,
  backup: DEFAULT_BACKUP_SETTINGS,
  accessibility: DEFAULT_ACCESSIBILITY_SETTINGS,
  onboarding: DEFAULT_ONBOARDING_STATE,
  version: '1.0.0',
};

export type SettingsCategory =
  | 'notifications'
  | 'biometric'
  | 'appearance'
  | 'exercise'
  | 'privacy'
  | 'goals'
  | 'backup'
  | 'accessibility';

export interface SettingsUpdatePayload {
  category: SettingsCategory;
  data: Partial<
    | NotificationSettings
    | BiometricSettings
    | AppearanceSettings
    | ExerciseSettings
    | PrivacySettings
    | GoalSettings
    | BackupSettings
    | AccessibilitySettings
  >;
}

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'ru', name: 'Русский' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
] as const;

export const FONT_SIZES = {
  small: {
    base: 14,
    heading: 20,
    title: 24,
  },
  medium: {
    base: 16,
    heading: 22,
    title: 28,
  },
  large: {
    base: 18,
    heading: 24,
    title: 32,
  },
} as const;