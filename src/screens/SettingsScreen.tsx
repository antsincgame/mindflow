import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Notifications from 'expo-notifications';
import * as Calendar from 'expo-calendar';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../hooks/useTheme';
import { exportDatabase } from '../services/database';

interface SettingItem {
  id: string;
  title: string;
  description?: string;
  type: 'toggle' | 'button' | 'info';
  value?: boolean;
  onPress?: () => void;
  onToggle?: (value: boolean) => void;
}

const SettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark, toggleTheme } = useTheme();

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [taskReminders, setTaskReminders] = useState(true);
  const [breakReminders, setBreakReminders] = useState(true);
  const [moodReminders, setMoodReminders] = useState(true);
  const [calendarSync, setCalendarSync] = useState(false);
  const [autoTheme, setAutoTheme] = useState(false);

  useEffect(() => {
    loadSettings();
    checkNotificationPermissions();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await AsyncStorage.multiGet([
        'taskReminders',
        'breakReminders',
        'moodReminders',
        'calendarSync',
        'autoTheme',
      ]);

      settings.forEach(([key, value]) => {
        const boolValue = value === 'true';
        switch (key) {
          case 'taskReminders':
            setTaskReminders(boolValue);
            break;
          case 'breakReminders':
            setBreakReminders(boolValue);
            break;
          case 'moodReminders':
            setMoodReminders(boolValue);
            break;
          case 'calendarSync':
            setCalendarSync(boolValue);
            break;
          case 'autoTheme':
            setAutoTheme(boolValue);
            break;
        }
      });
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const checkNotificationPermissions = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setNotificationsEnabled(status === 'granted');
  };

  const handleNotificationToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        setNotificationsEnabled(true);
        Alert.alert(
          'Уведомления включены',
          'Вы будете получать напоминания о задачах и перерывах'
        );
      } else {
        Alert.alert(
          'Доступ запрещён',
          'Разрешите уведомления в настройках устройства'
        );
      }
    } else {
      setNotificationsEnabled(false);
      Alert.alert(
        'Уведомления отключены',
        'Вы не будете получать напоминания'
      );
    }
  };

  const handleTaskRemindersToggle = async (value: boolean) => {
    setTaskReminders(value);
    await AsyncStorage.setItem('taskReminders', value.toString());
  };

  const handleBreakRemindersToggle = async (value: boolean) => {
    setBreakReminders(value);
    await AsyncStorage.setItem('breakReminders', value.toString());
  };

  const handleMoodRemindersToggle = async (value: boolean) => {
    setMoodReminders(value);
    await AsyncStorage.setItem('moodReminders', value.toString());
  };

  const handleCalendarSyncToggle = async (value: boolean) => {
    if (value) {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      if (status === 'granted') {
        setCalendarSync(true);
        await AsyncStorage.setItem('calendarSync', 'true');
        Alert.alert(
          'Синхронизация включена',
          'Задачи будут синхронизироваться с календарём'
        );
      } else {
        Alert.alert(
          'Доступ запрещён',
          'Разрешите доступ к календарю в настройках устройства'
        );
      }
    } else {
      setCalendarSync(false);
      await AsyncStorage.setItem('calendarSync', 'false');
    }
  };

  const handleAutoThemeToggle = async (value: boolean) => {
    setAutoTheme(value);
    await AsyncStorage.setItem('autoTheme', value.toString());
    if (value) {
      Alert.alert(
        'Автоматическая тема',
        'Тема будет меняться в зависимости от времени суток'
      );
    }
  };

  const handleExportData = async () => {
    try {
      Alert.alert(
        'Экспорт данных',
        'Выберите формат экспорта',
        [
          {
            text: 'JSON',
            onPress: () => exportToJSON(),
          },
          {
            text: 'CSV',
            onPress: () => exportToCSV(),
          },
          {
            text: 'Отмена',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось экспортировать данные');
    }
  };

  const exportToJSON = async () => {
    try {
      const data = await exportDatabase();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mindflow_export_${timestamp}.json`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      await FileSystem.writeAsStringAsync(
        fileUri,
        JSON.stringify(data, null, 2),
        { encoding: FileSystem.EncodingType.UTF8 }
      );

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Успех', `Данные сохранены в ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось экспортировать в JSON');
    }
  };

  const exportToCSV = async () => {
    try {
      const data = await exportDatabase();
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `mindflow_export_${timestamp}.csv`;
      const fileUri = `${FileSystem.documentDirectory}${filename}`;

      let csv = 'Type,Timestamp,Energy,Emoji,Title,Completed\n';
      
      if (data.moods) {
        data.moods.forEach((mood: any) => {
          csv += `mood,${mood.timestamp},${mood.energy},${mood.emoji},,\n`;
        });
      }

      if (data.tasks) {
        data.tasks.forEach((task: any) => {
          csv += `task,${task.created_at},,,"${task.title}",${task.completed}\n`;
        });
      }

      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri);
      } else {
        Alert.alert('Успех', `Данные сохранены в ${fileUri}`);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось экспортировать в CSV');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Удалить все данные?',
      'Это действие нельзя отменить. Все записи настроения, задачи и паттерны будут удалены.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Готово', 'Все данные удалены');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить данные');
            }
          },
        },
      ]
    );
  };

  const notificationSettings: SettingItem[] = [
    {
      id: 'notifications',
      title: 'Уведомления',
      description: 'Разрешить отправку уведомлений',
      type: 'toggle',
      value: notificationsEnabled,
      onToggle: handleNotificationToggle,
    },
    {
      id: 'taskReminders',
      title: 'Напоминания о задачах',
      description: 'Уведомления перед началом задач',
      type: 'toggle',
      value: taskReminders,
      onToggle: handleTaskRemindersToggle,
    },
    {
      id: 'breakReminders',
      title: 'Напоминания о перерывах',
      description: 'Микропаузы каждые 2-3 часа',
      type: 'toggle',
      value: breakReminders,
      onToggle: handleBreakRemindersToggle,
    },
    {
      id: 'moodReminders',
      title: 'Напоминания об отметке настроения',
      description: '3-4 раза в день',
      type: 'toggle',
      value: moodReminders,
      onToggle: handleMoodRemindersToggle,
    },
  ];

  const appearanceSettings: SettingItem[] = [
    {
      id: 'theme',
      title: isDark ? 'Тёмная тема' : 'Светлая тема',
      description: 'Переключить тему приложения',
      type: 'toggle',
      value: isDark,
      onToggle: toggleTheme,
    },
    {
      id: 'autoTheme',
      title: 'Автоматическая тема',
      description: 'Менять тему по времени суток',
      type: 'toggle',
      value: autoTheme,
      onToggle: handleAutoThemeToggle,
    },
  ];

  const integrationSettings: SettingItem[] = [
    {
      id: 'calendarSync',
      title: 'Синхронизация с календарём',
      description: 'Интеграция с Google Calendar',
      type: 'toggle',
      value: calendarSync,
      onToggle: handleCalendarSyncToggle,
    },
  ];

  const dataSettings: SettingItem[] = [
    {
      id: 'export',
      title: 'Экспорт данных',
      description: 'Сохранить все данные в файл',
      type: 'button',
      onPress: handleExportData,
    },
    {
      id: 'clear',
      title: 'Удалить все данные',
      description: 'Очистить всю историю',
      type: 'button',
      onPress: handleClearData,
    },
  ];

  const renderSettingItem = (item: SettingItem) => {
    if (item.type === 'toggle') {
      return (
        <View key={item.id} style={[styles.settingItem, { backgroundColor: theme.surface }]}>
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: theme.text }]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                {item.description}
              </Text>
            )}
          </View>
          <Switch
            value={item.value}
            onValueChange={item.onToggle}
            trackColor={{ false: '#D1D5DB', true: theme.primary }}
            thumbColor={item.value ? '#FFFFFF' : '#F3F4F6'}
            ios_backgroundColor="#D1D5DB"
          />
        </View>
      );
    }

    if (item.type === 'button') {
      return (
        <TouchableOpacity
          key={item.id}
          style={[styles.settingItem, { backgroundColor: theme.surface }]}
          onPress={item.onPress}
          activeOpacity={0.7}
        >
          <View style={styles.settingTextContainer}>
            <Text style={[styles.settingTitle, { color: item.id === 'clear' ? '#EF4444' : theme.text }]}>
              {item.title}
            </Text>
            {item.description && (
              <Text style={[styles.settingDescription, { color: theme.textSecondary }]}>
                {item.description}
              </Text>
            )}
          </View>
          <Text style={[styles.chevron, { color: theme.textSecondary }]}>›</Text>
        </TouchableOpacity>
      );
    }

    return null;
  };

  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>
        {title}
      </Text>
      <View style={styles.sectionContent}>
        {items.map((item, index) => (
          <View key={item.id}>
            {renderSettingItem(item)}
            {index < items.length - 1 && (
              <View style={[styles.separator, { backgroundColor: theme.textSecondary + '20' }]} />
            )}
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Настройки</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderSection('Уведомления', notificationSettings)}
        {renderSection('Внешний вид', appearanceSettings)}
        {renderSection('Интеграции', integrationSettings)}
        {renderSection('Данные', dataSettings)}

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            MindFlow v1.0.0
          </Text>
          <Text style={[styles.footerText, { color: theme.textSecondary }]}>
            Полностью бесплатно, без рекламы
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles