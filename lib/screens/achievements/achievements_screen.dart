import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../models/achievement.dart';
import '../../providers/achievements_provider.dart';
import '../../components/achievement_badge.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';
import 'achievement_detail_dialog.dart';

class AchievementsScreen extends ConsumerWidget {
  const AchievementsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final achievementsAsync = ref.watch(achievementsProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.xl,
                  AppSpacing.lg,
                  AppSpacing.md,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Достижения',
                      style: AppTypography.headlineLarge(context),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    achievementsAsync.when(
                      data: (achievements) {
                        final unlocked = achievements
                            .where((a) => a.unlocked)
                            .length;
                        final total = achievements.length;
                        return Text(
                          'Получено $unlocked из $total',
                          style: AppTypography.bodyMedium(context).copyWith(
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        );
                      },
                      loading: () => const SizedBox.shrink(),
                      error: (_, __) => const SizedBox.shrink(),
                    ),
                  ],
                ),
              ),
            ),
            achievementsAsync.when(
              data: (achievements) {
                if (achievements.isEmpty) {
                  return SliverFillRemaining(
                    child: _EmptyState(isDark: isDark),
                  );
                }

                final userLevel = _calculateUserLevel(achievements);

                return SliverToBoxAdapter(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _LevelProgressCard(
                        level: userLevel,
                        achievements: achievements,
                        isDark: isDark,
                      ),
                      const SizedBox(height: AppSpacing.lg),
                      ..._buildAchievementSections(
                        context,
                        achievements,
                        isDark,
                      ),
                      const SizedBox(height: AppSpacing.xxl),
                    ],
                  ),
                );
              },
              loading: () => const SliverFillRemaining(
                child: Center(
                  child: CircularProgressIndicator(),
                ),
              ),
              error: (error, _) => SliverFillRemaining(
                child: _ErrorState(error: error.toString()),
              ),
            ),
          ],
        ),
      ),
    );
  }

  int _calculateUserLevel(List<Achievement> achievements) {
    final unlockedCount = achievements.where((a) => a.unlocked).length;
    if (unlockedCount >= 20) return 10;
    if (unlockedCount >= 18) return 9;
    if (unlockedCount >= 16) return 8;
    if (unlockedCount >= 14) return 7;
    if (unlockedCount >= 12) return 6;
    if (unlockedCount >= 10) return 5;
    if (unlockedCount >= 7) return 4;
    if (unlockedCount >= 5) return 3;
    if (unlockedCount >= 3) return 2;
    if (unlockedCount >= 1) return 1;
    return 0;
  }

  List<Widget> _buildAchievementSections(
    BuildContext context,
    List<Achievement> achievements,
    bool isDark,
  ) {
    final Map<AchievementType, String> sectionTitles = {
      AchievementType.milestone: 'Вехи',
      AchievementType.streak: 'Серии',
      AchievementType.mastery: 'Мастерство',
      AchievementType.level: 'Уровни',
    };

    final sections = <Widget>[];

    for (final type in AchievementType.values) {
      final sectionAchievements =
          achievements.where((a) => a.type == type).toList();

      if (sectionAchievements.isEmpty) continue;

      sectionAchievements.sort((a, b) {
        if (a.unlocked && !b.unlocked) return -1;
        if (!a.unlocked && b.unlocked) return 1;
        if (!a.unlocked && !b.unlocked) {
          final aProgress = a.target > 0 ? a.currentProgress / a.target : 0.0;
          final bProgress = b.target > 0 ? b.currentProgress / b.target : 0.0;
          return bProgress.compareTo(aProgress);
        }
        return 0;
      });

      sections.add(
        _AchievementSection(
          title: sectionTitles[type] ?? type.name,
          achievements: sectionAchievements,
          isDark: isDark,
        ),
      );
    }

    return sections;
  }
}

class _LevelProgressCard extends StatelessWidget {
  final int level;
  final List<Achievement> achievements;
  final bool isDark;

