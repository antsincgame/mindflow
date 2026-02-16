export enum ExerciseType {
  BREATHING = 'breathing',
  MEDITATION = 'meditation',
  PHYSICAL = 'physical',
  VISUALIZATION = 'visualization',
  PROGRESSIVE_RELAXATION = 'progressive_relaxation',
  MINDFULNESS = 'mindfulness',
  GROUNDING = 'grounding',
  JOURNALING = 'journaling',
}

export enum ExerciseDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export enum ExerciseIntensity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export interface ExerciseStep {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  instruction: string;
  audioUrl?: string;
  imageUrl?: string;
  hapticPattern?: 'light' | 'medium' | 'heavy' | 'success' | 'warning';
}

export interface ExerciseBenefit {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface ExerciseRequirement {
  id: string;
  title: string;
  description: string;
  optional: boolean;
}

export interface ExerciseMetadata {
  createdAt: Date;
  updatedAt: Date;
  version: string;
  author?: string;
  source?: string;
  scientificBasis?: string;
}

export interface ExerciseStatistics {
  totalCompletions: number;
  averageRating: number;
  totalRatings: number;
  averageDuration: number;
  completionRate: number;
  popularityScore: number;
}

export interface ExerciseRecommendation {
  score: number;
  reasons: string[];
  biometricMatch: boolean;
  emotionMatch: boolean;
  timeOfDayMatch: boolean;
  historyMatch: boolean;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  type: ExerciseType;
  difficulty: ExerciseDifficulty;
  intensity: ExerciseIntensity;
  duration: number; // in seconds
  estimatedDuration: number; // in seconds (including preparation)
  
  // Content
  steps: ExerciseStep[];
  instructions: string[];
  tips: string[];
  benefits: ExerciseBenefit[];
  requirements: ExerciseRequirement[];
  
  // Media
  thumbnailUrl: string;
  videoUrl?: string;
  audioUrl?: string;
  backgroundMusicUrl?: string;
  voiceGuidanceUrl?: string;
  
  // Categorization
  tags: string[];
  categories: string[];
  emotionIds: string[]; // related emotions
  targetSymptoms: string[];
  contraindications: string[];
  
  // Settings
  hasTimer: boolean;
  hasAudio: boolean;
  hasVideo: boolean;
  hasHaptics: boolean;
  requiresQuietSpace: boolean;
  canBeDoneAnywhere: boolean;
  requiresLyingDown: boolean;
  requiresSitting: boolean;
  
  // Biometric integration
  tracksHeartRate: boolean;
  tracksBreathing: boolean;
  tracksMovement: boolean;
  idealHeartRateRange?: { min: number; max: number };
  idealBreathingRate?: number; // breaths per minute
  
  // Gamification
  experiencePoints: number;
  achievementIds: string[];
  unlockLevel?: number;
  isPremium: boolean;
  
  // Statistics
  statistics?: ExerciseStatistics;
  
  // Metadata
  metadata: ExerciseMetadata;
  
  // Recommendation
  recommendation?: ExerciseRecommendation;
  
