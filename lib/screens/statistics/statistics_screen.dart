import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../providers/statistics_provider.dart';
import '../../models/daily_stats.dart';
import '../../components/period_selector.dart';
import '../../components/mini_stat_card.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';
import 'heatmap_widget.dart';
import 'trend_chart_widget.dart';

enum StatsPeriod { week, month, allTime }

class StatisticsScreen extends ConsumerStatefulWidget {
  const StatisticsScreen({super.key});

  @override
  ConsumerState<StatisticsScreen> createState() => _StatisticsScreenState();
}

class _StatisticsScreenState extends ConsumerState<StatisticsScreen> {
  StatsPeriod _selectedPeriod = StatsPeriod.week;

  @override
  Widget build(BuildContext context) {
    final statisticsAsync = ref.watch(statisticsProvider);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: statisticsAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(),
          ),
          error: (error, stack) => Center(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.error_outline_rounded,
                    size: 48,
                    color: theme.colorScheme.error,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  Text(
                    'Не удалось загрузить статистику',
                    style: AppTypography.bodyLarge(context),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: AppSpacing.md),
                  FilledButton(
                    onPressed: () => ref.invalidate(statisticsProvider),
                    child: const Text('Повторить'),
                  ),
                ],
              ),
            ),
          ),
          data: (statsData) {
            final filteredStats = _filterByPeriod(statsData.dailyStats);
            final summaryStats = _computeSummary(filteredStats);
            final stressTrend = _computeStressTrend(summaryStats);
            final sleepTrend = _computeSleepTrend(summaryStats);
            final sessionsTrend = _computeSessionsTrend(summaryStats);

            return CustomScrollView(
              physics: const BouncingScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.fromLTRB(
                      AppSpacing.lg,
                      AppSpacing.lg,
                      AppSpacing.lg,
                      AppSpacing.sm,
                    ),
                    child: Text(
                      'Статистика',
                      style: AppTypography.headlineLarge(context),
                    ).animate().fadeIn(duration: 400.ms).slideX(
                          begin: -0.1,
                          end: 0,
                          duration: 400.ms,
                          curve: Curves.easeOut,
                        ),
                  ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.sm,
                    ),
                    child: _buildSummaryRow(context, statsData.dailyStats),
                  ).animate().fadeIn(delay: 100.ms, duration: 400.ms),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.md,
                    ),
                    child: _buildHeatmapSection(
                      context,
                      statsData.dailyStats,
                      isDark,
                    ),
                  ).animate().fadeIn(delay: 200.ms, duration: 500.ms).slideY(
                        begin: 0.05,
                        end: 0,
                        duration: 500.ms,
                        curve: Curves.easeOut,
                      ),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.sm,
                    ),
                    child: PeriodSelector(
                      selectedPeriod: _selectedPeriod,
                      onPeriodChanged: (period) {
                        setState(() {
                          _selectedPeriod = period;
                        });
                      },
                    ),
                  ).animate().fadeIn(delay: 300.ms, duration: 400.ms),
                ),
                SliverToBoxAdapter(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.md,
                    ),
                    child: _buildTrendCharts(
                      context,
                      stressTrend,
                      sleepTrend,
                      sessionsTrend,
                      isDark,
                    ),
                  ),
                ),
                const SliverToBoxAdapter(
                  child: SizedBox(height: AppSpacing.xxl),
                ),
              ],
            );
          },
        ),
      ),
    );
  }

  Widget _buildSummaryRow(BuildContext context, List<DailyStats> allStats) {
    final now = DateTime.now();
    final last7Days = allStats.where((s) {
      final diff = now.difference(s.date).inDays;
      return diff >= 0 && diff < 7;
    }).toList();

    final totalSessions = last7Days.fold<int>(
      0,
      (sum, s) => sum + s.sessionCount,
    );
    final totalMinutes = last7Days.fold<int>(
      0,
      (sum, s) => sum + (s.totalDuration ~/ 60),
    );
    final avgStress = last7Days.isEmpty
        ? 0.0
        : last7Days.fold<double>(0, (sum, s) => sum + s.avgStress) /
            last7Days.length;
    final currentStreak = _computeStreak(allStats);

    return Row(
      children: [
        Expanded(
          child: MiniStatCard(
            icon: Icons.self_improvement_rounded,
            value: '$totalSessions',
            label: 'Сессий',
            trend: null,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: MiniStatCard(
            icon: Icons.timer_outlined,
            value: '${totalMinutes}м',
            label: 'Время',
            trend: null,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: MiniStatCard(
            icon: Icons.favorite_rounded,
            value: avgStress.toStringAsFixed(0),
            label: 'Стресс',
            trend: avgStress > 50
                ? TrendDirection.up
                : avgStress < 30
                    ? TrendDirection.down
                    : TrendDirection.neutral,
            trendIsPositive: avgStress <= 50,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: MiniStatCard(
            icon: Icons.local_fire_department_rounded,
            value: '$currentStreak',
            label: 'Стрик',
            trend: currentStreak > 0
                ? TrendDirection.up
                : TrendDirection.neutral,
          ),
        ),
      ],
    );
  }

  Widget _buildHeatmapSection(
    BuildContext context,
    List<DailyStats> allStats,
    bool isDark,
  ) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isDark
            ? AppColors.surfaceDark
            : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
            blurRadius: 12,
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
                'Активность',
                style: AppTypography.titleMedium(context),
              ),
              Text(
                'Последние 3 месяца',
                style: AppTypography.bodySmall(context).copyWith(
                  color: theme.colorScheme.onSurface.withOpacity(0.5),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.md),
          HeatmapWidget(
            dailyStats: allStats,
            months: 3,
          ),
          const SizedBox(height: AppSpacing.sm),
          _buildHeatmapLegend(context, isDark),
        ],
      ),
    );
  }

  Widget _buildHeatmapLegend(BuildContext context, bool isDark) {
    final theme = Theme.of(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(
          'Меньше',
          style: AppTypography.bodySmall(context).copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.5),
            fontSize: 10,
          ),
        ),
        const SizedBox(width: AppSpacing.xs),
        _legendSquare(AppColors.heatmapEmpty(isDark)),
        const SizedBox(width: 2),
        _legendSquare(AppColors.heatmapLight),
        const SizedBox(width: 2),
        _legendSquare(AppColors.heatmapMedium),
        const SizedBox(width: 2),
        _legendSquare(AppColors.heatmapDark),
        const SizedBox(width: AppSpacing.xs),
        Text(
          'Больше',
          style: AppTypography.bodySmall(context).copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.5),
            fontSize: 10,
          ),
        ),
      ],
    );
  }

  Widget _legendSquare(Color color) {
    return Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(2),
      ),
    );
  }

  Widget _buildTrendCharts(
    BuildContext context,
    List<TrendDataPoint> stressTrend,
    List<TrendDataPoint> sleepTrend,
    List<TrendDataPoint> sessionsTrend,
    bool isDark,
  ) {
    return Column(
      children: [
        _buildChartCard(
          context: context,
          title: 'Средний стресс',
          subtitle: _periodSubtitle(),
          icon: Icons.psychology_rounded,
          iconColor: AppColors.stressMedium,
          dataPoints: stressTrend,
          lineColor: AppColors.stressMedium,
          gradientColor: AppColors.stressMedium.withOpacity(0.15),
          isDark: isDark,
          minY: 0,
          maxY: 100,
          valueFormatter: (v) => '${v.toStringAsFixed(0)}%',
        ).animate().fadeIn(delay: 400.ms, duration: 500.ms).slideY(
              begin: 0.05,
              end: 0,
              duration: 500.ms,
              curve: Curves.easeOut,
            ),
        const SizedBox(height: AppSpacing.md),
        _buildChartCard(
          context: context,
          title: 'Качество сна',
          subtitle: _periodSubtitle(),
          icon: Icons.bedtime_rounded,
          iconColor: AppColors.softPurple,
          dataPoints: sleepTrend,
          lineColor: AppColors.softPurple,
          gradientColor: AppColors.softPurple.withOpacity(0.15),
          isDark: isDark,
          minY: 0,
          maxY: 100,
          valueFormatter: (v) => '${v.toStringAsFixed(0)}%',
        ).animate().fadeIn(delay: 500.ms, duration: 500.ms).slideY(
              begin: 0.05,
              end: 0,
              duration: 500.ms,
              curve: Curves.easeOut,
            ),
        const SizedBox(height: AppSpacing.md),
        _buildChartCard(
          context: context,
          title: 'Всего сессий',
          subtitle: _periodSubtitle(),
          icon: Icons.self_improvement_rounded,
          iconColor: AppColors.gentleGreen,
          dataPoints: sessionsTrend,
          lineColor: AppColors.gentleGreen,
          gradientColor: AppColors.gentleGreen.withOpacity(0.15),
          isDark: isDark,
          minY: 0,
          maxY: null,
          valueFormatter: (v) => v.toStringAsFixed(0),
        ).animate().fadeIn(delay: 600.ms, duration: 500.ms).slideY(
              begin: 0.05,
              end: 0,
              duration: 500.ms,
              curve: Curves.easeOut,
            ),
      ],
    );
  }

  Widget _buildChartCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required IconData icon,
    required Color iconColor,
    required List<TrendDataPoint> dataPoints,
    required Color lineColor,
    required Color gradientColor,
    required bool isDark,
    required double minY,
    double? maxY,
    required String Function(double) valueFormatter,
  }) {
    final theme = Theme.of(context);
    final lastValue = dataPoints.isNotEmpty ? dataPoints.last.value : 0.0;
    final prevValue = dataPoints.length > 1
        ? dataPoints[dataPoints.length - 2].value
        : lastValue;
    final diff = lastValue - prevValue;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
            blurRadius: 12,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width