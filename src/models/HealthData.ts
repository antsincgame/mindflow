export interface HeartRateSample {
  id: string;
  value: number; // beats per minute
  timestamp: Date;
  source?: string;
}

export interface HeartRateData {
  current: number | null;
  resting: number | null;
  min: number | null;
  max: number | null;
  average: number | null;
  samples: HeartRateSample[];
  lastUpdated: Date | null;
}

export interface HRVSample {
  id: string;
  value: number; // milliseconds (SDNN)
  timestamp: Date;
  source?: string;
}

export interface HRVData {
  current: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  samples: HRVSample[];
  lastUpdated: Date | null;
}

export enum SleepStage {
  Awake = 'awake',
  REM = 'rem',
  Core = 'core',
  Deep = 'deep',
  InBed = 'inBed',
  Asleep = 'asleep',
  Unknown = 'unknown',
}

export interface SleepStageSample {
  stage: SleepStage;
  startDate: Date;
  endDate: Date;
  durationMinutes: number;
}

export interface SleepData {
  totalDurationMinutes: number | null;
  quality: SleepQuality | null;
  qualityScore: number | null; // 0-100
  bedtime: Date | null;
  wakeTime: Date | null;
  stages: SleepStageSample[];
  deepSleepMinutes: number | null;
  remSleepMinutes: number | null;
  coreSleepMinutes: number | null;
  awakeMinutes: number | null;
  lastUpdated: Date | null;
}

export enum SleepQuality {
  Poor = 'poor',
  Fair = 'fair',
  Good = 'good',
  Excellent = 'excellent',
}

export interface RespiratoryRateSample {
  id: string;
  value: number; // breaths per minute
  timestamp: Date;
  source?: string;
}

export interface RespiratoryData {
  current: number | null;
  average: number | null;
  min: number | null;
  max: number | null;
  samples: RespiratoryRateSample[];
  lastUpdated: Date | null;
}

export interface ActivitySample {
  id: string;
  steps: number;
  activeEnergyBurned: number; // kcal
  exerciseMinutes: number;
  standHours: number;
  date: Date;
}

export interface ActivityData {
  steps: number | null;
  activeEnergyBurned: number | null; // kcal
  exerciseMinutes: number | null;
  standHours: number | null;
  distanceKm: number | null;
  samples: ActivitySample[];
  lastUpdated: Date | null;
}

export interface AggregatedHealthData {
  heartRate: HeartRateData;
  hrv: HRVData;
  sleep: SleepData;
  respiratory: RespiratoryData;
  activity: ActivityData;
  stressLevel: number | null; // 0-100, calculated
  lastSyncTimestamp: Date | null;
}

export interface HealthDataSnapshot {
  heartRate: number | null;
  hrv: number | null;
  stressLevel: number | null;
  sleepQualityScore: number | null;
  respiratoryRate: number | null;
  steps: number | null;
  timestamp: Date;
}

export interface HealthDataPeriodSummary {
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  averageHeartRate: number | null;
  averageHRV: number | null;
  averageStressLevel: number | null;
  averageSleepDurationMinutes: number | null;
  averageSleepQualityScore: number | null;
  averageRespiratoryRate: number | null;
  totalSteps: number | null;
  totalExerciseMinutes: number | null;
  dataPoints: number;
}

export interface HealthPermissionStatus {
  heartRate: boolean;
  hrv: boolean;
  sleep: boolean;
  respiratory: boolean;
  activity: boolean;
  allGranted: boolean;
}

export const DEFAULT_HEART_RATE_DATA: HeartRateData = {
  current: null,
  resting: null,
  min: null,
  max: null,
  average: null,
  samples: [],
  lastUpdated: null,
};

export const DEFAULT_HRV_DATA: HRVData = {
  current: null,
  average: null,
  min: null,
  max: null,
  samples: [],
  lastUpdated: null,
};

export const DEFAULT_SLEEP_DATA: SleepData = {
  totalDurationMinutes: null,
  quality: null,
  qualityScore: null,
  bedtime: null,
  wakeTime: null,
  stages: [],
  deepSleepMinutes: null,
  remSleepMinutes: null,
  coreSleepMinutes: null,
  awakeMinutes: null,
  lastUpdated: null,
};

export const DEFAULT_RESPIRATORY_DATA: RespiratoryData = {
  current: null,
  average: null,
  min: null,
  max: null,
  samples: [],
  lastUpdated: null,
};

export const DEFAULT_ACTIVITY_DATA: ActivityData = {
  steps: null,
  activeEnergyBurned: null,
  exerciseMinutes: null,
  standHours: null,
  distanceKm: null,
  samples: [],
  lastUpdated: null,
};

export const DEFAULT_AGGREGATED_HEALTH_DATA: AggregatedHealthData = {
  heartRate: DEFAULT_HEART_RATE_DATA,
  hrv: DEFAULT_HRV_DATA,
  sleep: DEFAULT_SLEEP_DATA,
  respiratory: DEFAULT_RESPIRATORY_DATA,
  activity: DEFAULT_ACTIVITY_DATA,
  stressLevel: null,
  lastSyncTimestamp: null,
};

export const createHealthDataSnapshot = (
  data: AggregatedHealthData,
): HealthDataSnapshot => ({
  heartRate: data.heartRate.current,
  hrv: data.hrv.current,
  stressLevel: data.stressLevel,
  sleepQualityScore: data.sleep.qualityScore,
  respiratoryRate: data.respiratory.current,
  steps: data.activity.steps,
  timestamp: new Date(),
});