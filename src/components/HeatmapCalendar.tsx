import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LinearGradient } from 'expo-linear-gradient';

interface SessionData {
  date: string;
  count: number;
  duration: number;
}

interface HeatmapCalendarProps {
  sessions: SessionData[];
  onDayPress?: (date: Date) => void;
  selectedDate?: Date;
}

const { width } = Dimensions.get('window');
const CELL_SIZE = (width - 48) / 7;
const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export const HeatmapCalendar: React.FC<HeatmapCalendarProps> = ({
  sessions,
  onDayPress,
  selectedDate,
}) => {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());

  const sessionMap = useMemo(() => {
    const map = new Map<string, SessionData>();
    sessions.forEach((session) => {
      map.set(session.date, session);
    });
    return map;
  }, [sessions]);

  const maxSessions = useMemo(() => {
    return Math.max(...sessions.map((s) => s.count), 1);
  }, [sessions]);

  const calendarDays = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start, end });
    
    const firstDayOfWeek = getDay(start);
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    const emptyDays = Array(adjustedFirstDay).fill(null);
    
    return [...emptyDays, ...days];
  }, [currentMonth]);

  const getIntensityColor = (count: number): string[] => {
    if (count === 0) return ['#F5F5F5', '#F5F5F5'];
    
    const intensity = count / maxSessions;
    
    if (intensity <= 0.25) return ['#E3F2FD', '#BBDEFB'];
    if (intensity <= 0.5) return ['#90CAF9', '#64B5F6'];
    if (intensity <= 0.75) return ['#42A5F5', '#2196F3'];
    return ['#1976D2', '#0D47A1'];
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleDayPress = (day: Date | null) => {
    if (day && onDayPress) {
      onDayPress(day);
    }
  };

  const isToday = (day: Date | null): boolean => {
    if (!day) return false;
    const today = new Date();
    return format(day, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  const isSelected = (day: Date | null): boolean => {
    if (!day || !selectedDate) return false;
    return format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  };

  const renderDay = (day: Date | null, index: number) => {
    if (!day) {
      return (
        <View
          key={`empty-${index}`}
          style={[styles.dayCell, styles.emptyCell]}
        />
      );
    }

    const dateString = format(day, 'yyyy-MM-dd');
    const sessionData = sessionMap.get(dateString);
    const count = sessionData?.count || 0;
    const colors = getIntensityColor(count);
    const today = isToday(day);
    const selected = isSelected(day);

    return (
      <TouchableOpacity
        key={dateString}
        style={styles.dayCell}
        onPress={() => handleDayPress(day)}
        activeOpacity={0.7}
      >
        <LinearGradient
          colors={colors}
          style={[
            styles.dayContent,
            today && styles.todayBorder,
            selected && styles.selectedBorder,
          ]}
        >
          <Text
            style={[
              styles.dayText,
              count > 0 && styles.dayTextActive,
              today && styles.todayText,
            ]}
          >
            {format(day, 'd')}
          </Text>
          {count > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{count}</Text>
            </View>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={handlePreviousMonth}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>←</Text>
        </TouchableOpacity>
        
        <Text style={styles.monthTitle}>
          {format(currentMonth, 'LLLL yyyy', { locale: ru })}
        </Text>
        
        <TouchableOpacity
          style={styles.navButton}
          onPress={handleNextMonth}
          activeOpacity={0.7}
        >
          <Text style={styles.navButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekdaysContainer}>
        {WEEKDAYS.map((day) => (
          <View key={day} style={styles.weekdayCell}>
            <Text style={styles.weekdayText}>{day}</Text>
          </View>
        ))}
      </View>

      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => renderDay(day, index))}
      </View>

      <View style={styles.legend}>
        <Text style={styles.legendText}>Меньше</Text>
        <View style={styles.legendColors}>
          {[0, 0.25, 0.5, 0.75, 1].map((intensity, index) => {
            const colors = getIntensityColor(intensity * maxSessions);
            return (
              <LinearGradient
                key={index}
                colors={colors}
                style={styles.legendColor}
              />
            );
          })}
        </View>
        <Text style={styles.legendText}>Больше</Text>
      </View>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{sessions.length}</Text>
          <Text style={styles.statLabel}>Всего дней</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {sessions.reduce((sum, s) => sum + s.count, 0)}
          </Text>
          <Text style={styles.statLabel}>Упражнений</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {Math.round(sessions.reduce((sum, s) => sum + s.duration, 0) / 60)}
          </Text>
          <Text style={styles.statLabel}>Минут</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  navButtonText: {
    fontSize: 24,
    color: '#333333',
    fontWeight: '600',
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333333',
    textTransform: 'capitalize',
  },
  weekdaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    width: CELL_SIZE,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666666',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  dayCell: {
    width: CELL_SIZE,
    height: CELL_SIZE,
    padding: 2,
  },
  emptyCell: {
    backgroundColor: 'transparent',
  },
  dayContent: {
    flex: 1,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  todayBorder: {
    borderWidth: 2,
    borderColor: '#2196F3',
  },
  selectedBorder: {
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  dayTextActive: {
    color: '#FFFFFF',
  },
  todayText: {
    fontWeight: '700',
  },
  countBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#FF6B6B',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  countText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    paddingVertical: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
    marginHorizontal: 8,
  },
  legendColors: {
    flexDirection: 'row',
    gap: 4,
  },
  legendColor: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2196F3',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
});