import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import CircularTimer from '../components/CircularTimer';
import BiometricIndicator from '../components/BiometricIndicator';
import { RootStackParamList } from '../navigation/types';
import { useExerciseTimer } from '../hooks/useExerciseTimer';
import { useHealthData } from '../hooks/useHealthData';
import { Exercise } from '../models/Exercise';
import { Session } from '../models/Session';
import { AudioService } from '../services/AudioService';
import { StorageService } from '../services/StorageService';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

type ExerciseSessionScreenRouteProp = RouteProp<RootStackParamList, 'ExerciseSession'>;
type ExerciseSessionScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ExerciseSession'>;

const { width, height } = Dimensions.get('window');

const ExerciseSessionScreen: React.FC = () => {
  const navigation = useNavigation<ExerciseSessionScreenNavigationProp>();
  const route = useRoute<ExerciseSessionScreenRouteProp>();
  const { exercise } = route.params;

  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'preparation' | 'active' | 'cooldown'>('preparation');
  const [sessionStartTime] = useState(new Date());
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(1))[0];
  const pulseAnim = useState(new Animated.Value(1))[0];

  const { heartRate, hrv, isLoading: biometricLoading } = useHealthData();
  const {
    timeRemaining,
    totalTime,
    isRunning,
    start,
    pause,
    resume,
    reset,
  } = useExerciseTimer(exercise.duration * 60);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    loadAudio();
    startPreparationPhase();

    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  useEffect(() => {
    if (isRunning) {
      startPulseAnimation();
    }
  }, [isRunning]);

  useEffect(() => {
    if (timeRemaining === 0 && !isCompleted) {
      handleExerciseComplete();
    }
  }, [timeRemaining, isCompleted]);

  const loadAudio = async () => {
    try {
      const audioService = new AudioService();
      const loadedSound = await audioService.loadExerciseAudio(exercise.id);
      setSound(loadedSound);
    } catch (error) {
      console.error('Error loading audio:', error);
    }
  };

  const startPreparationPhase = () => {
    setCurrentPhase('preparation');
    setTimeout(() => {
      setCurrentPhase('active');
      start();
      playAudio();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 3000);
  };

  const playAudio = async () => {
    if (sound && exercise.audioGuided) {
      try {
        await sound.playAsync();
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    }
  };

  const pauseAudio = async () => {
    if (sound) {
      try {
        await sound.pauseAsync();
      } catch (error) {
        console.error('Error pausing audio:', error);
      }
    }
  };

  const resumeAudio = async () => {
    if (sound) {
      try {
        await sound.playAsync();
      } catch (error) {
        console.error('Error resuming audio:', error);
      }
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handlePauseResume = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isPaused) {
      resume();
      resumeAudio();
      setIsPaused(false);
    } else {
      pause();
      pauseAudio();
      setIsPaused(true);
    }

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleStop = () => {
    Alert.alert(
      'Завершить упражнение?',
      'Вы уверены, что хотите остановить упражнение? Прогресс не будет сохранён.',
      [
        {
          text: 'Отмена',
          style: 'cancel',
        },
        {
          text: 'Завершить',
          style: 'destructive',
          onPress: () => {
            if (sound) {
              sound.stopAsync();
            }
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleExerciseComplete = async () => {
    setIsCompleted(true);
    setCurrentPhase('cooldown');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (sound) {
      await sound.stopAsync();
    }

    const session: Session = {
      id: Date.now().toString(),
      exerciseId: exercise.id,
      emotionId: route.params.emotionId || '',
      startTime: sessionStartTime,
      endTime: new Date(),
      duration: exercise.duration,
      completed: true,
      heartRateData: heartRate ? [heartRate] : [],
      hrvData: hrv ? [hrv] : [],
      notes: '',
    };

    try {
      await StorageService.saveSession(session);
    } catch (error) {
      console.error('Error saving session:', error);
    }

    setTimeout(() => {
      navigation.replace('SessionResult', {
        session,
        exercise,
      });
    }, 2000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseText = (): string => {
    switch (currentPhase) {
      case 'preparation':
        return 'Подготовка...';
      case 'active':
        return exercise.name;
      case 'cooldown':
        return 'Отличная работа!';
      default:
        return '';
    }
  };

  const getGradientColors = (): string[] => {
    if (isCompleted) {
      return [colors.success, colors.successLight];
    }
    if (isPaused) {
      return [colors.warning, colors.warningLight];
    }
    return [colors.primary, colors.primaryLight];
  };

  const progress = totalTime > 0 ? (totalTime - timeRemaining) / totalTime : 0;

  return (
    <LinearGradient colors={getGradientColors()} style={styles.container}>
      <StatusBar barStyle="light-content" />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleStop}>
            <Text style={styles.backButtonText}>✕</Text>
          </TouchableOpacity>
          <Text style={styles.phaseText}>{getPhaseText()}</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Biometric Data */}
        {!biometricLoading && (heartRate || hrv) && (
          <View style={styles.biometricContainer}>
            <BiometricIndicator heartRate={heartRate} hrv={hrv} compact />
          </View>
        )}

        {/* Timer */}
        <Animated.View
          style={[
            styles.timerContainer,
            {
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <CircularTimer
            progress={progress}
            size={width * 0.7}
            strokeWidth={20}
            color={colors.white}
            backgroundColor="rgba(255, 255, 255, 0.3)"
          />
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
            <Text style={styles.timerSubtext}>
              {currentPhase === 'preparation' ? 'до начала' : 'осталось'}
            </Text>
          </View>
        </Animated.View>

        {/* Exercise Instructions */}
        {currentPhase === 'active' && (
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>{exercise.instructions}</Text>
          </View>
        )}

        {/* Controls */}
        {currentPhase === 'active' && !isCompleted && (
          <Animated.View
            style={[
              styles.controlsContainer,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.controlButton}
              onPress={handlePauseResume}
              activeOpacity={0.8}
            >
              <Text style={styles.controlButtonText}>
                {isPaused ? '▶' : '⏸'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Completion Message */}
        {isCompleted && (
          <View style={styles.completionContainer}>
            <Text style={styles.completionEmoji}>🎉</Text>
            <Text style={styles.completionText}>Упражнение завершено!</Text>
            <Text style={styles.completionSubtext}>
              Сохраняем результаты...
            </Text>
          </View>
        )}
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    color: colors.white,
    fontSize: 24,
    fontFamily: typography.medium,
  },
  phaseText: {
    color: colors.white,
    fontSize: 18,
    fontFamily: typography.semiBold,
  },
  placeholder: {
    width: 40,
  },
  biometricContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    color: colors.white,
    fontSize: 56,
    fontFamily: typography.bold,
    marginBottom: spacing.xs,
  },
  timerSubtext: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.regular,
    opacity: 0.8,
  },
  instructionsContainer: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  instructionsText: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.regular,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  controlsContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xl,
    alignItems: 'center',
  },
  controlButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  controlButtonText: {
    fontSize: 32,
    color: colors.primary,
  },
  completionContainer: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxl,
    alignItems: 'center',
  },
  completionEmoji: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  completionText: {
    color: colors.white,
    fontSize: 24,
    fontFamily: typography.bold,
    marginBottom: spacing.xs,
  },
  completionSubtext: {
    color: colors.white,
    fontSize: 16,
    fontFamily: typography.regular,
    opacity: 0.8,
  },
});

export default ExerciseSessionScreen;