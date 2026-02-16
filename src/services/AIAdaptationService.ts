import { Session } from '../models/Session';
import { Statistics } from '../models/Statistics';
import { Settings } from '../models/Settings';
import * as db from './DatabaseService';

export interface AdaptationRecommendation {
  type: 'session_duration' | 'break_duration' | 'daily_goal' | 'best_time' | 'pace';
  current: number;
  recommended: number;
  reason: string;
  confidence: number;
}

export interface ProductivityPattern {
  hour: number;
  completionRate: number;
  averageDuration: number;
  sessionCount: number;
}

export interface SessionPattern {
  averageSessionDuration: number;
  averageBreakDuration: number;
  completionRate: number;
  pauseFrequency: number;
  bestTimeOfDay: number;
  productivityScore: number;
}

class AIAdaptationService {
  private readonly MIN_SESSIONS_FOR_ANALYSIS = 5;
  private readonly MIN_DAYS_FOR_ANALYSIS = 3;
  private readonly CONFIDENCE_THRESHOLD = 0.6;

  /**
   * Анализирует паттерны пользователя и возвращает рекомендации
   */
  async getRecommendations(
    sessions: Session[],
    statistics: Statistics,
    settings: Settings
  ): Promise<AdaptationRecommendation[]> {
    const recommendations: AdaptationRecommendation[] = [];

    if (sessions.length < this.MIN_SESSIONS_FOR_ANALYSIS) {
      return recommendations;
    }

    const pattern = this.analyzeSessionPattern(sessions);
    const productivityByHour = this.analyzeProductivityByHour(sessions);

    // Рекомендация по длительности сессии
    const sessionDurationRec = this.recommendSessionDuration(
      pattern,
      settings.sessionDuration
    );
    if (sessionDurationRec) {
      recommendations.push(sessionDurationRec);
    }

    // Рекомендация по длительности перерыва
    const breakDurationRec = this.recommendBreakDuration(
      pattern,
      settings.breakDuration
    );
    if (breakDurationRec) {
      recommendations.push(breakDurationRec);
    }

    // Рекомендация по дневной цели
    const dailyGoalRec = this.recommendDailyGoal(
      statistics,
      settings.dailyGoal,
      pattern
    );
    if (dailyGoalRec) {
      recommendations.push(dailyGoalRec);
    }

    // Рекомендация по лучшему времени
    const bestTimeRec = this.recommendBestTime(productivityByHour);
    if (bestTimeRec) {
      recommendations.push(bestTimeRec);
    }

    // Рекомендация по темпу работы
    const paceRec = this.recommendPace(pattern);
    if (paceRec) {
      recommendations.push(paceRec);
    }

    return recommendations;
  }

  /**
   * Анализирует общий паттерн сессий
   */
  private analyzeSessionPattern(sessions: Session[]): SessionPattern {
    const completedSessions = sessions.filter(s => s.completed);
    const totalSessions = sessions.length;

    const completionRate = totalSessions > 0 ? completedSessions.length / totalSessions : 0;

    const averageSessionDuration =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length
        : 0;

    const pauseFrequency =
      completedSessions.length > 0
        ? completedSessions.reduce((sum, s) => sum + (s.pausedCount || 0), 0) / completedSessions.length
        : 0;

    const bestTimeOfDay = this.findBestHour(sessions);

    const averageBreakDuration = this.calculateAverageBreakDuration(sessions);

    const productivityScore = this.calculateProductivityScore(
      completionRate,
      averageSessionDuration,
      pauseFrequency
    );

    return {
      averageSessionDuration,
      averageBreakDuration,
      completionRate,
      pauseFrequency,
      bestTimeOfDay,
      productivityScore,
    };
  }

