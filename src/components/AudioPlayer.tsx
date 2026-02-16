import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Sound from 'react-native-sound';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../hooks/useTheme';

Sound.setCategory('Playback', true);

export interface AudioTrack {
  id: string;
  title: string;
  filePath: string;
  isLocal: boolean;
  type: 'voice' | 'music' | 'nature';
  loop?: boolean;
}

interface AudioPlayerProps {
  voiceTrack?: AudioTrack;
  backgroundTrack?: AudioTrack;
  isPlaying: boolean;
  onPlayPause?: () => void;
  onTrackEnd?: (trackId: string) => void;
  onError?: (error: string) => void;
  showControls?: boolean;
  initialVoiceVolume?: number;
  initialMusicVolume?: number;
  compact?: boolean;
}

interface TrackState {
  sound: Sound | null;
  isLoaded: boolean;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  volume: number;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({
  voiceTrack,
  backgroundTrack,
  isPlaying,
  onPlayPause,
  onTrackEnd,
  onError,
  showControls = true,
  initialVoiceVolume = 1.0,
  initialMusicVolume = 0.3,
  compact = false,
}) => {
  const { colors } = useTheme();

  const [voiceState, setVoiceState] = useState<TrackState>({
    sound: null,
    isLoaded: false,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: initialVoiceVolume,
  });

  const [musicState, setMusicState] = useState<TrackState>({
    sound: null,
    isLoaded: false,
    isPlaying: false,
    duration: 0,
    currentTime: 0,
    volume: initialMusicVolume,
  });

  const [isMuted, setIsMuted] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const voiceSoundRef = useRef<Sound | null>(null);
  const musicSoundRef = useRef<Sound | null>(null);

  const loadTrack = useCallback(
    (track: AudioTrack, isVoice: boolean): Promise<Sound> => {
      return new Promise((resolve, reject) => {
        const callback = (error: Error | null, sound: Sound) => {
          if (error) {
            onError?.(`Failed to load ${track.title}: ${error.message}`);
            reject(error);
            return;
          }

          const duration = sound.getDuration();
          const volume = isVoice ? initialVoiceVolume : initialMusicVolume;
          sound.setVolume(volume);

          if (track.loop) {
            sound.setNumberOfLoops(-1);
          }

          if (isVoice) {
            voiceSoundRef.current = sound;
            setVoiceState((prev) => ({
              ...prev,
              sound,
              isLoaded: true,
              duration,
              volume,
            }));
          } else {
            musicSoundRef.current = sound;
            setMusicState((prev) => ({
              ...prev,
              sound,
              isLoaded: true,
              duration,
              volume,
            }));
          }

          resolve(sound);
        };

        if (track.isLocal) {
          const sound = new Sound(track.filePath, Sound.MAIN_BUNDLE, (error) =>
            callback(error, sound)
          );
        } else {
          const sound = new Sound(track.filePath, '', (error) =>
            callback(error, sound)
          );
        }
      });
    },
    [initialVoiceVolume, initialMusicVolume, onError]
  );

  useEffect(() => {
    if (voiceTrack) {
      loadTrack(voiceTrack, true).catch(() => {});
    }

    return () => {
      if (voiceSoundRef.current) {
        voiceSoundRef.current.stop();
        voiceSoundRef.current.release();
        voiceSoundRef.current = null;
      }
    };
  }, [voiceTrack?.id]);

  useEffect(() => {
    if (backgroundTrack) {
      loadTrack(backgroundTrack, false).catch(() => {});
    }

    return () => {
      if (musicSoundRef.current) {
        musicSoundRef.current.stop();
        musicSoundRef.current.release();
        musicSoundRef.current = null;
      }
    };
  }, [backgroundTrack?.id]);

  const startProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    progressInterval.current = setInterval(() => {
      if (voiceSoundRef.current) {
        voiceSoundRef.current.getCurrentTime((seconds) => {
          setVoiceState((prev) => ({ ...prev, currentTime: seconds }));
        });
      }
      if (musicSoundRef.current) {
        musicSoundRef.current.getCurrentTime((seconds) => {
          setMusicState((prev) => ({ ...prev, currentTime: seconds }));
        });
      }
    }, 500);
  }, []);

  const stopProgressTracking = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
  }, []);

  const playAll = useCallback(() => {
    if (voiceSoundRef.current && voiceState.isLoaded) {
      voiceSoundRef.current.play((success) => {
        if (success && voiceTrack) {
          onTrackEnd?.(voiceTrack.id);
        }
        setVoiceState((prev) => ({ ...prev, isPlaying: false }));
      });
      setVoiceState((prev) => ({ ...prev, isPlaying: true }));
    }

    if (musicSoundRef.current && musicState.isLoaded) {
      musicSoundRef.current.play((success) => {
        if (success && backgroundTrack) {
          onTrackEnd?.(backgroundTrack.id);
        }
        setMusicState((prev) => ({ ...prev, isPlaying: false }));
      });
      setMusicState((prev) => ({ ...prev, isPlaying: true }));
    }

    startProgressTracking();
  }, [
    voiceState.isLoaded,
    musicState.isLoaded,
    voiceTrack,
    backgroundTrack,
    onTrackEnd,
    startProgressTracking,
  ]);

  const pauseAll = useCallback(() => {
    if (voiceSoundRef.current && voiceState.isPlaying) {
      voiceSoundRef.current.pause();
      setVoiceState((prev) => ({ ...prev, isPlaying: false }));
    }

    if (musicSoundRef.current && musicState.isPlaying) {
      musicSoundRef.current.pause();
      setMusicState((prev) => ({ ...prev, isPlaying: false }));
    }

    stopProgressTracking();
  }, [voiceState.isPlaying, musicState.isPlaying, stopProgressTracking]);

  useEffect(() => {
    if (isPlaying) {
      playAll();
    } else {
      pauseAll();
    }
  }, [isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isPlaying, pulseAnim]);

  useEffect(() => {
    return () => {
      stopProgressTracking();
      if (voiceSoundRef.current) {
        voiceSoundRef.current.stop();
        voiceSoundRef.current.release();
        voiceSoundRef.current = null;
      }
      if (musicSoundRef.current) {
        musicSoundRef.current.stop();
        musicSoundRef.current.release();
        musicSoundRef.current = null;
      }
    };
  }, []);

  const handleVoiceVolumeChange = useCallback(
    (direction: 'up' | 'down') => {
      setVoiceState((prev) => {
        const delta = direction === 'up' ? 0.1 : -0.1;
        const newVolume = Math.max(0, Math.min(1, prev.volume + delta));
        if (voiceSoundRef.current) {
          voiceSoundRef.current.setVolume(isMuted ? 0 : newVolume);
        }
        return { ...prev, volume: newVolume };
      });
    },
    [isMuted]
  );

  const handleMusicVolumeChange = useCallback(
    (direction: 'up' | 'down') => {
      setMusicState((prev) => {
        const delta = direction === 'up' ? 0.1 : -0.1;
        const newVolume = Math.max(0, Math.min(1, prev.volume + delta));
        if (musicSoundRef.current) {
          musicSoundRef.current.setVolume(isMuted ? 0 : newVolume);
        }
        return { ...prev, volume: newVolume };
      });
    },
    [isMuted]
  );

  const toggleMute = useCallback(() => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);

    if (voiceSoundRef.current) {
      voiceSoundRef.current.setVolume(newMuted ? 0 : voiceState.volume);
    }
    if (musicSoundRef.current) {
      musicSoundRef.current.setVolume(newMuted ? 0 : musicState.volume);
    }
  }, [isMuted, voiceState.volume, musicState.volume]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getVolumeIcon = (volume: number): string => {
    if (isMuted || volume === 0) return 'volume-mute';
    if (volume < 0.3) return 'volume-low';
    if (volume < 0.7) return 'volume-medium';
    return 'volume-high';
  };

  const voiceProgress =
    voiceState.duration > 0
      ? voiceState.currentTime / voiceState.duration
      : 0;

  if (compact) {
    return (
      <View
        style={[
          styles.compactContainer,
          { backgroundColor: colors.card || '#F5F5F5' },
        ]}
      >
        <TouchableOpacity
          onPress={onPlayPause}
          style={[
            styles.compactPlayButton,
            { backgroundColor: colors.primary || '#6C63FF' },
          ]}
          accessibilityLabel={isPlaying ? 'Пауза' : 'Воспроизвести'}
          accessibilityRole="button"
        >
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <Icon
              name={isPlaying ? 'pause' : 'play'}
              size={18}
              color="#FFFFFF"
            />
          </Animated.View>
        </TouchableOpacity>

        {voiceTrack && (
          <View style={styles.compactInfo}>
            <Text
              style={[styles.compactTitle, { color: colors.text || '#333' }]}
              numberOfLines={1}
            >
              {voiceTrack.title}
            </Text>
            <View
              style={[
                styles.compactProgressBar,
                { backgroundColor: colors.border || '#E0E0E0' },
              ]}
            >
              <View
                style={[
                  styles.compactProgressFill,
                  {
                    width: `${voiceProgress * 100}%`,
                    backgroundColor: colors.primary || '#6C63FF',
                  },
                ]}
              />
            </View>
          </View>
        )}

        <TouchableOpacity
          onPress={toggleMute}
          style={styles.compactMuteButton}
          accessibilityLabel={isMuted ? 'Включить звук' : 'Выключить звук'}
          accessibilityRole="button"
        >
          <Icon
            name={getVolumeIcon(voiceState.volume)}
            size={20}
            color={colors.textSecondary || '#999'}
          />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card || '#F5F5F5' },
      ]}
    >
      {showControls && (
        <View style={styles.mainControls}>
          <TouchableOpacity
            onPress={onPlayPause}
            style={[
              styles.playButton,
              { backgroundColor: colors.primary || '#6C63FF' },
            ]}
            accessibilityLabel={isPlaying ? 'Пауза' : 'Воспроизвести'}
            accessibilityRole="button"
          >
            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <Icon
                name={isPlaying ? 'pause' : 'play'}
                size={28}
                color="#FFFFFF"
              />
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleMute}
            style={styles.muteButton}
            accessibilityLabel={isMuted ? 'Включить звук' : 'Выключить звук'}
            accessibilityRole="button"
          >
            <Icon
              name={getVolumeIcon(voiceState.volume)}
              size={24}
              color={colors.textSecondary || '#999'}
            />
          </TouchableOpacity>
        </View>
      )}

      {voiceTrack && (
        <View style={styles.trackSection}>
          <View style={styles.trackHeader}>
            <Icon
              name="mic"
              size={16}
              color={colors.primary || '#6C63FF'}
            />
            <Text
              style={[
                styles.trackTitle,
                { color: colors.text || '#333' },
              ]}
              numberOfLines={1}
            >
              {voiceTrack.title}
            </Text>
            <Text
              style={[
                styles.timeText,
                { color: colors.textSecondary || '#999' },
              ]}
            >
              {formatTime(voiceState.currentTime)} /{' '}
              {formatTime(voiceState.duration)}
            </Text>
          </View>

          <View
            style={[