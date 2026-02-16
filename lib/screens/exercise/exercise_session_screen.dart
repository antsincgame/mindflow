import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';

import '../../models/exercise.dart';
import '../../models/breathing_pattern.dart';
import '../../providers/session_provider.dart';
import '../../providers/health_provider.dart';
import '../../components/circular_timer.dart';
import '../../components/stress_level_indicator.dart';
import '../../screens/exercise/breathing_animation_widget.dart';
import '../../services/audio_service.dart';
import '../../theme/app_colors.dart';
import '../../theme/app_spacing.dart';
import '../../theme/app_typography.dart';

class ExerciseSessionScreen extends ConsumerStatefulWidget {
  final Exercise exercise;

  const ExerciseSessionScreen({
    super.key,
    required this.exercise,
  });

  @override
  ConsumerState<ExerciseSessionScreen> createState() =>
      _ExerciseSessionScreenState();
}

class _ExerciseSessionScreenState extends ConsumerState<ExerciseSessionScreen>
    with TickerProviderStateMixin {
  late final AudioService _audioService;
  late AnimationController _pulseController;
  bool _isExiting = false;

  @override
  void initState() {
    super.initState();
    _audioService = AudioService();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      _startSession();
    });
  }

  Future<void> _startSession() async {
    final sessionNotifier = ref.read(sessionProvider.notifier);
    await sessionNotifier.startSession(widget.exercise);

    if (widget.exercise.audioFile != null &&
        widget.exercise.audioFile!.isNotEmpty) {
      try {
        await _audioService.play(widget.exercise.audioFile!);
      } catch (_) {}
    }
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _audioService.stop();
    super.dispose();
  }

  void _onPauseResume() {
    final sessionNotifier = ref.read(sessionProvider.notifier);
    final state = ref.read(sessionProvider);

    if (state.status == SessionStatus.active) {
      sessionNotifier.pause();
      _audioService.pause();
      _pulseController.stop();
    } else if (state.status == SessionStatus.paused) {
      sessionNotifier.resume();
      _audioService.resume();
      _pulseController.repeat(reverse: true);
    }
  }

  Future<void> _onStop() async {
    if (_isExiting) return;

    final shouldStop = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: Theme.of(context).colorScheme.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXL),
        ),
        title: const Text('Завершить упражнение?'),
        content: const Text(
          'Вы уверены, что хотите остановить текущую сессию?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Продолжить'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            style: TextButton.styleFrom(
              foregroundColor: AppColors.stressHigh,
            ),
            child: const Text('Завершить'),
          ),
        ],
      ),
    );

    if (shouldStop == true && mounted) {
      _isExiting = true;
      await _audioService.stop();
      final sessionNotifier = ref.read(sessionProvider.notifier);
      final session = await sessionNotifier.complete();

      if (mounted && session != null) {
        context.pushReplacement(
          '/exercise/result',
          extra: session,
        );
      }
    }
  }

  void _onTimerComplete() async {
    if (_isExiting) return;
    _isExiting = true;
    await _audioService.stop();

    final sessionNotifier = ref.read(sessionProvider.notifier);
    final session = await sessionNotifier.complete();

    if (mounted && session != null) {
      context.pushReplacement(
        '/exercise/result',
        extra: session,
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final sessionState = ref.watch(sessionProvider);
    final healthState = ref.watch(healthProvider);
    final theme = Theme.of(context);
    final isBreathing = widget.exercise.type == ExerciseType.breathing;
    final isPaused = sessionState.status == SessionStatus.paused;
    final isActive = sessionState.status == SessionStatus.active;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _onStop();
      },
      child: Scaffold(
        backgroundColor: theme.colorScheme.surface,
        body: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Column(
              children: [
                _buildHeader(theme),
                const SizedBox(height: AppSpacing.xl),
                _buildExerciseTitle(theme),
                const SizedBox(height: AppSpacing.lg),
                if (isBreathing && widget.exercise.breathingPattern != null)
                  Expanded(
                    flex: 3,
                    child: _buildBreathingSection(
                      sessionState,
                      widget.exercise.breathingPattern!,
                    ),
                  )
                else
                  Expanded(
                    flex: 3,
                    child: _buildTimerSection(sessionState),
                  ),
                const SizedBox(height: AppSpacing.lg),
                _buildStressIndicator(healthState, theme),
                const SizedBox(height: AppSpacing.xl),
                _buildControls(isPaused, isActive, theme),
                const SizedBox(height: AppSpacing.lg),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const SizedBox(width: 48),
        Text(
          _formatExerciseType(widget.exercise.type),
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.6),
            letterSpacing: 1.2,
          ),
        ),
        IconButton(
          onPressed: _onStop,
          icon: Icon(
            Icons.close_rounded,
            color: theme.colorScheme.onSurface.withOpacity(0.5),
          ),
        ),
      ],
    );
  }

  Widget _buildExerciseTitle(ThemeData theme) {
    return Column(
      children: [
        Text(
          widget.exercise.name,
          style: theme.textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          widget.exercise.description,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.6),
          ),
          textAlign: TextAlign.center,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
      ],
    )
        .animate()
        .fadeIn(duration: 600.ms)
        .slideY(begin: -0.1, end: 0, duration: 600.ms);
  }

  Widget _buildBreathingSection(
    SessionState sessionState,
    BreathingPattern pattern,
  ) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Expanded(
          child: Center(
            child: BreathingAnimationWidget(
              pattern: pattern,
              isActive: sessionState.status == SessionStatus.active,
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        _buildCompactTimer(sessionState),
      ],
    );
  }

  Widget _buildTimerSection(SessionState sessionState) {
    return Center(
      child: CircularTimer(
        totalDuration: Duration(seconds: widget.exercise.durationSeconds),
        remainingDuration: sessionState.remainingTime,
        isActive: sessionState.status == SessionStatus.active,
        onComplete: _onTimerComplete,
      ),
    ).animate().fadeIn(duration: 800.ms).scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1.0, 1.0),
          duration: 800.ms,
          curve: Curves.easeOutBack,
        );
  }

  Widget _buildCompactTimer(SessionState sessionState) {
    final remaining = sessionState.remainingTime;
    final minutes = remaining.inMinutes;
    final seconds = remaining.inSeconds % 60;

    return AnimatedBuilder(
      animation: _pulseController,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg,
            vertical: AppSpacing.sm,
          ),
          decoration: BoxDecoration(
            color: Theme.of(context)
                .colorScheme
                .primaryContainer
                .withOpacity(0.3),
            borderRadius: BorderRadius.circular(AppSpacing.radiusL),
          ),
          child: Text(
            '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.w600,
                  fontFeatures: const [FontFeature.tabularFigures()],
                  color: Theme.of(context).colorScheme.primary,
                ),
          ),
        );
      },
    );
  }

  Widget _buildStressIndicator(HealthState healthState, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withOpacity(0.4),
        borderRadius: BorderRadius.circular(AppSpacing.radiusL),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.favorite_rounded,
            color: AppColors.stressColor(healthState.stressLevel),
            size: 20,
          ),
          const SizedBox(width: AppSpacing.sm),
          Text(
            'Уровень стресса',
            style: theme.textTheme.bodyMedium?.copyWith(
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          StressLevelIndicator(
            level: healthState.stressLevel,
            size: StressIndicatorSize.small,
          ),
        ],
      ),
    ).animate().fadeIn(delay: 400.ms, duration: 600.ms);
  }

  Widget _buildControls(bool isPaused, bool isActive, ThemeData theme) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Stop button
        _ControlButton(
          onPressed: _onStop,
          icon: Icons.stop_rounded,
          label: 'Стоп',
          backgroundColor: AppColors.stressHigh.withOpacity(0.1),
          iconColor: AppColors.stressHigh,
          size: 64,
        ),
        const SizedBox(width: AppSpacing.xl),
        // Pause / Resume button
        _ControlButton(
          onPressed: (isActive || isPaused) ? _onPauseResume : null,
          icon: isPaused ? Icons.play_arrow_rounded : Icons.pause_rounded,
          label: isPaused ? 'Продолжить' : 'Пауза',
          backgroundColor: theme.colorScheme.primary.withOpacity(0.1),
          iconColor: theme.colorScheme.primary,
          size: 80,
          isPrimary: true,
        ),
      ],
    ).animate().fadeIn(delay: 600.ms, duration: 600.ms).slideY(
          begin: 0.2,
          end: 0,
          delay: 600.ms,
          duration: 600.ms,
        );
  }

  String _formatExerciseType(ExerciseType type) {
    switch (type) {
      case ExerciseType.breathing:
        return 'ДЫХАНИЕ';
      case ExerciseType.meditation:
        return 'МЕДИТАЦИЯ';
      case ExerciseType.mindfulness:
        return 'ВНИМАТЕЛЬНОСТЬ';
    }
  }
}

class _ControlButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final IconData icon;
  final String label;
  final Color backgroundColor;
  final Color iconColor;
  final double size;
  final bool isPrimary;

  const _ControlButton({
    required this.onPressed,
    required this.icon,
    required this.label,
    required this.backgroundColor,
    required this.iconColor,
    this.size = 64,
    this.isPrimary = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        GestureDetector(
          onTap: onPressed,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: size,
            height: size,
            decoration: BoxDecoration(
              color: onPressed != null
                  ? backgroundColor
                  : backgroundColor.withOpacity(0.3),
              shape: BoxShape.circle,
              boxShadow: isPrimary && onPressed != null
                  ? [
                      BoxShadow(
                        color: iconColor.withOpacity(0.2),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ]
                  : null,
            ),
            child: Icon(
              icon,
              color: onPressed != null
                  ? iconColor
                  : iconColor.withOpacity(0.3),
              size: size * 0.45,
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.xs),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall?.copyWith(
                color: Theme.of(context)
                    .colorScheme
                    .onSurface
                    .withOpacity(0.6),
              ),
        ),
      ],
    );
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