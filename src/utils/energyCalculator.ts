import { Mood } from '../models/Mood';

interface EnergyStats {
  current: number;
  average: number;
  trend: 'rising' | 'falling' | 'stable';
  volatility: number;
}

interface TimeSlotEnergy {
  hour: number;
  averageEnergy: number;
  confidence: number;
}

interface DayOfWeekEnergy {
  dayOfWeek: number;
  averageEnergy: number;
  confidence: number;
}

const TREND_THRESHOLD = 5;
const VOLATILITY_WINDOW = 10;
const MIN_SAMPLES_FOR_CONFIDENCE = 3;
const DECAY_FACTOR = 0.95;
const TIME_WEIGHT_HOURS = 6;

export const calculateCurrentEnergy = (moods: Mood[]): number => {
  if (moods.length === 0) return 50;

  const now = Date.now();
  const recentMoods = moods
    .filter(mood => now - mood.timestamp < 24 * 60 * 60 * 1000)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (recentMoods.length === 0) {
    return moods[moods.length - 1]?.energy || 50;
  }

  const latestMood = recentMoods[0];
  const timeSinceLatest = (now - latestMood.timestamp) / (60 * 60 * 1000);

  if (timeSinceLatest < 1) {
    return latestMood.energy;
  }

  let weightedSum = 0;
  let totalWeight = 0;

  recentMoods.forEach((mood, index) => {
    const hoursAgo = (now - mood.timestamp) / (60 * 60 * 1000);
    const recencyWeight = Math.exp(-hoursAgo / TIME_WEIGHT_HOURS);
    const positionWeight = Math.pow(DECAY_FACTOR, index);
    const weight = recencyWeight * positionWeight;

    weightedSum += mood.energy * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
};

export const calculateEnergyStats = (moods: Mood[]): EnergyStats => {
  if (moods.length === 0) {
    return {
      current: 50,
      average: 50,
      trend: 'stable',
      volatility: 0,
    };
  }

  const current = calculateCurrentEnergy(moods);

  const energyValues = moods.map(m => m.energy);
  const average = Math.round(
    energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length
  );

  const recentMoods = moods.slice(-10);
  const trend = calculateTrend(recentMoods);

  const volatility = calculateVolatility(
    moods.slice(-VOLATILITY_WINDOW)
  );

  return {
    current,
    average,
    trend,
    volatility,
  };
};

const calculateTrend = (moods: Mood[]): 'rising' | 'falling' | 'stable' => {
  if (moods.length < 2) return 'stable';

  const halfPoint = Math.floor(moods.length / 2);
  const firstHalf = moods.slice(0, halfPoint);
  const secondHalf = moods.slice(halfPoint);

  const firstAvg =
    firstHalf.reduce((sum, m) => sum + m.energy, 0) / firstHalf.length;
  const secondAvg =
    secondHalf.reduce((sum, m) => sum + m.energy, 0) / secondHalf.length;

  const difference = secondAvg - firstAvg;

  if (Math.abs(difference) < TREND_THRESHOLD) return 'stable';
  return difference > 0 ? 'rising' : 'falling';
};

const calculateVolatility = (moods: Mood[]): number => {
  if (moods.length < 2) return 0;

  const energyValues = moods.map(m => m.energy);
  const mean =
    energyValues.reduce((sum, val) => sum + val, 0) / energyValues.length;

  const squaredDifferences = energyValues.map(val =>
    Math.pow(val - mean, 2)
  );
  const variance =
    squaredDifferences.reduce((sum, val) => sum + val, 0) /
    energyValues.length;

  return Math.sqrt(variance);
};

export const calculateEnergyForTimeSlot = (
  moods: Mood[],
  targetHour: number
): number => {
  const relevantMoods = moods.filter(mood => {
    const moodHour = new Date(mood.timestamp).getHours();
    return Math.abs(moodHour - targetHour) <= 1;
  });

  if (relevantMoods.length === 0) {
    return calculateCurrentEnergy(moods);
  }

  const now = Date.now();
  let weightedSum = 0;
  let totalWeight = 0;

  relevantMoods.forEach(mood => {
    const daysAgo = (now - mood.timestamp) / (24 * 60 * 60 * 1000);
    const weight = Math.exp(-daysAgo / 7);

    weightedSum += mood.energy * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 50;
};

export const calculateEnergyByTimeSlot = (
  moods: Mood[]
): TimeSlotEnergy[] => {
  const timeSlots: Map<number, { sum: number; count: number; weights: number }> = new Map();

  const now = Date.now();

  moods.forEach(mood => {
    const hour = new Date(mood.timestamp).getHours();
    const daysAgo = (now - mood.timestamp) / (24 * 60 * 60 * 1000);
    const weight = Math.exp(-daysAgo / 14);

    const existing = timeSlots.get(hour) || { sum: 0, count: 0, weights: 0 };
    timeSlots.set(hour, {
      sum: existing.sum + mood.energy * weight,
      count: existing.count + 1,
      weights: existing.weights + weight,
    });
  });

  const result: TimeSlotEnergy[] = [];

  for (let hour = 0; hour < 24; hour++) {
    const data = timeSlots.get(hour);
    if (data && data.weights > 0) {
      result.push({
        hour,
        averageEnergy: Math.round(data.sum / data.weights),
        confidence: Math.min(
          data.count / MIN_SAMPLES_FOR_CONFIDENCE,
          1
        ),
      });
    } else {
      result.push({
        hour,
        averageEnergy: 50,
        confidence: 0,
      });
    }
  }

  return result;
};

export const calculateEnergyByDayOfWeek = (
  moods: Mood[]
): DayOfWeekEnergy[] => {
  const daySlots: Map<number, { sum: number; count: number; weights: number }> = new Map();

  const now = Date.now();

  moods.forEach(mood => {
    const dayOfWeek = new Date(mood.timestamp).getDay();
    const daysAgo = (now - mood.timestamp) / (24 * 60 * 60 * 1000);
    const weight = Math.exp(-daysAgo / 21);

    const existing = daySlots.get(dayOfWeek) || { sum: 0, count: 0, weights: 0 };
    daySlots.set(dayOfWeek, {
      sum: existing.sum + mood.energy * weight,
      count: existing.count + 1,
      weights: existing.weights + weight,
    });
  });

  const result: DayOfWeekEnergy[] = [];

  for (let day = 0; day < 7; day++) {
    const data = daySlots.get(day);
    if (data && data.weights > 0) {
      result.push({
        dayOfWeek: day,
        averageEnergy: Math.round(data.sum / data.weights),
        confidence: Math.min(
          data.count / (MIN_SAMPLES_FOR_CONFIDENCE * 2),
          1
        ),
      });
    } else {
      result.push({
        dayOfWeek: day,
        averageEnergy: 50,
        confidence: 0,
      });
    }
  }

  return result;
};

export const predictEnergyAtTime = (
  moods: Mood[],
  targetTimestamp: number
): number => {
  if (moods.length === 0) return 50;

  const targetDate = new Date(targetTimestamp);
  const targetHour = targetDate.getHours();
  const targetDay = targetDate.getDay();

  const timeSlotEnergies = calculateEnergyByTimeSlot(moods);
  const dayEnergies = calculateEnergyByDayOfWeek(moods);

  const timeSlotData = timeSlotEnergies.find(t => t.hour === targetHour);
  const dayData = dayEnergies.find(d => d.dayOfWeek === targetDay);

  const currentEnergy = calculateCurrentEnergy(moods);

  const weights = {
    current: 0.3,
    timeSlot: timeSlotData ? timeSlotData.confidence * 0.4 : 0,
    day: dayData ? dayData.confidence * 0.3 : 0,
  };

  const totalWeight = weights.current + weights.timeSlot + weights.day;

  if (totalWeight === 0) return currentEnergy;

  const weightedEnergy =
    (currentEnergy * weights.current +
      (timeSlotData?.averageEnergy || 50) * weights.timeSlot +
      (dayData?.averageEnergy || 50) * weights.day) /
    totalWeight;

  return Math.round(weightedEnergy);
};

export const getEnergyLevel = (energy: number): 'low' | 'medium' | 'high' => {
  if (energy < 40) return 'low';
  if (energy < 70) return 'medium';
  return 'high';
};

export const getEnergyColor = (energy: number, isDark: boolean): string => {
  if (energy < 30) return isDark ? '#EF4444' : '#DC2626';
  if (energy < 50) return isDark ? '#F59E0B' : '#D97706';
  if (energy < 70) return isDark ? '#10B981' : '#059669';
  return isDark ? '#14B8A6' : '#0D9488';
};

export const calculateOptimalWorkHours = (
  moods: Mood[]
): { startHour: number; endHour: number; averageEnergy: number }[] => {
  const timeSlots = calculateEnergyByTimeSlot(moods);

  const workHours = timeSlots.filter(
    slot => slot.hour >= 6 && slot.hour <= 22 && slot.confidence > 0.3
  );

  if (workHours.length === 0) {
    return [{ startHour: 9, endHour: 17, averageEnergy: 50 }];
  }

  workHours.sort((a, b) => b.averageEnergy - a.averageEnergy);

  const blocks: { startHour: number; endHour: number; averageEnergy: number }[] = [];
  let currentBlock: number[] = [];

  workHours.forEach((slot, index) => {
    if (currentBlock.length === 0) {
      currentBlock.push(slot.hour);
    } else {
      const lastHour = currentBlock[currentBlock.length - 1];
      if (slot.hour === lastHour + 1) {
        currentBlock.push(slot.hour);
      } else {
        if (currentBlock.length >= 2) {
          const blockEnergies = currentBlock.map(
            h => timeSlots.find(t => t.hour === h)?.averageEnergy || 50
          );
          const avgEnergy =
            blockEnergies.reduce((sum, e) => sum + e, 0) / blockEnergies.length;

          blocks.push({
            startHour: currentBlock[0],
            endHour: currentBlock[currentBlock.length - 1] + 1,
            averageEnergy: Math.round(avgEnergy),
          });
        }
        currentBlock = [slot.hour];
      }
    }

    if (index === workHours.length - 1 && currentBlock.length >= 2) {
      const blockEnergies = currentBlock.map(
        h => timeSlots.find(t => t.hour === h)?.averageEnergy || 50
      );
      const avgEnergy =
        blockEnergies.reduce((sum, e) => sum + e, 0) / blockEnergies.length;

      blocks.push({
        startHour: currentBlock[0],
        endHour: currentBlock[currentBlock.length - 1] + 1,
        averageEnergy: Math.round(avgEnergy),
      });
    }
  });

  return blocks.sort((a, b) => b.averageEnergy - a.averageEnergy).slice(0, 3);
};

export const shouldTakeBreak = (
  moods: Mood[],
  lastBreakTimestamp?: number
): boolean => {
  const currentEnergy = calculateCurrentEnergy(moods);
  const stats = calculateEnergyStats(moods);

  const timeSinceBreak = lastBreakTimestamp
    ? (Date.now() - lastBreakTimestamp) / (60 * 60 * 1000)
    : 999;

  if (timeSinceBreak < 2) return false;

  if (currentEnergy < 30) return true;

  if (stats.trend === 'falling' && currentEnergy < 50) return true;

  if (stats.volatility > 20 && currentEnergy < 60) return true;

  if (timeSinceBreak > 3 && currentEnergy < 70) return true;

  return false;
};