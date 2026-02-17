import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Insight } from '../models/Insight';
import { useTheme } from '../hooks/useTheme';

interface InsightCardProps {
  insight: Insight;
  onDismiss?: (id: number) => void;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight, onDismiss }) => {
  const { theme, isDark } = useTheme();

  const getInsightIcon = (type: string): string => {
    switch (type) {
      case 'peak_hours':
        return '⚡';
      case 'low_energy':
        return '🔋';
      case 'productivity_pattern':
        return '📊';
      case 'break_reminder':
        return '☕';
      case 'task_suggestion':
        return '💡';
      case 'weekly_summary':
        return '📈';
      default:
        return '✨';
    }
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return theme.secondary;
    if (confidence >= 0.6) return theme.primary;
    return theme.textSecondary;
  };

  const getConfidenceLabel = (confidence: number): string => {
    if (confidence >= 0.8) return 'Высокая точность';
    if (confidence >= 0.6) return 'Средняя точность';
    return 'Низкая точность';
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Только что';
    if (diffInHours < 24) return `${diffInHours} ч назад`;
    if (diffInHours < 48) return 'Вчера';
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} дн назад`;
    
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getInsightIcon(insight.type)}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.timestamp, { color: theme.textSecondary }]}>
            {formatTimestamp(insight.createdAt)}
          </Text>
        </View>
        {onDismiss && (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => onDismiss(insight.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[styles.dismissIcon, { color: theme.textSecondary }]}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <Text style={[styles.message, { color: theme.text }]}>{insight.message}</Text>

      <View style={styles.footer}>
        <View style={styles.confidenceContainer}>
          <View
            style={[
              styles.confidenceDot,
              { backgroundColor: getConfidenceColor(insight.confidence) },
            ]}
          />
          <Text style={[styles.confidenceText, { color: theme.textSecondary }]}>
            {getConfidenceLabel(insight.confidence)}
          </Text>
        </View>
        <View style={styles.confidenceBar}>
          <View
            style={[
              styles.confidenceFill,
              {
                width: `${insight.confidence * 100}%`,
                backgroundColor: getConfidenceColor(insight.confidence),
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  headerText: {
    flex: 1,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '500',
  },
  dismissButton: {
    padding: 4,
  },
  dismissIcon: {
    fontSize: 18,
    fontWeight: '600',
  },
  message: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 12,
    fontWeight: '400',
  },
  footer: {
    marginTop: 8,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  confidenceDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '500',
  },
  confidenceBar: {
    height: 4,
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  confidenceFill: {
    height: '100%',
    borderRadius: 2,
  },
});