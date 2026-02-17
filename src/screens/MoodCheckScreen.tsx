import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useMoodTracking } from '../hooks/useMoodTracking';
import MoodSelector from '../components/MoodSelector';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import { typography } from '../theme/typography';

const MoodCheckScreen: React.FC = () => {
  const navigation = useNavigation();
  const { addMoodEntry } = useMoodTracking();
  
  const [selectedEmoji, setSelectedEmoji] = useState<string>('😐');
  const [energy, setEnergy] = useState<number>(50);
  const [note, setNote] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const scaleAnim = useState(new Animated.Value(1))[0];

  const handleSave = async () => {
    if (isSaving) return;

    setIsSaving(true);

    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      await addMoodEntry({
        energy,
        emoji: selectedEmoji,
        note: note.trim() || undefined,
        timestamp: Date.now(),
      });

      setTimeout(() => {
        navigation.goBack();
      }, 200);
    } catch (error) {
      console.error('Error saving mood:', error);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleEmojiSelect = (emoji: string) => {
    setSelectedEmoji(emoji);
  };

  const handleEnergyChange = (value: number) => {
    setEnergy(value);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.cancelButton}
          disabled={isSaving}
        >
          <Text style={styles.cancelText}>Отмена</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Как настроение?</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.selectorContainer}>
          <MoodSelector
            selectedEmoji={selectedEmoji}
            energy={energy}
            onEmojiSelect={handleEmojiSelect}
            onEnergyChange={handleEnergyChange}
          />
        </View>

        <View style={styles.noteContainer}>
          <Text style={styles.noteLabel}>Заметка (необязательно)</Text>
          <TextInput
            style={styles.noteInput}
            placeholder="Что повлияло на настроение?"
            placeholderTextColor={colors.light.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={4}
            maxLength={200}
            editable={!isSaving}
          />
          <Text style={styles.noteCounter}>{note.length}/200</Text>
        </View>
      </ScrollView>

      <Animated.View
        style={[
          styles.footer,
          {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.saveButton,
            isSaving && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.8}
        >
          <Text style={styles.saveButtonText}>
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.light.surface,
  },
  cancelButton: {
    padding: spacing.sm,
  },
  cancelText: {
    fontSize: typography.body,
    color: colors.light.primary,
    fontWeight: '500',
  },
  title: {
    fontSize: typography.h2,
    fontWeight: '700',
    color: colors.light.text,
  },
  placeholder: {
    width: 60,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
  },
  selectorContainer: {
    marginBottom: spacing.xl,
  },
  noteContainer: {
    marginTop: spacing.md,
  },
  noteLabel: {
    fontSize: typography.body,
    fontWeight: '600',
    color: colors.light.text,
    marginBottom: spacing.sm,
  },
  noteInput: {
    backgroundColor: colors.light.surface,
    borderRadius: 12,
    padding: spacing.md,
    fontSize: typography.body,
    color: colors.light.text,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  noteCounter: {
    fontSize: typography.caption,
    color: colors.light.textSecondary,
    textAlign: 'right',
    marginTop: spacing.xs,
  },
  footer: {
    padding: spacing.md,
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.light.surface,
  },
  saveButton: {
    backgroundColor: colors.light.primary,
    borderRadius: 12,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.light.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  saveButtonDisabled: {
    backgroundColor: colors.light.textSecondary,
    shadowOpacity: 0.1,
  },
  saveButtonText: {
    fontSize: typography.h3,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export default MoodCheckScreen;