import { BiometricData } from '../models/BiometricData';

/**
 * Рассчитывает уровень стресса на основе биометрических данных
 * @param data Биометрические данные
 * @returns Уровень стресса от 0 до 100
 */
export const calculateStressLevel = (data: BiometricData): number => {
  if (!data.heartRate && !data.heartRateVariability && !data.respiratoryRate) {
    return 0;
  }

  let stressScore = 0;
  let factorsCount = 0;

  // Анализ частоты сердечных сокращений (ЧСС)
  if (data.heartRate) {
    factorsCount++;
    if (data.heartRate > 100) {
      // Тахикардия - высокий стресс
      stressScore += Math.min(100, ((data.heartRate - 60) / 40) * 100);
    } else if (data.heartRate > 80) {
      // Повышенная ЧСС - средний стресс
      stressScore += ((data.heartRate - 60) / 40) * 60;
    } else if (data.heartRate >= 60) {
      // Нормальная ЧСС - низкий стресс
      stressScore += ((data.heartRate - 60) / 20) * 20;
    }
  }

  // Анализ вариабельности сердечного ритма (HRV)
  // Низкая HRV указывает на высокий стресс
  if (data.heartRateVariability) {
    factorsCount++;
    if (data.heartRateVariability < 20) {
      // Очень низкая HRV - критический стресс
      stressScore += 90;
    } else if (data.heartRateVariability < 50) {
      // Низкая HRV - высокий стресс
      stressScore += 70;
    } else if (data.heartRateVariability < 100) {
      // Средняя HRV - умеренный стресс
      stressScore += 40;
    } else {
      // Высокая HRV - низкий стресс
      stressScore += 10;
    }
  }

  // Анализ частоты дыхания
  if (data.respiratoryRate) {
    factorsCount++;
    if (data.respiratoryRate > 20) {
      // Учащенное дыхание - высокий стресс
      stressScore += Math.min(100, ((data.respiratoryRate - 12) / 8) * 100);
    } else if (data.respiratoryRate > 16) {
      // Слегка учащенное - средний стресс
      stressScore += ((data.respiratoryRate - 12) / 8) * 50;
    } else {
      // Нормальное дыхание - низкий стресс
      stressScore += 15;
    }
  }

  return factorsCount > 0 ? Math.round(stressScore / factorsCount) : 0;
};

/**
 * Определяет категорию стресса по числовому значению
 * @param stressLevel Уровень стресса (0-100)
 * @returns Категория стресса
 */
export const getStressCategory = (
  stressLevel: number
): 'low' | 'moderate' | 'high' | 'critical' => {
  if (stressLevel < 25) return 'low';
  if (stressLevel < 50) return 'moderate';
  if (stressLevel < 75) return 'high';
  return 'critical';
};

/**
 * Рассчитывает целевую частоту сердечных сокращений для релаксации
 * @param currentHeartRate Текущая ЧСС
 * @param restingHeartRate Пульс в покое (опционально)
 * @returns Целевая ЧСС для достижения расслабления
 */
export const calculateTargetHeartRate = (
  currentHeartRate: number,
  restingHeartRate?: number
): number => {
  const resting = restingHeartRate || 60;
  const target = resting + (currentHeartRate - resting) * 0.3;
  return Math.round(Math.max(resting, target));
};

/**
 * Рассчитывает прогресс релаксации на основе изменения ЧСС
 * @param initialHeartRate Начальная ЧСС
 * @param currentHeartRate Текущая ЧСС
 * @param targetHeartRate Целевая ЧСС
 * @returns Прогресс от 0 до 100
 */
export const calculateRelaxationProgress = (
  initialHeartRate: number,
  currentHeartRate: number,
  targetHeartRate: number
): number => {
  if (initialHeartRate <= targetHeartRate) return 100;

  const totalDecrease = initialHeartRate - targetHeartRate;
  const currentDecrease = initialHeartRate - currentHeartRate;

  const progress = (currentDecrease / totalDecrease) * 100;
  return Math.max(0, Math.min(100, Math.round(progress)));
};

