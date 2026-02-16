import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LottieView from 'lottie-react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { useSession } from '../hooks/useSession';
import { useAchievements } from '../hooks/useAchievements';
import { useStatistics } from '../hooks/useStatistics';
import { SoundService } from '../services/SoundService';
import { StatCard } from '../components/StatCard';
import { AchievementBadge } from '../components/AchievementBadge';

type RootStackParamList = {
  Home: undefined;
  SessionComplete: {
    duration: number;
    taskName?: string;
  };
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'SessionComplete'>;

interface SessionStats {
  focusTime: number;
  sessionDuration: number;
  tasksCompleted: number;
  currentStreak: number;
  totalSessions: number;
  starsEarned: number;
}

interface UnlockedAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  isNew: boolean;
}

export const SessionCompleteScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { lastSession, resetSession } = useSession();
  const { checkNewAchievements } = useAchievements();
  const { getSessionStats, updateStatistics } = useStatistics();

  const [stats, setStats] = useState<SessionStats | null>(null);
  const [unlockedAchievements, setUnlockedAchievements] = useState<UnlockedAchievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scaleAnim = useState(new Animated.Value(0))[0];
  const opacityAnim = useState(new Animated.Value(0))[0];

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    loadSessionData();
    playCompletionSound();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      animateElements();
    }
  }, [isLoading]);

  const loadSessionData = async () => {
    try {
      if (lastSession) {
        const sessionStats = await getSessionStats(lastSession.id);
        setStats(sessionStats);

        const achievements = await checkNewAchievements(lastSession);
        setUnlockedAchievements(achievements);

        await updateStatistics(lastSession);
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading session data:', error);
      setIsLoading(false);
    }
  };

  const playCompletionSound = async () => {
    try {
      await SoundService.playSessionCompleteSound();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const animateElements = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleContinue = () => {
    resetSession();
    navigation.navigate('Home');
  };

  const handleStartNewSession = () => {
    resetSession();
    navigation.navigate('Home');
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getMotivationalMessage = (): string => {
    const messages = [
      'Отличная работа! Ты на пути к мастерству.',
      'Невероятно! Ты продолжаешь улучшаться.',
      'Потрясающе! Ты сосредоточен и мотивирован.',
      'Браво! Ты преодолел еще одну сессию.',
      'Супер! Твоя дисциплина вдохновляет.',
      'Отлично! Ты создаешь отличные привычки.',
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  if (isLoading || !stats) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <Text style={styles.loadingText}>Обработка результатов...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View
        style={[
          styles.celebrationContainer,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        <View style={styles.confettiContainer}>
          <Text style={styles.confetti}>🎉</Text>
          <Text style={styles.confetti}>⭐</Text>
          <Text style={styles.confetti}>🎊</Text>
          <Text style={styles.confetti}>✨</Text>
          <Text style={styles.confetti}>🏆</Text>
        </View>

        <Text style={styles.congratsText}>Сессия завершена!</Text>
        <Text style={styles.motivationalText}>{getMotivationalMessage()}</Text>
      </Animated.View>

      <View style={styles.statsSection}>
        <Text style={styles.sectionTitle}>Результаты сессии</Text>

        <View style={styles.statsGrid}>
          <StatCard
            title="Время фокуса"
            value={formatTime(stats.focusTime)}
            icon="⏱️"
            color={colors.primary}
          />
          <StatCard
            title="Длительность"
            value={formatTime(stats.sessionDuration)}
            icon="⏰"
            color={colors.secondary}
          />
          <StatCard
            title="Текущая серия"
            value={`${stats.currentStreak} дн.`}
            icon="🔥"
            color={colors.success}
          />
          <StatCard
            title="Всего сессий"
            value={stats.totalSessions.toString()}
            icon="📊"
            color={colors.info}
          />
        </View>
      </View>

      <View style={styles.starsSection}>
        <View style={styles.starsHeader}>
          <Text style={styles.sectionTitle}>Заработанные награды</Text>
          <View style={styles.starsBadge}>
            <Text style={styles.starsIcon}>⭐</Text>
            <Text style={styles.starsCount}>{stats.starsEarned}</Text>
          </View>
        </View>
      </View>

      {unlockedAchievements.length > 0 && (
        <View style={styles.achievementsSection}>
          <Text style={styles.sectionTitle}>Новые достижения</Text>
          <View style={styles.achievementsList}>
            {unlockedAchievements.map((achievement) => (
              <Animated.View
                key={achievement.id}
                style={[
                  styles.achievementItem,
                  {
                    opacity: opacityAnim,
                  },
                ]}
              >
                <AchievementBadge
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  isUnlocked={true}
                  isNew={achievement.isNew}
                />
              </Animated.View>
            ))}
          </View>
        </View>
      )}

      <View style={styles.buttonsSection}>
        <TouchableOpacity
          style={[styles.button, styles.primaryButton]}
          onPress={handleStartNewSession}
          activeOpacity={0.7}
        >
          <Text style={styles.primaryButtonText}>Начать новую сессию</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={handleContinue}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>На главную</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: spacing.xl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  celebrationContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  confettiContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  confetti: {
    fontSize: 40,
  },
  congratsText: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  motivationalText: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  statsSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  statsGrid: {
    gap: spacing.md,
  },
  starsSection: {
    marginBottom: spacing.xl,
  },
  starsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  starsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    gap: spacing.sm,
  },
  starsIcon: {
    fontSize: 20,
  },
  starsCount: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  achievementsSection: {
    marginBottom: spacing.xl,
  },
  achievementsList: {
    gap: spacing.md,
  },
  achievementItem: {
    marginBottom: spacing.sm,
  },
  buttonsSection: {
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  button: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.white,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  secondaryButtonText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  loadingText: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});