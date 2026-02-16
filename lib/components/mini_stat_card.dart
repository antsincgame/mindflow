import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

enum TrendDirection {
  up,
  down,
  neutral,
}

class MiniStatCard extends StatelessWidget {
  final IconData icon;
  final String value;
  final String label;
  final TrendDirection trend;
  final Color? iconColor;
  final Color? backgroundColor;
  final Color? trendUpColor;
  final Color? trendDownColor;
  final bool invertTrendColors;
  final VoidCallback? onTap;
  final double? width;
  final double? height;

  const MiniStatCard({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
    this.trend = TrendDirection.neutral,
    this.iconColor,
    this.backgroundColor,
    this.trendUpColor,
    this.trendDownColor,
    this.invertTrendColors = false,
    this.onTap,
    this.width,
    this.height,
  });

  Color _getTrendColor(BuildContext context) {
    final defaultUpColor = invertTrendColors ? AppColors.stressHigh : AppColors.stressLow;
    final defaultDownColor = invertTrendColors ? AppColors.stressLow : AppColors.stressHigh;

    switch (trend) {
      case TrendDirection.up:
        return trendUpColor ?? defaultUpColor;
      case TrendDirection.down:
        return trendDownColor ?? defaultDownColor;
      case TrendDirection.neutral:
        return Theme.of(context).colorScheme.onSurfaceVariant.withOpacity(0.5);
    }
  }

  IconData _getTrendIcon() {
    switch (trend) {
      case TrendDirection.up:
        return Icons.arrow_upward_rounded;
      case TrendDirection.down:
        return Icons.arrow_downward_rounded;
      case TrendDirection.neutral:
        return Icons.horizontal_rule_rounded;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final cardBackgroundColor = backgroundColor ?? colorScheme.surfaceContainerLow;
    final effectiveIconColor = iconColor ?? AppColors.calmingBlue;
    final trendColor = _getTrendColor(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        width: width,
        height: height,
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.md,
        ),
        decoration: BoxDecoration(
          color: cardBackgroundColor,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: colorScheme.outlineVariant.withOpacity(0.3),
            width: 1,
          ),
          boxShadow: [
            BoxShadow(
              color: colorScheme.shadow.withOpacity(0.04),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.xs),
                  decoration: BoxDecoration(
                    color: effectiveIconColor.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                  ),
                  child: Icon(
                    icon,
                    size: 18,
                    color: effectiveIconColor,
                  ),
                ),
                if (trend != TrendDirection.neutral)
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.xs,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: trendColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusXs),
                    ),
                    child: Icon(
                      _getTrendIcon(),
                      size: 14,
                      color: trendColor,
                    ),
                  )
                else
                  const SizedBox(width: 14),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              value,
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.w700,
                color: colorScheme.onSurface,
                height: 1.1,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: AppSpacing.xxs),
            Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: colorScheme.onSurfaceVariant.withOpacity(0.7),
                fontWeight: FontWeight.w500,
                height: 1.2,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).scale(
          begin: const Offset(0.95, 0.95),
          end: const Offset(1, 1),
          duration: 400.ms,
          curve: Curves.easeOutCubic,
        );
  }
}

class MiniStatCardRow extends StatelessWidget {
  final List<MiniStatCard> cards;
  final double spacing;

  const MiniStatCardRow({
    super.key,
    required this.cards,
    this.spacing = AppSpacing.sm,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: cards.asMap().entries.map((entry) {
        final index = entry.key;
        final card = entry.value;
        return Expanded(
          child: Padding(
            padding: EdgeInsets.only(
              left: index == 0 ? 0 : spacing / 2,
              right: index == cards.length - 1 ? 0 : spacing / 2,
            ),
            child: card,
          ),
        );
      }).toList(),
    );
  }
}