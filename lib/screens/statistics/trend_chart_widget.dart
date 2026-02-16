import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';

import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';

enum TrendType {
  stress,
  sleepQuality,
  sessionCount,
}

enum TrendPeriod {
  week,
  month,
  allTime,
}

class TrendDataPoint {
  final DateTime date;
  final double value;

  const TrendDataPoint({
    required this.date,
    required this.value,
  });
}

class TrendChartWidget extends StatefulWidget {
  final String title;
  final String subtitle;
  final TrendType trendType;
  final TrendPeriod period;
  final List<TrendDataPoint> dataPoints;
  final double? minY;
  final double? maxY;
  final String? unit;
  final bool showDots;
  final bool showGrid;
  final bool isMini;

  const TrendChartWidget({
    super.key,
    required this.title,
    this.subtitle = '',
    required this.trendType,
    this.period = TrendPeriod.week,
    required this.dataPoints,
    this.minY,
    this.maxY,
    this.unit,
    this.showDots = true,
    this.showGrid = true,
    this.isMini = false,
  });

  @override
  State<TrendChartWidget> createState() => _TrendChartWidgetState();
}

class _TrendChartWidgetState extends State<TrendChartWidget> {
  int? _touchedIndex;

  Color get _lineColor {
    switch (widget.trendType) {
      case TrendType.stress:
        return AppColors.stressMedium;
      case TrendType.sleepQuality:
        return AppColors.softPurple;
      case TrendType.sessionCount:
        return AppColors.gentleGreen;
    }
  }

  Color get _gradientEndColor => _lineColor.withOpacity(0.05);
  Color get _gradientStartColor => _lineColor.withOpacity(0.3);

  IconData get _trendIcon {
    switch (widget.trendType) {
      case TrendType.stress:
        return Icons.psychology_outlined;
      case TrendType.sleepQuality:
        return Icons.bedtime_outlined;
      case TrendType.sessionCount:
        return Icons.self_improvement_outlined;
    }
  }

  String get _unitLabel {
    if (widget.unit != null) return widget.unit!;
    switch (widget.trendType) {
      case TrendType.stress:
        return '%';
      case TrendType.sleepQuality:
        return '%';
      case TrendType.sessionCount:
        return '';
    }
  }

  double get _computedMinY {
    if (widget.minY != null) return widget.minY!;
    if (widget.dataPoints.isEmpty) return 0;
    final minVal = widget.dataPoints
        .map((e) => e.value)
        .reduce((a, b) => a < b ? a : b);
    return (minVal - 10).clamp(0, double.infinity);
  }

  double get _computedMaxY {
    if (widget.maxY != null) return widget.maxY!;
    if (widget.dataPoints.isEmpty) return 100;
    final maxVal = widget.dataPoints
        .map((e) => e.value)
        .reduce((a, b) => a > b ? a : b);
    return maxVal + 10;
  }

  double? get _trendPercentage {
    if (widget.dataPoints.length < 2) return null;
    final first = widget.dataPoints.first.value;
    final last = widget.dataPoints.last.value;
    if (first == 0) return null;
    return ((last - first) / first) * 100;
  }

