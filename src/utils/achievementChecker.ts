import { Achievement, AchievementType, AchievementTier } from '../models/Achievement';
import { Session } from '../models/Session';
import { Statistics } from '../models/Statistics';
import { ACHIEVEMENTS } from '../constants/achievements';

interface AchievementCheckResult {
  newAchievements: Achievement[];
  updatedAchievements: Achievement[];
}

export class AchievementChecker {
  /**
   * Проверяет все достижения после завершения сессии
   */
  static checkAfterSession(
    session: Session,
    statistics: Statistics,
    unlockedAchievements: Achievement[]
  ): AchievementCheckResult {
    const newAchievements: Achievement[] = [];
    const updatedAchievements: Achievement[] = [];

    // Проверяем каждое достижение
    ACHIEVEMENTS.forEach((achievement) => {
      const existingAchievement = unlockedAchievements.find(
        (a) => a.id === achievement.id
      );

      if (existingAchievement) {
        // Проверяем прогресс для уже разблокированных достижений
        if (!existingAchievement.unlockedAt) {
          const progress = this.calculateProgress(
            achievement,
            session,
            statistics
          );

          if (progress >= achievement.requirement) {
            // Достижение разблокировано
            updatedAchievements.push({
              ...existingAchievement,
              progress,
              unlockedAt: new Date(),
            });
          } else if (progress > existingAchievement.progress) {
            // Обновляем прогресс
            updatedAchievements.push({
              ...existingAchievement,
              progress,
            });
          }
        }
      } else {
        // Новое достижение
        const progress = this.calculateProgress(achievement, session, statistics);

        if (progress >= achievement.requirement) {
          // Сразу разблокировано
          newAchievements.push({
            ...achievement,
            progress,
            unlockedAt: new Date(),
          });
        } else if (progress > 0) {
          // Добавляем с прогрессом
          newAchievements.push({
            ...achievement,
            progress,
          });
        }
      }
    });

    return {
      newAchievements,
      updatedAchievements,
    };
  }

  /**
   * Вычисляет прогресс для конкретного достижения
   */
  private static calculateProgress(
    achievement: Achievement,
    session: Session,
    statistics: Statistics
  ): number {
    switch (achievement.type) {
      case AchievementType.SESSIONS_COMPLETED:
        return statistics.totalSessions;

      case AchievementType.CONSECUTIVE_DAYS:
        return statistics.currentStreak;

      case AchievementType.TOTAL_MINUTES:
        return Math.floor(statistics.totalMinutes);

      case AchievementType.SPECIFIC_EXERCISE:
        return this.getExerciseCount(achievement.metadata?.exerciseType, statistics);

      case AchievementType.STRESS_REDUCTION:
        return this.getStressReductionCount(statistics);

      case AchievementType.PERFECT_WEEK:
        return this.checkPerfectWeek(statistics) ? 1 : 0;

      case AchievementType.EARLY_BIRD:
        return this.getEarlyBirdCount(statistics);

      case AchievementType.NIGHT_OWL:
        return this.getNightOwlCount(statistics);

      case AchievementType.WEEKEND_WARRIOR:
        return this.getWeekendWarriorCount(statistics);

      case AchievementType.MOOD_MASTER:
        return this.getMoodMasterCount(statistics);

      case AchievementType.SHARE_PROGRESS:
        return statistics.sharesCount || 0;

      case AchievementType.BIOMETRIC_SYNC:
        return statistics.biometricSyncsCount || 0;

      default:
        return 0;
    }
  }

  /**
   * Получает количество выполненных упражнений определенного типа
   */
  private static getExerciseCount(
    exerciseType: string | undefined,
    statistics: Statistics
  ): number {
    if (!exerciseType || !statistics.exerciseBreakdown) {
      return 0;
    }

    const exerciseStats = statistics.exerciseBreakdown.find(
      (e) => e.type === exerciseType
    );

    return exerciseStats?.count || 0;
  }

  /**
   * Получает количество сессий со значительным снижением стресса
   */
  private static getStressReductionCount(statistics: Statistics): number {
    return statistics.stressReductionCount || 0;
  }

  /**
   * Проверяет, была ли идеальная неделя (7 дней подряд)
   */
  private static checkPerfectWeek(statistics: Statistics): boolean {
    return statistics.currentStreak >= 7;
  }

