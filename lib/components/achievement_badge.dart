import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/achievement.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

class AchievementBadge extends StatelessWidget {
  final Achievement achievement;
  final VoidCallback? onTap;
  final bool animateUnlock;
  final double size;

  const AchievementBadge({
    super.key,
    required this.achievement,
    this.onTap,
    this.animateUnlock = false,
    this.size = 100,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isUnlocked = achievement.unlocked;
    final progress = achievement.target > 0
        ? (achievement.currentProgress / achievement.target).clamp(0.0, 1.0)
        : 0.0;

    Widget badge = GestureDetector(
      onTap: onTap,
      child: SizedBox(
        width: size,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _BadgeIcon(
              emoji: achievement.icon,
              isUnlocked: isUnlocked,
              progress: progress,
              size: size * 0.7,
            ),
            const SizedBox(height: AppSpacing.xs),
            Text(
              achievement.name,
              style: theme.textTheme.bodySmall?.copyWith(
                fontWeight: isUnlocked ? FontWeight.w600 : FontWeight.w400,
                color: isUnlocked
                    ? theme.colorScheme.onSurface
                    : theme.colorScheme.onSurface.withOpacity(0.45),
              ),
              textAlign: TextAlign.center,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            if (!isUnlocked && achievement.target > 0) ...[
              const SizedBox(height: AppSpacing.xxs),
              _ProgressIndicator(
                progress: progress,
                width: size * 0.7,
              ),
            ],
          ],
        ),
      ),
    );

    if (animateUnlock && isUnlocked) {
      badge = badge
          .animate()
          .scale(
            begin: const Offset(0.0, 0.0),
            end: const Offset(1.0, 1.0),
            duration: 600.ms,
            curve: Curves.elasticOut,
          )
          .fadeIn(duration: 300.ms)
          .then()
          .shimmer(
            duration: 800.ms,
            color: AppColors.accentGold.withOpacity(0.4),
          );
    }

    return badge;
  }
}

class _BadgeIcon extends StatelessWidget {
  final String emoji;
  final bool isUnlocked;
  final double progress;
  final double size;

  const _BadgeIcon({
    required this.emoji,
    required this.isUnlocked,
    required this.progress,
    required this.size,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          if (!isUnlocked && progress > 0)
            SizedBox(
              width: size,
              height: size,
              child: CircularProgressIndicator(
                value: progress,
                strokeWidth: 3,
                backgroundColor:
                    theme.colorScheme.onSurface.withOpacity(0.08),
                valueColor: AlwaysStoppedAnimation<Color>(
                  AppColors.gentleGreen.withOpacity(0.6),
                ),
              ),
            ),
          Container(
            width: size * 0.82,
            height: size * 0.82,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isUnlocked
                  ? _unlockedBackgroundColor(theme)
                  : theme.colorScheme.surfaceContainerHighest
                      .withOpacity(0.5),
              border: Border.all(
                color: isUnlocked
                    ? AppColors.accentGold.withOpacity(0.5)
                    : theme.colorScheme.outline.withOpacity(0.15),
                width: isUnlocked ? 2.5 : 1.5,
              ),
              boxShadow: isUnlocked
                  ? [
                      BoxShadow(
                        color: AppColors.accentGold.withOpacity(0.2),
                        blurRadius: 12,
                        spreadRadius: 1,
                      ),
                    ]
                  : null,
            ),
            child: Center(
              child: isUnlocked
                  ? Text(
                      emoji,
                      style: TextStyle(fontSize: size * 0.38),
                    )
                  : ColorFiltered(
                      colorFilter: const ColorFilter.matrix(<double>[
                        0.2126, 0.7152, 0.0722, 0, 0,
                        0.2126, 0.7152, 0.0722, 0, 0,
                        0.2126, 0.7152, 0.0722, 0, 0,
                        0, 0, 0, 0.4, 0,
                      ]),
                      child: Text(
                        emoji,
                        style: TextStyle(fontSize: size * 0.38),
                      ),
                    ),
            ),
          ),
          if (isUnlocked)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: size * 0.28,
                height: size * 0.28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: AppColors.gentleGreen,
                  border: Border.all(
                    color: theme.colorScheme.surface,
                    width: 2,
                  ),
                ),
                child: Icon(
                  Icons.check,
                  size: size * 0.15,
                  color: Colors.white,
                ),
              ),
            ),
          if (!isUnlocked && progress == 0)
            Positioned(
              bottom: 0,
              right: 0,
              child: Container(
                width: size * 0.28,
                height: size * 0.28,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: theme.colorScheme.surfaceContainerHighest,
                  border: Border.all(
                    color: theme.colorScheme.surface,
                    width: 2,
                  ),
                ),
                child: Icon(
                  Icons.lock_outline,
                  size: size * 0.14,
                  color: theme.colorScheme.onSurface.withOpacity(0.4),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color _unlockedBackgroundColor(ThemeData theme) {
    return theme.brightness == Brightness.light
        ? AppColors.accentGold.withOpacity(0.08)
        : AppColors.accentGold.withOpacity(0.12);
  }
}

class _ProgressIndicator extends StatelessWidget {
  final double progress;
  final double width;

  const _ProgressIndicator({
    required this.progress,
    required this.width,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SizedBox(
      width: width,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(2),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 3,
              backgroundColor:
                  theme.colorScheme.onSurface.withOpacity(0.08),
              valueColor: AlwaysStoppedAnimation<Color>(
                AppColors.gentleGreen.withOpacity(0.7),
              ),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            '${(progress * 100).toInt()}%',
            style: theme.textTheme.labelSmall?.copyWith(
              fontSize: 9,
              color: theme.colorScheme.onSurface.withOpacity(0.4),
            ),
          ),
        ],
      ),
    );
  }
}

class AchievementBadgeGrid extends StatelessWidget {
  final List<Achievement> achievements;
  final void Function(Achievement)? onAchievementTap;
  final double badgeSize;
  final int crossAxisCount;

  const AchievementBadgeGrid({
    super.key,
    required this.achievements,
    this.onAchievementTap,
    this.badgeSize = 100,
    this.crossAxisCount = 3,
  });

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      padding: const EdgeInsets.all(AppSpacing.md),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: crossAxisCount,
        mainAxisSpacing: AppSpacing.md,
        crossAxisSpacing: AppSpacing.sm,
        childAspectRatio: 0.75,
      ),
      itemCount: achievements.length,
      itemBuilder: (context, index) {
        final achievement = achievements[index];
        return AchievementBadge(
          achievement: achievement,
          size: badgeSize,
          onTap: onAchievementTap != null
              ? () => onAchievementTap!(achievement)
              : null,
        );
      },
    );
  }
}