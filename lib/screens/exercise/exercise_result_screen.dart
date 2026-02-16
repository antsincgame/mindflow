import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../models/session.dart';
import '../../models/exercise.dart';
import '../../models/daily_stats.dart';
import '../../providers/session_provider.dart';
import '../../providers/statistics_provider.dart';
import '../../providers/exercise_provider.dart';
import '../../providers/health_provider.dart';
import '../../components/mini_stat_card.dart';
import '../../components/stress_level_indicator.dart';
import '../../components/exercise_card.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';

class ExerciseResultScreen extends ConsumerStatefulWidget {
  final String sessionId;

  const ExerciseResultScreen({
    super.key,
    required this.sessionId,
  });

  @override
  ConsumerState<ExerciseResultScreen> createState() =>
      _ExerciseResultScreenState();
}

class _ExerciseResultScreenState extends ConsumerState<ExerciseResultScreen>
    with TickerProviderStateMixin {
  late AnimationController _celebrationController;

  @override
  void initState() {
    super.initState();
    _celebrationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..forward();
  }

  @override
  void dispose() {
    _celebrationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(sessionProvider);
    final weeklyStats = ref.watch(statisticsProvider);
    final exercisesCatalog = ref.watch(exerciseProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    final session = sessionState.completedSession;

    return Scaffold(
      body: SafeArea(
        child: CustomScrollView(
          physics: const BouncingScrollPhysics(),
          slivers: [
            SliverAppBar(
              floating: true,
              backgroundColor: Colors.transparent,
              elevation: 0,
              leading: const SizedBox.shrink(),
              actions: [
                IconButton(
                  onPressed: () => context.go('/'),
                  icon: Icon(
                    Icons.close,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.lg,
                ),
                child: Column(
                  children: [
                    _buildHeader(theme)
                        .animate()
                        .fadeIn(duration: 600.ms)
                        .slideY(begin: -0.2, end: 0),
                    const SizedBox(height: AppSpacing.xl),
                    if (session != null) ...[
                      _buildSessionSummary(session, theme)
                          .animate()
                          .fadeIn(delay: 200.ms, duration: 500.ms)
                          .slideY(begin: 0.1, end: 0),
                      const SizedBox(height: AppSpacing.lg),
                      _buildStressComparison(session, theme)
                          .animate()
                          .fadeIn(delay: 400.ms, duration: 500.ms)
                          .slideY(begin: 0.1, end: 0),
                      const SizedBox(height: AppSpacing.lg),
                      if (session.heartRateBefore != null &&
                          session.heartRateAfter != null)
                        _buildHeartRateComparison(session, theme)
                            .animate()
                            .fadeIn(delay: 500.ms, duration: 500.ms)
                            .slideY(begin: 0.1, end: 0),
                    ],
                    const SizedBox(height: AppSpacing.xl),
                    _buildWeeklyChartsSection(weeklyStats, theme)
                        .animate()
                        .fadeIn(delay: 600.ms, duration: 500.ms)
                        .slideY(begin: 0.1, end: 0),
                    const SizedBox(height: AppSpacing.xl),
                    _buildRecommendation(exercisesCatalog, session, theme)
                        .animate()
                        .fadeIn(delay: 800.ms, duration: 500.ms)
                        .slideY(begin: 0.1, end: 0),
                    const SizedBox(height: AppSpacing.lg),
                    _buildActionButtons(theme)
                        .animate()
                        .fadeIn(delay: 1000.ms, duration: 500.ms),
                    const SizedBox(height: AppSpacing.xxl),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Column(
      children: [
        Container(
          width: 80,
          height: 80,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            gradient: LinearGradient(
              colors: [
                AppColors.gentleGreen.withOpacity(0.8),
                AppColors.calmingBlue.withOpacity(0.6),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            boxShadow: [
              BoxShadow(
                color: AppColors.gentleGreen.withOpacity(0.3),
                blurRadius: 20,
                spreadRadius: 5,
              ),
            ],
          ),
          child: const Icon(
            Icons.check_rounded,
            color: Colors.white,
            size: 40,
          ),
        )
            .animate(controller: _celebrationController)
            .scale(begin: const Offset(0.0, 0.0), end: const Offset(1.0, 1.0), curve: Curves.elasticOut, duration: 800.ms)
            .shimmer(delay: 800.ms, duration: 600.ms),
        const SizedBox(height: AppSpacing.md),
        Text(
          'Отличная работа!',
          style: AppTypography.h1.copyWith(
            color: theme.colorScheme.onSurface,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          'Вы завершили упражнение',
          style: AppTypography.bodyLarge.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.6),
          ),
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  Widget _buildSessionSummary(Session session, ThemeData theme) {
    final duration = session.duration;
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    final durationText = minutes > 0
        ? '$minutes мин ${seconds > 0 ? '$seconds сек' : ''}'
        : '$seconds сек';

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Итоги сессии',
            style: AppTypography.h3.copyWith(
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          Row(
            children: [
              Expanded(
                child: _buildSummaryItem(
                  icon: Icons.timer_outlined,
                  label: 'Длительность',
                  value: durationText,
                  color: AppColors.calmingBlue,
                  theme: theme,
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: _buildSummaryItem(
                  icon: Icons.self_improvement_outlined,
                  label: 'Статус',
                  value: session.completed ? 'Завершено' : 'Прервано',
                  color: session.completed
                      ? AppColors.gentleGreen
                      : AppColors.stressMedium,
                  theme: theme,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem({
    required IconData icon,
    required String label,
    required String value,
    required Color color,
    required ThemeData theme,
  }) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: AppSpacing.sm),
          Text(
            value,
            style: AppTypography.h3.copyWith(
              color: theme.colorScheme.onSurface,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStressComparison(Session session, ThemeData theme) {
    final stressBefore = session.stressBefore;
    final stressAfter = session.stressAfter;
    final stressDiff = stressBefore - stressAfter;
    final improved = stressDiff > 0;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'Уровень стресса',
                style: AppTypography.h3.copyWith(
                  color: theme.colorScheme.onSurface,
                ),
              ),
              if (improved)
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.xxs,
                  ),
                  decoration: BoxDecoration(
                    color: AppColors.gentleGreen.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.arrow_downward_rounded,
                        color: AppColors.gentleGreen,
                        size: 14,
                      ),
                      const SizedBox(width: 2),
                      Text(
                        '-$stressDiff',
                        style: AppTypography.labelMedium.copyWith(
                          color: AppColors.gentleGreen,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              Expanded(
                child: _buildStressCard(
                  label: 'До',
                  value: stressBefore,
                  theme: theme,
                ),
              ),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                child: Icon(
                  Icons.arrow_forward_rounded,
                  color: theme.colorScheme.onSurface.withOpacity(0.3),
                ),
              ),
              Expanded(
                child: _buildStressCard(
                  label: 'После',
                  value: stressAfter,
                  theme: theme,
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          ClipRRect(
            borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            child: LinearProgressIndicator(
              value: stressAfter / 100,
              minHeight: 8,
              backgroundColor: theme.colorScheme.onSurface.withOpacity(0.08),
              valueColor: AlwaysStoppedAnimation<Color>(
                _getStressColor(stressAfter),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStressCard({
    required String label,
    required int value,
    required ThemeData theme,
  }) {
    final color = _getStressColor(value);
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: color.withOpacity(0.08),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: color.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Text(
            label,
            style: AppTypography.caption.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
          const SizedBox(height: AppSpacing.xs),
          Text(
            '$value',
            style: AppTypography.h1.copyWith(
              color: color,
              fontWeight: FontWeight.w800,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            _getStressLabel(value),
            style: AppTypography.caption.copyWith(
              color: color,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeartRateComparison(Session session, ThemeData theme) {
    final hrBefore = session.heartRateBefore!;
    final hrAfter = session.heartRateAfter!;
    final hrDiff = hrBefore - hrAfter;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        boxShadow: [
          BoxShadow(
            color: theme.shadowColor.withOpacity(0.05),
            blurRadius: 10,