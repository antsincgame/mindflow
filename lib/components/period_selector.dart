import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';

enum StatsPeriod {
  week,
  month,
  allTime;

  String get label {
    switch (this) {
      case StatsPeriod.week:
        return 'Неделя';
      case StatsPeriod.month:
        return 'Месяц';
      case StatsPeriod.allTime:
        return 'Всё время';
    }
  }

  int get days {
    switch (this) {
      case StatsPeriod.week:
        return 7;
      case StatsPeriod.month:
        return 30;
      case StatsPeriod.allTime:
        return 365 * 10;
    }
  }
}

class PeriodSelector extends StatefulWidget {
  final StatsPeriod selectedPeriod;
  final ValueChanged<StatsPeriod> onPeriodChanged;
  final EdgeInsetsGeometry? padding;

  const PeriodSelector({
    super.key,
    required this.selectedPeriod,
    required this.onPeriodChanged,
    this.padding,
  });

  @override
  State<PeriodSelector> createState() => _PeriodSelectorState();
}

class _PeriodSelectorState extends State<PeriodSelector> {
  final List<StatsPeriod> _periods = StatsPeriod.values;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final isDark = theme.brightness == Brightness.dark;

    final backgroundColor = isDark
        ? colorScheme.surfaceContainerHighest.withOpacity(0.5)
        : AppColors.backgroundLight.withOpacity(0.8);

    final selectedColor = isDark
        ? colorScheme.primaryContainer
        : AppColors.calmingBlue.withOpacity(0.15);

    final selectedBorderColor = isDark
        ? colorScheme.primary.withOpacity(0.4)
        : AppColors.calmingBlue.withOpacity(0.3);

    final selectedTextColor = isDark
        ? colorScheme.onPrimaryContainer
        : AppColors.calmingBlue;

    final unselectedTextColor = isDark
        ? colorScheme.onSurfaceVariant
        : AppColors.textSecondaryLight;

    return Padding(
      padding: widget.padding ?? EdgeInsets.zero,
      child: Container(
        height: 44,
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          border: Border.all(
            color: isDark
                ? Colors.white.withOpacity(0.06)
                : Colors.black.withOpacity(0.04),
            width: 1,
          ),
        ),
        padding: const EdgeInsets.all(3),
        child: LayoutBuilder(
          builder: (context, constraints) {
            return Stack(
              children: [
                AnimatedPositioned(
                  duration: const Duration(milliseconds: 250),
                  curve: Curves.easeOutCubic,
                  left: _getSelectedOffset(constraints.maxWidth),
                  top: 0,
                  bottom: 0,
                  width: _getSegmentWidth(constraints.maxWidth),
                  child: Container(
                    decoration: BoxDecoration(
                      color: selectedColor,
                      borderRadius: BorderRadius.circular(
                        AppSpacing.radiusMd - 2,
                      ),
                      border: Border.all(
                        color: selectedBorderColor,
                        width: 1,
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.calmingBlue.withOpacity(0.08),
                          blurRadius: 8,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                  ),
                ),
                Row(
                  children: _periods.map((period) {
                    final isSelected = period == widget.selectedPeriod;
                    return Expanded(
                      child: GestureDetector(
                        onTap: () {
                          if (!isSelected) {
                            widget.onPeriodChanged(period);
                          }
                        },
                        behavior: HitTestBehavior.opaque,
                        child: Center(
                          child: AnimatedDefaultTextStyle(
                            duration: const Duration(milliseconds: 200),
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isSelected
                                  ? FontWeight.w600
                                  : FontWeight.w500,
                              color: isSelected
                                  ? selectedTextColor
                                  : unselectedTextColor,
                              letterSpacing: -0.1,
                            ),
                            child: Text(period.label),
                          ),
                        ),
                      ),
                    );
                  }).toList(),
                ),
              ],
            );
          },
        ),
      ),
    ).animate().fadeIn(duration: 300.ms).slideY(begin: 0.1, end: 0);
  }

  double _getSegmentWidth(double totalWidth) {
    return totalWidth / _periods.length;
  }

  double _getSelectedOffset(double totalWidth) {
    final index = _periods.indexOf(widget.selectedPeriod);
    return index * _getSegmentWidth(totalWidth);
  }
}