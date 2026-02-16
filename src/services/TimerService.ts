import { useCallback, useRef, useEffect } from 'react';
import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export interface TimerState {
  isRunning: boolean;
  isPaused: boolean;
  timeRemaining: number;
  totalTime: number;
  type: 'session' | 'break';
}

export interface TimerCallbacks {
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onStop?: () => void;
}

const TIMER_TASK_NAME = 'MINDFLOW_TIMER_TASK';
let timerInterval: NodeJS.Timeout | null = null;
let currentState: TimerState | null = null;
let callbacks: TimerCallbacks = {};

class TimerServiceClass {
  private soundObject: Audio.Sound | null = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: false,
      });

      this.isInitialized = true;
      this.registerBackgroundTask();
    } catch (error) {
      console.error('Failed to initialize TimerService:', error);
    }
  }

  private registerBackgroundTask(): void {
    TaskManager.defineTask(TIMER_TASK_NAME, async () => {
      if (currentState && currentState.isRunning && !currentState.isPaused) {
        currentState.timeRemaining -= 1;

        if (callbacks.onTick) {
          callbacks.onTick(currentState.timeRemaining);
        }

        if (currentState.timeRemaining <= 0) {
          currentState.isRunning = false;
          await this.playCompletionSound(currentState.type);
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (callbacks.onComplete) {
            callbacks.onComplete();
          }

          return BackgroundFetch.Result.NewData;
        }
      }

      return BackgroundFetch.Result.NoData;
    });
  }

  async startTimer(
    totalSeconds: number,
    type: 'session' | 'break',
    timerCallbacks: TimerCallbacks
  ): Promise<void> {
    await this.initialize();

    currentState = {
      isRunning: true,
      isPaused: false,
      timeRemaining: totalSeconds,
      totalTime: totalSeconds,
      type,
    };

    callbacks = timerCallbacks;

    this.startForegroundTimer();

    try {
      await BackgroundFetch.registerTaskAsync(TIMER_TASK_NAME, {
        minimumInterval: 1,
        stopOnTerminate: false,
        startOnBoot: true,
      });
    } catch (error) {
      console.error('Failed to register background task:', error);
    }
  }

  private startForegroundTimer(): void {
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    timerInterval = setInterval(() => {
      if (currentState && currentState.isRunning && !currentState.isPaused) {
        currentState.timeRemaining -= 1;

        if (callbacks.onTick) {
          callbacks.onTick(currentState.timeRemaining);
        }

        if (currentState.timeRemaining <= 0) {
          this.stopTimer();
          this.playCompletionSound(currentState.type);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

          if (callbacks.onComplete) {
            callbacks.onComplete();
          }
        }
      }
    }, 1000);
  }

  pauseTimer(): void {
    if (currentState) {
      currentState.isPaused = true;

      if (callbacks.onPause) {
        callbacks.onPause();
      }
    }
  }

  resumeTimer(): void {
    if (currentState) {
      currentState.isPaused = false;

      if (callbacks.onResume) {
        callbacks.onResume();
      }
    }
  }

  stopTimer(): void {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }

    currentState = null;
    callbacks = {};

    if (callbacks.onStop) {
      callbacks.onStop();
    }

    try {
      BackgroundFetch.unregisterTaskAsync(TIMER_TASK_NAME);
    } catch (error) {
      console.error('Failed to unregister background task:', error);
    }
  }

  getState(): TimerState | null {
    return currentState;
  }

  getTimeRemaining(): number {
    return currentState?.timeRemaining ?? 0;
  }

  getTotalTime(): number {
    return currentState?.totalTime ?? 0;
  }

  getProgress(): number {
    if (!currentState || currentState.totalTime === 0) return 0;
    return (currentState.timeRemaining / currentState.totalTime) * 100;
  }

  isRunning(): boolean {
    return currentState?.isRunning ?? false;
  }

  isPaused(): boolean {
    return currentState?.isPaused ?? false;
  }

  private async playCompletionSound(type: 'session' | 'break'): Promise<void> {
    try {
      const soundFile = type === 'session'
        ? require('../../assets/sounds/session-complete.mp3')
        : require('../../assets/sounds/break-complete.mp3');

      if (this.soundObject) {
        await this.soundObject.unloadAsync();
      }

      this.soundObject = new Audio.Sound();
      await this.soundObject.loadAsync(soundFile);
      await this.soundObject.playAsync();
    } catch (error) {
      console.error('Failed to play completion sound:', error);
    }
  }

  async cleanup(): Promise<void> {
    this.stopTimer();

    if (this.soundObject) {
      try {
        await this.soundObject.unloadAsync();
      } catch (error) {
        console.error('Failed to unload sound:', error);
      }
    }

    try {
      await BackgroundFetch.unregisterTaskAsync(TIMER_TASK_NAME);
    } catch (error) {
      console.error('Failed to unregister background task:', error);
    }
  }
}

export const TimerService = new TimerServiceClass();

export const useTimer = (callbacks?: TimerCallbacks) => {
  const stateRef = useRef<TimerState | null>(null);

  useEffect(() => {
    TimerService.initialize();

    return () => {
      TimerService.cleanup();
    };
  }, []);

  const start = useCallback(
    (totalSeconds: number, type: 'session' | 'break' = 'session') => {
      TimerService.startTimer(totalSeconds, type, callbacks || {});
    },
    [callbacks]
  );

  const pause = useCallback(() => {
    TimerService.pauseTimer();
  }, []);

  const resume = useCallback(() => {
    TimerService.resumeTimer();
  }, []);

  const stop = useCallback(() => {
    TimerService.stopTimer();
  }, []);

  const getState = useCallback(() => {
    return TimerService.getState();
  }, []);

  const getTimeRemaining = useCallback(() => {
    return TimerService.getTimeRemaining();
  }, []);

  const getProgress = useCallback(() => {
    return TimerService.getProgress();
  }, []);

  return {
    start,
    pause,
    resume,
    stop,
    getState,
    getTimeRemaining,
    getProgress,
    isRunning: TimerService.isRunning(),
    isPaused: TimerService.isPaused(),
  };
};