import { useCallback } from 'react';
import SoundService from '../services/SoundService';

type SoundName =
  | 'sessionComplete'
  | 'breakComplete'
  | 'notification'
  | 'achievementUnlocked'
  | 'error'
  | 'tick'
  | 'buttonPress'
  | 'heavyImpact';

const soundMethodMap: Record<SoundName, () => Promise<void>> = {
  sessionComplete: () => SoundService.playSessionComplete(),
  breakComplete: () => SoundService.playBreakComplete(),
  notification: () => SoundService.playNotification(),
  achievementUnlocked: () => SoundService.playAchievementUnlocked(),
  error: () => SoundService.playError(),
  tick: () => SoundService.playTick(),
  buttonPress: () => SoundService.playButtonPress(),
  heavyImpact: () => SoundService.playHeavyImpact(),
};

export function useSoundService() {
  const playSound = useCallback(async (name: SoundName) => {
    const method = soundMethodMap[name];
    if (method) {
      await method();
    }
  }, []);

  return { playSound, soundService: SoundService };
}
