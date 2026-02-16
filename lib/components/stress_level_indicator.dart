import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../theme/app_colors.dart';
import '../theme/app_spacing.dart';
import '../theme/app_typography.dart';

enum StressIndicatorStyle {
  circular,
  linear,
}

class StressLevelIndicator extends StatelessWidget {
  final int level;
  final StressIndicatorStyle style;
  final double size;
  final bool showLabel;
  final bool showValue;
  final bool animate;
  final String? label;
  final double strokeWidth;

  const StressLevelIndicator({
    super.key,
    required this.level,
    this.style = StressIndicatorStyle.circular,
    this.size = 120,
    this.showLabel = true,
    this.showValue = true,
    this.animate = true,
    this.label,
    this.strokeWidth = 10,
  });

  int get _clampedLevel => level.clamp(0, 100);

  double get _normalizedLevel => _clampedLevel / 100.0;

  Color get stressColor {
    if (_clampedLevel <= 30) {
      return Color.lerp(
        AppColors.stressLow,
        AppColors.stressMedium,
        _clampedLevel / 30.0,
      )!;
    } else if (_clampedLevel <= 60) {
      return Color.lerp(
        AppColors.stressMedium,
        const Color(0xFFFF9800),
        (_clampedLevel - 30) / 30.0,
      )!;
    } else {
      return Color.lerp(
        const Color(0xFFFF9800),
        AppColors.stressHigh,
        (_clampedLevel - 60) / 40.0,
      )!;
    }
  }

  String get _stressLabel {
    if (label != null) return label!;
    if (_clampedLevel <= 20) return 'Отлично';
    if (_clampedLevel <= 40) return 'Хорошо';
    if (_clampedLevel <= 60) return 'Умеренно';
    if (_clampedLevel <= 80) return 'Повышенный';
    return 'Высокий';
  }

  String get _stressEmoji {
    if (_clampedLevel <= 20) return '😌';
    if (_clampedLevel <= 40) return '🙂';
    if (_clampedLevel <= 60) return '😐';
    if (_clampedLevel <= 80) return '😟';
    return '😰';
  }

  @override
  Widget build(BuildContext context) {
    final widget = style == StressIndicatorStyle.circular
        ? _buildCircularIndicator(context)
        : _buildLinearIndicator(context);

    if (animate) {
      return widget
          .animate()
          .fadeIn(duration: 400.ms)
          .scale(begin: const Offset(0.9, 0.9), duration: 400.ms);
    }

    return widget;
  }

