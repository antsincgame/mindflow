export enum BreathingPhase {
  Inhale = 'inhale',
  Hold = 'hold',
  Exhale = 'exhale',
  HoldAfterExhale = 'holdAfterExhale',
}

export interface BreathingPhaseTiming {
  phase: BreathingPhase;
  durationSeconds: number;
  label: string;
}

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhaseTiming[];
  totalCycles: number;
  totalDurationSeconds: number;
}

export interface BreathingSessionState {
  currentPhaseIndex: number;
  currentCycle: number;
  elapsedPhaseTime: number;
  elapsedTotalTime: number;
  isActive: boolean;
  isPaused: boolean;
  isCompleted: boolean;
}

export type BreathingPatternPresetId =
  | 'four_seven_eight'
  | 'box_breathing'
  | 'extended_exhale'
  | 'calm_breathing'
  | 'energizing_breath'
  | 'relaxing_breath';

function calculateTotalDuration(phases: BreathingPhaseTiming[], cycles: number): number {
  const cycleDuration = phases.reduce((sum, phase) => sum + phase.durationSeconds, 0);
  return cycleDuration * cycles;
}

export const BREATHING_PATTERN_PRESETS: Record<BreathingPatternPresetId, BreathingPattern> = {
  four_seven_eight: {
    id: 'four_seven_eight',
    name: '4-7-8',
    description: 'Техника расслабления: вдох 4 секунды, задержка 7, выдох 8. Помогает быстро снять стресс и уснуть.',
    phases: [
      { phase: BreathingPhase.Inhale, durationSeconds: 4, label: 'Вдох' },
      { phase: BreathingPhase.Hold, durationSeconds: 7, label: 'Задержка' },
      { phase: BreathingPhase.Exhale, durationSeconds: 8, label: 'Выдох' },
    ],
    totalCycles: 4,
    totalDurationSeconds: calculateTotalDuration(
      [
        { phase: BreathingPhase.Inhale, durationSeconds: 4, label: 'Вдох' },
        { phase: BreathingPhase.Hold, durationSeconds: 7, label: 'Задержка' },
        { phase: BreathingPhase.Exhale, durationSeconds: 8, label: 'Выдох' },
      ],
      4,
    ),
  },
  box_breathing: {
    id: 'box_breathing',
    name: 'Коробочное дыхание',
    description: 'Равные фазы по 4 секунды. Используется спецназом для сохранения спокойствия в стрессовых ситуациях.',
    phases: [
      { phase: BreathingPhase.Inhale, durationSeconds: 4, label: 'Вдох' },
      { phase: BreathingPhase.Hold, durationSeconds: 4, label: 'Задержка' },
      { phase: BreathingPhase.Exhale, durationSeconds: 4, label: 'Выдох' },
      { phase: BreathingPhase.HoldAfterExhale, durationSeconds: 4, label: 'Задержка' },
    ],
    totalCycles: 6,
    totalDurationSeconds: calculateTotalDuration(
      [
        { phase: BreathingPhase.Inhale, durationSeconds: 4, label: 'Вдох' },
        { phase: BreathingPhase.Hold, durationSeconds: 4, label: 'Задержка' },
        { phase: BreathingPhase.Exhale, durationSeconds: 4, label: 'Выдох' },
        { phase: BreathingPhase.HoldAfterExhale, durationSeconds: 4, label: 'Задержка' },
      ],
      6,
    ),
  },
  extended_exhale: {
    id: 'extended_exhale',
    name: 'Удлинённый выдох',
    description: 'Выдох в два раза длиннее вдоха. Активирует парасимпатическую нервную систему и успокаивает.',
    phases: [
      { phase: BreathingPhase.Inhale, durationSeconds: 4, label: 'Вдох' },
      { phase: BreathingPhase.Exhale, durationSeconds: 8, label: 'Выдох' },
    ],
    totalCycles: 8,
    totalDurationSeconds: calculateTotalDuration(
      [
        { phase: BreathingPhase.Inhale, durationSeconds: 4, label: 'Вдох' },
        { phase: BreathingPhase.Exhale, durationSeconds: 8, label: 'Выдох' },
      ],
      8,
    ),
  },
  calm_breathing: {
    id: 'calm_breathing',
    name: 'Спокойное дыхание',
    description: 'Мягкое дыхание с короткими фазами. Подходит для начинающих и лёгкого расслабления.',
    phases: [
      { phase: BreathingPhase.Inhale, durationSeconds: 3, label: 'Вдох' },
      { phase: BreathingPhase.Hold, durationSeconds: 2, label: 'Задержка' },
      { phase: BreathingPhase.Exhale, durationSeconds: 5, label: 'Выдох' },
    ],
    totalCycles: 8,
    totalDurationSeconds: calculateTotalDuration(
      [
        { phase: BreathingPhase.Inhale, durationSeconds: 3, label: 'Вдох' },
        { phase: BreathingPhase.Hold, durationSeconds: 2, label: 'Задержка' },
        { phase: BreathingPhase.Exhale, durationSeconds: 5, label: 'Выдох' },
      ],
      8,
    ),
  },
  energizing_breath: {
    id: 'energizing_breath',
    name: 'Энергичное дыхание',
    description: 'Быстрые короткие вдохи и выдохи. Повышает энергию и бодрость, помогает при усталости.',
    phases: [
      { phase: BreathingPhase.Inhale, durationSeconds: 2, label: 'Вдох' },
      { phase: BreathingPhase.Exhale, durationSeconds: 2, label: 'Выдох' },
    ],
    totalCycles: 15,
    totalDurationSeconds: calculateTotalDuration(
      [
        { phase: BreathingPhase.Inhale, durationSeconds: 2, label: 'Вдох' },
        { phase: BreathingPhase.Exhale, durationSeconds: 2, label: 'Выдох' },
      ],
      15,
    ),
  },
  relaxing_breath: {
    id: 'relaxing_breath',
    name: 'Глубокое расслабление',
    description: 'Медленное глубокое дыхание с длинными задержками. Максимальное расслабление и снижение тревожности.',
    phases: [
      { phase: BreathingPhase.Inhale, durationSeconds: 5, label: 'Вдох' },
      { phase: BreathingPhase.Hold, durationSeconds: 5, label: 'Задержка' },
      { phase: BreathingPhase.Exhale, durationSeconds: 7, label: 'Выдох' },
      { phase: BreathingPhase.HoldAfterExhale, durationSeconds: 3, label: 'Задержка' },
    ],
    totalCycles: 5,
    totalDurationSeconds: calculateTotalDuration(
      [
        { phase: BreathingPhase.Inhale, durationSeconds: 5, label: 'Вдох' },
        { phase: BreathingPhase.Hold, durationSeconds: 5, label: 'Задержка' },
        { phase: BreathingPhase.Exhale, durationSeconds: 7, label: 'Выдох' },
        { phase: BreathingPhase.HoldAfterExhale, durationSeconds: 3, label: 'Задержка' },
      ],
      5,
    ),
  },
};

