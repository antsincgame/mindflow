import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  BreathingPattern,
  BreathingPhase,
  BreathingPhaseType,
  BREATHING_PATTERNS,
} from '../models/BreathingPattern';

export interface BreathingState {
  currentPhase: BreathingPhaseType;
  phaseProgress: number; // 0-1
  phaseTimeRemaining: number; // seconds remaining in current phase
  phaseDuration: number; // total duration of current phase in seconds
  currentCycle: number;
  totalCycles: number;
  overallProgress: number; // 0-1
  isRunning: boolean;
  isPaused: boolean;
  isComplete: boolean;
  phaseLabel: string;
  elapsedTime: number; // total elapsed time in seconds
  totalDuration: number; // total exercise duration in seconds
}

interface UseBreathingPatternOptions {
  patternId?: string;
  customPattern?: BreathingPattern;
  onPhaseChange?: (phase: BreathingPhaseType, cycle: number) => void;
  onCycleComplete?: (cycle: number) => void;
  onComplete?: () => void;
  tickInterval?: number; // ms, default 50
}

const PHASE_LABELS: Record<BreathingPhaseType, string> = {
  inhale: 'Вдох',
  holdAfterInhale: 'Задержка',
  exhale: 'Выдох',
  holdAfterExhale: 'Задержка',
};

const PHASE_ORDER: BreathingPhaseType[] = [
  'inhale',
  'holdAfterInhale',
  'exhale',
  'holdAfterExhale',
];

function getPatternById(id: string): BreathingPattern | undefined {
  return BREATHING_PATTERNS.find((p) => p.id === id);
}

function getPhaseDuration(
  pattern: BreathingPattern,
  phase: BreathingPhaseType
): number {
  const phaseConfig = pattern.phases.find((p) => p.type === phase);
  return phaseConfig?.duration ?? 0;
}

function calculateTotalCycleDuration(pattern: BreathingPattern): number {
  return pattern.phases.reduce((sum, phase) => sum + phase.duration, 0);
}

function calculateTotalDuration(pattern: BreathingPattern): number {
  return calculateTotalCycleDuration(pattern) * pattern.cycles;
}

function getNextPhase(
  currentPhase: BreathingPhaseType,
  pattern: BreathingPattern
): BreathingPhaseType | null {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  for (let i = 1; i <= PHASE_ORDER.length; i++) {
    const nextIndex = (currentIndex + i) % PHASE_ORDER.length;
    const nextPhase = PHASE_ORDER[nextIndex];
    const duration = getPhaseDuration(pattern, nextPhase);
    if (duration > 0) {
      return nextPhase;
    }
  }

  return null;
}

function getFirstPhase(pattern: BreathingPattern): BreathingPhaseType {
  for (const phase of PHASE_ORDER) {
    if (getPhaseDuration(pattern, phase) > 0) {
      return phase;
    }
  }
  return 'inhale';
}

function isLastPhaseInCycle(
  currentPhase: BreathingPhaseType,
  pattern: BreathingPattern
): boolean {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);

  for (let i = currentIndex + 1; i < PHASE_ORDER.length; i++) {
    if (getPhaseDuration(pattern, PHASE_ORDER[i]) > 0) {
      return false;
    }
  }

  return true;
}

