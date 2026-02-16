import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { StackScreenProps } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { Exercise } from '../models/Exercise';
import { Emotion } from '../models/Emotion';
import ExerciseCard from '../components/ExerciseCard';
import { ExerciseRecommendationService } from '../services/ExerciseRecommendationService';
import { useHealthData } from '../hooks/useHealthData';
import BiometricIndicator from '../components/BiometricIndicator';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

type Props = StackScreenProps<RootStackParamList, 'ExerciseList'>;

const { width } = Dimensions.get('window');

const ExerciseListScreen: React.FC<Props> = ({ route, navigation }) => {
  const { emotion } = route.params;
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'recommended' | 'quick' | 'deep'>('all');
  
  const { heartRate, hrv, loading: healthLoading } = useHealthData();

  useEffect(() => {
    loadExercises();
  }, [emotion, filterType]);

  const loadExercises = async () => {
    setLoading(true);
    try {
      const recommendationService = ExerciseRecommendationService.getInstance();
      let exerciseList: Exercise[];

      if (filterType === 'recommended') {
        exerciseList = await recommendationService.getRecommendedExercises(
          emotion,
          heartRate,
          hrv
        );
      } else {
        exerciseList = await recommendationService.getExercisesForEmotion(emotion);
        
        if (filterType === 'quick') {
          exerciseList = exerciseList.filter(ex => ex.duration <= 5);
        } else if (filterType === 'deep') {
          exerciseList = exerciseList.filter(ex => ex.duration > 5);
        }
      }

      setExercises(exerciseList);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    navigation.navigate('ExerciseSession', { exercise, emotion });
  };

  const getEmotionGradient = (emotionName: string): [string, string] => {
    const gradients: Record<string, [string, string]> = {
      anxiety: [colors.emotion.anxiety.light, colors.emotion.anxiety.dark],
      stress: [colors.emotion.stress.light, colors.emotion.stress.dark],
      anger: [colors.emotion.anger.light, colors.emotion.anger.dark],
      sadness: [colors.emotion.sadness.light, colors.emotion.sadness.dark],
      overwhelm: [colors.emotion.overwhelm.light, colors.emotion.overwhelm.dark],
      restlessness: [colors.emotion.restlessness.light, colors.emotion.restlessness.dark],
    };
    return gradients[emotionName.toLowerCase()] || [colors.primary, colors.secondary];
  };

  const renderFilterButton = (
    type: typeof filterType,
    label: string,
    icon: keyof typeof Ionicons.glyphMap
  ) => {
    const isActive = filterType === type;
    return (
      <TouchableOpacity
        style={[styles.filterButton, isActive && styles.filterButtonActive]}
        onPress={() => setFilterType(type)}
        activeOpacity={0.7}
      >
        <Ionicons
          name={icon}
          size={20}
          color={isActive ? colors.white : colors.text.secondary}
        />
        <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.emotionHeader}>
        <Text style={styles.emotionIcon}>{emotion.icon}</Text>
        <View style={styles.emotionInfo}>
          <Text style={styles.emotionName}>{emotion.name}</Text>
          <Text style={styles.emotionDescription}>{emotion.description}</Text>
        </View>
      </View>

      {!healthLoading && heartRate && (
        <BiometricIndicator heartRate={heartRate} hrv={hrv} compact />
      )}

      <View style={styles.filterContainer}>
        {renderFilterButton('all', 'Все', 'list-outline')}
        {renderFilterButton('recommended', 'Для вас', 'sparkles-outline')}
        {renderFilterButton('quick', 'Быстрые', 'flash-outline')}
        {renderFilterButton('deep', 'Глубокие', 'infinite-outline')}
      </View>

      <View style={styles.exerciseCountContainer}>
        <Text style={styles.exerciseCount}>
          {exercises.length} {exercises.length === 1 ? 'упражнение' : 'упражнений'}
        </Text>
        {filterType === 'recommended' && (
          <View style={styles.recommendedBadge}>
            <Ionicons name="sparkles" size={12} color={colors.accent} />
            <Text style={styles.recommendedBadgeText}>Персонально</Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderExerciseItem = ({ item, index }: { item: Exercise; index: number }) => (
    <View style={styles.exerciseCardContainer}>
      <ExerciseCard
        exercise={item}
        onPress={() => handleExerciseSelect(item)}
        style={{ marginHorizontal: spacing.md }}
      />
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="fitness-outline" size={64} color={colors.text.disabled} />
      <Text style={styles.emptyStateTitle}>Упражнения не найдены</Text>
      <Text style={styles.emptyStateText}>
        Попробуйте изменить фильтр или выберите другую эмоцию
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setFilterType('all')}
      >
        <Text style={styles.emptyStateButtonText}>Показать все</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <LinearGradient
        colors={getEmotionGradient(emotion.name)}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.white} />
          <Text style={styles.loadingText}>Подбираем упражнения...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getEmotionGradient(emotion.name)}
        style={styles.gradientHeader}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.white} />
        </TouchableOpacity>
        <Text style={styles.screenTitle}>Выберите упражнение</Text>
      </LinearGradient>

      <FlatList
        data={exercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={10}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  gradientHeader: {
    paddingTop: 60,
    paddingBottom: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: spacing.lg,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    ...typography.h2,
    color: colors.white,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.white,
    marginTop: spacing.md,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  header: {
    padding: spacing.lg,
  },
  emotionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emotionIcon: {
    fontSize: 48,
    marginRight: spacing.md,
  },
  emotionInfo: {
    flex: 1,
  },
  emotionName: {
    ...typography.h3,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  emotionDescription: {
    ...typography.caption,
    color: colors.text.secondary,
  },
  filterContainer: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    borderRadius: 12,
    backgroundColor: colors.background.secondary,
    gap: spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: colors.primary,
  },
  filterButtonText: {
    ...typography.caption,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  filterButtonTextActive: {
    color: colors.white,
  },
  exerciseCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  exerciseCount: {
    ...typography.body,
    color: colors.text.secondary,
    fontWeight: '600',
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: 12,
    backgroundColor: colors.accent + '20',
    gap: spacing.xs,
  },
  recommendedBadgeText: {
    ...typography.caption,
    color: colors.accent,
    fontWeight: '600',
  },
  exerciseCardContainer: {
    marginBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyStateTitle: {
    ...typography.h3,
    color: colors.text.primary,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyStateText: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  emptyStateButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  emptyStateButtonText: {
    ...typography.button,
    color: colors.white,
  },
});

export default ExerciseListScreen;