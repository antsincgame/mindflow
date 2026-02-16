import { Easing } from 'react-native-reanimated';

export const animations = {
  // Длительности анимаций
  durations: {
    instant: 0,
    fast: 200,
    normal: 300,
    slow: 500,
    verySlow: 800,
    extraSlow: 1000,
  },

  // Easing функции
  easings: {
    linear: Easing.linear,
    easeIn: Easing.in(Easing.ease),
    easeOut: Easing.out(Easing.ease),
    easeInOut: Easing.inOut(Easing.ease),
    spring: Easing.elastic(1),
    bounce: Easing.bounce,
    bezier: Easing.bezier(0.25, 0.1, 0.25, 1),
    smooth: Easing.bezier(0.4, 0.0, 0.2, 1),
    sharp: Easing.bezier(0.4, 0.0, 0.6, 1),
    gentle: Easing.bezier(0.25, 0.46, 0.45, 0.94),
  },

  // Preset конфигурации для различных типов анимаций
  presets: {
    fadeIn: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      from: { opacity: 0 },
      to: { opacity: 1 },
    },
    fadeOut: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      from: { opacity: 1 },
      to: { opacity: 0 },
    },
    slideInFromRight: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      from: { translateX: 300 },
      to: { translateX: 0 },
    },
    slideInFromLeft: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      from: { translateX: -300 },
      to: { translateX: 0 },
    },
    slideInFromBottom: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      from: { translateY: 300 },
      to: { translateY: 0 },
    },
    slideInFromTop: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      from: { translateY: -300 },
      to: { translateY: 0 },
    },
    slideOutToRight: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      from: { translateX: 0 },
      to: { translateX: 300 },
    },
    slideOutToLeft: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      from: { translateX: 0 },
      to: { translateX: -300 },
    },
    slideOutToBottom: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      from: { translateY: 0 },
      to: { translateY: 300 },
    },
    slideOutToTop: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      from: { translateY: 0 },
      to: { translateY: -300 },
    },
    scaleIn: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      from: { scale: 0 },
      to: { scale: 1 },
    },
    scaleOut: {
      duration: 300,
      easing: Easing.in(Easing.ease),
      from: { scale: 1 },
      to: { scale: 0 },
    },
    scaleUp: {
      duration: 200,
      easing: Easing.out(Easing.ease),
      from: { scale: 1 },
      to: { scale: 1.05 },
    },
    scaleDown: {
      duration: 200,
      easing: Easing.in(Easing.ease),
      from: { scale: 1.05 },
      to: { scale: 1 },
    },
    rotate: {
      duration: 500,
      easing: Easing.linear,
      from: { rotate: '0deg' },
      to: { rotate: '360deg' },
    },
    pulse: {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      from: { scale: 1 },
      to: { scale: 1.1 },
    },
    shake: {
      duration: 500,
      easing: Easing.bounce,
      from: { translateX: 0 },
      to: { translateX: 10 },
    },
    bounce: {
      duration: 800,
      easing: Easing.bounce,
      from: { translateY: 0 },
      to: { translateY: -20 },
    },
    wiggle: {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
      from: { rotate: '0deg' },
      to: { rotate: '5deg' },
    },
    flip: {
      duration: 600,
      easing: Easing.inOut(Easing.ease),
      from: { rotateY: '0deg' },
      to: { rotateY: '180deg' },
    },
    ripple: {
      duration: 600,
      easing: Easing.out(Easing.ease),
      from: { scale: 0, opacity: 1 },
      to: { scale: 2, opacity: 0 },
    },
  },

  // Специфичные анимации для компонентов
  components: {
    emotionCard: {
      swipeOut: {
        duration: 300,
        easing: Easing.out(Easing.ease),
      },
      snapBack: {
        duration: 200,
        easing: Easing.elastic(1),
      },
      like: {
        duration: 400,
        easing: Easing.out(Easing.ease),
        scale: 1.1,
        rotate: '15deg',
      },
      dislike: {
        duration: 400,
        easing: Easing.out(Easing.ease),
        scale: 0.9,
        rotate: '-15deg',
      },
    },
    exerciseCard: {
      press: {
        duration: 100,
        easing: Easing.out(Easing.ease),
        scale: 0.95,
      },
      release: {
        duration: 100,
        easing: Easing.out(Easing.ease),
        scale: 1,
      },
      expand: {
        duration: 300,
        easing: Easing.out(Easing.ease),
      },
      collapse: {
        duration: 300,
        easing: Easing.in(Easing.ease),
      },
    },
    circularProgress: {
      fill: {
        duration: 1000,
        easing: Easing.linear,
      },
      pulse: {
        duration: 1500,
        easing: Easing.inOut(Easing.ease),
        scale: [1, 1.05, 1],
      },
    },
    achievementBadge: {
      unlock: {
        duration: 800,
        easing: Easing.elastic(1.5),
        scale: [0, 1.2, 1],
        rotate: ['0deg', '360deg'],
      },
      shine: {
        duration: 2000,
        easing: Easing.linear,
        opacity: [0.5, 1, 0.5],
      },
    },
    heatmapCell: {
      appear: {
        duration: 300,
        easing: Easing.out(Easing.ease),
        scale: [0, 1],
      },
      highlight: {
        duration: 200,
        easing: Easing.out(Easing.ease),
        scale: 1.2,
      },
    },
    notification: {
      slideIn: {
        duration: 400,
        easing: Easing.out(Easing.ease),
        translateY: [-100, 0],
      },
      slideOut: {
        duration: 300,
        easing: Easing.in(Easing.ease),
        translateY: [0, -100],
      },
    },
    modal: {
      fadeIn: {
        duration: 300,
        easing: Easing.out(Easing.ease),
        opacity: [0, 1],
      },
      fadeOut: {
        duration: 200,
        easing: Easing.in(Easing.ease),
        opacity: [1, 0],
      },
      slideUp: {
        duration: 400,
        easing: Easing.out(Easing.ease),
        translateY: [300, 0],
      },
      slideDown: {
        duration: 300,
        easing: Easing.in(Easing.ease),
        translateY: [0, 300],
      },
    },
    button: {
      press: {
        duration: 100,
        easing: Easing.out(Easing.ease),
        scale: 0.95,
      },
      release: {
        duration: 100,
        easing: Easing.out(Easing.ease),
        scale: 1,
      },
      ripple: {
        duration: 600,
        easing: Easing.out(Easing.ease),
      },
    },
    tab: {
      activate: {
        duration: 200,
        easing: Easing.out(Easing.ease),
        scale: 1.1,
      },
      deactivate: {
        duration: 200,
        easing: Easing.in(Easing.ease),
        scale: 1,
      },
    },
    list: {
      itemAppear: {
        duration: 300,
        easing: Easing.out(Easing.ease),
        translateY: [20, 0],
        opacity: [0, 1],
      },
      itemDisappear: {
        duration: 200,
        easing: Easing.in(Easing.ease),
        translateX: [-300, 0],
        opacity: [1, 0],
      },
    },
  },

  // Timing функции для последовательных анимаций
  timing: {
    stagger: (index: number, baseDelay: number = 100): number => {
      return index * baseDelay;
    },
    cascade: (index: number, totalItems: number, duration: number): number => {
      return (duration / totalItems) * index;
    },
  },

  // Spring конфигурации
  springs: {
    gentle: {
      damping: 20,
      mass: 1,
      stiffness: 100,
    },
    bouncy: {
      damping: 10,
      mass: 1,
      stiffness: 100,
    },
    snappy: {
      damping: 25,
      mass: 1,
      stiffness: 200,
    },
    slow: {
      damping: 30,
      mass: 1,
      stiffness: 50,
    },
    wobbly: {
      damping: 8,
      mass: 1,
      stiffness: 100,
    },
  },

  // Gesture анимации
  gestures: {
    swipe: {
      velocityThreshold: 500,
      distanceThreshold: 100,
      duration: 300,
      easing: Easing.out(Easing.ease),
    },
    pan: {
      friction: 0.9,
      tension: 40,
    },
    pinch: {
      minScale: 0.5,
      maxScale: 3,
      duration: 200,
      easing: Easing.out(Easing.ease),
    },
    rotation: {
      snapPoints: [0, 90, 180, 270, 360],
      snapThreshold: 15,
      duration: 200,
      easing: Easing.out(Easing.ease),
    },
  },

  // Transition конфигурации для навигации
  transitions: {
    screen: {
      fade: {
        duration: 300,
        easing: Easing.inOut(Easing.ease),
      },
      slide: {
        duration: 300,
        easing: Easing.out(Easing.ease),
      },
      modal: {
        duration: 400,
        easing: Easing.out(Easing.ease),
      },
    },
  },

  // Haptic feedback timing
  haptic: {
    light: 50,
    medium: 100,
    heavy: 150,
  },

  // Анимации для биометрических индикаторов
  biometric: {
    heartbeat: {
      duration: 1000,
      easing: Easing.inOut(Easing.ease),
      scale: [1, 1.1, 1],
    },
    pulse: {
      duration: 2000,
      easing: Easing.linear,
      opacity: [0.3, 1, 0.3],
    },
    wave: {
      duration: 1500,
      easing: Easing.inOut(Easing.ease),
      translateY: [0, -10, 0],
    },
  },

  // Анимации для графиков
  charts: {
    lineAppear: {
      duration: 1000,
      easing: Easing.out(Easing.ease),
    },
    barGrow: {
      duration: 800,
      easing: Easing.out(Easing.ease),
    },
    pieSlice: {
      duration: 600,
      easing: Easing.out(Easing.ease),
    },
  },

  // Анимации для таймера
  timer: {
    tick: {
      duration: 1000,
      easing: Easing.linear,
    },
    complete: {
      duration: 500,
      easing: Easing.elastic(1.5),
      scale: [1, 1.2, 1],
    },
    warning: {
      duration: 500,
      easing: Easing.inOut(Easing.ease),
      opacity: [1, 0.5, 1],
    },
  },

  // Анимации для аудио плеера
  audio: {
    play: {
      duration: 300,
      easing: Easing.out(Easing.ease),
      scale: [1, 1.1, 1],
    },
    pause: {
      duration: 200,
      easing: Easing.in(Easing.ease),
      scale: [1, 0.9, 1],
    },
    waveform: {
      duration: 300,
      easing: Easing.linear,
      scaleY: [0.3, 1, 0.3],
    },
  },

  // Skeleton loading анимации
  skeleton: {
    shimmer: {
      duration: 1500,
      easing: Easing.linear,
      translateX: [-300, 300],
    },
    pulse: {
      duration: