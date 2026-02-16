import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  variant = 'primary',
  size = 'medium',
  style,
}) => {
  const containerStyle = [
    styles.container,
    styles[`container_${variant}`],
    styles[`container_${size}`],
    style,
  ];

  const valueStyle = [
    styles.value,
    styles[`value_${size}`],
  ];

  const titleStyle = [
    styles.title,
    styles[`title_${size}`],
  ];

  return (
    <View style={containerStyle}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      
      <View style={styles.contentContainer}>
        <Text style={titleStyle} numberOfLines={1}>
          {title}
        </Text>
        
        <Text style={valueStyle} numberOfLines={1}>
          {value}
        </Text>
        
        {subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: theme.spacing.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  container_primary: {
    backgroundColor: theme.colors.primary,
  },

  container_secondary: {
    backgroundColor: theme.colors.secondary,
  },

  container_success: {
    backgroundColor: theme.colors.success,
  },

  container_warning: {
    backgroundColor: theme.colors.warning,
  },

  container_small: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },

  container_medium: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },

  container_large: {
    paddingVertical: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xl,
  },

  iconContainer: {
    marginRight: theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },

  contentContainer: {
    flex: 1,
  },

  title: {
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: theme.spacing.xs,
  },

  title_small: {
    fontSize: 12,
  },

  title_medium: {
    fontSize: 14,
  },

  title_large: {
    fontSize: 16,
  },

  value: {
    color: theme.colors.text,
    fontWeight: '700',
    marginBottom: theme.spacing.xs,
  },

  value_small: {
    fontSize: 18,
  },

  value_medium: {
    fontSize: 24,
  },

  value_large: {
    fontSize: 32,
  },

  subtitle: {
    color: theme.colors.textTertiary,
    fontSize: 12,
    fontWeight: '400',
    marginTop: theme.spacing.xs,
  },
});