  const _LevelProgressCard({
    required this.level,
    required this.achievements,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final unlocked = achievements.where((a) => a.unlocked).length;
    final total = achievements.length;
    final progress = total > 0 ? unlocked / total : 0.0;

    final nextLevelThreshold = _getNextLevelThreshold(level);
    final levelProgress = nextLevelThreshold > 0
        ? (unlocked / nextLevelThreshold).clamp(0.0, 1.0)
        : 1.0;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: isDark
                ? [
                    AppColors.softPurple.withOpacity(0.3),
                    AppColors.calmingBlue.withOpacity(0.3),
                  ]
                : [
                    AppColors.softPurple.withOpacity(0.15),
                    AppColors.calmingBlue.withOpacity(0.15),
                  ],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
        ),
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Row(
              children: [
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: LinearGradient(
                      colors: [
                        AppColors.softPurple,
                        AppColors.calmingBlue,
                      ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.softPurple.withOpacity(0.3),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      '$level',
                      style: AppTypography.headlineMedium(context).copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Уровень $level',
                        style: AppTypography.titleMedium(context).copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.xxs),
                      Text(
                        _getLevelTitle(level),
                        style: AppTypography.bodySmall(context).copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.md),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'Прогресс до уровня ${level + 1}',
                      style: AppTypography.bodySmall(context).copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                    Text(
                      '$unlocked / $nextLevelThreshold',
                      style: AppTypography.bodySmall(context).copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.xs),
                ClipRRect(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                  child: LinearProgressIndicator(
                    value: levelProgress,
                    minHeight: 8,
                    backgroundColor:
                        theme.colorScheme.onSurface.withOpacity(0.1),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      AppColors.softPurple,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0);
  }

  int _getNextLevelThreshold(int currentLevel) {
    const thresholds = [1, 3, 5, 7, 10, 12, 14, 16, 18, 20, 25];
    if (currentLevel < thresholds.length) {
      return thresholds[currentLevel];
    }
    return thresholds.last;
  }

  String _getLevelTitle(int level) {
    const titles = [
      'Новичок',
      'Начинающий',
      'Практикующий',
      'Уверенный',
      'Опытный',
      'Продвинутый',
      'Эксперт',
      'Мастер',
      'Гуру',
      'Просветлённый',
      'Легенда',
    ];
    if (level < titles.length) return titles[level];
    return titles.last;
  }
}

class _AchievementSection extends StatelessWidget {
  final String title;
  final List<Achievement> achievements;
  final bool isDark;

  const _AchievementSection({
    required this.title,
    required this.achievements,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(
              bottom: AppSpacing.sm,
              top: AppSpacing.md,
            ),
            child: Text(
              title,
              style: AppTypography.titleMedium(context).copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: AppSpacing.sm,
              mainAxisSpacing: AppSpacing.sm,
              childAspectRatio: 0.75,
            ),
            itemCount: achievements.length,
            itemBuilder: (context, index) {
              final achievement = achievements[index];
              return _AchievementGridItem(
                achievement: achievement,
                isDark: isDark,
                index: index,
              );
            },
          ),
        ],
      ),
    );
  }
}

class _AchievementGridItem extends StatelessWidget {
  final Achievement achievement;
  final bool isDark;
  final int index;

  const _AchievementGridItem({
    required this.achievement,
    required this.isDark,
    required this.index,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final progress = achievement.target > 0
        ? (achievement.currentProgress / achievement.target).clamp(0.0, 1.0)
        : 0.0;
    final isInProgress = !achievement.unlocked && progress > 0;

    return GestureDetector(
      onTap: () => _showDetailDialog(context),
      child: Container(
        decoration: BoxDecoration(
          color: achievement.unlocked
              ? (isDark
                  ? AppColors.gentleGreen.withOpacity(0.15)
                  : AppColors.gentleGreen.withOpacity(0.08))
              : theme.colorScheme.surface,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          border: Border.all(
            color: achievement.unlocked
                ? AppColors.gentleGreen.withOpacity(0.3)
                : isInProgress
                    ? AppColors.calmingBlue.withOpacity(0.3)
                    : theme.colorScheme.onSurface.withOpacity(0.08),
            width: achievement.unlocked ? 2 : 1,
          ),
        ),
        padding: const EdgeInsets.all(AppSpacing.sm),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            AchievementBadge(
              achievement: achievement,
              size: 48,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              achievement.title,
              style: AppTypography.bodySmall(context).copyWith(
                fontWeight: FontWeight.w600,
                color: achievement.unlocked
                    ? theme.colorScheme.onSurface
                    : theme.colorScheme.onSurface.withOpacity(0.5),
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppSpacing.xxs),
            if (achievement.unlocked && achievement.unlockedAt