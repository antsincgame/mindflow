import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

export type ChartType = 'line' | 'bar' | 'pie';
export type ChartPeriod = 'day' | 'week' | 'month';

interface DataPoint {
  label: string;
  value: number;
}

interface ChartProps {
  type: ChartType;
  period: ChartPeriod;
  data: DataPoint[];
  title?: string;
  unit?: string;
  color?: string;
  showLegend?: boolean;
  height?: number;
  yAxisLabel?: string;
  yAxisSuffix?: string;
}

const screenWidth = Dimensions.get('window').width;

export const Chart: React.FC<ChartProps> = ({
  type,
  period,
  data,
  title,
  unit = 'мин',
  color = colors.primary,
  showLegend = true,
  height = 250,
  yAxisLabel = '',
  yAxisSuffix = '',
}) => {
  const chartWidth = screenWidth - spacing.lg * 2;

  const chartData = useMemo(() => {
    if (type === 'pie') {
      return {
        labels: data.map(d => d.label),
        datasets: [
          {
            data: data.map(d => d.value),
          },
        ],
      };
    }

    return {
      labels: data.map(d => d.label),
      datasets: [
        {
          data: data.map(d => d.value),
          color: () => color,
          strokeWidth: 2,
        },
      ],
    };
  }, [data, type, color]);

  const chartConfig = {
    backgroundColor: colors.background,
    backgroundGradientFrom: colors.background,
    backgroundGradientTo: colors.background,
    color: () => color,
    strokeWidth: 2,
    barPercentage: 0.7,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: typography.sizes.xs,
      fill: colors.textSecondary,
    },
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: color,
    },
    propsForBackgroundLines: {
      strokeDasharray: '0',
      stroke: colors.border,
      strokeWidth: 0.5,
    },
  };

  const pieChartColors = [
    colors.primary,
    colors.secondary,
    colors.success,
    colors.warning,
    colors.error,
    colors.info,
  ];

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart
            data={chartData}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            withInnerLines={true}
            withOuterLines={true}
            yAxisLabel={yAxisLabel}
            yAxisSuffix={yAxisSuffix}
            fromZero={true}
          />
        );

      case 'bar':
        return (
          <BarChart
            data={chartData}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            style={styles.chart}
            withVerticalLabels={true}
            withHorizontalLabels={true}
            yAxisLabel={yAxisLabel}
            yAxisSuffix={yAxisSuffix}
            fromZero={true}
          />
        );

      case 'pie':
        return (
          <PieChart
            data={chartData.labels.map((label, index) => ({
              name: label,
              value: chartData.datasets[0].data[index],
              color: pieChartColors[index % pieChartColors.length],
              legendFontColor: colors.text,
              legendFontSize: typography.sizes.sm,
            }))}
            width={chartWidth}
            height={height}
            chartConfig={chartConfig}
            accessor="value"
            backgroundColor="transparent"
            paddingLeft={spacing.md}
            style={styles.chart}
            center={[chartWidth / 4, 0]}
          />
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {title && <View style={styles.titleContainer} />}
      <View style={styles.chartContainer}>{renderChart()}</View>
      {showLegend && type !== 'pie' && (
        <View style={styles.legendContainer}>
          <View style={[styles.legendItem, { borderLeftColor: color }]}>
            <View style={styles.legendDot} />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.md,
    marginVertical: spacing.sm,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  titleContainer: {
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.sm,
  },
  chart: {
    borderRadius: 8,
    marginLeft: -spacing.md,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 3,
    paddingLeft: spacing.sm,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.xs,
    backgroundColor: colors.primary,
  },
});