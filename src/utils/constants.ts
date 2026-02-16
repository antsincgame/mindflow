import { EmotionType } from '../models/Emotion';

// ==================== STORAGE KEYS ====================

export const STORAGE_KEYS = {
  USER_SETTINGS: '@mindflow/user_settings',
  SESSIONS: '@mindflow/sessions',
  ACHIEVEMENTS: '@mindflow/achievements',
  STATISTICS: '@mindflow/statistics',
  ONBOARDING_COMPLETED: '@mindflow/onboarding_completed',
  LAST_EMOTION: '@mindflow/last_emotion',
  HEALTH_DATA_CACHE: '@mindflow/health_data_cache',
  SHARE_LINKS: '@mindflow/share_links',
  STREAK_DATA: '@mindflow/streak_data',
  USER_LEVEL: '@mindflow/user_level',
  NOTIFICATION_SCHEDULE: '@mindflow/notification_schedule',
  THEME_PREFERENCE: '@mindflow/theme_preference',
  BIOMETRIC_PERMISSIONS: '@mindflow/biometric_permissions',
  FIRST_LAUNCH_DATE: '@mindflow/first_launch_date',
  ENCRYPTED_DATA: '@mindflow/encrypted_data',
} as const;

// ==================== LIMITS ====================

export const LIMITS = {
  MAX_SESSIONS_PER_DAY: 20,
  MAX_SHARE_LINKS: 10,
  MAX_NOTIFICATION_TIMES: 8,
  MAX_STREAK_DISPLAY_DAYS: 90,
  HEATMAP_DAYS: 90,
  MIN_SESSION_DURATION_SECONDS: 30,
  MAX_SESSION_DURATION_SECONDS: 1800,
  HEALTH_DATA_CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
  STRESS_HISTORY_MAX_ENTRIES: 1000,
  STATISTICS_MAX_PERIOD_DAYS: 365,
  AUDIO_FADE_DURATION_MS: 2000,
  HAPTIC_DEBOUNCE_MS: 100,
  ACHIEVEMENT_ANIMATION_DURATION_MS: 3000,
} as const;

// ==================== BREATHING PATTERNS ====================

export interface BreathingPhase {
  name: 'inhale' | 'holdAfterInhale' | 'exhale' | 'holdAfterExhale';
  label: string;
  durationSeconds: number;
}

export interface BreathingPatternDefinition {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhase[];
  cycles: number;
  totalDurationSeconds: number;
}

export const BREATHING_PATTERNS: Record<string, BreathingPatternDefinition> = {
  '4-7-8': {
    id: '4-7-8',
    name: 'Дыхание 4-7-8',
    description: 'Техника расслабления: вдох 4 секунды, задержка 7, выдох 8',
    phases: [
      { name: 'inhale', label: 'Вдох', durationSeconds: 4 },
      { name: 'holdAfterInhale', label: 'Задержка', durationSeconds: 7 },
      { name: 'exhale', label: 'Выдох', durationSeconds: 8 },
      { name: 'holdAfterExhale', label: 'Пауза', durationSeconds: 0 },
    ],
    cycles: 4,
    totalDurationSeconds: 4 * (4 + 7 + 8),
  },
  box: {
    id: 'box',
    name: 'Коробочное дыхание',
    description: 'Равномерное дыхание: 4-4-4-4 секунды для каждой фазы',
    phases: [
      { name: 'inhale', label: 'Вдох', durationSeconds: 4 },
      { name: 'holdAfterInhale', label: 'Задержка', durationSeconds: 4 },
      { name: 'exhale', label: 'Выдох', durationSeconds: 4 },
      { name: 'holdAfterExhale', label: 'Задержка', durationSeconds: 4 },
    ],
    cycles: 6,
    totalDurationSeconds: 6 * (4 + 4 + 4 + 4),
  },
  extended_exhale: {
    id: 'extended_exhale',
    name: 'Удлинённый выдох',
    description: 'Выдох в два раза длиннее вдоха для активации парасимпатической нервной системы',
    phases: [
      { name: 'inhale', label: 'Вдох', durationSeconds: 4 },
      { name: 'holdAfterInhale', label: 'Задержка', durationSeconds: 0 },
      { name: 'exhale', label: 'Выдох', durationSeconds: 8 },
      { name: 'holdAfterExhale', label: 'Пауза', durationSeconds: 2 },
    ],
    cycles: 6,
    totalDurationSeconds: 6 * (4 + 0 + 8 + 2),
  },
  calming: {
    id: 'calming',
    name: 'Успокаивающее дыхание',
    description: 'Мягкое дыхание с короткими задержками для быстрого снятия напряжения',
    phases: [
      { name: 'inhale', label: 'Вдох', durationSeconds: 3 },
      { name: 'holdAfterInhale', label: 'Задержка', durationSeconds: 2 },
      { name: 'exhale', label: 'Выдох', durationSeconds: 5 },
      { name: 'holdAfterExhale', label: 'Пауза', durationSeconds: 1 },
    ],
    cycles: 8,
    totalDurationSeconds: 8 * (3 + 2 + 5 + 1),
  },
  energizing: {
    id: 'energizing',
    name: 'Энергизирующее дыхание',
    description: 'Быстрое ритмичное дыхание для повышения энергии и бодрости',
    phases: [
      { name: 'inhale', label: 'Вдох', durationSeconds: 2 },
      { name: 'holdAfterInhale', label: 'Задержка', durationSeconds: 1 },
      { name: 'exhale', label: 'Выдох', durationSeconds: 2 },
      { name: 'holdAfterExhale', label: 'Пауза', durationSeconds: 0 },
    ],
    cycles: 12,
    totalDurationSeconds: 12 * (2 + 1 + 2 + 0),
  },
};

