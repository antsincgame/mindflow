import { useState, useEffect, useCallback, useRef } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import PushNotification, { Importance } from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { HomeStackParamList } from '../navigation/types';
import { NotificationService } from '../services/NotificationService';
import { StorageService } from '../services/StorageService';
import { UserSettings, NotificationMode } from '../models/UserSettings';

export interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  notDetermined: boolean;
}

export interface ScheduledNotification {
  id: string;
  title: string;
  message: string;
  date: Date;
  repeatType?: 'day' | 'week' | 'time';
  userInfo?: Record<string, unknown>;
}

export interface NotificationPayload {
  exerciseId?: string;
  emotionId?: string;
  action?: 'open_exercise' | 'open_emotion_picker' | 'open_home';
  [key: string]: unknown;
}

export interface UseNotificationsReturn {
  permissionStatus: NotificationPermissionStatus;
  isPermissionGranted: boolean;
  scheduledNotifications: ScheduledNotification[];
  notificationMode: NotificationMode;
  reminderTimes: string[];
  isLoading: boolean;
  requestPermission: () => Promise<boolean>;
  checkPermission: () => Promise<NotificationPermissionStatus>;
  scheduleNotification: (notification: Omit<ScheduledNotification, 'id'>) => Promise<string>;
  cancelNotification: (id: string) => void;
  cancelAllNotifications: () => void;
  setNotificationMode: (mode: NotificationMode) => Promise<void>;
  addReminderTime: (time: string) => Promise<void>;
  removeReminderTime: (time: string) => Promise<void>;
  updateReminderTimes: (times: string[]) => Promise<void>;
  rescheduleAllNotifications: () => Promise<void>;
  handleNotificationOpen: (payload: NotificationPayload) => void;
}

const CHANNEL_ID = 'mindflow-reminders';
const CHANNEL_NAME = 'MindFlow Reminders';

