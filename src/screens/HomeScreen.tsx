import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EnergyBar from '../components/EnergyBar';
import MoodEmoji from '../components/MoodEmoji';
import EnergyChart from '../components/EnergyChart';
import TaskCard from '../components/TaskCard';
import InsightCard from '../components/InsightCard';
import PulsingIcon from '../components/PulsingIcon';
import { useMoodTracking } from '../hooks/useMoodTracking';
import { useEnergyLevel } from '../hooks/useEnergyLevel';
import { useTasks } from '../hooks/useTasks';
import { useInsights } from '../hooks/useInsights';
import { useTheme } from '../hooks/useTheme';
import { Task } from '../models/Task';
import { Insight } from '../models/Insight';

type RootStackParamList = {
  Home: undefined;
  MoodCheck: undefined;
  TaskDetail: { taskId: number };
  AddTask: undefined;
  Schedule: undefined;
  Insights: undefined;
  Settings: undefined;
};

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

const { width } = Dimensions.get('window');

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  
  const { currentMood, moodHistory, addMoodRecord } = useMoodTracking();
  const { energyLevel, isLoading: energyLoading } = useEnergyLevel();
  const { tasks, todayTasks, upcomingTasks, refreshTasks } = useTasks();
  const { insights, topInsights } = useInsights();
  
  const [refreshing, setRefreshing] = useState(false);
  const [showQuickMood, setShowQuickMood] = useState(false);

  useEffect(() => {
    const checkMoodReminder = () => {
      const lastMood = moodHistory[0];
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000;
      
      if (!lastMood || now - lastMood.timestamp > twoHours) {
        setShowQuickMood(true);
      }
    };

    checkMoodReminder();
    const interval = setInterval(checkMoodReminder, 30 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [moodHistory]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refreshTasks()]);
    setRefreshing(false);
  }, [refreshTasks]);

  const handleMoodPress = () => {
    navigation.navigate('MoodCheck');
  };

  const handleTaskPress = (taskId: number) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const handleAddTask = () => {
    navigation.navigate('AddTask');
  };

  const handleViewSchedule = () => {
    navigation.navigate('Schedule');
  };

  const handleViewInsights = () => {
    navigation.navigate('Insights');
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <View style={styles.headerContent}>
        <View style={styles.headerLeft}>
          <Text style={[styles.greeting, { color: colors.text }]}>
            {getGreeting()}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>
            {formatDate(new Date())}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.surface }]}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderEnergySection = () => (
    <View style={styles.energySection}>
      <View style={styles.energyHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Текущая энергия
        </Text>
        {showQuickMood && (
          <TouchableOpacity
            style={[styles.quickMoodButton, { backgroundColor: colors.primary }]}
            onPress={handleMoodPress}
          >
            <PulsingIcon icon="⚡" size={16} color="#FFFFFF" />
            <Text style={styles.quickMoodText}>Отметить</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.energyContent}>
        <View style={styles.energyBarContainer}>
          <EnergyBar energy={energyLevel} height={200} />
        </View>
        
        <View style={styles.energyDetails}>
          <TouchableOpacity
            style={styles.moodContainer}
            onPress={handleMoodPress}
            activeOpacity={0.7}
          >
            <MoodEmoji emoji={currentMood?.emoji || '😐'} size={80} />
            <Text style={[styles.energyValue, { color: colors.text }]}>
              {energyLevel}%
            </Text>
            <Text style={[styles.energyLabel, { color: colors.textSecondary }]}>
              {getEnergyLabel(energyLevel)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderChartSection = () => (
    <View style={styles.chartSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Энергия за неделю
        </Text>
        <TouchableOpacity onPress={handleViewInsights}>
          <Text style={[styles.viewAllText, { color: colors.primary }]}>
            Подробнее →
          </Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chartContainer}>
        <EnergyChart data={moodHistory} width={width - 48} />
      </View>
    </View>
  );

  const renderInsightsSection = () => {
    if (topInsights.length === 0) return null;
    
    return (
      <View style={styles.insightsSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            💡 Умные подсказки
          </Text>
          <TouchableOpacity onPress={handleViewInsights}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>
              Все →
            </Text>
          </TouchableOpacity>
        </View>
        {topInsights.slice(0, 2).map((insight: Insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}
      </View>
    );
  };

  const renderTasksSection = () => (
    <View style={styles.tasksSection}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          📋 Задачи на сегодня
        </Text>
        <View style={styles.taskActions}>
          <TouchableOpacity
            style={[styles.iconButton, { backgroundColor: colors.surface }]}
            onPress={handleViewSchedule}
          >
            <Text style={styles.iconButtonText}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAddTask}
          >
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {todayTasks.length === 0 ? (
        <View style={[styles.emptyState, { backgroundColor: colors.surface }]}>
          <Text style={styles.emptyStateEmoji}>✨</Text>
          <Text style={[styles.emptyStateText, { color: colors.text }]}>
            Нет задач на сегодня
          </Text>
          <Text style={[styles.emptyStateSubtext, { color: colors.textSecondary }]}>
            Добавьте задачу, и мы подберём лучшее время
          </Text>
          <TouchableOpacity
            style={[styles.emptyStateButton, { backgroundColor: colors.primary }]}
            onPress={handleAddTask}
          >
            <Text style={styles.emptyStateButtonText}>Добавить задачу</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          {todayTasks.map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task.id)}
            />
          ))}
        </>
      )}
      
      {upcomingTasks.length > 0 && (
        <>
          <Text style={[styles.subsectionTitle, { color: colors.textSecondary }]}>
            Скоро
          </Text>
          {upcomingTasks.slice(0, 3).map((task: Task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPress={() => handleTaskPress(task.id)}
            />
          ))}
        </>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      {renderHeader()}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 }
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {renderEnergySection()}
        {renderChartSection()}
        {renderInsightsSection()}
        {renderTasksSection()}
      </ScrollView>
    </View>
  );
};

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
};

const formatDate = (date: Date): string => {
  const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
  const months = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  
  return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
};

const getEnergyLabel = (energy: number): string => {
  if (energy >= 80) return 'Отличная форма';
  if (energy >= 60) return 'Хорошая энергия';
  if (energy >= 40) return 'Средний уровень';
  if (energy >= 20) return 'Низкая энергия';
  return 'Нужен отдых';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  date: {
    fontSize: 16,
    fontWeight: '400',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIcon: {
    fontSize: 22,
  },
  energySection: {
    marginTop: 16,
    marginBottom: 24,
  },
  energyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  quickMoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  quickMoodText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  energyContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  energyBarContainer: {
    width: 60,
  },
  energyDetails: {
    flex: 1,
    alignItems: 'center',
  },
  moodContainer: {
    alignItems: 'center',
    gap: 8,
  },
  energyValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  energyLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  chartContainer: {
    alignItems: 'center',
  },
  insightsSection: {
    marginBottom: 24,
  },
  tasksSection: {
    marginBottom: 24,
  },
  taskActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconButtonText: {
    fontSize: 20,
  },
  addButton: {
    width: 40,
    height: 40,
    border