  /**
   * Получает количество утренних сессий (до 9:00)
   */
  private static getEarlyBirdCount(statistics: Statistics): number {
    return statistics.morningSessionsCount || 0;
  }

  /**
   * Получает количество вечерних сессий (после 21:00)
   */
  private static getNightOwlCount(statistics: Statistics): number {
    return statistics.eveningSessionsCount || 0;
  }

  /**
   * Получает количество выходных с сессиями
   */
  private static getWeekendWarriorCount(statistics: Statistics): number {
    return statistics.weekendSessionsCount || 0;
  }

  /**
   * Получает количество различных эмоций, с которыми работал пользователь
   */
  private static getMoodMasterCount(statistics: Statistics): number {
    if (!statistics.emotionBreakdown) {
      return 0;
    }

    return statistics.emotionBreakdown.filter((e) => e.count > 0).length;
  }

  /**
   * Проверяет достижения для конкретной категории
   */
  static checkCategoryAchievements(
    type: AchievementType,
    statistics: Statistics,
    unlockedAchievements: Achievement[]
  ): Achievement[] {
    const categoryAchievements = ACHIEVEMENTS.filter((a) => a.type === type);
    const results: Achievement[] = [];

    categoryAchievements.forEach((achievement) => {
      const existingAchievement = unlockedAchievements.find(
        (a) => a.id === achievement.id
      );

      if (!existingAchievement || !existingAchievement.unlockedAt) {
        const progress = this.calculateProgress(
          achievement,
          {} as Session,
          statistics
        );

        if (progress >= achievement.requirement) {
          results.push({
            ...achievement,
            progress,
            unlockedAt: new Date(),
          });
        }
      }
    });

    return results;
  }

  /**
   * Получает следующее достижение для разблокировки
   */
  static getNextAchievement(
    type: AchievementType,
    unlockedAchievements: Achievement[]
  ): Achievement | null {
    const categoryAchievements = ACHIEVEMENTS.filter(
      (a) => a.type === type
    ).sort((a, b) => a.requirement - b.requirement);

    for (const achievement of categoryAchievements) {
      const unlocked = unlockedAchievements.find(
        (a) => a.id === achievement.id && a.unlockedAt
      );

      if (!unlocked) {
        return achievement;
      }
    }

    return null;
  }

  /**
   * Вычисляет общий прогресс по всем достижениям (в процентах)
   */
  static calculateOverallProgress(unlockedAchievements: Achievement[]): number {
    if (ACHIEVEMENTS.length === 0) {
      return 0;
    }

    const unlockedCount = unlockedAchievements.filter(
      (a) => a.unlockedAt
    ).length;

    return Math.round((unlockedCount / ACHIEVEMENTS.length) * 100);
  }

  /**
   * Получает достижения по уровню
   */
  static getAchievementsByTier(tier: AchievementTier): Achievement[] {
    return ACHIEVEMENTS.filter((a) => a.tier === tier);
  }

  /**
   * Получает разблокированные достижения по уровню
   */
  static getUnlockedAchievementsByTier(
    tier: AchievementTier,
    unlockedAchievements: Achievement[]
  ): Achievement[] {
    return unlockedAchievements.filter(
      (a) => a.tier === tier && a.unlockedAt
    );
  }

  /**
   * Проверяет, есть ли новые достижения, готовые к разблокировке
   */
  static hasReadyToUnlock(
    statistics: Statistics,
    unlockedAchievements: Achievement[]
  ): boolean {
    return ACHIEVEMENTS.some((achievement) => {
      const existing = unlockedAchievements.find((a) => a.id === achievement.id);

      if (existing?.unlockedAt) {
        return false;
      }

      const progress = this.calculateProgress(
        achievement,
        {} as Session,
        statistics
      );

      return progress >= achievement.requirement;
    });
  }

