import React, { useMemo } from 'react';
import { View, StyleSheet, Dimensions, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../hooks/useTheme';

interface EnergyDataPoint {
  timestamp: number;
  energy: number;
}

interface EnergyChartProps {
  data: EnergyDataPoint[];
  height?: number;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

export const EnergyChart: React.FC<EnergyChartProps> = ({ 
  data, 
  height = 220 
}) => {
  const { theme, isDark } = useTheme();

  const chartData = useMemo(() => {
    const now = Date.now();
    const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
    
    const weekData = data.filter(d => d.timestamp >= weekAgo);
    
    const dayLabels: string[] = [];
    const dayAverages: number[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const dayStart = now - i * 24 * 60 * 60 * 1000;
      const dayEnd = dayStart + 24 * 60 * 60 * 1000;
      
      const dayPoints = weekData.filter(
        d => d.timestamp >= dayStart && d.timestamp < dayEnd
      );
      
      const date = new Date(dayStart);
      const dayName = date.toLocaleDateString('ru-RU', { weekday: 'short' });
      dayLabels.push(dayName.charAt(0).toUpperCase() + dayName.slice(1, 2));
      
      if (dayPoints.length > 0) {
        const avg = dayPoints.reduce((sum, p) => sum + p.energy, 0) / dayPoints.length;
        dayAverages.push(Math.round(avg));
      } else {
        dayAverages.push(0);
      }
    }
    
    return {
      labels: dayLabels,
      datasets: [
        {
          data: dayAverages.length > 0 ? dayAverages : [0],
          color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
          strokeWidth: 3,
        },
      ],
    };
  }, [data]);

  const chartConfig = {
    backgroundColor: theme.surface,
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => isDark 
      ? `rgba(129, 140, 248, ${opacity})` 
      : `rgba(99, 102, 241, ${opacity})`,
    labelColor: (opacity = 1) => isDark
      ? `rgba(209, 213, 219, ${opacity})`
      : `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.primary,
    },
    propsForBackgroundLines: {
      strokeDasharray: '',
      stroke: isDark ? 'rgba(75, 85, 99, 0.3)' : 'rgba(229, 231, 235, 0.8)',
      strokeWidth: 1,
    },
  };

  const hasData = data.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <Text style={[styles.title, { color: theme.text }]}>
        Энергия за неделю
      </Text>
      
      {hasData ? (
        <LineChart
          data={chartData}
          width={SCREEN_WIDTH - 32}
          height={height}
          chartConfig={chartConfig}
          bezier
          style={styles.chart}
          withInnerLines={true}
          withOuterLines={false}
          withVerticalLines={false}
          withHorizontalLines={true}
          withVerticalLabels={true}
          withHorizontalLabels={true}
          fromZero={true}
          segments={4}
          yAxisSuffix=""
          yAxisInterval={1}
          getDotColor={(dataPoint, dataPointIndex) => {
            if (dataPoint >= 70) return '#10B981';
            if (dataPoint >= 40) return '#F59E0B';
            return '#EF4444';
          }}
        />
      ) : (
        <View style={[styles.emptyState, { height }]}>
          <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
            Начните отмечать настроение,{'\n'}чтобы увидеть график
          </Text>
        </View>
      )}
      
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Высокая (70-100)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Средняя (40-69)
          </Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#EF4444' }]} />
          <Text style={[styles.legendText, { color: theme.textSecondary }]}>
            Низкая (0-39)
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  emptyState: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(107, 114, 128, 0.2)',
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(107, 114, 128, 0.2)',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
  },
});