/**
 * Оценивает качество дыхания
 * @param respiratoryRate Частота дыхания (вдохов в минуту)
 * @returns Оценка качества от 0 до 100
 */
export const assessBreathingQuality = (respiratoryRate: number): number => {
  // Оптимальная частота дыхания 12-16 вдохов в минуту
  const optimal = 14;
  const deviation = Math.abs(respiratoryRate - optimal);

  if (deviation === 0) return 100;
  if (deviation <= 2) return 90;
  if (deviation <= 4) return 70;
  if (deviation <= 6) return 50;
  if (deviation <= 8) return 30;
  return 10;
};

/**
 * Рассчитывает индекс восстановления на основе HRV
 * @param currentHRV Текущая HRV
 * @param baselineHRV Базовая HRV пользователя (опционально)
 * @returns Индекс восстановления от 0 до 100
 */
export const calculateRecoveryIndex = (
  currentHRV: number,
  baselineHRV?: number
): number => {
  const baseline = baselineHRV || 60;

  if (currentHRV >= baseline * 1.2) return 100; // Отличное восстановление
  if (currentHRV >= baseline) return 80; // Хорошее восстановление
  if (currentHRV >= baseline * 0.8) return 60; // Среднее восстановление
  if (currentHRV >= baseline * 0.6) return 40; // Низкое восстановление
  return 20; // Очень низкое восстановление
};

/**
 * Определяет оптимальную продолжительность упражнения на основе биометрики
 * @param data Биометрические данные
 * @returns Рекомендуемая продолжительность в минутах
 */
export const recommendExerciseDuration = (data: BiometricData): number => {
  const stressLevel = calculateStressLevel(data);

  if (stressLevel >= 75) return 15; // Критический стресс - длинная сессия
  if (stressLevel >= 50) return 10; // Высокий стресс - средняя сессия
  if (stressLevel >= 25) return 7; // Умеренный стресс - короткая сессия
  return 5; // Низкий стресс - быстрая сессия
};

/**
 * Рассчитывает средние биометрические показатели за период
 * @param dataPoints Массив биометрических данных
 * @returns Средние значения
 */
export const calculateAverageBiometrics = (
  dataPoints: BiometricData[]
): Partial<BiometricData> => {
  if (dataPoints.length === 0) return {};

  const sum = dataPoints.reduce(
    (acc, data) => ({
      heartRate: (acc.heartRate || 0) + (data.heartRate || 0),
      heartRateVariability:
        (acc.heartRateVariability || 0) + (data.heartRateVariability || 0),
      respiratoryRate:
        (acc.respiratoryRate || 0) + (data.respiratoryRate || 0),
      oxygenSaturation:
        (acc.oxygenSaturation || 0) + (data.oxygenSaturation || 0),
      bloodPressureSystolic:
        (acc.bloodPressureSystolic || 0) + (data.bloodPressureSystolic || 0),
      bloodPressureDiastolic:
        (acc.bloodPressureDiastolic || 0) + (data.bloodPressureDiastolic || 0),
    }),
    {} as Partial<BiometricData>
  );

  const count = dataPoints.length;

  return {
    heartRate: sum.heartRate ? Math.round(sum.heartRate / count) : undefined,
    heartRateVariability: sum.heartRateVariability
      ? Math.round(sum.heartRateVariability / count)
      : undefined,
    respiratoryRate: sum.respiratoryRate
      ? Math.round(sum.respiratoryRate / count)
      : undefined,
    oxygenSaturation: sum.oxygenSaturation
      ? Math.round(sum.oxygenSaturation / count)
      : undefined,
    bloodPressureSystolic: sum.bloodPressureSystolic
      ? Math.round(sum.bloodPressureSystolic / count)
      : undefined,
    bloodPressureDiastolic: sum.bloodPressureDiastolic
      ? Math.round(sum.bloodPressureDiastolic / count)
      : undefined,
    timestamp: new Date(),
  };
};

