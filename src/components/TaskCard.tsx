import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useColorScheme,
} from 'react-native';
import { Task } from '../models/Task';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onToggleComplete: () => void;
  onMoodCheck?: () => void;
  showMoodPulse?: boolean;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPress,
  onToggleComplete,
  onMoodCheck,
  showMoodPulse = false,
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (showMoodPulse) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1.2,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(pulseAnim, {
              toValue: 1,
              duration: 800,
              useNativeDriver: true,
            }),
            Animated.timing(opacityAnim, {
              toValue: 0.6,
              duration: 800,
              useNativeDriver: true,
            }),
          ]),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      pulseAnim.setValue(1);
      opacityAnim.setValue(0.6);
    }
  }, [showMoodPulse, pulseAnim, opacityAnim]);

  const getPriorityColor = (priority: string | undefined) => {
    switch (priority) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return isDark ? '#6B7280' : '#9CA3AF';
    }
  };

  const formatTime = (timestamp: number | undefined) => {
    if (!timestamp) return 'Не запланировано';
    return format(new Date(timestamp * 1000), 'HH:mm', { locale: ru });
  };

  const formatDuration = (minutes: number | undefined) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}ч ${mins}м`;
    } else if (hours > 0) {
      return `${hours}ч`;
    }
    return `${mins}м`;
  };

  const styles = StyleSheet.create({
    container: {
      backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
      borderRadius: 16,
      padding: 16,
      marginHorizontal: 16,
      marginVertical: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.3 : 0.1,
      shadowRadius: 8,
      elevation: 3,
      borderLeftWidth: 4,
      borderLeftColor: task.color || getPriorityColor(task.priority),
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    leftSection: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    checkboxContainer: {
      marginRight: 12,
      marginTop: 2,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: task.color || getPriorityColor(task.priority),
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: task.completed
        ? task.color || getPriorityColor(task.priority)
        : 'transparent',
    },
    checkmark: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: 'bold',
    },
    titleContainer: {
      flex: 1,
    },
    title: {
      fontSize: 16,
      fontWeight: '600',
      color: isDark ? '#F9FAFB' : '#1F2937',
      marginBottom: 4,
      textDecorationLine: task.completed ? 'line-through' : 'none',
      opacity: task.completed ? 0.6 : 1,
    },
    timeInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: 8,
    },
    timeText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    durationText: {
      fontSize: 14,
      color: isDark ? '#9CA3AF' : '#6B7280',
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 2,
      backgroundColor: isDark ? '#6B7280' : '#9CA3AF',
    },
    moodButton: {
      marginLeft: 8,
    },
    moodIcon: {
      fontSize: 28,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: 8,
      paddingTop: 8,
      borderTopWidth: 1,
      borderTopColor: isDark ? '#374151' : '#E5E7EB',
    },
    priorityBadge: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 8,
      backgroundColor: isDark ? '#374151' : '#F3F4F6',
    },
    priorityText: {
      fontSize: 12,
      fontWeight: '600',
      color: getPriorityColor(task.priority),
      textTransform: 'uppercase',
    },
    statusText: {
      fontSize: 12,
      color: isDark ? '#9CA3AF' : '#6B7280',
      fontStyle: 'italic',
    },
  });

  const getPriorityLabel = (priority: string | undefined) => {
    switch (priority) {
      case 'high':
        return 'Высокий';
      case 'medium':
        return 'Средний';
      case 'low':
        return 'Низкий';
      default:
        return '';
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.leftSection}>
          <TouchableOpacity
            style={styles.checkboxContainer}
            onPress={onToggleComplete}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <View style={styles.checkbox}>
              {task.completed && <Text style={styles.checkmark}>✓</Text>}
            </View>
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.title} numberOfLines={2}>
              {task.title}
            </Text>
            <View style={styles.timeInfo}>
              <Text style={styles.timeText}>{formatTime(task.scheduledTime)}</Text>
              {task.duration && (
                <>
                  <View style={styles.dot} />
                  <Text style={styles.durationText}>
                    {formatDuration(task.duration)}
                  </Text>
                </>
              )}
            </View>
          </View>
        </View>

        {showMoodPulse && onMoodCheck && (
          <TouchableOpacity
            style={styles.moodButton}
            onPress={onMoodCheck}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Animated.Text
              style={[
                styles.moodIcon,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: opacityAnim,
                },
              ]}
            >
              😊
            </Animated.Text>
          </TouchableOpacity>
        )}
      </View>

      {(task.priority || task.completed) && (
        <View style={styles.footer}>
          {task.priority && (
            <View style={styles.priorityBadge}>
              <Text style={styles.priorityText}>
                {getPriorityLabel(task.priority)}
              </Text>
            </View>
          )}
          {task.completed && (
            <Text style={styles.statusText}>Выполнено</Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};