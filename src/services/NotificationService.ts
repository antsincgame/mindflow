import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface NotificationPayload {
  type: 'session-complete' | 'break-complete' | 'break-reminder' | 'achievement-unlocked' | 'daily-goal' | 'session-reminder';
  title: string;
  body: string;
  data?: Record<string, any>;
}

class NotificationService {
  private notificationsBlocked: boolean = false;
  private blockedNotifications: Notifications.Notification[] = [];
  private notificationListener: Notifications.EventSubscription | null = null;
  private responseListener: Notifications.EventSubscription | null = null;

  async initialize(): Promise<void> {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.warn('Notification permissions not granted');
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: !this.notificationsBlocked,
          shouldPlaySound: !this.notificationsBlocked,
          shouldSetBadge: true,
        }),
      });

      this.notificationListener = Notifications.addNotificationReceivedListener(
        (notification) => {
          if (this.notificationsBlocked) {
            this.blockedNotifications.push(notification);
          }
        }
      );

      this.responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          this.handleNotificationResponse(response);
        }
      );

      const blocked = await this.getBlockedState();
      this.notificationsBlocked = blocked;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
    }
  }

  async blockNotifications(): Promise<void> {
    this.notificationsBlocked = true;
    this.blockedNotifications = [];
    await AsyncStorage.setItem('notificationsBlocked', 'true');
  }

  async unblockNotifications(): Promise<void> {
    this.notificationsBlocked = false;
    await AsyncStorage.setItem('notificationsBlocked', 'false');

    // Show all blocked notifications
    for (const notification of this.blockedNotifications) {
      await this.scheduleNotification({
        type: notification.request.content.data.type || 'session-reminder',
        title: notification.request.content.title || 'Notification',
        body: notification.request.content.body || '',
        data: notification.request.content.data,
      });
    }
    this.blockedNotifications = [];
  }

  async scheduleNotification(
    payload: NotificationPayload,
    delaySeconds: number = 0
  ): Promise<string> {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: payload.title,
          body: payload.body,
          sound: 'default',
          badge: 1,
          data: {
            type: payload.type,
            ...payload.data,
          },
        },
        trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
      });

      return notificationId;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async scheduleSessionCompleteNotification(): Promise<string> {
    return this.scheduleNotification({
      type: 'session-complete',
      title: '🎉 Сессия завершена!',
      body: 'Отличная работа! Пора на перерыв.',
    });
  }

  async scheduleBreakCompleteNotification(): Promise<string> {
    return this.scheduleNotification({
      type: 'break-complete',
      title: '⏰ Перерыв закончился',
      body: 'Готовы начать новую сессию?',
    });
  }

  async scheduleBreakReminderNotification(breakDurationMinutes: number): Promise<string> {
    return this.scheduleNotification({
      type: 'break-reminder',
      title: '☕ Время перерыва',
      body: `Отдохните ${breakDurationMinutes} минут перед следующей сессией.`,
    });
  }

  async scheduleAchievementNotification(
    title: string,
    description: string
  ): Promise<string> {
    return this.scheduleNotification({
      type: 'achievement-unlocked',
      title: `🏆 Достижение разблокировано!`,
      body: `${title}: ${description}`,
    });
  }

  async scheduleDailyGoalNotification(): Promise<string> {
    return this.scheduleNotification({
      type: 'daily-goal',
      title: '🌟 Дневная цель достигнута!',
      body: 'Отличный результат! Вы завершили все запланированные сессии.',
    });
  }

  async scheduleSessionReminderNotification(delaySeconds: number = 3600): Promise<string> {
    return this.scheduleNotification(
      {
        type: 'session-reminder',
        title: '🚀 Время для фокуса',
        body: 'Начните новую сессию и продолжайте свой прогресс.',
      },
      delaySeconds
    );
  }

  async cancelNotification(notificationId: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
    } catch (error) {
      console.error('Failed to cancel notification:', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Failed to cancel all notifications:', error);
    }
  }

  private async handleNotificationResponse(
    response: Notifications.NotificationResponse
  ): Promise<void> {
    const { type } = response.notification.request.content.data;

    switch (type) {
      case 'session-complete':
      case 'break-complete':
      case 'achievement-unlocked':
      case 'daily-goal':
        // Handle navigation to relevant screens
        break;
      default:
        break;
    }
  }

  private async getBlockedState(): Promise<boolean> {
    try {
      const blocked = await AsyncStorage.getItem('notificationsBlocked');
      return blocked === 'true';
    } catch (error) {
      console.error('Failed to get blocked state:', error);
      return false;
    }
  }

  isNotificationsBlocked(): boolean {
    return this.notificationsBlocked;
  }

  getBlockedNotificationsCount(): number {
    return this.blockedNotifications.length;
  }

  async getLastNotification(): Promise<Notifications.Notification | null> {
    try {
      const notification = await Notifications.getLastNotificationResponseAsync();
      return notification?.notification || null;
    } catch (error) {
      console.error('Failed to get last notification:', error);
      return null;
    }
  }

  cleanup(): void {
    if (this.notificationListener) {
      this.notificationListener.remove();
      this.notificationListener = null;
    }
    if (this.responseListener) {
      this.responseListener.remove();
      this.responseListener = null;
    }
  }
}

export default new NotificationService();