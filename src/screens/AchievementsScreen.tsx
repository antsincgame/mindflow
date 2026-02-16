import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAchievements } from '../hooks/useAchievements';
import { useStatistics } from '../hooks/useStatistics';
import { Achievement } from '../models/Achievement';
import { colors } from '../theme/colors';
import { typography } from '../theme/typography';
import { spacing } from '../theme/spacing';
import { shadows } from '../theme/shadows';
import { AchievementBadge } from '../components/AchievementBadge';
import { StatCard } from '../components/StatCard';

const { width } = Dimensions.get('window');

export const AchievementsScreen: React.FC = () => {
  const { achievements, unlockAchievement } = useAchievements();
  const { statistics } = useStatistics();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filteredAchievements, setFilteredAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredAchievements(achievements);
    } else {
      setFilteredAchievements(
        achievements.filter(a => a.type === selectedCategory)
      );
    }
  }, [selectedCategory, achievements]);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const completionPercentage = Math.round((unlockedCount / totalCount) * 100);

  const categories = [
    { id: 'all', label: 'Все', count: totalCount },
    { id: 'focus', label: 'Фокус', count: achievements.filter(a => a.type === 'focus').length },
    { id: 'streak', label: 'Серии', count: achievements.filter(a => a.type === 'streak').length },
    { id: 'level', label: 'Уровни', count: achievements.filter(a => a.type === 'level').length },
  ];

  const renderCategoryButton = (category: typeof categories[0]) => (
    <TouchableOpacity
      key={category.id}
      onPress={() => setSelectedCategory(category.id)}
      style={[
        styles.categoryButton,
        selectedCategory === category.id && styles.categoryButtonActive,
      ]}
    >
      <Text
        style={[
          styles.categoryButtonText,
          selectedCategory === category.id && styles.categoryButtonTextActive,
        ]}
      >
        {category.label}
      </Text>
      <View
        style={[
          styles.categoryBadge,
          selectedCategory === category.id && styles.categoryBadgeActive,
        ]}
      >
        <Text
          style={[
            styles.categoryBadgeText,
            selectedCategory === category.id && styles.categoryBadgeTextActive,
          ]}
        >
          {category.count}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderAchievementItem: ListRenderItem<Achievement> = ({ item }) => (
    <AchievementBadge
      achievement={item}
      onPress={() => {
        if (!item.unlocked) {
          unlockAchievement(item.id);
        }
      }}
    />
  );

  const getLevelColor = (level: number): string[] => {
    if (level <= 5) return [colors.primary, colors.secondary];
    if (level <= 10) return ['#FF6B6B', '#FFE66D'];
    if (level <= 20) return ['#4ECDC4', '#95E1D3'];
    return ['#A8E6CF', '#FFD3B6'];
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header with Level */}
        <LinearGradient
          colors={getLevelColor(statistics?.level || 1)}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.levelCard}
        >
          <View style={styles.levelContent}>
            <Text style={styles.levelLabel}>Уровень</Text>
            <Text style={styles.levelNumber}>{statistics?.level || 1}</Text>
            <Text style={styles.levelTitle}>
              {getLevelTitle(statistics?.level || 1)}
            </Text>
          </View>
          <View style={styles.starsContainer}>
            <View style={styles.starBadge}>
              <Text style={styles.starIcon}>⭐</Text>
              <Text style={styles.starCount}>{statistics?.stars || 0}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Progress Overview */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Достижения</Text>
            <Text style={styles.progressStats}>
              {unlockedCount} из {totalCount}
            </Text>
          </View>

          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBackground}>
              <LinearGradient
                colors={[colors.primary, colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressBarFill,
                  { width: `${completionPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.progressPercentage}>{completionPercentage}%</Text>
          </View>

          <View style={styles.milestoneContainer}>
            {[25, 50, 75, 100].map(milestone => (
              <View
                key={milestone}
                style={[
                  styles.milestoneMarker,
                  completionPercentage >= milestone && styles.milestoneMarkerActive,
                ]}
              >
                <Text style={styles.milestoneText}>{milestone}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsGrid}>
          <StatCard
            title="Сессии"
            value={statistics?.totalSessions || 0}
            icon="🎯"
            color={colors.primary}
          />
          <StatCard
            title="Серия"
            value={statistics?.currentStreak || 0}
            icon="🔥"
            color={colors.secondary}
          />
          <StatCard
            title="Лучшая серия"
            value={statistics?.bestStreak || 0}
            icon="🏆"
            color="#FFD700"
          />
          <StatCard
            title="Часов"
            value={Math.round((statistics?.totalFocusTime || 0) / 60)}
            icon="⏱️"
            color="#4ECDC4"
          />
        </View>

        {/* Category Filter */}
        <View style={styles.categoriesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          >
            {categories.map(renderCategoryButton)}
          </ScrollView>
        </View>

        {/* Achievements Grid */}
        <View style={styles.achievementsContainer}>
          {filteredAchievements.length > 0 ? (
            <FlatList
              data={filteredAchievements}
              renderItem={renderAchievementItem}
              keyExtractor={item => item.id}
              numColumns={2}
              columnWrapperStyle={styles.achievementRow}
              scrollEnabled={false}
              contentContainerStyle={styles.achievementsList}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateIcon}>🎯</Text>
              <Text style={styles.emptyStateTitle}>Нет достижений</Text>
              <Text style={styles.emptyStateText}>
                В этой категории еще нет достижений
              </Text>
            </View>
          )}
        </View>

        {/* Next Milestone */}
        {completionPercentage < 100 && (
          <View style={styles.nextMilestoneCard}>
            <View style={styles.nextMilestoneContent}>
              <Text style={styles.nextMilestoneLabel}>Следующая цель</Text>
              <Text style={styles.nextMilestoneValue}>
                {Math.ceil((totalCount * (Math.ceil(completionPercentage / 25) * 25 + 25)) / 100)} достижений
              </Text>
              <Text style={styles.nextMilestoneProgress}>
                Осталось: {Math.ceil((totalCount * (Math.ceil(completionPercentage / 25) * 25 + 25)) / 100) - unlockedCount}
              </Text>
            </View>
            <View style={styles.nextMilestoneIcon}>
              <Text style={styles.nextMilestoneEmoji}>🎁</Text>
            </View>
          </View>
        )}

        {/* Rewards Info */}
        <View style={styles.rewardsSection}>
          <Text style={styles.rewardsSectionTitle}>О наградах</Text>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>⭐</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Звезды</Text>
              <Text style={styles.rewardDescription}>
                Получайте звезды за завершение сессий и достижения
              </Text>
            </View>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>🏅</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Медали</Text>
              <Text style={styles.rewardDescription}>
                Разблокируйте медали за специальные достижения
              </Text>
            </View>
          </View>
          <View style={styles.rewardItem}>
            <Text style={styles.rewardIcon}>📈</Text>
            <View style={styles.rewardInfo}>
              <Text style={styles.rewardTitle}>Уровни</Text>
              <Text style={styles.rewardDescription}>
                Повышайте уровень, накапливая звезды и опыт
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const getLevelTitle = (level: number): string => {
  if (level <= 5) return 'Новичок';
  if (level <= 10) return 'Практикант';
  if (level <= 15) return 'Мастер';
  if (level <= 20) return 'Эксперт';
  return 'Легенда';
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  levelCard: {
    margin: spacing.lg,
    borderRadius: 16,
    padding: spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...shadows.lg,
  },
  levelContent: {
    flex: 1,
  },
  levelLabel: {
    ...typography.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.xs,
  },
  levelNumber: {
    ...typography.h1,
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  levelTitle: {
    ...typography.body1,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  starsContainer: {
    marginLeft: spacing.lg,
  },
  starBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
    minWidth: 70,
  },
  starIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  starCount: {
    ...typography.h3,
    color: '#FFFFFF',
  },
  progressSection: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  progressTitle: {
    ...typography.h2,
    color: colors.text,
  },
  progressStats: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  progressBarContainer: {
    marginBottom: spacing.md,
  },
  progressBarBackground: {
    height: 12,
    backgroundColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressPercentage: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  milestoneContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  milestoneMarker: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  milestoneMarkerActive: {
    backgroundColor: colors.primary,
  },
  milestoneText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  categoriesContainer: {
    marginBottom: spacing.lg,
  },
  categoriesList: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categoryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryButtonText: {
    ...typography.body2,
    color: colors.textSecondary,
  },
  categoryButtonTextActive: {
    color: '#FFFFFF',
  },
  categoryBadge: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  categoryBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3