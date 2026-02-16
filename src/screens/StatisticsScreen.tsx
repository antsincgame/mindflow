import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths } from 'date-fns';
import { useStatistics } from '../hooks/useStatistics';
import { useTheme } from '../hooks/useTheme';
import HeatmapCalendar from '../components/HeatmapCalendar';
import ProgressChart from '../components/ProgressChart';
import BiometricIndicator from '../components/BiometricIndicator';

const { width } = Dimensions.get('window');

type TimeRange = 'week' | 'month' | 'year';
type ChartType = 'sessions' | 'duration' | 'emotions' | 'stress';

const StatisticsScreen: React.FC = () => {
  const { theme } = useTheme();
  const [selectedRange, setSelectedRange] = useState<TimeRange>('month');
  const [selectedChart, setSelectedChart] = useState<ChartType>('sessions');
  const { statistics, loading, error, refreshStatistics } = useStatistics(selectedRange);

  const timeRanges: { label: string; value: TimeRange }[] = [
    { label: 'Неделя', value: 'week' },
    { label: 'Месяц', value: 'month' },
    { label: 'Год', value: 'year' },
  ];

  const chartTypes: { label: string; value: ChartType; icon: string }[] = [
    { label: 'Сессии', value: 'sessions', icon: '📊' },
    { label: 'Время', value: 'duration', icon: '⏱️' },
    { label: 'Эмоции', value: 'emotions', icon: '😊' },
    { label: 'Стресс', value: 'stress', icon: '💓' },
  ];

  const heatmapData = useMemo(() => {
    if (!statistics?.heatmapData) return [];
    return statistics.heatmapData;
  }, [statistics]);

  const chartData = useMemo(() => {
    if (!statistics) return null;

    switch (selectedChart) {
      case 'sessions':
        return {
          labels: statistics.chartData.labels,
          datasets: [
            {
              data: statistics.chartData.sessions,
              color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        };
      case 'duration':
        return {
          labels: statistics.chartData.labels,
          datasets: [
            {
              data: statistics.chartData.duration.map((d) => d / 60),
              color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        };
      case 'emotions':
        return {
          labels: statistics.emotionDistribution.map((e) => e.emoji),
          datasets: [
            {
              data: statistics.emotionDistribution.map((e) => e.percentage),
            },
          ],
        };
      case 'stress':
        return {
          labels: statistics.chartData.labels,
          datasets: [
            {
              data: statistics.chartData.stressLevel,
              color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
              strokeWidth: 2,
            },
          ],
        };
      default:
        return null;
    }
  }, [statistics, selectedChart]);

  const renderStatCard = (
    title: string,
    value: string | number,
    subtitle: string,
    icon: string,
    color: string
  ) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.statCardHeader}>
        <Text style={styles.statIcon}>{icon}</Text>
        <View style={styles.statCardContent}>
          <Text style={[styles.statTitle, { color: theme.colors.textSecondary }]}>
            {title}
          </Text>
          <Text style={[styles.statValue, { color: theme.colors.text }]}>{value}</Text>
          <Text style={[styles.statSubtitle, { color }]}>{subtitle}</Text>
        </View>
      </View>
    </View>
  );

  const renderTimeRangeSelector = () => (
    <View style={styles.timeRangeContainer}>
      {timeRanges.map((range) => (
        <TouchableOpacity
          key={range.value}
          style={[
            styles.timeRangeButton,
            selectedRange === range.value && {
              backgroundColor: theme.colors.primary,
            },
          ]}
          onPress={() => setSelectedRange(range.value)}
        >
          <Text
            style={[
              styles.timeRangeText,
              {
                color:
                  selectedRange === range.value
                    ? '#FFFFFF'
                    : theme.colors.textSecondary,
              },
            ]}
          >
            {range.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderChartTypeSelector = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.chartTypeContainer}
      contentContainerStyle={styles.chartTypeContent}
    >
      {chartTypes.map((chart) => (
        <TouchableOpacity
          key={chart.value}
          style={[
            styles.chartTypeButton,
            {
              backgroundColor:
                selectedChart === chart.value
                  ? theme.colors.primary
                  : theme.colors.surface,
            },
          ]}
          onPress={() => setSelectedChart(chart.value)}
        >
          <Text style={styles.chartTypeIcon}>{chart.icon}</Text>
          <Text
            style={[
              styles.chartTypeText,
              {
                color:
                  selectedChart === chart.value
                    ? '#FFFFFF'
                    : theme.colors.text,
              },
            ]}
          >
            {chart.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderEmotionDistribution = () => {
    if (!statistics?.emotionDistribution.length) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Распределение эмоций
        </Text>
        <View style={styles.emotionGrid}>
          {statistics.emotionDistribution.map((emotion, index) => (
            <View key={index} style={styles.emotionItem}>
              <Text style={styles.emotionEmoji}>{emotion.emoji}</Text>
              <Text style={[styles.emotionName, { color: theme.colors.text }]}>
                {emotion.name}
              </Text>
              <Text style={[styles.emotionPercentage, { color: theme.colors.primary }]}>
                {emotion.percentage}%
              </Text>
              <Text style={[styles.emotionCount, { color: theme.colors.textSecondary }]}>
                {emotion.count} сессий
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderStreakInfo = () => {
    if (!statistics) return null;

    return (
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Серии практик
        </Text>
        <View style={styles.streakContainer}>
          <View style={styles.streakItem}>
            <Text style={styles.streakIcon}>🔥</Text>
            <Text style={[styles.streakValue, { color: theme.colors.text }]}>
              {statistics.currentStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
              Текущая серия
            </Text>
          </View>
          <View style={styles.streakDivider} />
          <View style={styles.streakItem}>
            <Text style={styles.streakIcon}>🏆</Text>
            <Text style={[styles.streakValue, { color: theme.colors.text }]}>
              {statistics.longestStreak}
            </Text>
            <Text style={[styles.streakLabel, { color: theme.colors.textSecondary }]}>
              Лучшая серия
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBiometrics = () => {
    if (!statistics?.averageBiometrics) return null;

    const { heartRate, hrv, restingHeartRate } = statistics.averageBiometrics;

    return (
      <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Средние показатели
        </Text>
        <View style={styles.biometricsContainer}>
          <BiometricIndicator
            label="Пульс"
            value={heartRate}
            unit="bpm"
            icon="💓"
            color="#EF4444"
          />
          <BiometricIndicator
            label="HRV"
            value={hrv}
            unit="ms"
            icon="📊"
            color="#8B5CF6"
          />
          <BiometricIndicator
            label="Покой"
            value={restingHeartRate}
            unit="bpm"
            icon="😌"
            color="#22C55E"
          />
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Загрузка статистики...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={[styles.errorText, { color: theme.colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={refreshStatistics}
          >
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!statistics) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={[styles.emptyText, { color: theme.colors.text }]}>
            Нет данных для отображения
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.colors.textSecondary }]}>
            Начните выполнять упражнения, чтобы увидеть статистику
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={[theme.colors.primary + '20', theme.colors.background]}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.colors.text }]}>Статистика</Text>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Ваш прогресс за {selectedRange === 'week' ? 'неделю' : selectedRange === 'month' ? 'месяц' : 'год'}
            </Text>
          </View>

          {renderTimeRangeSelector()}

          <View style={styles.statsGrid}>
            {renderStatCard(
              'Всего сессий',
              statistics.totalSessions,
              `+${statistics.sessionsChange}% к прошлому периоду`,
              '🎯',
              statistics.sessionsChange >= 0 ? '#22C55E' : '#EF4444'
            )}
            {renderStatCard(
              'Общее время',
              `${Math.floor(statistics.totalDuration / 60)} мин`,
              `${statistics.totalDuration % 60} секунд`,
              '⏱️',
              theme.colors.primary
            )}
            {renderStatCard(
              'Средний стресс',
              statistics.averageStressLevel.toFixed(1),
              `${statistics.stressReduction}% снижение`,
              '💓',
              statistics.stressReduction >= 0 ? '#22C55E' : '#EF4444'
            )}
            {renderStatCard(
              'Уровень практики',
              statistics.practiceLevel,
              `${statistics.completionRate}% завершено`,
              '⭐',
              '#F59E0B'
            )}
          </View>

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Тепловая карта активности
            </Text>
            <HeatmapCalendar data={heatmapData} />
          </View>

          {renderStreakInfo()}

          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Графики прогресса
            </Text>
            {renderChartTypeSelector()}
            {chartData && (
              <View style={styles.chartContainer}>
                <ProgressChart
                  data={chartData}
                  type={selectedChart === 'emotions' ? 'pie' : 'line'}
                  height={220}
                />
              </View>
            )}
          </View>

          {renderEmotionDistribution()}

          {renderBiometrics()}

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  title: {