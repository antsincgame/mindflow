import 'dart:async';

import 'package:flutter/foundation.dart';

enum TimerState {
  idle,
  running,
  paused,
  completed,
}

class TimerController extends ChangeNotifier {
  TimerState _state = TimerState.idle;
  int _totalDurationSeconds = 0;
  int _remainingSeconds = 0;
  Timer? _timer;
  VoidCallback? _onComplete;
  ValueChanged<int>? _onTick;

  TimerState get state => _state;
  int get totalDurationSeconds => _totalDurationSeconds;
  int get remainingSeconds => _remainingSeconds;
  int get elapsedSeconds => _totalDurationSeconds - _remainingSeconds;
  bool get isRunning => _state == TimerState.running;
  bool get isPaused => _state == TimerState.paused;
  bool get isCompleted => _state == TimerState.completed;
  bool get isIdle => _state == TimerState.idle;

  double get progress {
    if (_totalDurationSeconds == 0) return 0.0;
    return (_totalDurationSeconds - _remainingSeconds) / _totalDurationSeconds;
  }

  String get formattedRemaining => _formatTime(_remainingSeconds);
  String get formattedElapsed => _formatTime(elapsedSeconds);
  String get formattedTotal => _formatTime(_totalDurationSeconds);

  void configure({
    required int durationSeconds,
    VoidCallback? onComplete,
    ValueChanged<int>? onTick,
  }) {
    _totalDurationSeconds = durationSeconds;
    _remainingSeconds = durationSeconds;
    _onComplete = onComplete;
    _onTick = onTick;
    _state = TimerState.idle;
    notifyListeners();
  }

  void start() {
    if (_state == TimerState.running) return;

    if (_state == TimerState.completed || _state == TimerState.idle) {
      _remainingSeconds = _totalDurationSeconds;
    }

    _state = TimerState.running;
    _startInternalTimer();
    notifyListeners();
  }

  void pause() {
    if (_state != TimerState.running) return;

    _timer?.cancel();
    _timer = null;
    _state = TimerState.paused;
    notifyListeners();
  }

  void resume() {
    if (_state != TimerState.paused) return;

    _state = TimerState.running;
    _startInternalTimer();
    notifyListeners();
  }

  void togglePauseResume() {
    if (_state == TimerState.running) {
      pause();
    } else if (_state == TimerState.paused) {
      resume();
    }
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _state = TimerState.completed;
    notifyListeners();
  }

  void reset() {
    _timer?.cancel();
    _timer = null;
    _remainingSeconds = _totalDurationSeconds;
    _state = TimerState.idle;
    notifyListeners();
  }

  void restart() {
    _timer?.cancel();
    _timer = null;
    _remainingSeconds = _totalDurationSeconds;
    _state = TimerState.running;
    _startInternalTimer();
    notifyListeners();
  }

  void addTime(int seconds) {
    _totalDurationSeconds += seconds;
    _remainingSeconds += seconds;
    if (_remainingSeconds < 0) {
      _remainingSeconds = 0;
    }
    notifyListeners();
  }

  void _startInternalTimer() {
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_remainingSeconds > 0) {
        _remainingSeconds--;
        _onTick?.call(_remainingSeconds);
        notifyListeners();

        if (_remainingSeconds == 0) {
          _timer?.cancel();
          _timer = null;
          _state = TimerState.completed;
          _onComplete?.call();
          notifyListeners();
        }
      }
    });
  }

  String _formatTime(int totalSeconds) {
    final minutes = totalSeconds ~/ 60;
    final seconds = totalSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  @override
  void dispose() {
    _timer?.cancel();
    _timer = null;
    super.dispose();
  }
}

TimerController useTimer({
  required int durationSeconds,
  VoidCallback? onComplete,
  ValueChanged<int>? onTick,
}) {
  final controller = TimerController();
  controller.configure(
    durationSeconds: durationSeconds,
    onComplete: onComplete,
    onTick: onTick,
  );
  return controller;
}