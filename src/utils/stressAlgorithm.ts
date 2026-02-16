import { EmotionType } from '../models/Emotion';
import { HealthData, HeartRateData, HRVData, SleepData, ActivityData } from '../models/HealthData';

export interface StressInput {
  heartRate?: HeartRateData | null;
  hrv?: HRVData | null;
  sleep?: SleepData | null;
  activity?: ActivityData | null;
  emotion?: EmotionType | null;
}

export interface StressResult {
  score: number;
  level: StressLevel;
  components: StressComponents;
  confidence: number;
  timestamp: Date;
}

export interface StressComponents {
  heartRateScore: number;
  hrvScore: number;
  sleepScore: number;
  activityScore: number;
  emotionScore: number;
  biometricScore: number;
  combinedScore: number;
}

export type StressLevel = 'low' | 'moderate' | 'high' | 'very_high';

export interface NormalizationParams {
  min: number;
  max: number;
  optimal?: number;
}

const WEIGHTS = {
  heartRate: 0.3,
  hrv: 0.3,
  sleep: 0.2,
  activity: 0.2,
} as const;

const BIOMETRIC_WEIGHT = 0.6;
const EMOTION_WEIGHT = 0.4;

const HEART_RATE_PARAMS: NormalizationParams = {
  min: 40,
  max: 120,
  optimal: 65,
};

const HRV_PARAMS: NormalizationParams = {
  min: 10,
  max: 120,
  optimal: 60,
};

const SLEEP_DURATION_PARAMS: NormalizationParams = {
  min: 0,
  max: 10,
  optimal: 8,
};

const SLEEP_QUALITY_PARAMS: NormalizationParams = {
  min: 0,
  max: 100,
};

const ACTIVITY_PARAMS: NormalizationParams = {
  min: 0,
  max: 180,
  optimal: 60,
};

const EMOTION_STRESS_MAP: Record<string, number> = {
  stress: 85,
  anxiety: 80,
  irritation: 75,
  overwhelm: 90,
  sadness: 60,
  fatigue: 55,
  neutral: 30,
  calm: 10,
  happy: 5,
};

function clamp(value: number, min: number = 0, max: number = 100): number {
  return Math.min(Math.max(value, min), max);
}

function normalizeHeartRate(bpm: number): number {
  const { min, max, optimal } = HEART_RATE_PARAMS;
  const clampedBpm = clamp(bpm, min, max);

  if (optimal === undefined) {
    return ((clampedBpm - min) / (max - min)) * 100;
  }

  const deviation = Math.abs(clampedBpm - optimal);
  const maxDeviation = Math.max(optimal - min, max - optimal);
  const normalizedDeviation = deviation / maxDeviation;

  const stressScore = normalizedDeviation * 100;

  if (clampedBpm > optimal) {
    return clamp(stressScore * 1.2);
  }

  return clamp(stressScore * 0.8);
}

function normalizeHRV(ms: number): number {
  const { min, max } = HRV_PARAMS;
  const clampedHRV = clamp(ms, min, max);

  const normalizedHRV = (clampedHRV - min) / (max - min);
  const stressScore = (1 - normalizedHRV) * 100;

  return clamp(stressScore);
}

function normalizeSleep(durationHours: number, quality?: number): number {
  const { optimal } = SLEEP_DURATION_PARAMS;
  const optimalDuration = optimal ?? 8;

  let durationScore: number;
  if (durationHours >= optimalDuration) {
    const excess = durationHours - optimalDuration;
    durationScore = Math.min(excess * 10, 40);
  } else {
    const deficit = optimalDuration - durationHours;
    durationScore = Math.min(deficit * 15, 100);
  }

  if (quality !== undefined && quality !== null) {
    const qualityScore = (1 - quality / 100) * 100;
    return clamp(durationScore * 0.6 + qualityScore * 0.4);
  }

  return clamp(durationScore);
}

