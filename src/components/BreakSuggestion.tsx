import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface BreakSuggestionProps {
  onDismiss?: () => void;
  onComplete?: () => void;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  duration: number;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 'water',
    title: 'Пейте воду',
    description: 'Выпейте стакан воды для гидратации',
    icon: 'water',
    color: '#3498db',
    duration: 2,
  },
  {
    id: 'stretch',
    title: 'Растяжка',
    description: 'Сделайте легкую растяжку мышц шеи и спины',
    icon: 'yoga',
    color: '#e74c3c',
    duration: 3,
  },
  {
    id: 'walk',
    title: 'Прогулка',
    description: 'Сделайте короткую прогулку вокруг комнаты',
    icon: 'walk',
    color: '#2ecc71',
    duration: 4,
  },
  {
    id: 'eyes',
    title: 'Отдых для глаз',
    description: 'Посмотрите вдаль, дайте отдых глазам',
    icon: 'eye',
    color: '#9b59b6',
    duration: 2,
  },
  {
    id: 'breathe',
    title: 'Дыхание',
    description: 'Выполните упражнение глубокого дыхания',
    icon: 'lung',
    color: '#1abc9c',
    duration: 3,
  },
  {
    id: 'snack',
    title: 'Полезный перекус',
    description: 'Перекусите фруктом или орехами',
    icon: 'apple',
    color: '#f39c12',
    duration: 5,
  },
];

export const BreakSuggestion: React.FC<BreakSuggestionProps> = ({
  onDismiss,
  onComplete,
}) => {
  const [currentSuggestion, setCurrentSuggestion] = useState<Suggestion>(
    SUGGESTIONS[Math.floor(Math.random() * SUGGESTIONS.length)]
  );
  const [isCompleted, setIsCompleted] = useState(false);
  const [timer, setTimer] = useState(currentSuggestion.duration * 60);
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, [currentSuggestion]);

  useEffect(() => {
    if (!isCompleted) {
      const interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            setIsCompleted(true);
            onComplete?.();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isCompleted, onComplete]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = () => {
    setIsCompleted(true);
    onComplete?.();
  };

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.();
    });
  };

  const slideStyle = {
    transform: [
      {
        translateY: slideAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [100, 0],
        }),
      },
    ],
    opacity: slideAnim,
  };

  const scaleStyle = {
    transform: [{ scale: scaleAnim }],
  };

  return (
    <Animated.View
      style={[
        styles.container,
        slideStyle,
        scaleStyle,
        { backgroundColor: currentSuggestion.color },
      ]}
    >
      <View style={styles.header}>
        <MaterialCommunityIcons
          name={currentSuggestion.icon as any}
          size={48}
          color={colors.white}
          style={styles.icon}
        />
        <TouchableOpacity
          onPress={handleDismiss}
          style={styles.closeButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialCommunityIcons
            name="close"
            size={24}
            color={colors.white}
          />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{currentSuggestion.title}</Text>
      <Text style={styles.description}>
        {currentSuggestion.description}
      </Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timer)}</Text>
        <Text style={styles.timerLabel}>минут для этого упражнения</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.skipButton]}
          onPress={handleDismiss}
        >
          <Text style={styles.skipButtonText}>Пропустить</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.completeButton]}
          onPress={handleComplete}
        >
          <MaterialCommunityIcons
            name="check-circle"
            size={20}
            color={colors.white}
            style={styles.buttonIcon}
          />
          <Text style={styles.completeButtonText}>Завершено</Text>
        </TouchableOpacity>
      </View>

      {isCompleted && (
        <View style={styles.completedOverlay}>
          <MaterialCommunityIcons
            name="check-circle-outline"
            size={64}
            color={colors.white}
          />
          <Text style={styles.completedText}>Отлично!</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: spacing.lg,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  icon: {
    opacity: 0.9,
  },
  closeButton: {
    padding: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  description: {
    fontSize: typography.sizes.sm,
    color: colors.white,
    opacity: 0.9,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: spacing.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    paddingVertical: spacing.md,
  },
  timerText: {
    fontSize: 36,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  timerLabel: {
    fontSize: typography.sizes.sm,
    color: colors.white,
    opacity: 0.8,
    marginTop: spacing.xs,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
  },
  skipButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  completeButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  completeButtonText: {
    color: colors.white,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  buttonIcon: {
    marginRight: spacing.xs,
  },
  completedOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
  },
  completedText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.white,
    marginTop: spacing.md,
  },
});