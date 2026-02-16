import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface SessionControlsProps {
  isPaused: boolean;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  isLoading?: boolean;
}

export const SessionControls: React.FC<SessionControlsProps> = ({
  isPaused,
  onPause,
  onResume,
  onStop,
  isLoading = false,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.buttonRow}>
        {!isPaused ? (
          <TouchableOpacity
            style={[styles.button, styles.pauseButton]}
            onPress={onPause}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.pauseText]}>
              ⏸ Пауза
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.resumeButton]}
            onPress={onResume}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={[styles.buttonText, styles.resumeText]}>
              ▶ Продолжить
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.stopButton]}
          onPress={onStop}
          disabled={isLoading}
          activeOpacity={0.7}
        >
          <Text style={[styles.buttonText, styles.stopText]}>
            ⏹ Остановить
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pauseButton: {
    backgroundColor: colors.warning,
  },
  pauseText: {
    color: colors.white,
  },
  resumeButton: {
    backgroundColor: colors.success,
  },
  resumeText: {
    color: colors.white,
  },
  stopButton: {
    backgroundColor: colors.error,
  },
  stopText: {
    color: colors.white,
  },
  buttonText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    letterSpacing: 0.5,
  },
});