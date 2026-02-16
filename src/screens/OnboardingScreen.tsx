import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Platform,
  Alert,
  ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '@navigation/types';
import { HealthKitService } from '@services/HealthKitService';
import { NotificationService } from '@services/NotificationService';
import { StorageService } from '@services/StorageService';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  emoji: string;
  description: string;
  type: 'info' | 'healthkit' | 'notifications' | 'time';
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Добро пожаловать\nв MindFlow',
    subtitle: 'Ваш персональный помощник\nдля ментального здоровья',
    emoji: '🧘',
    description:
      'MindFlow поможет вам управлять стрессом, тревогой и эмоциями с помощью дыхательных упражнений и медитаций.',
    type: 'info',
  },
  {
    id: 'how_it_works',
    title: 'Как это работает',
    subtitle: 'Три простых шага',
    emoji: '✨',
    description:
      '1. Выберите своё текущее состояние\n2. Получите персональные рекомендации\n3. Выполните короткое упражнение (2–5 мин)',
    type: 'info',
  },
  {
    id: 'healthkit',
    title: 'Биометрические\nданные',
    subtitle: 'Точные рекомендации на основе\nвашего состояния',
    emoji: '❤️',
    description:
      'Разрешите доступ к Apple Health, чтобы MindFlow мог анализировать пульс, вариабельность сердечного ритма и качество сна для более точных рекомендаций.',
    type: 'healthkit',
  },
  {
    id: 'notifications',
    title: 'Напоминания',
    subtitle: 'Не забывайте о себе',
    emoji: '🔔',
    description:
      'Разрешите уведомления, чтобы получать напоминания о практиках и умные оповещения при повышенном уровне стресса.',
    type: 'notifications',
  },
  {
    id: 'preferred_time',
    title: 'Время для практик',
    subtitle: 'Когда вам удобнее\nзаниматься?',
    emoji: '⏰',
    description:
      'Выберите предпочтительное время для ежедневных напоминаний. Вы сможете изменить его позже в настройках.',
    type: 'time',
  },
];

const OnboardingScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const flatListRef = useRef<FlatList<OnboardingStep>>(null);

  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [healthKitGranted, setHealthKitGranted] = useState<boolean>(false);
  const [notificationsGranted, setNotificationsGranted] = useState<boolean>(false);
  const [preferredTime, setPreferredTime] = useState<Date>(() => {
    const date = new Date();
    date.setHours(9, 0, 0, 0);
    return date;
  });
  const [showTimePicker, setShowTimePicker] = useState<boolean>(false);

  const isLastStep = currentIndex === ONBOARDING_STEPS.length - 1;

  const triggerHaptic = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  }, []);

  const handleNext = useCallback(() => {
    triggerHaptic();
    if (isLastStep) {
      completeOnboarding();
    } else {
      const nextIndex = currentIndex + 1;
      flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex, isLastStep, triggerHaptic]);

  const handleSkip = useCallback(() => {
    triggerHaptic();
    completeOnboarding();
  }, [triggerHaptic]);

  const completeOnboarding = useCallback(async () => {
    try {
      await StorageService.save('onboarding_completed', true);
      await StorageService.save('preferred_practice_time', preferredTime.toISOString());
      await StorageService.save('healthkit_granted', healthKitGranted);
      await StorageService.save('notifications_granted', notificationsGranted);
    } catch (error) {
      console.warn('Failed to save onboarding settings:', error);
    }
    navigation.reset({
      index: 0,
      routes: [{ name: 'Home' }],
    });
  }, [navigation, preferredTime, healthKitGranted, notificationsGranted]);

  const requestHealthKitPermission = useCallback(async () => {
    triggerHaptic();
    try {
      if (Platform.OS === 'ios') {
        const granted = await HealthKitService.requestPermissions();
        setHealthKitGranted(granted);
        if (!granted) {
          Alert.alert(
            'Доступ не предоставлен',
            'Вы можете разрешить доступ позже в настройках устройства.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.warn('HealthKit permission error:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось запросить доступ к Apple Health. Попробуйте позже в настройках.',
        [{ text: 'OK' }]
      );
    }
  }, [triggerHaptic]);

  const requestNotificationPermission = useCallback(async () => {
    triggerHaptic();
    try {
      const granted = await NotificationService.requestPermissions();
      setNotificationsGranted(granted);
      if (!granted) {
        Alert.alert(
          'Уведомления отключены',
          'Вы можете включить уведомления позже в настройках устройства.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.warn('Notification permission error:', error);
      Alert.alert(
        'Ошибка',
        'Не удалось запросить разрешение на уведомления. Попробуйте позже в настройках.',
        [{ text: 'OK' }]
      );
    }
  }, [triggerHaptic]);

  const handleTimeChange = useCallback((_event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowTimePicker(false);
    }
    if (selectedDate) {
      setPreferredTime(selectedDate);
    }
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const formatTime = (date: Date): string => {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const getButtonTitle = (): string => {
    const step = ONBOARDING_STEPS[currentIndex];
    switch (step.type) {
      case 'healthkit':
        return healthKitGranted ? 'Доступ получен ✓' : 'Разрешить доступ к Health';
      case 'notifications':
        return notificationsGranted ? 'Уведомления включены ✓' : 'Включить уведомления';
      case 'time':
        return 'Начать использовать MindFlow';
      default:
        return 'Далее';
    }
  };

  const handleActionButton = useCallback(() => {
    const step = ONBOARDING_STEPS[currentIndex];
    switch (step.type) {
      case 'healthkit':
        if (!healthKitGranted) {
          requestHealthKitPermission();
        } else {
          handleNext();
        }
        break;
      case 'notifications':
        if (!notificationsGranted) {
          requestNotificationPermission();
        } else {
          handleNext();
        }
        break;
      default:
        handleNext();
        break;
    }
  }, [
    currentIndex,
    healthKitGranted,
    notificationsGranted,
    requestHealthKitPermission,
    requestNotificationPermission,
    handleNext,
  ]);

  const showSkipForPermissionSteps =
    ONBOARDING_STEPS[currentIndex].type === 'healthkit' ||
    ONBOARDING_STEPS[currentIndex].type === 'notifications';

  const renderPermissionStatus = (granted: boolean, label: string) => (
    <View style={styles.permissionStatusContainer}>
      <View style={[styles.permissionDot, granted ? styles.permissionDotGranted : styles.permissionDotDenied]} />
      <Text style={[styles.permissionStatusText, granted ? styles.permissionGrantedText : styles.permissionDeniedText]}>
        {granted ? `${label} — разрешено` : `${label} — не разрешено`}
      </Text>
    </View>
  );

  const renderTimeSelector = () => (
    <View style={styles.timeSelectorContainer}>
      <TouchableOpacity
        style={styles.timeButton}
        onPress={() => setShowTimePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.timeButtonText}>{formatTime(preferredTime)}</Text>
        <Text style={styles.timeButtonSubtext}>Нажмите, чтобы изменить</Text>
      </TouchableOpacity>

      {(showTimePicker || Platform.OS === 'ios') && (
        <DateTimePicker
          value={preferredTime}
          mode="time"
          is24Hour={true}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
          style={styles.timePicker}
          locale="ru"
        />
      )}

      <View style={styles.timePresetsContainer}>
        <Text style={styles.timePresetsTitle}>Или выберите:</Text>
        <View style={styles.timePresetsRow}>
          {[
            { label: 'Утро', hour: 8 },
            { label: 'День', hour: 13 },
            { label: 'Вечер', hour: 20 },
          ].map((preset) => {
            const isSelected = preferredTime.getHours() === preset.hour && preferredTime.getMinutes() === 0;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.timePresetButton, isSelected && styles.timePresetButtonActive]}
                onPress={() => {
                  triggerHaptic();
                  const newDate = new Date(preferredTime);
                  newDate.setHours(preset.hour, 0, 0, 0);
                  setPreferredTime(newDate);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.timePresetText, isSelected && styles.timePresetTextActive]}>
                  {preset.label}
                </Text>
                <Text style={[styles.timePresetHour, isSelected && styles.timePresetHourActive]}>
                  {`${preset.hour.toString().padStart(2, '0')}:00`}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderStep = ({ item }: { item: OnboardingStep }) => (
    <View style={styles.stepContainer}>
      <View style={styles.stepContent}>
        <Text style={styles.emoji}>{item.emoji}</Text>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
        <Text style={styles.description}>{item.description}</Text>

        {item.type === 'healthkit' && renderPermissionStatus(healthKitGranted, 'Apple Health')}
        {item.type === 'notifications' && renderPermissionStatus(notificationsGranted, 'Уведомления')}
        {item.type === 'time' && renderTimeSelector()}
      </View>
    </View>
  );

  const renderPaginationDots = () => (
    <View style={styles.paginationContainer}>
      {ONBOARDING_STEPS.map((_, index) => (
        <View
          key={index}
          style={[
            styles.paginationDot,
            index === currentIndex && styles.paginationDotActive,
          ]}
        />
      ))}
    </View>
  );

  return (
    <LinearGradient
      colors={['#F0F4FF', '#E8EEFF', '#F5F0FF']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.header}>
          {currentIndex > 0 && !isLastStep ? (
            <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
              <Text style={styles.skipText}>Пропустить</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.skipPlaceholder} />
          )}
        </View>

        <FlatList
          ref={flatListRef}
          data={ONBOARDING_STEPS}
          renderItem={renderStep}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          scrollEventThrot