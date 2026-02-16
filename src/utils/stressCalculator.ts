import { BiometricData } from '../models/BiometricData';

export interface StressLevel {
  level: number; // 0-100
  category: 'low' | 'moderate' | 'high' | 'critical';
  factors: StressFactor[];
  recommendation: string;
}

export interface StressFactor {
  name: string;
  impact: number; // 0-100
  value: number;
  normalRange: { min: number; max: number };
  description: string;
}

// Нормальные диапазоны биометрических показателей
const NORMAL_RANGES = {
  heartRate: { min: 60, max: 100, restingMin: 50, restingMax: 80 },
  hrv: { min: 20, max: 200, optimal: 50 },
  sleepHours: { min: 7, max: 9 },
  sleepQuality: { min: 70, max: 100 },
  steps: { min: 8000, max: 15000 },
  activeMinutes: { min: 30, max: 60 },
  respiratoryRate: { min: 12, max: 20 },
  bloodPressureSystolic: { min: 90, max: 120 },
  bloodPressureDiastolic: { min: 60, max: 80 },
  oxygenSaturation: { min: 95, max: 100 },
};

// Веса факторов в общем расчете стресса
const FACTOR_WEIGHTS = {
  heartRate: 0.25,
  hrv: 0.25,
  sleep: 0.20,
  activity: 0.15,
  respiratory: 0.10,
  bloodPressure: 0.05,
};

/**
 * Рассчитывает уровень стресса на основе биометрических данных
 */
export const calculateStressLevel = (data: BiometricData): StressLevel => {
  const factors: StressFactor[] = [];
  let totalStress = 0;
  let totalWeight = 0;

  // Анализ пульса
  if (data.heartRate) {
    const heartRateFactor = analyzeHeartRate(data.heartRate, data.restingHeartRate);
    factors.push(heartRateFactor);
    totalStress += heartRateFactor.impact * FACTOR_WEIGHTS.heartRate;
    totalWeight += FACTOR_WEIGHTS.heartRate;
  }

  // Анализ вариабельности сердечного ритма
  if (data.heartRateVariability) {
    const hrvFactor = analyzeHRV(data.heartRateVariability);
    factors.push(hrvFactor);
    totalStress += hrvFactor.impact * FACTOR_WEIGHTS.hrv;
    totalWeight += FACTOR_WEIGHTS.hrv;
  }

  // Анализ сна
  if (data.sleepHours !== undefined || data.sleepQuality !== undefined) {
    const sleepFactor = analyzeSleep(data.sleepHours, data.sleepQuality);
    factors.push(sleepFactor);
    totalStress += sleepFactor.impact * FACTOR_WEIGHTS.sleep;
    totalWeight += FACTOR_WEIGHTS.sleep;
  }

  // Анализ активности
  if (data.steps !== undefined || data.activeMinutes !== undefined) {
    const activityFactor = analyzeActivity(data.steps, data.activeMinutes);
    factors.push(activityFactor);
    totalStress += activityFactor.impact * FACTOR_WEIGHTS.activity;
    totalWeight += FACTOR_WEIGHTS.activity;
  }

  // Анализ дыхания
  if (data.respiratoryRate) {
    const respiratoryFactor = analyzeRespiratoryRate(data.respiratoryRate);
    factors.push(respiratoryFactor);
    totalStress += respiratoryFactor.impact * FACTOR_WEIGHTS.respiratory;
    totalWeight += FACTOR_WEIGHTS.respiratory;
  }

  // Анализ давления
  if (data.bloodPressureSystolic && data.bloodPressureDiastolic) {
    const bpFactor = analyzeBloodPressure(
      data.bloodPressureSystolic,
      data.bloodPressureDiastolic
    );
    factors.push(bpFactor);
    totalStress += bpFactor.impact * FACTOR_WEIGHTS.bloodPressure;
    totalWeight += FACTOR_WEIGHTS.bloodPressure;
  }

  // Нормализация уровня стресса
  const normalizedStress = totalWeight > 0 ? totalStress / totalWeight : 0;
  const stressLevel = Math.min(100, Math.max(0, normalizedStress));

  // Определение категории стресса
  const category = categorizeStress(stressLevel);

  // Генерация рекомендации
  const recommendation = generateRecommendation(stressLevel, factors);

  return {
    level: Math.round(stressLevel),
    category,
    factors: factors.sort((a, b) => b.impact - a.impact),
    recommendation,
  };
};

/**
 * Анализирует пульс
 */
const analyzeHeartRate = (
  heartRate: number,
  restingHeartRate?: number
): StressFactor => {
  const reference = restingHeartRate || NORMAL_RANGES.heartRate.restingMax;
  const normalMax = NORMAL_RANGES.heartRate.max;
  
  let impact = 0;
  let description = '';

  if (heartRate < NORMAL_RANGES.heartRate.min) {
    impact = 20;
    description = 'Пульс ниже нормы, возможна брадикардия';
  } else if (heartRate <= reference) {
    impact = 0;
    description = 'Пульс в норме';
  } else if (heartRate <= normalMax) {
    impact = ((heartRate - reference) / (normalMax - reference)) * 50;
    description = 'Пульс слегка повышен';
  } else {
    impact = 50 + ((heartRate - normalMax) / normalMax) * 50;
    description = 'Пульс значительно повышен';
  }

  return {
    name: 'Пульс',
    impact: Math.min(100, impact),
    value: heartRate,
    normalRange: { min: reference, max: normalMax },
    description,
  };
};

/**
 * Анализирует вариабельность сердечного ритма (HRV)
 */
const analyzeHRV = (hrv: number): StressFactor => {
  let impact = 0;
  let description = '';

  if (hrv < NORMAL_RANGES.hrv.min) {
    impact = 80;
    description = 'Критически низкая вариабельность - высокий стресс';
  } else if (hrv < NORMAL_RANGES.hrv.optimal) {
    impact = 100 - ((hrv - NORMAL_RANGES.hrv.min) / (NORMAL_RANGES.hrv.optimal - NORMAL_RANGES.hrv.min)) * 60;
    description = 'Пониженная вариабельность - умеренный стресс';
  } else if (hrv <= NORMAL_RANGES.hrv.max) {
    impact = 40 - ((hrv - NORMAL_RANGES.hrv.optimal) / (NORMAL_RANGES.hrv.max - NORMAL_RANGES.hrv.optimal)) * 40;
    description = 'Хорошая вариабельность';
  } else {
    impact = 0;
    description = 'Отличная вариабельность - низкий стресс';
  }

  return {
    name: 'Вариабельность пульса (HRV)',
    impact: Math.max(0, impact),
    value: hrv,
    normalRange: { min: NORMAL_RANGES.hrv.optimal, max: NORMAL_RANGES.hrv.max },
    description,
  };
};

/**
 * Анализирует качество сна
 */
const analyzeSleep = (
  sleepHours?: number,
  sleepQuality?: number
): StressFactor => {
  let impact = 0;
  let description = '';
  let value = 0;

  if (sleepHours !== undefined) {
    value = sleepHours;
    if (sleepHours < 5) {
      impact = 80;
      description = 'Критически мало сна';
    } else if (sleepHours < NORMAL_RANGES.sleepHours.min) {
      impact = 60;
      description = 'Недостаточно сна';
    } else if (sleepHours <= NORMAL_RANGES.sleepHours.max) {
      impact = 0;
      description = 'Нормальная продолжительность сна';
    } else if (sleepHours > 10) {
      impact = 40;
      description = 'Избыток сна, возможна усталость';
    }
  }

  if (sleepQuality !== undefined) {
    value = sleepQuality;
    const qualityImpact = 100 - sleepQuality;
    
    if (sleepQuality < 50) {
      description = 'Очень плохое качество сна';
    } else if (sleepQuality < NORMAL_RANGES.sleepQuality.min) {
      description = 'Плохое качество сна';
    } else {
      description = 'Хорошее качество сна';
    }
    
    impact = Math.max(impact, qualityImpact);
  }

  return {
    name: 'Сон',
    impact: Math.min(100, impact),
    value,
    normalRange: { 
      min: sleepHours !== undefined ? NORMAL_RANGES.sleepHours.min : NORMAL_RANGES.sleepQuality.min,
      max: sleepHours !== undefined ? NORMAL_RANGES.sleepHours.max : NORMAL_RANGES.sleepQuality.max
    },
    description,
  };
};

/**
 * Анализирует физическую активность
 */
