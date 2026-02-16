import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useHealthData } from './useHealthData';
import { calculateStressLevel, normalizeHeartRate, normalizeHRV, normalizeSleep, normalizeActivity } from '../utils/stressAlgorithm';
import { EmotionType } from '../models/Emotion';

export type StressTrend = 'increasing' | 'decreasing' | 'stable' | 'unknown';

export interface StressSnapshot {
  level: number;
  timestamp: number;
  heartRate: number | null;
  hrv: number | null;
  emotion: EmotionType | null;
}

export interface StressSessionHistory {
  before: StressSnapshot | null;
  after: StressSnapshot | null;
  snapshots: StressSnapshot[];
}

export interface UseStressLevelReturn {
  currentLevel: number;
  trend: StressTrend;
  isLoading: boolean;
  error: string | null;
  sessionHistory: StressSessionHistory;
  startSession: (emotion: EmotionType) => void;
  endSession: () => void;
  resetSession: () => void;
  getStressLabel: () => string;
  getStressColor: () => string;
  stressDelta: number | null;
}

const EMOTION_STRESS_WEIGHTS: Record<EmotionType, number> = {
  stress: 0.85,
  anxiety: 0.75,
  irritation: 0.7,
  overwhelm: 0.8,
  sadness: 0.5,
  fatigue: 0.55,
};

const TREND_THRESHOLD = 3;
const SNAPSHOT_INTERVAL_MS = 10000;
const MIN_SNAPSHOTS_FOR_TREND = 3;

export function useStressLevel(emotion?: EmotionType | null): UseStressLevelReturn {
  const { heartRate, hrv, sleepData, activityData, isLoading: healthLoading, error: healthError } = useHealthData();

  const [currentLevel, setCurrentLevel] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionHistory, setSessionHistory] = useState<StressSessionHistory>({
    before: null,
    after: null,
    snapshots: [],
  });

  const activeEmotion = useRef<EmotionType | null>(emotion ?? null);
  const isSessionActive = useRef<boolean>(false);
  const snapshotIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const computeStressLevel = useCallback(
    (emotionType: EmotionType | null): number => {
      try {
        const hr = heartRate?.value ?? null;
        const hrvValue = hrv?.value ?? null;
        const sleepQuality = sleepData?.quality ?? null;
        const activity = activityData?.activeEnergyBurned ?? null;

        const normalizedHR = hr !== null ? normalizeHeartRate(hr) : 0.5;
        const normalizedHRV = hrvValue !== null ? normalizeHRV(hrvValue) : 0.5;
        const normalizedSleep = sleepQuality !== null ? normalizeSleep(sleepQuality) : 0.5;
        const normalizedActivity = activity !== null ? normalizeActivity(activity) : 0.5;

        let biometricStress = calculateStressLevel(
          normalizedHR,
          normalizedHRV,
          normalizedSleep,
          normalizedActivity
        );

        if (emotionType) {
          const emotionWeight = EMOTION_STRESS_WEIGHTS[emotionType] ?? 0.5;
          const emotionContribution = emotionWeight * 100;
          biometricStress = biometricStress * 0.6 + emotionContribution * 0.4;
        }

        return Math.round(Math.min(100, Math.max(0, biometricStress)));
      } catch (e) {
        setError('Failed to compute stress level');
        return 0;
      }
    },
    [heartRate, hrv, sleepData, activityData]
  );

  const createSnapshot = useCallback(
    (emotionType: EmotionType | null): StressSnapshot => {
      const level = computeStressLevel(emotionType);
      return {
        level,
        timestamp: Date.now(),
        heartRate: heartRate?.value ?? null,
        hrv: hrv?.value ?? null,
        emotion: emotionType,
      };
    },
    [computeStressLevel, heartRate, hrv]
  );

  useEffect(() => {
    activeEmotion.current = emotion ?? null;
  }, [emotion]);

  useEffect(() => {
    if (healthLoading) {
      setIsLoading(true);
      return;
    }

    const level = computeStressLevel(activeEmotion.current);
    setCurrentLevel(level);
    setIsLoading(false);
    setError(healthError);
  }, [computeStressLevel, healthLoading, healthError]);

  const startSession = useCallback(
    (sessionEmotion: EmotionType) => {
      activeEmotion.current = sessionEmotion;
      isSessionActive.current = true;

      const beforeSnapshot = createSnapshot(sessionEmotion);

      setSessionHistory({
        before: beforeSnapshot,
        after: null,
        snapshots: [beforeSnapshot],
      });

      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }

      snapshotIntervalRef.current = setInterval(() => {
        if (!isSessionActive.current) return;

        const snapshot = createSnapshot(activeEmotion.current);
        setCurrentLevel(snapshot.level);

        setSessionHistory((prev) => ({
          ...prev,
          snapshots: [...prev.snapshots, snapshot],
        }));
      }, SNAPSHOT_INTERVAL_MS);
    },
    [createSnapshot]
  );

  const endSession = useCallback(() => {
    isSessionActive.current = false;

    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }

    const afterSnapshot = createSnapshot(activeEmotion.current);
    setCurrentLevel(afterSnapshot.level);

    setSessionHistory((prev) => ({
      ...prev,
      after: afterSnapshot,
      snapshots: [...prev.snapshots, afterSnapshot],
    }));
  }, [createSnapshot]);

  const resetSession = useCallback(() => {
    isSessionActive.current = false;
    activeEmotion.current = emotion ?? null;

    if (snapshotIntervalRef.current) {
      clearInterval(snapshotIntervalRef.current);
      snapshotIntervalRef.current = null;
    }

    setSessionHistory({
      before: null,
      after: null,
      snapshots: [],
    });
  }, [emotion]);

  useEffect(() => {
    return () => {
      if (snapshotIntervalRef.current) {
        clearInterval(snapshotIntervalRef.current);
      }
    };
  }, []);

  const trend = useMemo((): StressTrend => {
    const { snapshots } = sessionHistory;

    if (snapshots.length < MIN_SNAPSHOTS_FOR_TREND) {
      return 'unknown';
    }

    const recentSnapshots = snapshots.slice(-MIN_SNAPSHOTS_FOR_TREND);
    const firstLevel = recentSnapshots[0].level;
    const lastLevel = recentSnapshots[recentSnapshots.length - 1].level;
    const delta = lastLevel - firstLevel;

    if (delta > TREND_THRESHOLD) {
      return 'increasing';
    }
    if (delta < -TREND_THRESHOLD) {
      return 'decreasing';
    }
    return 'stable';
  }, [sessionHistory]);

  const stressDelta = useMemo((): number | null => {
    const { before, after } = sessionHistory;
    if (!before || !after) return null;
    return after.level - before.level;
  }, [sessionHistory]);

  const getStressLabel = useCallback((): string => {
    if (currentLevel <= 20) return 'Очень спокойно';
    if (currentLevel <= 40) return 'Спокойно';
    if (currentLevel <= 60) return 'Умеренный стресс';
    if (currentLevel <= 80) return 'Высокий стресс';
    return 'Очень высокий стресс';
  }, [currentLevel]);

  const getStressColor = useCallback((): string => {
    if (currentLevel <= 20) return '#4CAF50';
    if (currentLevel <= 40) return '#8BC34A';
    if (currentLevel <= 60) return '#FFC107';
    if (currentLevel <= 80) return '#FF9800';
    return '#F44336';
  }, [currentLevel]);

  return {
    currentLevel,
    trend,
    isLoading,
    error,
    sessionHistory,
    startSession,
    endSession,
    resetSession,
    getStressLabel,
    getStressColor,
    stressDelta,
  };
}