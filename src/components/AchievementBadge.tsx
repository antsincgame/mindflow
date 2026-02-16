import React from 'react';
import { View, Text, StyleSheet, Pressable, ViewStyle, TextStyle } from 'react-native';
import Svg, { Circle, Path, G } from 'react-native-svg';
import { theme } from '../theme';

interface AchievementBadgeProps {
  id: string;
  title: string;
  description: string;
  icon: 'star' | 'medal' | 'trophy' | 'flame' | 'crown' | 'gem';
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'card' | 'compact' | 'detailed';
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  id,
  title,
  description,
  icon,
  unlocked,
  unlockedAt,
  progress = 0,
  maxProgress = 100,
  onPress,
  size = 'medium',
  variant = 'card',
}) => {
  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return { iconSize: 40, containerPadding: 8 };
      case 'large':
        return { iconSize: 80, containerPadding: 20 };
      case 'medium':
      default:
        return { iconSize: 60, containerPadding: 16 };
    }
  };

  const renderIcon = (iconType: string, iconSize: number) => {
    const color = unlocked ? theme.colors.accent : theme.colors.text.tertiary;
    const opacity = unlocked ? 1 : 0.4;

    switch (iconType) {
      case 'star':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
              fill={color}
              opacity={opacity}
            />
          </Svg>
        );
      case 'medal':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Circle cx="12" cy="12" r="8" fill={color} opacity={opacity} />
            <Path
              d="M12 4V2M12 20V22M20 12H22M4 12H2"
              stroke={color}
              strokeWidth="2"
              opacity={opacity}
            />
          </Svg>
        );
      case 'trophy':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Path
              d="M6 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V8C20 9.06087 19.5786 10.0783 18.8284 10.8284C18.0783 11.5786 17.0609 12 16 12H8C6.93913 12 5.92172 11.5786 5.17157 10.8284C4.42143 10.0783 4 9.06087 4 8V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4Z"
              fill={color}
              opacity={opacity}
            />
            <Path
              d="M8 12V14C8 15.0609 8.42143 16.0783 9.17157 16.8284C9.92172 17.5786 10.9391 18 12 18C13.0609 18 14.0783 17.5786 14.8284 16.8284C15.5786 16.0783 16 15.0609 16 14V12"
              stroke={color}
              strokeWidth="2"
              opacity={opacity}
            />
          </Svg>
        );
      case 'flame':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2C12 2 8 8 8 12C8 14.2091 9.79086 16 12 16C14.2091 16 16 14.2091 16 12C16 8 12 2 12 2Z"
              fill={color}
              opacity={opacity}
            />
            <Circle cx="12" cy="19" r="2" fill={color} opacity={opacity} />
          </Svg>
        );
      case 'crown':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Path
              d="M3 6L6 12H18L21 6M6 12L9 18H15L18 12M9 18H15M12 8L14 10M12 8L10 10"
              stroke={color}
              strokeWidth="2"
              opacity={opacity}
            />
          </Svg>
        );
      case 'gem':
        return (
          <Svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 2L15 8L22 9L17 14L18 21L12 18L6 21L7 14L2 9L9 8L12 2Z"
              fill={color}
              opacity={opacity}
            />
          </Svg>
        );
      default:
        return null;
    }
  };

  const { iconSize, containerPadding } = getSizeStyles();
  const progressPercent = maxProgress > 0 ? (progress / maxProgress) * 100 : 0;

  const renderCompactVariant = () => (
    <Pressable
      style={[
        styles.compactContainer,
        {
          paddingHorizontal: containerPadding,
          paddingVertical: containerPadding * 0.75,
          opacity: unlocked ? 1 : 0.6,
        },
        onPress && styles.pressable,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.compactIconWrapper}>
        {renderIcon(icon, iconSize * 0.6)}
      </View>
      <View style={styles.compactTextWrapper}>
        <Text
          style={[
            styles.compactTitle,
            { color: unlocked ? theme.colors.text.primary : theme.colors.text.secondary },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {!unlocked && maxProgress && (
          <Text style={styles.progressText}>
            {progress}/{maxProgress}
          </Text>
        )}
      </View>
    </Pressable>
  );

  const renderCardVariant = () => (
    <Pressable
      style={[
        styles.cardContainer,
        {
          paddingHorizontal: containerPadding,
          paddingVertical: containerPadding,
          backgroundColor: unlocked ? theme.colors.success.light : theme.colors.background.secondary,
          borderColor: unlocked ? theme.colors.success.main : theme.colors.border,
        },
        onPress && styles.pressable,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.cardIconWrapper}>
        {renderIcon(icon, iconSize)}
        {unlocked && (
          <View
            style={[
              styles.unlockedBadge,
              { backgroundColor: theme.colors.success.main },
            ]}
          >
            <Text style={styles.unlockedBadgeText}>✓</Text>
          </View>
        )}
      </View>
      <Text
        style={[
          styles.cardTitle,
          { color: unlocked ? theme.colors.text.primary : theme.colors.text.secondary },
        ]}
        numberOfLines={2}
      >
        {title}
      </Text>
      {!unlocked && maxProgress && (
        <View style={styles.progressBarWrapper}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progressPercent}%`,
                backgroundColor: theme.colors.accent,
              },
            ]}
          />
        </View>
      )}
      {!unlocked && maxProgress && (
        <Text style={styles.progressLabel}>
          {progress}/{maxProgress}
        </Text>
      )}
    </Pressable>
  );

  const renderDetailedVariant = () => (
    <Pressable
      style={[
        styles.detailedContainer,
        {
          paddingHorizontal: containerPadding,
          paddingVertical: containerPadding,
          backgroundColor: unlocked ? theme.colors.success.light : theme.colors.background.secondary,
          borderColor: unlocked ? theme.colors.success.main : theme.colors.border,
        },
        onPress && styles.pressable,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.detailedHeader}>
        <View style={styles.detailedIconWrapper}>
          {renderIcon(icon, iconSize)}
          {unlocked && (
            <View
              style={[
                styles.unlockedBadge,
                { backgroundColor: theme.colors.success.main },
              ]}
            >
              <Text style={styles.unlockedBadgeText}>✓</Text>
            </View>
          )}
        </View>
        <View style={styles.detailedTitleWrapper}>
          <Text
            style={[
              styles.detailedTitle,
              { color: unlocked ? theme.colors.text.primary : theme.colors.text.secondary },
            ]}
            numberOfLines={2}
          >
            {title}
          </Text>
          {unlocked && unlockedAt && (
            <Text style={styles.unlockedDate}>
              {new Date(unlockedAt).toLocaleDateString()}
            </Text>
          )}
        </View>
      </View>
      <Text
        style={[
          styles.detailedDescription,
          { color: theme.colors.text.secondary },
        ]}
        numberOfLines={2}
      >
        {description}
      </Text>
      {!unlocked && maxProgress && (
        <>
          <View style={styles.progressBarWrapper}>
            <View
              style={[
                styles.progressBar,
                {
                  width: `${progressPercent}%`,
                  backgroundColor: theme.colors.accent,
                },
              ]}
            />
          </View>
          <Text style={styles.progressLabel}>
            {progress}/{maxProgress}
          </Text>
        </>
      )}
    </Pressable>
  );

  switch (variant) {
    case 'compact':
      return renderCompactVariant();
    case 'detailed':
      return renderDetailedVariant();
    case 'card':
    default:
      return renderCardVariant();
  }
};

const styles = StyleSheet.create({
  pressable: {
    opacity: 1,
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.radius.md,
    marginVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  compactIconWrapper: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTextWrapper: {
    flex: 1,
  },
  compactTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
  },
  progressText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
    marginTop: theme.spacing.xs,
  },
  cardContainer: {
    alignItems: 'center',
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.radius.lg,
    marginVertical: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
    minHeight: 160,
    justifyContent: 'space-between',
  },
  cardIconWrapper: {
    position: 'relative',
    marginBottom: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold as any,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  unlockedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.background.primary,
  },
  unlockedBadgeText: {
    color: theme.colors.background.primary,
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
  },
  progressBarWrapper: {
    width: '100%',
    height: 6,
    backgroundColor: theme.colors.background.primary,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  progressLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.text.tertiary,
  },
  detailedContainer: {
    backgroundColor: theme.colors.background.secondary,
    borderRadius: theme.spacing.radius.lg,
    marginVertical: theme.spacing.md,
    borderWidth: 2,
    borderColor: theme.colors.border,
  },
  detailedHeader: {
    flexDirection: 'row',
    marginBottom: theme.spacing.md,
    alignItems: 'flex-start',
  },
  detailedIconWrapper: {
    position: 'relative',
    marginRight: theme.spacing.md,
  },
  detailedTitleWrapper: {
    flex: 1,
  },
  detailedTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold as any,
  },
  unlockedDate: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.success.main,
    marginTop: theme.spacing.xs,
  },
  detailedDescription: {
    fontSize: theme.typography.sizes.sm,
    lineHeight: 20,
    marginBottom: theme.spacing.md,
  },
});

export default AchievementBadge;