const analyzeActivity = (
  steps?: number,
  activeMinutes?: number
): StressFactor => {
  let impact = 0;
  let description = '';
  let value = 0;

  if (steps !== undefined) {
    value = steps;
    if (steps < 3000) {
      impact = 60;
      description = 'Очень низкая активность';
    } else if (steps < NORMAL_RANGES.steps.min) {
      impact = 40;
      description = 'Низкая активность';
    } else if (steps <= NORMAL_RANGES.steps.max) {
      impact = 0;
      description = 'Нормальная активность';
    } else {
      impact = 0;
      description = 'Высокая активность';
    }
  }

  if (activeMinutes !== undefined) {
    value = activeMinutes;
    const minutesImpact = activeMinutes < NORMAL_RANGES.activeMinutes.min
      ? (NORMAL_RANGES.activeMinutes.min - activeMinutes) * 2
      : 0;
    
    if (activeMinutes < 15) {
      description = 'Критически низкая активность';
    } else if (activeMinutes < NORMAL_RANGES.activeMinutes.min) {
      description = 'Недостаточно активности';
    } else {
      description = 'Достаточная активность';
    }
    
    impact = Math.max(impact, minutesImpact);
  }

  return {
    name: 'Физическая активность',
    impact: Math.min(100, impact),
    value,
    normalRange: {
      min: steps !== undefined ? NORMAL_RANGES.steps.min : NORMAL_RANGES.activeMinutes.min,
      max: steps !== undefined ? NORMAL_RANGES.steps.max : NORMAL_RANGES.activeMinutes.max
    },
    description,
  };
};

/**
 * Анализирует частоту дыхания
 */
const analyzeRespiratoryRate = (respiratoryRate: number): StressFactor => {
  let impact = 0;
  let description = '';

  if (respiratoryRate < NORMAL_RANGES.respiratoryRate.min) {
    impact = 30;
    description = 'Замедленное дыхание';
  } else if (respiratoryRate <= NORMAL_RANGES.respiratoryRate.max) {
    impact = 0;
    description = 'Нормальная частота дыхания';
  } else if (respiratoryRate <= 25) {
    impact = ((respiratoryRate - NORMAL_RANGES.respiratoryRate.max) / 5) * 50;
    description = 'Учащенное дыхание';
  } else {
    impact = 50 + ((respiratoryRate - 25) / 10) * 50;
    description = 'Значительно учащенное дыхание';
  }

  return {
    name: 'Частота дыхания',
    impact: Math.min(100, impact),
    value: respiratoryRate,
    normalRange: NORMAL_RANGES.respiratoryRate,
    description,
  };
};

/**
 * Анализирует артериальное давление
 */
const analyzeBloodPressure = (
  systolic: number,
  diastolic: number
): StressFactor => {
  let impact = 0;
  let description = '';

  // Анализ систолического давления
  const systolicImpact = systolic < NORMAL_RANGES.bloodPressureSystolic.min
    ? 40
    : systolic > NORMAL_RANGES.bloodPressureSystolic.max
    ? ((systolic - NORMAL_RANGES.bloodPressureSystolic.max) / 40) * 70
    : 0;

  // Анализ диастолического давления
  const diastolicImpact = diastolic < NORMAL_RANGES.bloodPressureDiastolic.min
    ? 40
    : diastolic > NORMAL_RANGES.bloodPressureDiastolic.max
    ? ((diastolic - NORMAL_RANGES.bloodPressureDiastolic.max) / 20) * 70
    : 0;

  impact = Math.max(systolicImpact, diastolicImpact);

  if (systolic > 140 || diastolic > 90) {
    description = 'Повышенное давление - гипертония';
  } else if (systolic < 90 || diastolic < 60) {
    description = 'Пониженное давление - гипотония';
  } else if (systolic > 120 || diastolic > 80) {
    description = 'Слегка повышенное давление';
  } else {
    description = 'Нормальное давление';
  }

  return {
    name: 'Артериальное давление',
    impact: Math.min(100, impact),
    value: systolic,
    normalRange: NORMAL_RANGES.bloodPressureSystolic,
    description,
  };
};

/**
 * Категоризирует уровень стресса
 */
const categorizeStress = (level: number): 'low' | 'moderate' | 'high' | 'critical' => {
  if (level < 25) return 'low';
  if (level < 50) return 'moderate';
  if (level < 75