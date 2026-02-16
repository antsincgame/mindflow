import React, { useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  Easing,
  runOnJS,
  cancelAnimation,
  interpolateColor,
  interpolate,
} from 'react-native-reanimated';
import { BreathingPattern, BreathingPhase } from '@models/BreathingPattern';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BASE_CIRCLE_SIZE = SCREEN_WIDTH * 0.45;
const MIN_SCALE = 0.4;
const MAX_SCALE = 1.0;

interface BreathingAnimationProps {
  pattern: BreathingPattern;
  isActive: boolean;
  isPaused?: boolean;
  onPhaseChange?: (phase: BreathingPhase) => void;
  onCycleComplete?: (cycleNumber: number) => void;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  showLabel?: boolean;
  showTimer?: boolean;
}

const PHASE_LABELS: Record<BreathingPhase, string> = {
  inhale: 'Вдох',
  hold: 'Задержка',
  exhale: 'Выдох',
  holdAfterExhale: 'Задержка',
};

const PHASE_COLORS: Record<BreathingPhase, string> = {
  inhale: '#7EC8E3',
  hold: '#A8D8EA',
  exhale: '#B8A9C9',
  holdAfterExhale: '#C9B8D8',
};

const BreathingAnimation: React.FC<BreathingAnimationProps> = ({
  pattern,
  isActive,
  isPaused = false,
  onPhaseChange,
  onCycleComplete,
  size = BASE_CIRCLE_SIZE,
  primaryColor = '#7EC8E3',
  secondaryColor = '#B8A9C9',
  showLabel = true,
  showTimer = true,
}) => {
  const scale = useSharedValue(MIN_SCALE);
  const opacity = useSharedValue(0.6);
  const phaseProgress = useSharedValue(0);
  const currentPhaseIndex = useSharedValue(0);
  const currentCycle = useSharedValue(0);
  const phaseTimerValue = useSharedValue(0);

  const [currentPhase, setCurrentPhase] = React.useState<BreathingPhase>('inhale');
  const [currentPhaseTime, setCurrentPhaseTime] = React.useState<number>(0);
  const [cycleCount, setCycleCount] = React.useState<number>(0);

  const phases = useMemo(() => {
    const result: { phase: BreathingPhase; duration: number }[] = [];

    if (pattern.inhale > 0) {
      result.push({ phase: 'inhale', duration: pattern.inhale });
    }
    if (pattern.hold > 0) {
      result.push({ phase: 'hold', duration: pattern.hold });
    }
    if (pattern.exhale > 0) {
      result.push({ phase: 'exhale', duration: pattern.exhale });
    }
    if (pattern.holdAfterExhale && pattern.holdAfterExhale > 0) {
      result.push({ phase: 'holdAfterExhale', duration: pattern.holdAfterExhale });
    }

    return result;
  }, [pattern]);

  const totalCycleDuration = useMemo(() => {
    return phases.reduce((sum, p) => sum + p.duration, 0);
  }, [phases]);

  const handlePhaseChange = useCallback(
    (phase: BreathingPhase) => {
      setCurrentPhase(phase);
      onPhaseChange?.(phase);
    },
    [onPhaseChange],
  );

  const handleCycleComplete = useCallback(
    (cycle: number) => {
      setCycleCount(cycle);
      onCycleComplete?.(cycle);
    },
    [onCycleComplete],
  );

  useEffect(() => {
    if (!isActive || isPaused || phases.length === 0) {
      return;
    }

    let isCancelled = false;
    let phaseTimerInterval: ReturnType<typeof setInterval> | null = null;
    let phaseTimeoutId: ReturnType<typeof setTimeout> | null = null;
    let cycleNum = cycleCount;

    const getTargetScale = (phase: BreathingPhase): number => {
      switch (phase) {
        case 'inhale':
          return MAX_SCALE;
        case 'hold':
          return MAX_SCALE;
        case 'exhale':
          return MIN_SCALE;
        case 'holdAfterExhale':
          return MIN_SCALE;
        default:
          return MIN_SCALE;
      }
    };

    const getTargetOpacity = (phase: BreathingPhase): number => {
      switch (phase) {
        case 'inhale':
          return 1.0;
        case 'hold':
          return 0.9;
        case 'exhale':
          return 0.6;
        case 'holdAfterExhale':
          return 0.5;
        default:
          return 0.6;
      }
    };

    const runPhase = (phaseIndex: number) => {
      if (isCancelled) return;

      if (phaseIndex >= phases.length) {
        cycleNum += 1;
        runOnJS(handleCycleComplete)(cycleNum);

        if (pattern.cycles && cycleNum >= pattern.cycles) {
          return;
        }

        runPhase(0);
        return;
      }

      const { phase, duration } = phases[phaseIndex];
      const durationMs = duration * 1000;

      currentPhaseIndex.value = phaseIndex;
      runOnJS(handlePhaseChange)(phase);

      let remainingTime = duration;
      runOnJS(setCurrentPhaseTime)(remainingTime);

      const targetScale = getTargetScale(phase);
      const targetOpacity = getTargetOpacity(phase);

      const easing =
        phase === 'inhale'
          ? Easing.bezier(0.4, 0.0, 0.2, 1)
          : phase === 'exhale'
            ? Easing.bezier(0.4, 0.0, 0.6, 1)
            : Easing.linear;

      scale.value = withTiming(targetScale, {
        duration: durationMs,
        easing,
      });

      opacity.value = withTiming(targetOpacity, {
        duration: durationMs,
        easing: Easing.linear,
      });

      phaseProgress.value = 0;
      phaseProgress.value = withTiming(1, {
        duration: durationMs,
        easing: Easing.linear,
      });

      if (phaseTimerInterval) {
        clearInterval(phaseTimerInterval);
      }

      phaseTimerInterval = setInterval(() => {
        if (isCancelled) {
          if (phaseTimerInterval) clearInterval(phaseTimerInterval);
          return;
        }
        remainingTime -= 1;
        if (remainingTime >= 0) {
          setCurrentPhaseTime(remainingTime);
        }
      }, 1000);

      phaseTimeoutId = setTimeout(() => {
        if (phaseTimerInterval) clearInterval(phaseTimerInterval);
        if (!isCancelled) {
          runPhase(phaseIndex + 1);
        }
      }, durationMs);
    };

    runPhase(0);

    return () => {
      isCancelled = true;
      if (phaseTimerInterval) clearInterval(phaseTimerInterval);
      if (phaseTimeoutId) clearTimeout(phaseTimeoutId);
      cancelAnimation(scale);
      cancelAnimation(opacity);
      cancelAnimation(phaseProgress);
    };
  }, [isActive, isPaused, phases, pattern.cycles]);

  useEffect(() => {
    if (!isActive) {
      scale.value = withTiming(MIN_SCALE, { duration: 500 });
      opacity.value = withTiming(0.6, { duration: 500 });
      setCurrentPhase('inhale');
      setCurrentPhaseTime(0);
      setCycleCount(0);
    }
  }, [isActive]);

  const animatedCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  const animatedInnerCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value * 0.85 }],
      opacity: interpolate(opacity.value, [0.5, 1.0], [0.3, 0.7]),
    };
  });

  const animatedOuterRingStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value * 1.15 }],
      opacity: interpolate(opacity.value, [0.5, 1.0], [0.1, 0.3]),
    };
  });

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${phaseProgress.value * 100}%`,
    };
  });

  const phaseColor = PHASE_COLORS[currentPhase];

  return (
    <View style={styles.container}>
      <View style={[styles.circleContainer, { width: size * 1.4, height: size * 1.4 }]}>
        {/* Outer ring */}
        <Animated.View
          style={[
            styles.circle,
            styles.outerRing,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderColor: primaryColor,
            },
            animatedOuterRingStyle,
          ]}
        />

        {/* Main circle */}
        <Animated.View
          style={[
            styles.circle,
            styles.mainCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: phaseColor,
            },
            animatedCircleStyle,
          ]}
        />

        {/* Inner circle */}
        <Animated.View
          style={[
            styles.circle,
            styles.innerCircle,
            {
              width: size * 0.6,
              height: size * 0.6,
              borderRadius: (size * 0.6) / 2,
              backgroundColor: '#FFFFFF',
            },
            animatedInnerCircleStyle,
          ]}
        />

        {/* Phase label inside circle */}
        {showLabel && (
          <View style={styles.labelContainer}>
            <Text style={[styles.phaseLabel, { color: '#FFFFFF' }]}>
              {isActive ? PHASE_LABELS[currentPhase] : 'Готов'}
            </Text>
            {showTimer && isActive && (
              <Text style={[styles.phaseTimer, { color: '#FFFFFF' }]}>
                {currentPhaseTime}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Progress bar */}
      {isActive && (
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[
                styles.progressBarFill,
                { backgroundColor: phaseColor },
                progressStyle,
              ]}
            />
          </View>
        </View>
      )}

      {/* Pattern info */}
      {isActive && (
        <View style={styles.patternInfo}>
          <Text style={styles.patternText}>
            {phases.map((p) => `${p.duration}с`).join(' - ')}
          </Text>
          {pattern.cycles && (
            <Text style={styles.cycleText}>
              Цикл {cycleCount + 1} из {pattern.cycles}
            </Text>
          )}
        </View>
      )}

      {/* Phase indicators */}
      {isActive && (
        <View style={styles.phaseIndicators}>
          {phases.map((p, index) => (
            <View
              key={`${p.phase}-${index}`}
              style={[
                styles.phaseIndicator,
                {
                  backgroundColor:
                    currentPhase === p.phase ? PHASE_COLORS[p.phase] : '#E0E0E0',
                  flex: p.duration / totalCycleDuration,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  circleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  circle: {
    position: 'absolute',
  },
  outerRing: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  mainCircle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  innerCircle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  labelContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  phaseLabel: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  phaseTimer: {
    fontSize: 48,
    fontWeight: '300',
    textAlign: 'center',
    marginTop: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressBarContainer: {
    width: '80%',
    marginTop: 32,
    paddingHorizontal: 16,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E8E8E8',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  patternInfo: {
    alignItems: 'center',
    marginTop: 16,
  },
  patternText: {
    fontSize: 14,
    color: '#999',
    fontWeight: '400',
  },
  cycleText: {
    fontSize: 13,
    color: '#BBB',
    fontWeight: '400',
    marginTop: 4,
  },
  phaseIndicators: {
    flexDirection: 'row',
    width: '80%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 12,
    gap: 2,
  },
  phaseIndicator: {