  bool get _isTrendPositive {
    final trend = _trendPercentage;
    if (trend == null) return true;
    if (widget.trendType == TrendType.stress) {
      return trend <= 0;
    }
    return trend >= 0;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    if (widget.isMini) {
      return _buildMiniChart(context, isDark);
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
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
          _buildHeader(context, isDark),
          const SizedBox(height: AppSpacing.md),
          SizedBox(
            height: 200,
            child: widget.dataPoints.isEmpty
                ? _buildEmptyState(context, isDark)
                : _buildChart(context, isDark),
          ),
        ],
      ),
    ).animate().fadeIn(duration: 400.ms).slideY(begin: 0.05, end: 0);
  }

  Widget _buildHeader(BuildContext context, bool isDark) {
    final theme = Theme.of(context);
    final trend = _trendPercentage;

    return Row(
      children: [
        Container(
          width: 40,
          height: 40,
          decoration: BoxDecoration(
            color: _lineColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          child: Icon(
            _trendIcon,
            color: _lineColor,
            size: 22,
          ),
        ),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.title,
                style: theme.textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w600,
                  color: isDark ? Colors.white : Colors.black87,
                ),
              ),
              if (widget.subtitle.isNotEmpty)
                Text(
                  widget.subtitle,
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                ),
            ],
          ),
        ),
        if (trend != null)
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.xs,
            ),
            decoration: BoxDecoration(
              color: _isTrendPositive
                  ? AppColors.gentleGreen.withOpacity(0.12)
                  : AppColors.stressHigh.withOpacity(0.12),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  _isTrendPositive
                      ? Icons.trending_up_rounded
                      : Icons.trending_down_rounded,
                  size: 16,
                  color: _isTrendPositive
                      ? AppColors.gentleGreen
                      : AppColors.stressHigh,
                ),
                const SizedBox(width: 4),
                Text(
                  '${trend.abs().toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: _isTrendPositive
                        ? AppColors.gentleGreen
                        : AppColors.stressHigh,
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildChart(BuildContext context, bool isDark) {
    final sortedPoints = List<TrendDataPoint>.from(widget.dataPoints)
      ..sort((a, b) => a.date.compareTo(b.date));

    final spots = <FlSpot>[];
    for (int i = 0; i < sortedPoints.length; i++) {
      spots.add(FlSpot(i.toDouble(), sortedPoints[i].value));
    }

    return LineChart(
      LineChartData(
        minY: _computedMinY,
        maxY: _computedMaxY,
        gridData: FlGridData(
          show: widget.showGrid,
          drawVerticalLine: false,
          horizontalInterval: (_computedMaxY - _computedMinY) / 4,
          getDrawingHorizontalLine: (value) => FlLine(
            color: isDark
                ? Colors.grey.shade800
                : Colors.grey.shade200,
            strokeWidth: 1,
            dashArray: [5, 5],
          ),
        ),
        titlesData: FlTitlesData(
          topTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          rightTitles: const AxisTitles(
            sideTitles: SideTitles(showTitles: false),
          ),
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 36,
              interval: (_computedMaxY - _computedMinY) / 4,
              getTitlesWidget: (value, meta) {
                return Text(
                  '${value.toInt()}$_unitLabel',
                  style: TextStyle(
                    fontSize: 10,
                    color: isDark
                        ? Colors.grey.shade500
                        : Colors.grey.shade500,
                  ),
                );
              },
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 28,
              interval: _bottomTitleInterval(sortedPoints.length),
              getTitlesWidget: (value, meta) {
                final index = value.toInt();
                if (index < 0 || index >= sortedPoints.length) {
                  return const SizedBox.shrink();
                }
                return Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text(
                    _formatDateLabel(sortedPoints[index].date),
                    style: TextStyle(
                      fontSize: 10,
                      color: isDark
                          ? Colors.grey.shade500
                          : Colors.grey.shade500,
                    ),
                  ),
                );
              },
            ),
          ),
        ),
        borderData: FlBorderData(show: false),
        lineTouchData: LineTouchData(
          enabled: true,
          touchCallback: (event, response) {
            if (event is FlPointerExitEvent || event is FlLongPressEnd) {
              setState(() => _touchedIndex = null);
            } else if (response?.lineBarSpots != null &&
                response!.lineBarSpots!.isNotEmpty) {
              setState(() {
                _touchedIndex = response.lineBarSpots!.first.spotIndex;
              });
            }
          },
          touchTooltipData: LineTouchTooltipData(
            getTooltipColor: (_) =>
                isDark ? Colors.grey.shade800 : Colors.white,
            tooltipRoundedRadius: AppSpacing.radiusSm,
            tooltipPadding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.sm,
              vertical: AppSpacing.xs,
            ),
            getTooltipItems: (touchedSpots) {
              return touchedSpots.map((spot) {
                final index = spot.spotIndex;
                final point = sortedPoints[index];
                final dateStr = DateFormat('d MMM').format(point.date);
                return LineTooltipItem(
                  '$dateStr\n${point.value.toStringAsFixed(1)}$_unitLabel',
                  TextStyle(
                    color: _lineColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                );
              }).toList();
            },
          ),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            curveSmoothness: 0.3,
            preventCurveOverShooting: true,
            color: _lineColor,
            barWidth: 2.5,
            isStrokeCapRound: true,
            dotData: FlDotData(
              show: widget.showDots,
              getDotPainter: (spot, percent, bar, index) {
                final isSelected = index == _touchedIndex;
                return FlDotCirclePainter(
                  radius: isSelected ? 5 : 3,
                  color: isSelected ? _lineColor : Colors.white,
                  strokeWidth: isSelected ? 2.5 : 2,
                  strokeColor: _lineColor,
                );
              },
            ),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  _gradientStartColor,
                  _gradientEndColor,
                ],
              ),
            ),
          ),
        ],
      ),
      duration: const Duration(milliseconds: 600),
      curve: Curves.easeInOut,
    );
  }

  Widget _buildMiniChart(BuildContext context, bool isDark) {
    final theme = Theme.of(context);
    final sortedPoints = List<TrendDataPoint>.from(widget.dataPoints)
      ..sort((a, b) => a.date.compareTo(b.date));

    final spots = <FlSpot>[];
    for (int i = 0; i < sortedPoints.length; i++) {
      spots.add(FlSpot(i.toDouble(), sortedPoints[i].value));
    }

    final lastValue = sortedPoints.isNotEmpty
        ? sortedPoints.last.value
        : 0.0;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.sm),
      decoration: BoxDecoration(
        color: isDark ? Colors.grey.shade900 : Colors.white,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            children: [
              Icon(_trendIcon, size: 16, color: _lineColor),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  widget.title,
                  style: theme.textTheme.bodySmall?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isDark ? Colors.grey.shade400 : Colors.grey.shade600,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),