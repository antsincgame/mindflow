import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';
import 'package:uuid/uuid.dart';

import '../models/exercise.dart';
import '../models/session.dart';
import '../models/biometric_data.dart';
import '../services/database_service.dart';
import '../services/achievement_service.dart';
import '../services/health_service.dart';

part 'session_provider.g.dart';

enum SessionStatus {
  idle,
  preparing,
  active,
  paused,
  completed,
}

class SessionState {
  final SessionStatus status;
  final Exercise? currentExercise;
  final String? sessionId;
  final int remainingSeconds;
  final int totalSeconds;
  final int elapsedSeconds;
  final int? stressBefore;
  final int? stressAfter;
  final int? heartRateBefore;
  final int? heartRateAfter;
  final String? selectedEmotionId;
  final DateTime? startTime;
  final DateTime? endTime;
  final int currentBreathingPhaseIndex;
  final String? currentBreathingPhaseLabel;
  final String? errorMessage;

  const SessionState({
    this.status = SessionStatus.idle,
    this.currentExercise,
    this.sessionId,
    this.remainingSeconds = 0,
    this.totalSeconds = 0,
    this.elapsedSeconds = 0,
    this.stressBefore,
    this.stressAfter,
    this.heartRateBefore,
    this.heartRateAfter,
    this.selectedEmotionId,
    this.startTime,
    this.endTime,
    this.currentBreathingPhaseIndex = 0,
    this.currentBreathingPhaseLabel,
    this.errorMessage,
  });

  double get progress {
    if (totalSeconds == 0) return 0.0;
    return elapsedSeconds / totalSeconds;
  }

  bool get isRunning => status == SessionStatus.active;
  bool get isPaused => status == SessionStatus.paused;
  bool get isCompleted => status == SessionStatus.completed;
  bool get isIdle => status == SessionStatus.idle;
  bool get isPreparing => status == SessionStatus.preparing;

  String get formattedRemainingTime {
    final minutes = remainingSeconds ~/ 60;
    final seconds = remainingSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  String get formattedElapsedTime {
    final minutes = elapsedSeconds ~/ 60;
    final seconds = elapsedSeconds % 60;
    return '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';
  }

  SessionState copyWith({
    SessionStatus? status,
    Exercise? currentExercise,
    String? sessionId,
    int? remainingSeconds,
    int? totalSeconds,
    int? elapsedSeconds,
    int? stressBefore,
    int? stressAfter,
    int? heartRateBefore,
    int? heartRateAfter,
    String? selectedEmotionId,
    DateTime? startTime,
    DateTime? endTime,
    int? currentBreathingPhaseIndex,
    String? currentBreathingPhaseLabel,
    String? errorMessage,
    bool clearExercise = false,
    bool clearError = false,
    bool clearEndTime = false,
  }) {
    return SessionState(
      status: status ?? this.status,
      currentExercise: clearExercise ? null : (currentExercise ?? this.currentExercise),
      sessionId: sessionId ?? this.sessionId,
      remainingSeconds: remainingSeconds ?? this.remainingSeconds,
      totalSeconds: totalSeconds ?? this.totalSeconds,
      elapsedSeconds: elapsedSeconds ?? this.elapsedSeconds,
      stressBefore: stressBefore ?? this.stressBefore,
      stressAfter: stressAfter ?? this.stressAfter,
      heartRateBefore: heartRateBefore ?? this.heartRateBefore,
      heartRateAfter: heartRateAfter ?? this.heartRateAfter,
      selectedEmotionId: selectedEmotionId ?? this.selectedEmotionId,
      startTime: startTime ?? this.startTime,
      endTime: clearEndTime ? null : (endTime ?? this.endTime),
      currentBreathingPhaseIndex: currentBreathingPhaseIndex ?? this.currentBreathingPhaseIndex,
      currentBreathingPhaseLabel: currentBreathingPhaseLabel ?? this.currentBreathingPhaseLabel,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }
}

class SessionNotifier extends StateNotifier<SessionState> {
  final DatabaseService _databaseService;
  final AchievementService _achievementService;
  final HealthService _healthService;

  Timer? _timer;
  static const _uuid = Uuid();
  static const int _preparingCountdown = 3;

  SessionNotifier({
    required DatabaseService databaseService,
    required AchievementService achievementService,
    required HealthService healthService,
  })  : _databaseService = databaseService,
        _achievementService = achievementService,
        _healthService = healthService,
        super(const SessionState());

  Future<void> prepareSession({
    required Exercise exercise,
    String? emotionId,
  }) async {
    _cancelTimer();

    final sessionId = _uuid.v4();

    int? heartRate;
    int? stressLevel;

    try {
      final biometricData = await _healthService.getCurrentBiometricData();
      if (biometricData != null) {
        heartRate = biometricData.heartRate?.toInt();
        stressLevel = biometricData.stressLevel?.toInt();
      }
    } catch (_) {}

    state = SessionState(
      status: SessionStatus.preparing,
      currentExercise: exercise,
      sessionId: sessionId,
      remainingSeconds: exercise.durationSeconds,
      totalSeconds: exercise.durationSeconds,
      elapsedSeconds: 0,
      stressBefore: stressLevel,
      heartRateBefore: heartRate,
      selectedEmotionId: emotionId,
    );

    int countdown = _preparingCountdown;
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      countdown--;
      if (countdown <= 0) {
        timer.cancel();
        _startSession();
      }
    });
  }

