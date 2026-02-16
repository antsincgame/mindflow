import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../models/achievement.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';

class AchievementDetailDialog extends StatelessWidget {
  final Achievement achievement;

  const AchievementDetailDialog({
    super.key,
    required this.achievement,
  });

  static Future<void> show(BuildContext context, Achievement achievement) {
    return showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => AchievementDetailDialog(achievement: achievement),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isUnlocked = achievement.unlocked;
    final progress = achievement.target > 0
        ? (achievement.currentProgress / achievement.target).clamp(0.0, 1.0)
        : 0.0;

    return Container(
      margin: const EdgeInsets.only(top: 80),
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: const BorderRadius.vertical(
          top: Radius.circular(AppSpacing.radiusXL),
        ),
      ),
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.md,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildHandle(colorScheme),
              const SizedBox(height: AppSpacing.lg),
              _buildBadge(context, isUnlocked),
              const SizedBox(height: AppSpacing.lg),
              _buildTitle(theme, isUnlocked),
              const SizedBox(height: AppSpacing.sm),
              _buildDescription(theme),
              const SizedBox(height: AppSpacing.lg),
              _buildCondition(theme),
              const SizedBox(height: AppSpacing.lg),
              _buildProgressSection(context, progress, isUnlocked),
              if (isUnlocked && achievement.unlockedAt != null) ...[
                const SizedBox(height: AppSpacing.lg),
                _buildUnlockedDate(theme),
              ],
              const SizedBox(height: AppSpacing.lg),
              _buildTypeChip(context),
              const SizedBox(height: AppSpacing.xl),
              _buildCloseButton(context, colorScheme),
              const SizedBox(height: AppSpacing.md),
            ],
          ),
        ),
      ),
    ).animate().slideY(
          begin: 0.3,
          end: 0,
          duration: 350.ms,
          curve: Curves.easeOutCubic,
        );
  }

  Widget _buildHandle(ColorScheme colorScheme) {
    return Center(
      child: Container(
        width: 40,
        height: 4,
        decoration: BoxDecoration(
          color: colorScheme.onSurfaceVariant.withOpacity(0.3),
          borderRadius: BorderRadius.circular(2),
        ),
      ),
    );
  }

  Widget _buildBadge(BuildContext context, bool isUnlocked) {
    final badgeWidget = Container(
      width: 96,
      height: 96,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: isUnlocked
            ? AppColors.gentleGreen.withOpacity(0.15)
            : Theme.of(context)
                .colorScheme
                .onSurfaceVariant
                .withOpacity(0.08),
        border: Border.all(
          color: isUnlocked
              ? AppColors.gentleGreen.withOpacity(0.4)
              : Theme.of(context)
                  .colorScheme
                  .onSurfaceVariant
                  .withOpacity(0.15),
          width: 3,
        ),
      ),
      child: Center(
        child: Text(
          achievement.icon,
          style: TextStyle(
            fontSize: 44,
            color: isUnlocked ? null : Colors.grey,
          ),
        ),
      ),
    );

    if (isUnlocked) {
      return badgeWidget
          .animate(onPlay: (c) => c.repeat(reverse: true))
          .scale(
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.05, 1.05),
            duration: 2000.ms,
            curve: Curves.easeInOut,
          );
    }

    return ColorFiltered(
      colorFilter: const ColorFilter.mode(
        Colors.grey,
        BlendMode.saturation,
      ),
      child: badgeWidget,
    );
  }

  Widget _buildTitle(ThemeData theme, bool isUnlocked) {
    return Text(
      achievement.name,
      style: theme.textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.bold,
        color: isUnlocked
            ? theme.colorScheme.onSurface
            : theme.colorScheme.onSurfaceVariant,
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildDescription(ThemeData theme) {
    return Text(
      achievement.description,
      style: theme.textTheme.bodyLarge?.copyWith(
        color: theme.colorScheme.onSurfaceVariant,
        height: 1.5,
      ),
      textAlign: TextAlign.center,
    );
  }

  Widget _buildCondition(ThemeData theme) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.primaryContainer.withOpacity(0.3),
        borderRadius: BorderRadius.circular(AppSpacing.radiusM),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            size: 20,
            color: theme.colorScheme.primary,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              _getConditionText(),
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.primary,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildProgressSection(
    BuildContext context,
    double progress,
    bool isUnlocked,
  ) {
    final theme = Theme.of(context);
    final progressColor = isUnlocked
        ? AppColors.gentleGreen
        : theme.colorScheme.primary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Прогресс',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            Text(
              '${achievement.currentProgress} / ${achievement.target}',
              style: theme.textTheme.titleSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: progressColor,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusS),
          child: LinearProgressIndicator(
            value: progress,
            minHeight: 12,
            backgroundColor:
                theme.colorScheme.onSurfaceVariant.withOpacity(0.1),
            valueColor: AlwaysStoppedAnimation<Color>(progressColor),
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          isUnlocked
              ? 'Выполнено! 🎉'
              : 'Осталось: ${achievement.target - achievement.currentProgress}',
          style: theme.textTheme.bodySmall?.copyWith(
            color: isUnlocked
                ? AppColors.gentleGreen
                : theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildUnlockedDate(ThemeData theme) {
    final dateFormatted =
        DateFormat('d MMMM yyyy, HH:mm', 'ru').format(achievement.unlockedAt!);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.gentleGreen.withOpacity(0.08),
        borderRadius: BorderRadius.circular(AppSpacing.radiusM),
        border: Border.all(
          color: AppColors.gentleGreen.withOpacity(0.2),
        ),
      ),
      child: Row(
        children: [
          const Icon(
            Icons.emoji_events_rounded,
            size: 20,
            color: AppColors.gentleGreen,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'Получено: $dateFormatted',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: AppColors.gentleGreen,
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTypeChip(BuildContext context) {
    final theme = Theme.of(context);
    final typeLabel = _getTypeLabel();
    final typeIcon = _getTypeIcon();

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.xs,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.secondaryContainer.withOpacity(0.5),
        borderRadius: BorderRadius.circular(AppSpacing.radiusL),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            typeIcon,
            size: 16,
            color: theme.colorScheme.secondary,
          ),
          const SizedBox(width: AppSpacing.xs),
          Text(
            typeLabel,
            style: theme.textTheme.labelMedium?.copyWith(
              color: theme.colorScheme.secondary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCloseButton(BuildContext context, ColorScheme colorScheme) {
    return SizedBox(
      width: double.infinity,
      height: 52,
      child: FilledButton(
        onPressed: () => Navigator.of(context).pop(),
        style: FilledButton.styleFrom(
          backgroundColor: colorScheme.primary,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusM),
          ),
        ),
        child: const Text(
          'Закрыть',
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
    );
  }

  String _getConditionText() {
    switch (achievement.type) {
      case AchievementType.milestone:
        return 'Выполните ${achievement.target} сессий упражнений';
      case AchievementType.streak:
        return 'Занимайтесь ${achievement.target} дней подряд без пропусков';
      case AchievementType.mastery:
        return 'Завершите ${achievement.target} сессий одного типа упражнений';
      case AchievementType.level:
        return 'Достигните уровня ${achievement.target}';
    }
  }

  String _getTypeLabel() {
    switch (achievement.type) {
      case AchievementType.milestone:
        return 'Веха';
      case AchievementType.streak:
        return 'Серия';
      case AchievementType.mastery:
        return 'Мастерство';
      case AchievementType.level:
        return 'Уровень';
    }
  }

  IconData _getTypeIcon() {
    switch (achievement.type) {
      case AchievementType.milestone:
        return Icons.flag_rounded;
      case AchievementType.streak:
        return Icons.local_fire_department_rounded;
      case AchievementType.mastery:
        return Icons.star_rounded;
      case AchievementType.level:
        return Icons.trending_up_rounded;
    }
  }
}