export function useBreathingPattern(
  options: UseBreathingPatternOptions = {}
): BreathingState & {
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  setPattern: (patternId: string) => void;
} {
  const {
    patternId = 'box',
    customPattern,
    onPhaseChange,
    onCycleComplete,
    onComplete,
    tickInterval = 50,
  } = options;

  const [pattern, setPatternState] = useState<BreathingPattern>(
    () => customPattern ?? getPatternById(patternId) ?? BREATHING_PATTERNS[0]
  );

  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<BreathingPhaseType>(() =>
    getFirstPhase(pattern)
  );
  const [currentCycle, setCurrentCycle] = useState(1);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [totalElapsed, setTotalElapsed] = useState(0);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTickRef = useRef<number>(0);
  const phaseElapsedRef = useRef(0);
  const totalElapsedRef = useRef(0);
  const currentPhaseRef = useRef<BreathingPhaseType>(currentPhase);
  const currentCycleRef = useRef(1);
  const isRunningRef = useRef(false);
  const isPausedRef = useRef(false);
  const isCompleteRef = useRef(false);
  const patternRef = useRef(pattern);

  const onPhaseChangeRef = useRef(onPhaseChange);
  const onCycleCompleteRef = useRef(onCycleComplete);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onPhaseChangeRef.current = onPhaseChange;
  }, [onPhaseChange]);

  useEffect(() => {
    onCycleCompleteRef.current = onCycleComplete;
  }, [onCycleComplete]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);

  const phaseDuration = useMemo(
    () => getPhaseDuration(pattern, currentPhase),
    [pattern, currentPhase]
  );

  const totalDuration = useMemo(
    () => calculateTotalDuration(pattern),
    [pattern]
  );

  const cycleDuration = useMemo(
    () => calculateTotalCycleDuration(pattern),
    [pattern]
  );

  const phaseProgress = useMemo(() => {
    if (phaseDuration === 0) return 1;
    return Math.min(phaseElapsed / phaseDuration, 1);
  }, [phaseElapsed, phaseDuration]);

  const overallProgress = useMemo(() => {
    if (totalDuration === 0) return 0;
    return Math.min(totalElapsed / totalDuration, 1);
  }, [totalElapsed, totalDuration]);

  const phaseTimeRemaining = useMemo(() => {
    return Math.max(phaseDuration - phaseElapsed, 0);
  }, [phaseDuration, phaseElapsed]);

  const phaseLabel = useMemo(
    () => PHASE_LABELS[currentPhase],
    [currentPhase]
  );

  const clearTimer = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const advancePhase = useCallback(() => {
    const pat = patternRef.current;
    const phase = currentPhaseRef.current;
    const cycle = currentCycleRef.current;

    if (isLastPhaseInCycle(phase, pat)) {
      onCycleCompleteRef.current?.(cycle);

      if (cycle >= pat.cycles) {
        isCompleteRef.current = true;
        isRunningRef.current = false;
        setIsComplete(true);
        setIsRunning(false);
        clearTimer();
        onCompleteRef.current?.();
        return;
      }

      const nextCycle = cycle + 1;
      currentCycleRef.current = nextCycle;
      setCurrentCycle(nextCycle);

      const firstPhase = getFirstPhase(pat);
      currentPhaseRef.current = firstPhase;
      setCurrentPhase(firstPhase);
      phaseElapsedRef.current = 0;
      setPhaseElapsed(0);
      onPhaseChangeRef.current?.(firstPhase, nextCycle);
    } else {
      const nextPhase = getNextPhase(phase, pat);
      if (nextPhase) {
        currentPhaseRef.current = nextPhase;
        setCurrentPhase(nextPhase);
        phaseElapsedRef.current = 0;
        setPhaseElapsed(0);
        onPhaseChangeRef.current?.(nextPhase, cycle);
      }
    }
  }, [clearTimer]);

  const tick = useCallback(() => {
    if (!isRunningRef.current || isPausedRef.current || isCompleteRef.current) {
      return;
    }

    const now = Date.now();
    const delta = (now - lastTickRef.current) / 1000;
    lastTickRef.current = now;

    phaseElapsedRef.current += delta;
    totalElapsedRef.current += delta;

    setPhaseElapsed(phaseElapsedRef.current);
    setTotalElapsed(totalElapsedRef.current);

    const pat = patternRef.current;
    const phase = currentPhaseRef.current;
    const duration = getPhaseDuration(pat, phase);

    if (phaseElapsedRef.current >= duration) {
      const overflow = phaseElapsedRef.current - duration;
      phaseElapsedRef.current = 0;
      advancePhase();

      if (!isCompleteRef.current && overflow > 0) {
        phaseElapsedRef.current = overflow;
        setPhaseElapsed(overflow);
      }
    }
  }, [advancePhase]);

  const start = useCallback(() => {
    if (isRunningRef.current && !isPausedRef.current) return;

    const firstPhase = getFirstPhase(patternRef.current);

    currentPhaseRef.current = firstPhase;
    currentCycleRef.current = 1;
    phaseElapsedRef.current = 0;
    totalElapsedRef.current = 0;
    isRunningRef.current = true;
    isPausedRef.current = false;
    isCompleteRef.current = false;

    setCurrentPhase(firstPhase);
    setCurrentCycle(1);
    setPhaseElapsed(0);
    setTotalElapsed(0);
    setIsRunning(true);
    setIsPaused(false);
    setIsComplete(false);

    lastTickRef.current = Date.now();
    clearTimer();
    intervalRef.current = setInterval(tick, tickInterval);

    onPhaseChangeRef.current?.(firstPhase, 1);
  }, [tick, tickInterval, clearTimer]);

  const pause = useCallback(() => {
    if (!isRunningRef.current || isPausedRef.current) return;
    isPausedRef.current = true;
    setIsPaused(true);
    clearTimer();
  }, [clearTimer]);

  const resume = useCallback(() => {
    if (!isRunningRef.current || !isPausedRef.current) return;
    isPausedRef.current = false;
    setIsPaused(false);
    lastTickRef.current = Date.now();
    clearTimer();
    intervalRef.current = setInterval(tick, tickInterval);
  }, [tick, tickInterval, clearTimer]);

  const stop = useCallback(() => {
    isRunningRef.current = false;
    isPausedRef.current = false;
    setIsRunning(false);
    setIsPaused(false);
    clearTimer();
  }, [clearTimer]);

  const reset = useCallback(() => {
    const firstPhase = getFirstPhase(patternRef.current);

    isRunningRef.current = false;
    isPausedRef.current = false;
    isCompleteRef.current = false;
    currentPhaseRef.current = firstPhase;
    currentCycleRef.current = 1;
    phaseElapsedRef.current = 0;
    totalElapsedRef.current = 0;

    setIsRunning(false);
    setIsPaused(false);
    setIsComplete(false);
    setCurrentPhase(firstPhase);
    setCurrentCycle(1);
    setPhaseElapsed(0);
    setTotalElapsed(0);
    clearTimer();
  }, [clearTimer]);

  const setPattern = useCallback(
    (newPatternId: string) => {
      const newPattern = getPatternById(newPatternId);
      if (newPattern) {
        stop();
        setPatternState(newPattern);
        patternRef.current = newPattern;

        const firstPhase = getFirstPhase(newPattern);
        currentPhaseRef.current = firstPhase;
        currentCycleRef.current = 1;
        phaseElapsedRef.current = 0;
        totalElapsedRef.current = 0;
        isCompleteRef.current = false;

        setCurrentPhase(firstPhase);
        setCurrentCycle(1);
        setPhaseElapsed(0);
        setTotalElapsed(0);
        setIsComplete(false);
      }
    },
    [stop]
  );

  useEffect(() => {
    if (customPattern) {
      stop();
      setPatternState(customPattern);
      patternRef.current = customPattern;

      const firstPhase = getFirstPhase(customPattern);
      currentPhaseRef.current = firstPhase;
      setCurrentPhase(firstPhase);
    }
  }, [customPattern, stop]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    currentPhase,
    phaseProgress,
    phaseTimeRemaining,
    phaseDuration,
    currentCycle,
    totalCycles: pattern.cycles,
    overallProgress,
    isRunning,
    isPaused,
    isComplete,
    phaseLabel,
    elapsedTime: totalElapsed,
    totalDuration,
    start,
    pause,
    resume,
    stop,
    reset,
    setPattern,
  };
}