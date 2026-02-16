import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../models/breathing_pattern.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';

enum BreathingPhase {
  inhale,
  holdAfterInhale,
  exhale,
  holdAfterExhale,
  idle,
}

extension BreathingPhaseX on BreathingPhase {
  String get label {
    switch (this) {
      case BreathingPhase.inhale:
        return 'Вдох';
      case BreathingPhase.holdAfterInhale:
        return 'Задержка';
      case BreathingPhase.exhale:
        return 'Выдох';
      case BreathingPhase.holdAfterExhale:
        return 'Задержка';
      case BreathingPhase.idle:
        return 'Приготовьтесь';
    }
  }

  Color get color {
    switch (this) {
      case BreathingPhase.inhale:
        return AppColors.calmingBlue;
      case BreathingPhase.holdAfterInhale:
        return AppColors.softPurple;
      case BreathingPhase.exhale:
        return AppColors.gentleGreen;
      case BreathingPhase.holdAfterExhale:
        return AppColors.softPurple.withOpacity(0.7);
      case BreathingPhase.idle:
        return AppColors.calmingBlue.withOpacity(0.5);
    }
  }
}

class BreathingAnimationWidget extends StatefulWidget {
  final BreathingPattern pattern;
  final bool isActive;
  final bool isPaused;
  final VoidCallback? onCycleComplete;
  final ValueChanged<BreathingPhase>? onPhaseChanged;
  final ValueChanged<int>? onCycleCountChanged;
  final double size;

  const BreathingAnimationWidget({
    super.key,
    required this.pattern,
    this.isActive = false,
    this.isPaused = false,
    this.onCycleComplete,
    this.onPhaseChanged,
    this.onCycleCountChanged,
    this.size = 250,
  });

  @override
  State<BreathingAnimationWidget> createState() =>
      _BreathingAnimationWidgetState();
}

