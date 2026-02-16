import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../navigation/types';
import { useHealthData } from '../hooks/useHealthData';
import { useStatistics } from '../hooks/useStatistics';
import { BiometricIndicator } from '../components/BiometricIndicator';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width, height } = Dimensions.get('window');

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { heartRate, hrv, isLoading: healthLoading } = useHealthData();
  const { todaySessionsCount, currentStreak } = useStatistics();

  const [pulseAnim] = useState(new Animated.Value(1));
  const [fadeAnim] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(50));

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Pulse animation for main button
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const handleEmotionSelect = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('EmotionSelection');
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Доброе утро';
    if (hour < 18) return 'Добрый день';
    return 'Добрый вечер';
  };

  const getMotivationalText = (): string => {
    if (currentStreak >= 7) {
      return `Невероятно! ${currentStreak} дней подряд 🔥`;
    }
    if (currentStreak >= 3) {
      return `Отличная серия: ${currentStreak} дня 💪`;
    }
    if (todaySessionsCount > 0) {
      return 'Вы уже занимались сегодня! ✨';
    }
    return 'Как вы себя чувствуете?';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#667eea', '#764ba2', '#f093fb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          {/* Header Section */}
          <View style={styles.header}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.motivationalText}>{getMotivationalText()}</Text>
          </View>

          {/* Biometric Data Section */}
          {!healthLoading && (heartRate || hrv) && (
            <View style={styles.biometricContainer}>
              {heartRate && (
                <BiometricIndicator
                  type="heartRate"
                  value={heartRate}
                  label="Пульс"
                  unit="bpm"
                />
              )}
              {hrv && (
                <BiometricIndicator
                  type="hrv"
                  value={hrv}
                  label="HRV"
                  unit="ms"
                />
              )}
            </View>
          )}

          {/* Main Action Button */}
          <Animated.View
            style={[
              styles.mainButtonContainer,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.mainButton}
              onPress={handleEmotionSelect}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#ffffff', '#f8f9fa']}
                style={styles.buttonGradient}
              >
                <Text style={styles.mainButtonEmoji}>🎯</Text>
                <Text style={styles.mainButtonText}>Выбрать эмоцию</Text>
                <Text style={styles.mainButtonSubtext}>
                  Начните с определения того, что вы чувствуете
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Stats Section */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{todaySessionsCount}</Text>
              <Text style={styles.statLabel}>Сегодня</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{currentStreak}</Text>
              <Text style={styles.statLabel}>Серия дней</Text>
            </View>
          </View>

          {/* Quick Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>💡 Совет дня</Text>
            <Text style={styles.tipsText}>
              Регулярная практика дыхательных упражнений снижает уровень стресса
              и улучшает качество сна
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 30,
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 8,
  },
  motivationalText: {
    fontSize: 18,
    color: '#ffffff',
    opacity: 0.9,
  },
  biometricContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  mainButtonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  mainButton: {
    width: width - 48,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  buttonGradient: {
    paddingVertical: 40,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  mainButtonEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  mainButtonText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#667eea',
    marginBottom: 8,
  },
  mainButtonSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    gap: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
  },
  statValue: {
    fontSize: 36,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.8,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 16,
    padding: 20,
    backdropFilter: 'blur(10px)',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
  },
  tipsText: {
    fontSize: 14,
    color: '#ffffff',
    opacity: 0.9,
    lineHeight: 20,
  },
});