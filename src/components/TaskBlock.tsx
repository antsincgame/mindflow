import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../hooks/useTheme';
import { Task } from '../models/Task';
import { format } from 'date-fns';

interface TaskBlockProps {
  task: Task;
  onPress: (task: Task) => void;
  height: number;
  top: number;
}

export const TaskBlock: React.FC<TaskBlockProps> = ({
  task,
  onPress,
  height,
  top,
}) => {
  const { theme } = useTheme();

  const getTaskColor = (color?: string, completed?: boolean): string => {
    if (completed) {
      return theme.colors.textSecondary;
    }
    return color || theme.colors.primary;
  };

  const formatTime = (timestamp?: number): string => {
    if (!timestamp) return '';
    return format(new Date(timestamp * 1000), 'HH:mm');
  };

  const formatDuration = (duration?: number): string => {
    if (!duration) return '';
    const hours = Math.floor(duration / 60);
    const minutes = duration % 60;
    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${minutes}m`;
  };

  const backgroundColor = getTaskColor(task.color, task.completed === 1);
  const textColor = theme.isDark ? theme.colors.text : '#FFFFFF';

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor,
          height,
          top,
          opacity: task.completed === 1 ? 0.5 : 1,
        },
      ]}
      onPress={() => onPress(task)}
      activeOpacity={0.7}
    >
      <View style={styles.content}>
        <Text
          style={[
            styles.title,
            { color: textColor },
            task.completed === 1 && styles.completedText,
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {task.title}
        </Text>
        {task.scheduledTime && (
          <Text style={[styles.time, { color: textColor }]}>
            {formatTime(task.scheduledTime)}
          </Text>
        )}
        {task.duration && height > 40 && (
          <Text style={[styles.duration, { color: textColor }]}>
            {formatDuration(task.duration)}
          </Text>
        )}
      </View>
      {task.completed === 1 && (
        <View style={styles.checkmark}>
          <Text style={styles.checkmarkText}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  completedText: {
    textDecorationLine: 'line-through',
  },
  time: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 2,
  },
  duration: {
    fontSize: 11,
    opacity: 0.9,
  },
  checkmark: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});