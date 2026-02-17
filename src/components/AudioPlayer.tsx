import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Audio } from 'expo-av';
import { Asset } from 'expo-asset';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';

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
  sound: Audio.Sound | null;
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

  const loadTrack = useCallback(
    async (track: AudioTrack, isVoice: boolean): Promise<void> => {
      try {
        let source;
        if (track.isLocal) {
          const asset = Asset.fromModule(require('../../assets/icon.png'));
          await asset.downloadAsync();
          source = { uri: asset.localUri || asset.uri };
        } else {
          source = { uri: track.filePath };
        }

        const { sound } = await Audio.Sound.createAsync(
          source,
          {
            shouldPlay: false,
            volume: isVoice ? initialVoiceVolume : initialMusicVolume,
            isLooping: track.loop || false,
          }
        );

        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          const duration = status.durationMillis ? status.durationMillis / 1000 : 0;
          
          if (isVoice) {
            setVoiceState((prev) => ({
              ...prev,
              sound,
              isLoaded: true,
              duration,
            }));
          } else {
            setMusicState((prev) => ({
              ...prev,
              sound,
              isLoaded: true,
              duration,
            }));
          }
        }
      } catch (error) {
        onError?.(`Failed to load ${track.title}: ${error}`);
      }
    },
    [initialVoiceVolume, initialMusicVolume, onError]
  );

  useEffect(() => {
    if (voiceTrack) {
      loadTrack(voiceTrack, true);
    }
    return () => {
      if (voiceState.sound) {
        voiceState.sound.unloadAsync();
      }
    };
  }, [voiceTrack?.id]);

  useEffect(() => {
    if (backgroundTrack) {
      loadTrack(backgroundTrack, false);
    }
    return () => {
      if (musicState.sound) {
        musicState.sound.unloadAsync();
      }
    };
  }, [backgroundTrack?.id]);

  const playAll = useCallback(async () => {
    if (voiceState.sound && voiceState.isLoaded) {
      await voiceState.sound.playAsync();
      setVoiceState((prev) => ({ ...prev, isPlaying: true }));
    }
    if (musicState.sound && musicState.isLoaded) {
      await musicState.sound.playAsync();
      setMusicState((prev) => ({ ...prev, isPlaying: true }));
    }
  }, [voiceState.sound, voiceState.isLoaded, musicState.sound, musicState.isLoaded]);

  const pauseAll = useCallback(async () => {
    if (voiceState.sound && voiceState.isPlaying) {
      await voiceState.sound.pauseAsync();
      setVoiceState((prev) => ({ ...prev, isPlaying: false }));
    }
    if (musicState.sound && musicState.isPlaying) {
      await musicState.sound.pauseAsync();
      setMusicState((prev) => ({ ...prev, isPlaying: false }));
    }
  }, [voiceState.sound, voiceState.isPlaying, musicState.sound, musicState.isPlaying]);

  useEffect(() => {
    if (isPlaying) {
      playAll();
    } else {
      pauseAll();
    }
  }, [isPlaying]);

  if (compact) {
    return (
      <View style={[styles.compactContainer, { backgroundColor: colors.cardBackground || '#F5F5F5' }]}>
        <TouchableOpacity
          onPress={onPlayPause}
          style={[styles.compactPlayButton, { backgroundColor: colors.primary || '#6C63FF' }]}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={18} color="#FFFFFF" />
        </TouchableOpacity>
        {voiceTrack && (
          <Text style={[styles.compactTitle, { color: colors.text || '#333' }]}>
            {voiceTrack.title}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground || '#F5F5F5' }]}>
      {showControls && (
        <TouchableOpacity onPress={onPlayPause} style={styles.playButton}>
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 12,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
  },
  compactPlayButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  compactTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AudioPlayer;
