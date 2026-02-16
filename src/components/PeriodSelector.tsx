import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type Period = 'week' | 'month' | 'all';

interface PeriodOption {
  key: Period;
  label: string;
}

interface PeriodSelectorProps {
  selectedPeriod: Period;
  onPeriodChange: (period: Period) => void;
  options?: PeriodOption[];
  activeColor?: string;
  inactiveColor?: string;
  activeTextColor?: string;
  inactiveTextColor?: string;
  backgroundColor?: string;
  height?: number;
  borderRadius?: number;
}

const DEFAULT_OPTIONS: PeriodOption[] = [
  { key: 'week', label: 'Неделя' },
  { key: 'month', label: 'Месяц' },
  { key: 'all', label: 'Всё время' },
];

const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  options = DEFAULT_OPTIONS,
  activeColor = '#6C63FF',
  inactiveColor = 'transparent',
  activeTextColor = '#FFFFFF',
  inactiveTextColor = '#8E8E93',
  backgroundColor = '#F2F2F7',
  height = 40,
  borderRadius = 10,
}) => {
  const selectedIndex = options.findIndex((opt) => opt.key === selectedPeriod);
  const translateX = useSharedValue(selectedIndex >= 0 ? selectedIndex : 0);

  const handlePress = useCallback(
    (period: Period, index: number) => {
      translateX.value = withTiming(index, {
        duration: 250,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      });
      onPeriodChange(period);
    },
    [onPeriodChange, translateX]
  );

  const indicatorStyle = useAnimatedStyle(() => {
    const segmentCount = options.length;
    return {
      transform: [
        {
          translateX: translateX.value * (1 / segmentCount) * 100 + '%' as unknown as number,
        },
      ],
    };
  });

  // We use a layout-based approach instead of percentage transforms
  const indicatorAnimatedStyle = useAnimatedStyle(() => {
    return {
      left: `${(translateX.value / options.length) * 100}%` as unknown as number,
    };
  });

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor,
          height,
          borderRadius,
        },
      ]}
    >
      <Animated.View
        style={[
          styles.indicator,
          {
            width: `${100 / options.length}%` as unknown as number,
            backgroundColor: activeColor,
            borderRadius: borderRadius - 2,
            height: height - 4,
          },
          indicatorAnimatedStyle,
        ]}
      />
      {options.map((option, index) => {
        const isSelected = option.key === selectedPeriod;
        return (
          <TouchableOpacity
            key={option.key}
            style={[styles.segment, { height }]}
            activeOpacity={0.7}
            onPress={() => handlePress(option.key, index)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Период: ${option.label}`}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? activeTextColor : inactiveTextColor,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  indicator: {
    position: 'absolute',
    top: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  segment: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  label: {
    fontSize: 14,
    letterSpacing: -0.1,
  },
});

export default PeriodSelector;