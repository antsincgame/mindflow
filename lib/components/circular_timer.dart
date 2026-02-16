import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:google_fonts/google_fonts.dart';

import '../theme/app_colors.dart';

class CircularTimer extends StatefulWidget {
  final int totalSeconds;
  final int remainingSeconds;
  final bool isPaused;
  final double size;
  final double strokeWidth;
  final Color? activeColor;
  final Color? inactiveColor;
  final Color? textColor;
  final String? label;
  final VoidCallback? onComplete;

  const CircularTimer({
    super.key,
    required this.totalSeconds,
    required this.remainingSeconds,
    this.isPaused = false,
    this.size = 220,
    this.strokeWidth = 12,
    this.activeColor,
    this.inactiveColor,
    this.textColor,
    this.label,
    this.onComplete,
  });

  @override
  State<CircularTimer> createState() => _CircularTimerState();
}

class _CircularTimerState extends State<CircularTimer>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _progressAnimation;
  double _previousProgress = 1.0;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _previousProgress = _currentProgress;
    _progressAnimation = Tween<double>(
      begin: _previousProgress,
      end: _previousProgress,
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  double get _currentProgress {
    if (widget.totalSeconds <= 0) return 0.0;
    return widget.remainingSeconds / widget.totalSeconds;
  }

  @override
  void didUpdateWidget(covariant CircularTimer oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.remainingSeconds != widget.remainingSeconds ||
        oldWidget.totalSeconds != widget.totalSeconds) {
      _previousProgress = _progressAnimation.value;
      final newProgress = _currentProgress;
      _progressAnimation = Tween<double>(
        begin: _previousProgress,
        end: newProgress,
      ).animate(CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOut,
      ));
      _controller.forward(from: 0.0);

      if (widget.remainingSeconds <= 0) {
        widget.onComplete?.call();
      }
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _formatTime(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  Color _getActiveColor(BuildContext context) {
    if (widget.activeColor != null) return widget.activeColor!;
    final progress = _currentProgress;
    if (progress > 0.5) return AppColors.stressLow;
    if (progress > 0.2) return AppColors.stressMedium;
    return AppColors.stressHigh;
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final activeColor = _getActiveColor(context);
    final inactiveColor = widget.inactiveColor ??
        theme.colorScheme.surfaceContainerHighest.withOpacity(0.3);
    final timerTextColor = widget.textColor ?? theme.colorScheme.onSurface;

    return AnimatedBuilder(
      animation: _progressAnimation,
      builder: (context, child) {
        return SizedBox(
          width: widget.size.w,
          height: widget.size.w,
          child: Stack(
            alignment: Alignment.center,
            children: [
              CustomPaint(
                size: Size(widget.size.w, widget.size.w),
                painter: _CircularTimerPainter(
                  progress: _progressAnimation.value,
                  activeColor: activeColor,
                  inactiveColor: inactiveColor,
                  strokeWidth: widget.strokeWidth.w,
                  isPaused: widget.isPaused,
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  AnimatedDefaultTextStyle(
                    duration: const Duration(milliseconds: 300),
                    style: GoogleFonts.spaceMono(
                      fontSize: 42.sp,
                      fontWeight: FontWeight.w700,
                      color: timerTextColor,
                      letterSpacing: 2,
                    ),
                    child: Text(
                      _formatTime(widget.remainingSeconds),
                    ),
                  ),
                  if (widget.label != null) ...[
                    SizedBox(height: 4.h),
                    Text(
                      widget.label!,
                      style: GoogleFonts.inter(
                        fontSize: 14.sp,
                        fontWeight: FontWeight.w500,
                        color: timerTextColor.withOpacity(0.6),
                      ),
                    ),
                  ],
                  if (widget.isPaused) ...[
                    SizedBox(height: 8.h),
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 12.w,
                        vertical: 4.h,
                      ),
                      decoration: BoxDecoration(
                        color: AppColors.stressMedium.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Text(
                        'PAUSED',
                        style: GoogleFonts.inter(
                          fontSize: 11.sp,
                          fontWeight: FontWeight.w700,
                          color: AppColors.stressMedium,
                          letterSpacing: 1.5,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ],
          ),
        );
      },
    );
  }
}

class _CircularTimerPainter extends CustomPainter {
  final double progress;
  final Color activeColor;
  final Color inactiveColor;
  final double strokeWidth;
  final bool isPaused;

  _CircularTimerPainter({
    required this.progress,
    required this.activeColor,
    required this.inactiveColor,
    required this.strokeWidth,
    required this.isPaused,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (size.width - strokeWidth) / 2;

    // Background circle
    final bgPaint = Paint()
      ..color = inactiveColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    canvas.drawCircle(center, radius, bgPaint);

    // Active arc
    if (progress > 0) {
      final sweepAngle = 2 * pi * progress;

      final activeGradient = SweepGradient(
        startAngle: -pi / 2,
        endAngle: -pi / 2 + sweepAngle,
        colors: [
          activeColor.withOpacity(0.6),
          activeColor,
        ],
        stops: const [0.0, 1.0],
      );

      final activePaint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      if (isPaused) {
        activePaint.color = activeColor.withOpacity(0.5);
      } else {
        activePaint.shader = activeGradient.createShader(
          Rect.fromCircle(center: center, radius: radius),
        );
      }

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        -pi / 2,
        sweepAngle,
        false,
        activePaint,
      );

      // Glow dot at the end of the arc
      if (!isPaused && progress > 0.01) {
        final dotAngle = -pi / 2 + sweepAngle;
        final dotX = center.dx + radius * cos(dotAngle);
        final dotY = center.dy + radius * sin(dotAngle);
        final dotCenter = Offset(dotX, dotY);

        final glowPaint = Paint()
          ..color = activeColor.withOpacity(0.3)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 8);

        canvas.drawCircle(dotCenter, strokeWidth * 0.8, glowPaint);

        final dotPaint = Paint()
          ..color = activeColor
          ..style = PaintingStyle.fill;

        canvas.drawCircle(dotCenter, strokeWidth / 2, dotPaint);
      }
    }
  }

  @override
  bool shouldRepaint(covariant _CircularTimerPainter oldDelegate) {
    return oldDelegate.progress != progress ||
        oldDelegate.activeColor != activeColor ||
        oldDelegate.inactiveColor != inactiveColor ||
        oldDelegate.strokeWidth != strokeWidth ||
        oldDelegate.isPaused != isPaused;
  }
}

class AnimatedBuilder extends StatelessWidget {
  final Animation<double> animation;
  final Widget Function(BuildContext context, Widget? child) builder;
  final Widget? child;

  const AnimatedBuilder({
    super.key,
    required this.animation,
    required this.builder,
    this.child,
  });

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder2(
      animation: animation,
      builder: builder,
      child: child,
    );
  }
}

class AnimatedBuilder2 extends AnimatedWidget {
  final Widget Function(BuildContext context, Widget? child) builder;
  final Widget? child;

  const AnimatedBuilder2({
    super.key,
    required super.listenable,
    required this.builder,
    this.child,
  }) : super();

  Animation<double> get animation => listenable as Animation<double>;

  @override
  Widget build(BuildContext context) {
    return builder(context, child);
  }
}