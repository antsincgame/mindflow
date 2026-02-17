export interface BreathingPattern {
  id: string;
  name: string;
  inhale: number;
  hold: number;
  exhale: number;
  holdAfterExhale?: number;
}

export type BreathingPhase = 'inhale' | 'hold' | 'exhale' | 'holdAfterExhale';