function normalizeActivity(activeMinutes: number): number {
  const { optimal } = ACTIVITY_PARAMS;
  const optimalMinutes = optimal ?? 60;

  if (activeMinutes <= 0) {
    return 70;
  }

  if (activeMinutes <= optimalMinutes) {
    const ratio = activeMinutes / optimalMinutes;
    return clamp(70 - ratio * 50);
  }

  const excess = activeMinutes - optimalMinutes;
  const excessRatio = excess / optimalMinutes;
  return clamp(20 + excessRatio * 30);
}

function getEmotionStressScore(emotion: EmotionType): number {
  const score = EMOTION_STRESS_MAP[emotion];
  if (score !== undefined) {
    return score;
  }
  return 50;
}

function calculateConfidence(input: StressInput): number {
  let availableSources = 0;
  let totalWeight = 0;

  if (input.heartRate?.value != null) {
    availableSources++;
    totalWeight += WEIGHTS.heartRate;
  }
  if (input.hrv?.value != null) {
    availableSources++;
    totalWeight += WEIGHTS.hrv;
  }
  if (input.sleep?.duration != null) {
    availableSources++;
    totalWeight += WEIGHTS.sleep;
  }
  if (input.activity?.activeMinutes != null) {
    availableSources++;
    totalWeight += WEIGHTS.activity;
  }

  const biometricConfidence = totalWeight;
  const emotionConfidence = input.emotion ? EMOTION_WEIGHT : 0;

  const totalConfidence = biometricConfidence + emotionConfidence;

  return clamp(totalConfidence * 100);
}

function calculateBiometricScore(input: StressInput): {
  score: number;
  heartRateScore: number;
  hrvScore: number;
  sleepScore: number;
  activityScore: number;
} {
  let heartRateScore = 50;
  let hrvScore = 50;
  let sleepScore = 50;
  let activityScore = 50;

  const availableWeights: { key: keyof typeof WEIGHTS; score: number }[] = [];

  if (input.heartRate?.value != null) {
    heartRateScore = normalizeHeartRate(input.heartRate.value);
    availableWeights.push({ key: 'heartRate', score: heartRateScore });
  }

  if (input.hrv?.value != null) {
    hrvScore = normalizeHRV(input.hrv.value);
    availableWeights.push({ key: 'hrv', score: hrvScore });
  }

  if (input.sleep?.duration != null) {
    sleepScore = normalizeSleep(input.sleep.duration, input.sleep.quality);
    availableWeights.push({ key: 'sleep', score: sleepScore });
  }

  if (input.activity?.activeMinutes != null) {
    activityScore = normalizeActivity(input.activity.activeMinutes);
    availableWeights.push({ key: 'activity', score: activityScore });
  }

  let biometricScore: number;

  if (availableWeights.length === 0) {
    biometricScore = 50;
  } else {
    const totalWeight = availableWeights.reduce(
      (sum, item) => sum + WEIGHTS[item.key],
      0
    );

    biometricScore = availableWeights.reduce(
      (sum, item) => sum + (item.score * WEIGHTS[item.key]) / totalWeight,
      0
    );
  }

  return {
    score: clamp(biometricScore),
    heartRateScore: clamp(heartRateScore),
    hrvScore: clamp(hrvScore),
    sleepScore: clamp(sleepScore),
    activityScore: clamp(activityScore),
  };
}

function getStressLevel(score: number): StressLevel {
  if (score < 25) return 'low';
  if (score < 50) return 'moderate';
  if (score < 75) return 'high';
  return 'very_high';
}

