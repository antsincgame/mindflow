import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/breathing_pattern.dart';
import '../services/audio_service.dart';

enum BreathingPhase {
  inhale,
  holdAfterInhale,
  exhale,
  holdAfterExhale,
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
    }
  }

  String get audioHint {
    switch (this) {
      case BreathingPhase.inhale:
        return 'breathe_in';
      case BreathingPhase.holdAfterInhale:
        return 'hold';
      case BreathingPhase.exhale:
        return 'breathe_out';
      case BreathingPhase.holdAfterExhale:
        return 'hold';
    }
  }
}

class BreathingCycleState {
  final BreathingPhase phase;
  final int currentCycle;
  final int totalCycles;
  final double phaseProgress;
  final double animationValue;
  final Duration phaseElapsed;
  final Duration phaseDuration;
  final bool isRunning;
  final bool isPaused;
  final bool isCompleted;

  const BreathingCycleState({
    this.phase = BreathingPhase.inhale,
    this.currentCycle = 0,
    this.totalCycles = 0,
    this.phaseProgress = 0.0,
    this.animationValue = 0.0,
    this.phaseElapsed = Duration.zero,
    this.phaseDuration = Duration.zero,
    this.isRunning = false,
    this.isPaused = false,
    this.isCompleted = false,
  });

  BreathingCycleState copyWith({
    BreathingPhase? phase,
    int? currentCycle,
    int? totalCycles,
    double? phaseProgress,
    double? animationValue,
    Duration? phaseElapsed,
    Duration? phaseDuration,
    bool? isRunning,
    bool? isPaused,
    bool? isCompleted,
  }) {
    return BreathingCycleState(
      phase: phase ?? this.phase,
      currentCycle: currentCycle ?? this.currentCycle,
      totalCycles: totalCycles ?? this.totalCycles,
      phaseProgress: phaseProgress ?? this.phaseProgress,
      animationValue: animationValue ?? this.animationValue,
      phaseElapsed: phaseElapsed ?? this.phaseElapsed,
      phaseDuration: phaseDuration ?? this.phaseDuration,
      isRunning: isRunning ?? this.isRunning,
      isPaused: isPaused ?? this.isPaused,
      isCompleted: isCompleted ?? this.isCompleted,
    );
  }
}

class BreathingCycleController extends ChangeNotifier {
  BreathingPattern _pattern;
  BreathingCycleState _state = const BreathingCycleState();
  Timer? _ticker;
  final AudioService? _audioService;
  final VoidCallback? onCycleComplete;
  final VoidCallback? onAllCyclesComplete;
  final void Function(BreathingPhase phase)? onPhaseChange;

  static const _tickInterval = Duration(milliseconds: 50);

  BreathingCycleController({
    required BreathingPattern pattern,
    AudioService? audioService,
    this.onCycleComplete,
    this.onAllCyclesComplete,
    this.onPhaseChange,
  })  : _pattern = pattern,
        _audioService = audioService;

  BreathingCycleState get state => _state;

  BreathingPattern get pattern => _pattern;

  void updatePattern(BreathingPattern newPattern) {
    final wasRunning = _state.isRunning && !_state.isPaused;
    stop();
    _pattern = newPattern;
    if (wasRunning) {
      start();
    }
  }

  void start() {
    _state = BreathingCycleState(
      phase: BreathingPhase.inhale,
      currentCycle: 1,
      totalCycles: _pattern.cycles,
      phaseProgress: 0.0,
      animationValue: 0.0,
      phaseElapsed: Duration.zero,
      phaseDuration: Duration(seconds: _pattern.inhaleDuration.toInt()),
      isRunning: true,
      isPaused: false,
      isCompleted: false,
    );
    notifyListeners();
    _playPhaseAudio(BreathingPhase.inhale);
    onPhaseChange?.call(BreathingPhase.inhale);
    _startTicker();
  }

  void pause() {
    if (!_state.isRunning || _state.isPaused) return;
    _ticker?.cancel();
    _ticker = null;
    _state = _state.copyWith(isPaused: true);
    notifyListeners();
  }

  void resume() {
    if (!_state.isRunning || !_state.isPaused) return;
    _state = _state.copyWith(isPaused: false);
    notifyListeners();
    _startTicker();
  }

  void stop() {
    _ticker?.cancel();
    _ticker = null;
    _state = const BreathingCycleState();
    notifyListeners();
  }

  void _startTicker() {
    _ticker?.cancel();
    _ticker = Timer.periodic(_tickInterval, (_) => _tick());
  }

  void _tick() {
    if (_state.isPaused || !_state.isRunning) return;

    final newElapsed = _state.phaseElapsed + _tickInterval;
    final phaseDurationMs = _getPhaseDurationMs(_state.phase);
    final progress = (newElapsed.inMilliseconds / phaseDurationMs).clamp(0.0, 1.0);
    final animValue = _calculateAnimationValue(_state.phase, progress);

    if (newElapsed.inMilliseconds >= phaseDurationMs) {
      _advancePhase();
    } else {
      _state = _state.copyWith(
        phaseElapsed: newElapsed,
        phaseProgress: progress,
        animationValue: animValue,
      );
      notifyListeners();
    }
  }

  double _getPhaseDurationMs(BreathingPhase phase) {
    switch (phase) {
      case BreathingPhase.inhale:
        return _pattern.inhaleDuration * 1000;
      case BreathingPhase.holdAfterInhale:
        return _pattern.holdDuration * 1000;
      case BreathingPhase.exhale:
        return _pattern.exhaleDuration * 1000;
      case BreathingPhase.holdAfterExhale:
        return _pattern.holdAfterExhaleDuration * 1000;
    }
  }