  void _startSession() {
    _cancelTimer();

    state = state.copyWith(
      status: SessionStatus.active,
      startTime: DateTime.now(),
      clearError: true,
    );

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _onTick();
    });
  }

  void startImmediately() {
    if (state.status == SessionStatus.preparing) {
      _cancelTimer();
      _startSession();
    }
  }

  void _onTick() {
    final newElapsed = state.elapsedSeconds + 1;
    final newRemaining = state.totalSeconds - newElapsed;

    if (newRemaining <= 0) {
      state = state.copyWith(
        elapsedSeconds: state.totalSeconds,
        remainingSeconds: 0,
      );
      _completeSession();
      return;
    }

    state = state.copyWith(
      elapsedSeconds: newElapsed,
      remainingSeconds: newRemaining,
    );
  }

  void pause() {
    if (state.status != SessionStatus.active) return;
    _cancelTimer();
    state = state.copyWith(status: SessionStatus.paused);
  }

  void resume() {
    if (state.status != SessionStatus.paused) return;

    state = state.copyWith(status: SessionStatus.active);

    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      _onTick();
    });
  }

  void togglePause() {
    if (state.isRunning) {
      pause();
    } else if (state.isPaused) {
      resume();
    }
  }

  Future<void> stop() async {
    if (state.status == SessionStatus.idle ||
        state.status == SessionStatus.completed) return;

    await _completeSession(wasStopped: true);
  }

  Future<void> _completeSession({bool wasStopped = false}) async {
    _cancelTimer();

    final endTime = DateTime.now();

    int? heartRateAfter;
    int? stressAfter;

    try {
      final biometricData = await _healthService.getCurrentBiometricData();
      if (biometricData != null) {
        heartRateAfter = biometricData.heartRate?.toInt();
        stressAfter = biometricData.stressLevel?.toInt();
      }
    } catch (_) {}

    state = state.copyWith(
      status: SessionStatus.completed,
      endTime: endTime,
      stressAfter: stressAfter,
      heartRateAfter: heartRateAfter,
    );

    await _saveSession(wasStopped: wasStopped);
  }

  Future<void> _saveSession({bool wasStopped = false}) async {
    if (state.currentExercise == null || state.sessionId == null) return;

    final session = Session(
      id: state.sessionId!,
      exerciseId: state.currentExercise!.id,
      emotionId: state.selectedEmotionId,
      startTime: state.startTime ?? DateTime.now(),
      endTime: state.endTime ?? DateTime.now(),
      durationSeconds: state.elapsedSeconds,
      stressBefore: state.stressBefore,
      stressAfter: state.stressAfter,
      heartRateBefore: state.heartRateBefore,
      heartRateAfter: state.heartRateAfter,
      completed: !wasStopped,
    );

    try {
      await _databaseService.insertSession(session);
      await _achievementService.checkAndUnlockAchievements(session);
    } catch (e) {
      state = state.copyWith(
        errorMessage: 'Failed to save session: $e',
      );
    }
  }

  void updateBreathingPhase({
    required int phaseIndex,
    required String phaseLabel,
  }) {
    state = state.copyWith(
      currentBreathingPhaseIndex: phaseIndex,
      currentBreathingPhaseLabel: phaseLabel,
    );
  }

  void reset() {
    _cancelTimer();
    state = const SessionState();
  }

  void _cancelTimer() {
    _timer?.cancel();
    _timer = null;
  }

  @override
  void dispose() {
    _cancelTimer();
    super.dispose();
  }
}

final databaseServiceProvider = Provider<DatabaseService>((ref) {
  return DatabaseService.instance;
});

final achievementServiceProvider = Provider<AchievementService>((ref) {
  final dbService = ref.watch(databaseServiceProvider);
  return AchievementService(databaseService: dbService);
});

final healthServiceProvider = Provider<HealthService>((ref) {
  return HealthService();
});

final sessionProvider =
    StateNotifierProvider<SessionNotifier, SessionState>((ref) {
  final databaseService = ref.watch(databaseServiceProvider);
  final achievementService = ref.watch(achievementServiceProvider);
  final healthService = ref.watch(healthServiceProvider);

  return SessionNotifier(
    databaseService: databaseService,
    achievementService: achievementService,
    healthService: healthService,
  );
});

final isSessionActiveProvider = Provider<bool>((ref) {
  final session = ref.watch(sessionProvider);
  return session.status == SessionStatus.active ||
      session.status == SessionStatus.paused;
});

final sessionProgressProvider = Provider<double>((ref) {
  final session = ref.watch(sessionProvider);
  return session.progress;
});

final sessionRemainingTimeProvider = Provider<String>((ref) {
  final session = ref.watch(sessionProvider);
  return session.formattedRemainingTime;
});

final sessionStressChangeProvider = Provider<int?>((ref) {
  final session = ref.watch(sessionProvider);
  if (session.stressBefore != null && session.stressAfter != null) {
    return session.stressAfter! - session.stressBefore!;
  }
  return null;
});