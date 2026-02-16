import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import { format, subDays, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { ru } from 'date-fns/locale';

const SCREEN_WIDTH = Dimensions.get('window').width;

export type ChartType = 'line' | 'bar' | 'pie';
export type ChartPeriod = 'week' | 'month' | 'year';

interface SessionData {
  date: Date;
  duration: number;
  emotion: string;
  exerciseType: string;
}

interface ProgressChartProps {
  type: ChartType;
  period: ChartPeriod;
  sessions: SessionData[];
  title?: string;
  showLegend?: boolean;
  height?: number;
}

interface ChartDataset {
  data: number[];
  color?: (opacity: number) => string;
  strokeWidth?: number;
}

interface LineChartData {
  labels: string[];
  datasets: ChartDataset[];
  legend?: string[];
}

interface BarChartData {
  labels: string[];
  datasets: ChartDataset[];
  legend?: string[];
}

interface PieChartDataItem {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}

const ProgressChart: React.FC<ProgressChartProps> = ({
  type,
  period,
  sessions,
  title,
  showLegend = true,
  height = 220,
}) => {
  const chartConfig = {
    backgroundGradientFrom: '#ffffff',
    backgroundGradientTo: '#ffffff',
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: '#6366f1',
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: '#e5e7eb',
      strokeWidth: 1,
    },
  };

  const emotionColors: Record<string, string> = {
    anxiety: '#ef4444',
    stress: '#f59e0b',
    sadness: '#3b82f6',
    anger: '#dc2626',
    fear: '#8b5cf6',
    joy: '#10b981',
    calm: '#06b6d4',
    neutral: '#6b7280',
  };

  const getDateRange = (): Date[] => {
    const now = new Date();
    
    switch (period) {
      case 'week':
        return eachDayOfInterval({
          start: startOfWeek(now, { weekStartsOn: 1 }),
          end: endOfWeek(now, { weekStartsOn: 1 }),
        });
      case 'month':
        return Array.from({ length: 30 }, (_, i) => subDays(now, 29 - i));
      case 'year':
        return Array.from({ length: 12 }, (_, i) => {
          const date = new Date(now);
          date.setMonth(now.getMonth() - 11 + i);
          return date;
        });
      default:
        return [];
    }
  };

  const formatLabel = (date: Date): string => {
    switch (period) {
      case 'week':
        return format(date, 'EEE', { locale: ru });
      case 'month':
        return format(date, 'd');
      case 'year':
        return format(date, 'MMM', { locale: ru });
      default:
        return '';
    }
  };

  const lineChartData = useMemo((): LineChartData => {
    const dateRange = getDateRange();
    const labels = dateRange.map(formatLabel);
    
    const dataByDate = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySessions = sessions.filter(
        s => format(s.date, 'yyyy-MM-dd') === dateStr
      );
      return daySessions.reduce((sum, s) => sum + s.duration, 0);
    });

    return {
      labels,
      datasets: [
        {
          data: dataByDate.length > 0 ? dataByDate : [0],
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 2,
        },
      ],
      legend: showLegend ? ['Минуты практики'] : undefined,
    };
  }, [sessions, period, showLegend]);

  const barChartData = useMemo((): BarChartData => {
    const dateRange = getDateRange();
    const labels = dateRange.map(formatLabel);
    
    const dataByDate = dateRange.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const daySessions = sessions.filter(
        s => format(s.date, 'yyyy-MM-dd') === dateStr
      );
      return daySessions.length;
    });

    return {
      labels,
      datasets: [
        {
          data: dataByDate.length > 0 ? dataByDate : [0],
        },
      ],
      legend: showLegend ? ['Количество сессий'] : undefined,
    };
  }, [sessions, period, showLegend]);

  const pieChartData = useMemo((): PieChartDataItem[] => {
    const emotionCounts: Record<string, number> = {};
    
    sessions.forEach(session => {
      emotionCounts[session.emotion] = (emotionCounts[session.emotion] || 0) + 1;
    });

    const total = sessions.length || 1;
    
    return Object.entries(emotionCounts).map(([emotion, count]) => ({
      name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      population: count,
      color: emotionColors[emotion] || '#6b7280',
      legendFontColor: '#374151',
      legendFontSize: 12,
    }));
  }, [sessions]);

  const renderChart = () => {
    if (sessions.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Нет данных для отображения</Text>
          <Text style={styles.emptySubtext}>
            Начните выполнять упражнения, чтобы увидеть прогресс
          </Text>
        </View>
      );
    }

    switch (type) {
      case 'line':
        return (
          <LineChart
            data={lineChartData}
            width={SCREEN_WIDTH - 32}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={true}
            withVerticalLines={false}
            withHorizontalLines={true}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            fromZero={true}
          />
        );

      case 'bar':
        return (
          <BarChart
            data={barChartData}
            width={SCREEN_WIDTH - 32}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            withInnerLines={true}
            showBarTops={false}
            fromZero={true}
            yAxisLabel=""
            yAxisSuffix=""
          />
        );

      case 'pie':
        return pieChartData.length > 0 ? (
          <PieChart
            data={pieChartData}
            width={SCREEN_WIDTH - 32}
            height={height}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute={false}
            style={styles.chart}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Нет данных для отображения</Text>
          </View>
        );

      default:
        return null;
    }
  };

  const getTotalStats = () => {
    const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
    const totalSessions = sessions.length;
    const avgDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0;

    return { totalDuration, totalSessions, avgDuration };
  };

  const stats = getTotalStats();

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartContainer}
      >
        {renderChart()}
      </ScrollView>

      {sessions.length > 0 && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalSessions}</Text>
            <Text style={styles.statLabel}>Сессий</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.totalDuration}</Text>
            <Text style={styles.statLabel}>Минут</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{stats.avgDuration}</Text>
            <Text style={styles.statLabel}>Средняя</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    paddingVertical: 8,
  },
  chart: {
    borderRadius: 16,
    marginVertical: 8,
  },
  emptyContainer: {
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6366f1',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e5e7eb',
  },
});

export default ProgressChart;