  /**
   * Анализирует продуктивность по часам дня
   */
  private analyzeProductivityByHour(sessions: Session[]): ProductivityPattern[] {
    const hourlyData: { [key: number]: { count: number; completed: number; durations: number[] } } = {};

    // Инициализируем данные для всех часов
    for (let i = 0; i < 24; i++) {
      hourlyData[i] = { count: 0, completed: 0, durations: [] };
    }

    // Заполняем данные
    sessions.forEach(session => {
      const date = new Date(session.startedAt);
      const hour = date.getHours();

      if (hourlyData[hour]) {
        hourlyData[hour].count++;
        if (session.completed) {
          hourlyData[hour].completed++;
        }
        hourlyData[hour].durations.push(session.duration);
      }
    });

    // Конвертируем в массив паттернов
    const patterns: ProductivityPattern[] = [];
    for (let hour = 0; hour < 24; hour++) {
      const data = hourlyData[hour];
      if (data.count > 0) {
        const completionRate = data.completed / data.count;
        const averageDuration = data.durations.reduce((a, b) => a + b, 0) / data.durations.length;

        patterns.push({
          hour,
          completionRate,
          averageDuration,
          sessionCount: data.count,
        });
      }
    }

    return patterns;
  }

  /**
   * Рекомендует оптимальную длительность сессии
   */
  private recommendSessionDuration(
    pattern: SessionPattern,
    currentDuration: number
  ): AdaptationRecommendation | null {
    // Если завершаемость менее 60%, предлагаем сократить сессию
    if (pattern.completionRate < 0.6 && pattern.averageSessionDuration > 0) {
      const recommended = Math.max(
        5,
        Math.round(pattern.averageSessionDuration * 0.8)
      );

      if (recommended !== currentDuration) {
        return {
          type: 'session_duration',
          current: currentDuration,
          recommended,
          reason: `Низкая завершаемость (${Math.round(pattern.completionRate * 100)}%). Сокращение сессии может улучшить результаты.`,
          confidence: Math.min(0.95, 1 - pattern.completionRate),
        };
      }
    }

    // Если завершаемость высокая и много пауз, можно увеличить
    if (
      pattern.completionRate > 0.85 &&
      pattern.pauseFrequency < 0.5 &&
      pattern.averageSessionDuration > 0
    ) {
      const recommended = Math.min(
        60,
        Math.round(pattern.averageSessionDuration * 1.15)
      );

      if (recommended !== currentDuration && recommended > currentDuration) {
        return {
          type: 'session_duration',
          current: currentDuration,
          recommended,
          reason: `Высокая завершаемость (${Math.round(pattern.completionRate * 100)}%). Можно увеличить длительность.`,
          confidence: pattern.completionRate,
        };
      }
    }

    return null;
  }

  /**
   * Рекомендует оптимальную длительность перерыва
   */
  private recommendBreakDuration(
    pattern: SessionPattern,
    currentDuration: number
  ): AdaptationRecommendation | null {
    // Если много пауз, нужны более длинные перерывы
    if (pattern.pauseFrequency > 1.5 && pattern.averageBreakDuration > 0) {
      const recommended = Math.min(
        15,
        Math.round(pattern.averageBreakDuration * 1.2)
      );

      if (recommended !== currentDuration && recommended > currentDuration) {
        return {
          type: 'break_duration',
          current: currentDuration,
          recommended,
          reason: `Частые паузы (${pattern.pauseFrequency.toFixed(1)} за сессию). Более длинный перерыв может помочь восстановлению.`,
          confidence: Math.min(0.9, pattern.pauseFrequency / 3),
        };
      }
    }

    return null;
  }

  /**
   * Рекомендует дневную цель
   */
  private recommendDailyGoal(
    statistics: Statistics,
    currentGoal: number,
    pattern: SessionPattern
  ): AdaptationRecommendation | null {
    const avgDailyCompletions = statistics.totalSessions > 0
      ? statistics.totalSessions / Math.max(1, Math.ceil(statistics.totalFocusTime / (8 * 60)))
      : 0;

    // Если пользователь постоянно превышает цель, увеличиваем её
    if (avgDailyCompletions > currentGoal * 1.2 && pattern.completionRate > 0.8) {
      const recommended = Math.min(20, currentGoal + 2);

      return {
        type: 'daily_goal',
        current: currentGoal,
        recommended,
        reason: `Вы регулярно превышаете текущую цель. Увеличение мотивирует на большее.`,
        confidence: 0.75,
      };
    }

    // Если пользователь не достигает цель, снижаем её
    if (avgDailyCompletions < currentGoal * 0.6 && pattern.completionRate < 0.7) {
      const recommended = Math.max(1, currentGoal - 1);

      return {
        type: 'daily_goal',
        current: currentGoal,
        recommended,
        reason: `Цель часто не достигается. Снижение поможет избежать разочарования.`,
        confidence: 0.7,
      };
    }

    return null;
  }

