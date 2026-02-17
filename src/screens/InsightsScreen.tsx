import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useInsights } from '../hooks/useInsights';
import { useTheme } from '../hooks/useTheme';
import InsightCard from '../components/InsightCard';
import EnergyChart from '../components/EnergyChart';
import { Insight } from '../models/Insight';

const { width } = Dimensions.get('window');

const InsightsScreen: React.FC = () => {
  const { theme } = useTheme();
  const {
    insights,
    isLoading,
    hasEnoughData,
    daysTracked,
    refreshInsights,
  } = useInsights();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshInsights();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshInsights();
    setRefreshing(false);
  };

  const renderNotEnoughData = () => (
    <View style={[styles.emptyContainer, { backgroundColor: theme.background }]}>
      <Text style={[styles.emptyTitle, { color: theme.text }]}>
        Продолжайте отслеживать настроение
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
        Для генерации умных подсказок нужно минимум 14 дней данных
      </Text>
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: theme.primary,
                width: `${(daysTracked / 14) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {daysTracked} из 14 дней
        </Text>
      </View>
    </View>
  );

  const groupInsightsByType = (insights: Insight[]) => {
    const grouped: { [key: string]: Insight[] } = {};
    insights.forEach((insight) => {
      if (!grouped[insight.type]) {
        grouped[insight.type] = [];
      }
      grouped[insight.type].push(insight);
    });
    return grouped;
  };

  const renderInsightSection = (type: string, insights: Insight[]) => {
    const sectionTitles: { [key: string]: string } = {
      peak_hours: 'Пиковые часы продуктивности',
      low_hours: 'Периоды низкой энергии',
      day_patterns: 'Паттерны по дням недели',
      task_recommendations: 'Рекомендации по задачам',
      break_suggestions: 'Оптимальное время для перерывов',
      energy_trends: 'Тренды энергии',
    };

    return (
      <View key={type} style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>
          {sectionTitles[type] || type}
        </Text>
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <Text style={[styles.loadingText, { color: theme.textSecondary }]}>
          Анализируем ваши данные...
        </Text>
      </View>
    );
  }

  if (!hasEnoughData) {
    return renderNotEnoughData();
  }

  const groupedInsights = groupInsightsByType(insights);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={theme.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>
          Умные подсказки
        </Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          На основе {daysTracked} дней отслеживания
        </Text>
      </View>

      <View style={styles.chartContainer}>
        <Text style={[styles.chartTitle, { color: theme.text }]}>
          Ваша энергия за неделю
        </Text>
        <EnergyChart />
      </View>

      {Object.keys(groupedInsights).length === 0 ? (
        <View style={styles.noInsightsContainer}>
          <Text style={[styles.noInsightsText, { color: theme.textSecondary }]}>
            Пока нет достаточно данных для генерации подсказок. Продолжайте отслеживать настроение!
          </Text>
        </View>
      ) : (
        Object.entries(groupedInsights).map(([type, insights]) =>
          renderInsightSection(type, insights)
        )
      )}

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.textSecondary }]}>
          Подсказки обновляются автоматически каждые 24 часа
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 300,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  chartContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  noInsightsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 32,
    alignItems: 'center',
  },
  noInsightsText: {
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

export default InsightsScreen;