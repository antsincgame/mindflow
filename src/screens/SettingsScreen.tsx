import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Switch,
  Alert,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSettings } from '../hooks/useSettings';
import { useDatabase } from '../hooks/useDatabase';
import SettingItem from '../components/SettingItem';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { Text } from 'react-native';

const { width } = Dimensions.get('window');

interface SettingsScreenProps {
  navigation: any;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { settings, updateSettings, loading } = useSettings();
  const { resetDatabase } = useDatabase();

  const [sessionDuration, setSessionDuration] = useState(15);
  const [breakDuration, setBreakDuration] = useState(5);
  const [dailyGoal, setDailyGoal] = useState(5);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [notificationsBlocked, setNotificationsBlocked] = useState(true);
  const [workStartTime, setWorkStartTime] = useState('09:00');
  const [workEndTime, setWorkEndTime] = useState('17:00');

  useEffect(() => {
    if (settings) {
      setSessionDuration(settings.sessionDuration);
      setBreakDuration(settings.breakDuration);
      setDailyGoal(settings.dailyGoal);
      setSoundEnabled(settings.soundEnabled);
      setVibrationEnabled(settings.vibrationEnabled);
      setNotificationsBlocked(settings.notificationsBlocked);
      setWorkStartTime(settings.workStartTime);
      setWorkEndTime(settings.workEndTime);
    }
  }, [settings]);

  const handleSessionDurationChange = (value: number) => {
    if (value >= 1 && value <= 120) {
      setSessionDuration(value);
      updateSettings({ sessionDuration: value });
    }
  };

  const handleBreakDurationChange = (value: number) => {
    if (value >= 1 && value <= 60) {
      setBreakDuration(value);
      updateSettings({ breakDuration: value });
    }
  };

  const handleDailyGoalChange = (value: number) => {
    if (value >= 1 && value <= 50) {
      setDailyGoal(value);
      updateSettings({ dailyGoal: value });
    }
  };

  const handleSoundToggle = (value: boolean) => {
    setSoundEnabled(value);
    updateSettings({ soundEnabled: value });
  };

  const handleVibrationToggle = (value: boolean) => {
    setVibrationEnabled(value);
    updateSettings({ vibrationEnabled: value });
  };

  const handleNotificationsToggle = (value: boolean) => {
    setNotificationsBlocked(value);
    updateSettings({ notificationsBlocked: value });
  };

  const handleWorkStartTimeChange = (value: string) => {
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      setWorkStartTime(value);
      updateSettings({ workStartTime: value });
    }
  };

  const handleWorkEndTimeChange = (value: string) => {
    if (/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(value)) {
      setWorkEndTime(value);
      updateSettings({ workEndTime: value });
    }
  };

  const handleResetData = () => {
    Alert.alert(
      'Сброс данных',
      'Вы уверены, что хотите удалить все данные? Это действие нельзя отменить.',
      [
        {
          text: 'Отмена',
          onPress: () => {},
          style: 'cancel',
        },
        {
          text: 'Удалить',
          onPress: async () => {
            try {
              await resetDatabase();
              Alert.alert('Успешно', 'Все данные были удалены');
            } catch (error) {
              Alert.alert('Ошибка', 'Не удалось сбросить данные');
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Загрузка...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Настройки</Text>
      </View>

      {/* Сессия и перерывы */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Время сессий</Text>
        
        <SettingItem
          label="Длительность сессии"
          value={sessionDuration}
          unit="мин"
          onChangeValue={handleSessionDurationChange}
          min={1}
          max={120}
          step={1}
          type="number"
        />

        <SettingItem
          label="Длительность перерыва"
          value={breakDuration}
          unit="мин"
          onChangeValue={handleBreakDurationChange}
          min={1}
          max={60}
          step={1}
          type="number"
        />

        <SettingItem
          label="Дневная цель"
          value={dailyGoal}
          unit="сессий"
          onChangeValue={handleDailyGoalChange}
          min={1}
          max={50}
          step={1}
          type="number"
        />
      </View>

      {/* Рабочее время */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Рабочее время</Text>
        
        <SettingItem
          label="Начало рабочего дня"
          value={workStartTime}
          onChangeValue={handleWorkStartTimeChange}
          type="time"
        />

        <SettingItem
          label="Конец рабочего дня"
          value={workEndTime}
          onChangeValue={handleWorkEndTimeChange}
          type="time"
        />
      </View>

      {/* Звук и вибрация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уведомления</Text>
        
        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Звуковые уведомления</Text>
            <Text style={styles.settingDescription}>
              Воспроизводить звуки при завершении сессий
            </Text>
          </View>
          <Switch
            value={soundEnabled}
            onValueChange={handleSoundToggle}
            trackColor={{ false: colors.gray200, true: colors.primary200 }}
            thumbColor={soundEnabled ? colors.primary : colors.gray400}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Вибрация</Text>
            <Text style={styles.settingDescription}>
              Вибрировать при уведомлениях
            </Text>
          </View>
          <Switch
            value={vibrationEnabled}
            onValueChange={handleVibrationToggle}
            trackColor={{ false: colors.gray200, true: colors.primary200 }}
            thumbColor={vibrationEnabled ? colors.primary : colors.gray400}
          />
        </View>

        <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View style={styles.settingContent}>
            <Text style={styles.settingLabel}>Блокировка уведомлений</Text>
            <Text style={styles.settingDescription}>
              Блокировать уведомления во время сессии
            </Text>
          </View>
          <Switch
            value={notificationsBlocked}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: colors.gray200, true: colors.primary200 }}
            thumbColor={notificationsBlocked ? colors.primary : colors.gray400}
          />
        </View>
      </View>

      {/* Опасные действия */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Данные</Text>
        
        <View
          style={[
            styles.settingRow,
            { backgroundColor: colors.error50, borderRadius: spacing.md },
          ]}
        >
          <View style={styles.settingContent}>
            <Text style={[styles.settingLabel, { color: colors.error }]}>
              Сбросить все данные
            </Text>
            <Text style={styles.settingDescription}>
              Удалить все сессии и статистику
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <View style={styles.resetButton}>
            <Text
              style={styles.resetButtonText}
              onPress={handleResetData}
            >
              Удалить данные
            </Text>
          </View>
        </View>
      </View>

      {/* Информация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Информация</Text>
        
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            <Text style={styles.infoBold}>MindFlow</Text> v1.0.0
          </Text>
          <Text style={styles.infoText}>
            Приложение для управления временем и повышения продуктивности
          </Text>
        </View>
      </View>

      <View style={{ height: spacing.xl * 2 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginBottom: spacing.xl,
    marginTop: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.h1,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.h3,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    borderRadius: spacing.md,
    marginBottom: spacing.md,
  },
  settingContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  settingLabel: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  settingDescription: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.gray200,
    marginVertical: 0,
  },
  buttonContainer: {
    marginTop: spacing.md,
  },
  resetButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: spacing.md,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: typography.sizes.body,
    fontWeight: typography.weights.semibold,
    color: colors.white,
  },
  infoBox: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.md,
  },
  infoText: {
    fontSize: typography.sizes.caption,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  infoBold: {
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  loadingText: {
    fontSize: typography.sizes.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});

export default SettingsScreen;