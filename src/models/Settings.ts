export interface Settings {
  sessionDuration: number;
  breakDuration: number;
  longBreakDuration: number;
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  theme: 'light' | 'dark' | 'auto';
}
