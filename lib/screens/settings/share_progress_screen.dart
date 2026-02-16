import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../providers/statistics_provider.dart';
import '../../screens/statistics/heatmap_widget.dart';
import '../../screens/statistics/trend_chart_widget.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';

class ShareProgressScreen extends ConsumerStatefulWidget {
  const ShareProgressScreen({super.key});

  @override
  ConsumerState<ShareProgressScreen> createState() =>
      _ShareProgressScreenState();
}

class _ShareProgressScreenState extends ConsumerState<ShareProgressScreen> {
  bool _includeHeatmap = true;
  bool _includeStressChart = true;
  bool _includeSleepChart = false;
  bool _includeSessionCount = true;
  bool _isGenerating = false;
  String? _generatedSummary;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final statisticsAsync = ref.watch(statisticsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Поделиться прогрессом'),
        centerTitle: true,
        elevation: 0,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildInfoBanner(theme),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Что включить',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              _buildToggleOption(
                theme: theme,
                title: 'Тепловая карта активности',
                subtitle: 'Количество упражнений по дням',
                icon: Icons.grid_on_rounded,
                value: _includeHeatmap,
                onChanged: (v) => setState(() => _includeHeatmap = v),
              ),
              _buildToggleOption(
                theme: theme,
                title: 'График стресса',
                subtitle: 'Средний уровень стресса по дням',
                icon: Icons.show_chart_rounded,
                value: _includeStressChart,
                onChanged: (v) => setState(() => _includeStressChart = v),
              ),
              _buildToggleOption(
                theme: theme,
                title: 'График сна',
                subtitle: 'Качество сна по дням',
                icon: Icons.bedtime_rounded,
                value: _includeSleepChart,
                onChanged: (v) => setState(() => _includeSleepChart = v),
              ),
              _buildToggleOption(
                theme: theme,
                title: 'Количество сессий',
                subtitle: 'Общее число выполненных упражнений',
                icon: Icons.fitness_center_rounded,
                value: _includeSessionCount,
                onChanged: (v) => setState(() => _includeSessionCount = v),
              ),
              const SizedBox(height: AppSpacing.lg),
              _buildPrivacyNote(theme),
              const SizedBox(height: AppSpacing.lg),
              Text(
                'Превью',
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              statisticsAsync.when(
                data: (stats) => _buildPreviewCard(theme, stats),
                loading: () => const Center(
                  child: Padding(
                    padding: EdgeInsets.all(AppSpacing.xl),
                    child: CircularProgressIndicator(),
                  ),
                ),
                error: (e, _) => Center(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.xl),
                    child: Text(
                      'Не удалось загрузить статистику',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.lg),
              _buildShareButtons(theme, statisticsAsync),
              const SizedBox(height: AppSpacing.lg),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoBanner(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.calmingBlue.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: AppColors.calmingBlue.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.info_outline_rounded,
            color: AppColors.calmingBlue,
            size: 24,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              'Вы можете поделиться своим прогрессом с другом или терапевтом. Личные данные и биометрика не передаются.',
              style: theme.textTheme.bodySmall?.copyWith(
                color: AppColors.calmingBlue,
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: -0.1, end: 0);
  }

  Widget _buildToggleOption({
    required ThemeData theme,
    required String title,
    required String subtitle,
    required IconData icon,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Card(
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          side: BorderSide(
            color: theme.colorScheme.outline.withOpacity(0.15),
          ),
        ),
        child: SwitchListTile(
          value: value,
          onChanged: onChanged,
          secondary: Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              color: value
                  ? AppColors.calmingBlue.withOpacity(0.1)
                  : theme.colorScheme.surfaceContainerHighest.withOpacity(0.5),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Icon(
              icon,
              color: value
                  ? AppColors.calmingBlue
                  : theme.colorScheme.onSurface.withOpacity(0.4),
              size: 20,
            ),
          ),
          title: Text(
            title,
            style: theme.textTheme.bodyMedium?.copyWith(
              fontWeight: FontWeight.w500,
            ),
          ),
          subtitle: Text(
            subtitle,
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
          activeColor: AppColors.calmingBlue,
          contentPadding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md,
            vertical: AppSpacing.xxs,
          ),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
      ),
    );
  }

  Widget _buildPrivacyNote(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: AppColors.gentleGreen.withOpacity(0.1),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: AppColors.gentleGreen.withOpacity(0.3),
        ),
      ),
      child: Row(
        children: [
          Icon(
            Icons.shield_outlined,
            color: AppColors.gentleGreen,
            size: 24,
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Приватность',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.gentleGreen,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  'Не передаётся: пульс, HRV, данные сна, личная информация, записи эмоций',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: AppColors.gentleGreen,
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreviewCard(ThemeData theme, dynamic stats) {
    final hasAnySelected = _includeHeatmap ||
        _includeStressChart ||
        _includeSleepChart ||
        _includeSessionCount;

    if (!hasAnySelected) {
      return Container(
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.xl),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.3),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: theme.colorScheme.outline.withOpacity(0.15),
          ),
        ),
        child: Column(
          children: [
            Icon(
              Icons.visibility_off_rounded,
              size: 48,
              color: theme.colorScheme.onSurface.withOpacity(0.3),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Выберите хотя бы один элемент',
              style: theme.textTheme.bodyMedium?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.5),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    AppColors.calmingBlue.withOpacity(0.15),
                    AppColors.softPurple.withOpacity(0.1),
                  ],
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.spa_rounded,
                        color: AppColors.calmingBlue,
                        size: 20,
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        'MindFlow — Мой прогресс',
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: AppColors.calmingBlue,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Последние 30 дней',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (_includeSessionCount) ...[
                    _buildPreviewStatRow(theme, stats),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  if (_includeHeatmap) ...[
                    Text(
                      'Активность',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    SizedBox(
                      height: 120,
                      child: HeatmapWidget(
                        dailyStats: stats?.dailyStats ?? [],
                        months: 1,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  if (_includeStressChart) ...[
                    Text(
                      'Уровень стресса',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    SizedBox(
                      height: 120,
                      child: TrendChartWidget(
                        dailyStats: stats?.dailyStats ?? [],
                        dataType: TrendDataType.stress,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                  ],
                  if (_includeSleepChart) ...[
                    Text(
                      'Качество сна',
                      style: theme.textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    SizedBox(
                      height: 120,
                      child: TrendChartWidget(
                        dailyStats: stats?.dailyStats ?? [],
                        dataType: TrendDataType.sleep,
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    ).animate().fadeIn(duration: 300.ms);
  }

  Widget _buildPreviewStatRow(ThemeData theme, dynamic stats) {
    final totalSessions = stats?.totalSessions ?? 0;
    final totalDuration = stats?.totalDuration ??