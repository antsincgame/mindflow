import { Mood } from '../models/Mood';
import { EnergyPattern } from '../models/EnergyPattern';

interface ProductivityPattern {
  peakHours: number[];
  peakDays: number[];
  lowEnergyHours: number[];
  averageEnergyByHour: Map<number, number>;
  averageEnergyByDay: Map<number, number>;
  consistencyScore: number;
}

interface HourlyStats {
  hour: number;
  averageEnergy: number;
  sampleCount: number;
  variance: number;
}

interface DailyStats {
  dayOfWeek: number;
  averageEnergy: number;
  sampleCount: number;
  variance: number;
}

interface TrendAnalysis {
  direction: 'improving' | 'declining' | 'stable';
  slope: number;
  confidence: number;
}

const PEAK_ENERGY_THRESHOLD = 70;
const LOW_ENERGY_THRESHOLD = 40;
const MIN_SAMPLES_FOR_PATTERN = 5;
const CONSISTENCY_WINDOW_DAYS = 7;

export const analyzePatterns = (moods: Mood[]): ProductivityPattern => {
  if (moods.length < MIN_SAMPLES_FOR_PATTERN) {
    return {
      peakHours: [],
      peakDays: [],
      lowEnergyHours: [],
      averageEnergyByHour: new Map(),
      averageEnergyByDay: new Map(),
      consistencyScore: 0,
    };
  }

  const hourlyStats = calculateHourlyStats(moods);
  const dailyStats = calculateDailyStats(moods);

  const peakHours = identifyPeakHours(hourlyStats);
  const peakDays = identifyPeakDays(dailyStats);
  const lowEnergyHours = identifyLowEnergyHours(hourlyStats);

  const averageEnergyByHour = new Map(
    hourlyStats.map(stat => [stat.hour, stat.averageEnergy])
  );

  const averageEnergyByDay = new Map(
    dailyStats.map(stat => [stat.dayOfWeek, stat.averageEnergy])
  );

  const consistencyScore = calculateConsistencyScore(moods);

  return {
    peakHours,
    peakDays,
    lowEnergyHours,
    averageEnergyByHour,
    averageEnergyByDay,
    consistencyScore,
  };
};

const calculateHourlyStats = (moods: Mood[]): HourlyStats[] => {
  const hourlyData = new Map<number, number[]>();

  moods.forEach(mood => {
    const date = new Date(mood.timestamp);
    const hour = date.getHours();

    if (!hourlyData.has(hour)) {
      hourlyData.set(hour, []);
    }
    hourlyData.get(hour)!.push(mood.energy);
  });

  const stats: HourlyStats[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const energyValues = hourlyData.get(hour) || [];
    
    if (energyValues.length === 0) continue;

    const averageEnergy = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;
    const variance = calculateVariance(energyValues, averageEnergy);

    stats.push({
      hour,
      averageEnergy,
      sampleCount: energyValues.length,
      variance,
    });
  }

  return stats.sort((a, b) => a.hour - b.hour);
};

const calculateDailyStats = (moods: Mood[]): DailyStats[] => {
  const dailyData = new Map<number, number[]>();

  moods.forEach(mood => {
    const date = new Date(mood.timestamp);
    const dayOfWeek = date.getDay();

    if (!dailyData.has(dayOfWeek)) {
      dailyData.set(dayOfWeek, []);
    }
    dailyData.get(dayOfWeek)!.push(mood.energy);
  });

  const stats: DailyStats[] = [];

  for (let day = 0; day < 7; day++) {
    const energyValues = dailyData.get(day) || [];
    
    if (energyValues.length === 0) continue;

    const averageEnergy = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;
    const variance = calculateVariance(energyValues, averageEnergy);

    stats.push({
      dayOfWeek: day,
      averageEnergy,
      sampleCount: energyValues.length,
      variance,
    });
  }

  return stats.sort((a, b) => a.dayOfWeek - b.dayOfWeek);
};

