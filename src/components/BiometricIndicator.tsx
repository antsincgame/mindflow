import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BiometricData } from '../models/BiometricData';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface BiometricIndicatorProps {
  data: BiometricData | null;
  type: 'heartRate' | 'hrv' | 'stress' | 'breathingRate';
  showLabel?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  animated?: boolean;
}

interface IndicatorConfig {
  label: string;
  unit: string;
  getValue: (data: BiometricData) => number | null;
  getColor: (value: number) => string[];
  getStatus: (value: number) => string;
  normalRange: { min: number; max: number };
}

const INDICATOR_CONFIGS: Record<string, IndicatorConfig> = {
  heartRate: {
    label: 'Heart Rate',
    unit: 'bpm',
    getValue: (data) => data.heartRate,
    getColor: (value) => {
      if (value < 60) return [colors.primary, colors.secondary];
      if (value <= 100) return [colors.success, colors.successLight];
      if (value <= 120) return [colors.warning, colors.warningLight];
      return [colors.error, colors.errorLight];
    },
    getStatus: (value) => {
      if (value < 60) return 'Low';
      if (value <= 100) return 'Normal';
      if (value <= 120) return 'Elevated';
      return 'High';
    },
    normalRange: { min: 60, max: 100 },
  },
  hrv: {
    label: 'HRV',
    unit: 'ms',
    getValue: (data) => data.heartRateVariability,
    getColor: (value) => {
      if (value >= 50) return [colors.success, colors.successLight];
      if (value >= 30) return [colors.warning, colors.warningLight];
      return [colors.error, colors.errorLight];
    },
    getStatus: (value) => {
      if (value >= 50) return 'Good';
      if (value >= 30) return 'Fair';
      return 'Low';
    },
    normalRange: { min: 30, max: 100 },
  },
  stress: {
    label: 'Stress Level',
    unit: '%',
    getValue: (data) => data.stressLevel,
    getColor: (value) => {
      if (value <= 30) return [colors.success, colors.successLight];
      if (value <= 60) return [colors.warning, colors.warningLight];
      return [colors.error, colors.errorLight];
    },
    getStatus: (value) => {
      if (value <= 30) return 'Low';
      if (value <= 60) return 'Moderate';
      return 'High';
    },
    normalRange: { min: 0, max: 100 },
  },
  breathingRate: {
    label: 'Breathing Rate',
    unit: 'br/min',
    getValue: (data) => data.breathingRate,
    getColor: (value) => {
      if (value < 12) return [colors.primary, colors.secondary];
      if (value <= 20) return [colors.success, colors.successLight];
      return [colors.warning, colors.warningLight];
    },
    getStatus: (value) => {
      if (value < 12) return 'Slow';
      if (value <= 20) return 'Normal';
      return 'Fast';
    },
    normalRange: { min: 12, max: 20 },
  },
};

const SIZE_CONFIGS = {
  small: {
    containerSize: 60,
    fontSize: 16,
    labelFontSize: 10,
    statusFontSize: 8,
  },
  medium: {
    containerSize: 80,
    fontSize: 20,
    labelFontSize: 12,
    statusFontSize: 10,
  },
  large: {
    containerSize: 100,
    fontSize: 24,
    labelFontSize: 14,
    statusFontSize: 12,
  },
};

export const BiometricIndicator: React.FC<BiometricIndicatorProps> = ({
  data,
  type,
  showLabel = true,
  size = 'medium',
  style,
  animated = true,
}) => {
  const config = INDICATOR_CONFIGS[type];
  const sizeConfig = SIZE_CONFIGS[size];
  
  const [scaleAnim] = useState(new Animated.Value(0));
  const [pulseAnim] = useState(new Animated.Value(1));

  useEffect(() => {
    if (animated) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();

      if (type === 'heartRate' && data) {
        const pulseAnimation = Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, {
              toValue: 1.1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        );
        pulseAnimation.start();
        return () => pulseAnimation.stop();
      }
    }
  }, [data, type, animated]);

  if (!data) {
    return (
      <View style={[styles.container, style]}>
        <View
          style={[
            styles.indicatorContainer,
            {
              width: sizeConfig.containerSize,
              height: sizeConfig.containerSize,
            },
          ]}
        >
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { fontSize: sizeConfig.labelFontSize }]}>
              No Data
            </Text>
          </View>
        </View>
        {showLabel && (
          <Text style={[styles.label, { fontSize: sizeConfig.labelFontSize }]}>
            {config.label}
          </Text>
        )}
      </View>
    );
  }

  const value = config.getValue(data);
  
  if (value === null) {
    return (
      <View style={[styles.container, style]}>
        <View
          style={[
            styles.indicatorContainer,
            {
              width: sizeConfig.containerSize,
              height: sizeConfig.containerSize,
            },
          ]}
        >
          <View style={styles.noDataContainer}>
            <Text style={[styles.noDataText, { fontSize: sizeConfig.labelFontSize }]}>
              N/A
            </Text>
          </View>
        </View>
        {showLabel && (
          <Text style={[styles.label, { fontSize: sizeConfig.labelFontSize }]}>
            {config.label}
          </Text>
        )}
      </View>
    );
  }

  const gradientColors = config.getColor(value);
  const status = config.getStatus(value);
  const { min, max } = config.normalRange;
  const percentage = Math.min(Math.max((value - min) / (max - min), 0), 1);

  const animatedStyle = animated
    ? {
        transform: [
          { scale: scaleAnim },
          ...(type === 'heartRate' ? [{ scale: pulseAnim }] : []),
        ],
      }
    : {};

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.indicatorContainer,
          {
            width: sizeConfig.containerSize,
            height: sizeConfig.containerSize,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <View style={styles.contentContainer}>
            <Text
              style={[
                styles.value,
                { fontSize: sizeConfig.fontSize },
              ]}
            >
              {Math.round(value)}
            </Text>
            <Text
              style={[
                styles.unit,
                { fontSize: sizeConfig.labelFontSize },
              ]}
            >
              {config.unit}
            </Text>
          </View>
        </LinearGradient>
        
        <View
          style={[
            styles.progressRing,
            {
              width: sizeConfig.containerSize + 4,
              height: sizeConfig.containerSize + 4,
            },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                transform: [{ rotate: `${percentage * 360}deg` }],
              },
            ]}
          />
        </View>
      </Animated.View>

      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.label, { fontSize: sizeConfig.labelFontSize }]}>
            {config.label}
          </Text>
          <Text
            style={[
              styles.status,
              { fontSize: sizeConfig.statusFontSize },
              { color: gradientColors[0] },
            ]}
          >
            {status}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  indicatorContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  gradient: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  } as ViewStyle,
  contentContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  value: {
    fontFamily: typography.fontFamily.bold,
    color: colors.background,
    fontWeight: 'bold',
  } as TextStyle,
  unit: {
    fontFamily: typography.fontFamily.regular,
    color: colors.background,
    opacity: 0.9,
    marginTop: 2,
  } as TextStyle,
  progressRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  } as ViewStyle,
  progressFill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  } as ViewStyle,
  labelContainer: {
    marginTop: spacing.sm,
    alignItems: 'center',
  } as ViewStyle,
  label: {
    fontFamily: typography.fontFamily.medium,
    color: colors.text.primary,
    textAlign: 'center',
  } as TextStyle,
  status: {
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
    textAlign: 'center',
  } as TextStyle,
  noDataContainer: {
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  noDataText: {
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  } as TextStyle,
});
