import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'react-native-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
  SlideInRight,
} from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

import { RootStackParamList } from '../navigation/types';
import { Exercise } from '../models/Exercise';
import { Emotion } from '../models/Emotion';
import { BiometricData } from '../models/BiometricData';
import ExerciseCard from '../components/ExerciseCard';
import BiometricIndicator from '../components/BiometricIndicator';
import { useHealthData } from '../hooks/useHealthData';
import { useTheme } from '../hooks/useTheme';
import { exerciseRecommender } from '../utils/exerciseRecommender';
import { EXERCISES } from '../constants/exercises';
import { EMOTIONS } from '../constants/emotions';

const { width, height } = Dimensions.get('window');

type ExerciseSelectionScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'ExerciseSelection'
>;

type ExerciseSelectionScreenRouteProp = RouteProp<
  RootStackParamList,
  'ExerciseSelection'
>;

const ExerciseSelectionScreen: React.FC = () => {
  const navigation = useNavigation<ExerciseSelectionScreenNavigationProp>();
  const route = useRoute<ExerciseSelectionScreenRouteProp>();
  const { emotionId } = route.params;

  const { theme } = useTheme();
  const { biometricData, isLoading: isLoadingHealth } = useHealthData();

  const [selectedEmotion, setSelectedEmotion] = useState<Emotion | null>(null);
  const [recommendedExercises, setRecommendedExercises] = useState<Exercise[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const scrollY = useSharedValue(0);
  const headerOpacity = useSharedValue(1);

  useEffect(() => {
    loadEmotionAndExercises();
  }, [emotionId, biometricData]);

  const loadEmotionAndExercises = async () => {
    setIsLoading(true);
    
    const emotion = EMOTIONS.find(e => e.id === emotionId);
    if (emotion) {
      setSelectedEmotion(emotion);
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    const exercises = exerciseRecommender.getRecommendedExercises(
      emotionId,
      biometricData || undefined
    );

    setRecommendedExercises(exercises);
    setIsLoading(false);
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    HapticFeedback.trigger('impactMedium');
    setSelectedExercise(exercise);
  };

  const handleStartExercise = () => {
    if (selectedExercise) {
      HapticFeedback.trigger('impactHeavy');
      navigation.navigate('ExerciseSession', {
        exerciseId: selectedExercise.id,
        emotionId: emotionId,
      });
    }
  };

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    scrollY.value = offsetY;
    headerOpacity.value = Math.max(0, 1 - offsetY / 100);
  };

  const headerAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(headerOpacity.value, { duration: 150 }),
      transform: [
        {
          translateY: withTiming(-scrollY.value * 0.5, { duration: 150 }),
        },
      ],
    };
  });

  const startButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          scale: withSpring(selectedExercise ? 1 : 0.95, {
            damping: 15,
            stiffness: 150,
          }),
        },
      ],
      opacity: withTiming(selectedExercise ? 1 : 0.5, { duration: 200 }),
    };
  });

  if (isLoading || !selectedEmotion) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[selectedEmotion.color + '20', theme.colors.background]}
        style={styles.gradientBackground}
      />

      <Animated.View style={[styles.header, headerAnimatedStyle]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: theme.colors.text }]}>←</Text>
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <Text style={[styles.emotionIcon]}>{selectedEmotion.icon}</Text>
          <Text style={[styles.emotionName, { color: theme.colors.text }]}>
            {selectedEmotion.name}
          </Text>
          <Text style={[styles.emotionDescription, { color: theme.colors.textSecondary }]}>
            {selectedEmotion.description}
          </Text>
        </View>

        {biometricData && (
          <Animated.View entering={FadeIn.delay(300)}>
            <BiometricIndicator data={biometricData} compact />
          </Animated.View>
        )}
      </Animated.View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Рекомендованные упражнения
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Выберите упражнение, которое поможет вам справиться с текущим состоянием
          </Text>
        </View>

        <View style={styles.exercisesGrid}>
          {recommendedExercises.map((exercise, index) => (
            <Animated.View
              key={exercise.id}
              entering={SlideInRight.delay(index * 100).springify()}
            >
              <ExerciseCard
                exercise={exercise}
                isSelected={selectedExercise?.id === exercise.id}
                onPress={() => handleExerciseSelect(exercise)}
              />
            </Animated.View>
          ))}
        </View>

        {recommendedExercises.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={[styles.emptyStateText, { color: theme.colors.textSecondary }]}>
              Нет доступных упражнений для выбранной эмоции
            </Text>
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {selectedExercise && (
        <Animated.View style={[styles.startButtonContainer, startButtonAnimatedStyle]}>
          <TouchableOpacity
            style={[
              styles.startButton,
              { backgroundColor: selectedEmotion.color },
            ]}
            onPress={handleStartExercise}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[selectedEmotion.color, selectedEmotion.color + 'CC']}
              style={styles.startButtonGradient}
            >
              <Text style={styles.startButtonText}>
                Начать упражнение
              </Text>
              <Text style={styles.startButtonDuration}>
                {selectedExercise.duration} мин
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 24,
    fontWeight: '600',
  },
  headerContent: {
    alignItems: 'center',
    marginBottom: 20,
  },
  emotionIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  emotionName: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  emotionDescription: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sectionHeader: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  exercisesGrid: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
  },
  bottomSpacer: {
    height: 120,
  },
  startButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: 34,
    paddingTop: 16,
    backgroundColor: 'transparent',
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  startButtonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  startButtonDuration: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.9,
  },
});

export default ExerciseSelectionScreen;