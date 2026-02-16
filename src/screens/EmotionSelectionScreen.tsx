import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { Emotion } from '../models/Emotion';
import { emotionData } from '../utils/emotionData';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

type EmotionSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'EmotionSelection'
>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const SWIPE_THRESHOLD = 120;
const SWIPE_OUT_DURATION = 250;

const EmotionSelectionScreen: React.FC = () => {
  const navigation = useNavigation<EmotionSelectionScreenNavigationProp>();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [emotions] = useState<Emotion[]>(emotionData);
  const position = useRef(new Animated.ValueXY()).current;
  const swipeDirection = useRef<'left' | 'right' | null>(null);

  const rotate = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ['-10deg', '0deg', '10deg'],
    extrapolate: 'clamp',
  });

  const likeOpacity = position.x.interpolate({
    inputRange: [0, SCREEN_WIDTH / 4],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  const nopeOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 4, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const nextCardOpacity = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0, 1],
    extrapolate: 'clamp',
  });

  const nextCardScale = position.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: [1, 0.9, 1],
    extrapolate: 'clamp',
  });

  const onSwipeComplete = useCallback(
    (direction: 'left' | 'right') => {
      const emotion = emotions[currentIndex];

      if (direction === 'right') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.navigate('ExerciseList', { emotion });
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      position.setValue({ x: 0, y: 0 });
      setCurrentIndex((prev) => prev + 1);
      swipeDirection.current = null;
    },
    [currentIndex, emotions, navigation, position]
  );

  const forceSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const x = direction === 'right' ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5;
      swipeDirection.current = direction;

      Animated.timing(position, {
        toValue: { x, y: 0 },
        duration: SWIPE_OUT_DURATION,
        useNativeDriver: false,
      }).start(() => onSwipeComplete(direction));
    },
    [position, onSwipeComplete]
  );

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gesture) => {
        position.setValue({ x: gesture.dx, y: gesture.dy });
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx > SWIPE_THRESHOLD) {
          forceSwipe('right');
        } else if (gesture.dx < -SWIPE_THRESHOLD) {
          forceSwipe('left');
        } else {
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
            friction: 4,
          }).start();
        }
      },
    })
  ).current;

  const renderCard = (emotion: Emotion, index: number) => {
    if (index < currentIndex) {
      return null;
    }

    if (index === currentIndex) {
      return (
        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.card,
            {
              transform: [
                { translateX: position.x },
                { translateY: position.y },
                { rotate },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={[emotion.color, emotion.secondaryColor || emotion.color]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          >
            <View style={styles.cardContent}>
              <Text style={styles.emotionIcon}>{emotion.icon}</Text>
              <Text style={styles.emotionName}>{emotion.name}</Text>
              <Text style={styles.emotionDescription}>{emotion.description}</Text>

              <Animated.View
                style={[
                  styles.likeLabel,
                  { opacity: likeOpacity },
                ]}
              >
                <Text style={styles.labelText}>ВЫБРАТЬ</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.nopeLabel,
                  { opacity: nopeOpacity },
                ]}
              >
                <Text style={styles.labelText}>ПРОПУСТИТЬ</Text>
              </Animated.View>
            </View>
          </LinearGradient>
        </Animated.View>
      );
    }

    return (
      <Animated.View
        key={emotion.id}
        style={[
          styles.card,
          styles.nextCard,
          {
            opacity: nextCardOpacity,
            transform: [{ scale: nextCardScale }],
          },
        ]}
      >
        <LinearGradient
          colors={[emotion.color, emotion.secondaryColor || emotion.color]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
          <View style={styles.cardContent}>
            <Text style={styles.emotionIcon}>{emotion.icon}</Text>
            <Text style={styles.emotionName}>{emotion.name}</Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  };

  const handleSkip = () => {
    forceSwipe('left');
  };

  const handleSelect = () => {
    forceSwipe('right');
  };

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentIndex(0);
    position.setValue({ x: 0, y: 0 });
  };

  if (currentIndex >= emotions.length) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.completedContainer}>
          <Text style={styles.completedIcon}>✨</Text>
          <Text style={styles.completedTitle}>Все эмоции просмотрены</Text>
          <Text style={styles.completedSubtitle}>
            Вы можете начать заново или вернуться на главный экран
          </Text>
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Text style={styles.resetButtonText}>Начать заново</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.homeButtonText}>На главную</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Как вы себя чувствуете?</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.cardContainer}>
        {emotions
          .map((emotion, index) => renderCard(emotion, index))
          .reverse()}
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / emotions.length) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {currentIndex + 1} / {emotions.length}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.skipButton]}
          onPress={handleSkip}
        >
          <Text style={styles.skipButtonIcon}>✕</Text>
          <Text style={styles.actionButtonText}>Пропустить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.selectButton]}
          onPress={handleSelect}
        >
          <Text style={styles.selectButtonIcon}>♥</Text>
          <Text style={styles.actionButtonText}>Выбрать</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.lg,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: colors.text,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  cardContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    position: 'absolute',
    width: SCREEN_WIDTH * 0.85,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextCard: {
    zIndex: -1,
  },
  cardGradient: {
    flex: 1,
    padding: spacing.xl,
  },
  cardContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emotionIcon: {
    fontSize: 120,
    marginBottom: spacing.xl,
  },
  emotionName: {
    ...typography.h1,
    color: colors.white,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  emotionDescription: {
    ...typography.body,
    color: colors.white,
    textAlign: 'center',
    opacity: 0.9,
    paddingHorizontal: spacing.lg,
  },
  likeLabel: {
    position: 'absolute',
    top: 50,
    right: 40,
    borderWidth: 4,
    borderColor: colors.success,
    borderRadius: 8,
    padding: spacing.sm,
    transform: [{ rotate: '20deg' }],
  },
  nopeLabel: {
    position: 'absolute',
    top: 50,
    left: 40,
    borderWidth: 4,
    borderColor: colors.error,
    borderRadius: 8,
    padding: spacing.sm,
    transform: [{ rotate: '-20deg' }],
  },
  labelText: {
    ...typography.h3,
    color: colors.white,
    fontWeight: 'bold',
  },
  progressContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.surface,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
  },
  progressText: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl * 2,
  },
  actionButton: {
    width: 140,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  skipButton: {
    backgroundColor: colors.surface,
  },
  selectButton: {
    backgroundColor: colors.primary,
  },
  skipButtonIcon: {
    fontSize: 24,
    color: colors.error,
    marginBottom: spacing.xs,
  },
  selectButtonIcon: {
    fontSize: 24,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  actionButtonText: {
    ...typography.button,
    color: colors.text,
  },
  completedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  completedIcon: {
    fontSize: 80,
    marginBottom: spacing.xl,
  },
  completedTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },