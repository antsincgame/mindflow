import { BiometricData } from '../models/BiometricData';

export interface StressLevel {
  level: 'low' | 'moderate' | 'high' | 'critical';
  score: number; // 0-100
  factors: StressFactor[];
  timestamp: Date;
}

export interface StressFactor {
  type: 'heartRate' | 'hrv' | 'respiratoryRate' | 'bloodPressure' | 'sleepQuality';
  impact: 'positive' | 'negative' | 'neutral';
  value: number;
  normalRange: { min: number; max: number };
  description: string;
}

export interface StressTrend {
  period: 'day' | 'week' | 'month';
  averageScore: number;
  minScore: number;
  maxScore: number;
  dataPoints: Array<{ date: Date; score: number }>;
  trend: 'improving' | 'stable' | 'worsening';
}

class StressAnalysisService {
  private readonly HEART_RATE_NORMAL_RANGE = { min: 60, max: 100 };
  private readonly HRV_NORMAL_RANGE = { min: 50, max: 100 };
  private readonly RESPIRATORY_RATE_NORMAL_RANGE = { min: 12, max: 20 };
  private readonly SYSTOLIC_BP_NORMAL_RANGE = { min: 90, max: 120 };
  private readonly DIASTOLIC_BP_NORMAL_RANGE = { min: 60, max: 80 };
  private readonly SLEEP_QUALITY_NORMAL_RANGE = { min: 70, max: 100 };

  analyzeStressLevel(biometricData: BiometricData): StressLevel {
    const factors = this.calculateStressFactors(biometricData);
    const score = this.calculateOverallStressScore(factors);
    const level = this.determineStressLevel(score);

    return {
      level,
      score,
      factors,
      timestamp: new Date(),
    };
  }

  private calculateStressFactors(data: BiometricData): StressFactor[] {
    const factors: StressFactor[] = [];

    if (data.heartRate !== undefined) {
      factors.push(this.analyzeHeartRate(data.heartRate));
    }

    if (data.heartRateVariability !== undefined) {
      factors.push(this.analyzeHRV(data.heartRateVariability));
    }

    if (data.respiratoryRate !== undefined) {
      factors.push(this.analyzeRespiratoryRate(data.respiratoryRate));
    }

    if (data.bloodPressureSystolic !== undefined && data.bloodPressureDiastolic !== undefined) {
      factors.push(this.analyzeBloodPressure(data.bloodPressureSystolic, data.bloodPressureDiastolic));
    }

    if (data.sleepAnalysis !== undefined) {
      factors.push(this.analyzeSleepQuality(data.sleepAnalysis));
    }

    return factors;
  }

  private analyzeHeartRate(heartRate: number): StressFactor {
    const { min, max } = this.HEART_RATE_NORMAL_RANGE;
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = 'Частота пульса в норме';

    if (heartRate < min) {
      impact = 'positive';
      description = 'Низкий пульс - хороший показатель спокойствия';
    } else if (heartRate > max) {
      const deviation = ((heartRate - max) / max) * 100;
      if (deviation > 20) {
        impact = 'negative';
        description = 'Значительно повышенный пульс - признак стресса';
      } else if (deviation > 10) {
        impact = 'negative';
        description = 'Повышенный пульс - возможный стресс';
      }
    }

    return {
      type: 'heartRate',
      impact,
      value: heartRate,
      normalRange: this.HEART_RATE_NORMAL_RANGE,
      description,
    };
  }

  private analyzeHRV(hrv: number): StressFactor {
    const { min, max } = this.HRV_NORMAL_RANGE;
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = 'Вариабельность сердечного ритма в норме';

    if (hrv >= max) {
      impact = 'positive';
      description = 'Высокая ВСР - отличная адаптивность к стрессу';
    } else if (hrv < min) {
      const deviation = ((min - hrv) / min) * 100;
      if (deviation > 30) {
        impact = 'negative';
        description = 'Очень низкая ВСР - высокий уровень стресса';
      } else if (deviation > 15) {
        impact = 'negative';
        description = 'Низкая ВСР - признак стресса';
      }
    }

    return {
      type: 'hrv',
      impact,
      value: hrv,
      normalRange: this.HRV_NORMAL_RANGE,
      description,
    };
  }

