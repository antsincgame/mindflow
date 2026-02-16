import React, { useState, useCallback, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useNotifications } from '../hooks/useNotifications';
import NotificationTimePickerRow from '../components/NotificationTimePickerRow';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

type NotificationMode = 'manual' | 'smart' | 'combined';

type SmartFrequency = 'low' | 'medium' | 'high';

interface ScheduledTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

const SMART_FREQUENCY_OPTIONS: {
  key: SmartFrequency;
  label: string;
  description: string;
}[] = [
  {
    key: 'low',
    label: 'Редко',
    description: 'Только при высоком уровне стресса',
  },
  {
    key: 'medium',
    label: 'Умеренно',
    description: 'При среднем и высоком стрессе',
  },
  {
    key: 'high',
    label: 'Часто',
    description: 'Проактивные напоминания в течение дня',
  },
];

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const {
    notificationsEnabled,
    toggleNotifications,
    scheduleNotification,
    cancelNotification,
  } = useNotifications();

  const [mode, setMode] = useState<NotificationMode>('manual');
  const [scheduledTimes, setScheduledTimes] = useState<ScheduledTime[]>([
    { id: generateId(), hour: 9, minute: 0, enabled: true },
    { id: generateId(), hour: 21, minute: 0, enabled: true },
  ]);
  const [smartFrequency, setSmartFrequency] =
    useState<SmartFrequency>('medium');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeId, setEditingTimeId] = useState<string | null>(null);
  const [tempDate, setTempDate] = useState(new Date());
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [quietStart, setQuietStart] = useState({ hour: 22, minute: 0 });
  const [quietEnd, setQuietEnd] = useState({ hour: 7, minute: 0 });
  const [editingQuiet, setEditingQuiet] = useState<'start' | 'end' | null>(
    null
  );

  const handleModeChange = useCallback((newMode: NotificationMode) => {
    setMode(newMode);
  }, []);

  const handleAddTime = useCallback(() => {
    if (scheduledTimes.length >= 10) {
      Alert.alert('Лимит', 'Максимум 10 напоминаний в день');
      return;
    }
    const newTime: ScheduledTime = {
      id: generateId(),
      hour: 12,
      minute: 0,
      enabled: true,
    };
    setScheduledTimes((prev) => [...prev, newTime]);
  }, [scheduledTimes.length]);

  const handleRemoveTime = useCallback(
    (id: string) => {
      if (scheduledTimes.length <= 1) {
        Alert.alert('Минимум', 'Необходимо хотя бы одно напоминание');
        return;
      }
      setScheduledTimes((prev) => prev.filter((t) => t.id !== id));
    },
    [scheduledTimes.length]
  );

  const handleToggleTime = useCallback((id: string) => {
    setScheduledTimes((prev) =>
      prev.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t))
    );
  }, []);

  const handleEditTime = useCallback(
    (id: string) => {
      const time = scheduledTimes.find((t) => t.id === id);
      if (time) {
        const date = new Date();
        date.setHours(time.hour, time.minute, 0, 0);
        setTempDate(date);
        setEditingTimeId(id);
        setEditingQuiet(null);
        setShowTimePicker(true);
      }
    },
    [scheduledTimes]
  );

  const handleQuietTimeEdit = useCallback(
    (type: 'start' | 'end') => {
      const time = type === 'start' ? quietStart : quietEnd;
      const date = new Date();
      date.setHours(time.hour, time.minute, 0, 0);
      setTempDate(date);
      setEditingQuiet(type);
      setEditingTimeId(null);
      setShowTimePicker(true);
    },
    [quietStart, quietEnd]
  );

  const handleTimePickerChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowTimePicker(false);
      }

      if (event.type === 'dismissed') {
        setShowTimePicker(false);
        setEditingTimeId(null);
        setEditingQuiet(null);
        return;
      }

      if (selectedDate) {
        setTempDate(selectedDate);

        if (Platform.OS === 'android') {
          const hour = selectedDate.getHours();
          const minute = selectedDate.getMinutes();

          if (editingTimeId) {
            setScheduledTimes((prev) =>
              prev.map((t) =>
                t.id === editingTimeId ? { ...t, hour, minute } : t
              )
            );
            setEditingTimeId(null);
          } else if (editingQuiet === 'start') {
            setQuietStart({ hour, minute });
            setEditingQuiet(null);
          } else if (editingQuiet === 'end') {
            setQuietEnd({ hour, minute });
            setEditingQuiet(null);
          }
        }
      }
    },
    [editingTimeId, editingQuiet]
  );

  const handleTimePickerConfirm = useCallback(() => {
    const hour = tempDate.getHours();
    const minute = tempDate.getMinutes();

    if (editingTimeId) {
      setScheduledTimes((prev) =>
        prev.map((t) =>
          t.id === editingTimeId ? { ...t, hour, minute } : t
        )
      );
    } else if (editingQuiet === 'start') {
      setQuietStart({ hour, minute });
    } else if (editingQuiet === 'end') {
      setQuietEnd({ hour, minute });
    }

    setShowTimePicker(false);
    setEditingTimeId(null);
    setEditingQuiet(null);
  }, [tempDate, editingTimeId, editingQuiet]);

  const formatTime = (hour: number, minute: number): string => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const getModeDescription = (m: NotificationMode): string => {
    switch (m) {
      case 'manual':
        return 'Напоминания приходят в выбранное вами время';
      case 'smart':
        return 'Приложение анализирует ваш стресс и напоминает, когда нужно';
      case 'combined':
        return 'Фиксированное расписание + умные напоминания при стрессе';
    }
  };

  const getModeIcon = (m: NotificationMode): string => {
    switch (m) {
      case 'manual':
        return 'time-outline';
      case 'smart':
        return 'pulse-outline';
      case 'combined':
        return 'git-merge-outline';
    }
  };

  const getModeLabel = (m: NotificationMode): string => {
    switch (m) {
      case 'manual':
        return 'Ручное расписание';
      case 'smart':
        return 'Умные уведомления';
      case 'combined':
        return 'Комбинированный';
    }
  };

  const styles = createStyles(colors);

  const sortedTimes = [...scheduledTimes].sort((a, b) => {
    if (a.hour !== b.hour) return a.hour - b.hour;
    return a.minute - b.minute;
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Icon name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Уведомления
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Toggle */}
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <View style={styles.masterToggleRow}>
            <View style={styles.masterToggleInfo}>
              <Icon
                name="notifications-outline"
                size={24}
                color={colors.primary}
              />
              <Text style={[styles.masterToggleLabel, { color: colors.text }]}>
                Уведомления
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.border, true: colors.primary + '60' }}
              thumbColor={notificationsEnabled ? colors.primary : '#f4f3f4'}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {notificationsEnabled && (
          <>
            {/* Mode Selection */}
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Режим уведомлений
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card }]}>
              {(['manual', 'smart', 'combined'] as NotificationMode[]).map(
                (m, index) => (
                  <React.Fragment key={m}>
                    <TouchableOpacity
                      style={[
                        styles.modeOption,
                        mode === m && {
                          backgroundColor: colors.primary + '10',
                        },
                      ]}
                      onPress={() => handleModeChange(m)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.modeOptionLeft}>
                        <View
                          style={[
                            styles.radioOuter,
                            {
                              borderColor:
                                mode === m ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          {mode === m && (
                            <View
                              style={[
                                styles.radioInner,
                                { backgroundColor: colors.primary },
                              ]}
                            />
                          )}
                        </View>
                        <View style={styles.modeTextContainer}>
                          <View style={styles.modeLabelRow}>
                            <Icon
                              name={getModeIcon(m)}
                              size={18}
                              color={
                                mode === m ? colors.primary : colors.textSecondary
                              }
                            />
                            <Text
                              style={[
                                styles.modeLabel,
                                {
                                  color:
                                    mode === m
                                      ? colors.primary
                                      : colors.text,
                                },
                              ]}
                            >
                              {getModeLabel(m)}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.modeDescription,
                              { color: colors.textSecondary },
                            ]}
                          >
                            {getModeDescription(m)}
                          </Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                    {index < 2 && (
                      <View
                        style={[
                          styles.separator,
                          { backgroundColor: colors.border },
                        ]}
                      />
                    )}
                  </React.Fragment>
                )
              )}
            </View>

            {/* Manual Schedule */}
            {(mode === 'manual' || mode === 'combined') && (
              <>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    Расписание
                  </Text>
                  <TouchableOpacity
                    onPress={handleAddTime}
                    style={[
                      styles.addButton,
                      { backgroundColor: colors.primary + '15' },
                    ]}
                    activeOpacity={0.7}
                  >
                    <Icon name="add" size={20} color={colors.primary} />
                    <Text
                      style={[styles.addButtonText, { color: colors.primary }]}
                    >
                      Добавить
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={[styles.card, { backgroundColor: colors.card }]}>
                  {sortedTimes.length === 0 ? (
                    <View style={styles.emptyState}>
                      <Icon
                        name="alarm-outline"
                        size={40}
                        color={colors.textSecondary}
                      />
                      <Text
                        style={[
                          styles.emptyStateText,
                          { color: colors.textSecondary },
                        ]}
                      >
                        Нет запланированных напоминаний
                      </Text>
                    </View>
                  ) : (
                    sortedTimes.map((time, index) => (
                      <React.Fragment key={time.id}>
                        <NotificationTimePickerRow
                          time={formatTime(time.hour, time.minute)}
                          enabled={time.enabled}
                          onToggle={() => handleToggleTime(time.id)}
                          onPress={() => handleEditTime(time.id)}
                          onDelete={() => handleRemoveTime(time.id)}
                        />
                        {index < sortedTimes.length - 1 && (
                          <View
                            style={[
                              styles.separator,
                              { backgroundColor: colors.border },
                            ]}
                          />
                        )}
                      </React.