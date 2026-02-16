import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/biometric_data.dart';
import '../services/health_service.dart';
import '../services/stress_analysis_service.dart';

part 'health_provider.g.dart';

enum HealthPermissionStatus {
  unknown,
  granted,
  denied,
  notDetermined,
  restricted,
}

class HealthState {
  final BiometricData? currentBiometrics;
  final int stressLevel;
  final HealthPermissionStatus permissionStatus;
  final Map<String, bool> dataPermissions;
  final bool isLoading;
  final String? error;
  final DateTime? lastUpdated;

  const HealthState({
    this.currentBiometrics,
    this.stressLevel = 0,
    this.permissionStatus = HealthPermissionStatus.unknown,
    this.dataPermissions = const {},
    this.isLoading = false,
    this.error,
    this.lastUpdated,
  });

  HealthState copyWith({
    BiometricData? currentBiometrics,
    int? stressLevel,
    HealthPermissionStatus? permissionStatus,
    Map<String, bool>? dataPermissions,
    bool? isLoading,
    String? error,
    DateTime? lastUpdated,
  }) {
    return HealthState(
      currentBiometrics: currentBiometrics ?? this.currentBiometrics,
      stressLevel: stressLevel ?? this.stressLevel,
      permissionStatus: permissionStatus ?? this.permissionStatus,
      dataPermissions: dataPermissions ?? this.dataPermissions,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      lastUpdated: lastUpdated ?? this.lastUpdated,
    );
  }

  bool get hasHeartRatePermission => dataPermissions['heart_rate'] ?? false;
  bool get hasSleepPermission => dataPermissions['sleep'] ?? false;
  bool get hasActivityPermission => dataPermissions['activity'] ?? false;
  bool get hasRespiratoryPermission => dataPermissions['respiratory_rate'] ?? false;
  bool get hasHrvPermission => dataPermissions['hrv'] ?? false;

  bool get hasAnyPermission => dataPermissions.values.any((v) => v);
  bool get hasAllPermissions => dataPermissions.isNotEmpty && dataPermissions.values.every((v) => v);

  String get stressLevelLabel {
    if (stressLevel <= 25) return 'Низкий';
    if (stressLevel <= 50) return 'Умеренный';
    if (stressLevel <= 75) return 'Повышенный';
    return 'Высокий';
  }
}

@riverpod
class HealthNotifier extends _$HealthNotifier {
  late final HealthService _healthService;
  late final StressAnalysisService _stressAnalysisService;

  @override
  HealthState build() {
    _healthService = ref.read(healthServiceProvider);
    _stressAnalysisService = ref.read(stressAnalysisServiceProvider);
    _initialize();
    return const HealthState(isLoading: true);
  }

  Future<void> _initialize() async {
    try {
      final permissionStatus = await _healthService.checkPermissionStatus();
      final dataPermissions = await _healthService.getDataPermissions();

      state = state.copyWith(
        permissionStatus: _mapPermissionStatus(permissionStatus),
        dataPermissions: dataPermissions,
        isLoading: false,
      );

      if (state.hasAnyPermission) {
        await refreshBiometrics();
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Не удалось инициализировать данные здоровья: $e',
      );
    }
  }

