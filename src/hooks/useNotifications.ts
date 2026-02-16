import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

interface NotificationPermissions {
  granted: boolean;
  canAskAgain: boolean;
  ios?: Notifications.IosAuthorizationStatus;
  android?: Notifications.AndroidAuthorizationStatus;
}

interface ScheduledNotification {
  id: string;
  trigger: Notifications.NotificationTrigger;
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const useNotifications = () => {
  const [permissions, setPermissions] = useState<NotificationPermissions>({
    granted: false,
    canAskAgain: true,
  });
  const [isBlocked, setIsBlocked] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const scheduledNotifications = useRef<Map<string, ScheduledNotification>>(new Map());

  useEffect(() => {
    checkPermissions();
    setupListeners();

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  const checkPermissions = async () => {
    try {
      const settings = await Notifications.getPermissionsAsync();

      setPermissions({
        granted: settings.granted,
        canAskAgain: settings.canAskAgain,
        ios: settings.ios,
        android: settings.android,
      });
    } catch (error) {
      console.error('Error checking notification permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const settings = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowCriticalAlerts: false,
          allowProvisional: true,
          allowAnnouncements: true,
        },
        android: {
          foreground: true,
        },
      });

      setPermissions({
        granted: settings.granted,
        canAskAgain: settings.canAskAgain,
        ios: settings.ios,
        android: settings.android,
      });

      return settings.granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  };

  const setupListeners = () => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Notification response:', response);
      }
    );
  };

  const sendLocalNotification = async (
    title: string,
    body: string,
    data?: Record<string, any>,
    sound?: string
  ) => {
    try {
      if (!permissions.granted) {
        console.warn('Notifications not permitted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: sound || 'default',
          badge: 1,
        },
        trigger: {
          type: 'time',
          seconds: 1,
        },
      });

      return notificationId;
    } catch (error) {
      console.error('Error sending notification:', error);
      return null;
    }
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    trigger: Notifications.NotificationTrigger,
    data?: Record<string, any>,
    id?: string
  ) => {
    try {
      if (!permissions.granted) {
        console.warn('Notifications not permitted');
        return null;
      }

      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {},
          sound: 'default',
          badge: 1,
        },
        trigger,
      });

      if (id) {
        scheduledNotifications.current.set(id, {
          id: notificationId,
          trigger,
        });
      }

      return notificationId;
    } catch (error) {
      console.error('Error scheduling notification:', error);
      return null;
    }
  };

  const cancelNotification = async (notificationId: string) => {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      scheduledNotifications.current.delete(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  };

  const cancelAllNotifications = async () => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      scheduledNotifications.current.clear();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  };

  const blockNotifications = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MIN,
          vibrationPattern: [0],
          lightColor: '#FF231F7C',
        });
      }
      setIsBlocked(true);
    } catch (error) {
      console.error('Error blocking notifications:', error);
    }
  };

  const unblockNotifications = async () => {
    try {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.DEFAULT,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      }
      setIsBlocked(false);
    } catch (error) {
      console.error('Error unblocking notifications:', error);
    }
  };

  const getScheduledNotifications = async () => {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('Error getting scheduled notifications:', error);
      return [];
    }
  };

  const setBadgeCount = async (count: number) => {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  };

  const dismissAllNotifications = async () => {
    try {
      await Notifications.dismissAllNotificationsAsync();
    } catch (error) {
      console.error('Error dismissing notifications:', error);
    }
  };

  return {
    permissions,
    isBlocked,
    checkPermissions,
    requestPermissions,
    sendLocalNotification,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    blockNotifications,
    unblockNotifications,
    getScheduledNotifications,
    setBadgeCount,
    dismissAllNotifications,
  };
};