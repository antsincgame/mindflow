import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface TimeSlot {
  startTime: Date;
  endTime: Date;
  energyLevel: number;
  confidence: number;
  reason: string;
}

interface TimeSlotCardProps {
  slot: TimeSlot;
  isSelected?: boolean;
  onSelect: (slot: TimeSlot) => void;
  index: number;
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  isSelected = false,
  onSelect,
  index,
}) => {
  const getEnergyColor = (energy: number): string => {
    if (energy >= 80) return '#10B981';
    if (energy >= 60) return '#14B8A6';
    if (energy >= 40) return '#F59E0B';
    return '#EF4444';
  };

  const getEnergyLabel = (energy: number): string => {
    if (energy >= 80) return 'Высокая энергия';
    if (energy >= 60) return 'Хорошая энергия';
    if (energy >= 40) return 'Средняя энергия';
    return 'Низкая энергия';
  };

  const getBadgeLabel = (index: number): string => {
    switch (index) {
      case 0:
        return 'Лучший';
      case 1:
        return 'Хороший';
      case 2:
        return 'Подходит';
      default:
        return '';
    }
  };

  const getBadgeColor = (index: number): string => {
    switch (index) {
      case 0:
        return '#6366F1';
      case 1:
        return '#14B8A6';
      case 2:
        return '#8B5CF6';
      default:
        return '#6B7280';
    }
  };

  const energyColor = getEnergyColor(slot.energyLevel);
  const energyLabel = getEnergyLabel(slot.energyLevel);
  const badgeLabel = getBadgeLabel(index);
  const badgeColor = getBadgeColor(index);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
      ]}
      onPress={() => onSelect(slot)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>
            {format(slot.startTime, 'HH:mm', { locale: ru })}
          </Text>
          <Text style={styles.timeSeparator}>—</Text>
          <Text style={styles.timeText}>
            {format(slot.endTime, 'HH:mm', { locale: ru })}
          </Text>
        </View>
        {index < 3 && (
          <View style={[styles.badge, { backgroundColor: badgeColor }]}>
            <Text style={styles.badgeText}>{badgeLabel}</Text>
          </View>
        )}
      </View>

      <View style={styles.energyContainer}>
        <View style={styles.energyBar}>
          <View
            style={[
              styles.energyFill,
              {
                width: `${slot.energyLevel}%`,
                backgroundColor: energyColor,
              },
            ]}
          />
        </View>
        <Text style={[styles.energyLabel, { color: energyColor }]}>
          {energyLabel}
        </Text>
      </View>

      <Text style={styles.reasonText}>{slot.reason}</Text>

      <View style={styles.footer}>
        <Text style={styles.confidenceText}>
          Уверенность: {Math.round(slot.confidence * 100)}%
        </Text>
        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedText}>✓ Выбрано</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedContainer: {
    borderColor: '#6366F1',
    backgroundColor: '#F0F9FF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: '400',
    color: '#6B7280',
    marginHorizontal: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  energyContainer: {
    marginBottom: 12,
  },
  energyBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  energyFill: {
    height: '100%',
    borderRadius: 4,
  },
  energyLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  reasonText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confidenceText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  selectedIndicator: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default TimeSlotCard;