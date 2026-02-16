import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSession } from '../hooks/useSession';
import { useTimer } from '../hooks/useTimer';
import { useNotifications } from '../hooks/useNotifications';
import Timer from '../components/Timer';
import SessionControls from '../components/SessionControls';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';
import { SoundService } from '../services/SoundService';
import { NotificationService } from '../services/NotificationService';
import { SessionService } from '../services/SessionService';

interface SessionScreenProps {
  route: {
    params?: {
      taskName?: string;
      duration?: number;
    };
  };
  navigation: any;
}

export const SessionScreen: React.FC<SessionScreenProps> = ({
  route,
  navigation,
}) => {
  const taskName = route.params?.taskName || 'Focus Session';
  const initialDuration = route.params?.duration || 15 * 60;

  const {
    sessionState,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
  } = useSession();

  const { timeRemaining, isRunning, startTimer, pauseTimer, resetTimer } =
    useTimer(initialDuration);

  const { blockNotifications, unblockNotifications } = useNotifications();

  const [appState, setAppState] = useState<AppStateStatus>(
    AppState.currentState
  );
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);

  useFocusEffect(
    useCallback(() => {
      const initializeSession = async () => {
        await blockNotifications();
        await startSession(taskName, initialDuration);
        setSessionStartTime(new Date());
        startTimer();
        await SoundService.playSessionStartSound();
      };

      initializeSession();

      return () => {
        if (isRunning) {
          pauseTimer();
        }
      };
    }, [])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => {
      subscription.remove();
    };
  }, [isRunning, sessionState]);

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (
      appState.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      if (sessionState.isActive && !isRunning) {
        startTimer();
      }
    } else if (nextAppState.match(/inactive|background/)) {
      if (isRunning) {
        pauseTimer();
      }
    }
    setAppState(nextAppState);
  };

  const handlePausePress = useCallback(async () => {
    if (isRunning) {
      pauseTimer();
      await pauseSession();
      await SoundService.playPauseSound();
    } else {
      startTimer();
      await resumeSession();
      await SoundService.playResumeSound();
    }
  }, [isRunning, pauseTimer, startTimer, pauseSession, resumeSession]);

  const handleStopPress = useCallback(async () => {
    pauseTimer();
    resetTimer();
    await stopSession();
    await unblockNotifications();
    await SoundService.playSessionCompleteSound();

    const sessionDuration = sessionStartTime
      ? Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000)
      : initialDuration;

    await SessionService.saveSession({
      taskName,
      duration: sessionDuration,
      completed: true,
      pausedCount: sessionState.pausedCount,
      startedAt: sessionStartTime || new Date(),
      completedAt: new Date(),
    });

    navigation.replace('SessionComplete', {
      taskName,
      duration: sessionDuration,
      pausedCount: sessionState.pausedCount,
    });
  }, [
    pauseTimer,
    resetTimer,
    stopSession,
    unblockNotifications,
    sessionStartTime,
    taskName,
    initialDuration,
    sessionState.pausedCount,
    navigation,
  ]);

  const handleQuickStop = useCallback(async () => {
    pauseTimer();
    resetTimer();
    await stopSession();
    await unblockNotifications();

    navigation.goBack();
  }, [pauseTimer, resetTimer, stopSession, unblockNotifications, navigation]);

  const progressPercentage =
    ((initialDuration - timeRemaining) / initialDuration) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primary} />

      <View style={styles.header}>
        <View style={styles.taskInfo}>
          <Typography variant="h3" color={colors.text.primary}>
            {taskName}
          </Typography>
          {sessionState.pausedCount > 0 && (
            <Typography variant="caption" color={colors.text.secondary}>
              Paused {sessionState.pausedCount}x
            </Typography>
          )}
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.timerContainer}>
          <Timer
            timeRemaining={timeRemaining}
            isRunning={isRunning}
            progress={progressPercentage}
          />
        </View>

        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${progressPercentage}%` },
              ]}
            />
          </View>
          <Typography
            variant="body2"
            color={colors.text.secondary}
            style={styles.progressText}
          >
            {Math.round(progressPercentage)}% Complete
          </Typography>
        </View>

        <View style={styles.controlsContainer}>
          <SessionControls
            isRunning={isRunning}
            onPause={handlePausePress}
            onStop={handleStopPress}
            onQuickStop={handleQuickStop}
          />
        </View>

        <View style={styles.infoSection}>
          <InfoCard
            label="Status"
            value={
              isRunning
                ? 'In Progress'
                : sessionState.isPaused
                  ? 'Paused'
                  : 'Ready'
            }
          />
          <InfoCard
            label="Notifications"
            value="Blocked"
            highlight
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

interface InfoCardProps {
  label: string;
  value: string;
  highlight?: boolean;
}

const InfoCard: React.FC<InfoCardProps> = ({ label, value, highlight }) => (
  <View style={[styles.infoCard, highlight && styles.infoCardHighlight]}>
    <Typography variant="caption" color={colors.text.secondary}>
      {label}
    </Typography>
    <Typography
      variant="body1"
      color={highlight ? colors.success : colors.text.primary}
    >
      {value}
    </Typography>
  </View>
);

interface TypographyProps {
  variant: 'h1' | 'h2' | 'h3' | 'body1' | 'body2' | 'caption';
  color: string;
  children: React.ReactNode;
  style?: any;
}

const Typography: React.FC<TypographyProps> = ({
  variant,
  color,
  children,
  style,
}) => {
  const getStyles = () => {
    switch (variant) {
      case 'h1':
        return typography.h1;
      case 'h2':
        return typography.h2;
      case 'h3':
        return typography.h3;
      case 'body1':
        return typography.body1;
      case 'body2':
        return typography.body2;
      case 'caption':
        return typography.caption;
      default:
        return typography.body1;
    }
  };

  return (
    <View style={[getStyles(), { color }, style]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taskInfo: {
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    justifyContent: 'space-between',
  },
  timerContainer: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  progressSection: {
    marginVertical: spacing.lg,
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.background.secondary,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
  },
  controlsContainer: {
    marginVertical: spacing.lg,
  },
  infoSection: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  infoCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.background.secondary,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  infoCardHighlight: {
    borderColor: colors.success,
    backgroundColor: `${colors.success}15`,
  },
});

export default SessionScreen;