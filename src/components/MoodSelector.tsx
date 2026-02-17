import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';
import { useTheme } from '../hooks/useTheme';

interface MoodSelectorProps {
  selectedEmoji: string;
  energy: number;
  onEmojiSelect: (emoji: string) => void;
  onEnergyChange: (energy: number) => void;
}

const MOOD_EMOJIS = [
  { emoji: '😄', label: 'Отлично', energy: 90 },
  { emoji: '😊', label: 'Хорошо', energy: 75 },
  { emoji: '😐', label: 'Нормально', energy: 50 },
  { emoji: '😔', label: 'Грустно', energy: 30 },
  { emoji: '😫', label: 'Устал', energy: 15 },
];

const MoodSelector: React.FC<MoodSelectorProps> = ({
  selectedEmoji,
  energy,
  onEmojiSelect,
  onEnergyChange,
}) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text }]}>Как вы себя чувствуете?</Text>
      <View style={styles.emojiRow}>
        {MOOD_EMOJIS.map((mood) => (
          <TouchableOpacity
            key={mood.emoji}
            style={[
              styles.emojiButton,
              selectedEmoji === mood.emoji && {
                backgroundColor: colors.primary + '20',
                borderColor: colors.primary,
              },
            ]}
            onPress={() => {
              onEmojiSelect(mood.emoji);
              onEnergyChange(mood.energy);
            }}
          >
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <Text style={[styles.label, { color: colors.textSecondary }]}>{mood.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.energySection}>
        <Text style={[styles.energyTitle, { color: colors.text }]}>Уровень энергии</Text>
        <Text style={[styles.energyValue, { color: colors.primary }]}>{Math.round(energy)}%</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={100}
          value={energy}
          onValueChange={onEnergyChange}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.textSecondary + '40'}
          thumbTintColor={colors.primary}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 32,
  },
  emojiButton: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
  },
  energySection: {
    marginTop: 16,
  },
  energyTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  energyValue: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  slider: {
    width: '100%',
    height: 40,
  },
});

export default MoodSelector;