import { Exercise } from '../models/Exercise';
import { BiometricData } from '../models/BiometricData';
import { Emotion } from '../models/Emotion';
import { exerciseData } from '../utils/exerciseData';

export interface RecommendationCriteria {
  emotionId: string;
  biometricData?: BiometricData;
  previousExercises?: string[];
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  availableTime?: number; // в минутах
  stressLevel?: number; // 0-100
}

export interface RecommendationResult {
  exercises: Exercise[];
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

class ExerciseRecommendationService {
  private readonly STRESS_THRESHOLD_HIGH = 70;
  private readonly STRESS_THRESHOLD_MEDIUM = 40;
  private readonly HR_THRESHOLD_HIGH = 100;
  private readonly HR_THRESHOLD_LOW = 60;

  /**
   * Получить рекомендованные упражнения на основе критериев
   */
  getRecommendations(criteria: RecommendationCriteria): RecommendationResult {
    const allExercises = this.getExercisesForEmotion(criteria.emotionId);
    
    let filteredExercises = this.filterByTime(allExercises, criteria.availableTime);
    filteredExercises = this.filterByPreviousExercises(filteredExercises, criteria.previousExercises);
    
    const scoredExercises = this.scoreExercises(filteredExercises, criteria);
    const sortedExercises = scoredExercises.sort((a, b) => b.score - a.score);
    
    const topExercises = sortedExercises.slice(0, 5).map(item => item.exercise);
    
    const reason = this.generateRecommendationReason(criteria);
    const priority = this.calculatePriority(criteria);

    return {
      exercises: topExercises,
      reason,
      priority
    };
  }

  /**
   * Получить упражнения для конкретной эмоции
   */
  private getExercisesForEmotion(emotionId: string): Exercise[] {
    return exerciseData.filter(exercise => exercise.emotionIds.includes(emotionId));
  }

  /**
   * Фильтровать упражнения по доступному времени
   */
  private filterByTime(exercises: Exercise[], availableTime?: number): Exercise[] {
    if (!availableTime) return exercises;
    
    return exercises.filter(exercise => exercise.duration <= availableTime);
  }

  /**
   * Фильтровать упражнения, исключая недавно выполненные
   */
  private filterByPreviousExercises(exercises: Exercise[], previousExercises?: string[]): Exercise[] {
    if (!previousExercises || previousExercises.length === 0) return exercises;
    
    // Исключаем последние 3 упражнения для разнообразия
    const recentExercises = previousExercises.slice(-3);
    return exercises.filter(exercise => !recentExercises.includes(exercise.id));
  }

  /**
   * Оценить упражнения на основе критериев
   */
  private scoreExercises(
    exercises: Exercise[],
    criteria: RecommendationCriteria
  ): Array<{ exercise: Exercise; score: number }> {
    return exercises.map(exercise => ({
      exercise,
      score: this.calculateExerciseScore(exercise, criteria)
    }));
  }

