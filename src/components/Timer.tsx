import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface TimerProps {
  duration: number;
  isActive: boolean;
  isPaused: boolean;
  onComplete?: () => void;
  onTick?: (remaining: number) => void;
  size?: 'small' | 'medium' | 'large';
  showMilliseconds?: boolean;
  variant?: 'session' | 'break';
}

const { width } = Dimensions.get('window');

export const Timer: React.FC<TimerProps> = ({
  duration,
  isActive,
  isPaused,
  onComplete,
  onTick,
  size = 'large',
  showMilliseconds = false,
  variant = 'session',
}) => {
  const [remaining, setRemaining] = useState(duration);
  const [progress] = useState(new Animated.Value(1));
  const scaleAnim = useState(new Animated.Value(1))[0];

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { radius: 60, fontSize: 32 };
      case 'medium':
        return { radius: 90, fontSize: 48 };
      case 'large':
        return { radius: 120, fontSize: 64 };
      default:
        return { radius: 120, fontSize: 64 };
    }
  };

  const sizeConfig = getSizeConfig();
  const circumference = 2 * Math.PI * sizeConfig.radius;

  useEffect(() => {
    if (!isActive || isPaused) return;

    const interval = setInterval(() => {
      setRemaining((prev) => {
        const next = prev - 1;
        if (next <= 0) {
          clearInterval(interval);
          onComplete?.();
          return 0;
        }
        onTick?.(next);
        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isActive, isPaused, onComplete, onTick]);

  useEffect(() => {
    const progressValue = remaining / duration;
    Animated.timing(progress, {
      toValue: progressValue,
      duration: 500,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [remaining, duration, progress]);

  useEffect(() => {
    if (remaining <= 10 && remaining > 0 && isActive && !isPaused) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.05,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [remaining, isActive, isPaused, scaleAnim]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getBackgroundColor = () => {
    if (variant === 'session') {
      return remaining <= 10 ? colors.error : colors.primary;
    }
    return remaining <= 5 ? colors.warning : colors.success;
  };

  const getCircleColor = () => {
    if (variant === 'session') {
      return remaining <= 10 ? colors.error : colors.primary;
    }
    return remaining <= 5 ? colors.warning : colors.success;
  };

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.timerWrapper,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View
          style={[
            styles.circleContainer,
            {
              width: sizeConfig.radius * 2,
              height: sizeConfig.radius * 2,
              borderRadius: sizeConfig.radius,
              backgroundColor: getBackgroundColor() + '15',
            },
          ]}
        >
          <Animated.View
            style={[
              styles.progressRing,
              {
                width: sizeConfig.radius * 2,
                height: sizeConfig.radius * 2,
              },
            ]}
          >
            <svg
              width={sizeConfig.radius * 2}
              height={sizeConfig.radius * 2}
              style={styles.svg}
            >
              <circle
                cx={sizeConfig.radius}
                cy={sizeConfig.radius}
                r={sizeConfig.radius - 8}
                fill="none"
                stroke={colors.background}
                strokeWidth="8"
              />
              <Animated.circle
                cx={sizeConfig.radius}
                cy={sizeConfig.radius}
                r={sizeConfig.radius - 8}
                fill="none"
                stroke={getCircleColor()}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                style={{
                  transform: [{ rotate: '-90deg' }],
                  transformOrigin: `${sizeConfig.radius}px ${sizeConfig.radius}px`,
                }}
              />
            </svg>
          </Animated.View>

          <View style={styles.timeDisplay}>
            <Text
              style={[
                styles.timeText,
                {
                  fontSize: sizeConfig.fontSize,
                  color: getCircleColor(),
                },
              ]}
            >
              {formatTime(remaining)}
            </Text>
            {showMilliseconds && (
              <Text style={styles.labelText}>
                {variant === 'session' ? 'Focus' : 'Rest'}
              </Text>
            )}
          </View>
        </View>
      </Animated.View>

      {isPaused && (
        <View style={styles.pausedOverlay}>
          <Text style={styles.pausedText}>PAUSED</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  timerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  progressRing: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ scaleY: -1 }],
  },
  timeDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeText: {
    fontFamily: typography.fontFamily.mono,
    fontWeight: '700',
    letterSpacing: 1,
  },
  labelText: {
    fontSize: typography.sizes.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.xs,
    letterSpacing: 0.5,
  },
  pausedOverlay: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 8,
    marginTop: spacing.lg,
  },
  pausedText: {
    color: colors.background,
    fontSize: typography.sizes.md,
    fontWeight: '700',
    letterSpacing: 2,
  },
});