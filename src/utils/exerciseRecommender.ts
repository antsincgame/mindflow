import { Exercise } from '../models/Exercise';
import { Emotion } from '../models/Emotion';
import { BiometricData } from '../models/BiometricData';
import { exercises } from '../constants/exercises';

interface RecommendationScore {
  exercise: Exercise;
  score: number;
  reasons: string[];
}

interface RecommendationOptions {
  emotion: Emotion;
  biometricData?: BiometricData;
  timeAvailable?: number;
  previousExercises?: string[];
  userPreferences?: {
    favoriteTypes?: string[];
    dislikedExercises?: string[];
  };
}

export class ExerciseRecommender {
  private static readonly WEIGHTS = {
    EMOTION_MATCH: 10,
    HEART_RATE: 8,
    STRESS_LEVEL: 9,
    SLEEP_QUALITY: 6,
    ACTIVITY_LEVEL: 5,
    TIME_MATCH: 7,
    VARIETY: 4,
    USER_PREFERENCE: 8,
  };

  static recommendExercises(options: RecommendationOptions): Exercise[] {
    const {
      emotion,
      biometricData,
      timeAvailable,
      previousExercises = [],
      userPreferences = {},
    } = options;

    const scoredExercises = exercises
      .filter((exercise) => this.isExerciseAvailable(exercise, timeAvailable))
      .map((exercise) => ({
        exercise,
        score: this.calculateScore(
          exercise,
          emotion,
          biometricData,
          timeAvailable,
          previousExercises,
          userPreferences
        ),
        reasons: this.getRecommendationReasons(
          exercise,
          emotion,
          biometricData
        ),
      }))
      .sort((a, b) => b.score - a.score);

    return scoredExercises.slice(0, 5).map((item) => item.exercise);
  }

  static getBestExercise(options: RecommendationOptions): Exercise {
    const recommended = this.recommendExercises(options);
    return recommended[0];
  }

  private static calculateScore(
    exercise: Exercise,
    emotion: Emotion,
    biometricData?: BiometricData,
    timeAvailable?: number,
    previousExercises: string[] = [],
    userPreferences: RecommendationOptions['userPreferences'] = {}
  ): number {
    let score = 0;

    // Оценка соответствия эмоции
    score += this.scoreEmotionMatch(exercise, emotion);

    // Оценка на основе биометрики
    if (biometricData) {
      score += this.scoreBiometricMatch(exercise, biometricData);
    }

    // Оценка соответствия доступному времени
    if (timeAvailable) {
      score += this.scoreTimeMatch(exercise, timeAvailable);
    }

    // Оценка разнообразия (штраф за недавно выполненные)
    score += this.scoreVariety(exercise, previousExercises);

    // Оценка пользовательских предпочтений
    score += this.scoreUserPreferences(exercise, userPreferences);

    return Math.max(0, score);
  }

  private static scoreEmotionMatch(
    exercise: Exercise,
    emotion: Emotion
  ): number {
    const emotionId = emotion.id;
    const exerciseEmotions = exercise.targetEmotions || [];

    if (exerciseEmotions.includes(emotionId)) {
      return this.WEIGHTS.EMOTION_MATCH;
    }

    // Частичное совпадение для связанных эмоций
    const relatedEmotions = this.getRelatedEmotions(emotionId);
    const hasRelatedEmotion = exerciseEmotions.some((e) =>
      relatedEmotions.includes(e)
    );

    return hasRelatedEmotion ? this.WEIGHTS.EMOTION_MATCH * 0.5 : 0;
  }

  private static scoreBiometricMatch(
    exercise: Exercise,
    biometricData: BiometricData
  ): number {
    let score = 0;

    // Оценка на основе пульса
    if (biometricData.heartRate) {
      score += this.scoreHeartRate(exercise, biometricData.heartRate);
    }

    // Оценка на основе уровня стресса
    if (biometricData.stressLevel !== undefined) {
      score += this.scoreStressLevel(exercise, biometricData.stressLevel);
    }

    // Оценка на основе качества сна
    if (biometricData.sleepQuality !== undefined) {
      score += this.scoreSleepQuality(exercise, biometricData.sleepQuality);
    }

    // Оценка на основе уровня активности
    if (biometricData.activityLevel !== undefined) {
      score += this.scoreActivityLevel(exercise, biometricData.activityLevel);
    }

    return score;
  }

