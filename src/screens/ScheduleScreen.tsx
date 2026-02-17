import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { format, startOfWeek, addDays, isSameDay, startOfDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useTasks } from '../hooks/useTasks';
import { useTheme } from '../hooks/useTheme';
import { Task } from '../models/Task';
import TaskBlock from '../components/TaskBlock';

const { width } = Dimensions.get('window');
const HOUR_HEIGHT = 60;
const TIME_COLUMN_WIDTH = 50;
const HOURS = Array.from({ length: 24 }, (_, i) => i);

const ScheduleScreen: React.FC = () => {
  const { theme } = useTheme();
  const { tasks, fetchTasks } = useTasks();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const start = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
    setWeekDays(days);
  }, [selectedDate]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchTasks();
    }, [fetchTasks])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter(
      (task) =>
        task.scheduledTime &&
        isSameDay(new Date(task.scheduledTime * 1000), date)
    );
  };

  const getTaskPosition = (task: Task) => {
    if (!task.scheduledTime) return { top: 0, height: 0 };
    const date = new Date(task.scheduledTime * 1000);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const top = (hours + minutes / 60) * HOUR_HEIGHT;
    const height = ((task.duration || 60) / 60) * HOUR_HEIGHT;
    return { top, height };
  };

  const getCurrentTimePosition = () => {
    const hours = currentTime.getHours();
    const minutes = currentTime.getMinutes();
    return (hours + minutes / 60) * HOUR_HEIGHT;
  };

  const goToPreviousWeek = () => {
    setSelectedDate((prev) => addDays(prev, -7));
  };

  const goToNextWeek = () => {
    setSelectedDate((prev) => addDays(prev, 7));
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.background,
    },
    header: {
      backgroundColor: theme.surface,
      paddingTop: 60,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.primary + '20',
    },
    navigationRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    navButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.primary + '10',
    },
    navButtonText: {
      color: theme.primary,
      fontSize: 14,
      fontWeight: '600',
    },
    todayButton: {
      paddingHorizontal: 20,
      paddingVertical: 8,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    todayButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '600',
    },
    weekRow: {
      flexDirection: 'row',
      paddingHorizontal: 8,
    },
    dayColumn: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: 8,
      marginHorizontal: 2,
      borderRadius: 8,
    },
    dayColumnSelected: {
      backgroundColor: theme.primary + '20',
    },
    dayColumnToday: {
      backgroundColor: theme.secondary + '10',
    },
    dayName: {
      fontSize: 12,
      color: theme.textSecondary,
      marginBottom: 4,
      fontWeight: '500',
    },
    dayNumber: {
      fontSize: 16,
      color: theme.text,
      fontWeight: '600',
    },
    dayNumberToday: {
      color: theme.secondary,
    },
    scrollContainer: {
      flex: 1,
    },
    calendarGrid: {
      flexDirection: 'row',
      position: 'relative',
    },
    timeColumn: {
      width: TIME_COLUMN_WIDTH,
      backgroundColor: theme.surface,
      borderRightWidth: 1,
      borderRightColor: theme.primary + '10',
    },
    timeSlot: {
      height: HOUR_HEIGHT,
      justifyContent: 'flex-start',
      paddingTop: 4,
      paddingRight: 8,
      alignItems: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: theme.primary + '05',
    },
    timeText: {
      fontSize: 12,
      color: theme.textSecondary,
    },
    daysContainer: {
      flex: 1,
      flexDirection: 'row',
    },
    dayScheduleColumn: {
      flex: 1,
      position: 'relative',
      borderRightWidth: 1,
      borderRightColor: theme.primary + '05',
    },
    hourLine: {
      height: HOUR_HEIGHT,
      borderBottomWidth: 1,
      borderBottomColor: theme.primary + '05',
    },
    taskBlockWrapper: {
      position: 'absolute',
      left: 2,
      right: 2,
      zIndex: 10,
    },
    currentTimeLine: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 2,
      backgroundColor: theme.secondary,
      zIndex: 20,
    },
    currentTimeCircle: {
      position: 'absolute',
      left: -4,
      top: -3,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: theme.secondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
    },
    emptyText: {
      fontSize: 16,
      color: theme.textSecondary,
      textAlign: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.navigationRow}>
          <TouchableOpacity style={styles.navButton} onPress={goToPreviousWeek}>
            <Text style={styles.navButtonText}>← Пред.</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.todayButton} onPress={goToToday}>
            <Text style={styles.todayButtonText}>Сегодня</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={goToNextWeek}>
            <Text style={styles.navButtonText}>След. →</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.weekRow}>
          {weekDays.map((day, index) => {
            const isSelectedDay = isSameDay(day, selectedDate);
            const isTodayDay = isToday(day);
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.dayColumn,
                  isSelectedDay && styles.dayColumnSelected,
                  isTodayDay && styles.dayColumnToday,
                ]}
                onPress={() => setSelectedDate(day)}
              >
                <Text style={styles.dayName}>
                  {format(day, 'EEE', { locale: ru })}
                </Text>
                <Text
                  style={[
                    styles.dayNumber,
                    isTodayDay && styles.dayNumberToday,
                  ]}
                >
                  {format(day, 'd')}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
          />
        }
      >
        <View style={styles.calendarGrid}>
          <View style={styles.timeColumn}>
            {HOURS.map((hour) => (
              <View key={hour} style={styles.timeSlot}>
                <Text style={styles.timeText}>
                  {hour.toString().padStart(2, '0')}:00
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.daysContainer}>
            {weekDays.map((day, dayIndex) => {
              const dayTasks = getTasksForDate(day);
              const isTodayDay = isToday(day);
              const currentTimeTop = getCurrentTimePosition();

              return (
                <View key={dayIndex} style={styles.dayScheduleColumn}>
                  {HOURS.map((hour) => (
                    <View key={hour} style={styles.hourLine} />
                  ))}

                  {dayTasks.map((task) => {
                    const { top, height } = getTaskPosition(task);
                    return (
                      <View
                        key={task.id}
                        style={[
                          styles.taskBlockWrapper,
                          { top, height: Math.max(height, 30) },
                        ]}
                      >
                        <TaskBlock task={task} />
                      </View>
                    );
                  })}

                  {isTodayDay && (
                    <View
                      style={[styles.currentTimeLine, { top: currentTimeTop }]}
                    >
                      <View style={styles.currentTimeCircle} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default ScheduleScreen;