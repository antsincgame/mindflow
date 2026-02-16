export interface HeartRateData {
  value: number;
  timestamp: Date;
  unit: 'bpm';
}

export interface HeartRateVariabilityData {
  value: number;
  timestamp: Date;
  unit: 'ms';
}

export interface RespiratoryRateData {
  value: number;
  timestamp: Date;
  unit: 'breaths/min';
}

export interface StepsData {
  value: number;
  timestamp: Date;
  unit: 'count';
}

export interface SleepData {
  value: number;
  startDate: Date;
  endDate: Date;
  unit: 'hours';
  quality?: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface StressLevel {
  value: number;
  timestamp: Date;
  unit: 'percentage';
  category: 'low' | 'moderate' | 'high' | 'very_high';
}

export interface BiometricData {
  heartRate?: HeartRateData[];
  heartRateVariability?: HeartRateVariabilityData[];
  respiratoryRate?: RespiratoryRateData[];
  steps?: StepsData[];
  sleep?: SleepData[];
  stressLevel?: StressLevel[];
  lastSync?: Date;
}

export interface BiometricSummary {
  averageHeartRate?: number;
  averageHRV?: number;
  averageRespiratoryRate?: number;
  totalSteps?: number;
  totalSleepHours?: number;
  averageSleepQuality?: number;
  currentStressLevel?: StressLevel;
  date: Date;
}

export interface BiometricRange {
  min: number;
  max: number;
  average: number;
  unit: string;
}

export interface BiometricTrend {
  metric: BiometricMetricType;
  direction: 'up' | 'down' | 'stable';
  changePercentage: number;
  periodDays: number;
}

export type BiometricMetricType =
  | 'heartRate'
  | 'heartRateVariability'
  | 'respiratoryRate'
  | 'steps'
  | 'sleep'
  | 'stressLevel';

export interface HealthKitPermissions {
  heartRate: boolean;
  heartRateVariability: boolean;
  respiratoryRate: boolean;
  steps: boolean;
  sleep: boolean;
}

export interface BiometricAlert {
  id: string;
  metric: BiometricMetricType;
  value: number;
  threshold: number;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface BiometricGoal {
  id: string;
  metric: BiometricMetricType;
  targetValue: number;
  currentValue: number;
  startDate: Date;
  endDate: Date;
  progress: number;
  achieved: boolean;
}

export class BiometricDataModel {
  private data: BiometricData;

  constructor(data: BiometricData = {}) {
    this.data = data;
  }

  getData(): BiometricData {
    return this.data;
  }

  setData(data: BiometricData): void {
    this.data = data;
  }

  getLatestHeartRate(): HeartRateData | undefined {
    if (!this.data.heartRate || this.data.heartRate.length === 0) {
      return undefined;
    }
    return this.data.heartRate[this.data.heartRate.length - 1];
  }

  getLatestHRV(): HeartRateVariabilityData | undefined {
    if (!this.data.heartRateVariability || this.data.heartRateVariability.length === 0) {
      return undefined;
    }
    return this.data.heartRateVariability[this.data.heartRateVariability.length - 1];
  }

  getLatestStressLevel(): StressLevel | undefined {
    if (!this.data.stressLevel || this.data.stressLevel.length === 0) {
      return undefined;
    }
    return this.data.stressLevel[this.data.stressLevel.length - 1];
  }

  getAverageHeartRate(periodHours: number = 24): number | undefined {
    if (!this.data.heartRate || this.data.heartRate.length === 0) {
      return undefined;
    }

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);

    const recentData = this.data.heartRate.filter(
      (item) => item.timestamp >= cutoffTime
    );

    if (recentData.length === 0) {
      return undefined;
    }

    const sum = recentData.reduce((acc, item) => acc + item.value, 0);
    return Math.round(sum / recentData.length);
  }

  getAverageHRV(periodHours: number = 24): number | undefined {
    if (!this.data.heartRateVariability || this.data.heartRateVariability.length === 0) {
      return undefined;
    }

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);

    const recentData = this.data.heartRateVariability.filter(
      (item) => item.timestamp >= cutoffTime
    );

    if (recentData.length === 0) {
      return undefined;
    }

    const sum = recentData.reduce((acc, item) => acc + item.value, 0);
    return Math.round(sum / recentData.length);
  }

