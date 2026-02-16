import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolateColor,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

interface StressLevelIndicatorProps {
  level: number; // 0-100
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
  showIcon?: boolean;
  showNumericValue?: boolean;
  style?: ViewStyle;
  animated?: boolean;
}

const STRESS_COLORS = {
  low: '#4CAF50',
  mediumLow: '#8BC34A',
  medium: '#FFC107',
  mediumHigh: '#FF9800',
  high: '#F44336',
};

const STRESS_LABELS: { max: number; label: string; emoji: string }[] = [
  { max: 20, label: 'Спокойно', emoji: '😌' },
  { max: 40, label: 'Нормально', emoji: '🙂' },
  { max: 60, label: 'Умеренно', emoji: '😐' },
  { max: 80, label: 'Повышенный', emoji: '😟' },
  { max: 100, label: 'Высокий', emoji: '😰' },
];

const SIZE_CONFIG = {
  small: {
    barWidth: 120,
    barHeight: 6,
    fontSize: 12,
    labelFontSize: 10,
    iconSize: 16,
    spacing: 4,
  },
  medium: {
    barWidth: 200,
    barHeight: 8,
    fontSize: 16,
    labelFontSize: 12,
    iconSize: 20,
    spacing: 6,
  },
  large: {
    barWidth: 280,
    barHeight: 10,
    fontSize: 20,
    labelFontSize: 14,
    iconSize: 24,
    spacing: 8,
  },
};

function getStressColor(level: number): string {
  if (level <= 20) return STRESS_COLORS.low;
  if (level <= 40) return STRESS_COLORS.mediumLow;
  if (level <= 60) return STRESS_COLORS.medium;
  if (level <= 80) return STRESS_COLORS.mediumHigh;
  return STRESS_COLORS.high;
}

function getStressInfo(level: number): { label: string; emoji: string } {
  const clamped = Math.max(0, Math.min(100, level));
  const info = STRESS_LABELS.find((s) => clamped <= s.max);
  return info ?? STRESS_LABELS[STRESS_LABELS.length - 1];
}

const AnimatedSvgCircle = Animated.createAnimatedComponent(Circle);

const StressLevelIndicator: React.FC<StressLevelIndicatorProps> = ({
  level,
  size = 'medium',
  showLabel = true,
  showIcon = true,
  showNumericValue = true,
  style,
  animated = true,
}) => {
  const clampedLevel = Math.max(0, Math.min(100, level));
  const config = SIZE_CONFIG[size];
  const stressInfo = getStressInfo(clampedLevel);

  const animatedLevel = useSharedValue(0);
  const colorProgress = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    const normalizedLevel = clampedLevel / 100;
    if (animated) {
      animatedLevel.value = withTiming(normalizedLevel, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      colorProgress.value = withTiming(normalizedLevel, {
        duration: 600,
        easing: Easing.out(Easing.cubic),
      });
      if (clampedLevel >= 70) {
        pulseScale.value = withSpring(1.05, { damping: 4, stiffness: 100 }, () => {
          pulseScale.value = withSpring(1, { damping: 8, stiffness: 120 });
        });
      }
    } else {
      animatedLevel.value = normalizedLevel;
      colorProgress.value = normalizedLevel;
    }
  }, [clampedLevel, animated]);

  const fillAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 0.2, 0.4, 0.6, 0.8, 1],
      [
        STRESS_COLORS.low,
        STRESS_COLORS.low,
        STRESS_COLORS.mediumLow,
        STRESS_COLORS.medium,
        STRESS_COLORS.mediumHigh,
        STRESS_COLORS.high,
      ]
    );

    return {
      width: `${animatedLevel.value * 100}%` as any,
      backgroundColor,
    };
  });

  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      colorProgress.value,
      [0, 0.2, 0.4, 0.6, 0.8, 1],
      [
        STRESS_COLORS.low,
        STRESS_COLORS.low,
        STRESS_COLORS.mediumLow,
        STRESS_COLORS.medium,
        STRESS_COLORS.mediumHigh,
        STRESS_COLORS.high,
      ]
    );

    return {
      left: `${animatedLevel.value * 100}%` as any,
      backgroundColor,
    };
  });

  const currentColor = getStressColor(clampedLevel);

  return (
    <Animated.View style={[styles.container, containerAnimatedStyle, style]}>
      <View style={styles.topRow}>
        {showIcon && (
          <Text style={[styles.emoji, { fontSize: config.iconSize }]}>
            {stressInfo.emoji}
          </Text>
        )}
        {showLabel && (
          <Text
            style={[
              styles.label,
              { fontSize: config.labelFontSize, color: currentColor },
            ]}
          >
            {stressInfo.label}
          </Text>
        )}
        {showNumericValue && (
          <Text style={[styles.numericValue, { fontSize: config.fontSize }]}>
            {clampedLevel}
            <Text style={styles.percentSign}>%</Text>
          </Text>
        )}
      </View>

      <View
        style={[
          styles.barContainer,
          {
            width: config.barWidth,
            height: config.barHeight,
            borderRadius: config.barHeight / 2,
          },
        ]}
      >
        <Animated.View
          style={[
            styles.barFill,
            {
              height: config.barHeight,
              borderRadius: config.barHeight / 2,
            },
            fillAnimatedStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.dot,
            {
              width: config.barHeight + 4,
              height: config.barHeight + 4,
              borderRadius: (config.barHeight + 4) / 2,
              marginLeft: -(config.barHeight + 4) / 2,
              top: -2,
            },
            dotAnimatedStyle,
          ]}
        />
      </View>

      <View style={[styles.scaleLabels, { width: config.barWidth }]}>
        <Text style={[styles.scaleLabel, { fontSize: config.labelFontSize - 2 }]}>
          0
        </Text>
        <Text style={[styles.scaleLabel, { fontSize: config.labelFontSize - 2 }]}>
          50
        </Text>
        <Text style={[styles.scaleLabel, { fontSize: config.labelFontSize - 2 }]}>
          100
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  emoji: {
    marginRight: 2,
  },
  label: {
    fontWeight: '600',
  },
  numericValue: {
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  percentSign: {
    fontSize: 12,
    fontWeight: '400',
    color: '#999',
  },
  barContainer: {
    backgroundColor: '#E8E8E8',
    overflow: 'visible',
    position: 'relative',
  },
  barFill: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  dot: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  scaleLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  scaleLabel: {
    color: '#AAAAAA',
    fontWeight: '400',
  },
});

export default StressLevelIndicator;