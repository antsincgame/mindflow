import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { BreathingPattern, BreathingPhase } from '../models/BreathingPattern';

interface BreathingAnimationProps {
  pattern: BreathingPattern;
  isActive: boolean;
  isPaused?: boolean;
  onPhaseChange?: (phase: BreathingPhase) => void;
  size?: number;
}

const BreathingAnimation: React.FC<BreathingAnimationProps> = ({
  pattern,
  isActive,
  isPaused = false,
  onPhaseChange,
  size = 200,
}) => {
  const scale = useSharedValue(0.4);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    if (isActive && !isPaused) {
      const sequence = withSequence(
        withTiming(1, { duration: pattern.inhale * 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: pattern.hold * 1000 }),
        withTiming(0.4, { duration: pattern.exhale * 1000, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: (pattern.holdAfterExhale || 0) * 1000 })
      );
      scale.value = sequence;
    }
  }, [isActive, isPaused, pattern]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2 },
          animatedStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  circle: {
    backgroundColor: '#7EC8E3',
  },
});

export default BreathingAnimation;