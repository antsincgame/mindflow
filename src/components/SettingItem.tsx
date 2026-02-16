import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Dimensions,
} from 'react-native';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface SettingItemProps {
  title: string;
  description?: string;
  type: 'switch' | 'select' | 'input';
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
  options?: Array<{
    label: string;
    value: string | number;
  }>;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface SelectModalState {
  visible: boolean;
}

export const SettingItem: React.FC<SettingItemProps> = ({
  title,
  description,
  type,
  value,
  onChange,
  options = [],
  disabled = false,
  icon,
}) => {
  const [selectModalVisible, setSelectModalVisible] = React.useState(false);

  const handleSelectOption = (selectedValue: string | number) => {
    onChange(selectedValue);
    setSelectModalVisible(false);
  };

  const getSelectLabel = (): string => {
    const selected = options.find((opt) => opt.value === value);
    return selected ? selected.label : String(value);
  };

  const renderSwitchContent = () => (
    <Switch
      value={typeof value === 'boolean' ? value : false}
      onValueChange={onChange}
      disabled={disabled}
      trackColor={{ false: colors.gray300, true: colors.primary }}
      thumbColor={typeof value === 'boolean' && value ? colors.white : colors.gray400}
    />
  );

  const renderSelectContent = () => (
    <TouchableOpacity
      style={[styles.selectButton, disabled && styles.disabledButton]}
      onPress={() => !disabled && setSelectModalVisible(true)}
      disabled={disabled}
    >
      <Text style={styles.selectButtonText}>{getSelectLabel()}</Text>
      <Text style={styles.selectArrow}>›</Text>
    </TouchableOpacity>
  );

  const renderSelectModal = () => (
    <Modal
      visible={selectModalVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setSelectModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setSelectModalVisible(false)}>
              <Text style={styles.modalCloseButton}>✕</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.optionItem,
                  value === item.value && styles.optionItemSelected,
                ]}
                onPress={() => handleSelectOption(item.value)}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    value === item.value && styles.optionLabelSelected,
                  ]}
                >
                  {item.label}
                </Text>
                {value === item.value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            )}
            scrollEnabled
            nestedScrollEnabled
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <>
      <View style={[styles.container, disabled && styles.disabledContainer]}>
        <View style={styles.leftContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <View style={styles.textContent}>
            <Text style={styles.title}>{title}</Text>
            {description && <Text style={styles.description}>{description}</Text>}
          </View>
        </View>

        <View style={styles.rightContent}>
          {type === 'switch' && renderSwitchContent()}
          {type === 'select' && renderSelectContent()}
        </View>
      </View>

      {type === 'select' && renderSelectModal()}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  disabledContainer: {
    opacity: 0.5,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainer: {
    marginRight: spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.regular,
    color: colors.gray600,
  },
  rightContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.gray50,
    borderRadius: 8,
    minWidth: 100,
  },
  disabledButton: {
    opacity: 0.5,
  },
  selectButtonText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    color: colors.text,
    flex: 1,
  },
  selectArrow: {
    fontSize: typography.sizes.lg,
    color: colors.gray600,
    marginLeft: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: Dimensions.get('window').height * 0.7,
    paddingBottom: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalCloseButton: {
    fontSize: typography.sizes.xl,
    color: colors.gray600,
    padding: spacing.sm,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray50,
  },
  optionItemSelected: {
    backgroundColor: colors.primary + '10',
  },
  optionLabel: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.regular,
    color: colors.text,
    flex: 1,
  },
  optionLabelSelected: {
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  checkmark: {
    fontSize: typography.sizes.lg,
    color: colors.primary,
    fontWeight: typography.weights.bold,
    marginLeft: spacing.md,
  },
});