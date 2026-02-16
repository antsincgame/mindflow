import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { motivationalMessages } from '../utils/motivationalMessages';

interface MotivationalMessageProps {
  sessionCount?: number;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
  currentStreak?: number;
  isSessionActive?: boolean;
}

export const MotivationalMessage: React.FC<MotivationalMessageProps> = ({
  sessionCount = 0,
  timeOfDay = 'morning',
  currentStreak = 0,
  isSessionActive = false,
}) => {
  const [message, setMessage] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.9));

  useEffect(() => {
    const selectedMessage = getMotivationalMessage(
      sessionCount,
      timeOfDay,
      currentStreak,
      isSessionActive
    );
    setMessage(selectedMessage);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [sessionCount, timeOfDay, currentStreak, isSessionActive]);

  const getMotivationalMessage = (
    sessions: number,
    time: string,
    streak: number,
    active: boolean
  ): string => {
    if (active) {
      return 'Ты в потоке! Продолжай работать 💪';
    }

    if (streak > 0 && streak % 5 === 0) {
      return `Невероятно! Серия из ${streak} дней! Ты легенда 🏆`;
    }

    if (sessions === 0) {
      const timeMessages = {
        morning: 'Доброе утро! Начни день с продуктивности ☀️',
        afternoon: 'Полдень - идеальное время для фокуса 🎯',
        evening: 'Вечер - завершим день на высоте 🌙',
      };
      return timeMessages[time as keyof typeof timeMessages];
    }

    if (sessions > 0 && sessions < 5) {
      return motivationalMessages.earlySession[
        Math.floor(Math.random() * motivationalMessages.earlySession.length)
      ];
    }

    if (sessions >= 5 && sessions < 10) {
      return motivationalMessages.midSession[
        Math.floor(Math.random() * motivationalMessages.midSession.length)
      ];
    }

    return motivationalMessages.general[
      Math.floor(Math.random() * motivationalMessages.general.length)
    ];
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <View style={styles.messageBox}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.messageText}>{message}</Text>
      </View>

      {currentStreak > 0 && (
        <View style={styles.streakContainer}>
          <Text style={styles.streakText}>🔥 Серия: {currentStreak} дней</Text>
        </View>
      )}

      {sessionCount > 0 && (
        <View style={styles.statsContainer}>
          <Text style={styles.statsText}>
            Сегодня: {sessionCount} сессий выполнено
          </Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  messageBox: {
    backgroundColor: colors.primary + '15',
    borderRadius: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  emoji: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  messageText: {
    flex: 1,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    lineHeight: 22,
  },
  streakContainer: {
    backgroundColor: colors.accent + '10',
    borderRadius: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xs,
  },
  streakText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.accent,
    textAlign: 'center',
  },
  statsContainer: {
    backgroundColor: colors.success + '10',
    borderRadius: spacing.sm,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  statsText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.success,
    textAlign: 'center',
  },
});