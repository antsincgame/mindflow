import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { Achievement } from '../models/Achievement';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface AchievementBadgeProps {
  achievement: Achievement;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  showProgress?: boolean;
  style?: ViewStyle;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  achievement,
  onPress,
  size = 'medium',
  showProgress = false,
  style,
}) => {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const sizeConfig = {
    small: {
      container: 60,
      icon: 24,
      fontSize: 10,
    },
    medium: {
      container: 80,
      icon: 32,
      fontSize: 12,
    },
    large: {
      container: 100,
      icon: 40,
      fontSize: 14,
    },
  };

  const config = sizeConfig[size];

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, { damping: 10 }),
      withSpring(1, { damping: 10 })
    );

    if (achievement.isUnlocked) {
      rotation.value = withSequence(
        withTiming(10, { duration: 100 }),
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
    }

    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const getGradientColors = (): string[] => {
    if (!achievement.isUnlocked) {
      return [colors.gray[300], colors.gray[400]];
    }

    switch (achievement.tier) {
      case 'bronze':
        return ['#CD7F32', '#8B5A2B'];
      case 'silver':
        return ['#C0C0C0', '#808080'];
      case 'gold':
        return ['#FFD700', '#FFA500'];
      case 'platinum':
        return ['#E5E4E2', '#B8B8B8'];
      default:
        return [colors.primary[500], colors.primary[700]];
    }
  };

  const getProgressPercentage = (): number => {
    if (!achievement.progress || achievement.progress.total === 0) {
      return 0;
    }
    return Math.min(
      (achievement.progress.current / achievement.progress.total) * 100,
      100
    );
  };

  const renderIcon = () => {
    const iconSize = config.icon;
    const iconColor = achievement.isUnlocked ? '#FFFFFF' : colors.gray[500];

    return (
      <Text style={[styles.icon, { fontSize: iconSize, color: iconColor }]}>
        {achievement.icon}
      </Text>
    );
  };

  const renderProgressBar = () => {
    if (!showProgress || achievement.isUnlocked || !achievement.progress) {
      return null;
    }

    const percentage = getProgressPercentage();

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: colors.primary[500],
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {achievement.progress.current}/{achievement.progress.total}
        </Text>
      </View>
    );
  };

  const renderBadgeContent = () => (
    <>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.badge,
          {
            width: config.container,
            height: config.container,
            opacity: achievement.isUnlocked ? 1 : 0.5,
          },
        ]}
      >
        {renderIcon()}
        
        {achievement.isUnlocked && (
          <View style={styles.checkmarkContainer}>
            <Text style={styles.checkmark}>✓</Text>
          </View>
        )}
      </LinearGradient>

      <Text
        style={[
          styles.title,
          {
            fontSize: config.fontSize,
            color: achievement.isUnlocked ? colors.text.primary : colors.text.secondary,
          },
        ]}
        numberOfLines={2}
      >
        {achievement.title}
      </Text>

      {achievement.isUnlocked && achievement.unlockedAt && (
        <Text style={styles.date}>
          {new Date(achievement.unlockedAt).toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
      )}

      {renderProgressBar()}
    </>
  );

  return (
    <AnimatedTouchableOpacity
      style={[styles.container, animatedStyle, style]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={!onPress}
    >
      {renderBadgeContent()}
    </AnimatedTouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    padding: spacing.sm,
  },
  badge: {
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    position: 'relative',
  },
  icon: {
    fontWeight: 'bold',
  },
  checkmarkContainer: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.success[500],
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    marginTop: spacing.xs,
    textAlign: 'center',
    fontFamily: typography.fontFamily.medium,
    maxWidth: 100,
  },
  date: {
    fontSize: 10,
    color: colors.text.tertiary,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
  progressContainer: {
    marginTop: spacing.xs,
    width: '100%',
    alignItems: 'center',
  },
  progressBarBackground: {
    width: '100%',
    height: 4,
    backgroundColor: colors.gray[200],
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: colors.text.secondary,
    fontFamily: typography.fontFamily.regular,
    marginTop: 2,
  },
});