export function getBreathingPatternById(id: BreathingPatternPresetId): BreathingPattern {
  return BREATHING_PATTERN_PRESETS[id];
}

export function getCycleDuration(pattern: BreathingPattern): number {
  return pattern.phases.reduce((sum, phase) => sum + phase.durationSeconds, 0);
}

export function getPhaseProgress(
  elapsedPhaseTime: number,
  phaseDuration: number,
): number {
  if (phaseDuration <= 0) return 1;
  return Math.min(elapsedPhaseTime / phaseDuration, 1);
}

export function getTotalProgress(
  currentCycle: number,
  currentPhaseIndex: number,
  elapsedPhaseTime: number,
  pattern: BreathingPattern,
): number {
  const cycleDuration = getCycleDuration(pattern);
  const totalDuration = cycleDuration * pattern.totalCycles;

  if (totalDuration <= 0) return 1;

  const completedCyclesTime = currentCycle * cycleDuration;
  const completedPhasesTime = pattern.phases
    .slice(0, currentPhaseIndex)
    .reduce((sum, phase) => sum + phase.durationSeconds, 0);

  const totalElapsed = completedCyclesTime + completedPhasesTime + elapsedPhaseTime;

  return Math.min(totalElapsed / totalDuration, 1);
}

export function createInitialSessionState(): BreathingSessionState {
  return {
    currentPhaseIndex: 0,
    currentCycle: 0,
    elapsedPhaseTime: 0,
    elapsedTotalTime: 0,
    isActive: false,
    isPaused: false,
    isCompleted: false,
  };
}

export function getAllPresets(): BreathingPattern[] {
  return Object.values(BREATHING_PATTERN_PRESETS);
}