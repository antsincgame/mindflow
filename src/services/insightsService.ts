# src/services/insightsService.ts

```typescript
import { Insight, InsightType } from '../models/Insight';
import { EnergyPattern } from '../models/EnergyPattern';
import { Mood } from '../models/Mood';
import { Task } from '../models/Task';
import { database } from './database';

interface PatternAnalysis {
  peakHours: number[];
  lowHours: number[];
  bestDays: number[];
  worstDays: number[];
  averageEnergy: number;
  consistency: number;
}

interface ProductivityMetrics {
  completionRate: number;
  averageTaskDuration: number;
  preferredWorkingHours: number[];
  energyCorrelation: number;
}

class InsightsService {
  private readonly MINIMUM_DATA_POINTS = 14; // 2 недели данных
  private readonly CONFIDENCE_THRESHOLD = 0.6;
  private readonly PEAK_ENERGY_THRESHOLD = 70;
  private readonly LOW_ENERGY_THRESHOLD = 40;

  async generateInsights(): Promise<Insight[]> {
    const db = await database.getDatabase();
    const insights: Insight[] = [];

    try {
      // Проверяем достаточность данных
      const moodCount = await this.getMoodCount(db);
      if (moodCount < this.MINIMUM_DATA_POINTS) {
        return this.getOnboardingInsights(moodCount);
      }

      // Анализируем паттерны энергии
      const energyPatterns = await this.analyzeEnergyPatterns(db);
      insights.push(...this.generateEnergyInsights(energyPatterns));

      // Анализируем продуктивность
      const productivityMetrics = await this.analyzeProductivity(db);
      insights.push(...this.generateProductivityInsights(productivityMetrics));

      // Анализируем тренды
      const trends = await this.analyzeTrends(db);
      insights.push(...this.generateTrendInsights(trends));

      // Генерируем рекомендации по задачам
      const taskRecommendations = await this.generateTaskRecommendations(db);
      insights.push(...taskRecommendations);

      // Анализируем паттерны перерывов
      const breakPatterns = await this.analyzeBreakPatterns(db);
      insights.push(...this.generateBreakInsights(breakPatterns));

      // Сортируем по уверенности и актуальности
      return this.prioritizeInsights(insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      return [];
    }
  }

  private async getMoodCount(db: any): Promise<number> {
    const result = await db.getAllAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM moods'
    );
    return result[0]?.count || 0;
  }

  private getOnboardingInsights(moodCount: number): Insight[] {
    const daysRemaining = Math.max(0, this.MINIMUM_DATA_POINTS - moodCount);
    
    return [
      {
        id: 'onboarding_1',
        type: 'onboarding',
        message: `Отмечайте настроение ещё ${daysRemaining} дней, чтобы получить персональные подсказки`,
        confidence: 1.0,
        createdAt: Date.now(),
        dismissed: false,
        actionable: true,
        priority: 'high'
      },
      {
        id: 'onboarding_2',
        type: 'tip',
        message: 'Отмечайте настроение в одно и то же время каждый день для точности анализа',
        confidence: 1.0,
        createdAt: Date.now(),
        dismissed: false,
        actionable: false,
        priority: 'medium'
      }
    ];
  }

  private async analyzeEnergyPatterns(db: any): Promise<PatternAnalysis> {
    // Получаем паттерны энергии из БД
    const patterns = await db.getAllAsync<EnergyPattern>(
      `SELECT day_of_week, hour_of_day, average_energy, sample_count
       FROM energy_patterns
       WHERE sample_count >= 3
       ORDER BY average_energy DESC`
    );

    if (patterns.length === 0) {
      return {
        peakHours: [],
        lowHours: [],
        bestDays: [],
        worstDays: [],
        averageEnergy: 50,
        consistency: 0
      };
    }

    // Находим пиковые часы
    const peakHours = patterns
      .filter(p => p.averageEnergy >= this.PEAK_ENERGY_THRESHOLD)
      .map(p => p.hourOfDay)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    // Находим часы низкой энергии
    const lowHours = patterns
      .filter(p => p.averageEnergy <= this.LOW_ENERGY_THRESHOLD)
      .map(p => p.hourOfDay)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);

    // Анализируем дни недели
    const dayAverages = new Map<number, number[]>();
    patterns.forEach(p => {
      if (!dayAverages.has(p.dayOfWeek)) {
        dayAverages.set(p.dayOfWeek, []);
      }
      dayAverages.get(p.dayOfWeek)!.push(p.averageEnergy);
    });

    const dayScores = Array.from(dayAverages.entries())
      .map(([day, energies]) => ({
        day,
        average: energies.reduce((a, b) => a + b, 0) / energies.length
      }))
      .sort((a, b) => b.average - a.average);

    const bestDays = dayScores.slice(0, 2).map(d => d.day);
    const worstDays = dayScores.slice(-2).map(d => d.day);

    // Вычисляем среднюю энергию
    const averageEnergy =
      patterns.reduce((sum, p) => sum + p.averageEnergy, 0) / patterns.length;

    // Вычисляем консистентность (обратная величина стандартного отклонения)
    const variance =
      patterns.reduce((sum, p) => sum + Math.pow(p.averageEnergy - averageEnergy, 2), 0) /
      patterns.length;
    const consistency = Math.max(0, 1 - Math.sqrt(variance) / 50);

    return {
      peakHours,
      lowHours,
      bestDays,
      worstDays,
      averageEnergy,
      consistency
    };
  }

  private generateEnergyInsights(analysis: PatternAnalysis): Insight[] {
    const insights: Insight[] = [];
    const dayNames = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];

    // Инсайт о пиковых часах
    if (analysis.peakHours.length > 0) {
      const hours = analysis.peakHours.map(h => `${h}:00`).join(', ');
      insights.push({
        id: `peak_hours_${Date.now()}`,
        type: 'peak_hours',
        message: `Ваши пиковые часы: ${hours}. Планируйте сложные задачи на это время`,
        confidence: Math.min(0.9, 0.6 + analysis.consistency * 0.3),
        createdAt: Date.now(),
        dismissed: false,
        actionable: true,
        priority: 'high',
        metadata: {
          hours: analysis.peakHours
        }
      });
    }

    // Инсайт о часах низкой энергии
    if (analysis.lowHours.length > 0) {
      const hours = analysis.lowHours.map(h => `${h}:00`).join(', ');
      insights.push({
        id: `low_hours_${Date.now()}`,
        type: 'low_energy',
        message: `В ${hours} ваша энергия обычно падает. Запланируйте перерыв или лёгкие задачи`,
        confidence: Math.min(0.85, 0.6 + analysis.consistency * 0.25),
        createdAt: Date.now(),
        dismissed: false,
        actionable: true,
        priority: 'medium',
        metadata: {
          hours: analysis.lowHours
        }
      });
    }

    // Инсайт о лучших днях
    if (analysis.bestDays.length > 0) {
      const days = analysis.bestDays.map(d => dayNames[d]).join(' и ');
      insights.push({
        id: `best_days_${Date.now()}`,
        type: 'best_days',
        message: `${days} — ваши самые продуктивные дни. Используйте их для важных задач`,
        confidence: Math.min(0.8, 0.5 + analysis.consistency * 0.3),
        createdAt: Date.now(),
        dismissed: false,
        actionable: true,
        priority: 'medium',
        metadata: {
          days: analysis.bestDays
        }
      });
    }

    // Инсайт о консистентности
    if (analysis.consistency > 0.7) {
      insights.push({
        id: `consistency_${Date.now()}`,
        type: 'pattern',
        message: 'У вас стабильный энергетический ритм! Это помогает планировать день',
        confidence: analysis.consistency,
        createdAt: Date.now(),
        dismissed: false,
        actionable: false,
        priority: 'low'
      });
    } else if (analysis.consistency < 0.3) {
      insights.push({
        id: `inconsistency_${Date.now()}`,
        type: 'warning',
        message: 'Ваша энергия нестабильна. Попробуйте наладить режим сна и питания',
        confidence: 1 - analysis.consistency,
        createdAt: Date.now(),
        dismissed: false,
        actionable: true,
        priority: 'high'
      });
    }

    return insights;
  }

  private async analyzeProductivity(db: any): Promise<ProductivityMetrics> {
    const tasks = await db.getAllAsync<Task>(
      `SELECT * FROM tasks WHERE created_at > ?`,
      [Date.now() - 30 * 24 * 60 * 60 * 1000] // последние 30 дней
    );

    if (tasks.length === 0) {
      return {
        completionRate: 0,
        averageTaskDuration: 60,
        preferredWorkingHours: [],
        energyCorrelation: 0
      };
    }

    const completedTasks = tasks.filter(t => t.completed);
    const completionRate = completedTasks.length / tasks.length;

    const durations = completedTasks
      .map(t => t.duration)
      .filter(d => d > 0);
    const averageTaskDuration =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 60;

    // Анализируем предпочитаемые часы работы
    const workingHours = completedTasks
      .filter(t => t.scheduledTime)
      .map(t => new Date(t.scheduledTime!).getHours());
    
    const hourCounts = new Map<number, number>();
    workingHours.forEach(h => {
      hourCounts.set(h, (hourCounts.get(h) || 0) + 1);
    });

    const preferredWorkingHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    // Вычисляем корреляцию с энергией
    const energyCorrelation = await this.calculateEnergyCorrelation(db, completedTasks);

    return {
      completionRate,
      averageTaskDuration,
      preferredWorkingHours,
      energyCorrelation
    };
  }

  private async calculateEnergyCorrelation(db: any, tasks: Task[]): Promise<number> {
    if (tasks.length === 0) return 0;

    const correlations: number[] = [];

    for (const task of tasks) {
      if (!task.scheduledTime) continue;

      const taskHour = new Date(task.scheduledTime).getHours();
      const taskDay = new Date(task.scheduledTime).getDay();

      const pattern = await db.getAllAsync<EnergyPattern>(
        `SELECT average_energy FROM energy_patterns
         WHERE day_of_week = ? AND hour_of_day = ?`,
        [taskDay, taskHour]
      );

      if (pattern.length > 0 && task.completed) {
        correlations.push(pattern[0].averageEnergy / 100);
      }
    }

    return correlations.length > 0
      ? correlations.reduce((a, b) => a + b, 0) / correlations.length
      : 0;
  }

  private generateProductivityInsights(metrics: ProductivityMetrics): Insight[] {
    const insights: Insight[] = [];

    // Инсайт о проценте завершения
    if (metrics.completionRate < 0.5) {
      insights.push({
        id: `completion_rate_${Date.now()}`,
        type: 'warning',
        message: `Вы завершаете только ${Math.round(metrics.completionRate * 100)}% задач. Попробуйте ставить меньше целей`,
        confidence: 0.8,
        createdAt: Date.now(),
        dismissed: false,
        actionable: true,
        priority: 'high'
      });
    } else if (metrics.completionRate > 0.8) {
      insights.push({
        id: `completion_rate_${Date.now()}`,
        type: 'achievement',
        message: `Отличная работа! Вы завершаете ${Math.round(metrics.completionRate * 100)}% задач`,
        confidence: 0.9,
        createdAt: Date.now(),
        dismissed: false,
        actionable: false,
        priority: 'low'
      });
    }

    // Инсайт о предпочитаемых часах
    if (metrics.preferredWorkingHours.length > 0) {
      const hours = metrics.preferredWorkingHours.map(h => `${h}:00`).join(', ');
      insights.push({
        id: `working_hours_${Date.now()}`,
        type: 'pattern',
        message: `Вы чаще всего работаете в ${hours}. Учитывайте это при планировании`,
        confidence: 0.75,
        createdAt: Date.now(),
        dismissed: false,
        actionable: true,
        priority: 'medium',
        metadata: {
          hours: metrics.preferredWorkingHours
        }
      });
    }

    // Инсайт о корреляции с энергией