export function calculateStress(input: StressInput): StressResult {
  const biometric = calculateBiometricScore(input);

  let combinedScore: number;
  let emotionScore = 50;

  const hasBiometrics =
    input.heartRate?.value != null ||
    input.hrv?.value != null ||
    input.sleep?.duration != null ||
    input.activity?.activeMinutes != null;

  const hasEmotion = input.emotion != null;

  if (hasEmotion) {
    emotionScore = getEmotionStressScore(input.emotion!);
  }

  if (hasBiometrics && hasEmotion) {
    combinedScore =
      biometric.score * BIOMETRIC_WEIGHT + emotionScore * EMOTION_WEIGHT;
  } else if (hasBiometrics) {
    combinedScore = biometric.score;
  } else if (hasEmotion) {
    combinedScore = emotionScore;
  } else {
    combinedScore = 50;
  }

  combinedScore = clamp(Math.round(combinedScore));

  const confidence = calculateConfidence(input);

  return {
    score: combinedScore,
    level: getStressLevel(combinedScore),
    components: {
      heartRateScore: Math.round(biometric.heartRateScore),
      hrvScore: Math.round(biometric.hrvScore),
      sleepScore: Math.round(biometric.sleepScore),
      activityScore: Math.round(biometric.activityScore),
      emotionScore: Math.round(emotionScore),
      biometricScore: Math.round(biometric.score),
      combinedScore,
    },
    confidence: Math.round(confidence),
    timestamp: new Date(),
  };
}

export function calculateStressDelta(
  before: StressResult,
  after: StressResult
): {
  delta: number;
  percentChange: number;
  improved: boolean;
} {
  const delta = after.score - before.score;
  const percentChange =
    before.score !== 0 ? (delta / before.score) * 100 : 0;

  return {
    delta,
    percentChange: Math.round(percentChange),
    improved: delta < 0,
  };
}

export function getStressLevelLabel(level: StressLevel): string {
  const labels: Record<StressLevel, string> = {
    low: 'Спокойно',
    moderate: 'Умеренный стресс',
    high: 'Высокий стресс',
    very_high: 'Очень высокий стресс',
  };
  return labels[level];
}

export function getStressLevelColor(level: StressLevel): string {
  const colors: Record<StressLevel, string> = {
    low: '#4CAF50',
    moderate: '#FFC107',
    high: '#FF9800',
    very_high: '#F44336',
  };
  return colors[level];
}

export function interpolateStressColor(score: number): string {
  const clampedScore = clamp(score);

  if (clampedScore < 25) {
    const t = clampedScore / 25;
    return lerpColor('#4CAF50', '#8BC34A', t);
  } else if (clampedScore < 50) {
    const t = (clampedScore - 25) / 25;
    return lerpColor('#8BC34A', '#FFC107', t);
  } else if (clampedScore < 75) {
    const t = (clampedScore - 50) / 25;
    return lerpColor('#FFC107', '#FF9800', t);
  } else {
    const t = (clampedScore - 75) / 25;
    return lerpColor('#FF9800', '#F44336', t);
  }
}

function lerpColor(color1: string, color2: string, t: number): string {
  const r1 = parseInt(color1.slice(1, 3), 16);
  const g1 = parseInt(color1.slice(3, 5), 16);
  const b1 = parseInt(color1.slice(5, 7), 16);

  const r2 = parseInt(color2.slice(1, 3), 16);
  const g2 = parseInt(color2.slice(3, 5), 16);
  const b2 = parseInt(color2.slice(5, 7), 16);

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function averageStressScores(scores: number[]): number {
  if (scores.length === 0) return 0;
  const sum = scores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / scores.length);
}

export function calculateStressTrend(
  scores: StressResult[]
): 'improving' | 'stable' | 'worsening' {
  if (scores.length < 2) return 'stable';

  const recentCount = Math.min(scores.length, 7);
  const recentScores = scores.slice(-recentCount).map((s) => s.score);

  let trendSum = 0;
  for (let i = 1; i < recentScores.length; i++) {
    trendSum += recentScores[i] - recentScores[i - 1];
  }

  const averageTrend = trendSum / (recentScores.length - 1);

  if (averageTrend < -3) return 'improving';
  if (averageTrend > 3) return 'worsening';
  return 'stable';
}

export {
  normalizeHeartRate,
  normalizeHRV,
  normalizeSleep,
  normalizeActivity,
  getEmotionStressScore,
  clamp,
};