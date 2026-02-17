import * as Notifications from 'expo-notifications';

export class NotificationService {
  static async scheduleDailyReminder(hour: number, minute: number): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Напоминание',
        body: 'Время для практики',
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });
  }

  static async scheduleWeeklySummary(): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Недельная сводка',
        body: 'Посмотрите ваши результаты',
      },
      trigger: {
        weekday: 1,
        hour: 9,
        minute: 0,
        repeats: true,
      },
    });
  }

  static async scheduleSessionReminder(minutes: number): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Напоминание о сессии',
        body: 'Не забудьте начать сессию',
      },
      trigger: {
        seconds: minutes * 60,
      },
    });
  }

  static async cancelScheduledNotification(identifier: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(identifier);
  }

  static async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      return finalStatus === 'granted';
    } catch (error) {
      console.error('NotificationService.requestPermissions error:', error);
      return false;
    }
  }
}