  private analyzeRespiratoryRate(rate: number): StressFactor {
    const { min, max } = this.RESPIRATORY_RATE_NORMAL_RANGE;
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = 'Частота дыхания в норме';

    if (rate >= min && rate <= max) {
      impact = 'positive';
      description = 'Спокойное дыхание';
    } else if (rate > max) {
      const deviation = ((rate - max) / max) * 100;
      if (deviation > 25) {
        impact = 'negative';
        description = 'Учащенное дыхание - сильный стресс';
      } else if (deviation > 10) {
        impact = 'negative';
        description = 'Учащенное дыхание - умеренный стресс';
      }
    } else if (rate < min) {
      impact = 'positive';
      description = 'Медленное дыхание - глубокое расслабление';
    }

    return {
      type: 'respiratoryRate',
      impact,
      value: rate,
      normalRange: this.RESPIRATORY_RATE_NORMAL_RANGE,
      description,
    };
  }

  private analyzeBloodPressure(systolic: number, diastolic: number): StressFactor {
    const sysNormal = this.SYSTOLIC_BP_NORMAL_RANGE;
    const diaNormal = this.DIASTOLIC_BP_NORMAL_RANGE;
    
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = 'Артериальное давление в норме';

    const sysHigh = systolic > sysNormal.max;
    const diaHigh = diastolic > diaNormal.max;

    if (sysHigh || diaHigh) {
      const sysDeviation = sysHigh ? ((systolic - sysNormal.max) / sysNormal.max) * 100 : 0;
      const diaDeviation = diaHigh ? ((diastolic - diaNormal.max) / diaNormal.max) * 100 : 0;
      const maxDeviation = Math.max(sysDeviation, diaDeviation);

      if (maxDeviation > 20) {
        impact = 'negative';
        description = 'Значительно повышенное давление - высокий стресс';
      } else if (maxDeviation > 10) {
        impact = 'negative';
        description = 'Повышенное давление - признак стресса';
      }
    } else if (systolic >= sysNormal.min && systolic <= sysNormal.max &&
               diastolic >= diaNormal.min && diastolic <= diaNormal.max) {
      impact = 'positive';
      description = 'Оптимальное артериальное давление';
    }

    return {
      type: 'bloodPressure',
      impact,
      value: systolic,
      normalRange: sysNormal,
      description,
    };
  }

  private analyzeSleepQuality(sleepData: any): StressFactor {
    const sleepScore = this.calculateSleepScore(sleepData);
    const { min, max } = this.SLEEP_QUALITY_NORMAL_RANGE;
    
    let impact: 'positive' | 'negative' | 'neutral' = 'neutral';
    let description = 'Качество сна удовлетворительное';

    if (sleepScore >= 85) {
      impact = 'positive';
      description = 'Отличное качество сна - хорошее восстановление';
    } else if (sleepScore >= 70) {
      impact = 'positive';
      description = 'Хорошее качество сна';
    } else if (sleepScore >= 50) {
      impact = 'neutral';
      description = 'Среднее качество сна';
    } else if (sleepScore >= 30) {
      impact = 'negative';
      description = 'Плохое качество сна - фактор стресса';
    } else {
      impact = 'negative';
      description = 'Очень плохое качество сна - серьезный фактор стресса';
    }

    return {
      type: 'sleepQuality',
      impact,
      value: sleepScore,
      normalRange: this.SLEEP_QUALITY_NORMAL_RANGE,
      description,
    };
  }