  Widget _buildCircularIndicator(BuildContext context) {
    return SizedBox(
      width: size,
      height: size + (showLabel ? 28 : 0),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: size,
            height: size,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: size,
                  height: size,
                  child: CustomPaint(
                    painter: _CircularStressPainter(
                      progress: _normalizedLevel,
                      color: stressColor,
                      backgroundColor: Theme.of(context).brightness == Brightness.dark
                          ? Colors.white.withOpacity(0.1)
                          : Colors.grey.withOpacity(0.15),
                      strokeWidth: strokeWidth,
                    ),
                  ),
                ),
                if (showValue)
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _stressEmoji,
                        style: TextStyle(fontSize: size * 0.2),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '$_clampedLevel',
                        style: AppTypography.headlineMedium(context).copyWith(
                          color: stressColor,
                          fontWeight: FontWeight.w700,
                          fontSize: size * 0.22,
                          height: 1.0,
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
          if (showLabel) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              _stressLabel,
              style: AppTypography.bodySmall(context).copyWith(
                color: stressColor,
                fontWeight: FontWeight.w600,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildLinearIndicator(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showLabel || showValue)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.xs),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                if (showLabel)
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        _stressEmoji,
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        _stressLabel,
                        style: AppTypography.bodyMedium(context).copyWith(
                          color: stressColor,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                if (showValue)
                  Text(
                    '$_clampedLevel/100',
                    style: AppTypography.bodySmall(context).copyWith(
                      color: stressColor,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
              ],
            ),
          ),
        SizedBox(
          height: strokeWidth,
          child: ClipRRect(
            borderRadius: BorderRadius.circular(strokeWidth / 2),
            child: Stack(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Theme.of(context).brightness == Brightness.dark
                        ? Colors.white.withOpacity(0.1)
                        : Colors.grey.withOpacity(0.15),
                    borderRadius: BorderRadius.circular(strokeWidth / 2),
                  ),
                ),
                AnimatedFractionallySizedBox(
                  duration: animate
                      ? const Duration(milliseconds: 800)
                      : Duration.zero,
                  curve: Curves.easeOutCubic,
                  widthFactor: _normalizedLevel,
                  alignment: Alignment.centerLeft,
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          stressColor.withOpacity(0.7),
                          stressColor,
                        ],
                      ),
                      borderRadius: BorderRadius.circular(strokeWidth / 2),
                      boxShadow: [
                        BoxShadow(
                          color: stressColor.withOpacity(0.3),
                          blurRadius: 4,
                          offset: const Offset(0, 1),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _CircularStressPainter extends CustomPainter {
  final double progress;
  final Color color;
  final Color backgroundColor;
  final double strokeWidth;

  _CircularStressPainter({
    required this.progress,
    required this.color,
    required this.backgroundColor,
    required this.strokeWidth,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (math.min(size.width, size.height) - strokeWidth) / 2;

    final backgroundPaint = Paint()
      ..color = backgroundColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, backgroundPaint);

    if (progress > 0) {
      final progressPaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round
        ..shader = SweepGradient(
          startAngle: -math.pi / 2,
          endAngle: -math.pi / 2 + 2 * math.pi * progress,
          colors: [
            color.withOpacity(0.6),
            color,
          ],
          stops: const [0.0, 1.0],
          transform: const GradientRotation(-math.pi / 2),
        ).createShader(
          Rect.fromCircle(center: center, radius: radius),
        );

      final glowPaint = Paint()
        ..color = color.withOpacity(0.15)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth + 6
        ..strokeCap = StrokeCap.round
        ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4);

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        glowPaint,
      );

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -math.pi / 2,
        2 * math.pi * progress,
        false,
        progressPaint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant _CircularStressPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.color != color ||
        oldDelegate.backgroundColor != backgroundColor ||
        oldDelegate.strokeWidth != strokeWidth;
  }
}

class AnimatedStressLevelIndicator extends StatelessWidget {
  final int level;
  final StressIndicatorStyle style;
  final double size;
  final bool showLabel;
  final bool showValue;
  final String? label;
  final double strokeWidth;
  final Duration duration;

  const AnimatedStressLevelIndicator({
    super.key,
    required this.level,
    this.style = StressIndicatorStyle.circular,
    this.size = 120,
    this.showLabel = true,
    this.showValue = true,
    this.label,
    this.strokeWidth = 10,
    this.duration = const Duration(milliseconds: 1200),
  });

  @override
  Widget build(BuildContext context) {
    return TweenAnimationBuilder<int>(
      tween: IntTween(begin: 0, end: level.clamp(0, 100)),
      duration: duration,
      curve: Curves.easeOutCubic,
      builder: (context, animatedLevel, _) {
        return StressLevelIndicator(
          level: animatedLevel,
          style: style,
          size: size,
          showLabel: showLabel,
          showValue: showValue,
          animate: false,
          label: label,
          strokeWidth: strokeWidth,
        );
      },
    );
  }
}

class CompactStressIndicator extends StatelessWidget {
  final int level;
  final double iconSize;

  const CompactStressIndicator({
    super.key,
    required this.level,
    this.iconSize = 32,
  });

  @override
  Widget build(BuildContext context) {
    final indicator = StressLevelIndicator(
      level: level,
      showLabel: false,
      showValue: false,
      animate: false,
    );

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: iconSize,
          height: iconSize,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: indicator.stressColor.withOpacity(0.15),
            border: Border.all(
              color: indicator.stressColor.withOpacity(0.4),
              width: 2,
            ),
          ),
          child: Center(
            child: Text(
              '${level.clamp(0, 100)}',
              style: AppTypography.bodySmall(context).copyWith(
                color: indicator.stressColor,
                fontWeight: FontWeight.w700,
                fontSize: iconSize * 0.35,
              ),
            ),
          ),
        ),
      ],
    );
  }
}