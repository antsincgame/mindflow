import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../hooks/useTheme';
import { StorageService } from '../services/StorageService';
import { NotificationService } from '../services/NotificationService';
import { HealthKitService } from '../services/HealthKitService';
import { UserSettings } from '../models/UserSettings';
import * as Haptics from 'expo-haptics';

export const SettingsScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings>({
    notificationsEnabled: false,
    dailyReminderTime: '09:00',
    healthKitEnabled: false,
    hapticFeedbackEnabled: true,
    darkModeEnabled: false,
    exerciseDuration: 5,
    autoPlayAudio: true,
    shareProgressEnabled: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedSettings = await StorageService.getSettings();
      if (savedSettings) {
        setSettings(savedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async (newSettings: UserSettings) => {
    try {
      await StorageService.saveSettings(newSettings);
      setSettings(newSettings);
      if (settings.hapticFeedbackEnabled) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить настройки');
    }
  };

  const handleNotificationsToggle = async (value: boolean) => {
    if (value) {
      const hasPermission = await NotificationService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Требуется разрешение',
          'Пожалуйста, разрешите уведомления в настройках устройства'
        );
        return;
      }
      await NotificationService.scheduleDailyReminder(settings.dailyReminderTime);
    } else {
      await NotificationService.cancelAllNotifications();
    }
    saveSettings({ ...settings, notificationsEnabled: value });
  };

  const handleHealthKitToggle = async (value: boolean) => {
    if (value) {
      const hasPermission = await HealthKitService.requestAuthorization();
      if (!hasPermission) {
        Alert.alert(
          'Требуется разрешение',
          'Пожалуйста, разрешите доступ к Health в настройках устройства'
        );
        return;
      }
    }
    saveSettings({ ...settings, healthKitEnabled: value });
  };

  const handleDarkModeToggle = (value: boolean) => {
    toggleTheme();
    saveSettings({ ...settings, darkModeEnabled: value });
  };

  const handleHapticToggle = (value: boolean) => {
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    saveSettings({ ...settings, hapticFeedbackEnabled: value });
  };

  const handleAutoPlayToggle = (value: boolean) => {
    saveSettings({ ...settings, autoPlayAudio: value });
  };

  const handleShareProgressToggle = (value: boolean) => {
    saveSettings({ ...settings, shareProgressEnabled: value });
  };

  const handleExerciseDurationChange = (duration: number) => {
    saveSettings({ ...settings, exerciseDuration: duration });
  };

  const handleReminderTimePress = () => {
    Alert.alert(
      'Время напоминания',
      'Выберите время для ежедневного напоминания',
      [
        { text: '09:00', onPress: () => updateReminderTime('09:00') },
        { text: '12:00', onPress: () => updateReminderTime('12:00') },
        { text: '18:00', onPress: () => updateReminderTime('18:00') },
        { text: '21:00', onPress: () => updateReminderTime('21:00') },
        { text: 'Отмена', style: 'cancel' },
      ]
    );
  };

  const updateReminderTime = async (time: string) => {
    if (settings.notificationsEnabled) {
      await NotificationService.cancelAllNotifications();
      await NotificationService.scheduleDailyReminder(time);
    }
    saveSettings({ ...settings, dailyReminderTime: time });
  };

  const handleClearData = () => {
    Alert.alert(
      'Очистить данные',
      'Вы уверены? Это действие нельзя отменить. Все ваши сессии, статистика и достижения будут удалены.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await StorageService.clearAllData();
              Alert.alert('Успешно', 'Все данные удалены');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось удалить данные');
            }
          },
        },
      ]
    );
  };

  const SettingItem: React.FC<{
    title: string;
    subtitle?: string;
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    onPress?: () => void;
    rightElement?: React.ReactNode;
  }> = ({ title, subtitle, value, onValueChange, onPress, rightElement }) => (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: theme.colors.surface }]}
      onPress={onPress}
      disabled={!onPress && !onValueChange}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Text style={[styles.settingTitle, { color: theme.colors.text }]}>
          {title}
        </Text>
        {subtitle && (
          <Text style={[styles.settingSubtitle, { color: theme.colors.textSecondary }]}>
            {subtitle}
          </Text>
        )}
      </View>
      {rightElement || (
        onValueChange && (
          <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{
              false: theme.colors.border,
              true: theme.colors.primary,
            }}
            thumbColor={Platform.OS === 'ios' ? undefined : theme.colors.surface}
          />
        )
      )}
    </TouchableOpacity>
  );

  const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <Text style={[styles.sectionHeader, { color: theme.colors.textSecondary }]}>
      {title}
    </Text>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Загрузка настроек...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Настройки
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SectionHeader title="УВЕДОМЛЕНИЯ" />
        <SettingItem
          title="Уведомления"
          subtitle="Ежедневные напоминания о практике"
          value={settings.notificationsEnabled}
          onValueChange={handleNotificationsToggle}
        />
        {settings.notificationsEnabled && (
          <SettingItem
            title="Время напоминания"
            subtitle={`Ежедневно в ${settings.dailyReminderTime}`}
            onPress={handleReminderTimePress}
            rightElement={
              <Text style={[styles.valueText, { color: theme.colors.primary }]}>
                {settings.dailyReminderTime}
              </Text>
            }
          />
        )}

        <SectionHeader title="БИОМЕТРИЯ" />
        {Platform.OS === 'ios' && (
          <SettingItem
            title="Apple Health"
            subtitle="Интеграция с данными здоровья"
            value={settings.healthKitEnabled}
            onValueChange={handleHealthKitToggle}
          />
        )}

        <SectionHeader title="ИНТЕРФЕЙС" />
        <SettingItem
          title="Темная тема"
          subtitle="Автоматически следовать системным настройкам"
          value={settings.darkModeEnabled}
          onValueChange={handleDarkModeToggle}
        />
        <SettingItem
          title="Тактильная обратная связь"
          subtitle="Вибрация при взаимодействии"
          value={settings.hapticFeedbackEnabled}
          onValueChange={handleHapticToggle}
        />

        <SectionHeader title="УПРАЖНЕНИЯ" />
        <SettingItem
          title="Длительность по умолчанию"
          subtitle={`${settings.exerciseDuration} минут`}
          onPress={() => {
            Alert.alert(
              'Длительность упражнения',
              'Выберите длительность по умолчанию',
              [
                { text: '3 минуты', onPress: () => handleExerciseDurationChange(3) },
                { text: '5 минут', onPress: () => handleExerciseDurationChange(5) },
                { text: '7 минут', onPress: () => handleExerciseDurationChange(7) },
                { text: '10 минут', onPress: () => handleExerciseDurationChange(10) },
                { text: 'Отмена', style: 'cancel' },
              ]
            );
          }}
          rightElement={
            <Text style={[styles.valueText, { color: theme.colors.primary }]}>
              {settings.exerciseDuration} мин
            </Text>
          }
        />
        <SettingItem
          title="Автовоспроизведение аудио"
          subtitle="Запускать аудиогид автоматически"
          value={settings.autoPlayAudio}
          onValueChange={handleAutoPlayToggle}
        />

        <SectionHeader title="КОНФИДЕНЦИАЛЬНОСТЬ" />
        <SettingItem
          title="Делиться прогрессом"
          subtitle="Разрешить создание ссылок для шаринга"
          value={settings.shareProgressEnabled}
          onValueChange={handleShareProgressToggle}
        />

        <SectionHeader title="ДАННЫЕ" />
        <TouchableOpacity
          style={[styles.dangerButton, { borderColor: theme.colors.error }]}
          onPress={handleClearData}
        >
          <Text style={[styles.dangerButtonText, { color: theme.colors.error }]}>
            Очистить все данные
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            Версия 1.0.0
          </Text>
          <Text style={[styles.footerText, { color: theme.colors.textSecondary }]}>
            © 2024 Mindful Moments
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  scrollView: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 12,
  },
  settingLeft: {
    flex: 1,
    marginRight: 12,
  },
  settingTitle: {
    fontSize: 17,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  valueText: {
    fontSize: 17,
    fontWeight: '500',
  },
  dangerButton: {
    marginHorizontal: 16,
    marginVertical: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  dangerButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 48,
  },
  footerText: {
    fontSize: 13,
    marginVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 17,
    fontWeight: '500',
  },
});