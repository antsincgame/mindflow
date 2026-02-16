export enum EmotionType {
  ANXIETY = 'anxiety',
  STRESS = 'stress',
  SADNESS = 'sadness',
  ANGER = 'anger',
  FEAR = 'fear',
  OVERWHELM = 'overwhelm',
  LONELINESS = 'loneliness',
  FRUSTRATION = 'frustration',
}

export enum EmotionIntensity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  EXTREME = 'extreme',
}

export interface EmotionColor {
  primary: string;
  secondary: string;
  gradient: string[];
}

export interface EmotionIcon {
  name: string;
  type: 'ionicons' | 'material' | 'feather' | 'fontawesome';
}

export interface Emotion {
  id: string;
  type: EmotionType;
  name: string;
  description: string;
  intensity: EmotionIntensity;
  color: EmotionColor;
  icon: EmotionIcon;
  keywords: string[];
  relatedEmotions: EmotionType[];
  physicalSymptoms: string[];
  mentalSymptoms: string[];
  recommendedExerciseTypes: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface EmotionLog {
  id: string;
  emotionType: EmotionType;
  intensity: EmotionIntensity;
  timestamp: Date;
  notes?: string;
  triggers?: string[];
  context?: string;
  biometricSnapshot?: {
    heartRate?: number;
    heartRateVariability?: number;
    respiratoryRate?: number;
    bloodPressure?: {
      systolic: number;
      diastolic: number;
    };
  };
  location?: {
    latitude: number;
    longitude: number;
  };
  weather?: {
    temperature: number;
    condition: string;
  };
  duration?: number;
  resolution?: EmotionResolution;
}

export interface EmotionResolution {
  resolvedAt: Date;
  method: 'exercise' | 'meditation' | 'breathing' | 'other';
  exerciseId?: string;
  effectiveness: number;
  finalIntensity: EmotionIntensity;
  notes?: string;
}

export interface EmotionPattern {
  emotionType: EmotionType;
  frequency: number;
  averageIntensity: number;
  commonTriggers: string[];
  timeOfDayDistribution: {
    morning: number;
    afternoon: number;
    evening: number;
    night: number;
  };
  dayOfWeekDistribution: {
    [key: string]: number;
  };
  averageDuration: number;
  mostEffectiveResolutions: {
    method: string;
    successRate: number;
  }[];
}

export interface EmotionStatistics {
  totalLogs: number;
  uniqueEmotions: number;
  mostFrequentEmotion: EmotionType;
  averageIntensity: number;
  totalDuration: number;
  resolutionRate: number;
  patterns: EmotionPattern[];
  trends: {
    increasing: EmotionType[];
    decreasing: EmotionType[];
    stable: EmotionType[];
  };
  lastUpdated: Date;
}

export interface EmotionSelection {
  emotion: Emotion;
  selectedAt: Date;
  intensity: EmotionIntensity;
  userNotes?: string;
  biometricData?: {
    heartRate?: number;
    heartRateVariability?: number;
    stressLevel?: number;
  };
}

export interface EmotionCategory {
  id: string;
  name: string;
  description: string;
  emotions: EmotionType[];
  color: string;
  icon: EmotionIcon;
}

export const EMOTION_CATEGORIES: EmotionCategory[] = [
  {
    id: 'stress-anxiety',
    name: 'Стресс и тревога',
    description: 'Эмоции, связанные со стрессом и беспокойством',
    emotions: [EmotionType.ANXIETY, EmotionType.STRESS, EmotionType.OVERWHELM],
    color: '#FF6B6B',
    icon: { name: 'alert-circle', type: 'feather' },
  },
  {
    id: 'sadness-loneliness',
    name: 'Грусть и одиночество',
    description: 'Эмоции, связанные с печалью и изоляцией',
    emotions: [EmotionType.SADNESS, EmotionType.LONELINESS],
    color: '#4ECDC4',
    icon: { name: 'cloud-rain', type: 'feather' },
  },
  {
    id: 'anger-frustration',
    name: 'Гнев и раздражение',
    description: 'Эмоции, связанные с агрессией и недовольством',
    emotions: [EmotionType.ANGER, EmotionType.FRUSTRATION],
    color: '#FF8C42',
    icon: { name: 'zap', type: 'feather' },
  },
  {
    id: 'fear',
    name: 'Страх',
    description: 'Эмоции, связанные со страхом и опасениями',
    emotions: [EmotionType.FEAR],
    color: '#9B59B6',
    icon: { name: 'shield-off', type: 'feather' },
  },
];

export const EMOTION_INTENSITY_LEVELS = {
  [EmotionIntensity.LOW]: {
    level: 1,
    label: 'Слабая',
    description: 'Легкое проявление эмоции',
    color: '#A8E6CF',
    range: [0, 25],
  },
  [EmotionIntensity.MEDIUM]: {
    level: 2,
    label: 'Средняя',
    description: 'Умеренное проявление эмоции',
    color: '#FFD93D',
    range: [26, 50],
  },
  [EmotionIntensity.HIGH]: {
    level: 3,
    label: 'Сильная',
    description: 'Значительное проявление эмоции',
    color: '#FF8C42',
    range: [51, 75],
  },
  [EmotionIntensity.EXTREME]: {
    level: 4,
    label: 'Экстремальная',
    description: 'Очень сильное проявление эмоции',
    color: '#FF6B6B',
    range: [76, 100],
  },
};

export interface EmotionValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export const validateEmotion = (emotion: Partial<Emotion>): EmotionValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!emotion.type) {
    errors.push('Тип эмоции обязателен');
  }

  if (!emotion.name || emotion.name.trim().length === 0) {
    errors.push('Название эмоции обязательно');
  }

  if (!emotion.intensity) {
    errors.push('Интенсивность эмоции обязательна');
  }

  if (emotion.keywords && emotion.keywords.length === 0) {
    warnings.push('Рекомендуется добавить ключевые слова');
  }

  if (emotion.physicalSymptoms && emotion.physicalSymptoms.length === 0) {
    warnings.push('Рекомендуется указать физические симптомы');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const validateEmotionLog = (log: Partial<EmotionLog>): EmotionValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!log.emotionType) {
    errors.push('Тип эмоции обязателен');
  }

  if (!log.intensity) {
    errors.push('Интенсивность обязательна');
  }

  if (!log.timestamp) {
    errors.push('Временная метка обязательна');
  }

  if (log.timestamp && log.timestamp > new Date()) {
    errors.push('Дата не может быть в будущем');
  }

  if (!log.notes || log.notes.trim().length === 0) {
    warnings.push('Рекомендуется добавить заметки');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

export const getEmotionIntensityFromScore = (score: number): EmotionIntensity => {
  if (score <= 25) return EmotionIntensity.LOW;
  if (score <= 50) return EmotionIntensity.MEDIUM;
  if (score <= 75) return EmotionIntensity.HIGH;
  return EmotionIntensity.EXTREME;
};

export const getEmotionScoreFromIntensity = (intensity: EmotionIntensity): number => {
  const levels = EMOTION_INTENSITY_LEVELS[intensity];
  return (levels.range[0] + levels.range[1]) / 2;
};

export const compareEmotionIntensity = (
  a: EmotionIntensity,
  b: EmotionIntensity
): number => {
  const levelA = EMOTION_INTENSITY_LEVELS[a].level;
  const levelB = EMOTION_INTENSITY_LEVELS[b].level;
  return levelA - levelB;
};

export const getEmotionsByCategory = (category: string): EmotionType[] => {
  const cat = EMOTION_CATEGORIES.find((c) => c.id === category);
  return cat ? cat.emotions : [];
};

export const getCategoryForEmotion = (emotionType: EmotionType): EmotionCategory | undefined => {
  return EMOTION_CATEGORIES.find((cat) => cat.emotions.includes(emotionType));
};

export const createEmotionLog = (
  emotionType: EmotionType,
  intensity: EmotionIntensity,
  notes?: string
): EmotionLog => {
  return {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    emotionType,
    intensity,
    timestamp: new Date(),
    notes,
    triggers: [],
  };
};

export const calculateEmotionDuration = (log: EmotionLog): number => {
  if (!log.resolution) return 0;
  return log.resolution.resolvedAt.getTime() - log.timestamp.getTime();
};

export const isEmotionResolved = (log: EmotionLog): boolean => {
  return log.resolution !== undefined;
};

export const getEmotionEffectiveness = (log: EmotionLog): number => {
  if (!log.resolution) return 0;
  return log.resolution.effectiveness;
};