  /**
   * Рекомендует лучшее время для работы
   */
  private recommendBestTime(
    productivityByHour: ProductivityPattern[]
  ): AdaptationRecommendation | null {
    if (productivityByHour.length < 3) {
      return null;
    }

    // Находим час с максимальной завершаемостью
    const bestHour = productivityByHour.reduce((best, current) =>
      current.completionRate > best.completionRate ? current : best
    );

    const worstHour = productivityByHour.reduce((worst, current) =>
      current.completionRate < worst.completionRate ? current : worst
    );

    const difference = bestHour.completionRate - worstHour.completionRate;

    if (difference > 0.2 && bestHour.sessionCount >= 2) {
      return {
        type: 'best_time',
        current: 0,
        recommended: bestHour.hour,
        reason: `Лучшая продуктивность в ${bestHour.hour}:00. Завершаемость ${Math.round(bestHour.completionRate * 100)}%.`,
        confidence: Math.min(0.9, difference),
      };
    }

    return null;
  }

  /**
   * Рекомендует темп работы
   */
  private recommendPace(pattern: SessionPattern): AdaptationRecommendation | null {
    if (pattern.pauseFrequency > 2) {
      return {
        type: 'pace',
        current: Math.round(pattern.pauseFrequency * 10),
        recommended: Math.round(pattern.pauseFrequency * 0.7 * 10),
        reason: `Слишком частые паузы. Попробуйте поддерживать темп дольше.`,
        confidence: 0.65,
      };
    }

    return null;
  }

  /**
   * Находит лучший час дня
   */
  private findBestHour(sessions: Session[]): number {
    const completedSessions = sessions.filter(s => s.completed);
    if (completedSessions.length === 0) return 9;

    const hourCounts: { [key: number]: number } = {};
    completedSessions.forEach(session => {
      const hour = new Date(session.startedAt).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const bestHour = Object.entries(hourCounts).reduce((best, [hour, count]) =>
      count > (hourCounts[parseInt(best)] || 0) ? hour : best
    );

    return parseInt(bestHour) || 9;
  }

  /**
   * Рассчитывает среднюю длительность перерыва
   */
  private calculateAverageBreakDuration(sessions: Session[]): number {
    let totalBreakDuration = 0;
    let breakCount = 0;

    sessions.forEach(session => {
      if (session.completed && session.completedAt) {
        // Примерно 5 минут на перерыв (это базовое значение)
        totalBreakDuration += 5;
        breakCount++;
      }
    });

    return breakCount > 0 ? totalBreakDuration / breakCount : 5;
  }

  /**
   * Рассчитывает продуктивность
   */
  private calculateProductivityScore(
    completionRate: number,
    averageSessionDuration: number,
    pauseFrequency: number
  ): number {
    const durationScore = Math.min(1, averageSessionDuration / 30);
    const pauseScore = Math.max(0, 1 - pauseFrequency / 3);
    const completionScore = completionRate;

    return (durationScore * 0.3 + pauseScore * 0.3 + completionScore * 0.4);
  }

  /**
   * Получает предложения по улучшению
   */
  async getImprovementSuggestions(
    sessions: Session[],
    statistics: Statistics
  ): Promise<string[]> {
    const suggestions: string[] = [];
    const pattern = this.analyzeSessionPattern(sessions);

    if (pattern.completionRate < 0.5) {
      suggestions.push('Ваша завершаемость низкая. Попробуйте сократить длительность сессий.');
    }

    if (pattern.pauseFrequency > 2) {
      suggestions.push('Слишком много пауз. Работайте более сосредоточенно.');
    }

    if (statistics.currentStreak === 0 && statistics.totalSessions > 5) {
      suggestions.push('Вы потеряли серию. Начните новую сегодня!');
    }

    if (pattern.productivityScore < 0.4) {
      suggestions.push('Ваша продуктивность снизилась. Может быть, нужен отдых?');
    }

    return suggestions;
  }
}

export const aiAdaptationService = new AIAdaptationService();