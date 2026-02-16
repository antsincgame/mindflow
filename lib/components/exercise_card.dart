import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../models/exercise.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

class ExerciseCard extends StatelessWidget {
  final Exercise exercise;
  final VoidCallback? onStart;
  final VoidCallback? onTap;

  const ExerciseCard({
    super.key,
    required this.exercise,
    this.onStart,
    this.onTap,
  });

  IconData _iconForType(ExerciseType type) {
    switch (type) {
      case ExerciseType.breathing:
        return Icons.air_rounded;
      case ExerciseType.meditation:
        return Icons.self_improvement_rounded;
      case ExerciseType.mindfulness:
        return Icons.visibility_rounded;
    }
  }

  String _labelForType(ExerciseType type) {
    switch (type) {
      case ExerciseType.breathing:
        return 'Дыхание';
      case ExerciseType.meditation:
        return 'Медитация';
      case ExerciseType.mindfulness:
        return 'Внимательность';
    }
  }

  Color _colorForType(ExerciseType type) {
    switch (type) {
      case ExerciseType.breathing:
        return AppColors.calmingBlue;
      case ExerciseType.meditation:
        return AppColors.softPurple;
      case ExerciseType.mindfulness:
        return AppColors.gentleGreen;
    }
  }

  String _formatDuration(int seconds) {
    final minutes = seconds ~/ 60;
    final remainingSeconds = seconds % 60;
    if (remainingSeconds == 0) {
      return '$minutes мин';
    }
    return '$minutes мин $remainingSeconds сек';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;
    final typeColor = _colorForType(exercise.type);

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withOpacity(0.08) : Colors.white,
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
          boxShadow: isDark
              ? []
              : [
                  BoxShadow(
                    color: typeColor.withOpacity(0.1),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
          border: Border.all(
            color: typeColor.withOpacity(isDark ? 0.3 : 0.15),
            width: 1,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildIcon(typeColor, isDark),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: _buildContent(theme, typeColor, isDark),
              ),
            ],
          ),
        ),
      ),
    ).animate().fadeIn(duration: 400.ms).slideX(begin: 0.05, end: 0);
  }

  Widget _buildIcon(Color typeColor, bool isDark) {
    return Container(
      width: 56,
      height: 56,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            typeColor.withOpacity(isDark ? 0.3 : 0.15),
            typeColor.withOpacity(isDark ? 0.15 : 0.05),
          ],
        ),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Icon(
        _iconForType(exercise.type),
        color: typeColor,
        size: 28,
      ),
    );
  }

  Widget _buildContent(ThemeData theme, Color typeColor, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Expanded(
              child: Text(
                exercise.name,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.xs),
        Row(
          children: [
            _buildChip(
              label: _labelForType(exercise.type),
              color: typeColor,
              isDark: isDark,
            ),
            const SizedBox(width: AppSpacing.sm),
            Icon(
              Icons.timer_outlined,
              size: 14,
              color: theme.textTheme.bodySmall?.color?.withOpacity(0.6),
            ),
            const SizedBox(width: 4),
            Text(
              _formatDuration(exercise.durationSeconds),
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.textTheme.bodySmall?.color?.withOpacity(0.6),
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          exercise.description,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.textTheme.bodyMedium?.color?.withOpacity(0.7),
            height: 1.4,
          ),
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        const SizedBox(height: AppSpacing.md),
        _buildStartButton(typeColor, theme),
      ],
    );
  }

  Widget _buildChip({
    required String label,
    required Color color,
    required bool isDark,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: 3,
      ),
      decoration: BoxDecoration(
        color: color.withOpacity(isDark ? 0.2 : 0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  Widget _buildStartButton(Color typeColor, ThemeData theme) {
    return SizedBox(
      width: double.infinity,
      height: 44,
      child: ElevatedButton(
        onPressed: onStart,
        style: ElevatedButton.styleFrom(
          backgroundColor: typeColor,
          foregroundColor: Colors.white,
          elevation: 0,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.play_arrow_rounded, size: 20),
            SizedBox(width: AppSpacing.xs),
            Text(
              'Начать',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}