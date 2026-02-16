import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Session } from '../models/Session';
import { Exercise } from '../models/Exercise';
import { BiometricData } from '../models/BiometricData';
import { StorageService } from '../services/StorageService';
import { AchievementService } from '../services/AchievementService';
import { SharingService } from '../services/SharingService';
import { RootStackParamList } from '../navigation/types';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

type SessionResultScreenRouteProp = RouteProp<RootStackParamList, 'SessionResult'>;
type SessionResultScreenNavigationProp = StackNavigationProp<RootStackParamList, 'SessionResult'>;

const { width, height } = Dimensions.get('window');

interface AchievementUnlocked {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const SessionResultScreen: React.FC = () => {
  const navigation = useNavigation<SessionResultScreenNavigationProp>();
  const route = useRoute<SessionResultScreenRouteProp>();
  
  const { session, exercise, biometricData } = route.params;

  const [unlockedAchievements, setUnlockedAchievements] = useState<AchievementUnlocked[]>([]);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [achievementAnim] = useState(new Animated.Value(0));
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    saveSession();
    checkAchievements();
    animateEntrance();
  }, []);

  const saveSession = async () => {
    try {
      await StorageService.saveSession(session);
      
      const stats = await StorageService.getStatistics();
      const updatedStats = {
        ...stats,
        totalSessions: stats.totalSessions + 1,
        totalMinutes: stats.totalMinutes + Math.floor(session.duration / 60),
        lastSessionDate: new Date().toISOString(),
      };
      await StorageService.saveStatistics(updatedStats);
    } catch (error) {
      console.error('Error saving session:', error);
    }
  };

  const checkAchievements = async () => {
    try {
      const newAchievements = await AchievementService.checkAndUnlockAchievements(session);
      if (newAchievements.length > 0) {
        setUnlockedAchievements(newAchievements);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        animateAchievements();
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const animateEntrance = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateAchievements = () => {
    Animated.sequence([
      Animated.delay(800),
      Animated.spring(achievementAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleShare = async () => {
    try {
      setIsSharing(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const shareLink = await SharingService.generateShareLink(session, exercise);
      
      await Share.share({
        message: `Я только что завершил упражнение "${exercise.title}" в приложении MindFlow!\n\nДлительность: ${formatDuration(session.duration)}\nУровень стресса снижен на ${calculateStressReduction()}%\n\n${shareLink}`,
        title: 'Мой прогресс в MindFlow',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateStressReduction = (): number => {
    if (!biometricData || !biometricData.heartRateVariability) {
      return 0;
    }
    const reduction = Math.round((biometricData.heartRateVariability.after - biometricData.heartRateVariability.before) / biometricData.heartRateVariability.before * 100);
    return Math.max(0, Math.min(100, reduction));
  };

  const getStressReductionColor = (reduction: number): string => {
    if (reduction >= 20) return colors.success;
    if (reduction >= 10) return colors.warning;
    return colors.error;
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Home');
  };

  const handleViewStatistics = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Statistics');
  };

  const renderBiometricComparison = () => {
    if (!biometricData) return null;

    return (
      <View style={styles.biometricSection}>
        <Text style={styles.sectionTitle}>Биометрические показатели</Text>
        
        {biometricData.heartRate && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Пульс</Text>
            <View style={styles.metricValues}>
              <Text style={styles.metricBefore}>{Math.round(biometricData.heartRate.before)} bpm</Text>
              <Text style={styles.metricArrow}>→</Text>
              <Text style={styles.metricAfter}>{Math.round(biometricData.heartRate.after)} bpm</Text>
            </View>
          </View>
        )}

        {biometricData.heartRateVariability && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>HRV</Text>
            <View style={styles.metricValues}>
              <Text style={styles.metricBefore}>{Math.round(biometricData.heartRateVariability.before)} ms</Text>
              <Text style={styles.metricArrow}>→</Text>
              <Text style={styles.metricAfter}>{Math.round(biometricData.heartRateVariability.after)} ms</Text>
            </View>
          </View>
        )}

        {biometricData.respiratoryRate && (
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Дыхание</Text>
            <View style={styles.metricValues}>
              <Text style={styles.metricBefore}>{Math.round(biometricData.respiratoryRate.before)} /мин</Text>
              <Text style={styles.metricArrow}>→</Text>
              <Text style={styles.metricAfter}>{Math.round(biometricData.respiratoryRate.after)} /мин</Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderAchievements = () => {
    if (unlockedAchievements.length === 0) return null;

    return (
      <Animated.View
        style={[
          styles.achievementsSection,
          {
            opacity: achievementAnim,
            transform: [
              {
                translateY: achievementAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <Text style={styles.achievementTitle}>🎉 Новые достижения!</Text>
        {unlockedAchievements.map((achievement, index) => (
          <View key={achievement.id} style={styles.achievementCard}>
            <Text style={styles.achievementIcon}>{achievement.icon}</Text>
            <View style={styles.achievementInfo}>
              <Text style={styles.achievementName}>{achievement.title}</Text>
              <Text style={styles.achievementDescription}>{achievement.description}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  const stressReduction = calculateStressReduction();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[colors.primary, colors.secondary]}
        style={styles.headerGradient}
      >
        <Animated.View
          style={[
            styles.headerContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.completionIcon}>✓</Text>
          <Text style={styles.headerTitle}>Упражнение завершено!</Text>
          <Text style={styles.exerciseTitle}>{exercise.title}</Text>
        </Animated.View>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.statsCard,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.mainStat}>
            <Text style={styles.mainStatValue}>{formatDuration(session.duration)}</Text>
            <Text style={styles.mainStatLabel}>Длительность</Text>
          </View>

          {stressReduction > 0 && (
            <View style={styles.stressReductionContainer}>
              <Text
                style={[
                  styles.stressReductionValue,
                  { color: getStressReductionColor(stressReduction) },
                ]}
              >
                -{stressReduction}%
              </Text>
              <Text style={styles.stressReductionLabel}>Уровень стресса</Text>
            </View>
          )}
        </Animated.View>

        {renderBiometricComparison()}
        {renderAchievements()}

        <View style={styles.feedbackSection}>
          <Text style={styles.sectionTitle}>Как вы себя чувствуете?</Text>
          <View style={styles.moodButtons}>
            {['😊', '😌', '😐', '😔'].map((emoji, index) => (
              <TouchableOpacity
                key={index}
                style={styles.moodButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
              >
                <Text style={styles.moodEmoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.insightSection}>
          <Text style={styles.insightText}>
            {stressReduction >= 20
              ? '🌟 Отличный результат! Вы значительно снизили уровень стресса.'
              : stressReduction >= 10
              ? '👍 Хорошая работа! Продолжайте в том же духе.'
              : '💪 Каждая практика приближает вас к цели. Не останавливайтесь!'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
          disabled={isSharing}
        >
          <Text style={styles.shareButtonText}>
            {isSharing ? 'Подготовка...' : '📤 Поделиться'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.statsButton}
          onPress={handleViewStatistics}
        >
          <Text style={styles.statsButtonText}>📊 Статистика</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
        >
          <LinearGradient
            colors={[colors.primary, colors.secondary]}
            style={styles.continueButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.continueButtonText}>Продолжить</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerGradient: {
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    alignItems: 'center',
  },
  completionIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  headerTitle: {
    ...typography.h2,
    color: colors.white,
    marginBottom: spacing.sm,
  },
  exerciseTitle: {
    ...typography.body,
    color: colors.white,
    opacity: 0.9,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  statsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  mainStat: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mainStatValue: {
    ...typography.h1,
    color: colors.primary,
    fontSize: 48,
  },
  mainStatLabel: {
    ...typography.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  stressReductionContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  stressReductionValue: {
    ...typography.h2,
    fontSize: 36,