class _BreathingAnimationWidgetState extends State<BreathingAnimationWidget>
    with TickerProviderStateMixin {
  late AnimationController _breathController;
  late AnimationController _pulseController;
  late AnimationController _phaseTransitionController;

  late Animation<double> _breathAnimation;
  late Animation<double> _pulseAnimation;
  late Animation<double> _phaseOpacity;

  BreathingPhase _currentPhase = BreathingPhase.idle;
  int _currentCycleCount = 0;
  int _phaseSecondsRemaining = 0;

  double _minScale = 0.4;
  double _maxScale = 1.0;

  List<_PhaseSegment> _phaseSegments = [];
  Duration _totalCycleDuration = Duration.zero;

  @override
  void initState() {
    super.initState();
    _buildPhaseSegments();
    _initControllers();

    if (widget.isActive && !widget.isPaused) {
      _startBreathing();
    }
  }

  void _buildPhaseSegments() {
    _phaseSegments = [];
    final pattern = widget.pattern;

    if (pattern.inhaleDuration > 0) {
      _phaseSegments.add(_PhaseSegment(
        phase: BreathingPhase.inhale,
        duration: Duration(seconds: pattern.inhaleDuration),
      ));
    }

    if (pattern.holdDuration > 0) {
      _phaseSegments.add(_PhaseSegment(
        phase: BreathingPhase.holdAfterInhale,
        duration: Duration(seconds: pattern.holdDuration),
      ));
    }

    if (pattern.exhaleDuration > 0) {
      _phaseSegments.add(_PhaseSegment(
        phase: BreathingPhase.exhale,
        duration: Duration(seconds: pattern.exhaleDuration),
      ));
    }

    if (pattern.holdAfterExhaleDuration > 0) {
      _phaseSegments.add(_PhaseSegment(
        phase: BreathingPhase.holdAfterExhale,
        duration: Duration(seconds: pattern.holdAfterExhaleDuration),
      ));
    }

    _totalCycleDuration = _phaseSegments.fold(
      Duration.zero,
      (sum, segment) => sum + segment.duration,
    );
  }

  void _initControllers() {
    _breathController = AnimationController(
      vsync: this,
      duration: _totalCycleDuration,
    );

    _breathAnimation = _buildBreathTween().animate(
      CurvedAnimation(
        parent: _breathController,
        curve: Curves.easeInOut,
      ),
    );

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.97, end: 1.03).animate(
      CurvedAnimation(
        parent: _pulseController,
        curve: Curves.easeInOut,
      ),
    );

    _phaseTransitionController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 400),
    );

    _phaseOpacity = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(
        parent: _phaseTransitionController,
        curve: Curves.easeIn,
      ),
    );

    _breathController.addListener(_updatePhase);
    _breathController.addStatusListener(_onAnimationStatus);
  }

  TweenSequence<double> _buildBreathTween() {
    final segments = <TweenSequenceItem<double>>[];
    final totalMs = _totalCycleDuration.inMilliseconds;

    double currentValue = _minScale;

    for (final segment in _phaseSegments) {
      final weight = segment.duration.inMilliseconds / totalMs * 100;
      double endValue;

      switch (segment.phase) {
        case BreathingPhase.inhale:
          endValue = _maxScale;
          break;
        case BreathingPhase.holdAfterInhale:
          endValue = _maxScale;
          break;
        case BreathingPhase.exhale:
          endValue = _minScale;
          break;
        case BreathingPhase.holdAfterExhale:
          endValue = _minScale;
          break;
        case BreathingPhase.idle:
          endValue = currentValue;
          break;
      }

      segments.add(TweenSequenceItem(
        tween: Tween<double>(begin: currentValue, end: endValue),
        weight: weight,
      ));

      currentValue = endValue;
    }

    return TweenSequence(segments);
  }

  void _updatePhase() {
    if (!mounted) return;

    final progress = _breathController.value;
    final totalMs = _totalCycleDuration.inMilliseconds;
    int elapsedMs = (progress * totalMs).round();

    int accumulatedMs = 0;
    BreathingPhase newPhase = _currentPhase;
    int secondsRemaining = 0;

    for (final segment in _phaseSegments) {
      final segmentMs = segment.duration.inMilliseconds;
      if (elapsedMs < accumulatedMs + segmentMs) {
        newPhase = segment.phase;
        final msIntoPhase = elapsedMs - accumulatedMs;
        final msRemaining = segmentMs - msIntoPhase;
        secondsRemaining = (msRemaining / 1000).ceil();
        break;
      }
      accumulatedMs += segmentMs;
    }

    if (newPhase != _currentPhase) {
      setState(() {
        _currentPhase = newPhase;
        _phaseSecondsRemaining = secondsRemaining;
      });
      widget.onPhaseChanged?.call(newPhase);
      _phaseTransitionController.forward(from: 0);
    } else if (secondsRemaining != _phaseSecondsRemaining) {
      setState(() {
        _phaseSecondsRemaining = secondsRemaining;
      });
    }
  }

  void _onAnimationStatus(AnimationStatus status) {
    if (status == AnimationStatus.completed) {
      _currentCycleCount++;
      widget.onCycleCountChanged?.call(_currentCycleCount);

      if (widget.pattern.cycles > 0 &&
          _currentCycleCount >= widget.pattern.cycles) {
        widget.onCycleComplete?.call();
        return;
      }

      widget.onCycleComplete?.call();
      if (widget.isActive && !widget.isPaused) {
        _breathController.forward(from: 0);
      }
    }
  }

  void _startBreathing() {
    _currentCycleCount = 0;
    _currentPhase = BreathingPhase.idle;
    _phaseTransitionController.forward();
    _breathController.forward(from: 0);
  }

  @override
  void didUpdateWidget(covariant BreathingAnimationWidget oldWidget) {
    super.didUpdateWidget(oldWidget);

    if (widget.pattern != oldWidget.pattern) {
      _breathController.stop();
      _buildPhaseSegments();
      _breathController.duration = _totalCycleDuration;
      _breathAnimation = _buildBreathTween().animate(
        CurvedAnimation(
          parent: _breathController,
          curve: Curves.easeInOut,
        ),
      );
      if (widget.isActive && !widget.isPaused) {
        _startBreathing();
      }
    }

    if (widget.isActive && !oldWidget.isActive) {
      _startBreathing();
    } else if (!widget.isActive && oldWidget.isActive) {
      _breathController.stop();
      setState(() {
        _currentPhase = BreathingPhase.idle;
      });
    }

    if (widget.isPaused && !oldWidget.isPaused) {
      _breathController.stop();
      _pulseController.stop();
    } else if (!widget.isPaused && oldWidget.isPaused && widget.isActive) {
      _breathController.forward();
      _pulseController.repeat(reverse: true);
    }
  }

  @override
  void dispose() {
    _breathController.removeListener(_updatePhase);
    _breathController.removeStatusListener(_onAnimationStatus);
    _breathController.dispose();
    _pulseController.dispose();
    _phaseTransitionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return SizedBox(
      width: widget.size,
      height: widget.size + 80,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          SizedBox(
            width: widget.size,
            height: widget.size,
            child: AnimatedBuilder(
              animation: Listenable.merge([
                _breathAnimation,
                _pulseAnimation,
              ]),
              builder: (context, child) {
                final scale = widget.isActive
                    ? _breathAnimation.value
                    : _minScale * _pulseAnimation.value;

                return Center(
                  child: Transform.scale(
                    scale: scale,
                    child: _buildBreathCircle(context, isDark, scale),
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: AppSpacing.md),
          _buildPhaseLabel(context),
          const SizedBox(height: AppSpacing.xs),
          if (widget.isActive) _buildCycleIndicator(context),
        ],
      ),
    );
  }

  Widget _buildBreathCircle(
      BuildContext context, bool isDark, double currentScale) {
    final phaseColor = _currentPhase.color;
    final normalizedScale =
        (currentScale - _minScale) / (_maxScale - _minScale);

    return Container(
      width: widget.size * 0.85,
      height: widget.size * 0.85,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        gradient: RadialGradient(
          colors: [
            phaseColor.withOpacity(0.3 + normalizedScale * 0.3),
            phaseColor.withOpacity(0.1 + normalizedScale * 0.15),
            phaseColor.withOpacity(0.05),
          ],
          stops: const [0.3, 0.7, 1.0],
        ),
        boxShadow: [
          BoxShadow(
            color: phaseColor.withOpacity(0.2 + normalizedScale * 0.2),
            blurRadius: 30 + normalizedScale * 20,
            spreadRadius: 5 + normalizedScale * 10,
          ),
        ],
      ),
      child: Container(
        margin: EdgeInsets.all(widget.size * 0.1),
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          gradient: RadialGradient(
            colors: [
              phaseColor.withOpacity(0.5 + normalizedScale * 0.3),
              phaseColor.withOpacity(0.2 + normalizedScale * 0.2),
            ],
          ),
          border: Border.all(
            color: phaseColor.withOpacity(0.4),
            width: 2,
          ),
        ),
        child: Center(
          child: widget.isActive
              ? Text(
                  '$_phaseSecondsRemaining',
                  style: AppTypography.timerLarge.copyWith(
                    color: isDark ? Colors.white : Colors.white,
                    fontSize: 36,
                  ),
                )
              : Icon(
                  Icons.air_rounded,
                  size: 48,
                  color: Colors.white.withOpacity(0.8),
                ),
        ),
      ),
    );
  }

  Widget _buildPhaseLabel(BuildContext context) {
    return FadeTransition(
      opacity: _phaseOpacity,
      child: AnimatedSwitcher(
        duration: const Duration(milliseconds: 300),
        child: Text(
          _currentPhase.label,
          key: ValueKey(_currentPhase),
          style: AppTypography.headlineSmall.copyWith(
            color: _currentPhase.color,
            fontWeight: FontWeight.w600,
            letterSpacing: 1.2,
          ),
        ),
      ),
    );
  }

  Widget _buildCycleIndicator(BuildContext context) {
    final totalCycles = widget.pattern.cycles;
    if (totalCycles <= 0) {
      return Text(
        'Цикл $_currentCycleCount',
        style: AppTypography.bodySmall.copyWith(
          color: Theme.of(context)
              .textTheme
              .bodySmall
              ?.color
              ?.withOpacity(0.6),
        ),
      );
    }

    return Row(
      mainAxisAlignment