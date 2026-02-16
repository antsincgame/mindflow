import React from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../hooks/useTheme';

const SCREEN_WIDTH = Dimensions.get('window').width;

export type ChartType = 'line' | 'bar';

export interface ChartDataPoint {
  value: number;
  label?: string;
}

export interface MiniChartProps {
  data: ChartDataPoint[];
  type?: ChartType;
  width?: number;
  height?: number;
  showLabels?: boolean;
  showValues?: boolean;
  color?: string;
  title?: string;
  suffix?: string;
  decimalPlaces?: number;
}

export const MiniChart: React.FC<MiniChartProps> = ({
  data,
  type = 'line',
  width = SCREEN_WIDTH - 64,
  height = 120,
  showLabels = true,
  showValues = false,
  color,
  title,
  suffix = '',
  decimalPlaces = 0,
}) => {
  const { theme, isDark } = useTheme();

  const chartData = {
    labels: showLabels ? data.map((item, index) => item.label || `${index + 1}`) : [],
    datasets: [
      {
        data: data.map(item => item.value),
        color: (opacity = 1) => color || theme.colors.primary,
        strokeWidth: 2,
      },
    ],
  };

  const chartConfig = {
    backgroundColor: isDark ? theme.colors.surface : theme.colors.background,
    backgroundGradientFrom: isDark ? theme.colors.surface : theme.colors.background,
    backgroundGradientTo: isDark ? theme.colors.surface : theme.colors.background,
    decimalPlaces: decimalPlaces,
    color: (opacity = 1) => color || theme.colors.primary,
    labelColor: (opacity = 1) => theme.colors.text,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: color || theme.colors.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      strokeWidth: 1,
    },
  };

  const renderChart = () => {
    if (data.length === 0) {
      return (
        <View style={[styles.emptyContainer, { height }]}>
          <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
            Нет данных
          </Text>
        </View>
      );
    }

    if (type === 'line') {
      return (
        <LineChart
          data={chartData}
          width={width}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withDots={data.length <= 7}
          withShadow={false}
          fromZero={true}
          yAxisSuffix={suffix}
          segments={3}
        />
      );
    }

    return (
      <BarChart
        data={chartData}
        width={width}
        height={height}
        chartConfig={chartConfig}
        style={styles.chart}
        withInnerLines={true}
        withVerticalLines={false}
        withHorizontalLines={true}
        yAxisSuffix={suffix}
        fromZero={true}
        showBarTops={showValues}
        showValuesOnTopOfBars={showValues}
        segments={3}
      />
    );
  };

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: theme.colors.text }]}>
          {title}
        </Text>
      )}
      <View style={[styles.chartContainer, { backgroundColor: isDark ? theme.colors.surface : theme.colors.background }]}>
        {renderChart()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  chartContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    paddingVertical: 8,
  },
  chart: {
    marginVertical: 0,
    borderRadius: 16,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});