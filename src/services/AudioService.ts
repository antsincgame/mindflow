import { Audio, AVPlaybackStatus } from 'expo-av';
import { Sound } from 'expo-av/build/Audio';

export interface AudioTrack {
  id: string;
  name: string;
  uri: string;
  duration: number;
  category: 'breathing' | 'meditation' | 'nature' | 'ambient';
}

export interface PlaybackState {
  isPlaying: boolean;
  isLoaded: boolean;
  position: number;
  duration: number;
  volume: number;
}

class AudioService {
  private sound: Sound | null = null;
  private isInitialized: boolean = false;
  private currentTrack: AudioTrack | null = null;
  private playbackListeners: Array<(state: PlaybackState) => void> = [];

  private audioTracks: AudioTrack[] = [
    {
      id: 'breathing_calm',
      name: 'Спокойное дыхание',
      uri: 'https://assets.mixkit.co/music/preview/mixkit-meditation-bell-140.mp3',
      duration: 180,
      category: 'breathing',
    },
    {
      id: 'breathing_deep',
      name: 'Глубокое дыхание',
      uri: 'https://assets.mixkit.co/music/preview/mixkit-meditation-bell-140.mp3',
      duration: 240,
      category: 'breathing',
    },
    {
      id: 'meditation_forest',
      name: 'Лесная медитация',
      uri: 'https://assets.mixkit.co/music/preview/mixkit-forest-ambience-1234.mp3',
      duration: 300,
      category: 'meditation',
    },
    {
      id: 'meditation_ocean',
      name: 'Океанская медитация',
      uri: 'https://assets.mixkit.co/music/preview/mixkit-ocean-waves-loop-1196.mp3',
      duration: 360,
      category: 'meditation',
    },
    {
      id: 'nature_rain',
      name: 'Звуки дождя',
      uri: 'https://assets.mixkit.co/music/preview/mixkit-rain-and-thunder-1289.mp3',
      duration: 600,
      category: 'nature',
    },
    {
      id: 'nature_birds',
      name: 'Пение птиц',
      uri: 'https://assets.mixkit.co/music/preview/mixkit-birds-chirping-1212.mp3',
      duration: 480,
      category: 'nature',
    },
    {
      id: 'ambient_calm',
      name: 'Спокойный эмбиент',
      uri: 'https://assets.mixkit.co/music/preview/mixkit-ambient-piano-and-strings-10711.mp3',
      duration: 420,
      category: 'ambient',
    },
    {
      id: 'ambient_peaceful',
      name: 'Умиротворяющая музыка',
      uri: 'https://assets.mixkit.co/music/preview/mixkit-peaceful-piano-melody-10710.mp3',
      duration: 390,
      category: 'ambient',
    },
  ];

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize audio:', error);
      throw error;
    }
  }

  async loadTrack(trackId: string): Promise<void> {
    const track = this.audioTracks.find((t) => t.id === trackId);
    if (!track) {
      throw new Error(`Track with id ${trackId} not found`);
    }

    await this.unloadSound();

    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: track.uri },
        { shouldPlay: false, volume: 1.0, isLooping: true },
        this.onPlaybackStatusUpdate.bind(this)
      );

      this.sound = sound;
      this.currentTrack = track;
    } catch (error) {
      console.error('Failed to load track:', error);
      throw error;
    }
  }

  async play(): Promise<void> {
    if (!this.sound) {
      throw new Error('No sound loaded');
    }

    try {
      await this.sound.playAsync();
    } catch (error) {
      console.error('Failed to play sound:', error);
      throw error;
    }
  }

  async pause(): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.pauseAsync();
    } catch (error) {
      console.error('Failed to pause sound:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.stopAsync();
      await this.sound.setPositionAsync(0);
    } catch (error) {
      console.error('Failed to stop sound:', error);
      throw error;
    }
  }

  async setVolume(volume: number): Promise<void> {
    if (!this.sound) {
      return;
    }

    const clampedVolume = Math.max(0, Math.min(1, volume));

    try {
      await this.sound.setVolumeAsync(clampedVolume);
    } catch (error) {
      console.error('Failed to set volume:', error);
      throw error;
    }
  }

  async fadeIn(duration: number = 2000): Promise<void> {
    if (!this.sound) {
      return;
    }

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeIncrement = 1 / steps;

    for (let i = 0; i <= steps; i++) {
      await this.setVolume(i * volumeIncrement);
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }
  }

  async fadeOut(duration: number = 2000): Promise<void> {
    if (!this.sound) {
      return;
    }

    const steps = 20;
    const stepDuration = duration / steps;
    const volumeDecrement = 1 / steps;

    for (let i = steps; i >= 0; i--) {
      await this.setVolume(i * volumeDecrement);
      await new Promise((resolve) => setTimeout(resolve, stepDuration));
    }

    await this.pause();
    await this.setVolume(1);
  }

  async seek(positionMillis: number): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.setPositionAsync(positionMillis);
    } catch (error) {
      console.error('Failed to seek:', error);
      throw error;
    }
  }

  async getStatus(): Promise<PlaybackState | null> {
    if (!this.sound) {
      return null;
    }

    try {
      const status = await this.sound.getStatusAsync();
      if (!status.isLoaded) {
        return null;
      }

      return {
        isPlaying: status.isPlaying,
        isLoaded: status.isLoaded,
        position: status.positionMillis,
        duration: status.durationMillis || 0,
        volume: status.volume,
      };
    } catch (error) {
      console.error('Failed to get status:', error);
      return null;
    }
  }

  getCurrentTrack(): AudioTrack | null {
    return this.currentTrack;
  }

  getAvailableTracks(category?: AudioTrack['category']): AudioTrack[] {
    if (category) {
      return this.audioTracks.filter((track) => track.category === category);
    }
    return this.audioTracks;
  }

  getTrackById(trackId: string): AudioTrack | undefined {
    return this.audioTracks.find((track) => track.id === trackId);
  }

  addPlaybackListener(listener: (state: PlaybackState) => void): () => void {
    this.playbackListeners.push(listener);

    return () => {
      this.playbackListeners = this.playbackListeners.filter((l) => l !== listener);
    };
  }

  private onPlaybackStatusUpdate(status: AVPlaybackStatus): void {
    if (!status.isLoaded) {
      return;
    }

    const playbackState: PlaybackState = {
      isPlaying: status.isPlaying,
      isLoaded: status.isLoaded,
      position: status.positionMillis,
      duration: status.durationMillis || 0,
      volume: status.volume,
    };

    this.playbackListeners.forEach((listener) => {
      try {
        listener(playbackState);
      } catch (error) {
        console.error('Error in playback listener:', error);
      }
    });
  }

  async unloadSound(): Promise<void> {
    if (this.sound) {
      try {
        await this.sound.unloadAsync();
      } catch (error) {
        console.error('Failed to unload sound:', error);
      }
      this.sound = null;
      this.currentTrack = null;
    }
  }

  async cleanup(): Promise<void> {
    await this.unloadSound();
    this.playbackListeners = [];
    this.isInitialized = false;
  }

  async playNotificationSound(type: 'success' | 'warning' | 'info' = 'info'): Promise<void> {
    try {
      const soundMap = {
        success: require('../../assets/sounds/success.mp3'),
        warning: require('../../assets/sounds/warning.mp3'),
        info: require('../../assets/sounds/info.mp3'),
      };

      const { sound } = await Audio.Sound.createAsync(soundMap[type], {
        shouldPlay: true,
        volume: 0.5,
      });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play notification sound:', error);
    }
  }

  async playBreathingCue(phase: 'inhale' | 'hold' | 'exhale'): Promise<void> {
    try {
      const cueMap = {
        inhale: require('../../assets/sounds/inhale.mp3'),
        hold: require('../../assets/sounds/hold.mp3'),
        exhale: require('../../assets/sounds/exhale.mp3'),
      };

      const { sound } = await Audio.Sound.createAsync(cueMap[phase], {
        shouldPlay: true,
        volume: 0.7,
      });

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
        }
      });
    } catch (error) {
      console.error('Failed to play breathing cue:', error);
    }
  }

  async setLooping(isLooping: boolean): Promise<void> {
    if (!this.sound) {
      return;
    }

    try {
      await this.sound.setIsLoopingAsync(isLooping);
    } catch (error) {
      console.error('Failed to set looping:', error);
      throw error;
    }
  }

  async setPlaybackRate(rate: number): Promise<void> {
    if (!this.sound) {
      return;
    }

    const clampedRate = Math.max(0.5, Math.min(2, rate));

    try {
      await this.sound.setRateAsync(clampedRate, true);
    } catch (error) {
      console.error('Failed to set playback rate:', error);
      throw error;
    }
  }

  isPlaying(): boolean {
    return this.sound !== null;
  }

  async preloadTracks(trackIds: string[]): Promise<void> {
    const preloadPromises = trackIds.map(async (trackId) => {
      const track = this.audioTracks.find((t) => t.id === trackId);
      if (!track) {
        return;
      }

      try {
        const { sound } = await Audio.Sound.createAsync({ uri: track.uri });
        await sound.unloadAsync();
      } catch (error) {
        console.error(`Failed to preload track ${trackId}:`, error);
      }
    });

    await Promise.allSettled(preloadPromises);
  }
}

export default new AudioService();