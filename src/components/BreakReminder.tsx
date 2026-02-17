import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

interface BreakReminderProps {
  visible: boolean;
  onDismiss: () => void;
  onTakeBreak: (duration: number) => void;
  isDarkMode?: boolean;
}

const { width, height } = Dimensions.get('window');

const BreakReminder: React.FC<BreakReminderProps> = ({
  visible,
  onDismiss,
  onTakeBreak,
  isDarkMode = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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
      pulseAnimation.start();

      return () => {
        pulseAnimation.stop();
      };
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleTakeBreak = (duration: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTakeBreak(duration);
  };

  const handleDismiss = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onDismiss();
  };

  const breakOptions = [
    { duration: 5, emoji: '☕', label: '5 минут', description: 'Быстрый перерыв' },
    { duration: 10, emoji: '🧘', label: '10 минут', description: 'Полноценный отдых' },
    { duration: 15, emoji: '🚶', label: '15 минут', description: 'Прогулка' },
  ];

  const colors = isDarkMode
    ? {
        background: '#1F2937',
        surface: '#374151',
        text: '#F9FAFB',
        textSecondary: '#D1D5DB',
        primary: '#818CF8',
        secondary: '#2DD4BF',
        border: '#4B5563',
      }
    : {
        background: '#FFFFFF',
        surface: '#F0F9FF',
        text: '#1F2937',
        textSecondary: '#6B7280',
        primary: '#6366F1',
        secondary: '#14B8A6',
        border: '#E5E7EB',
      };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleDismiss}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={80} tint={isDarkMode ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0, 0, 0, 0.5)' }]} />
        )}

        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
              opacity: fadeAnim,
            },
          ]}
        >
          <View style={[styles.card, { backgroundColor: colors.background }]}>
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  backgroundColor: colors.surface,
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            >
              <Text style={styles.iconEmoji}>🌟</Text>
            </Animated.View>

            <Text style={[styles.title, { color: colors.text }]}>
              Время для перерыва!
            </Text>

            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Ты работаешь уже 2 часа. Небольшой отдых повысит твою продуктивность
            </Text>

            <View style={styles.optionsContainer}>
              {breakOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.duration}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => handleTakeBreak(option.duration)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.optionEmoji}>{option.emoji}</Text>
                  <Text style={[styles.optionLabel, { color: colors.text }]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>
                    {option.description}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.7}
            >
              <Text style={[styles.dismissText, { color: colors.textSecondary }]}>
                Напомнить позже
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
  },
  card: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconEmoji: {
    fontSize: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  optionEmoji: {
    fontSize: 32,
  },
  optionLabel: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
  },
  optionDescription: {
    fontSize: 14,
  },
  dismissButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default BreakReminder;