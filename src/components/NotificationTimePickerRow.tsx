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
import Icon from 'react-native-vector-icons/Ionicons';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

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
    switchTrack: isDarkTheme ? '#39393D' : '#E9E9EA',
    switchTrackActive: '#6C63FF',
  };

  const formatTime = useCallback((date: Date): string => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const paddedHours = hours.toString().padStart(2, '0');
    const paddedMinutes = minutes.toString().padStart(2, '0');
    return `${paddedHours}:${paddedMinutes}`;
  }, []);

  const handleTimePress = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
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

      if (Platform.OS === 'ios' && selectedDate) {
        onTimeChange(item.id, selectedDate);
      }
    },
    [item.id, onTimeChange]
  );

  const handleDismissPicker = useCallback(() => {
    setShowPicker(false);
  }, []);

  const handleToggle = useCallback(
    (value: boolean) => {
      ReactNativeHapticFeedback.trigger('impactLight', {
        enableVibrateFallback: true,
        ignoreAndroidSystemSettings: false,
      });
      onToggle(item.id, value);
    },
    [item.id, onToggle]
  );

  const handleDelete = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationWarning', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    onDelete(item.id);
  }, [item.id, onDelete]);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        <TouchableOpacity
          style={styles.timeContainer}
          onPress={handleTimePress}
          activeOpacity={0.7}
          accessibilityLabel={`Время уведомления ${formatTime(item.time)}, нажмите для изменения`}
          accessibilityRole="button"
        >
          <Icon
            name="time-outline"
            size={20}
            color={item.enabled ? colors.accent : colors.secondaryText}
            style={styles.clockIcon}
          />
          <Text
            style={[
              styles.timeText,
              {
                color: item.enabled ? colors.text : colors.secondaryText,
              },
            ]}
          >
            {formatTime(item.time)}
          </Text>
          {item.label ? (
            <Text style={[styles.labelText, { color: colors.secondaryText }]}>
              {item.label}
            </Text>
          ) : null}
        </TouchableOpacity>

        <View style={styles.actionsContainer}>
          <Switch
            value={item.enabled}
            onValueChange={handleToggle}
            trackColor={{
              false: colors.switchTrack,
              true: colors.switchTrackActive,
            }}
            thumbColor="#FFFFFF"
            ios_backgroundColor={colors.switchTrack}
            accessibilityLabel={`Уведомление ${item.enabled ? 'включено' : 'выключено'}`}
            accessibilityRole="switch"
          />

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.6}
            accessibilityLabel="Удалить время уведомления"
            accessibilityRole="button"
          >
            <Icon name="trash-outline" size={20} color={colors.destructive} />
          </TouchableOpacity>
        </View>
      </View>

      {showPicker && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={item.time}
            mode="time"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={handleTimeChange}
            locale="ru-RU"
            is24Hour={true}
            themeVariant={isDarkTheme ? 'dark' : 'light'}
          />
          {Platform.OS === 'ios' && (
            <TouchableOpacity
              style={[styles.doneButton, { backgroundColor: colors.accent }]}
              onPress={handleDismissPicker}
              activeOpacity={0.8}
            >
              <Text style={styles.doneButtonText}>Готово</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

interface AddNotificationTimeButtonProps {
  onAdd: () => void;
  isDarkTheme?: boolean;
}

export const AddNotificationTimeButton: React.FC<AddNotificationTimeButtonProps> = ({
  onAdd,
  isDarkTheme = false,
}) => {
  const colors = {
    surface: isDarkTheme ? '#2C2C2E' : '#F2F2F7',
    accent: '#6C63FF',
    border: isDarkTheme ? '#38383A' : '#E5E5EA',
  };

  const handlePress = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
    onAdd();
  }, [onAdd]);

  return (
    <TouchableOpacity
      style={[
        styles.addButton,
        {
          backgroundColor: colors.surface,
          borderColor: colors.accent,
        },
      ]}
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityLabel="Добавить время уведомления"
      accessibilityRole="button"
    >
      <Icon name="add-circle-outline" size={22} color={colors.accent} />
      <Text style={[styles.addButtonText, { color: colors.accent }]}>
        Добавить время
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  clockIcon: {
    marginRight: 10,
  },
  timeText: {
    fontSize: 28,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
    letterSpacing: 1,
  },
  labelText: {
    fontSize: 14,
    marginLeft: 12,
    fontWeight: '400',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  deleteButton: {
    padding: 4,
  },
  pickerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    alignItems: 'center',
  },
  doneButton: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'center',
  },
  doneButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    marginTop: 4,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
});

export default NotificationTimePickerRow;