// ==================== EMOTIONS ====================

export interface EmotionDefinition {
  id: string;
  type: EmotionType;
  name: string;
  icon: string;
  color: string;
  gradientColors: [string, string];
  description: string;
  recommendedExerciseTypes: string[];
}

export const EMOTIONS: EmotionDefinition[] = [
  {
    id: 'stress',
    type: 'stress' as EmotionType,
    name: 'Стресс',
    icon: '⚡',
    color: '#FF6B6B',
    gradientColors: ['#FF6B6B', '#FF8E8E'],
    description: 'Чувствую напряжение и давление',
    recommendedExerciseTypes: ['breathing', 'meditation'],
  },
  {
    id: 'sadness',
    type: 'sadness' as EmotionType,
    name: 'Грусть',
    icon: '🌧️',
    color: '#74B9FF',
    gradientColors: ['#74B9FF', '#A3D1FF'],
    description: 'Чувствую печаль и тоску',
    recommendedExerciseTypes: ['meditation', 'mindfulness'],
  },
  {
    id: 'anxiety',
    type: 'anxiety' as EmotionType,
    name: 'Беспокойство',
    icon: '🌊',
    color: '#A29BFE',
    gradientColors: ['#A29BFE', '#C4BFFF'],
    description: 'Чувствую тревогу и волнение',
    recommendedExerciseTypes: ['breathing', 'mindfulness'],
  },
  {
    id: 'fatigue',
    type: 'fatigue' as EmotionType,
    name: 'Усталость',
    icon: '🔋',
    color: '#FDCB6E',
    gradientColors: ['#FDCB6E', '#FFE0A0'],
    description: 'Чувствую истощение и нехватку энергии',
    recommendedExerciseTypes: ['breathing', 'mindfulness'],
  },
  {
    id: 'irritation',
    type: 'irritation' as EmotionType,
    name: 'Раздражение',
    icon: '🔥',
    color: '#E17055',
    gradientColors: ['#E17055', '#F09A83'],
    description: 'Чувствую злость и раздражительность',
    recommendedExerciseTypes: ['breathing', 'meditation'],
  },
  {
    id: 'overwhelm',
    type: 'overwhelm' as EmotionType,
    name: 'Подавленность',
    icon: '☁️',
    color: '#636E72',
    gradientColors: ['#636E72', '#8C9DA0'],
    description: 'Чувствую перегрузку и неспособность справиться',
    recommendedExerciseTypes: ['breathing', 'meditation', 'mindfulness'],
  },
];

// ==================== EXERCISE TYPES ====================

export type ExerciseType = 'breathing' | 'meditation' | 'mindfulness';

