import React, { useEffect, useCallback, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../navigation/types';
import { useHealthData } from '../hooks/useHealthData';
import { useTheme } from '../hooks/useTheme';
import type { EmotionType } from '../models/Emotion';
import * as haptics from '../utils/haptics';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.85;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.55;
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

interface EmotionItem {
  id: EmotionType;
  name: string;
  icon: string;
  description: string;
  gradientColors: [string, string];
}

const EMOTIONS: EmotionItem[] = [
  {
    id: 'stress' as EmotionType,
    name: 'Стресс',
    icon: '⚡',
    description: 'Чувствую напряжение и давление',
    gradientColors: ['#FF6B6B', '#EE5A24'],
  },
  {
    id: 'sadness' as EmotionType,
    name: 'Грусть',
    icon: '🌧',
    description: 'Чувствую печаль и тоску',
    gradientColors: ['#74B9FF', '#0984E3'],
  },
  {
    id: 'anxiety' as EmotionType,
    name: 'Беспокойство',
    icon: '🌊',
    description: 'Тревожные мысли не отпускают',
    gradientColors: ['#A29BFE', '#6C5CE7'],
  },
  {
    id: 'fatigue' as EmotionType,
    name: 'Усталость',
    icon: '🍂',
    description: 'Нет сил и энергии',
    gradientColors: ['#FDCB6E', '#E17055'],
  },
  {
    id: 'irritation' as EmotionType,
    name: 'Раздражение',
    icon: '🔥',
    description: 'Всё раздражает и злит',
    gradientColors: ['#FF7675', '#D63031'],
  },
  {
    id: 'overwhelm' as EmotionType,
    name: 'Подавленность',
    icon: '☁️',
    description: 'Чувствую себя подавленным',
    gradientColors: ['#636E72', '#2D3436'],
  },
];

type NavigationProp = NativeStackNavigationProp<HomeStackParamList, 'EmotionPicker'>;

interface SwipeableCardProps {
  emotion: EmotionItem;
  index: number;
  totalCards: number;
  currentIndex: number;
  onSwipe: (emotion: EmotionItem) => void;
  isTop: boolean;
}

const SwipeableCard: React.FC<SwipeableCardProps> = ({
  emotion,
  index,
  totalCards,
  currentIndex,
  onSwipe,
  isTop,
}) => {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const cardScale = useSharedValue(isTop ? 1 : 0.95);
  const cardOpacity = useSharedValue(isTop ? 1 : 0.7);

  useEffect(() => {
    if (isTop) {
      cardScale.value = withSpring(1, { damping: 15 });
      cardOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [isTop, cardScale, cardOpacity]);

  const handleSwipe = useCallback(() => {
    haptics.triggerHaptic?.('impactLight');
    onSwipe(emotion);
  }, [emotion, onSwipe]);

  const panGesture = Gesture.Pan()
    .enabled(isTop)
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? 1 : -1;
        translateX.value = withTiming(
          direction * SCREEN_WIDTH * 1.5,
          { duration: 300 },
          () => {
            runOnJS(handleSwipe)();
          }
        );
        translateY.value = withTiming(event.translationY * 2, { duration: 300 });
      } else {
        translateX.value = withSpring(0, { damping: 15 });
        translateY.value = withSpring(0, { damping: 15 });
      }
    });

  const tapGesture = Gesture.Tap()
    .enabled(isTop)
    .onEnd(() => {
      runOnJS(handleSwipe)();
    });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const positionFromTop = index - currentIndex;

  const animatedStyle = useAnimatedStyle(() => {
    const rotate = interpolate(
      translateX.value,
      [-SCREEN_WIDTH, 0, SCREEN_WIDTH],
      [-15, 0, 15],
      Extrapolation.CLAMP
    );

    const scale = isTop
      ? interpolate(
          Math.abs(translateX.value),
          [0, SCREEN_WIDTH],
          [1, 0.9],
          Extrapolation.CLAMP
        )
      : cardScale.value;

    return {
      transform: [
        { translateX: isTop ? translateX.value : 0 },
        { translateY: isTop ? translateY.value : positionFromTop * 8 },
        { rotate: isTop ? `${rotate}deg` : '0deg' },
        { scale },
      ],
      opacity: cardOpacity.value,
      zIndex: totalCards - positionFromTop,
    };
  });

  const likeOpacityStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      translateX.value,
      [0, SWIPE_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    ),
  }));

  if (positionFromTop < 0 || positionFromTop > 2) {
    return null;
  }

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.cardContainer, animatedStyle]}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: emotion.gradientColors[0],
            },
          ]}
        >
          <View style={styles.cardInnerGradient}>
            <View
              style={[
                styles.gradientOverlay,
                { backgroundColor: emotion.gradientColors[1], opacity: 0.4 },
              ]}
            />
          </View>

          <Animated.View style={[styles.selectIndicator, likeOpacityStyle]}>
            <Text style={styles.selectText}>ВЫБРАТЬ</Text>
          </Animated.View>

          <View style={styles.cardContent}>
            <Text style={styles.emotionIcon}>{emotion.icon}</Text>
            <Text style={styles.emotionName}>{emotion.name}</Text>
            <Text style={styles.emotionDescription}>{emotion.description}</Text>
          </View>

          <View style={styles.swipeHint}>
            <Text style={styles.swipeHintText}>Свайп или нажми для выбора</Text>
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const EmotionPickerScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { heartRate, hrv, sleepData, isLoading: healthLoading } = useHealthData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [biometricsReady, setBiometricsReady] = useState(false);
  const biometricDataRef = useRef<{
    heartRate: number | null;
    hrv: number | null;
    sleepQuality: number | null;
  }>({
    heartRate: null,
    hrv: null,
    sleepQuality: null,
  });

  useEffect(() => {
    biometricDataRef.current = {
      heartRate: heartRate ?? null,
      hrv: hrv ?? null,
      sleepQuality: sleepData?.quality ?? null,
    };

    if (!healthLoading) {
      setBiometricsReady(true);
    }
  }, [heartRate, hrv, sleepData, healthLoading]);

  const handleEmotionSelect = useCallback(
    (emotion: EmotionItem) => {
      haptics.triggerHaptic?.('impactMedium');

      const biometrics = biometricDataRef.current;

      navigation.navigate('ExerciseList', {
        emotionId: emotion.id,
        emotionName: emotion.name,
        intensity: calculateIntensity(biometrics),
        biometrics: {
          heartRate: biometrics.heartRate,
          hrv: biometrics.hrv,
          sleepQuality: biometrics.sleepQuality,
        },
      });
    },
    [navigation]
  );

  const handleSwipe = useCallback(
    (emotion: EmotionItem) => {
      setCurrentIndex((prev) => prev + 1);
      handleEmotionSelect(emotion);
    },
    [handleEmotionSelect]
  );

  const handleReset = useCallback(() => {
    setCurrentIndex(0);
  }, []);

  const allSwiped = currentIndex >= EMOTIONS.length;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors?.background ?? '#F8F9FA' }]}
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors?.text ?? '#1A1A2E' }]}>
            Как ты себя чувствуешь?
          </Text>
          <Text style={[styles.subtitle, { color: colors?.textSecondary ?? '#636E72' }]}>
            Выбери эмоцию, которая ближе всего
          </Text>
        </View>

        {healthLoading && (
          <View style={styles.biometricIndicator}>
            <ActivityIndicator size="small" color={colors?.primary ?? '#6C5CE7'} />
            <Text
              style={[
                styles.biometricText,
                { color: colors?.textSecondary ?? '#636E72' },
              ]}
            >
              Считываю биометрику...
            </Text>
          </View>
        )}

        {biometricsReady && !healthLoading && heartRate != null && (
          <View style={styles.biometricIndicator}>
            <Text style={styles.biometricDot}>💚</Text>
            <Text
              style={[
                styles.biometricText,
                { color: colors?.textSecondary ?? '#636E72' },
              ]}
            >
              Пульс: {heartRate} уд/мин
            </Text>
          </View>
        )}

        <View style={styles.cardsContainer}>
          {allSwiped ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🔄</Text>
              <Text
                style={[
                  styles.emptyText,
                  { color: colors?.text ?? '#1A1A2E' },
                ]}
              >
                Вы просмотрели все эмоции
              </Text>
              <Text
                style={[
                  styles.emptySubtext,
                  { color: colors?.textSecondary ?? '#636E72' },
                ]}
                onPress={handleReset}
              >
                Нажмите, чтобы начать заново
              </Text>
            </View>
          ) : (
            [...EMOTIONS].reverse().map((emotion, reversedIndex) => {
              const originalIndex = EMOTIONS.length - 1 - reversedIndex;
              if (originalIndex < currentIndex) return null;

              return (
                <SwipeableCard
                  key={emotion.id}
                  emotion={emotion}
                  index={originalIndex}
                  totalCards={EMOTIONS.length}
                  currentIndex={currentIndex}
                  onSwipe={handleSwipe}
                  isTop={originalIndex === currentIndex}
                />
              );
            })
          )}
        </View>

        <View style={styles.pagination}>
          {EMOTIONS.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    idx === currentIndex
                      ? colors?.primary ?? '#6C5CE7'
                      : idx < currentIndex
                      ? colors?.primary ?? '#6C5CE7'
                      : (colors?.border ?? '#DFE6E9'),
                  opacity: idx < currentIndex ? 0.4 : 1,
                },
              ]}
            />
          ))}
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
};

function calculateIntensity(biometrics: {
  heartRate: number | null;
  hrv: number | null;
  sleepQuality: number | null;
}): 'low' | 'medium' | 'high' {
  const { heartRate, hrv, sleepQuality } = biometrics;

  let score = 50;

  if (heartRate != null) {
    if (heartRate > 90) score += 20;
    else if (heartRate > 75) score += 10;
    else score -= 10;
  }

  if (hrv != null) {
    if (hrv < 30) score += 20;
    else if (hrv < 50) score += 10;
    else score -= 10;
  }

  if (sleepQuality != null) {
    if (sleepQuality < 0.4) score += 15;
    else if (sleepQuality < 0.6) score += 5;
    else score -= 10;
  }

  if (score >= 70) return 'high';
  if (score >= 45) return 'medium';
  return 'low';
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,