  private calculateSleepScore(sleepData: any): number {
    if (!sleepData || typeof sleepData !== 'object') {
      return 50;
    }

    let score = 100;

    if (sleepData.duration !== undefined) {
      const hours = sleepData.duration / 3600;
      if (hours < 6) {
        score -= (6 - hours) * 10;
      } else if (hours > 9) {
        score -= (hours - 9) * 5;
      }
    }

    if (sleepData.deepSleepPercentage !== undefined) {
      const deepSleep = sleepData.deepSleepPercentage;
      if (deepSleep < 15) {
        score -= (15 - deepSleep) * 2;
      }
    }

    if (sleepData.awakenings !== undefined) {
      score -= Math.min(sleepData.awakenings * 5, 30);
    }

    return Math.max(0, Math.min(100, score));
  }

  private calculateOverallStressScore(factors: StressFactor[]): number {
    if (factors.length === 0) {
      return 50;
    }

    const weights = {
      heartRate: 0.25,
      hrv: 0.30,
      respiratoryRate: 0.20,
      bloodPressure: 0.15,
      sleepQuality: 0.10,
    };

    let totalWeight = 0;
    let weightedScore = 0;

    factors.forEach(factor => {
      const weight = weights[factor.type] || 0.1;
      totalWeight += weight;

      let factorScore = 50;

      if (factor.impact === 'positive') {
        factorScore = this.calculatePositiveScore(factor);
      } else if (factor.impact === 'negative') {
        factorScore = this.calculateNegativeScore(factor);
      }

      weightedScore += factorScore * weight;
    });

    return Math.round(weightedScore / totalWeight);
  }

  private calculatePositiveScore(factor: StressFactor): number {
    const { value, normalRange } = factor;
    const midpoint = (normalRange.min + normalRange.max) / 2;

    if (factor.type === 'hrv') {
      const deviation = (value - normalRange.max) / normalRange.max;
      return Math.min(30, 50 - deviation * 50);
    }

    if (factor.type === 'heartRate' || factor.type === 'respiratoryRate') {
      if (value < normalRange.min) {
        const deviation = (normalRange.min - value) / normalRange.min;
        return Math.max(20, 50 - deviation * 30);
      }
    }

    if (factor.type === 'sleepQuality') {
      return Math.max(20, 50 - (value - 70) * 0.3);
    }

    return 30;
  }

  private calculateNegativeScore(factor: StressFactor): number {
    const { value, normalRange } = factor;

    if (factor.type === 'hrv') {
      const deviation = (normalRange.min - value) / normalRange.min;
      return Math.min(100, 50 + deviation * 100);
    }

    if (factor.type === 'heartRate') {
      const deviation = (value - normalRange.max) / normalRange.max;
      return Math.min(100, 50 + deviation * 80);
    }

    if (factor.type === 'respiratoryRate') {
      const deviation = (value - normalRange.max) / normalRange.max;
      return Math.min(100, 50 + deviation * 70);
    }

    if (factor.type === 'bloodPressure') {
      const deviation = (value - normalRange.max) / normalRange.max;
      return Math.min(100, 50 + deviation * 60);
    }

    if (factor.type === 'sleepQuality') {
      return Math.min(100, 50 + (70 - value) * 0.5);
    }

    return 70;
  }

  private determineStressLevel(score: number): 'low' | 'moderate' | 'high' | 'critical' {
    if (score <= 30) {
      return 'low';
    } else if (score <= 55) {
      return 'moderate';
    } else if (score <= 75) {
      return 'high';
    } else {
      return 'critical';
    }
  }

  calculateStressTrend(
    stressLevels: StressLevel[],
    period: 'day' | 'week' | 'month'
  ): StressTrend {
    if (stressLevels.length === 0) {
      return {
        period,
        averageScore: 50,
        minScore: 50,
        maxScore: 50,
        dataPoints: [],
        trend: 'stable',
      };
    }

    const scores = stressLevels.map(level => level.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScore = Math.max(...scores);

    const dataPoints = stressLevels.map(level => ({
      date: level.timestamp,
      score: level.score,
    }));

    const trend = this.determineTrend(stressLevels);

    return {
      period,
      averageScore: Math.round(averageScore),
      minScore,
      maxScore,
      dataPoints,
      trend,
    };
  }

  private determineTrend(stressLevels: StressLevel[]): 'improving' | 'stable' | 'w