  private static scoreHeartRate(exercise: Exercise, heartRate: number): number {
    const restingHR = 60;
    const elevatedHR = 80;
    const highHR = 100;

    const hrDiff = heartRate - restingHR;

    // Высокий пульс - рекомендуем успокаивающие упражнения
    if (heartRate > highHR) {
      if (
        exercise.type === 'breathing' ||
        exercise.category === 'relaxation'
      ) {
        return this.WEIGHTS.HEART_RATE;
      }
      return this.WEIGHTS.HEART_RATE * 0.3;
    }

    // Слегка повышенный пульс - дыхательные упражнения
    if (heartRate > elevatedHR) {
      if (exercise.type === 'breathing') {
        return this.WEIGHTS.HEART_RATE * 0.8;
      }
      return this.WEIGHTS.HEART_RATE * 0.5;
    }

    // Нормальный пульс - любые упражнения подходят
    return this.WEIGHTS.HEART_RATE * 0.6;
  }

  private static scoreStressLevel(
    exercise: Exercise,
    stressLevel: number
  ): number {
    // stressLevel от 0 до 100

    if (stressLevel > 70) {
      // Высокий стресс - короткие интенсивные упражнения
      if (
        exercise.type === 'breathing' &&
        exercise.duration <= 5 * 60 * 1000
      ) {
        return this.WEIGHTS.STRESS_LEVEL;
      }
      if (exercise.category === 'quick-relief') {
        return this.WEIGHTS.STRESS_LEVEL * 0.9;
      }
      return this.WEIGHTS.STRESS_LEVEL * 0.4;
    }

    if (stressLevel > 40) {
      // Средний стресс - медитация и внимательность
      if (
        exercise.type === 'meditation' ||
        exercise.type === 'mindfulness'
      ) {
        return this.WEIGHTS.STRESS_LEVEL * 0.8;
      }
      return this.WEIGHTS.STRESS_LEVEL * 0.6;
    }

    // Низкий стресс - профилактические упражнения
    if (exercise.category === 'preventive') {
      return this.WEIGHTS.STRESS_LEVEL * 0.7;
    }

    return this.WEIGHTS.STRESS_LEVEL * 0.5;
  }

  private static scoreSleepQuality(
    exercise: Exercise,
    sleepQuality: number
  ): number {
    // sleepQuality от 0 до 100

    if (sleepQuality < 50) {
      // Плохой сон - энергизирующие и активирующие упражнения
      if (
        exercise.category === 'energizing' ||
        exercise.benefits?.includes('energy')
      ) {
        return this.WEIGHTS.SLEEP_QUALITY;
      }
      // Избегаем слишком расслабляющих упражнений днем
      if (exercise.category === 'sleep-preparation') {
        return 0;
      }
      return this.WEIGHTS.SLEEP_QUALITY * 0.5;
    }

    // Хороший сон - любые упражнения
    return this.WEIGHTS.SLEEP_QUALITY * 0.6;
  }

  private static scoreActivityLevel(
    exercise: Exercise,
    activityLevel: number
  ): number {
    // activityLevel от 0 до 100

    if (activityLevel < 30) {
      // Низкая активность - легкие, не требующие усилий упражнения
      if (exercise.intensity === 'low' || exercise.type === 'breathing') {
        return this.WEIGHTS.ACTIVITY_LEVEL;
      }
      return this.WEIGHTS.ACTIVITY_LEVEL * 0.6;
    }

    if (activityLevel > 70) {
      // Высокая активность - восстанавливающие упражнения
      if (
        exercise.category === 'recovery' ||
        exercise.benefits?.includes('recovery')
      ) {
        return this.WEIGHTS.ACTIVITY_LEVEL * 0.9;
      }
      return this.WEIGHTS.ACTIVITY_LEVEL * 0.5;
    }

    // Средняя активность - любые упражнения подходят
    return this.WEIGHTS.ACTIVITY_LEVEL * 0.7;
  }

  private static scoreTimeMatch(
    exercise: Exercise,
    timeAvailable: number
  ): number {
    const exerciseDuration = exercise.duration;

    // Идеальное совпадение
    if (exerciseDuration === timeAvailable) {
      return this.WEIGHTS.TIME_MATCH;
    }

    // Упражнение короче доступного времени (хорошо)
    if (exerciseDuration < timeAvailable) {
      const ratio = exerciseDuration / timeAvailable;
      if (ratio > 0.7) {
        return this.WEIGHTS.TIME_MATCH * 0.9;
      }
      if (ratio > 0.5) {
        return this.WEIGHTS.TIME_MATCH * 0.7;
      }
      return this.WEIGHTS.TIME_MATCH * 0.5;
    }

    // Упражнение длиннее доступного времени (плохо)
    if (exerciseDuration > timeAvailable) {
      const ratio = timeAvailable / exerciseDuration;
      if (ratio > 0.8) {
        return this.WEIGHTS.TIME_MATCH * 0.6;
      }
      return 0; // Слишком длинное упражнение
    }

    return this.WEIGHTS.TIME_MATCH * 0.5;
  }

