import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface EnergyBarProps {
  energy: number;
  height?: number;
  width?: number;
  showLabel?: boolean;
  animated?: boolean;
}

const EnergyBar: React.FC<EnergyBarProps> = ({
  energy,
  height = 300,
  width = 60,
  showLabel = true,
  animated = true,
}) => {
  const { colors } = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fillAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();

      return () => pulseAnimation.stop();
    }
  }, [animated, pulseAnim]);

  useEffect(() => {
    Animated.spring(fillAnim, {
      toValue: energy,
      tension: 40,
      friction: 8,
      useNativeDriver: false,
    }).start();
  }, [energy, fillAnim]);

  const getEnergyColor = (level: number): string => {
    if (level >= 75) return '#10B981';
    if (level >= 50) return '#14B8A6';
    if (level >= 25) return '#F59E0B';
    return '#EF4444';
  };

  const getEnergyLabel = (level: number): string => {
    if (level >= 75) return 'Высокая';
    if (level >= 50) return 'Средняя';
    if (level >= 25) return 'Низкая';
    return 'Критическая';
  };

  const fillHeight = fillAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  const backgroundColor = getEnergyColor(energy);

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelContainer}>
          <Text style={[styles.energyValue, { color: colors.text }]}>
            {Math.round(energy)}
          </Text>
          <Text style={[styles.energyLabel, { color: colors.textSecondary }]}>
            {getEnergyLabel(energy)}
          </Text>
        </View>
      )}

      <View
        style={[
          styles.barContainer,
          {
            height,
            width,
            backgroundColor: colors.surface,
            borderColor: colors.textSecondary + '30',
          },
        ]}
      >
        <View style={styles.barInner}>
          {[...Array(10)].map((_, index) => (
            <View
              key={index}
              style={[
                styles.gridLine,
                { backgroundColor: colors.textSecondary + '20' },
              ]}
            />
          ))}
        </View>

        <Animated.View
          style={[
            styles.fill,
            {
              height: fillHeight,
              backgroundColor,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        >
          <View style={styles.fillGradient} />
        </Animated.View>

        <View style={styles.markerContainer}>
          {[100, 75, 50, 25, 0].map((marker) => (
            <View key={marker} style={styles.markerRow}>
              <View
                style={[
                  styles.markerLine,
                  { backgroundColor: colors.textSecondary + '40' },
                ]}
              />
              <Text style={[styles.markerText, { color: colors.textSecondary }]}>
                {marker}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.bottomLabels}>
        <Text style={[styles.bottomLabel, { color: colors.textSecondary }]}>
          Энергия
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  energyValue: {
    fontSize: 48,
    fontWeight: '700',
    letterSpacing: -1,
  },
  energyLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  barContainer: {
    borderRadius: 30,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  barInner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  gridLine: {
    height: 1,
    width: '100%',
  },
  fill: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    overflow: 'hidden',
  },
  fillGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  markerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  markerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingRight: 8,
  },
  markerLine: {
    width: 12,
    height: 1,
    marginRight: 4,
  },
  markerText: {
    fontSize: 10,
    fontWeight: '600',
    width: 24,
    textAlign: 'right',
  },
  bottomLabels: {
    marginTop: 12,
    alignItems: 'center',
  },
  bottomLabel: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default EnergyBar;