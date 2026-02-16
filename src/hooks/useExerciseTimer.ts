import { useState, useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Haptics from 'expo-haptics';
import AudioService from '../services/AudioService';

export interface ExerciseTimerState {
  currentPhase: 'preparation' | 'inhale' | 'hold' | 'exhale' | 'rest' | 'completed';
  currentCycle: number;
  totalCycles: number;
  timeRemaining: number;
  totalTime: number;
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
}

export interface ExercisePattern {
  preparation?: number;
  inhale: number;
  hold?: number;
  exhale: number;
  rest?: number;
  cycles: number;
}

interface UseExerciseTimerOptions {
  pattern: ExercisePattern;
  onPhaseChange?: (phase: ExerciseTimerState['currentPhase']) => void;
  onCycleComplete?: (cycle: number) => void;
  onComplete?: () => void;
  enableHaptics?: boolean;
  enableAudio?: boolean;
}

export const useExerciseTimer = ({
  pattern,
  onPhaseChange,
  onCycleComplete,
  onComplete,
  enableHaptics = true,
  enableAudio = true,
}: UseExerciseTimerOptions) => {
  const [state, setState] = useState<ExerciseTimerState>({
    currentPhase: pattern.preparation ? 'preparation' : 'inhale',
    currentCycle: 1,
    totalCycles: pattern.cycles,
    timeRemaining: pattern.preparation || pattern.inhale,
    totalTime: calculateTotalTime(pattern),
    isRunning: false,
    isPaused: false,
    progress: 0,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const backgroundTimeRef = useRef<number>(0);
  const audioServiceRef = useRef(new AudioService());

  const getNextPhase = useCallback(
    (
      currentPhase: ExerciseTimerState['currentPhase'],
      currentCycle: number
    ): { phase: ExerciseTimerState['currentPhase']; duration: number; nextCycle: number } => {
      switch (currentPhase) {
        case 'preparation':
          return { phase: 'inhale', duration: pattern.inhale, nextCycle: currentCycle };
        case 'inhale':
          if (pattern.hold) {
            return { phase: 'hold', duration: pattern.hold, nextCycle: currentCycle };
          }
          return { phase: 'exhale', duration: pattern.exhale, nextCycle: currentCycle };
        case 'hold':
          return { phase: 'exhale', duration: pattern.exhale, nextCycle: currentCycle };
        case 'exhale':
          if (pattern.rest && currentCycle < pattern.cycles) {
            return { phase: 'rest', duration: pattern.rest, nextCycle: currentCycle };
          }
          if (currentCycle < pattern.cycles) {
            return { phase: 'inhale', duration: pattern.inhale, nextCycle: currentCycle + 1 };
          }
          return { phase: 'completed', duration: 0, nextCycle: currentCycle };
        case 'rest':
          return { phase: 'inhale', duration: pattern.inhale, nextCycle: currentCycle + 1 };
        case 'completed':
          return { phase: 'completed', duration: 0, nextCycle: currentCycle };
        default:
          return { phase: 'inhale', duration: pattern.inhale, nextCycle: currentCycle };
      }
    },
    [pattern]
  );

  const triggerHapticFeedback = useCallback(
    (phase: ExerciseTimerState['currentPhase']) => {
      if (!enableHaptics) return;

      switch (phase) {
        case 'preparation':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'inhale':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'hold':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'exhale':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'rest':
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
          break;
        case 'completed':
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
      }
    },
    [enableHaptics]
  );

  const playAudioCue = useCallback(
    async (phase: ExerciseTimerState['currentPhase']) => {
      if (!enableAudio) return;

      try {
        switch (phase) {
          case 'preparation':
            await audioServiceRef.current.playSound('preparation');
            break;
          case 'inhale':
            await audioServiceRef.current.playSound('inhale');
            break;
          case 'hold':
            await audioServiceRef.current.playSound('hold');
            break;
          case 'exhale':
            await audioServiceRef.current.playSound('exhale');
            break;
          case 'completed':
            await audioServiceRef.current.playSound('complete');
            break;
        }
      } catch (error) {
        console.error('Error playing audio cue:', error);
      }
    },
    [enableAudio]
  );

  const tick = useCallback(() => {
    setState((prevState) => {
      if (!prevState.isRunning || prevState.isPaused) return prevState;

      const newTimeRemaining = prevState.timeRemaining - 1;

      if (newTimeRemaining <= 0) {
        const { phase: nextPhase, duration, nextCycle } = getNextPhase(
          prevState.currentPhase,
          prevState.currentCycle
        );

        if (nextPhase === 'completed') {
          onComplete?.();
          triggerHapticFeedback('completed');
          playAudioCue('completed');
          return {
            ...prevState,
            currentPhase: 'completed',
            timeRemaining: 0,
            isRunning: false,
            progress: 1,
          };
        }

        if (nextCycle > prevState.currentCycle) {
          onCycleComplete?.(prevState.currentCycle);
        }

        onPhaseChange?.(nextPhase);
        triggerHapticFeedback(nextPhase);
        playAudioCue(nextPhase);

        const elapsedTime = prevState.totalTime - calculateRemainingTime(pattern, nextPhase, nextCycle, duration);
        const progress = elapsedTime / prevState.totalTime;

        return {
          ...prevState,
          currentPhase: nextPhase,
          currentCycle: nextCycle,
          timeRemaining: duration,
          progress,
        };
      }

      const elapsedTime = prevState.totalTime - calculateRemainingTime(
        pattern,
        prevState.currentPhase,
        prevState.currentCycle,
        newTimeRemaining
      );
      const progress = elapsedTime / prevState.totalTime;

      return {
        ...prevState,
        timeRemaining: newTimeRemaining,
        progress,
      };
    });
  }, [getNextPhase, onComplete, onCycleComplete, onPhaseChange, pattern, triggerHapticFeedback, playAudioCue]);

  const start = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRunning: true,
      isPaused: false,
    }));

    if (state.currentPhase === pattern.preparation ? 'preparation' : 'inhale') {
      triggerHapticFeedback(state.currentPhase);
      playAudioCue(state.currentPhase);
    }
  }, [state.currentPhase, pattern.preparation, triggerHapticFeedback, playAudioCue]);

  const pause = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isPaused: true,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const resume = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isPaused: false,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const stop = useCallback(() => {
    setState((prevState) => ({
      ...prevState,
      isRunning: false,
      isPaused: false,
    }));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  const reset = useCallback(() => {
    setState({
      currentPhase: pattern.preparation ? 'preparation' : 'inhale',
      currentCycle: 1,
      totalCycles: pattern.cycles,
      timeRemaining: pattern.preparation || pattern.inhale,
      totalTime: calculateTotalTime(pattern),
      isRunning: false,
      isPaused: false,
      progress: 0,
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [pattern]);

  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(tick, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused, tick]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appStateRef.current.match(/active/) && nextAppState.match(/inactive|background/)) {
        if (state.isRunning && !state.isPaused) {
          backgroundTimeRef.current = Date.now();
        }
      }

      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        if (state.isRunning && !state.isPaused && backgroundTimeRef.current > 0) {
          const timeInBackground = Math.floor((Date.now() - backgroundTimeRef.current) / 1000);
          
          setState((prevState) => {
            let remainingTime = prevState.timeRemaining - timeInBackground;
            let currentPhase = prevState.currentPhase;
            let currentCycle = prevState.currentCycle;

            while (remainingTime <= 0 && currentPhase !== 'completed') {
              const { phase: nextPhase, duration, nextCycle } = getNextPhase(currentPhase, currentCycle);
              
              if (nextPhase === 'completed') {
                return {
                  ...prevState,
                  currentPhase: 'completed',
                  timeRemaining: 0,
                  isRunning: false,
                  progress: 1,
                };
              }

              remainingTime += duration;
              currentPhase = nextPhase;
              currentCycle = nextCycle;
            }

            const elapsedTime = prevState.totalTime - calculateRemainingTime(
              pattern,
              currentPhase,
              currentCycle,
              remainingTime
            );
            const progress = elapsedTime / prevState.totalTime;

            return {
              ...prevState,
              currentPhase,
              currentCycle,
              timeRemaining: remainingTime,
              progress,
            };
          });

          backgroundTimeRef.current = 0;
        }
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [state.isRunning, state.isPaused, getNextPhase, pattern]);

  useEffect(() => {
    return () => {
      audioServiceRef.current.unloadAll();
    };
  }, []);

  return {
    state,
    start,
    pause,
    resume,
    stop,
    reset,
  };
};

function calculateTotalTime(pattern: ExercisePattern): number {
  const cycleTime =
    pattern.inhale +
    (pattern.hold || 0) +
    pattern.exhale +
    (pattern.rest || 0);
  
  return (pattern.preparation || 0) + cycleTime * pattern.cycles;
}

function calculateRemainingTime(
  pattern: ExercisePattern,
  currentPhase: ExerciseTimerState['currentPhase'],
  currentCycle: number,
  timeRemainingInPhase: number
): number {
  const cycleTime =
    pattern.inhale +
    (pattern.hold || 0) +
    pattern.exhale +
    (pattern.rest || 0);

  const remainingCycles = pattern.cycles - currentCycle;
  let remainingInCurrentCycle = timeRemainingInPhase;

  switch (currentPhase) {
    case 'preparation':
      remainingInCurrentCycle += cycleTime * pattern.cycles;
      break;
    case 'inhale':
      remainingInCurrentCycle +=
        (pattern.hold || 0) +
        pattern.exhale +
        (pattern.rest || 0);
      break;
    case 'hold':
      remainingInCurrentCycle += pattern.exhale + (pattern.rest || 0);
      break;
    case 'exhale':
      remainingInCurrentCycle += pattern.rest || 0;
      break;
    case 'rest':
      break;
    case 'completed':
      return 0;
  }

  return remainingInCurrentCycle + remainingCycles * cycleTime;
}

export default useExerciseTimer;