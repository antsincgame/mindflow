export interface Achievement {
  id: string | number;
  title: string;
  description: string;
  category: string;
  icon: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  isUnlocked: boolean;
  progress?: { current: number; total: number };
  unlockedAt: string | null;
  unlocked?: boolean;
}
