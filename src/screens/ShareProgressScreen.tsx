import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Clipboard,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { useStatistics } from '../hooks/useStatistics';
import { ShareService, SharedLink } from '../services/ShareService';
import { HeatmapCalendar } from '../components/HeatmapCalendar';
import { MiniChart } from '../components/MiniChart';
import { colors as themeColors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { formatDate } from '../utils/dateUtils';
import * as haptics from '../utils/haptics';

const ShareProgressScreen: React.FC = () => {
  const navigation = useNavigation();
  const { theme, isDark } = useTheme();
  const { heatmapData, stressChartData, sessionChartData, sleepChartData } = useStatistics('month');

  const [activeLinks, setActiveLinks] = useState<SharedLink[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<'friend' | 'therapist'>('friend');

  const palette = isDark ? themeColors.dark : themeColors.light;

  useEffect(() => {
    loadActiveLinks();
  }, []);

  const loadActiveLinks = async () => {
    try {
      setIsLoading(true);
      const links = await ShareService.getActiveLinks();
      setActiveLinks(links);
    } catch (error) {
      console.error('Failed to load active links:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateLink = useCallback(async () => {
    try {
      setIsGenerating(true);
      haptics.light();

      const link = await ShareService.generateShareLink({
        type: selectedLinkType,
        includeHeatmap: true,
        includeStressChart: true,
        includeSessionChart: true,
        includeSleepChart: selectedLinkType === 'therapist',
        expiresInDays: selectedLinkType === 'therapist' ? 30 : 7,
      });

      setActiveLinks((prev) => [link, ...prev]);
      haptics.success();

      Clipboard.setString(link.url);
      Alert.alert(
        'Ссылка создана!',
        'Ссылка скопирована в буфер обмена. Отправьте её ' +
          (selectedLinkType === 'friend' ? 'другу' : 'терапевту') +
          '.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to generate link:', error);
      Alert.alert('Ошибка', 'Не удалось создать ссылку. Попробуйте ещё раз.');
    } finally {
      setIsGenerating(false);
    }
  }, [selectedLinkType]);

  const handleCopyLink = useCallback((url: string) => {
    Clipboard.setString(url);
    haptics.light();
    Alert.alert('Скопировано', 'Ссылка скопирована в буфер обмена.');
  }, []);

  const handleRevokeLink = useCallback((linkId: string) => {
    Alert.alert(
      'Отозвать ссылку?',
      'Получатель больше не сможет просматривать ваш прогресс по этой ссылке.',
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'Отозвать',
          style: 'destructive',
          onPress: async () => {
            try {
              await ShareService.revokeLink(linkId);
              setActiveLinks((prev) => prev.filter((l) => l.id !== linkId));
              haptics.light();
            } catch (error) {
              console.error('Failed to revoke link:', error);
              Alert.alert('Ошибка', 'Не удалось отозвать ссылку.');
            }
          },
        },
      ]
    );
  }, []);

  const renderLinkTypeSelector = () => (
    <View style={styles.linkTypeContainer}>
      <TouchableOpacity
        style={[
          styles.linkTypeButton,
          {
            backgroundColor:
              selectedLinkType === 'friend' ? palette.primary : palette.cardBackground,
            borderColor: palette.primary,
          },
        ]}
        onPress={() => {
          setSelectedLinkType('friend');
          haptics.light();
        }}
        activeOpacity={0.7}
      >
        <Icon
          name="people-outline"
          size={22}
          color={selectedLinkType === 'friend' ? '#FFFFFF' : palette.textSecondary}
        />
        <Text
          style={[
            styles.linkTypeText,
            {
              color: selectedLinkType === 'friend' ? '#FFFFFF' : palette.textSecondary,
            },
          ]}
        >
          Для друга
        </Text>
        <Text
          style={[
            styles.linkTypeDuration,
            {
              color: selectedLinkType === 'friend' ? 'rgba(255,255,255,0.7)' : palette.textTertiary,
            },
          ]}
        >
          7 дней
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.linkTypeButton,
          {
            backgroundColor:
              selectedLinkType === 'therapist' ? palette.primary : palette.cardBackground,
            borderColor: palette.primary,
          },
        ]}
        onPress={() => {
          setSelectedLinkType('therapist');
          haptics.light();
        }}
        activeOpacity={0.7}
      >
        <Icon
          name="medical-outline"
          size={22}
          color={selectedLinkType === 'therapist' ? '#FFFFFF' : palette.textSecondary}
        />
        <Text
          style={[
            styles.linkTypeText,
            {
              color: selectedLinkType === 'therapist' ? '#FFFFFF' : palette.textSecondary,
            },
          ]}
        >
          Для терапевта
        </Text>
        <Text
          style={[
            styles.linkTypeDuration,
            {
              color:
                selectedLinkType === 'therapist' ? 'rgba(255,255,255,0.7)' : palette.textTertiary,
            },
          ]}
        >
          30 дней
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderPreview = () => (
    <View
      style={[
        styles.previewContainer,
        { backgroundColor: palette.cardBackground, borderColor: palette.border },
      ]}
    >
      <View style={styles.previewHeader}>
        <Icon name="eye-outline" size={20} color={palette.textSecondary} />
        <Text style={[styles.previewTitle, { color: palette.text }]}>
          Превью для получателя
        </Text>
      </View>

      <View style={styles.previewContent}>
        <Text style={[styles.previewLabel, { color: palette.textSecondary }]}>
          Тепловая карта активности
        </Text>
        <View style={styles.previewChartContainer}>
          <HeatmapCalendar data={heatmapData} compact />
        </View>

        <Text style={[styles.previewLabel, { color: palette.textSecondary }]}>
          Средний уровень стресса
        </Text>
        <View style={styles.previewChartContainer}>
          <MiniChart
            data={stressChartData}
            type="line"
            height={100}
            color={palette.primary}
          />
        </View>

        <Text style={[styles.previewLabel, { color: palette.textSecondary }]}>
          Количество сессий
        </Text>
        <View style={styles.previewChartContainer}>
          <MiniChart
            data={sessionChartData}
            type="bar"
            height={100}
            color={palette.accent}
          />
        </View>

        {selectedLinkType === 'therapist' && (
          <>
            <Text style={[styles.previewLabel, { color: palette.textSecondary }]}>
              Качество сна
            </Text>
            <View style={styles.previewChartContainer}>
              <MiniChart
                data={sleepChartData}
                type="line"
                height={100}
                color={palette.secondary}
              />
            </View>
          </>
        )}
      </View>

      <View
        style={[styles.privacyNote, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}
      >
        <Icon name="shield-checkmark-outline" size={16} color={palette.success} />
        <Text style={[styles.privacyNoteText, { color: palette.textSecondary }]}>
          Получатель увидит только графики и тепловую карту. Личные данные, эмоции и детали
          упражнений не передаются.
        </Text>
      </View>
    </View>
  );

  const renderActiveLink = ({ item }: { item: SharedLink }) => {
    const isExpired = new Date(item.expiresAt) < new Date();
    const daysLeft = Math.max(
      0,
      Math.ceil(
        (new Date(item.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    );

    return (
      <View
        style={[
          styles.linkCard,
          {
            backgroundColor: palette.cardBackground,
            borderColor: isExpired ? palette.error : palette.border,
            opacity: isExpired ? 0.6 : 1,
          },
        ]}
      >
        <View style={styles.linkCardHeader}>
          <View style={styles.linkCardTypeRow}>
            <Icon
              name={item.type === 'therapist' ? 'medical-outline' : 'people-outline'}
              size={18}
              color={palette.primary}
            />
            <Text style={[styles.linkCardType, { color: palette.text }]}>
              {item.type === 'therapist' ? 'Терапевт' : 'Друг'}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: isExpired
                  ? palette.error + '20'
                  : palette.success + '20',
              },
            ]}
          >
            <Text
              style={[
                styles.statusText,
                { color: isExpired ? palette.error : palette.success },
              ]}
            >
              {isExpired ? 'Истекла' : `${daysLeft} дн.`}
            </Text>
          </View>
        </View>

        <Text
          style={[styles.linkUrl, { color: palette.textSecondary }]}
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {item.url}
        </Text>

        <Text style={[styles.linkDate, { color: palette.textTertiary }]}>
          Создана: {formatDate(new Date(item.createdAt), 'dd MMM yyyy')}
        </Text>

        <View style={styles.linkActions}>
          {!isExpired && (
            <TouchableOpacity
              style={[styles.linkActionButton, { backgroundColor: palette.primary + '15' }]}
              onPress={() => handleCopyLink(item.url)}
              activeOpacity={0.7}
            >
              <Icon name="copy-outline" size={16} color={palette.primary} />
              <Text style={[styles.linkActionText, { color: palette.primary }]}>
                Копировать
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.linkActionButton, { backgroundColor: palette.error + '15' }]}
            onPress={() => handleRevokeLink(item.id)}
            activeOpacity={0.7}
          >
            <Icon name="trash-outline" size={16} color={palette.error} />
            <Text style={[styles.linkActionText, { color: palette.error }]}>
              {isExpired ? 'Удалить' : 'Отозвать'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Text style={[styles.title, { color: palette.text }]}>Поделиться прогрессом</Text>
          <Text style={[styles.subtitle, { color: palette.textSecondary }]}>
            Создайте безопасную ссылку для друга или терапевта. Получатель увидит только обобщённую
            статистику.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>Тип ссылки</Text>
          {renderLinkTypeSelector()}
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            style={styles.previewToggle}
            onPress={() => {
              setShowPreview(!showPreview);
              haptics.light();
            }}
            activeOpacity={0.7}
          >
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Что увидит получатель
            </Text>
            <Icon
              name={showPreview ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={palette.textSecondary}
            />
          </TouchableOpacity>
          {showPreview && renderPreview()}
        </View>

        <TouchableOpacity
          style={[
            styles.generateButton,
            {
              backgroundColor: palette.primary,
              opacity: isGenerating ? 0.7 : 1,
            },
          ]}
          onPress={handleGenerateLink}
          disabled={isGenerating}
          activeOpacity={0.8}
        >
          {isGenerating ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Icon name="link-outline" size={22} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>Создать ссылку</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            Активные ссылки{' '}