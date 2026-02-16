import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Exercise } from '../models/Exercise';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface ExerciseCardProps {
  exercise: Exercise;
  onPress: (exercise: Exercise) => void;
  disabled?: boolean;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - spacing.lg * 2;

export const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  onPress,
  disabled = false,
}) => {
  const getDifficultyColor = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return colors.success;
      case 'medium':
        return colors.warning;
      case 'hard':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  const getDifficultyLabel = (difficulty: Exercise['difficulty']) => {
    switch (difficulty) {
      case 'easy':
        return 'Легко';
      case 'medium':
        return 'Средне';
      case 'hard':
        return 'Сложно';
      default:
        return 'Неизвестно';
    }
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} сек`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} мин`;
    }
    return `${minutes} мин ${remainingSeconds} сек`;
  };

  const getGradientColors = () => {
    if (disabled) {
      return [colors.backgroundSecondary, colors.backgroundSecondary];
    }
    return [colors.cardBackground, colors.backgroundSecondary];
  };

  return (
    <TouchableOpacity
      onPress={() => onPress(exercise)}
      disabled={disabled}
      activeOpacity={0.7}
      style={styles.container}
    >
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.titleContainer}>
              <Text style={[styles.title, disabled && styles.disabledText]}>
                {exercise.title}
              </Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(exercise.difficulty) },
                ]}
              >
                <Text style={styles.difficultyText}>
                  {getDifficultyLabel(exercise.difficulty)}
                </Text>
              </View>
            </View>
          </View>

          <Text
            style={[styles.description, disabled && styles.disabledText]}
            numberOfLines={3}
          >
            {exercise.description}
          </Text>

          <View style={styles.footer}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Длительность</Text>
                <Text style={[styles.infoValue, disabled && styles.disabledText]}>
                  {formatDuration(exercise.duration)}
                </Text>
              </View>

              {exercise.category && (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Категория</Text>
                  <Text style={[styles.infoValue, disabled && styles.disabledText]}>
                    {exercise.category}
                  </Text>
                </View>
              )}
            </View>

            {exercise.benefits && exercise.benefits.length > 0 && (
              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsLabel}>Польза:</Text>
                <View style={styles.benefitsList}>
                  {exercise.benefits.slice(0, 2).map((benefit, index) => (
                    <View key={index} style={styles.benefitTag}>
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                  {exercise.benefits.length > 2 && (
                    <View style={styles.benefitTag}>
                      <Text style={styles.benefitText}>
                        +{exercise.benefits.length - 2}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {disabled && (
          <View style={styles.disabledOverlay}>
            <Text style={styles.disabledLabel}>Скоро</Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    borderRadius: spacing.md,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gradient: {
    width: '100%',
    minHeight: 180,
  },
  content: {
    padding: spacing.md,
  },
  header: {
    marginBottom: spacing.sm,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  title: {
    ...typography.h3,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  difficultyBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  difficultyText: {
    ...typography.caption,
    color: colors.background,
    fontWeight: '600',
  },
  description: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  footer: {
    marginTop: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    ...typography.body,
    color: colors.text,
    fontWeight: '600',
  },
  benefitsContainer: {
    marginTop: spacing.sm,
  },
  benefitsLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  benefitsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  benefitTag: {
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: spacing.sm,
  },
  benefitText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  disabledOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledLabel: {
    ...typography.h3,
    color: colors.background,
    fontWeight: '700',
  },
  disabledText: {
    opacity: 0.5,
  },
});