export interface ExerciseStep {
  order: number;
  instruction: string;
  durationSeconds?: number;
}

export interface ExerciseDefinition {
  id: string;
  name: string;
  type: ExerciseType;
  durationSeconds: number;
  description: string;
  shortDescription: string;
  icon: string;
  breathingPatternId?: string;
  audioFile?: string;
  steps: ExerciseStep[];
  suitableEmotions: string[];
  intensityLevel: 'low' | 'medium' | 'high';
}

export const EXERCISES: ExerciseDefinition[] = [
  // ---- BREATHING EXERCISES ----
  {
    id: 'breathing_478',
    name: 'Дыхание 4-7-8',
    type: 'breathing',
    durationSeconds: 180,
    description:
      'Техника дыхания доктора Вейля. Вдох через нос на 4 секунды, задержка на 7, медленный выдох через рот на 8 секунд. Мощная техника для быстрого снятия стресса.',
    shortDescription: 'Быстрое снятие стресса за 3 минуты',
    icon: '🌬️',
    breathingPatternId: '4-7-8',
    audioFile: 'breathing_478.mp3',
    steps: [
      { order: 1, instruction: 'Сядьте удобно и расслабьте плечи', durationSeconds: 10 },
      { order: 2, instruction: 'Закройте глаза и сделайте глубокий вдох', durationSeconds: 5 },
      { order: 3, instruction: 'Вдохните через нос на 4 счёта', durationSeconds: 4 },
      { order: 4, instruction: 'Задержите дыхание на 7 счётов', durationSeconds: 7 },
      { order: 5, instruction: 'Медленно выдохните через рот на 8 счётов', durationSeconds: 8 },
      { order: 6, instruction: 'Повторите цикл 4 раза', durationSeconds: 0 },
    ],
    suitableEmotions: ['stress', 'anxiety', 'irritation'],
    intensityLevel: 'high',
  },
  {
    id: 'breathing_box',
    name: 'Коробочное дыхание',
    type: 'breathing',
    durationSeconds: 240,
    description:
      'Техника, используемая морскими котиками США. Все фазы дыхания равны — по 4 секунды. Помогает восстановить контроль и сосредоточенность.',
    shortDescription: 'Восстановление контроля и фокуса',
    icon: '📦',
    breathingPatternId: 'box',
    audioFile: 'breathing_box.mp3',
    steps: [
      { order: 1, instruction: 'Примите удобное положение', durationSeconds: 10 },
      { order: 2, instruction: 'Вдохните на 4 счёта', durationSeconds: 4 },
      { order: 3, instruction: 'Задержите дыхание на 4 счёта', durationSeconds: 4 },
      { order: 4, instruction: 'Выдохните на 4 счёта', durationSeconds: 4 },
      { order: 5, instruction: 'Задержите дыхание на 4 счёта', durationSeconds: 4 },
      { order: 6, instruction: 'Повторите 6 циклов', durationSeconds: 0 },
    ],
    suitableEmotions: ['stress', 'anxiety', 'overwhelm'],
    intensityLevel: 'medium',
  },
  {
    id: 'breathing_extended_exhale',
    name: 'Удлинённый выдох',
    type: 'breathing',
    durationSeconds: 180,
    description:
      'Удлинённый выдох активирует парасимпатическую нервную систему, замедляя сердцебиение и снижая уровень кортизола.',
    shortDescription: 'Глубокое расслабление через дыхание',
    icon: '🍃',
    breathingPatternId: 'extended_exhale',
    audioFile: 'breathing_extended.mp3',
    steps: [
      { order: 1, instruction: 'Расслабьтесь и закройте глаза', durationSeconds: 10 },
      { order: 2, instruction: 'Вдохните через нос на 4 счёта', durationSeconds: 4 },
      { order: 3, instruction: 'Медленно выдохните на 8 счётов', durationSeconds: 8 },
      { order: 4, instruction: 'Сделайте паузу на 2 секунды', durationSeconds: 2 },
      { order: 5, instruction: 'Повторите 6 циклов', durationSeconds: 0 },
    ],
    suitableEmotions: ['stress', 'anxiety', 'irritation', 'overwhelm'],
    intensityLevel: 'medium',
  },
  {
    id: 'breathing_calming',
    name: 'Успока