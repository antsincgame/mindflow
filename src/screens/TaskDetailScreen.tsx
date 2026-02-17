import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { Task } from '../models/Task';
import { taskService } from '../services/taskService';
import { schedulingService } from '../services/schedulingService';
import { useTheme } from '../hooks/useTheme';
import TimeSlotCard from '../components/TimeSlotCard';

type RootStackParamList = {
  TaskDetail: { taskId: number };
  Home: undefined;
};

type TaskDetailScreenRouteProp = RouteProp<RootStackParamList, 'TaskDetail'>;
type TaskDetailScreenNavigationProp = StackNavigationProp<RootStackParamList>;

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  energyLevel: number;
  confidence: number;
}

const TaskDetailScreen: React.FC = () => {
  const navigation = useNavigation<TaskDetailScreenNavigationProp>();
  const route = useRoute<TaskDetailScreenRouteProp>();
  const { theme } = useTheme();
  const { taskId } = route.params;

  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [recommendedSlots, setRecommendedSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [editedTitle, setEditedTitle] = useState('');
  const [editedDuration, setEditedDuration] = useState('60');
  const [editedPriority, setEditedPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [editedNote, setEditedNote] = useState('');

  useEffect(() => {
    loadTask();
  }, [taskId]);

  useEffect(() => {
    if (task && !task.scheduledTime) {
      loadRecommendedSlots();
    }
  }, [task]);

  const loadTask = async () => {
    try {
      setLoading(true);
      const loadedTask = await taskService.getTaskById(taskId);
      if (loadedTask) {
        setTask(loadedTask);
        setEditedTitle(loadedTask.title);
        setEditedDuration(loadedTask.duration.toString());
        setEditedPriority(loadedTask.priority);
        setEditedNote(loadedTask.note || '');
      } else {
        Alert.alert('Ошибка', 'Задача не найдена');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error loading task:', error);
      Alert.alert('Ошибка', 'Не удалось загрузить задачу');
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendedSlots = async () => {
    if (!task) return;

    try {
      setLoadingSlots(true);
      const slots = await schedulingService.getRecommendedSlots(
        task.duration,
        task.priority
      );
      setRecommendedSlots(slots);
    } catch (error) {
      console.error('Error loading recommended slots:', error);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSave = async () => {
    if (!task || !editedTitle.trim()) {
      Alert.alert('Ошибка', 'Название задачи не может быть пустым');
      return;
    }

    const duration = parseInt(editedDuration, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Ошибка', 'Укажите корректную длительность');
      return;
    }

    try {
      setSaving(true);
      const updatedTask: Task = {
        ...task,
        title: editedTitle.trim(),
        duration,
        priority: editedPriority,
        note: editedNote.trim() || undefined,
        updatedAt: Date.now(),
      };

      await taskService.updateTask(updatedTask);
      setTask(updatedTask);
      setIsEditing(false);
      Alert.alert('Успешно', 'Задача обновлена');
    } catch (error) {
      console.error('Error saving task:', error);
      Alert.alert('Ошибка', 'Не удалось сохранить изменения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Удалить задачу?',
      'Это действие нельзя отменить',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Удалить',
          style: 'destructive',
          onPress: async () => {
            try {
              await taskService.deleteTask(taskId);
              navigation.goBack();
            } catch (error) {
              console.error('Error deleting task:', error);
              Alert.alert('Ошибка', 'Не удалось удалить задачу');
            }
          },
        },
      ]
    );
  };

  const handleToggleComplete = async () => {
    if (!task) return;

    try {
      const updatedTask = { ...task, completed: !task.completed };
      await taskService.updateTask(updatedTask);
      setTask(updatedTask);
    } catch (error) {
      console.error('Error toggling task completion:', error);
      Alert.alert('Ошибка', 'Не удалось обновить статус задачи');
    }
  };

  const handleSelectTimeSlot = async (slot: TimeSlot) => {
    if (!task) return;

    try {
      const updatedTask: Task = {
        ...task,
        scheduledTime: slot.startTime.getTime(),
        updatedAt: Date.now(),
      };

      await taskService.updateTask(updatedTask);
      setTask(updatedTask);
      setRecommendedSlots([]);
      Alert.alert('Успешно', 'Время задачи установлено');
    } catch (error) {
      console.error('Error scheduling task:', error);
      Alert.alert('Ошибка', 'Не удалось запланировать задачу');
    }
  };

  const handleReschedule = () => {
    if (task) {
      setTask({ ...task, scheduledTime: undefined });
      loadRecommendedSlots();
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <Text style={[styles.errorText, { color: theme.text }]}>
          Задача не найдена
        </Text>
      </View>
    );
  }

  const priorityColors = {
    low: '#10B981',
    medium: '#F59E0B',
    high: '#EF4444',
  };

  const priorityLabels = {
    low: 'Низкий',
    medium: 'Средний',
    high: 'Высокий',
  };

  return (
    <KeyboardAvoidingView
      style={styles.keyboardAvoid}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: theme.background }]}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Text style={[styles.backButtonText, { color: theme.primary }]}>
              ← Назад
            </Text>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            {!isEditing ? (
              <>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                >
                  <Text style={styles.actionButtonText}>Редактировать</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleDelete}
                  style={[styles.actionButton, styles.deleteButton]}
                >
                  <Text style={styles.actionButtonText}>Удалить</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  onPress={handleSave}
                  style={[styles.actionButton, { backgroundColor: theme.primary }]}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>Сохранить</Text>
                  )}
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    setIsEditing(false);
                    setEditedTitle(task.title);
                    setEditedDuration(task.duration.toString());
                    setEditedPriority(task.priority);
                    setEditedNote(task.note || '');
                  }}
                  style={[styles.actionButton, styles.cancelButton]}
                >
                  <Text style={styles.actionButtonText}>Отмена</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          {isEditing ? (
            <>
              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Название
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.primary,
                  },
                ]}
                value={editedTitle}
                onChangeText={setEditedTitle}
                placeholder="Название задачи"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Длительность (минуты)
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.primary,
                  },
                ]}
                value={editedDuration}
                onChangeText={setEditedDuration}
                keyboardType="number-pad"
                placeholder="60"
                placeholderTextColor={theme.textSecondary}
              />

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Приоритет
              </Text>
              <View style={styles.priorityContainer}>
                {(['low', 'medium', 'high'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => setEditedPriority(priority)}
                    style={[
                      styles.priorityButton,
                      {
                        backgroundColor:
                          editedPriority === priority
                            ? priorityColors[priority]
                            : theme.background,
                        borderColor: priorityColors[priority],
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityButtonText,
                        {
                          color:
                            editedPriority === priority
                              ? '#FFFFFF'
                              : theme.text,
                        },
                      ]}
                    >
                      {priorityLabels[priority]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.label, { color: theme.textSecondary }]}>
                Заметка
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.noteInput,
                  {
                    backgroundColor: theme.background,
                    color: theme.text,
                    borderColor: theme.primary,
                  },
                ]}
                value={editedNote}
                onChangeText={setEditedNote}
                placeholder="Дополнительная информация"
                placeholderTextColor={theme.textSecondary}
                multiline
                numberOfLines={4}
              />
            </>
          ) : (
            <>
              <Text style={[styles.title, { color: theme.text }]}>
                {task.title}
              </Text>

              <View style={styles.metaRow}>
                <View
                  style={[
                    styles.priorityBadge,
                    { backgroundColor: priorityColors[task.priority] },
                  ]}
                >
                  <Text style={styles.priorityBadgeText}>
                    {priorityLabels[task.priority]}
                  </Text>
                </View>
                <Text style={[styles.duration, { color: theme.textSecondary }]}>
                  {task.duration} мин
                </Text>
              </View>

              {task.note && (
                <Text style={[styles.note, { color: theme.textSecondary }]}>
                  {task.note}
                </Text>
              )}

              <TouchableOpacity
                onPress={handleToggleComplete}
                style={[
                  styles.completeButton,
                  {
                    backgroundColor: task.completed
                      ? theme.secondary
                      : theme.background,
                    borderColor: theme.secondary,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.completeButtonText,
                    { color: task.completed ? '#FFFFFF' : theme.text },
                  ]}
                >
                  {task.completed ? '✓ Выполнено' : 'Отметить выполненной'}
                </Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {task.scheduledTime ? (
          <View style={[styles.card, { backgroundColor: theme.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              Запланировано
            </Text>
            <Text style={[styles.scheduledTime, { color: theme.primary }]}>
              {format(new Date(task.scheduledTime), 'EEEE, d MMMM', {
                locale: ru,
              })}
            </Text>
            <Text style={[styles.scheduledTime, { color: theme.primary }]}>
              {format(new Date(task.scheduledTime), 'HH:mm')}
            </Text>
            <TouchableOpacity
              onPress={handleReschedule}
              style={[
                styles.rescheduleButton,
                { backgroundColor: theme.background, borderColor: theme.primary },
              ]}
            >
              <Text style={[styles.rescheduleButtonText, { color: theme.