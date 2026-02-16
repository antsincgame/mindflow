import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useStatistics } from '../hooks/useStatistics';
import { useAchievements } from '../hooks/useAchievements';
import StatCard from '../components/StatCard';
import AchievementBadge from '../components/AchievementBadge';
import { theme } from '../theme';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';

type PeriodType = 'day' | 'week' | 'month';

interface DailyStats {
  date: string;
  sessions: number;
  focusTime: number;
}

const StatisticsScreen: React.FC = () => {
  const [period, setPeriod] = useState<PeriodType>('week');
  const [chartData, setChartData] = useState<DailyStats[]>([]);
  const { statistics, getStatisticsByPeriod, getDailyStats } = useStatistics();
  const { achievements, unlockedCount } = useAchievements();

  useEffect(() => {
    loadChartData();
  }, [period]);

  const loadChartData = async () => {
    try {
      let days = 7;
      if (period === 'day') days = 1;
      if (period === 'month') days = 30;

      const data: DailyStats[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const date = subDays(new Date(), i);
        const dayStart = startOfDay(date);
        const dayEnd = endOfDay(date);
        const dailyData = await getDailyStats(dayStart, dayEnd);

        data.push({
          date: format(date, 'd MMM', { locale: ru }),
          sessions: dailyData.sessions || 0,
          focusTime: Math.round((dailyData.focusTime || 0) / 60),
        });
      }
      setChartData(data);
    } catch (error) {
      console.error('Failed to load chart data:', error);
    }
  };

  const periodStats = getStatisticsByPeriod(period);

  const chartWidth = Dimensions.get('window').width - 32;

  const sessionsChartData = {
    labels: chartData.slice(-7).map((d) => d.date),
    datasets: [
      {
        data: chartData.slice(-7).map((d) => d.sessions),
        color: () => theme.colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  const focusTimeChartData = {
    labels: chartData.slice(-7).map((d) => d.date),
    datasets: [
      {
        data: chartData.slice(-7).map((d) => d.focusTime),
        color: () => theme.colors.success,
        strokeWidth: 2,
      },
    ],
  };

  const unlockedAchievements = achievements.filter((a) => a.unlocked);

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Статистика</Text>
      </View>

      <View style={styles.periodSelector}>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'day' && styles.periodButtonActive,
          ]}
          onPress={() => setPeriod('day')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'day' && styles.periodButtonTextActive,
            ]}
          >
            День
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'week' && styles.periodButtonActive,
          ]}
          onPress={() => setPeriod('week')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'week' && styles.periodButtonTextActive,
            ]}
          >
            Неделя
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.periodButton,
            period === 'month' && styles.periodButtonActive,
          ]}
          onPress={() => setPeriod('month')}
        >
          <Text
            style={[
              styles.periodButtonText,
              period === 'month' && styles.periodButtonTextActive,
            ]}
          >
            Месяц
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        <StatCard
          title="Сессии"
          value={periodStats.sessions.toString()}
          icon="🎯"
          color={theme.colors.primary}
        />
        <StatCard
          title="Время фокуса"
          value={`${Math.round(periodStats.focusTime / 60)}ч`}
          icon="⏱️"
          color={theme.colors.success}
        />
        <StatCard
          title="Перерывы"
          value={periodStats.breaks.toString()}
          icon="☕"
          color={theme.colors.warning}
        />
        <StatCard
          title="Серия дней"
          value={statistics?.currentStreak?.toString() || '0'}
          icon="🔥"
          color={theme.colors.danger}
        />
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Количество сессий</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={sessionsChartData}
            width={chartWidth}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.background,
              backgroundGradientFrom: theme.colors.background,
              backgroundGradientTo: theme.colors.background,
              color: () => theme.colors.primary,
              labelColor: () => theme.colors.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: theme.colors.primary,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Время фокуса (часы)</Text>
        <View style={styles.chartContainer}>
          <LineChart
            data={focusTimeChartData}
            width={chartWidth}
            height={220}
            chartConfig={{
              backgroundColor: theme.colors.background,
              backgroundGradientFrom: theme.colors.background,
              backgroundGradientTo: theme.colors.background,
              color: () => theme.colors.success,
              labelColor: () => theme.colors.text,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: '5',
                strokeWidth: '2',
                stroke: theme.colors.success,
              },
            }}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Награды</Text>
          <Text style={styles.badgeCount}>
            {unlockedCount} из {achievements.length}
          </Text>
        </View>

        <View style={styles.achievementsGrid}>
          {achievements.map((achievement) => (
            <AchievementBadge
              key={achievement.id}
              achievement={achievement}
              unlocked={achievement.unlocked}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уровень и звезды</Text>
        <View style={styles.levelCard}>
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Уровень</Text>
            <Text style={styles.levelValue}>{statistics?.level || 1}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.levelInfo}>
            <Text style={styles.levelLabel}>Звезды</Text>
            <Text style={styles.starValue}>⭐ {statistics?.stars || 0}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressLabel}>Прогресс к следующему уровню</Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${((statistics?.stars || 0) % 10) * 10}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            {(statistics?.stars || 0) % 10} из 10 звезд
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Лучшие показатели</Text>
        <View style={styles.recordsContainer}>
          <View style={styles.recordItem}>
            <Text style={styles.recordLabel}>Лучшая серия</Text>
            <Text style={styles.recordValue}>
              {statistics?.bestStreak || 0} дней
            </Text>
          </View>
          <View style={styles.recordItem}>
            <Text style={styles.recordLabel}>Всего сессий</Text>
            <Text style={styles.recordValue}>
              {statistics?.totalSessions || 0}
            </Text>
          </View>
          <View style={styles.recordItem}>
            <Text style={styles.recordLabel}>Всего часов</Text>
            <Text style={styles.recordValue}>
              {Math.round((statistics?.totalFocusTime || 0) / 3600)}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  periodSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  periodButtonTextActive: {
    color: '#FFFFFF',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  chartSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
    fontFamily: theme.typography.fontFamily,
  },
  chartContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
  },
  chart: {
    borderRadius: 16,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    fontFamily: theme.typography.fontFamily,
  },
  badgeCount: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  levelCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  levelInfo: {
    flex: 1,
    alignItems: 'center',
  },
  levelLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    marginBottom: 8,
    fontFamily: theme.typography.fontFamily,
  },
  levelValue: {
    fontSize: 32,
    fontWeight: '700',
    color: theme.colors.primary,
    fontFamily: theme.typography.fontFamily,
  },
  starValue: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.warning,
    fontFamily: theme.typography.fontFamily,
  },
  divider: {
    width: 1,
    backgroundColor: theme.colors.border,
    marginHorizontal: 16,
  },
  progressContainer: {
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
    marginBottom: 12,
    fontFamily: theme.typography.fontFamily,
  },
  progressBar: {
    height: 8,
    backgroundColor: theme.colors.border,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: theme.colors.textSecondary,
    fontFamily: theme.typography.fontFamily,
  },
  recordsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  recordItem: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  recordLabel: