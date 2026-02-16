import React, { useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import Svg, { Line, Text as SvgText } from 'react-native-svg';

export interface WeeklyDataPoint {
  day: string;
  value: number;
  date: Date;
}

interface WeeklyChartProps {
  data: WeeklyDataPoint[];
  title?: string;
  unit?: string;
  maxValue?: number;
  barColor?: string;
  todayBarColor?: string;
  averageLineColor?: string;
  showAverage?: boolean;
  animationDuration?: number;
  height?: number;
}

const DAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const AnimatedBar: React.FC<{
  index: number;
  value: number;
  maxValue: number;
  maxBarHeight: number;
  barWidth: number;
  isToday: boolean;
  barColor: string;
  todayBarColor: string;
  animationDuration: number;
  label: string;
}> = ({
  index,
  value,
  maxValue,
  maxBarHeight,
  barWidth,
  isToday,
  barColor,
  todayBarColor,
  animationDuration,
  label,
}) => {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    progress.value = withDelay(
      index * 80,
      withTiming(1, {
        duration: animationDuration,
        easing: Easing.out(Easing.cubic),
      })
    );
  }, [value, index, animationDuration]);

  const targetHeight = maxValue > 0 ? (value / maxValue) * maxBarHeight : 0;

  const animatedBarStyle = useAnimatedStyle(() => {
    const height = interpolate(progress.value, [0, 1], [0, targetHeight]);
    return {
      height,
    };
  });

  const animatedOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0, 0.5, 1]),
  }));

  const color = isToday ? todayBarColor : barColor;

  return (
    <View style={styles.barContainer}>
      <Animated.Text style={[styles.barValueText, animatedOpacity]}>
        {value > 0 ? Math.round(value) : ''}
      </Animated.Text>
      <View style={[styles.barTrack, { height: maxBarHeight }]}>
        <Animated.View
          style={[
            styles.bar,
            {
              width: barWidth,
              backgroundColor: color,
              borderRadius: barWidth / 4,
            },
            animatedBarStyle,
          ]}
        />
      </View>
      <Text
        style={[
          styles.dayLabel,
          isToday && styles.todayLabel,
        ]}
      >
        {label}
      </Text>
      {isToday && <View style={[styles.todayDot, { backgroundColor: todayBarColor }]} />}
    </View>
  );
};

const WeeklyChart: React.FC<WeeklyChartProps> = ({
  data,
  title,
  unit = '',
  maxValue: maxValueProp,
  barColor = '#A8D8EA',
  todayBarColor = '#5B9BD5',
  averageLineColor = '#FF8C69',
  showAverage = true,
  animationDuration = 600,
  height = 200,
}) => {
  const screenWidth = Dimensions.get('window').width;

  const chartData = useMemo(() => {
    const result: WeeklyDataPoint[] = [];
    const today = new Date();
    const todayDayOfWeek = today.getDay();

    for (let i = 0; i < 7; i++) {
      const existing = data.find((d) => {
        const dayName = DAY_LABELS[i];
        return d.day === dayName || d.day === DAY_LABELS[i];
      });

      if (existing) {
        result.push(existing);
      } else if (i < data.length) {
        result.push(data[i]);
      } else {
        result.push({
          day: DAY_LABELS[i],
          value: 0,
          date: new Date(),
        });
      }
    }

    return result.slice(0, 7);
  }, [data]);

  const maxValue = useMemo(() => {
    if (maxValueProp !== undefined) return maxValueProp;
    const max = Math.max(...chartData.map((d) => d.value), 1);
    return Math.ceil(max * 1.2);
  }, [chartData, maxValueProp]);

  const average = useMemo(() => {
    const nonZeroValues = chartData.filter((d) => d.value > 0);
    if (nonZeroValues.length === 0) return 0;
    return nonZeroValues.reduce((sum, d) => sum + d.value, 0) / nonZeroValues.length;
  }, [chartData]);

  const todayIndex = useMemo(() => {
    const today = new Date();
    const jsDay = today.getDay();
    // Convert JS day (0=Sun) to our index (0=Mon)
    return jsDay === 0 ? 6 : jsDay - 1;
  }, []);

  const maxBarHeight = height - 60;
  const barWidth = Math.min(32, (screenWidth - 80) / 7 - 12);

  const averageY = maxValue > 0
    ? maxBarHeight - (average / maxValue) * maxBarHeight
    : maxBarHeight;

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {showAverage && average > 0 && (
            <Text style={[styles.averageText, { color: averageLineColor }]}>
              Среднее: {Math.round(average)}{unit ? ` ${unit}` : ''}
            </Text>
          )}
        </View>
      )}

      <View style={[styles.chartArea, { height }]}>
        {showAverage && average > 0 && (
          <View style={styles.averageLineContainer}>
            <Svg
              width="100%"
              height={maxBarHeight + 20}
              style={styles.averageSvg}
            >
              <Line
                x1="0"
                y1={averageY + 10}
                x2="100%"
                y2={averageY + 10}
                stroke={averageLineColor}
                strokeWidth={1.5}
                strokeDasharray="6,4"
                opacity={0.6}
              />
            </Svg>
          </View>
        )}

        <View style={styles.barsRow}>
          {chartData.map((item, index) => (
            <AnimatedBar
              key={`bar-${index}-${item.day}`}
              index={index}
              value={item.value}
              maxValue={maxValue}
              maxBarHeight={maxBarHeight}
              barWidth={barWidth}
              isToday={index === todayIndex}
              barColor={barColor}
              todayBarColor={todayBarColor}
              animationDuration={animationDuration}
              label={item.day || DAY_LABELS[index]}
            />
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C3E50',
  },
  averageText: {
    fontSize: 13,
    fontWeight: '500',
  },
  chartArea: {
    position: 'relative',
  },
  averageLineContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  averageSvg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  barsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    flex: 1,
    zIndex: 1,
    paddingBottom: 0,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    minHeight: 2,
  },
  barValueText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#7F8C8D',
    marginBottom: 4,
    height: 16,
    textAlign: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '400',
    color: '#95A5A6',
    marginTop: 8,
  },
  todayLabel: {
    fontWeight: '700',
    color: '#2C3E50',
  },
  todayDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginTop: 4,
  },
});

export default WeeklyChart;