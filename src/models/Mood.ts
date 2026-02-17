export interface Mood {
  id?: number;
  timestamp: number;
  energy: number;
  emoji: string;
  note?: string;
  created_at?: number;
}

export interface MoodInput {
  energy: number;
  emoji: string;
  note?: string;
}

export interface MoodStats {
  averageEnergy: number;
  totalRecords: number;
  peakEnergy: number;
  lowestEnergy: number;
  mostCommonEmoji: string;
}

export interface DailyMoodSummary {
  date: string;
  averageEnergy: number;
  moodCount: number;
  dominantEmoji: string;
}

export interface HourlyEnergyData {
  hour: number;
  averageEnergy: number;
  sampleCount: number;
}

export type MoodEmoji = '😫' | '😔' | '😐' | '🙂' | '😄';

export const MOOD_EMOJIS: Record<number, MoodEmoji> = {
  0: '😫',
  1: '😔',
  2: '😐',
  3: '🙂',
  4: '😄',
};

export const ENERGY_THRESHOLDS = {
  VERY_LOW: 20,
  LOW: 40,
  MEDIUM: 60,
  HIGH: 80,
  VERY_HIGH: 100,
} as const;

export function getEmojiForEnergy(energy: number): MoodEmoji {
  if (energy <= ENERGY_THRESHOLDS.VERY_LOW) return '😫';
  if (energy <= ENERGY_THRESHOLDS.LOW) return '😔';
  if (energy <= ENERGY_THRESHOLDS.MEDIUM) return '😐';
  if (energy <= ENERGY_THRESHOLDS.HIGH) return '🙂';
  return '😄';
}

export function getEnergyCategory(energy: number): string {
  if (energy <= ENERGY_THRESHOLDS.VERY_LOW) return 'Очень низкая';
  if (energy <= ENERGY_THRESHOLDS.LOW) return 'Низкая';
  if (energy <= ENERGY_THRESHOLDS.MEDIUM) return 'Средняя';
  if (energy <= ENERGY_THRESHOLDS.HIGH) return 'Высокая';
  return 'Очень высокая';
}

export function validateMood(mood: MoodInput): boolean {
  if (mood.energy < 0 || mood.energy > 100) return false;
  if (!mood.emoji || mood.emoji.trim().length === 0) return false;
  if (mood.note && mood.note.length > 500) return false;
  return true;
}