const generateNotificationId = (): string => {
  return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

export function useNotifications(): UseNotificationsReturn {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>({
    granted: false,
    denied: false,
    notDetermined: true,
  });
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>([]);
  const [notificationMode, setNotificationModeState] = useState<NotificationMode>('manual');
  const [reminderTimes, setReminderTimesState] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isPermissionGranted = permissionStatus.granted;

  const createNotificationChannel = useCallback(() => {
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: CHANNEL_ID,
          channelName: CHANNEL_NAME,
          channelDescription: 'Напоминания о практиках осознанности',
          playSound: true,
          soundName: 'default',
          importance: Importance.HIGH,
          vibrate: true,
        },
        (_created: boolean) => {}
      );
    }
  }, []);

  const checkPermission = useCallback(async (): Promise<NotificationPermissionStatus> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        PushNotificationIOS.checkPermissions((permissions) => {
          const granted = !!(permissions.alert || permissions.badge || permissions.sound);
          const status: NotificationPermissionStatus = {
            granted,
            denied: !granted && !permissions.authorizationStatus,
            notDetermined: permissions.authorizationStatus === 0,
          };
          setPermissionStatus(status);
          resolve(status);
        });
      } else {
        PushNotification.checkPermissions((permissions) => {
          const granted = !!permissions.alert;
          const status: NotificationPermissionStatus = {
            granted,
            denied: !granted,
            notDetermined: false,
          };
          setPermissionStatus(status);
          resolve(status);
        });
      }
    });
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (Platform.OS === 'ios') {
        PushNotificationIOS.requestPermissions({
          alert: true,
          badge: true,
          sound: true,
        }).then((permissions) => {
          const granted = !!(permissions.alert || permissions.badge || permissions.sound);
          setPermissionStatus({
            granted,
            denied: !granted,
            notDetermined: false,
          });
          resolve(granted);
        }).catch(() => {
          setPermissionStatus({
            granted: false,
            denied: true,
            notDetermined: false,
          });
          resolve(false);
        });
      } else {
        PushNotification.requestPermissions().then((result) => {
          const granted = !!result;
          setPermissionStatus({
            granted,
            denied: !granted,
            notDetermined: false,
          });
          resolve(granted);
        });
      }
    });
  }, []);

  const handleNotificationOpen = useCallback((payload: NotificationPayload) => {
    if (!payload) return;

    const { action, exerciseId, emotionId } = payload;

    try {
      switch (action) {
        case 'open_exercise':
          if (exerciseId) {
            navigation.navigate('ExerciseSession', { exerciseId });
          }
          break;
        case 'open_emotion_picker':
          navigation.navigate('EmotionPicker');
          break;
        case 'open_home':
        default:
          navigation.navigate('Home');
          break;
      }
    } catch (error) {
      // Navigation might not be ready yet; silently fail
    }
  }, [navigation]);

  const configureNotifications = useCallback(() => {
    PushNotification.configure({
      onRegister: (_token) => {},

      onNotification: (notification) => {
        const payload = (notification.data || {}) as NotificationPayload;

        if (notification.userInteraction) {
          handleNotificationOpen(payload);
        }

        if (Platform.OS === 'ios') {
          notification.finish(PushNotificationIOS.FetchResult.NoData);
        }
      },

      onAction: (notification) => {
        const payload = (notification.data || {}) as NotificationPayload;
        handleNotificationOpen(payload);
      },

      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },

      popInitialNotification: true,
      requestPermissions: false,
    });
  }, [handleNotificationOpen]);

  const scheduleNotification = useCallback(
    async (notification: Omit<ScheduledNotification, 'id'>): Promise<string> => {
      const id = generateNotificationId();

      PushNotification.localNotificationSchedule({
        id,
        channelId: CHANNEL_ID,
        title: notification.title,
        message: notification.message,
        date: notification.date,
        allowWhileIdle: true,
        playSound: true,
        soundName: 'default',
        vibrate: true,
        userInfo: {
          id,
          ...notification.userInfo,
        },
        repeatType: notification.repeatType,
      });

      const scheduled: ScheduledNotification = {
        ...notification,
        id,
      };

      setScheduledNotifications((prev) => [...prev, scheduled]);

      return id;
    },
    []
  );

  const cancelNotification = useCallback((id: string) => {
    PushNotification.cancelLocalNotification(id);
    setScheduledNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const cancelAllNotifications = useCallback(() => {
    PushNotification.cancelAllLocalNotifications();
    setScheduledNotifications([]);
  }, []);

  const scheduleManualReminders = useCallback(
    async (times: string[]) => {
      cancelAllNotifications();

      const messages = [
        'Время для практики осознанности 🧘',
        'Найди минутку для себя ✨',
        'Пора сделать паузу и подышать 🌿',
        'Момент спокойствия ждёт тебя 🌊',
      ];

      for (const time of times) {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const scheduledDate = new Date();
        scheduledDate.setHours(hours, minutes, 0, 0);

        if (scheduledDate <= now) {
          scheduledDate.setDate(scheduledDate.getDate() + 1);
        }

        const messageIndex = Math.floor(Math.random() * messages.length);

        await scheduleNotification({
          title: 'MindFlow',
          message: messages[messageIndex],
          date: scheduledDate,
          repeatType: 'day',
          userInfo: {
            action: 'open_emotion_picker',
            type: 'manual_reminder',
            scheduledTime: time,
          },
        });
      }
    },
    [cancelAllNotifications, scheduleNotification]
  );

  const scheduleSmartReminders = useCallback(async () => {
    cancelAllNotifications();

    try {
      const stressPatterns = await NotificationService.getStressPatterns();

      if (stressPatterns && stressPatterns.length > 0) {
        for (const pattern of stressPatterns) {
          const scheduledDate = new Date();
          scheduledDate.setHours(pattern.hour, pattern.minute, 0, 0);

          if (scheduledDate <= new Date()) {
            scheduledDate.setDate(scheduledDate.getDate() + 1);
          }

          await scheduleNotification({
            title: 'MindFlow',
            message: 'Обычно в это время уровень стресса повышается. Попробуй упражнение? 🌿',
            date: scheduledDate,
            repeatType: 'day',
            userInfo: {
              action: 'open_emotion_picker',
              type: 'smart_reminder',
              stressLevel: pattern.averageStress,
            },
          });
        }
      } else {
        // Default smart times if no patterns available
        const defaultTimes = ['09:00', '13:00', '18:00'];
        await scheduleManualReminders(defaultTimes);
      }
    } catch {
      const defaultTimes = ['09:00', '13:00', '18:00'];
      await scheduleManualReminders(defaultTimes);
    }
  }, [cancelAllNotifications, scheduleNotification, scheduleManualReminders]);

  const rescheduleAllNotifications = useCallback(async () => {
    if (!isPermissionGranted) return;

    switch (notificationMode) {
      case 'manual':
        await scheduleManualReminders(reminderTimes);
        break;
      case 'smart':
        await scheduleSmartReminders();
        break;
      case 'combined':
        await scheduleManualReminders(reminderTimes);
        await scheduleSmartReminders();
        break;
      case 'off':
        cancelAllNotifications();
        break;
    }
  }, [
    isPermissionGranted,
    notificationMode,
    reminderTimes,
    scheduleManualReminders,
    scheduleSmartReminders,
    cancelAllNotifications,
  ]);

  const setNotificationMode = useCallback(
    async (mode: NotificationMode) => {
      setNotificationModeState(mode);

      try {
        const settings = await StorageService.get<UserSettings>('user_settings');
        await StorageService.set('user_settings', {
          ...settings,
          notificationMode: mode,
        });
      } catch {
        // Silently fail storage errors
      }

      // Reschedule based on new mode
      if (mode === 'off') {
        cancelAllNotifications();
      }
    },
    [cancelAllNotifications]
  );

  const addReminderTime = useCallback(
    async (time: string) => {
      const updatedTimes = [...reminderTimes, time].sort();
      setReminderTimesState(updatedTimes);

      try {
        const settings = await StorageService.get<UserSettings>('user_settings');
        await StorageService.set('user_settings', {
          ...settings,
          reminderTimes: updatedTimes,
        });
      } catch {
        // Silently fail
      }
    },
    [reminderTimes]
  );

  const removeReminderTime = useCallback(
    async (time: string) => {
      const updatedTimes = reminderTimes.filter((t) => t !== time);
      setReminderTimesState(updatedTimes);

      try {
        const settings = await StorageService.get<UserSettings>('user_settings');
        await StorageService.set('user_settings', {
          ...settings,
          reminderTimes: updatedTimes,
        });
      } catch {
        // Silently fail
      }
    },
    [reminderTimes]
  );

  const updateReminderTimes = useCallback(async (times: string[]) => {
    const sortedTimes = [...times].sort();
    setReminderTimesState(sortedTimes);

    try {
      const settings = await StorageService.get<UserSettings>('user_settings');
      await StorageService.set('user_settings', {
        ...settings,
        reminderTimes: sortedTimes,
      });
    } catch {
      // Silently fail
    }
  }, []);

  // Initialize
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);

      createNotificationChannel();
      configureNotifications();

      await checkPermission();

      try {
        const settings = await StorageService.get<UserSettings>('user_settings');
        if (settings) {
          if (settings.notificationMode) {
            setNotificationModeState(settings.notificationMode);
          }
          if (settings.reminderTimes) {
            setReminderTimesState(settings.reminderTimes);
          }
        }
      } catch {
        // Use defaults
      }

      setIsLoading(false);
    };

    initialize();
  }, [createNotificationChannel, configureNotifications, checkPermission]);

  // Re-check permissions when app comes to foreground
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        checkPermission();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [checkPermission]);

  // Reschedule notifications when mode or times change
  useEffect(() => {
    if (!isLoading