import { Easing } from 'react-native-reanimated';

export const animations = {
  durations: {
    instant: 0,
    fast: 150,
    normal: 300,
    slow: 500,
    verySlow: 800,
    pulse: 1500,
    breathe: 3000,
  },

  easing: {
    linear: Easing.linear,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),
    bounce: Easing.bounce,
    elastic: Easing.elastic(1),
    back: Easing.back(1.5),
    bezier: Easing.bezier(0.4, 0.0, 0.2, 1),
    pulse: Easing.inOut(Easing.sin),
  },

  spring: {
    default: {
      damping: 15,
      mass: 1,
      stiffness: 150,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 2,
    },
    gentle: {
      damping: 20,
      mass: 1,
      stiffness: 100,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 2,
    },
    bouncy: {
      damping: 10,
      mass: 1,
      stiffness: 200,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 2,
    },
    stiff: {
      damping: 25,
      mass: 0.8,
      stiffness: 300,
      overshootClamping: false,
      restDisplacementThreshold: 0.01,
      restSpeedThreshold: 2,
    },
  },

  timing: {
    fade: {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    },
    slide: {
      duration: 350,
      easing: Easing.out(Easing.exp),
    },
    scale: {
      duration: 250,
      easing: Easing.out(Easing.back(1.2)),
    },
    pulse: {
      duration: 1500,
      easing: Easing.inOut(Easing.sin),
    },
    breathe: {
      duration: 3000,
      easing: Easing.inOut(Easing.ease),
    },
    ripple: {
      duration: 600,
      easing: Easing.out(Easing.ease),
    },
  },

  pulseConfig: {
    slow: {
      duration: 2000,
      scale: { min: 1, max: 1.1 },
      opacity: { min: 0.6, max: 1 },
    },
    normal: {
      duration: 1500,
      scale: { min: 1, max: 1.15 },
      opacity: { min: 0.5, max: 1 },
    },
    fast: {
      duration: 1000,
      scale: { min: 1, max: 1.2 },
      opacity: { min: 0.4, max: 1 },
    },
    urgent: {
      duration: 600,
      scale: { min: 1, max: 1.3 },
      opacity: { min: 0.3, max: 1 },
    },
  },

  transition: {
    modal: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      opacity: { from: 0, to: 1 },
      scale: { from: 0.9, to: 1 },
    },
    screen: {
      duration: 350,
      easing: Easing.out(Easing.exp),
      translateX: { from: 100, to: 0 },
    },
    card: {
      duration: 250,
      easing: Easing.out(Easing.back(1.1)),
      scale: { from: 0.95, to: 1 },
      opacity: { from: 0, to: 1 },
    },
    list: {
      duration: 200,
      easing: Easing.out(Easing.ease),
      stagger: 50,
    },
  },

  gesture: {
    swipe: {
      velocityThreshold: 500,
      distanceThreshold: 50,
      duration: 200,
      easing: Easing.out(Easing.ease),
    },
    press: {
      duration: 100,
      scale: 0.95,
      opacity: 0.7,
    },
    longPress: {
      duration: 150,
      scale: 0.98,
      hapticDelay: 400,
    },
  },

  chart: {
    line: {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      delay: 0,
    },
    bar: {
      duration: 600,
      easing: Easing.out(Easing.back(1.1)),
      stagger: 50,
    },
    pie: {
      duration: 1000,
      easing: Easing.out(Easing.ease),
      rotation: { from: 0, to: 360 },
    },
  },

  energyBar: {
    fill: {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    },
    pulse: {
      duration: 1500,
      scale: { min: 1, max: 1.05 },
      opacity: { min: 0.8, max: 1 },
    },
    glow: {
      duration: 2000,
      opacity: { min: 0.3, max: 0.8 },
    },
  },

  notification: {
    enter: {
      duration: 400,
      easing: Easing.out(Easing.back(1.3)),
      translateY: { from: -100, to: 0 },
      opacity: { from: 0, to: 1 },
    },
    exit: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      translateY: { from: 0, to: -100 },
      opacity: { from: 1, to: 0 },
    },
  },

  loading: {
    spinner: {
      duration: 1000,
      easing: Easing.linear,
      rotation: { from: 0, to: 360 },
    },
    skeleton: {
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
      opacity: { min: 0.3, max: 0.7 },
    },
    dots: {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
      stagger: 150,
      scale: { min: 0.8, max: 1.2 },
    },
  },

  feedback: {
    success: {
      duration: 500,
      scale: { from: 0.8, to: 1.1, final: 1 },
      opacity: { from: 0, to: 1 },
    },
    error: {
      duration: 400,
      shake: {
        amplitude: 10,
        frequency: 3,
      },
    },
    warning: {
      duration: 600,
      pulse: {
        scale: { min: 1, max: 1.15 },
        repeat: 2,
      },
    },
  },

  moodSelector: {
    emoji: {
      duration: 300,
      scale: { pressed: 0.9, selected: 1.2, default: 1 },
      bounce: Easing.out(Easing.back(1.5)),
    },
    slider: {
      duration: 150,
      easing: Easing.out(Easing.ease),
    },
  },

  taskCard: {
    complete: {
      duration: 500,
      scale: { from: 1, to: 0.95 },
      opacity: { from: 1, to: 0.5 },
      strikethrough: {
        duration: 300,
        delay: 100,
      },
    },
    delete: {
      duration: 400,
      translateX: { from: 0, to: -400 },
      opacity: { from: 1, to: 0 },
    },
    reorder: {
      duration: 250,
      easing: Easing.out(Easing.ease),
      scale: 1.05,
    },
  },

  calendarBlock: {
    expand: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      scale: { from: 1, to: 1.02 },
    },
    drag: {
      duration: 200,
      scale: 1.08,
      opacity: 0.9,
      shadow: {
        elevation: 8,
        shadowOpacity: 0.3,
      },
    },
  },

  breakReminder: {
    appear: {
      duration: 600,
      easing: Easing.out(Easing.back(1.2)),
      scale: { from: 0.3, to: 1 },
      opacity: { from: 0, to: 1 },
    },
    dismiss: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      scale: { from: 1, to: 0.8 },
      opacity: { from: 1, to: 0 },
    },
  },

  insights: {
    reveal: {
      duration: 800,
      easing: Easing.out(Easing.cubic),
      translateY: { from: 50, to: 0 },
      opacity: { from: 0, to: 1 },
      stagger: 100,
    },
    highlight: {
      duration: 1000,
      pulse: {
        scale: { min: 1, max: 1.03 },
        opacity: { min: 0.9, max: 1 },
      },
    },
  },

  theme: {
    switch: {
      duration: 400,
      easing: Easing.inOut(Easing.ease),
      opacity: { from: 1, to: 0, back: 1 },
    },
  },
};

export type AnimationConfig = typeof animations;
export type PulseSpeed = keyof typeof animations.pulseConfig;
export type TransitionType = keyof typeof animations.transition;
export type GestureType = keyof typeof animations.gesture;