const calculateVariance = (values: number[], mean: number): number => {
  if (values.length < 2) return 0;

  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
};

const identifyPeakHours = (hourlyStats: HourlyStats[]): number[] => {
  const validStats = hourlyStats.filter(
    stat => stat.sampleCount >= MIN_SAMPLES_FOR_PATTERN
  );

  if (validStats.length === 0) return [];

  const peakHours = validStats
    .filter(stat => stat.averageEnergy >= PEAK_ENERGY_THRESHOLD)
    .sort((a, b) => b.averageEnergy - a.averageEnergy)
    .slice(0, 3)
    .map(stat => stat.hour);

  return peakHours;
};

const identifyPeakDays = (dailyStats: DailyStats[]): number[] => {
  const validStats = dailyStats.filter(
    stat => stat.sampleCount >= MIN_SAMPLES_FOR_PATTERN
  );

  if (validStats.length === 0) return [];

  const peakDays = validStats
    .filter(stat => stat.averageEnergy >= PEAK_ENERGY_THRESHOLD)
    .sort((a, b) => b.averageEnergy - a.averageEnergy)
    .slice(0, 3)
    .map(stat => stat.dayOfWeek);

  return peakDays;
};

const identifyLowEnergyHours = (hourlyStats: HourlyStats[]): number[] => {
  const validStats = hourlyStats.filter(
    stat => stat.sampleCount >= MIN_SAMPLES_FOR_PATTERN
  );

  if (validStats.length === 0) return [];

  const lowEnergyHours = validStats
    .filter(stat => stat.averageEnergy <= LOW_ENERGY_THRESHOLD)
    .sort((a, b) => a.averageEnergy - b.averageEnergy)
    .map(stat => stat.hour);

  return lowEnergyHours;
};

const calculateConsistencyScore = (moods: Mood[]): number => {
  if (moods.length < CONSISTENCY_WINDOW_DAYS) return 0;

  const recentMoods = moods.slice(-CONSISTENCY_WINDOW_DAYS * 3);
  
  const energyValues = recentMoods.map(mood => mood.energy);
  const mean = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;
  const variance = calculateVariance(energyValues, mean);
  
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 1;
  
  const consistencyScore = Math.max(0, Math.min(100, (1 - coefficientOfVariation) * 100));

  return Math.round(consistencyScore);
};

export const analyzeTrend = (moods: Mood[], windowDays: number = 7): TrendAnalysis => {
  if (moods.length < 2) {
    return {
      direction: 'stable',
      slope: 0,
      confidence: 0,
    };
  }

  const cutoffTime = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const recentMoods = moods.filter(mood => mood.timestamp >= cutoffTime);

  if (recentMoods.length < 2) {
    return {
      direction: 'stable',
      slope: 0,
      confidence: 0,
    };
  }

  const sortedMoods = [...recentMoods].sort((a, b) => a.timestamp - b.timestamp);
  
  const n = sortedMoods.length;
  const sumX = sortedMoods.reduce((sum, _, idx) => sum + idx, 0);
  const sumY = sortedMoods.reduce((sum, mood) => sum + mood.energy, 0);
  const sumXY = sortedMoods.reduce((sum, mood, idx) => sum + idx * mood.energy, 0);
  const sumX2 = sortedMoods.reduce((sum, _, idx) => sum + idx * idx, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);

  const meanY = sumY / n;
  const ssTotal = sortedMoods.reduce((sum, mood) => sum + Math.pow(mood.energy - meanY, 2), 0);
  const predictedValues = sortedMoods.map((_, idx) => slope * idx + (sumY - slope * sumX) / n);
  const ssResidual = sortedMoods.reduce(
    (sum, mood, idx) => sum + Math.pow(mood.energy - predictedValues[idx], 2),
    0
  );

  const rSquared = ssTotal > 0 ? 1 - ssResidual / ssTotal : 0;
  const confidence = Math.max(0, Math.min(1, rSquared));

  let direction: 'improving' | 'declining' | 'stable';
  if (Math.abs(slope) < 0.5) {
    direction = 'stable';
  } else if (slope > 0) {
    direction = 'improving';
  } else {
    direction = 'declining';
  }

  return {
    direction,
    slope,
    confidence,
  };
};

