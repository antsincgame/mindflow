import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTimer } from '../hooks/useTimer';
import { useSettings } from '../hooks/useSettings';
import { useSoundService } from '../hooks/useSoundService';
import { Timer } from '../components/Timer';
import { SessionControls } from '../components/SessionControls';
import { BreakSuggestion } from '../components/BreakSuggestion';
import { theme } from '../theme';
import { breakSuggestions } from '../utils/breakSuggestions';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Break'>;

export const BreakScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId, breakDuration: initialDuration } = route.params;
  const { settings } = useSettings();
  const { playSound } = useSoundService();
  
  const breakDuration = initialDuration || (settings?.break_duration || 5) * 60;
  const [randomSuggestions, setRandomSuggestions] = useState<typeof breakSuggestions>([]);
  const [isCompleting, setIsCompleting] = useState(false);

  const {
    timeLeft,
    isRunning,
    isPaused,
    start,
    pause,
    resume,
    reset,
  } = useTimer(breakDuration, {
    onComplete: handleBreakComplete,
  });

  useFocusEffect(
    React.useCallback(() => {
      if (!isRunning && !isPaused) {
        start();
      }
      return () => {};
    }, [isRunning, isPaused, start])
  );

  useEffect(() => {
    const selectedSuggestions = breakSuggestions
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);
    setRandomSuggestions(selectedSuggestions);
  }, []);

  function handleBreakComplete() {
    setIsCompleting(true);
    playSound('break-complete');
    
    setTimeout(() => {
      navigation.replace('SessionComplete', { sessionId });
    }, 1000);
  }

  function handleSkipBreak() {
    navigation.replace('SessionComplete', { sessionId });
  }

  function handleStop() {
    navigation.goBack();
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const progress = 1 - (timeLeft / breakDuration);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Время отдыха</Text>
          <Text style={styles.headerSubtitle}>
            Восстановитесь перед следующей сессией
          </Text>
        </View>

        {/* Timer Section */}
        <View style={styles.timerSection}>
          <View style={styles.timerContainer}>
            <Timer
              minutes={minutes}
              seconds={seconds}
              progress={progress}
              isRunning={isRunning}
              size="large"
            />
          </View>

          {/* Status Text */}
          <Text style={styles.statusText}>
            {isRunning ? 'Отдыхайте...' : isPaused ? 'Пауза' : 'Готово к началу'}
          </Text>
        </View>

        {/* Suggestions */}
        <View style={styles.suggestionsSection}>
          <Text style={styles.suggestionsTitle}>Рекомендации для отдыха</Text>
          <View style={styles.suggestionsContainer}>
            {randomSuggestions.map((suggestion, index) => (
              <BreakSuggestion
                key={suggestion.id}
                suggestion={suggestion}
                index={index}
              />
            ))}
          </View>
        </View>

        {/* Tips */}
        <View style={styles.tipsSection}>
          <Text style={styles.tipsTitle}>Полезные советы</Text>
          <View style={styles.tipsList}>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Отвлекитесь от экрана хотя бы на половину времени
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Пейте воду для увлажнения организма
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Выполните несколько упражнений на растяжку
              </Text>
            </View>
            <View style={styles.tipItem}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>
                Сделайте глубокие вдохи для расслабления
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Controls */}
      <View style={styles.controlsSection}>
        <SessionControls
          isRunning={isRunning}
          isPaused={isPaused}
          onPause={pause}
          onResume={resume}
          onStop={handleStop}
          variant="break"
        />

        {/* Skip Button */}
        <Pressable
          style={({ pressed }) => [
            styles.skipButton,
            pressed && styles.skipButtonPressed,
          ]}
          onPress={handleSkipBreak}
          disabled={isCompleting}
        >
          <Text style={styles.skipButtonText}>Пропустить перерыв</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.xl,
  },
  header: {
    marginBottom: theme.spacing.xl,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: theme.spacing.xl,
  },
  timerContainer: {
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
  },
  suggestionsSection: {
    marginBottom: theme.spacing.xl,
  },
  suggestionsTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  suggestionsContainer: {
    gap: theme.spacing.md,
  },
  tipsSection: {
    marginBottom: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.spacing.md,
    padding: theme.spacing.md,
  },
  tipsTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.md,
  },
  tipsList: {
    gap: theme.spacing.md,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
  },
  tipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
    marginTop: theme.spacing.sm,
    flexShrink: 0,
  },
  tipText: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.text,
    flex: 1,
    lineHeight: 20,
  },
  controlsSection: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.md,
    gap: theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  skipButton: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.spacing.md,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonPressed: {
    backgroundColor: theme.colors.surface,
  },
  skipButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.primary,
  },
});