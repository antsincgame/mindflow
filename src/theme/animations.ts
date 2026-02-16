import { Animated, Easing } from 'react-native';

export const animations = {
  // Duration presets
  durations: {
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
  },

  // Easing functions
  easings: {
    linear: Easing.linear,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),
    easeInQuad: Easing.in(Easing.quad),
    easeOutQuad: Easing.out(Easing.quad),
    easeInCubic: Easing.in(Easing.cubic),
    easeOutCubic: Easing.out(Easing.cubic),
    easeInCirc: Easing.in(Easing.circle),
    easeOutCirc: Easing.out(Easing.circle),
    easeInBack: Easing.in(Easing.back(1.52)),
    easeOutBack: Easing.out(Easing.back(1.52)),
  },

  // Predefined animation configs
  configs: {
    fadeIn: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    },
    fadeOut: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    },
    slideInUp: {
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    },
    slideOutDown: {
      duration: 400,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    },
    slideInLeft: {
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    },
    slideOutRight: {
      duration: 400,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    },
    scaleIn: {
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    },
    scaleOut: {
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    },
    bounce: {
      duration: 600,
      easing: Easing.bounce,
      useNativeDriver: true,
    },
    pulse: {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    },
    shake: {
      duration: 400,
      easing: Easing.linear,
      useNativeDriver: true,
    },
    rotate: {
      duration: 800,
      easing: Easing.linear,
      useNativeDriver: true,
    },
  },

  // Sequence animations
  sequences: {
    popIn: (animValue: Animated.Value) => {
      return Animated.sequence([
        Animated.spring(animValue, {
          toValue: 1.1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(animValue, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
      ]);
    },

    slideAndFade: (animValue: Animated.Value) => {
      return Animated.parallel([
        Animated.timing(animValue, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]);
    },

    breathe: (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1.05,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    },

    pulse: (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 0.7,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    },

    shake: (animValue: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(animValue, {
          toValue: -10,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 10,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: -10,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 100,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]);
    },

    spin: (animValue: Animated.Value) => {
      return Animated.loop(
        Animated.timing(animValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
    },

    bounce: (animValue: Animated.Value) => {
      return Animated.sequence([
        Animated.timing(animValue, {
          toValue: -20,
          duration: 300,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animValue, {
          toValue: 0,
          duration: 300,
          easing: Easing.out(Easing.bounce),
          useNativeDriver: true,
        }),
      ]);
    },
  },

  // Interpolation helpers
  interpolations: {
    scaleInterpolation: (animValue: Animated.Value) => ({
      transform: [
        {
          scale: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [0.8, 1],
          }),
        },
      ],
    }),

    rotateInterpolation: (animValue: Animated.Value) => ({
      transform: [
        {
          rotate: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
          }),
        },
      ],
    }),

    opacityInterpolation: (animValue: Animated.Value) => ({
      opacity: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, 1],
      }),
    }),

    translateYInterpolation: (animValue: Animated.Value, range: [number, number] = [0, 100]) => ({
      transform: [
        {
          translateY: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [range[0], range[1]],
          }),
        },
      ],
    }),

    translateXInterpolation: (animValue: Animated.Value, range: [number, number] = [0, 100]) => ({
      transform: [
        {
          translateX: animValue.interpolate({
            inputRange: [0, 1],
            outputRange: [range[0], range[1]],
          }),
        },
      ],
    }),

    colorInterpolation: (animValue: Animated.Value, color1: string, color2: string) => ({
      backgroundColor: animValue.interpolate({
        inputRange: [0, 1],
        outputRange: [color1, color2],
      }),
    }),
  },

  // Timing helpers
  timing: (
    animValue: Animated.Value,
    toValue: number,
    duration: number = 300,
    easing: (value: number) => number = Easing.out(Easing.ease)
  ) => {
    return Animated.timing(animValue, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    });
  },

  // Spring animation helper
  spring: (
    animValue: Animated.Value,
    toValue: number = 1,
    friction: number = 7,
    tension: number = 40
  ) => {
    return Animated.spring(animValue, {
      toValue,
      friction,
      tension,
      useNativeDriver: true,
    });
  },

  // Parallel animations
  parallel: (animations: Animated.CompositeAnimation[]) => {
    return Animated.parallel(animations);
  },

  // Sequential animations
  sequence: (animations: Animated.CompositeAnimation[]) => {
    return Animated.sequence(animations);
  },

  // Stagger animation helper
  stagger: (
    delay: number,
    animations: Animated.CompositeAnimation[]
  ) => {
    return Animated.sequence(
      animations.map((anim, index) =>
        Animated.sequence([
          Animated.delay(delay * index),
          anim,
        ])
      )
    );
  },
};

export type AnimationConfig = {
  duration: number;
  easing: (value: number) => number;
  useNativeDriver: boolean;
};

export type AnimationValue = Animated.Value | Animated.ValueXY;

export const createAnimationValue = (initialValue: number = 0): Animated.Value => {
  return new Animated.Value(initialValue);
};

export const createAnimationValueXY = (
  initialValueX: number = 0,
  initialValueY: number = 0
): Animated.ValueXY => {
  return new Animated.ValueXY({ x: initialValueX, y: initialValueY });
};

export default animations;