  Future<bool> requestPermissions({
    bool heartRate = true,
    bool sleep = true,
    bool activity = true,
    bool respiratoryRate = true,
    bool hrv = true,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final granted = await _healthService.requestPermissions(
        heartRate: heartRate,
        sleep: sleep,
        activity: activity,
        respiratoryRate: respiratoryRate,
        hrv: hrv,
      );

      final dataPermissions = await _healthService.getDataPermissions();

      state = state.copyWith(
        permissionStatus: granted
            ? HealthPermissionStatus.granted
            : HealthPermissionStatus.denied,
        dataPermissions: dataPermissions,
        isLoading: false,
      );

      if (granted) {
        await refreshBiometrics();
      }

      return granted;
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Не удалось запросить разрешения: $e',
      );
      return false;
    }
  }

  Future<void> updateDataPermission(String dataType, bool enabled) async {
    try {
      if (enabled) {
        await _healthService.requestSinglePermission(dataType);
      }

      final updatedPermissions = Map<String, bool>.from(state.dataPermissions);
      updatedPermissions[dataType] = enabled;

      state = state.copyWith(dataPermissions: updatedPermissions);

      if (enabled) {
        await refreshBiometrics();
      }
    } catch (e) {
      state = state.copyWith(
        error: 'Не удалось обновить разрешение для $dataType: $e',
      );
    }
  }

  Future<void> refreshBiometrics() async {
    if (!state.hasAnyPermission) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final biometrics = await _healthService.fetchCurrentBiometrics(
        includeHeartRate: state.hasHeartRatePermission,
        includeSleep: state.hasSleepPermission,
        includeActivity: state.hasActivityPermission,
        includeRespiratoryRate: state.hasRespiratoryPermission,
        includeHrv: state.hasHrvPermission,
      );

      final stressLevel = _stressAnalysisService.calculateStressLevel(
        biometricData: biometrics,
      );

      state = state.copyWith(
        currentBiometrics: biometrics,
        stressLevel: stressLevel,
        isLoading: false,
        lastUpdated: DateTime.now(),
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Не удалось загрузить биометрические данные: $e',
      );
    }
  }

  Future<int> getStressLevelWithEmotion(String emotionId) async {
    if (state.currentBiometrics == null) {
      return _stressAnalysisService.calculateStressFromEmotion(emotionId);
    }

    return _stressAnalysisService.calculateStressLevel(
      biometricData: state.currentBiometrics!,
      emotionId: emotionId,
    );
  }

  Future<List<BiometricData>> getBiometricHistory({
    required DateTime from,
    required DateTime to,
  }) async {
    try {
      return await _healthService.fetchBiometricHistory(from: from, to: to);
    } catch (e) {
      state = state.copyWith(
        error: 'Не удалось загрузить историю биометрики: $e',
      );
      return [];
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  HealthPermissionStatus _mapPermissionStatus(String status) {
    switch (status) {
      case 'granted':
        return HealthPermissionStatus.granted;
      case 'denied':
        return HealthPermissionStatus.denied;
      case 'restricted':
        return HealthPermissionStatus.restricted;
      case 'not_determined':
        return HealthPermissionStatus.notDetermined;
      default:
        return HealthPermissionStatus.unknown;
    }
  }
}

final healthServiceProvider = Provider<HealthService>((ref) {
  return HealthService();
});

final stressAnalysisServiceProvider = Provider<StressAnalysisService>((ref) {
  return StressAnalysisService();
});

final currentStressLevelProvider = Provider<int>((ref) {
  final healthState = ref.watch(healthNotifierProvider);
  return healthState.stressLevel;
});

final currentHeartRateProvider = Provider<double?>((ref) {
  final healthState = ref.watch(healthNotifierProvider);
  return healthState.currentBiometrics?.heartRate;
});

final currentSleepQualityProvider = Provider<double?>((ref) {
  final healthState = ref.watch(healthNotifierProvider);
  return healthState.currentBiometrics?.sleepQuality;
});

final healthPermissionStatusProvider = Provider<HealthPermissionStatus>((ref) {
  final healthState = ref.watch(healthNotifierProvider);
  return healthState.permissionStatus;
});

final hasHealthPermissionsProvider = Provider<bool>((ref) {
  final healthState = ref.watch(healthNotifierProvider);
  return healthState.hasAnyPermission;
});

final biometricHistoryProvider = FutureProvider.family<List<BiometricData>, ({DateTime from, DateTime to})>(
  (ref, params) async {
    final notifier = ref.read(healthNotifierProvider.notifier);
    return notifier.getBiometricHistory(from: params.from, to: params.to);
  },
);