  /**
   * Рассчитать оценку упражнения
   */
  private calculateExerciseScore(exercise: Exercise, criteria: RecommendationCriteria): number {
    let score = 50; // Базовая оценка

    // Оценка на основе биометрических данных
    if (criteria.biometricData) {
      score += this.getBiometricScore(exercise, criteria.biometricData);
    }

    // Оценка на основе уровня стресса
    if (criteria.stressLevel !== undefined) {
      score += this.getStressScore(exercise, criteria.stressLevel);
    }

    // Оценка на основе времени суток
    if (criteria.timeOfDay) {
      score += this.getTimeOfDayScore(exercise, criteria.timeOfDay);
    }

    // Оценка на основе популярности упражнения
    score += this.getPopularityScore(exercise);

    // Оценка на основе эффективности упражнения
    score += this.getEffectivenessScore(exercise);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Оценка на основе биометрических данных
   */
  private getBiometricScore(exercise: Exercise, biometricData: BiometricData): number {
    let score = 0;

    const heartRate = biometricData.heartRate;
    const hrVariability = biometricData.heartRateVariability;

    // Высокий пульс - рекомендуем успокаивающие упражнения
    if (heartRate && heartRate > this.HR_THRESHOLD_HIGH) {
      if (exercise.category === 'breathing' || exercise.category === 'meditation') {
        score += 15;
      }
    }

    // Низкий пульс - можно более активные упражнения
    if (heartRate && heartRate < this.HR_THRESHOLD_LOW) {
      if (exercise.category === 'physical' || exercise.category === 'movement') {
        score += 10;
      }
    }

    // Низкая вариабельность пульса - стресс
    if (hrVariability && hrVariability < 50) {
      if (exercise.category === 'breathing' || exercise.category === 'meditation') {
        score += 15;
      }
    }

    // Высокая вариабельность - хорошее состояние
    if (hrVariability && hrVariability > 100) {
      score += 5; // Любое упражнение подходит
    }

    return score;
  }

  /**
   * Оценка на основе уровня стресса
   */
  private getStressScore(exercise: Exercise, stressLevel: number): number {
    let score = 0;

    if (stressLevel > this.STRESS_THRESHOLD_HIGH) {
      // Высокий стресс - приоритет успокаивающим упражнениям
      if (exercise.category === 'breathing') score += 20;
      if (exercise.category === 'meditation') score += 15;
      if (exercise.category === 'visualization') score += 10;
    } else if (stressLevel > this.STRESS_THRESHOLD_MEDIUM) {
      // Средний стресс - сбалансированный подход
      if (exercise.category === 'breathing') score += 10;
      if (exercise.category === 'meditation') score += 10;
      if (exercise.category === 'physical') score += 5;
    } else {
      // Низкий стресс - можно любые упражнения
      score += 5;
    }

    return score;
  }

  /**
   * Оценка на основе времени суток
   */
  private getTimeOfDayScore(exercise: Exercise, timeOfDay: string): number {
    let score = 0;

    switch (timeOfDay) {
      case 'morning':
        if (exercise.category === 'physical' || exercise.category === 'movement') {
          score += 10;
        }
        if (exercise.category === 'breathing') {
          score += 5;
        }
        break;
      
      case 'afternoon':
        if (exercise.category === 'breathing' || exercise.category === 'meditation') {
          score += 10;
        }
        break;
      
      case 'evening':
        if (exercise.category === 'meditation' || exercise.category === 'visualization') {
          score += 10;
        }
        if (exercise.category === 'breathing') {
          score += 8;
        }
        break;
      
      case 'night':
        if (exercise.category === 'meditation' || exercise.category === 'breathing') {
          score += 15;
        }
        if (exercise.category === 'visualization') {
          score += 10;
        }
        break;
    }

    return score;
  }

  /**
   * Оценка на основе популярности
   */
  private getPopularityScore(exercise: Exercise): number {
    // Симуляция популярности на основе сложности
    // В реальном приложении это должно быть из аналитики
    const popularityMap: Record<string, number> = {
      'beginner': 10,
      'intermediate': 7,
      'advanced': 5
    };

    return popularityMap[exercise.difficulty] || 5;
  }

  /**
   * Оценка на основе эффективности
   */
  private getEffectivenessScore(exercise: Exercise): number {
    // Симуляция эффективности на основе длительности и сложности
    let score = 0;

    // Средняя длительность (5-10 минут) считается оптимальной
    if (exercise.duration >= 5 && exercise.duration <= 10) {
      score += 5;
    }

    // Упражнения среднего уровня часто наиболее эффективны
    if (exercise.difficulty === 'intermediate') {
      score += 5;
    }

    return score;
  }

  /**
   * Сгенерировать причину рекомендации
   */
  private generateRecommendationReason(criteria: RecommendationCriteria): string {
    const reasons: string[] = [];

    if (criteria.stressLevel !== undefined) {
      if (criteria.stressLevel > this.STRESS_THRESHOLD_HIGH) {
        reasons.push('Обнаружен высокий уровень стресса');
      } else if (criteria.stressLevel > this.STRESS_THRESHOLD_MEDIUM) {
        reasons.push('Умеренный уровень стресса');
      }
    }

    if (criteria.biometricData?.heartRate) {
      if (criteria.biometricData.heartRate > this.HR_THRESHOLD_HIGH) {
        reasons.push('Повышенный пульс');
      }
    }

    if (criteria.timeOfDay) {
      const timeMessages: Record<string, string> = {
        'morning': 'Утренние упражнения для бодрости',
        'afternoon': 'Дневная практика для восстановления',
        'evening': 'Вечерние упражнения для расслабления',
        'night': 'Ночные практики для улучшения сна'
      };
      reasons.push(timeMessages[criteria.timeOfDay]);
    }

    if (criteria.availableTime) {
      reasons.push(`Упражнения до ${criteria.availableTime} минут`);
    }

    return reasons.length > 0 
      ? reasons.join('. ') 
      : 'Рекомендации на основе вашей эмоции';
  }

  /**
   * Рассчитать приоритет рекомендации
   */
  private calculatePriority(criteria: RecommendationCriteria): 'high' | 'medium' | 'low' {
    if (criteria.stressLevel && criteria.stressLevel > this.STRESS_THRESHOLD_HIGH) {
      return 'high';
    }

    if (criteria.biometricData?.heartRate && 
        criteria.biometricData.heartRate > this.HR_THRESHOLD_HIGH) {
      return 'high';
    }

    if (criteria.stressLevel && criteria.stressLevel > this.STRESS_THRESHOLD_MEDIUM) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Получить быструю рекомендацию для экстренной ситуации
   */
  getEmergencyRecommendation(emotionId: string): Exercise | null {
    const exercises = this.getExercisesForEmotion(emotionId);
    
    // Приоритет дыхательным упражнениям для быстрого эффекта
    const breathingExercises = exercises.filter(e => e.category === 'breathing');
    
    if (breathingExercises.length > 0) {
      // Выбираем самое короткое дыхательное упражнение
      return breathingExercises.reduce((shortest, current) => 
        current.duration < shortest.duration ? current : shortest
      );
    }

    // Если нет дыхательных, берем самое короткое любое
    if (exercises.length > 0) {
      return exercises.reduce((shortest, current) => 
        current.duration < shortest.duration ? current : shortest
      );
    }

    return null;
  }

  /**
   * Получить персонализированную последовательность упражнений
   */
  getExerciseSequence(
    emotionId: string,
    totalTime: number,
    biometricData?: BiometricData
  ): Exercise[] {
    const criteria: RecommendationCriteria = {
      emotionId,
      biometricData,
      availableTime: totalTime
    };

    const recommendations = this.getRecommendations(criteria);
    const sequence: Exercise[] = [];
    let remainingTime = totalTime;

    for (const exercise of recommendations.exercises) {
      if (exercise.duration <= remainingTime) {
        sequence.push(exercise);
        remainingTime -= exercise.duration;
      }

      if (remainingTime < 3) break; // Минимум 3 минуты на упражнение
    }

    return sequence;
  }

  /**
   * Получить альтернативные упражнения
   */
  getAlternatives(exerciseId: string, count: number = 3): Exercise[] {
    const exercise = exerciseData.find(e => e.id === exerciseId);
    if (!exercise) return [];

    // Находим упражнения той же категории и сложности
    const alternatives = exerciseData.filter(e => 
      e.id !== exerciseId &&
      e.category === exercise.category &&
      e.difficulty === exercise.difficulty &&
      Math.abs(e.duration - exercise.duration) <= 3 // Примерно та же длительность
    );

    // Если не нашли точных совпадений, расширяем поиск
    if (alternatives.length < count) {
      const moreAlternatives = exerciseData.filter(e => 
        e.id !== exerciseId &&
        e.category === exercise.category &&
        !alternatives.includes(e)
      );
      alternatives.push(...moreAlternatives);
    }

    return alternatives.slice(0, count);
  }

  /**
   * Оценить совместимость упражнения с текущим состоянием
   */
  evaluateExerciseCompatibility(
    exercise: Exercise,
    biometricData: BiometricData,
    stressLevel: number
  ): {
    compatible: boolean;
    score: number;
    warnings: string[];
  } {
    const warnings: string[] = [];
    let compatible = true;

    const criteria: RecommendationCriteria = {
      emotionId: exercise.emotionIds[0],
      biometricData,
      stressLevel
    };

    const score = this.calculateExerciseScore(exercise, criteria);