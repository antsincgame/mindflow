export interface Settings {
  id: number;
  sessionDuration: number;
  breakDuration: number;
  dailyGoal: number;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  notificationsBlocked: boolean;
  workStartTime: string;
  workEndTime: string;
  updatedAt: string;
}

export interface SettingsInput {
  sessionDuration?: number;
  breakDuration?: number;
  dailyGoal?: number;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  notificationsBlocked?: boolean;
  workStartTime?: string;
  workEndTime?: string;
}

export const DEFAULT_SETTINGS: Settings = {
  id: 1,
  sessionDuration: 25,
  breakDuration: 5,
  dailyGoal: 5,
  soundEnabled: true,
  vibrationEnabled: true,
  notificationsBlocked: true,
  workStartTime: '09:00',
  workEndTime: '17:00',
  updatedAt: new Date().toISOString(),
};

export const SETTINGS_CONSTRAINTS = {
  sessionDuration: {
    min: 1,
    max: 120,
    step: 1,
  },
  breakDuration: {
    min: 1,
    max: 30,
    step: 1,
  },
  dailyGoal: {
    min: 1,
    max: 50,
    step: 1,
  },
};

export const TIME_PRESETS = [
  '06:00',
  '07:00',
  '08:00',
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
];

export interface SettingsState {
  settings: Settings | null;
  loading: boolean;
  error: string | null;
  lastUpdated: string | null;
}