  // User-specific
  isCompleted?: boolean;
  isFavorite?: boolean;
  lastCompletedAt?: Date;
  completionCount?: number;
  userRating?: number;
  userNotes?: string;
}

export interface ExerciseFilter {
  types?: ExerciseType[];
  difficulties?: ExerciseDifficulty[];
  intensities?: ExerciseIntensity[];
  emotionIds?: string[];
  tags?: string[];
  minDuration?: number;
  maxDuration?: number;
  requiresQuietSpace?: boolean;
  canBeDoneAnywhere?: boolean;
  isPremium?: boolean;
  isFavorite?: boolean;
  hasAudio?: boolean;
  hasVideo?: boolean;
}

export interface ExerciseSort {
  field: 'title' | 'duration' | 'difficulty' | 'popularity' | 'rating' | 'recent';
  order: 'asc' | 'desc';
}

export interface ExerciseSearchParams {
  query?: string;
  filter?: ExerciseFilter;
  sort?: ExerciseSort;
  limit?: number;
  offset?: number;
}

export interface ExerciseProgress {
  exerciseId: string;
  currentStepIndex: number;
  elapsedTime: number;
  isPaused: boolean;
  startedAt: Date;
  completedSteps: string[];
  skippedSteps: string[];
}

export interface ExerciseCompletion {
  exerciseId: string;
  userId: string;
  completedAt: Date;
  duration: number;
  stepsCompleted: number;
  totalSteps: number;
  rating?: number;
  feedback?: string;
  emotionBefore?: string;
  emotionAfter?: string;
  biometricDataBefore?: {
    heartRate?: number;
    hrvSdnn?: number;
    breathingRate?: number;
  };
  biometricDataAfter?: {
    heartRate?: number;
    hrvSdnn?: number;
    breathingRate?: number;
  };
  effectiveness?: number; // 0-100
  experiencePointsEarned: number;
  achievementsUnlocked: string[];
}

export interface ExerciseRating {
  exerciseId: string;
  userId: string;
  rating: number; // 1-5
  review?: string;
  createdAt: Date;
  helpful?: boolean;
  difficulty?: ExerciseDifficulty;
  effectiveness?: number; // 1-5
}

export interface ExerciseCollection {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  exerciseIds: string[];
  tags: string[];
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExerciseProgram {
  id: string;
  title: string;
  description: string;
  duration: number; // in days
  exerciseIds: string[];
  schedule: {
    dayNumber: number;
    exerciseId: string;
    recommendedTime?: string; // HH:MM format
  }[];
  difficulty: ExerciseDifficulty;
  goals: string[];
  thumbnailUrl: string;
  isPremium: boolean;
}

export const EXERCISE_TYPE_LABELS: Record<ExerciseType, string> = {
  [ExerciseType.BREATHING]: 'Дыхательное',
  [ExerciseType.MEDITATION]: 'Медитация',
  [ExerciseType.PHYSICAL]: 'Физическое',
  [ExerciseType.VISUALIZATION]: 'Визуализация',
  [ExerciseType.PROGRESSIVE_RELAXATION]: 'Прогрессивная релаксация',
  [ExerciseType.MINDFULNESS]: 'Осознанность',
  [ExerciseType.GROUNDING]: 'Заземление',
  [ExerciseType.JOURNALING]: 'Дневник',
};

export const EXERCISE_DIFFICULTY_LABELS: Record<ExerciseDifficulty, string> = {
  [ExerciseDifficulty.BEGINNER]: 'Начинающий',
  [ExerciseDifficulty.INTERMEDIATE]: 'Средний',
  [ExerciseDifficulty.ADVANCED]: 'Продвинутый',
};

export const EXERCISE_INTENSITY_LABELS: Record<ExerciseIntensity, string> = {
  [ExerciseIntensity.LOW]: 'Низкая',
  [ExerciseIntensity.MEDIUM]: 'Средняя',
  [ExerciseIntensity.HIGH]: 'Высокая',
};

export const EXERCISE_TYPE_ICONS: Record<ExerciseType, string> = {
  [ExerciseType.BREATHING]: '🫁',
  [ExerciseType.MEDITATION]: '🧘',
  [ExerciseType.PHYSICAL]: '🏃',
  [ExerciseType.VISUALIZATION]: '👁️',
  [ExerciseType.PROGRESSIVE_RELAXATION]: '😌',
  [ExerciseType.MINDFULNESS]: '🧠',
  [ExerciseType.GROUNDING]: '🌱',
  [ExerciseType.JOURNALING]: '📝',
};

export const EXERCISE_TYPE_COLORS: Record<ExerciseType, string> = {
  [ExerciseType.BREATHING]: '#4A90E2',
  [ExerciseType.MEDITATION]: '#9B59B6',
  [ExerciseType.PHYSICAL]: '#E74C3C',
  [ExerciseType.VISUALIZATION]: '#3498DB',
  [ExerciseType.PROGRESSIVE_RELAXATION]: '#1ABC9C',
  [ExerciseType.MINDFULNESS]: '#F39C12',
  [ExerciseType.GROUNDING]: '#27AE60',
  [ExerciseType.JOURNALING]: '#E67E22',
};