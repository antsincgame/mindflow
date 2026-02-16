import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import { useHealthData } from '../hooks/useHealthData';
import { useStressLevel } from '../hooks/useStressLevel';
import { useTheme } from '../hooks/useTheme';
import { formatHeartRate, formatStressLevel, formatSleepQuality } from '../utils/formatters';

interface MiniTrendData {
  values: number[];
  color: string;
}

interface BiometricItemProps {
  icon: string;
  label: string;
  value: string;
  unit: string;
  trend: MiniTrendData;
  valueColor: string;
  backgroundColor: string;
}

const TREND_WIDTH = 48;
const TREND_HEIGHT = 20;

const MiniTrendLine: React.FC<{ data: MiniTrendData }> = ({ data }) => {
  const { values, color } = data;

  const points = useMemo(() => {
    if (!values || values.length < 2) return '';

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    const stepX = TREND_WIDTH / (values.length - 1);

    return values
      .map((val, i) => {
        const x = i * stepX;
        const y = TREND_HEIGHT - ((val - min) / range) * (TREND_HEIGHT - 4) - 2;
        return `${x},${y}`;
      })
      .join(' ');
  }, [values]);

  if (!values || values.length < 2) {
    return <View style={{ width: TREND_WIDTH, height: TREND_HEIGHT }} />;
  }

  return (
    <Svg width={TREND_WIDTH} height={TREND_HEIGHT}>
      <Polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
};

const BiometricItem: React.FC<BiometricItemProps> = ({
  icon,
  label,
  value,
  unit,
  trend,
  valueColor,
  backgroundColor,
}) => {
  return (
    <View style={[styles.itemContainer, { backgroundColor }]}>
      <View style={styles.itemHeader}>
        <Text style={styles.itemIcon}>{icon}</Text>
        <MiniTrendLine data={trend} />
      </View>
      <Text style={[styles.itemValue, { color: valueColor }]}>{value}</Text>
      <Text style={styles.itemUnit}>{unit}</Text>
      <Text style={styles.itemLabel}>{label}</Text>
    </View>
  );
};

interface BiometricWidgetProps {
  style?: ViewStyle;
}

const BiometricWidget: React.FC<BiometricWidgetProps> = ({ style }) => {
  const { theme } = useTheme();
  const {
    heartRate,
    heartRateHistory,
    sleepData,
    sleepHistory,
  } = useHealthData();
  const { stressLevel, stressHistory } = useStressLevel();

  const heartRateTrend: MiniTrendData = useMemo(
    () => ({
      values: heartRateHistory?.length ? heartRateHistory.slice(-7) : [72, 75, 71, 78, 74, 73, 76],
      color: '#FF6B6B',
    }),
    [heartRateHistory]
  );

  const stressTrend: MiniTrendData = useMemo(
    () => ({
      values: stressHistory?.length ? stressHistory.slice(-7) : [45, 52, 48, 55, 42, 38, 40],
      color: '#FFB347',
    }),
    [stressHistory]
  );

  const sleepTrend: MiniTrendData = useMemo(
    () => ({
      values: sleepHistory?.length ? sleepHistory.slice(-7) : [7.2, 6.8, 7.5, 6.5, 7.8, 7.0, 7.3],
      color: '#7C83ED',
    }),
    [sleepHistory]
  );

  const currentHeartRate = heartRate ?? 74;
  const currentStress = stressLevel ?? 42;
  const currentSleepQuality = sleepData?.quality ?? 78;

  const getStressColor = (level: number): string => {
    if (level <= 30) return '#4CAF50';
    if (level <= 60) return '#FFB347';
    return '#FF6B6B';
  };

  const getSleepColor = (quality: number): string => {
    if (quality >= 75) return '#4CAF50';
    if (quality >= 50) return '#FFB347';
    return '#FF6B6B';
  };

  const isDark = theme === 'dark';

  const cardBg1 = isDark ? '#1E2A3A' : '#FFF0F0';
  const cardBg2 = isDark ? '#2A2520' : '#FFF8EE';
  const cardBg3 = isDark ? '#1E1E3A' : '#F0F0FF';

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, isDark && styles.titleDark]}>Биометрика</Text>
      <View style={styles.itemsRow}>
        <BiometricItem
          icon="❤️"
          label="Пульс"
          value={formatHeartRate ? formatHeartRate(currentHeartRate) : String(currentHeartRate)}
          unit="уд/мин"
          trend={heartRateTrend}
          valueColor="#FF6B6B"
          backgroundColor={cardBg1}
        />
        <BiometricItem
          icon="⚡"
          label="Стресс"
          value={formatStressLevel ? formatStressLevel(currentStress) : `${currentStress}%`}
          unit=""
          trend={stressTrend}
          valueColor={getStressColor(currentStress)}
          backgroundColor={cardBg2}
        />
        <BiometricItem
          icon="🌙"
          label="Сон"
          value={formatSleepQuality ? formatSleepQuality(currentSleepQuality) : `${currentSleepQuality}%`}
          unit=""
          trend={sleepTrend}
          valueColor={getSleepColor(currentSleepQuality)}
          backgroundColor={cardBg3}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  } as ViewStyle,
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1A2E',
    marginBottom: 12,
  } as TextStyle,
  titleDark: {
    color: '#E8E8F0',
  } as TextStyle,
  itemsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  } as ViewStyle,
  itemContainer: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    minHeight: 110,
  } as ViewStyle,
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  } as ViewStyle,
  itemIcon: {
    fontSize: 20,
  } as TextStyle,
  itemValue: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  } as TextStyle,
  itemUnit: {
    fontSize: 11,
    color: '#8E8E9E',
    marginBottom: 4,
  } as TextStyle,
  itemLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6E6E7E',
  } as TextStyle,
});

export default BiometricWidget;