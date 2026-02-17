import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useTasks } from '../hooks/useTasks';
import { useEnergyLevel } from '../hooks/useEnergyLevel';
import { taskScheduler } from '../utils/taskScheduler';
import TimeSlotCard from '../components/TimeSlotCard';
import { Task } from '../models/Task';

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  energyScore: number;
  reason: string;
}

const AddTaskScreen: React.FC = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { addTask } = useTasks();
  const { energyLevel } = useEnergyLevel();

  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState(60);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [suggestedSlots, setSuggestedSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (title.length > 3 && duration > 0) {
      analyzeBestTimes();
    }
  }, [title, duration, priority]);

  const analyzeBestTimes = async () => {
    setIsAnalyzing(true);
    try {
      const slots = await taskScheduler.findOptimalSlots({
        duration,
        priority,
        energyLevel,
      });
      setSuggestedSlots(slots.slice(0, 3));
      if (slots.length > 0) {
        setSelectedSlot(slots[0]);
      }
    } catch (error) {
      console.error('Failed to analyze best times:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Ошибка', 'Введите название задачи');
      return;
    }

    if (!selectedSlot) {
      Alert.alert('Ошибка', 'Выберите время для задачи');
      return;
    }

    setIsLoading(true);
    try {
      const newTask: Omit<Task, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title.trim(),
        scheduledTime: selectedSlot.startTime.getTime(),
        duration,
        priority,
        completed: false,
        color: getPriorityColor(priority),
      };

      await addTask(newTask);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось создать задачу');
      console.error('Failed to create task:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const getPriorityColor = (p: string): string => {
    switch (p) {
      case 'high':
        return '#EF4444';
      case 'medium':
        return '#F59E0B';
      case 'low':
        return '#10B981';
      default:
        return colors.primary;
    }
  };

  const durations = [15, 30, 45, 60, 90, 120];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
          <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>
            Отмена
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Новая задача
        </Text>
        <TouchableOpacity
          onPress={handleSave}
          style={styles.headerButton}
          disabled={isLoading || !title.trim() || !selectedSlot}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text
              style={[
                styles.headerButtonText,
                {
                  color:
                    !title.trim() || !selectedSlot
                      ? colors.textSecondary
                      : colors.primary,
                },
              ]}
            >
              Готово
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Название
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.textSecondary + '30',
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholder="Что нужно сделать?"
            placeholderTextColor={colors.textSecondary}
            autoFocus
            maxLength={100}
          />
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Длительность
          </Text>
          <View style={styles.durationGrid}>
            {durations.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.durationButton,
                  {
                    backgroundColor:
                      duration === d ? colors.primary : colors.background,
                    borderColor: duration === d ? colors.primary : colors.textSecondary + '30',
                  },
                ]}
                onPress={() => setDuration(d)}
              >
                <Text
                  style={[
                    styles.durationButtonText,
                    {
                      color: duration === d ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {d} мин
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: colors.surface }]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>
            Приоритет
          </Text>
          <View style={styles.priorityGrid}>
            {(['low', 'medium', 'high'] as const).map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.priorityButton,
                  {
                    backgroundColor:
                      priority === p ? getPriorityColor(p) : colors.background,
                    borderColor:
                      priority === p ? getPriorityColor(p) : colors.textSecondary + '30',
                  },
                ]}
                onPress={() => setPriority(p)}
              >
                <Text
                  style={[
                    styles.priorityButtonText,
                    {
                      color: priority === p ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {p === 'low' ? 'Низкий' : p === 'medium' ? 'Средний' : 'Высокий'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.slotsHeader}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>
              Рекомендуемое время
            </Text>
            {isAnalyzing && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>

          {suggestedSlots.length > 0 ? (
            <View style={styles.slotsContainer}>
              {suggestedSlots.map((slot, index) => (
                <TimeSlotCard
                  key={index}
                  slot={slot}
                  isSelected={
                    selectedSlot?.startTime.getTime() === slot.startTime.getTime()
                  }
                  onPress={() => setSelectedSlot(slot)}
                  rank={index + 1}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
              <Text style={[styles.emptyStateText, { color: colors.textSecondary }]}>
                {isAnalyzing
                  ? 'Анализируем лучшее время...'
                  : 'Введите название и длительность задачи для подбора времени'}
              </Text>
            </View>
          )}
        </View>

        {selectedSlot && (
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>
              💡 Почему это время?
            </Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {selectedSlot.reason}
            </Text>
            <View style={styles.energyIndicator}>
              <Text style={[styles.energyLabel, { color: colors.textSecondary }]}>
                Прогноз энергии:
              </Text>
              <View style={styles.energyBar}>
                <View
                  style={[
                    styles.energyFill,
                    {
                      width: `${selectedSlot.energyScore}%`,
                      backgroundColor: getEnergyColor(selectedSlot.energyScore),
                    },
                  ]}
                />
              </View>
              <Text style={[styles.energyValue, { color: colors.text }]}>
                {Math.round(selectedSlot.energyScore)}%
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const getEnergyColor = (score: number): string => {
  if (score >= 70) return '#10B981';
  if (score >= 40) return '#F59E0B';
  return '#EF4444';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingTop: Platform.OS === 'ios' ? 56 : 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  headerButton: {
    minWidth: 60,
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  durationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  durationButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  durationButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  priorityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  priorityButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  slotsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  slotsContainer: {
    gap: 12,
  },
  emptyState: {
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  energyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  energyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  energyBar: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  energyFill: {
    height: '100%',
    borderRadius: 3,
  },
  energyValue: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 36,
    textAlign: 'right',
  },
});

export default AddTaskScreen;