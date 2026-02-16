import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import { NotificationService } from '../services/NotificationService';
import { StorageService } from '../services/StorageService';

interface NotificationToggleProps {
  title: string;
  description?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  notificationType: 'daily' | 'weekly' | 'achievement' | 'reminder';
  defaultTime?: { hour: number; minute: number };
  onToggle?: (enabled: boolean) => void;
}

export const NotificationToggle: React.FC<NotificationToggleProps> = ({
  title,
  description,
  icon = 'notifications-outline',
  notificationType,
  defaultTime = { hour: 9, minute: 0 },
  onToggle,
}) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    loadNotificationState();
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      setHasPermission(existingStatus === 'granted');
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      setHasPermission(false);
    }
  };

  const loadNotificationState = async () => {
    try {
      setIsLoading(true);
      const storageKey = `notification_${notificationType}_enabled`;
      const enabled = await StorageService.getItem<boolean>(storageKey);
      setIsEnabled(enabled ?? false);
    } catch (error) {
      console.error('Error loading notification state:', error);
      setIsEnabled(false);
    } finally {
      setIsLoading(false);
    }
  };

  const requestPermissions = async (): Promise<boolean> => {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        setHasPermission(true);
        return true;
      }

      const { status } = await Notifications.requestPermissionsAsync();
      const granted = status === 'granted';
      setHasPermission(granted);

      if (!granted) {
        Alert.alert(
          'Разрешение не предоставлено',
          'Для получения уведомлений необходимо предоставить разрешение в настройках устройства.',
          [
            { text: 'Отмена', style: 'cancel' },
            {
              text: 'Открыть настройки',
              onPress: () => {
                if (Platform.OS === 'ios') {
                  Notifications.openSettingsAsync();
                }
              },
            },
          ]
        );
      }

      return granted;
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось запросить разрешение на уведомления'
      );
      return false;
    }
  };

  const scheduleNotification = async () => {
    try {
      switch (notificationType) {
        case 'daily':
          await NotificationService.scheduleDailyReminder(
            defaultTime.hour,
            defaultTime.minute
          );
          break;

        case 'weekly':
          await NotificationService.scheduleWeeklySummary();
          break;

        case 'achievement':
          // Achievement notifications are triggered by events, not scheduled
          await StorageService.setItem('notification_achievement_enabled', true);
          break;

        case 'reminder':
          await NotificationService.scheduleSessionReminder(30);
          break;

        default:
          console.warn('Unknown notification type:', notificationType);
      }
    } catch (error) {
      console.error('Error scheduling notification:', error);
      throw error;
    }
  };

  const cancelNotification = async () => {
    try {
      const identifier = `${notificationType}_notification`;
      await NotificationService.cancelScheduledNotification(identifier);
      await StorageService.setItem(`notification_${notificationType}_enabled`, false);
    } catch (error) {
      console.error('Error canceling notification:', error);
      throw error;
    }
  };

  const handleToggle = async (value: boolean) => {
    try {
      if (value) {
        const granted = await requestPermissions();
        if (!granted) {
          return;
        }

        await scheduleNotification();
        await StorageService.setItem(`notification_${notificationType}_enabled`, true);
        setIsEnabled(true);
        onToggle?.(true);
      } else {
        await cancelNotification();
        setIsEnabled(false);
        onToggle?.(false);
      }
    } catch (error) {
      console.error('Error toggling notification:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось изменить настройку уведомлений'
      );
      setIsEnabled(!value);
    }
  };

  const handlePress = () => {
    if (!hasPermission && !isEnabled) {
      Alert.alert(
        'Требуется разрешение',
        'Для включения уведомлений необходимо предоставить разрешение.',
        [
          { text: 'Отмена', style: 'cancel' },
          {
            text: 'Предоставить',
            onPress: () => handleToggle(true),
          },
        ]
      );
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
      disabled={isLoading}
    >
      <View style={styles.iconContainer}>
        <Ionicons name={icon} size={24} color="#007AFF" />
      </View>
      
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{title}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
        {!hasPermission && !isEnabled && (
          <Text style={styles.permissionWarning}>
            Требуется разрешение
          </Text>
        )}
      </View>

      <Switch
        value={isEnabled}
        onValueChange={handleToggle}
        disabled={isLoading}
        trackColor={{ false: '#E5E5EA', true: '#34C759' }}
        thumbColor={Platform.OS === 'ios' ? '#FFFFFF' : isEnabled ? '#34C759' : '#F4F3F4'}
        ios_backgroundColor="#E5E5EA"
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F9FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contentContainer: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1C1C1E',
    marginBottom: 2,
  },
  description: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
    lineHeight: 18,
  },
  permissionWarning: {
    fontSize: 12,
    color: '#FF9500',
    marginTop: 4,
    fontWeight: '500',
  },
});

export default NotificationToggle;