  double _calculateAnimationValue(BreathingPhase phase, double progress) {
    switch (phase) {
      case BreathingPhase.inhale:
        return _easeInOutCubic(progress);
      case BreathingPhase.holdAfterInhale:
        return 1.0;
      case BreathingPhase.exhale:
        return 1.0 - _easeInOutCubic(progress);
      case BreathingPhase.holdAfterExhale:
        return 0.0;
    }
  }

  double _easeInOutCubic(double t) {
    return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) * (-2 * t + 2) * (-2 * t + 2)) / 2;
  }

  void _advancePhase() {
    final nextPhase = _getNextPhase(_state.phase);

    if (nextPhase == null) {
      if (_state.currentCycle >= _pattern.cycles) {
        _ticker?.cancel();
        _ticker = null;
        _state = _state.copyWith(
          isRunning: false,
          isCompleted: true,
          phaseProgress: 1.0,
          animationValue: _state.phase == BreathingPhase.exhale ||
                  _state.phase == BreathingPhase.holdAfterExhale
              ? 0.0
              : 1.0,
        );
        notifyListeners();
        onCycleComplete?.call();
        onAllCyclesComplete?.call();
        return;
      } else {
        onCycleComplete?.call();
        final newCycle = _state.currentCycle + 1;
        _state = _state.copyWith(
          phase: BreathingPhase.inhale,
          currentCycle: newCycle,
          phaseElapsed: Duration.zero,
          phaseProgress: 0.0,
          animationValue: 0.0,
          phaseDuration: Duration(seconds: _pattern.inhaleDuration.toInt()),
        );
        notifyListeners();
        _playPhaseAudio(BreathingPhase.inhale);
        onPhaseChange?.call(BreathingPhase.inhale);
        return;
      }
    }

    final nextPhaseDurationMs = _getPhaseDurationMs(nextPhase);
    if (nextPhaseDurationMs <= 0) {
      _state = _state.copyWith(
        phase: nextPhase,
        phaseElapsed: Duration.zero,
        phaseProgress: 1.0,
      );
      _advancePhase();
      return;
    }

    _state = _state.copyWith(
      phase: nextPhase,
      phaseElapsed: Duration.zero,
      phaseProgress: 0.0,
      animationValue: _calculateAnimationValue(nextPhase, 0.0),
      phaseDuration: Duration(milliseconds: nextPhaseDurationMs.toInt()),
    );
    notifyListeners();
    _playPhaseAudio(nextPhase);
    onPhaseChange?.call(nextPhase);
  }

  BreathingPhase? _getNextPhase(BreathingPhase current) {
    switch (current) {
      case BreathingPhase.inhale:
        if (_pattern.holdDuration > 0) {
          return BreathingPhase.holdAfterInhale;
        }
        return BreathingPhase.exhale;
      case BreathingPhase.holdAfterInhale:
        return BreathingPhase.exhale;
      case BreathingPhase.exhale:
        if (_pattern.holdAfterExhaleDuration > 0) {
          return BreathingPhase.holdAfterExhale;
        }
        return null;
      case BreathingPhase.holdAfterExhale:
        return null;
    }
  }

  void _playPhaseAudio(BreathingPhase phase) {
    try {
      _audioService?.playHint(phase.audioHint);
    } catch (_) {}
  }

  Duration get totalDuration {
    final cycleDurationSec = _pattern.inhaleDuration +
        _pattern.holdDuration +
        _pattern.exhaleDuration +
        _pattern.holdAfterExhaleDuration;
    return Duration(
      milliseconds: (cycleDurationSec * 1000 * _pattern.cycles).toInt(),
    );
  }

  Duration get elapsed {
    if (!_state.isRunning && !_state.isCompleted) return Duration.zero;

    final cycleDurationMs = (_pattern.inhaleDuration +
            _pattern.holdDuration +
            _pattern.exhaleDuration +
            _pattern.holdAfterExhaleDuration) *
        1000;

    final completedCyclesMs = (_state.currentCycle - 1) * cycleDurationMs;

    double currentCycleElapsedMs = 0;
    switch (_state.phase) {
      case BreathingPhase.inhale:
        currentCycleElapsedMs = _state.phaseElapsed.inMilliseconds.toDouble();
        break;
      case BreathingPhase.holdAfterInhale:
        currentCycleElapsedMs = _pattern.inhaleDuration * 1000 +
            _state.phaseElapsed.inMilliseconds;
        break;
      case BreathingPhase.exhale:
        currentCycleElapsedMs = (_pattern.inhaleDuration + _pattern.holdDuration) * 1000 +
            _state.phaseElapsed.inMilliseconds;
        break;
      case BreathingPhase.holdAfterExhale:
        currentCycleElapsedMs =
            (_pattern.inhaleDuration + _pattern.holdDuration + _pattern.exhaleDuration) * 1000 +
                _state.phaseElapsed.inMilliseconds;
        break;
    }

    return Duration(
      milliseconds: (completedCyclesMs + currentCycleElapsedMs).toInt(),
    );
  }

  Duration get remaining => totalDuration - elapsed;

  @override
  void dispose() {
    _ticker?.cancel();
    _ticker = null;
    super.dispose();
  }
}

final breathingCycleControllerProvider =
    ChangeNotifierProvider.autoDispose.family<BreathingCycleController, BreathingPattern>(
  (ref, pattern) {
    final controller = BreathingCycleController(
      pattern: pattern,
    );
    ref.onDispose(() => controller.dispose());
    return controller;
  },
);