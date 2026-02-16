import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import SessionButton from '../components/SessionButton';
import ProgressBar from '../components/ProgressBar';
import MotivationalMessage from '../components/MotivationalMessage';
import StatCard from '../components/StatCard';

import { useSession } from '../hooks/useSession';
import { useStatistics } from '../hooks/useStatistics';
import { useSettings } from '../hooks/useSettings';

import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

import { RootStackParamList } from '../navigation/types';

type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { startSession, isSessionActive } = useSession();
  const { stats, dailyProgress, loading: statsLoading } = useStatistics();
  const { settings } = useSettings();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      setCurrentTime(`${hours}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => clearInterval(interval);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      // Refresh stats when screen is focused
      return () => {};
    }, [])
  );

  const handleStartSession = async () => {
    try {
      await startSession();
      navigation.navigate('Session');
    } catch (error) {
      console.error('Failed to start session:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const progressPercentage = settings?.daily_goal
    ? (dailyProgress / settings.daily_goal) * 100
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}! 👋</Text>
          <Text style={styles.time}>{currentTime}</Text>
        </View>

        {/* Motivational Message */}
        <View style={styles.motivationContainer}>
          <MotivationalMessage />
        </View>

        {/* Main Session Button */}
        <View style={styles.buttonContainer}>
          <SessionButton
            onPress={handleStartSession}
            isActive={isSessionActive}
            disabled={isSessionActive}
          />
        </View>

        {/* Daily Progress Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Прогресс дня</Text>
            <Text style={styles.progressCounter}>
              {Math.round(dailyProgress)} / {settings?.daily_goal || 5} сессий
            </Text>
          </View>
          <ProgressBar
            progress={Math.min(progressPercentage, 100)}
            height={12}
            backgroundColor={colors.primary}
            containerStyle={styles.progressBar}
          />
          <Text style={styles.progressSubtext}>
            {progressPercentage >= 100
              ? '🎉 Вы достигли дневной цели!'
              : `Осталось ${Math.ceil(
                  (settings?.daily_goal || 5) - dailyProgress
                )} сессий`}
          </Text>
        </View>

        {/* Statistics Cards */}
        {statsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>Сегодня</Text>
            <View style={styles.statsGrid}>
              <StatCard
                title="Сессий"
                value={stats?.sessions_today || 0}
                subtitle="выполнено"
                icon="⏱️"
              />
              <StatCard
                title="Время"
                value={`${Math.round((stats?.focus_time_today || 0) / 60)}`}
                subtitle="минут"
                icon="🎯"
              />
              <StatCard
                title="Серия"
                value={stats?.current_streak || 0}
                subtitle="дней"
                icon="🔥"
              />
              <StatCard
                title="Звезды"
                value={stats?.stars || 0}
                subtitle="заработано"
                icon="⭐"
              />
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.quickStatsContainer}>
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Уровень</Text>
            <Text style={styles.quickStatValue}>{stats?.level || 1}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Лучшая серия</Text>
            <Text style={styles.quickStatValue}>{stats?.best_streak || 0}</Text>
          </View>
          <View style={styles.quickStatDivider} />
          <View style={styles.quickStatItem}>
            <Text style={styles.quickStatLabel}>Всего сессий</Text>
            <Text style={styles.quickStatValue}>{stats?.total_sessions || 0}</Text>
          </View>
        </View>

        {/* Navigation Hints */}
        <View style={styles.hintsContainer}>
          <Text style={styles.hintsTitle}>Советы</Text>
          <View style={styles.hintItem}>
            <Text style={styles.hintBullet}>📊</Text>
            <Text style={styles.hintText}>
              Проверьте статистику в разделе "Статистика"
            </Text>
          </View>
          <View style={styles.hintItem}>
            <Text style={styles.hintBullet}>🏆</Text>
            <Text style={styles.hintText}>
              Разблокируйте достижения в разделе "Достижения"
            </Text>
          </View>
          <View style={styles.hintItem}>
            <Text style={styles.hintBullet}>⚙️</Text>
            <Text style={styles.hintText}>
              Настройте параметры в разделе "Настройки"
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  time: {
    fontSize: typography.sizes.lg,
    color: colors.text.secondary,
    fontWeight: typography.weights.semibold,
  },
  motivationContainer: {
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  progressSection: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
  },
  progressCounter: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontWeight: typography.weights.medium,
  },
  progressBar: {
    marginBottom: spacing.md,
  },
  progressSubtext: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: spacing.lg,
  },
  statsTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickStatsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  quickStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  quickStatLabel: {
    fontSize: typography.sizes.xs,
    color: colors.text.secondary,
    marginBottom: spacing.xs,
    fontWeight: typography.weights.medium,
  },
  quickStatValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  quickStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  hintsContainer: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  hintsTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.text.primary,
    marginBottom: spacing.md,
  },
  hintItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  hintBullet: {
    fontSize: typography.sizes.lg,
    marginRight: spacing.md,
    marginTop: 2,
  },
  hintText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    lineHeight: 20,
  },
});

export default HomeScreen;