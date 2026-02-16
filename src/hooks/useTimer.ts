import { useEffect, useRef, useCallback, useState } from 'react';

export interface TimerOptions {
  initialSeconds: number;
  onTick?: (remaining: number) => void;
  onComplete?: () => void;
  autoStart?: boolean;
}

export interface TimerState {
  remaining: number;
  isRunning: boolean;
  isPaused: boolean;
  progress: number;
}

export const useTimer = ({
  initialSeconds,
  onTick,
  onComplete,
  autoStart = false,
}: TimerOptions) => {
  const [remaining, setRemaining] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(autoStart);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const initialSecondsRef = useRef(initialSeconds);

  const progress = 1 - remaining / initialSecondsRef.current;

  const tick = useCallback(() => {
    setRemaining((prev) => {
      const newRemaining = prev - 1;
      
      if (onTick) {
        onTick(newRemaining);
      }

      if (newRemaining <= 0) {
        setIsRunning(false);
        if (onComplete) {
          onComplete();
        }
        return 0;
      }

      return newRemaining;
    });
  }, [onTick, onComplete]);

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, tick]);

  const start = useCallback(() => {
    setIsRunning(true);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
  }, []);

  const stop = useCallback(() => {
    setIsRunning(false);
    setIsPaused(false);
    setRemaining(initialSecondsRef.current);
  }, []);

  const reset = useCallback((newSeconds?: number) => {
    setIsRunning(false);
    setIsPaused(false);
    const resetValue = newSeconds ?? initialSecondsRef.current;
    initialSecondsRef.current = resetValue;
    setRemaining(resetValue);
  }, []);

  const setSeconds = useCallback((seconds: number) => {
    if (!isRunning && !isPaused) {
      initialSecondsRef.current = seconds;
      setRemaining(seconds);
    }
  }, [isRunning, isPaused]);

  const formatTime = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }, []);

  return {
    remaining,
    isRunning,
    isPaused,
    progress,
    formattedTime: formatTime(remaining),
    start,
    pause,
    resume,
    stop,
    reset,
    setSeconds,
  };
};