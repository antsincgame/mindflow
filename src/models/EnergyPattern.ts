export interface EnergyPattern {
  id?: number;
  dayOfWeek: number;
  hourOfDay: number;
  averageEnergy: number;
  sampleCount: number;
  lastUpdated: number;
}

export interface EnergyPatternInsert {
  dayOfWeek: number;
  hourOfDay: number;
  averageEnergy: number;
  sampleCount?: number;
  lastUpdated?: number;
}

export interface EnergyPatternUpdate {
  averageEnergy?: number;
  sampleCount?: number;
  lastUpdated?: number;
}

export interface EnergyPrediction {
  dayOfWeek: number;
  hourOfDay: number;
  predictedEnergy: number;
  confidence: number;
}

export interface PeakEnergyPeriod {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  averageEnergy: number;
  duration: number;
}

export interface LowEnergyPeriod {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
  averageEnergy: number;
  duration: number;
}

export interface DayOfWeekPattern {
  dayOfWeek: number;
  dayName: string;
  averageEnergy: number;
  peakHour: number;
  lowestHour: number;
  energyVariance: number;
}

export interface HourlyPattern {
  hour: number;
  averageEnergy: number;
  consistency: number;
  daysWithData: number[];
}

export interface WeeklyEnergyProfile {
  patterns: EnergyPattern[];
  peakPeriods: PeakEnergyPeriod[];
  lowPeriods: LowEnergyPeriod[];
  mostProductiveDays: number[];
  leastProductiveDays: number[];
  averageWeeklyEnergy: number;
}

export const DAY_NAMES: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
};

export const HOUR_LABELS: Record<number, string> = {
  0: '12 AM', 1: '1 AM', 2: '2 AM', 3: '3 AM', 4: '4 AM', 5: '5 AM',
  6: '6 AM', 7: '7 AM', 8: '8 AM', 9: '9 AM', 10: '10 AM', 11: '11 AM',
  12: '12 PM', 13: '1 PM', 14: '2 PM', 15: '3 PM', 16: '4 PM', 17: '5 PM',
  18: '6 PM', 19: '7 PM', 20: '8 PM', 21: '9 PM', 22: '10 PM', 23: '11 PM',
};

export const ENERGY_THRESHOLDS = {
  LOW: 30,
  MEDIUM: 60,
  HIGH: 80,
} as const;

export const MIN_SAMPLES_FOR_PATTERN = 3;
export const MIN_CONFIDENCE_THRESHOLD = 0.6;
export const PATTERN_SMOOTHING_WINDOW = 2;