  getTotalSteps(date: Date = new Date()): number {
    if (!this.data.steps || this.data.steps.length === 0) {
      return 0;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const daySteps = this.data.steps.filter(
      (item) => item.timestamp >= startOfDay && item.timestamp <= endOfDay
    );

    return daySteps.reduce((acc, item) => acc + item.value, 0);
  }

  getSleepDuration(date: Date = new Date()): number {
    if (!this.data.sleep || this.data.sleep.length === 0) {
      return 0;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const daySleep = this.data.sleep.filter(
      (item) => item.startDate >= startOfDay && item.endDate <= endOfDay
    );

    return daySleep.reduce((acc, item) => acc + item.value, 0);
  }

  getHeartRateRange(periodHours: number = 24): BiometricRange | undefined {
    if (!this.data.heartRate || this.data.heartRate.length === 0) {
      return undefined;
    }

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);

    const recentData = this.data.heartRate.filter(
      (item) => item.timestamp >= cutoffTime
    );

    if (recentData.length === 0) {
      return undefined;
    }

    const values = recentData.map((item) => item.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const average = values.reduce((acc, val) => acc + val, 0) / values.length;

    return {
      min: Math.round(min),
      max: Math.round(max),
      average: Math.round(average),
      unit: 'bpm',
    };
  }

  calculateStressScore(): number {
    const latestStress = this.getLatestStressLevel();
    if (latestStress) {
      return latestStress.value;
    }

    const hrv = this.getLatestHRV();
    const hr = this.getLatestHeartRate();

    if (!hrv || !hr) {
      return 50;
    }

    let stressScore = 50;

    if (hrv.value < 20) {
      stressScore += 30;
    } else if (hrv.value < 50) {
      stressScore += 15;
    } else if (hrv.value > 100) {
      stressScore -= 20;
    }

    if (hr.value > 100) {
      stressScore += 20;
    } else if (hr.value > 80) {
      stressScore += 10;
    } else if (hr.value < 60) {
      stressScore -= 10;
    }

    return Math.max(0, Math.min(100, stressScore));
  }

  isDataStale(maxAgeMinutes: number = 60): boolean {
    if (!this.data.lastSync) {
      return true;
    }

    const now = new Date();
    const ageMinutes = (now.getTime() - this.data.lastSync.getTime()) / (1000 * 60);

    return ageMinutes > maxAgeMinutes;
  }

  hasMinimalData(): boolean {
    return !!(
      this.data.heartRate?.length ||
      this.data.heartRateVariability?.length ||
      this.data.stressLevel?.length
    );
  }

  getSummary(date: Date = new Date()): BiometricSummary {
    return {
      averageHeartRate: this.getAverageHeartRate(24),
      averageHRV: this.getAverageHRV(24),
      averageRespiratoryRate: this.getAverageRespiratoryRate(24),
      totalSteps: this.getTotalSteps(date),
      totalSleepHours: this.getSleepDuration(date),
      averageSleepQuality: this.getAverageSleepQuality(date),
      currentStressLevel: this.getLatestStressLevel(),
      date,
    };
  }

  private getAverageRespiratoryRate(periodHours: number): number | undefined {
    if (!this.data.respiratoryRate || this.data.respiratoryRate.length === 0) {
      return undefined;
    }

    const now = new Date();
    const cutoffTime = new Date(now.getTime() - periodHours * 60 * 60 * 1000);

    const recentData = this.data.respiratoryRate.filter(
      (item) => item.timestamp >= cutoffTime
    );

    if (recentData.length === 0) {
      return undefined;
    }

    const sum = recentData.reduce((acc, item) => acc + item.value, 0);
    return Math.round(sum / recentData.length);
  }

  private getAverageSleepQuality(date: Date): number | undefined {
    if (!this.data.sleep || this.data.sleep.length === 0) {
      return undefined;
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const daySleep = this.data.sleep.filter(
      (item) => item.startDate >= startOfDay && item.endDate <= endOfDay
    );

    if (daySleep.length === 0) {
      return undefined;
    }

    const qualityMap = {
      poor: 25,
      fair: 50,
      good: 75,
      excellent: 100,
    };

    const qualityScores = daySleep
      .filter((item) => item.quality)
      .map((item) => qualityMap[item.quality!]);

    if (qualityScores.length === 0) {
      return undefined;
    }

    const sum = qualityScores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / qualityScores.length);
  }
}

export default BiometricDataModel;