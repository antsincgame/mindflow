import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { Exercise } from '../models/Exercise';
import { Session } from '../models/Session';
import { EmotionType } from '../models/Emotion';
import { useStressLevel } from './useStressLevel';
import { useBreathingPattern } from './useBreathingPattern';
import { useHealthData } from './useHealthData';
import { StorageService } from '../services/StorageService';
import { AchievementService } from '../services/AchievementService';
import { triggerHaptic } from '../utils/haptics';
import { v4 as uuidv4 } from 'uuid';

export type SessionStatus = 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';

export interface SessionMetrics {
  stressBefore: number;
  stressAfter: number | null;
  heartRateBefore: number | null;
  heartRateAfter: number | null;
  hrvBefore: number | null;
  hrvAfter: number | null;
  stressReadings: Array<{ timestamp: number; value: number }>;
  heartRateReadings: Array<{ timestamp: number; value: number }>;
}

export interface ExerciseSessionState {
  status: SessionStatus;
  elapsedSeconds: number;
  remainingSeconds: number;
  totalDurationSeconds: number;
  progress: number;
  metrics: SessionMetrics;
  currentPhaseLabel: string;
  isPaused: boolean;
  isCompleted: boolean;
  session: Session | null;
}

export interface ExerciseSessionActions {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export interface UseExerciseSessionReturn extends ExerciseSessionState, ExerciseSessionActions {}

const METRICS_SAMPLE_INTERVAL_MS = 5000;

export function useExerciseSession(
  exercise: Exercise | null,
  emotionType: EmotionType | null
): UseExerciseSessionReturn {
  const [status, setStatus] = useState<SessionStatus>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [session, setSession] = useState<Session | null>(null);
  const [metrics, setMetrics] = useState<SessionMetrics>({
    stressBefore: 0,
    stressAfter: null,
    heartRateBefore: null,
    heartRateAfter: null,
    hrvBefore: null,
    hrvAfter: null,
    stressReadings: [],
    heartRateReadings: [],
  });

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const metricsSamplerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const pausedAtRef = useRef<number>(0);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const { stressLevel } = useStressLevel(emotionType);
  const { heartRate, hrv } = useHealthData();
  const breathingPattern = useBreathingPattern(
    exercise?.breathingPattern ?? null,
    status === 'running'
  );

  const totalDurationSeconds = exercise ? exercise.duration * 60 : 0;
  const remainingSeconds = Math.max(0, totalDurationSeconds - elapsedSeconds);
  const progress = totalDurationSeconds > 0 ? Math.min(1, elapsedSeconds / totalDurationSeconds) : 0;
  const isPaused = status === 'paused';
  const isCompleted = status === 'completed';

  const currentPhaseLabel = breathingPattern?.currentPhaseLabel ?? '';

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (metricsSamplerRef.current) {
      clearInterval(metricsSamplerRef.current);
      metricsSamplerRef.current = null;
    }
  }, []);

  const sampleMetrics = useCallback(() => {
    const now = Date.now();

    setMetrics((prev) => {
      const updatedReadings = { ...prev };

      if (stressLevel !== null && stressLevel !== undefined) {
        updatedReadings.stressReadings = [
          ...prev.stressReadings,
          { timestamp: now, value: stressLevel },
        ];
      }

      if (heartRate !== null && heartRate !== undefined) {
        updatedReadings.heartRateReadings = [
          ...prev.heartRateReadings,
          { timestamp: now, value: heartRate },
        ];
      }

      return updatedReadings;
    });
  }, [stressLevel, heartRate]);

  const startMetricsSampler = useCallback(() => {
    if (metricsSamplerRef.current) {
      clearInterval(metricsSamplerRef.current);
    }
    metricsSamplerRef.current = setInterval(sampleMetrics, METRICS_SAMPLE_INTERVAL_MS);
  }, [sampleMetrics]);

  const saveSession = useCallback(
    async (finalStatus: 'completed' | 'cancelled') => {
      if (!exercise || !startTimeRef.current) return null;

      const endTime = new Date();
      const finalStress = stressLevel ?? metrics.stressBefore;
      const finalHeartRate = heartRate ?? metrics.heartRateBefore;
      const finalHrv = hrv ?? metrics.hrvBefore;

      const updatedMetrics: SessionMetrics = {
        ...metrics,
        stressAfter: finalStress,
        heartRateAfter: finalHeartRate,
        hrvAfter: finalHrv,
      };

      setMetrics(updatedMetrics);

      const completedSession: Session = {
        id: uuidv4(),
        exerciseId: exercise.id,
        emotionId: emotionType ?? 'stress',
        startedAt: startTimeRef.current.toISOString(),
        completedAt: endTime.toISOString(),
        durationSeconds: elapsedSeconds,
        stressBefore: updatedMetrics.stressBefore,
        stressAfter: updatedMetrics.stressAfter ?? updatedMetrics.stressBefore,
        heartRateBefore: updatedMetrics.heartRateBefore,
        heartRateAfter: updatedMetrics.heartRateAfter,
        hrvBefore: updatedMetrics.hrvBefore,
        hrvAfter: updatedMetrics.hrvAfter,
        completed: finalStatus === 'completed',
        stressReadings: updatedMetrics.stressReadings,
        heartRateReadings: updatedMetrics.heartRateReadings,
      };

      setSession(completedSession);

      try {
        await StorageService.saveSession(completedSession);

        if (finalStatus === 'completed') {
          await AchievementService.checkAndUnlock(completedSession);
        }
      } catch (error) {
        console.error('[useExerciseSession] Failed to save session:', error);
      }

      return completedSession;
    },
    [exercise, emotionType, elapsedSeconds, metrics, stressLevel, heartRate, hrv]
  );

  const start = useCallback(() => {
    if (!exercise) return;
    if (status === 'running') return;

    const initialStress = stressLevel ?? 50;
    const initialHeartRate = heartRate ?? null;
    const initialHrv = hrv ?? null;

    setMetrics({
      stressBefore: initialStress,
      stressAfter: null,
      heartRateBefore: initialHeartRate,
      heartRateAfter: null,
      hrvBefore: initialHrv,
      hrvAfter: null,
      stressReadings: [{ timestamp: Date.now(), value: initialStress }],
      heartRateReadings: initialHeartRate
        ? [{ timestamp: Date.now(), value: initialHeartRate }]
        : [],
    });

    startTimeRef.current = new Date();
    setElapsedSeconds(0);
    setStatus('running');
    setSession(null);

    triggerHaptic('impactLight');

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDurationSeconds) {
          clearTimers();
          setStatus('completed');
          triggerHaptic('notificationSuccess');
          return totalDurationSeconds;
        }
        return next;
      });
    }, 1000);

    startMetricsSampler();
  }, [exercise, status, stressLevel, heartRate, hrv, totalDurationSeconds, clearTimers, startMetricsSampler]);

  const pause = useCallback(() => {
    if (status !== 'running') return;

    clearTimers();
    pausedAtRef.current = elapsedSeconds;
    setStatus('paused');
    triggerHaptic('impactLight');
  }, [status, elapsedSeconds, clearTimers]);

  const resume = useCallback(() => {
    if (status !== 'paused') return;

    setStatus('running');
    triggerHaptic('impactLight');

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        const next = prev + 1;
        if (next >= totalDurationSeconds) {
          clearTimers();
          setStatus('completed');
          triggerHaptic('notificationSuccess');
          return totalDurationSeconds;
        }
        return next;
      });
    }, 1000);

    startMetricsSampler();
  }, [status, totalDurationSeconds, clearTimers, startMetricsSampler]);

  const stop = useCallback(() => {
    if (status === 'idle' || status === 'completed' || status === 'cancelled') return;

    clearTimers();

    const finalStatus = elapsedSeconds >= totalDurationSeconds ? 'completed' : 'cancelled';
    setStatus(finalStatus as SessionStatus);
    triggerHaptic(finalStatus === 'completed' ? 'notificationSuccess' : 'impactMedium');
  }, [status, elapsedSeconds, totalDurationSeconds, clearTimers]);

  const reset = useCallback(() => {
    clearTimers();
    setStatus('idle');
    setElapsedSeconds(0);
    setSession(null);
    setMetrics({
      stressBefore: 0,
      stressAfter: null,
      heartRateBefore: null,
      heartRateAfter: null,
      hrvBefore: null,
      hrvAfter: null,
      stressReadings: [],
      heartRateReadings: [],
    });
    startTimeRef.current = null;
    pausedAtRef.current = 0;
  }, [clearTimers]);

  // Auto-save when session completes or is cancelled
  useEffect(() => {
    if (status === 'completed' || status === 'cancelled') {
      saveSession(status === 'completed' ? 'completed' : 'cancelled');
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle app state changes (pause timer when app goes to background)
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current === 'active' &&
        nextAppState.match(/inactive|background/) &&
        status === 'running'
      ) {
        pause();
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [status, pause]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  return {
    status,
    elapsedSeconds,
    remainingSeconds,
    totalDurationSeconds,
    progress,
    metrics,
    currentPhaseLabel,
    isPaused,
    isCompleted,
    session,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}