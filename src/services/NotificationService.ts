import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const NOTIFICATION_SETTINGS_KEY = '@notification_settings';
const REMINDER_SETTINGS_KEY = '@reminder_settings';

export interface NotificationSettings {
  enabled: boolean;
  dailyReminder: boolean;
  reminderTime: string; // HH:mm format
  sessionComplete: boolean;
  achievements: boolean;
  weeklyReport: boolean;
}

export interface ReminderSchedule {
  id: string;
  time: string;
  title: string;
  body: string;
  data?: any;
}

class NotificationService {
  private static instance: NotificationService;
  private isInitialized: boolean = false;
  private notificationSettings: NotificationSettings = {
    enabled: true,
    dailyReminder: true,
    reminderTime: '09:00',
    sessionComplete: true,
    achievements: true,
    weeklyReport: true,
  };

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
      }),
    });

    // Load settings from storage
    await this.loadSettings();

    // Request permissions
    await this.requestPermissions();

    this.isInitialized = true;
  }

  public async requestPermissions(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Notification permissions not granted');
      return false;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });

      await Notifications.setNotificationChannelAsync('reminders', {
        name: 'Daily Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4A90E2',
      });

      await Notifications.setNotificationChannelAsync('achievements', {
        name: 'Achievements',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#50E3C2',
      });
    }

    return true;
  }

  public async getSettings(): Promise<NotificationSettings> {
    return this.notificationSettings;
  }

  public async updateSettings(settings: Partial<NotificationSettings>): Promise<void> {
    this.notificationSettings = {
      ...this.notificationSettings,
      ...settings,
    };

    await AsyncStorage.setItem(
      NOTIFICATION_SETTINGS_KEY,
      JSON.stringify(this.notificationSettings)
    );

    // Reschedule daily reminders if settings changed
    if (settings.dailyReminder !== undefined || settings.reminderTime !== undefined) {
      await this.scheduleDailyReminder();
    }
  }

  private async loadSettings(): Promise<void> {
    try {
      const settingsJson = await AsyncStorage.getItem(NOTIFICATION_SETTINGS_KEY);
      if (settingsJson) {
        this.notificationSettings = JSON.parse(settingsJson);
      }
    } catch (error) {
      console.error('Failed to load notification settings:', error);
    }
  }

  public async scheduleDailyReminder(): Promise<void> {
    // Cancel existing daily reminders
    await this.cancelDailyReminder();

    if (!this.notificationSettings.enabled || !this.notificationSettings.dailyReminder) {
      return;
    }

    const [hours, minutes] = this.notificationSettings.reminderTime.split(':').map(Number);

    const trigger = {
      hour: hours,
      minute: minutes,
      repeats: true,
    };

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Time for Your Daily Practice 🧘‍♀️',
        body: 'Take a moment to check in with yourself and practice mindfulness.',
        data: { type: 'daily_reminder' },
        sound: true,
      },
      trigger,
    });

    // Save reminder ID
    await AsyncStorage.setItem(
      REMINDER_SETTINGS_KEY,
      JSON.stringify({ dailyReminderId: notificationId })
    );
  }

  public async cancelDailyReminder(): Promise<void> {
    try {
      const reminderJson = await AsyncStorage.getItem(REMINDER_SETTINGS_KEY);
      if (reminderJson) {
        const { dailyReminderId } = JSON.parse(reminderJson);
        if (dailyReminderId) {
          await Notifications.cancelScheduledNotificationAsync(dailyReminderId);
        }
      }
    } catch (error) {
      console.error('Failed to cancel daily reminder:', error);
    }
  }

  public async sendLocalNotification(
    title: string,
    body: string,
    data?: any
  ): Promise<string> {
    if (!this.notificationSettings.enabled) {
      return '';
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  public async scheduleNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: any
  ): Promise<string> {
    if (!this.notificationSettings.enabled) {
      return '';
    }

    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger,
    });
  }

  public async notifySessionComplete(
    exerciseName: string,
    duration: number
  ): Promise<void> {
    if (!this.notificationSettings.sessionComplete) {
      return;
    }

    const minutes = Math.floor(duration / 60);
    await this.sendLocalNotification(
      'Session Complete! 🎉',
      `Great job! You completed ${exerciseName} (${minutes} min)`,
      { type: 'session_complete', exerciseName, duration }
    );
  }

  public async notifyAchievementUnlocked(
    achievementTitle: string,
    achievementDescription: string
  ): Promise<void> {
    if (!this.notificationSettings.achievements) {
      return;
    }

    await this.sendLocalNotification(
      `Achievement Unlocked! 🏆`,
      `${achievementTitle}: ${achievementDescription}`,
      { type: 'achievement', title: achievementTitle }
    );
  }

  public async notifyStreak(streakDays: number): Promise<void> {
    if (!this.notificationSettings.achievements) {
      return;
    }

    const messages = [
      { days: 3, message: 'You\'re on a 3-day streak! Keep it up! 🔥' },
      { days: 7, message: 'Amazing! 7 days in a row! You\'re building a habit! 🌟' },
      { days: 14, message: 'Two weeks strong! You\'re unstoppable! 💪' },
      { days: 30, message: 'One month streak! You\'re a mindfulness master! 🏅' },
      { days: 60, message: '60 days! Your dedication is inspiring! 🌈' },
      { days: 90, message: '90 days! You\'ve transformed your life! ✨' },
    ];

    const message = messages.find(m => m.days === streakDays);
    if (message) {
      await this.sendLocalNotification(
        'Streak Milestone! 🔥',
        message.message,
        { type: 'streak', days: streakDays }
      );
    }
  }

  public async notifyWeeklyReport(
    sessionsCount: number,
    totalMinutes: number,
    topEmotion: string
  ): Promise<void> {
    if (!this.notificationSettings.weeklyReport) {
      return;
    }

    await this.sendLocalNotification(
      'Your Weekly Report 📊',
      `This week: ${sessionsCount} sessions, ${totalMinutes} minutes. Most common: ${topEmotion}`,
      { type: 'weekly_report', sessionsCount, totalMinutes, topEmotion }
    );
  }

  public async scheduleWeeklyReport(): Promise<void> {
    if (!this.notificationSettings.enabled || !this.notificationSettings.weeklyReport) {
      return;
    }

    // Schedule for Sunday at 8 PM
    const trigger = {
      weekday: 1, // Sunday
      hour: 20,
      minute: 0,
      repeats: true,
    };

    await this.scheduleNotification(
      'Time for Your Weekly Report 📊',
      'Check out your progress and insights from this week!',
      trigger,
      { type: 'weekly_report_reminder' }
    );
  }

  public async scheduleMotivationalReminder(
    daysWithoutPractice: number
  ): Promise<void> {
    if (!this.notificationSettings.enabled || daysWithoutPractice < 2) {
      return;
    }

    const messages = [
      'We miss you! Take a moment for yourself today 💙',
      'Your mental health matters. Come back when you\'re ready 🌸',
      'Even 5 minutes can make a difference. Ready to practice? 🧘',
      'Your mindfulness journey is waiting for you 🌟',
    ];

    const randomMessage = messages[Math.floor(Math.random() * messages.length)];

    await this.sendLocalNotification(
      'Come Back to Practice',
      randomMessage,
      { type: 'motivational_reminder', daysWithoutPractice }
    );
  }

  public async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  public async getAllScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  public async getBadgeCount(): Promise<number> {
    return await Notifications.getBadgeCountAsync();
  }

  public async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  public async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  public addNotificationReceivedListener(
    listener: (notification: Notifications.Notification) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationReceivedListener(listener);
  }

  public addNotificationResponseReceivedListener(
    listener: (response: Notifications.NotificationResponse) => void
  ): Notifications.Subscription {
    return Notifications.addNotificationResponseReceivedListener(listener);
  }

  public async getLastNotificationResponse(): Promise<Notifications.NotificationResponse | null> {
    return await Notifications.getLastNotificationResponseAsync();
  }

  public async dismissNotification(notificationId: string): Promise<void> {
    await Notifications.dismissNotificationAsync(notificationId);
  }

  public async dismissAllNotifications(): Promise<void> {
    await Notifications.dismissAllNotificationsAsync();
  }

  public async getPushToken(): Promise<string | null> {
    try {
      const token = await Notifications.getExpoPushTokenAsync();
      return token.data;
    } catch (error) {
      console.error('Failed to get push token:', error);
      return null;
    }
  }

  public async scheduleBreathingReminder(intervalMinutes: number): Promise<string> {
    if (!this.notificationSettings.enabled) {
      return '';
    }

    const trigger = {
      seconds: intervalMinutes * 60,
      repeats: true,
    };

    return await this.scheduleNotification(
      'Breathing Break 🌬️',
      'Take a moment to breathe and reset.',
      trigger,
      { type: 'breathing_reminder' }
    );
  }

  public async notifyMoodCheckIn(): Promise<void> {
    if (!this.notificationSettings.enabled) {
      return;
    }

    await this.sendLocalNotification(
      'How are you feeling? 💭',
      'Check in with your emotions and practice self-care.',
      { type: 'mood_check_in' }
    );
  }

  public async scheduleCustomReminder(
    title: string,
    body: string,
    triggerDate: Date,
    data?: any
  ): Promise<string> {
    if (!this.notificationSettings.enabled) {
      return '';
    }

    return await this.scheduleNotification(
      title,
      body,
      { date: triggerDate },
      data
    );
  }

  public isEnabled(): boolean {
    return this.notificationSettings.enabled;
  }

  public async enable(): Promise<void> {
    await this.updateSettings({ enabled: true });
    await this.scheduleDailyReminder();
  }

  public async disable(): Promise<void> {
    await this.updateSettings({ enabled: false });
    await this.cancelAllNotifications();
  }
}

export default NotificationService.getInstance();