  /**
   * Получает достижения, близкие к разблокировке (прогресс >= 80%)
   */
  static getNearCompletionAchievements(
    statistics: Statistics,
    unlockedAchievements: Achievement[]
  ): Achievement[] {
    return ACHIEVEMENTS.filter((achievement) => {
      const existing = unlockedAchievements.find((a) => a.id === achievement.id);

      if (existing?.unlockedAt) {
        return false;
      }

      const progress = this.calculateProgress(
        achievement,
        {} as Session,
        statistics
      );

      const progressPercent = (progress / achievement.requirement) * 100;

      return progressPercent >= 80 && progressPercent < 100;
    }).map((achievement) => ({
      ...achievement,
      progress: this.calculateProgress(achievement, {} as Session, statistics),
    }));
  }

  /**
   * Получает рекомендации по достижениям
   */
  static getAchievementRecommendations(
    statistics: Statistics,
    unlockedAchievements: Achievement[]
  ): {
    achievement: Achievement;
    recommendation: string;
    progress: number;
  }[] {
    const recommendations: {
      achievement: Achievement;
      recommendation: string;
      progress: number;
    }[] = [];

    // Находим 3 ближайших к разблокировке достижения
    const nearCompletion = this.getNearCompletionAchievements(
      statistics,
      unlockedAchievements
    )
      .sort((a, b) => {
        const progressA = (a.progress / a.requirement) * 100;
        const progressB = (b.progress / b.requirement) * 100;
        return progressB - progressA;
      })
      .slice(0, 3);

    nearCompletion.forEach((achievement) => {
      const remaining = achievement.requirement - achievement.progress;
      let recommendation = '';

      switch (achievement.type) {
        case AchievementType.SESSIONS_COMPLETED:
          recommendation = `Выполните еще ${remaining} ${this.pluralize(
            remaining,
            'сессию',
            'сессии',
            'сессий'
          )}`;
          break;
        case AchievementType.CONSECUTIVE_DAYS:
          recommendation = `Продолжайте ${remaining} ${this.pluralize(
            remaining,
            'день',
            'дня',
            'дней'
          )} подряд`;
          break;
        case AchievementType.TOTAL_MINUTES:
          recommendation = `Еще ${remaining} ${this.pluralize(
            remaining,
            'минута',
            'минуты',
            'минут'
          )} практики`;
          break;
        default:
          recommendation = `Осталось ${remaining}`;
      }

      recommendations.push({
        achievement,
        recommendation,
        progress: achievement.progress,
      });
    });

    return recommendations;
  }

  /**
   * Вспомогательная функция для склонения слов
   */
  private static pluralize(
    count: number,
    one: string,
    few: string,
    many: string
  ): string {
    const mod10 = count % 10;
    const mod100 = count % 100;

    if (mod10 === 1 && mod100 !== 11) {
      return one;
    }

    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) {
      return few;
    }

    return many;
  }

  /**
   * Получает статистику по достижениям
   */
  static getAchievementStats(unlockedAchievements: Achievement[]): {
    total: number;
    unlocked: number;
    bronze: number;
    silver: number;
    gold: number;
    platinum: number;
    percentComplete: number;
  } {
    const unlocked = unlockedAchievements.filter((a) => a.unlockedAt);

    return {
      total: ACHIEVEMENTS.length,
      unlocked: unlocked.length,
      bronze: unlocked.filter((a) => a.tier === AchievementTier.BRONZE).length,
      silver: unlocked.filter((a) => a.tier === AchievementTier.SILVER).length,
      gold: unlocked.filter((a) => a.tier === AchievementTier.GOLD).length,
      platinum: unlocked.filter((a) => a.tier === AchievementTier.PLATINUM)
        .length,
      percentComplete: this.calculateOverallProgress(unlockedAchievements),
    };
  }

  /**
   * Проверяет, было ли достижение недавно разблокировано (в течение 24 часов)
   */
  static isRecentlyUnlocked(achievement: Achievement): boolean {
    if (!achievement.unlockedAt) {
      return false;
    }

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    return achievement.unlockedAt > oneDayAgo;
  }

  /**
   * Получает недавно разблокированные достижения
   */
  static getRecentlyUnlocked(unlockedAchievements: Achievement[]): Achievement[] {
    return unlockedAchievements
      .filter((a) => this.isRecentlyUnlocked(a))
      .sort((a, b) => {
        if (!a.unlockedAt || !b.unlockedAt) return 0;
        return b.unlockedAt.getTime() - a.unlockedAt.getTime();
      });
  }
}

export default AchievementChecker;