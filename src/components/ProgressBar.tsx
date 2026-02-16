import React from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface ProgressBarProps {
  current: number;
  target: number;
  label?: string;
  showPercentage?: boolean;
  animated?: boolean;
  height?: number;
  color?: string;
  backgroundColor?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  target,
  label = 'Daily Progress',
  showPercentage = true,
  animated = true,
  height = 12,
  color = colors.primary,
  backgroundColor = colors.lightGray,
}) => {
  const percentage = Math.min((current / target) * 100, 100);
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.timing(animatedWidth, {
        toValue: percentage,
        duration: 800,
        useNativeDriver: false,
      }).start();
    } else {
      animatedWidth.setValue(percentage);
    }
  }, [percentage, animated]);

  const widthInterpolate = animatedWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const isComplete = current >= target;
  const progressColor = isComplete ? colors.success : color;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={styles.infoRow}>
        <Text style={styles.count}>
          {current} / {target}
        </Text>
        {showPercentage && (
          <Text style={[styles.percentage, isComplete && styles.completeText]}>
            {Math.round(percentage)}%
          </Text>
        )}
      </View>

      <View style={[styles.barContainer, { height, backgroundColor }]}>
        <Animated.View
          style={[
            styles.bar,
            {
              height,
              width: widthInterpolate,
              backgroundColor: progressColor,
            },
          ]}
        />
      </View>

      {isComplete && (
        <Text style={styles.completeMessage}>Goal achieved! 🎉</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  label: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  count: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.medium,
  },
  percentage: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    fontWeight: typography.weights.bold,
  },
  barContainer: {
    width: '100%',
    backgroundColor: colors.lightGray,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  bar: {
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  completeMessage: {
    fontSize: typography.sizes.xs,
    color: colors.success,
    fontWeight: typography.weights.semibold,
    marginTop: spacing.xs,
  },
});