export const findOptimalTimeSlots = (
  patterns: ProductivityPattern,
  duration: number,
  count: number = 3
): Date[] => {
  const now = new Date();
  const currentHour = now.getHours();
  const currentDay = now.getDay();

  const slots: { date: Date; score: number }[] = [];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const targetDate = new Date(now);
    targetDate.setDate(targetDate.getDate() + dayOffset);
    const targetDay = targetDate.getDay();

    const dayScore = patterns.averageEnergyByDay.get(targetDay) || 50;

    for (let hour = 8; hour < 20; hour++) {
      if (dayOffset === 0 && hour <= currentHour) continue;

      const hourScore = patterns.averageEnergyByHour.get(hour) || 50;
      
      const isPeakHour = patterns.peakHours.includes(hour);
      const isPeakDay = patterns.peakDays.includes(targetDay);
      const isLowEnergyHour = patterns.lowEnergyHours.includes(hour);

      let score = (hourScore + dayScore) / 2;

      if (isPeakHour) score += 15;
      if (isPeakDay) score += 10;
      if (isLowEnergyHour) score -= 20;

      const slotDate = new Date(targetDate);
      slotDate.setHours(hour, 0, 0, 0);

      slots.push({ date: slotDate, score });
    }
  }

  slots.sort((a, b) => b.score - a.score);

  const selectedSlots = slots.slice(0, count).map(slot => slot.date);

  return selectedSlots;
};

export const generateEnergyPatterns = (moods: Mood[]): EnergyPattern[] => {
  const patterns: EnergyPattern[] = [];
  const patternMap = new Map<string, { energies: number[]; count: number }>();

  moods.forEach(mood => {
    const date = new Date(mood.timestamp);
    const dayOfWeek = date.getDay();
    const hourOfDay = date.getHours();
    const key = `${dayOfWeek}-${hourOfDay}`;

    if (!patternMap.has(key)) {
      patternMap.set(key, { energies: [], count: 0 });
    }

    const pattern = patternMap.get(key)!;
    pattern.energies.push(mood.energy);
    pattern.count++;
  });

  patternMap.forEach((data, key) => {
    const [dayOfWeek, hourOfDay] = key.split('-').map(Number);
    const averageEnergy = data.energies.reduce((sum, e) => sum + e, 0) / data.energies.length;

    patterns.push({
      id: 0,
      dayOfWeek,
      hourOfDay,
      averageEnergy,
      sampleCount: data.count,
      lastUpdated: Date.now(),
    });
  });

  return patterns;
};

export const predictEnergyLevel = (
  patterns: ProductivityPattern,
  targetDate: Date
): number => {
  const hour = targetDate.getHours();
  const dayOfWeek = targetDate.getDay();

  const hourEnergy = patterns.averageEnergyByHour.get(hour) || 50;
  const dayEnergy = patterns.averageEnergyByDay.get(dayOfWeek) || 50;

  const predictedEnergy = (hourEnergy * 0.6 + dayEnergy * 0.4);

  return Math.round(Math.max(0, Math.min(100, predictedEnergy)));
};

export const detectAnomalies = (moods: Mood[], windowSize: number = 7): Mood[] => {
  if (moods.length < windowSize) return [];

  const anomalies: Mood[] = [];
  const energyValues = moods.map(m => m.energy);
  const mean = energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;
  const stdDev = Math.sqrt(calculateVariance(energyValues, mean));

  const threshold = 2 * stdDev;

  moods.forEach(mood => {
    const deviation = Math.abs(mood.energy - mean);
    if (deviation > threshold) {
      anomalies.push(mood);
    }
  });

  return anomalies;
};