  private static scoreVariety(
    exercise: Exercise,
    previousExercises: string[]
  ): number {
    const recentCount = 5;
    const recentExercises = previousExercises.slice(-recentCount);

    // Штраф за недавно выполненное упражнение
    const timesInRecent = recentExercises.filter(
      (id) => id === exercise.id
    ).length;

    if (timesInRecent === 0) {
      return this.WEIGHTS.VARIETY;
    }

    // Чем чаще упражнение в недавних, тем больше штраф
    const penalty = (timesInRecent / recentCount) * this.WEIGHTS.VARIETY;
    return this.WEIGHTS.VARIETY - penalty;
  }

  private static scoreUserPreferences(
    exercise: Exercise,
    preferences: RecommendationOptions['userPreferences'] = {}
  ): number {
    let score = 0;

    // Бонус за любимые типы
    if (
      preferences.favoriteTypes &&
      preferences.favoriteTypes.includes(exercise.type)
    ) {
      score += this.WEIGHTS.USER_PREFERENCE;
    }

    // Штраф за нелюбимые упражнения
    if (
      preferences.dislikedExercises &&
      preferences.dislikedExercises.includes(exercise.id)
    ) {
      score -= this.WEIGHTS.USER_PREFERENCE * 2;
    }

    return score;
  }

  private static isExerciseAvailable(
    exercise: Exercise,
    timeAvailable?: number
  ): boolean {
    if (!timeAvailable) {
      return true;
    }

    // Упражнение доступно, если оно не превышает доступное время более чем на 20%
    return exercise.duration <= timeAvailable * 1.2;
  }

  private static getRecommendationReasons(
    exercise: Exercise,
    emotion: Emotion,
    biometricData?: BiometricData
  ): string[] {
    const reasons: string[] = [];

    // Причина на основе эмоции
    if (exercise.targetEmotions?.includes(emotion.id)) {
      reasons.push(`Эффективно при ${emotion.name.toLowerCase()}`);
    }

    // Причины на основе биометрики
    if (biometricData) {
      if (biometricData.heartRate && biometricData.heartRate > 90) {
        if (exercise.type === 'breathing') {
          reasons.push('Поможет снизить частоту пульса');
        }
      }

      if (biometricData.stressLevel && biometricData.stressLevel > 70) {
        if (exercise.category === 'quick-relief') {
          reasons.push('Быстрое снятие стресса');
        }
      }

      if (biometricData.sleepQuality && biometricData.sleepQuality < 50) {
        if (exercise.benefits?.includes('energy')) {
          reasons.push('Повысит энергию после плохого сна');
        }
      }
    }

    // Причины на основе характеристик упражнения
    if (exercise.duration <= 5 * 60 * 1000) {
      reasons.push('Быстрое упражнение');
    }

    if (exercise.difficulty === 'beginner') {
      reasons.push('Подходит для начинающих');
    }

    if (exercise.benefits) {
      const mainBenefit = exercise.benefits[0];
      if (mainBenefit) {
        const benefitLabels: Record<string, string> = {
          'stress-relief': 'Снимает стресс',
          relaxation: 'Глубокое расслабление',
          focus: 'Улучшает концентрацию',
          energy: 'Повышает энергию',
          'sleep-quality': 'Улучшает сон',
          'emotional-balance': 'Эмоциональный баланс',
          recovery: 'Восстановление',
        };
        if (benefitLabels[mainBenefit]) {
          reasons.push(benefitLabels[mainBenefit]);
        }
      }
    }

    return reasons.slice(0, 3); // Максимум 3 причины
  }

  private static getRelatedEmotions(emotionId: string): string[] {
    const emotionRelations: Record<string, string[]> = {
      stress: ['anxiety', 'fatigue'],
      anxiety: ['stress', 'sadness'],
      sadness: ['anxiety', 'fatigue'],
      fatigue: ['stress', 'sadness'],
    };

    return emotionRelations[emotionId] || [];
  }

  static