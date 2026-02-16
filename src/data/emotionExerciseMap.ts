import { EmotionType } from '../models/Emotion';
import { ExerciseType } from '../models/Exercise';

export type StressIntensity = 'low' | 'medium' | 'high';

export interface ExerciseRecommendation {
  exerciseId: string;
  priority: number; // 1 = highest priority
  minIntensity: StressIntensity;
  maxIntensity: StressIntensity;
}

export interface EmotionExerciseMapping {
  emotionType: EmotionType;
  recommendations: ExerciseRecommendation[];
  preferredTypes: {
    low: ExerciseType[];
    medium: ExerciseType[];
    high: ExerciseType[];
  };
}

const intensityOrder: Record<StressIntensity, number> = {
  low: 1,
  medium: 2,
  high: 3,
};

export const isIntensityInRange = (
  intensity: StressIntensity,
  min: StressIntensity,
  max: StressIntensity,
): boolean => {
  const val = intensityOrder[intensity];
  return val >= intensityOrder[min] && val <= intensityOrder[max];
};

export const stressScoreToIntensity = (score: number): StressIntensity => {
  if (score <= 33) return 'low';
  if (score <= 66) return 'medium';
  return 'high';
};

export const emotionExerciseMap: Record<EmotionType, EmotionExerciseMapping> = {
  stress: {
    emotionType: 'stress',
    preferredTypes: {
      low: ['meditation', 'mindfulness'],
      medium: ['breathing', 'meditation'],
      high: ['breathing'],
    },
    recommendations: [
      // High stress → quick breathing exercises
      { exerciseId: 'breathing-4-7-8', priority: 1, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-box', priority: 2, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-extended-exhale', priority: 3, minIntensity: 'high', maxIntensity: 'high' },
      // Medium stress → breathing + meditation
      { exerciseId: 'breathing-4-7-8', priority: 1, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'breathing-box', priority: 2, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'meditation-calm', priority: 3, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'meditation-body-scan', priority: 4, minIntensity: 'medium', maxIntensity: 'medium' },
      // Low stress → longer meditations and mindfulness
      { exerciseId: 'meditation-calm', priority: 1, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-body-scan', priority: 2, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'mindfulness-five-senses', priority: 3, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-gratitude', priority: 4, minIntensity: 'low', maxIntensity: 'low' },
    ],
  },

  sadness: {
    emotionType: 'sadness',
    preferredTypes: {
      low: ['meditation', 'mindfulness'],
      medium: ['meditation', 'breathing'],
      high: ['breathing', 'meditation'],
    },
    recommendations: [
      // High intensity sadness
      { exerciseId: 'breathing-extended-exhale', priority: 1, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-4-7-8', priority: 2, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'meditation-calm', priority: 3, minIntensity: 'high', maxIntensity: 'high' },
      // Medium intensity
      { exerciseId: 'meditation-gratitude', priority: 1, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'meditation-calm', priority: 2, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'breathing-extended-exhale', priority: 3, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'mindfulness-five-senses', priority: 4, minIntensity: 'medium', maxIntensity: 'medium' },
      // Low intensity
      { exerciseId: 'meditation-gratitude', priority: 1, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'mindfulness-five-senses', priority: 2, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-body-scan', priority: 3, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-calm', priority: 4, minIntensity: 'low', maxIntensity: 'low' },
    ],
  },

  anxiety: {
    emotionType: 'anxiety',
    preferredTypes: {
      low: ['mindfulness', 'meditation'],
      medium: ['breathing', 'mindfulness'],
      high: ['breathing'],
    },
    recommendations: [
      // High anxiety → grounding and quick breathing
      { exerciseId: 'breathing-box', priority: 1, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-4-7-8', priority: 2, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-extended-exhale', priority: 3, minIntensity: 'high', maxIntensity: 'high' },
      // Medium anxiety
      { exerciseId: 'breathing-box', priority: 1, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'mindfulness-five-senses', priority: 2, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'breathing-4-7-8', priority: 3, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'mindfulness-muscle-relaxation', priority: 4, minIntensity: 'medium', maxIntensity: 'medium' },
      // Low anxiety
      { exerciseId: 'mindfulness-five-senses', priority: 1, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-body-scan', priority: 2, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-calm', priority: 3, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'mindfulness-muscle-relaxation', priority: 4, minIntensity: 'low', maxIntensity: 'low' },
    ],
  },

  fatigue: {
    emotionType: 'fatigue',
    preferredTypes: {
      low: ['mindfulness', 'meditation'],
      medium: ['breathing', 'mindfulness'],
      high: ['breathing'],
    },
    recommendations: [
      // High fatigue → energizing breathing
      { exerciseId: 'breathing-box', priority: 1, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-4-7-8', priority: 2, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'mindfulness-muscle-relaxation', priority: 3, minIntensity: 'high', maxIntensity: 'high' },
      // Medium fatigue
      { exerciseId: 'mindfulness-five-senses', priority: 1, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'breathing-box', priority: 2, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'mindfulness-muscle-relaxation', priority: 3, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'meditation-body-scan', priority: 4, minIntensity: 'medium', maxIntensity: 'medium' },
      // Low fatigue
      { exerciseId: 'meditation-body-scan', priority: 1, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'mindfulness-five-senses', priority: 2, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-gratitude', priority: 3, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-calm', priority: 4, minIntensity: 'low', maxIntensity: 'low' },
    ],
  },

  irritation: {
    emotionType: 'irritation',
    preferredTypes: {
      low: ['meditation', 'mindfulness'],
      medium: ['breathing', 'meditation'],
      high: ['breathing'],
    },
    recommendations: [
      // High irritation → calming breathing
      { exerciseId: 'breathing-extended-exhale', priority: 1, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-4-7-8', priority: 2, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-box', priority: 3, minIntensity: 'high', maxIntensity: 'high' },
      // Medium irritation
      { exerciseId: 'breathing-extended-exhale', priority: 1, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'meditation-calm', priority: 2, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'mindfulness-muscle-relaxation', priority: 3, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'breathing-4-7-8', priority: 4, minIntensity: 'medium', maxIntensity: 'medium' },
      // Low irritation
      { exerciseId: 'meditation-calm', priority: 1, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-gratitude', priority: 2, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'mindfulness-muscle-relaxation', priority: 3, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-body-scan', priority: 4, minIntensity: 'low', maxIntensity: 'low' },
    ],
  },

  overwhelm: {
    emotionType: 'overwhelm',
    preferredTypes: {
      low: ['mindfulness', 'meditation'],
      medium: ['breathing', 'mindfulness'],
      high: ['breathing'],
    },
    recommendations: [
      // High overwhelm → immediate grounding and breathing
      { exerciseId: 'breathing-4-7-8', priority: 1, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-extended-exhale', priority: 2, minIntensity: 'high', maxIntensity: 'high' },
      { exerciseId: 'breathing-box', priority: 3, minIntensity: 'high', maxIntensity: 'high' },
      // Medium overwhelm
      { exerciseId: 'mindfulness-five-senses', priority: 1, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'breathing-box', priority: 2, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'meditation-body-scan', priority: 3, minIntensity: 'medium', maxIntensity: 'medium' },
      { exerciseId: 'breathing-4-7-8', priority: 4, minIntensity: 'medium', maxIntensity: 'medium' },
      // Low overwhelm
      { exerciseId: 'meditation-body-scan', priority: 1, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'mindfulness-five-senses', priority: 2, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-calm', priority: 3, minIntensity: 'low', maxIntensity: 'low' },
      { exerciseId: 'meditation-gratitude', priority: 4, minIntensity: 'low', maxIntensity: 'low' },
    ],
  },
};

export const getRecommendedExerciseIds = (
  emotionType: EmotionType,
  stressScore: number,
  recentExerciseIds: string[] = [],
): string[] => {
  const intensity = stressScoreToIntensity(stressScore);
  const mapping = emotionExerciseMap[emotionType];

  if (!mapping) return [];

  const filtered = mapping.recommendations
    .filter((rec) => isIntensityInRange(intensity, rec.minIntensity, rec.maxIntensity))
    .sort((a, b) => a.priority - b.priority);

  // Move recently done exercises to the end
  const notRecent = filtered.filter(
    (rec) => !recentExerciseIds.includes(rec.exerciseId),
  );
  const recent = filtered.filter((rec) =>
    recentExerciseIds.includes(rec.exerciseId),
  );

  return [...notRecent, ...recent].map((rec) => rec.exerciseId);
};

export const getPreferredExerciseTypes = (
  emotionType: EmotionType,
  stressScore: number,
): ExerciseType[] => {
  const intensity = stressScoreToIntensity(stressScore);
  const mapping = emotionExerciseMap[emotionType];

  if (!mapping) return ['breathing', 'meditation', 'mindfulness'];

  return mapping.preferredTypes[intensity];
};

export const getTopRecommendation = (
  emotionType: EmotionType,
  stressScore: number,
  recentExerciseIds: string[] = [],
): string | null => {
  const ids = getRecommendedExerciseIds(emotionType, stressScore, recentExerciseIds);
  return ids.length > 0 ? ids[0] : null;
};