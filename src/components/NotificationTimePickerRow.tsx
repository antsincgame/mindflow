import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export interface NotificationTime {
  id: string;
  time: Date;
  enabled: boolean;
  label?: string;
}

interface NotificationTimePickerRowProps {
  item: NotificationTime;
  onTimeChange: (id: string, newTime: Date) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
  isDarkTheme?: boolean;
}

const NotificationTimePickerRow: React.FC<NotificationTimePickerRowProps> = ({
  item,
  onTimeChange,
  onToggle,
  onDelete,
  isDarkTheme = false,
}) => {
  const [showPicker, setShowPicker] = useState<boolean>(false);

  const colors = {
    background: isDarkTheme ? '#1C1C1E' : '#FFFFFF',
    surface: isDarkTheme ? '#2C2C2E' : '#F2F2F7',
    text: isDarkTheme ? '#FFFFFF' : '#1C1C1E',
    secondaryText: isDarkTheme ? '#8E8E93' : '#6C6C70',
    accent: '#6C63FF',
    destructive: '#FF3B30',
    border: isDarkTheme ? '#38383A' : '#E5E5EA',
  };

  const formatTime = useCallback((date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }, []);

  const handleTimePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowPicker(true);
  }, []);

  const handleTimeChange = useCallback(
    (event: DateTimePickerEvent, selectedDate?: Date) => {
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
      if (event.type === 'set' && selectedDate) {
        onTimeChange(item.id, selectedDate);
      }
    },
    [item.id, onTimeChange]
  );

  const handleToggle = useCallback(
    (value: boolean) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onToggle(item.id, value);
    },
    [item.id, onToggle]
  );

  const handleDelete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    onDelete(item.id);
  }, [item.id, onDelete]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <TouchableOpacity style={styles.timeContainer} onPress={handleTimePress}>
          <Ionicons name="time-outline" size={20} color={item.enabled ? colors.accent : colors.secondaryText} />
          <Text style={[styles.timeText, { color: item.enabled ? colors.text : colors.secondaryText }]}>
            {formatTime(item.time)}
          </Text>
        </TouchableOpacity>
        <View style={styles.actionsContainer}>
          <Switch value={item.enabled} onValueChange={handleToggle} />
          <TouchableOpacity onPress={handleDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>
      {showPicker && (
        <DateTimePicker
          value={item.time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleTimeChange}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 8,
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 20,
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});

export default NotificationTimePickerRow;