/**
 * Определяет тренд изменения биометрических показателей
 * @param dataPoints Массив биометрических данных (отсортированный по времени)
 * @returns Тренд: 'improving' | 'stable' | 'declining'
 */
export const analyzeBiometricTrend = (
  dataPoints: BiometricData[]
): 'improving' | 'stable' | 'declining' => {
  if (dataPoints.length < 3) return 'stable';

  const stressLevels = dataPoints.map((data) => calculateStressLevel(data));

  const recentAvg =
    stressLevels.slice(-3).reduce((a, b) => a + b, 0) / 3;
  const olderAvg =
    stressLevels.slice(0, 3).reduce((a, b) => a + b, 0) / 3;

  const difference = olderAvg - recentAvg;

  if (difference > 10) return 'improving'; // Стресс снижается
  if (difference < -10) return 'declining'; // Стресс растет
  return 'stable';
};

/**
 * Рассчитывает эффективность упражнения на основе изменения биометрики
 * @param before Биометрические данные до упражнения
 * @param after Биометрические данные после упражнения
 * @returns Эффективность от 0 до 100
 */
export const calculateExerciseEffectiveness = (
  before: BiometricData,
  after: BiometricData
): number => {
  const stressBefore = calculateStressLevel(before);
  const stressAfter = calculateStressLevel(after);

  const stressReduction = stressBefore - stressAfter;
  const effectiveness = (stressReduction / stressBefore) * 100;

  return Math.max(0, Math.min(100, Math.round(effectiveness)));
};

/**
 * Проверяет, находятся ли биометрические показатели в норме
 * @param data Биометрические данные
 * @returns Объект с флагами нормальности для каждого показателя
 */
export const checkBiometricNorms = (
  data: BiometricData
): {
  heartRate: boolean;
  heartRateVariability: boolean;
  respiratoryRate: boolean;
  oxygenSaturation: boolean;
  bloodPressure: boolean;
} => {
  return {
    heartRate: data.heartRate
      ? data.heartRate >= 60 && data.heartRate <= 100
      : true,
    heartRateVariability: data.heartRateVariability
      ? data.heartRateVariability >= 50
      : true,
    respiratoryRate: data.respiratoryRate
      ? data.respiratoryRate >= 12 && data.respiratoryRate <= 20
      : true,
    oxygenSaturation: data.oxygenSaturation
      ? data.oxygenSaturation >= 95
      : true,
    bloodPressure:
      data.bloodPressureSystolic && data.bloodPressureDiastolic
        ? data.bloodPressureSystolic >= 90 &&
          data.bloodPressureSystolic <= 140 &&
          data.bloodPressureDiastolic >= 60 &&
          data.bloodPressureDiastolic <= 90
        : true,
  };
};

/**
 * Генерирует рекомендации на основе биометрических данных
 * @param data Биометрические данные
 * @returns Массив текстовых рекомендаций
 */
export const generateBiometricRecommendations = (
  data: BiometricData
): string[] => {
  const recommendations: string[] = [];
  const norms = checkBiometricNorms(data);

  if (!norms.heartRate && data.heartRate) {
    if (data.heartRate > 100) {
      recommendations.push(
        'Ваш пульс повышен. Попробуйте дыхательные упражнения для успокоения.'
      );
    } else if (data.heartRate < 60) {
      recommendations.push(
        'Ваш пульс ниже нормы. Если чувствуете себя хорошо, это может быть признаком хорошей физической формы.'
      );
    }
  }

  if (!norms.heartRateVariability && data.heartRateVariability) {
    recommendations.push(
      'Низкая вариабельность сердечного ритма может указывать на стресс. Уделите время релаксации.'
    );
  }

  if (!norms.respiratoryRate && data.respiratoryRate) {
    if (data.respiratoryRate > 20) {
      recommendations.push(
        'Ваше дыхание учащено. Практикуйте медленное глубокое дыхание.'
      );
    }
  }

  if (!norms.oxygenSaturation && data.oxygenSaturation) {
    recommendations.push(
      'Сатурация кислорода ниже нормы. Обеспечьте доступ свежего воздуха.'
    );
  }

  if (!n