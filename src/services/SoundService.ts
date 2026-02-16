import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SoundServiceConfig {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

class SoundService {
  private soundObjects: Map<string, Audio.Sound> = new Map();
  private config: SoundServiceConfig = {
    soundEnabled: true,
    vibrationEnabled: true,
  };

  async initialize(): Promise<void> {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        interruptionHandlingIOS: Audio.InterruptionHandlingIOS.DuckOthers,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        staysActiveInBackground: true,
      });

      await this.loadConfig();
    } catch (error) {
      console.error('Failed to initialize audio:', error);
    }
  }

  private async loadConfig(): Promise<void> {
    try {
      const soundEnabled = await AsyncStorage.getItem('soundEnabled');
      const vibrationEnabled = await AsyncStorage.getItem('vibrationEnabled');

      this.config = {
        soundEnabled: soundEnabled !== 'false',
        vibrationEnabled: vibrationEnabled !== 'false',
      };
    } catch (error) {
      console.error('Failed to load sound config:', error);
    }
  }

  async playSessionComplete(): Promise<void> {
    try {
      if (this.config.soundEnabled) {
        await this.playSound('session-complete');
      }
      if (this.config.vibrationEnabled) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
    } catch (error) {
      console.error('Failed to play session complete sound:', error);
    }
  }

  async playBreakComplete(): Promise<void> {
    try {
      if (this.config.soundEnabled) {
        await this.playSound('break-complete');
      }
      if (this.config.vibrationEnabled) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
    } catch (error) {
      console.error('Failed to play break complete sound:', error);
    }
  }

  async playNotification(): Promise<void> {
    try {
      if (this.config.soundEnabled) {
        await this.playSound('notification');
      }
      if (this.config.vibrationEnabled) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
      }
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  async playAchievementUnlocked(): Promise<void> {
    try {
      if (this.config.soundEnabled) {
        await this.playSound('achievement');
      }
      if (this.config.vibrationEnabled) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
        await new Promise(resolve => setTimeout(resolve, 100));
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
    } catch (error) {
      console.error('Failed to play achievement sound:', error);
    }
  }

  async playError(): Promise<void> {
    try {
      if (this.config.soundEnabled) {
        await this.playSound('error');
      }
      if (this.config.vibrationEnabled) {
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Error
        );
      }
    } catch (error) {
      console.error('Failed to play error sound:', error);
    }
  }

  async playTick(): Promise<void> {
    try {
      if (this.config.vibrationEnabled) {
        await Haptics.selectionAsync();
      }
    } catch (error) {
      console.error('Failed to play tick:', error);
    }
  }

  async playButtonPress(): Promise<void> {
    try {
      if (this.config.vibrationEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to play button press:', error);
    }
  }

  async playHeavyImpact(): Promise<void> {
    try {
      if (this.config.vibrationEnabled) {
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch (error) {
      console.error('Failed to play heavy impact:', error);
    }
  }

  private async playSound(soundName: string): Promise<void> {
    try {
      let sound = this.soundObjects.get(soundName);

      if (!sound) {
        const soundMap: Record<string, any> = {
          'session-complete': require('../../assets/sounds/session-complete.mp3'),
          'break-complete': require('../../assets/sounds/break-complete.mp3'),
          notification: require('../../assets/sounds/notification.mp3'),
          achievement: require('../../assets/sounds/achievement.mp3'),
          error: require('../../assets/sounds/error.mp3'),
        };

        const soundSource = soundMap[soundName];
        if (!soundSource) {
          console.warn(`Sound file not found: ${soundName}`);
          return;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(soundSource);
        sound = newSound;
        this.soundObjects.set(soundName, sound);
      }

      await sound.replayAsync();
    } catch (error) {
      console.error(`Failed to play sound ${soundName}:`, error);
    }
  }

  async setSoundEnabled(enabled: boolean): Promise<void> {
    try {
      this.config.soundEnabled = enabled;
      await AsyncStorage.setItem('soundEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to set sound enabled:', error);
    }
  }

  async setVibrationEnabled(enabled: boolean): Promise<void> {
    try {
      this.config.vibrationEnabled = enabled;
      await AsyncStorage.setItem('vibrationEnabled', String(enabled));
    } catch (error) {
      console.error('Failed to set vibration enabled:', error);
    }
  }

  getSoundEnabled(): boolean {
    return this.config.soundEnabled;
  }

  getVibrationEnabled(): boolean {
    return this.config.vibrationEnabled;
  }

  async stopAllSounds(): Promise<void> {
    try {
      for (const sound of this.soundObjects.values()) {
        await sound.stopAsync();
      }
    } catch (error) {
      console.error('Failed to stop all sounds:', error);
    }
  }

  async unloadAllSounds(): Promise<void> {
    try {
      for (const sound of this.soundObjects.values()) {
        await sound.unloadAsync();
      }
      this.soundObjects.clear();
    } catch (error) {
      console.error('Failed to unload all sounds:', error);
    }
  }
}

export default new SoundService();