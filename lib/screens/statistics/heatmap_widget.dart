import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/daily_stats.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';

class HeatmapWidget extends StatelessWidget {
  final Map<DateTime, DailyStats> dailyStatsMap;
  final int monthsToShow;
  final void Function(DateTime date, DailyStats? stats)? onDayTap;

  const HeatmapWidget({
    super.key,
    required this.dailyStatsMap,
    this.monthsToShow = 3,
    this.onDayTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final startDate = DateTime(now.year, now.month - monthsToShow + 1, 1);

    final days = _generateDays(startDate, today);
    final weeks = _groupIntoWeeks(days, startDate);
    final monthLabels = _generateMonthLabels(startDate, today);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: Text(
            'Активность',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
        SizedBox(
          height: _kCellSize * 7 + _kCellSpacing * 6 + _kMonthLabelHeight + _kWeekdayLabelWidth,
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildWeekdayLabels(context),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  reverse: true,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _buildMonthLabelsRow(context, monthLabels, weeks.length),
                      SizedBox(
                        height: _kCellSize * 7 + _kCellSpacing * 6,
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: weeks.map((week) {
                            return Padding(
                              padding: const EdgeInsets.only(right: _kCellSpacing),
                              child: Column(
                                children: List.generate(7, (dayIndex) {
                                  if (dayIndex < week.length) {
                                    final day = week[dayIndex];
                                    if (day == null) {
                                      return _buildEmptyCell();
                                    }
                                    final normalizedDay = DateTime(day.year, day.month, day.day);
                                    final stats = _findStats(normalizedDay);
                                    final sessionCount = stats?.sessionCount ?? 0;
                                    return _buildDayCell(
                                      context,
                                      normalizedDay,
                                      sessionCount,
                                      stats,
                                      isToday: normalizedDay == today,
                                      isFuture: normalizedDay.isAfter(today),
                                    );
                                  }
                                  return _buildEmptyCell();
                                }),
                              ),
                            );
                          }).toList(),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.sm),
        _buildLegend(context),
      ],
    );
  }

  static const double _kCellSize = 14.0;
  static const double _kCellSpacing = 3.0;
  static const double _kMonthLabelHeight = 20.0;
  static const double _kWeekdayLabelWidth = 28.0;
  static const double _kCellRadius = 3.0;

  List<DateTime> _generateDays(DateTime start, DateTime end) {
    final days = <DateTime>[];
    var current = start;
    while (!current.isAfter(end)) {
      days.add(current);
      current = current.add(const Duration(days: 1));
    }
    return days;
  }

  List<List<DateTime?>> _groupIntoWeeks(List<DateTime> days, DateTime startDate) {
    if (days.isEmpty) return [];

    final weeks = <List<DateTime?>>[];

    final firstDayWeekday = startDate.weekday % 7;

    List<DateTime?> currentWeek = List.filled(7, null);

    for (final day in days) {
      final dayWeekday = day.weekday % 7;
      if (dayWeekday == 0 && currentWeek.any((d) => d != null)) {
        weeks.add(currentWeek);
        currentWeek = List.filled(7, null);
      }
      final index = day.weekday == 7 ? 0 : day.weekday;
      final mappedIndex = _weekdayToIndex(day.weekday);
      currentWeek[mappedIndex] = day;
    }

    if (currentWeek.any((d) => d != null)) {
      weeks.add(currentWeek);
    }

    return weeks;
  }

  int _weekdayToIndex(int weekday) {
    // Monday = 0, Sunday = 6
    return weekday - 1;
  }

  List<_MonthLabel> _generateMonthLabels(DateTime start, DateTime end) {
    final labels = <_MonthLabel>[];
    var current = DateTime(start.year, start.month, 1);

    while (!current.isAfter(end)) {
      final daysSinceStart = current.difference(start).inDays;
      final weekIndex = (daysSinceStart + (start.weekday - 1)) ~/ 7;
      labels.add(_MonthLabel(
        label: DateFormat.MMM().format(current),
        weekIndex: weekIndex,
      ));
      current = DateTime(current.year, current.month + 1, 1);
    }

    return labels;
  }

  DailyStats? _findStats(DateTime day) {
    for (final entry in dailyStatsMap.entries) {
      final key = DateTime(entry.key.year, entry.key.month, entry.key.day);
      if (key == day) {
        return entry.value;
      }
    }
    return null;
  }

  Color _getColorForCount(BuildContext context, int count, {bool isFuture = false}) {
    if (isFuture) {
      return Theme.of(context).colorScheme.surfaceContainerHighest.withOpacity(0.3);
    }
    if (count == 0) {
      return Theme.of(context).brightness == Brightness.dark
          ? const Color(0xFF1A1A2E)
          : const Color(0xFFEBEDF0);
    } else if (count <= 2) {
      return Theme.of(context).brightness == Brightness.dark
          ? AppColors.heatmapLevel1Dark
          : AppColors.heatmapLevel1;
    } else {
      return Theme.of(context).brightness == Brightness.dark
          ? AppColors.heatmapLevel2Dark
          : AppColors.heatmapLevel2;
    }
  }

  Widget _buildDayCell(
    BuildContext context,
    DateTime day,
    int sessionCount,
    DailyStats? stats, {
    bool isToday = false,
    bool isFuture = false,
  }) {
    final color = _getColorForCount(context, sessionCount, isFuture: isFuture);

    return GestureDetector(
      onTap: isFuture ? null : () => onDayTap?.call(day, stats),
      child: Tooltip(
        message: isFuture
            ? ''
            : '${DateFormat.yMMMd().format(day)}\n$sessionCount упражнени${_pluralSuffix(sessionCount)}',
        child: Container(
          width: _kCellSize,
          height: _kCellSize,
          margin: const EdgeInsets.only(bottom: _kCellSpacing),
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(_kCellRadius),
            border: isToday
                ? Border.all(
                    color: Theme.of(context).colorScheme.primary,
                    width: 1.5,
                  )
                : null,
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyCell() {
    return SizedBox(
      width: _kCellSize,
      height: _kCellSize,
      child: Container(
        margin: const EdgeInsets.only(bottom: _kCellSpacing),
      ),
    );
  }

  Widget _buildWeekdayLabels(BuildContext context) {
    final labels = ['Пн', '', 'Ср', '', 'Пт', '', ''];
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.only(top: _kMonthLabelHeight),
      child: Column(
        children: labels.map((label) {
          return SizedBox(
            width: _kWeekdayLabelWidth,
            height: _kCellSize + _kCellSpacing,
            child: Align(
              alignment: Alignment.centerRight,
              child: Text(
                label,
                style: theme.textTheme.labelSmall?.copyWith(
                  fontSize: 10,
                  color: theme.colorScheme.onSurfaceVariant,
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildMonthLabelsRow(
    BuildContext context,
    List<_MonthLabel> monthLabels,
    int totalWeeks,
  ) {
    final theme = Theme.of(context);
    final weekWidth = _kCellSize + _kCellSpacing;

    return SizedBox(
      height: _kMonthLabelHeight,
      width: totalWeeks * weekWidth,
      child: Stack(
        children: monthLabels.map((label) {
          return Positioned(
            left: label.weekIndex * weekWidth,
            child: Text(
              label.label,
              style: theme.textTheme.labelSmall?.copyWith(
                fontSize: 10,
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildLegend(BuildContext context) {
    final theme = Theme.of(context);

    return Row(
      mainAxisAlignment: MainAxisAlignment.end,
      children: [
        Text(
          'Меньше',
          style: theme.textTheme.labelSmall?.copyWith(
            fontSize: 10,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
        const SizedBox(width: AppSpacing.xs),
        _buildLegendCell(context, 0),
        const SizedBox(width: 2),
        _buildLegendCell(context, 1),
        const SizedBox(width: 2),
        _buildLegendCell(context, 3),
        const SizedBox(width: AppSpacing.xs),
        Text(
          'Больше',
          style: theme.textTheme.labelSmall?.copyWith(
            fontSize: 10,
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _buildLegendCell(BuildContext context, int count) {
    return Container(
      width: _kCellSize,
      height: _kCellSize,
      decoration: BoxDecoration(
        color: _getColorForCount(context, count),
        borderRadius: BorderRadius.circular(_kCellRadius),
      ),
    );
  }

  String _pluralSuffix(int count) {
    if (count % 10 == 1 && count % 100 != 11) return 'е';
    if ([2, 3, 4].contains(count % 10) && ![12, 13, 14].contains(count % 100)) return 'я';
    return 'й';
  }
}

class _MonthLabel {
  final String label;
  final int weekIndex;

  const _MonthLabel({
    required this.label,
    required this.weekIndex,
  });
}

extension on AppColors {
  static const Color heatmapLevel1 = Color(0xFF9BE9A8);
  static const Color heatmapLevel2 = Color(0xFF216E39);
  static const Color heatmapLevel1Dark = Color(0xFF0E4429);
  static const Color heatmapLevel2Dark = Color(0xFF39D353);
}