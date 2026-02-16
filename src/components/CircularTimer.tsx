import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
} from 'react-native';
import Svg, { Circle, G } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface CircularTimerProps {
  duration: number;
  elapsed: number;
  isActive: boolean;
  onToggle: () => void;
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export const CircularTimer: React.FC<CircularTimerProps> = ({
  duration,
  elapsed,
  isActive,
  onToggle,
  size = 280,
  strokeWidth = 12,
  color = '#4A90E2',
  backgroundColor = '#E8F4FD',
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;

  useEffect(() => {
    const progress = elapsed / duration;
    Animated.timing(animatedValue, {
      toValue: progress,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [elapsed, duration, animatedValue]);

  useEffect(() => {
    if (isActive) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isActive, pulseAnim]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const remainingTime = duration - elapsed;
  const progressPercentage = Math.round((elapsed / duration) * 100);

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.timerContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Svg width={size} height={size} style={styles.svg}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={backgroundColor}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <AnimatedCircle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>

        <View style={styles.innerContent}>
          <Text style={styles.timeText}>{formatTime(remainingTime)}</Text>
          <Text style={styles.percentageText}>{progressPercentage}%</Text>
          <Text style={styles.labelText}>
            {isActive ? 'В процессе' : 'Приостановлено'}
          </Text>
        </View>
      </Animated.View>

      <TouchableOpacity
        style={styles.controlButton}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={isActive ? ['#FF6B6B', '#FF8E53'] : ['#4A90E2', '#357ABD']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientButton}
        >
          <Text style={styles.buttonText}>
            {isActive ? 'Пауза' : 'Продолжить'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(elapsed)}</Text>
          <Text style={styles.statLabel}>Прошло</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{formatTime(duration)}</Text>
          <Text style={styles.statLabel}>Всего</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  svg: {
    position: 'absolute',
  },
  innerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontSize: 52,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -1,
  },
  percentageText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4A90E2',
    marginTop: 8,
  },
  labelText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 4,
    fontWeight: '500',
  },
  controlButton: {
    width: 200,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  gradientButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
    paddingHorizontal: 40,
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    width: '90%',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    color: '#8E8E93',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 20,
  },
});