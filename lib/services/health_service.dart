import 'dart:async';

import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/biometric_data.dart';
import '../services/database_service.dart';
import '../utils/constants.dart';

enum HealthPermissionStatus {
  notDetermined,
  authorized,
  denied,
  unavailable,
}

enum BiometricType {
  heartRate,
  hrv,
  sleepQuality,
  activityLevel,
  respiratoryRate,
}

class HealthService {
  HealthService._();
  static final HealthService instance = HealthService._();

  static const MethodChannel _channel = MethodChannel(Constants.healthKitChannelName);

  final DatabaseService _db = DatabaseService.instance;

  final Map<BiometricType, bool> _permissions = {
    BiometricType.heartRate: false,
    BiometricType.hrv: false,
    BiometricType.sleepQuality: false,
    BiometricType.activityLevel: false,
    BiometricType.respiratoryRate: false,
  };

  BiometricData? _cachedLatestData;
  DateTime? _lastFetchTime;

  static const Duration _cacheDuration = Duration(minutes: 5);

  final StreamController<BiometricData> _biometricStreamController =
      StreamController<BiometricData>.broadcast();

  Stream<BiometricData> get biometricStream => _biometricStreamController.stream;

  Map<BiometricType, bool> get permissions => Map.unmodifiable(_permissions);

  Future<void> initialize() async {
    _channel.setMethodCallHandler(_handleMethodCall);
    await _loadPermissionsFromDb();
  }

  Future<void> _loadPermissionsFromDb() async {
    try {
      final prefs = await _db.getUserPreferences();
      if (prefs != null && prefs.biometricPermissions != null) {
        for (final entry in prefs.biometricPermissions!.entries) {
          final type = _biometricTypeFromString(entry.key);
          if (type != null) {
            _permissions[type] = entry.value;
          }
        }
      }
    } catch (_) {}
  }

  Future<dynamic> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onBiometricDataUpdate':
        final data = _parseBiometricData(call.arguments as Map<dynamic, dynamic>);
        _cachedLatestData = data;
        _lastFetchTime = DateTime.now();
        _biometricStreamController.add(data);
        await _cacheBiometricData(data);
        return null;
      default:
        throw MissingPluginException('Method ${call.method} not implemented');
    }
  }

  Future<HealthPermissionStatus> requestPermission(BiometricType type) async {
    try {
      final result = await _channel.invokeMethod<String>(
        'requestPermission',
        {'type': _biometricTypeToString(type)},
      );

      final status = _parsePermissionStatus(result);
      _permissions[type] = status == HealthPermissionStatus.authorized;

      await _savePermissionsToDb();

      return status;
    } on PlatformException catch (e) {
      if (e.code == 'UNAVAILABLE') {
        return HealthPermissionStatus.unavailable;
      }
      return HealthPermissionStatus.denied;
    } catch (_) {
      return HealthPermissionStatus.unavailable;
    }
  }

  Future<Map<BiometricType, HealthPermissionStatus>> requestAllPermissions() async {
    final results = <BiometricType, HealthPermissionStatus>{};

    for (final type in BiometricType.values) {
      results[type] = await requestPermission(type);
    }

    return results;
  }

  Future<HealthPermissionStatus> checkPermission(BiometricType type) async {
    try {
      final result = await _channel.invokeMethod<String>(
        'checkPermission',
        {'type': _biometricTypeToString(type)},
      );
      final status = _parsePermissionStatus(result);
      _permissions[type] = status == HealthPermissionStatus.authorized;
      return status;
    } on PlatformException {
      return HealthPermissionStatus.unavailable;
    } catch (_) {
      return HealthPermissionStatus.unavailable;
    }
  }

  Future<BiometricData?> getLatestBiometricData({bool forceRefresh = false}) async {
    if (!forceRefresh &&
        _cachedLatestData != null &&
        _lastFetchTime != null &&
        DateTime.now().difference(_lastFetchTime!) < _cacheDuration) {
      return _cachedLatestData;
    }

    try {
      final rawData = await _channel.invokeMethod<Map<dynamic, dynamic>>(
        'getLatestBiometricData',
        {
          'permissions': _permissions.entries
              .where((e) => e.value)
              .map((e) => _biometricTypeToString(e.key))
              .toList(),
        },
      );

      if (rawData != null) {
        final data = _parseBiometricData(rawData);
        _cachedLatestData = data;
        _lastFetchTime = DateTime.now();
        await _cacheBiometricData(data);
        return data;
      }
    } on PlatformException {
      // Fall through to cached data
    } catch (_) {
      // Fall through to cached data
    }

    return await _getCachedBiometricData();
  }

  Future<double?> getHeartRate() async {
    if (!_permissions[BiometricType.heartRate]!) {
      return _getCachedValue('heart_rate');
    }

    try {
      final result = await _channel.invokeMethod<double>('getHeartRate');
      if (result != null) {
        await _cacheValue('heart_rate', result);
      }
      return result;
    } on PlatformException {
      return _getCachedValue('heart_rate');
    }
  }

  Future<double?> getHRV() async {
    if (!_permissions[BiometricType.hrv]!) {
      return _getCachedValue('hrv');
    }

    try {
      final result = await _channel.invokeMethod<double>('getHRV');
      if (result != null) {
        await _cacheValue('hrv', result);
      }
      return result;
    } on PlatformException {
      return _getCachedValue('hrv');
    }
  }

  Future<double?> getSleepQuality() async {
    if (!_permissions[BiometricType.sleepQuality]!) {
      return _getCachedValue('sleep_quality');
    }

    try {
      final result = await _channel.invokeMethod<double>('getSleepQuality');
      if (result != null) {
        await _cacheValue('sleep_quality', result);
      }
      return result;
    } on PlatformException {
      return _getCachedValue('sleep_quality');
    }
  }

  Future<double?> getActivityLevel() async {
    if (!_permissions[BiometricType.activityLevel]!) {
      return _getCachedValue('activity_level');
    }

    try {
      final result = await _channel.invokeMethod<double>('getActivityLevel');
      if (result != null) {
        await _cacheValue('activity_level', result);
      }
      return result;
    } on PlatformException {
      return _getCachedValue('activity_level');
    }
  }

  Future<double?> getRespiratoryRate() async {
    if (!_permissions[BiometricType.respiratoryRate]!) {
      return _getCachedValue('respiratory_rate');
    }

    try {
      final result = await _channel.invokeMethod<double>('getRespiratoryRate');
      if (result != null) {
        await _cacheValue('respiratory_rate', result);
      }
      return result;
    } on PlatformException {
      return _getCachedValue('respiratory_rate');
    }
  }

  Future<List<BiometricData>> getBiometricHistory({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      final rawList = await _channel.invokeMethod<List<dynamic>>(
        'getBiometricHistory',
        {
          'startDate': startDate.toIso8601String(),
          'endDate': endDate.toIso8601String(),
          'permissions': _permissions.entries
              .where((e) => e.value)
              .map((e) => _biometricTypeToString(e.key))
              .toList(),
        },
      );

      if (rawList != null) {
        final dataList = rawList
            .cast<Map<dynamic, dynamic>>()
            .map(_parseBiometricData)
            .toList();

        for (final data in dataList) {
          await _cacheBiometricData(data);
        }

        return dataList;
      }
    } on PlatformException {
      // Fall through to cached
    } catch (_) {
      // Fall through to cached
    }

    return _getCachedBiometricHistory(startDate: startDate, endDate: endDate);
  }

  Future<void> startRealtimeMonitoring() async {
    try {
      await _channel.invokeMethod<void>('startRealtimeMonitoring', {
        'permissions': _permissions.entries
            .where((e) => e.value)
            .map((e) => _biometricTypeToString(e.key))
            .toList(),
      });
    } on PlatformException {
      // Silently fail — monitoring is optional
    }
  }

  Future<void> stopRealtimeMonitoring() async {
    try {
      await _channel.invokeMethod<void>('stopRealtimeMonitoring');
    } on PlatformException {
      // Silently fail
    }
  }

  Future<bool> isHealthKitAvailable() async {
    try {
      final result = await _channel.invokeMethod<bool>('isHealthKitAvailable');
      return result ?? false;
    } on PlatformException {
      return false;
    } catch (_) {
      return false;
    }
  }

  // --- Caching helpers ---

  Future<void> _cacheBiometricData(BiometricData data) async {
    try {
      await _db.insertBiometricData(data);
    } catch (_) {}
  }

  Future<BiometricData?> _getCachedBiometricData() async {
    try {
      return await _db.getLatestBiometricData();
    } catch (_) {
      return null;
    }
  }

  Future<List<BiometricData>> _getCachedBiometricHistory({
    required DateTime startDate,
    required DateTime endDate,
  }) async {
    try {
      return await _db.getBiometricDataRange(
        startDate: startDate,
        endDate: endDate,
      );
    } catch (_) {
      return [];
    }
  }

  Future<void> _cacheValue(String key, double value) async {
    try {
      await _db.cacheBiometricValue(key, value, DateTime.now());
    } catch (_) {}
  }

  Future<double?> _getCachedValue(String key) async {
    try {
      return await _db.getCachedBiometricValue(key);
    } catch (_) {
      return null;
    }
  }

  Future<void> _savePermissionsToDb() async {
    try {
      final permMap = <String, bool>{};
      for (final entry in _permissions.entries) {
        permMap[_biometricTypeToString(entry.key)] = entry.value;
      }
      await _db.updateBiometricPermissions(permMap);
    } catch (_) {}
  }

  // --- Parsing helpers ---

  BiometricData _parseBiometricData(Map<dynamic, dynamic> raw) {
    return BiometricData(
      timestamp: raw['timestamp'] != null
          ? DateTime.parse(raw['timestamp'] as String)
          : DateTime.now(),
      heartRate: (raw['heart_rate'] as num?)?.toDouble(),
      hrv: (raw['hrv'] as num?)?.toDouble(),
      sleepQuality: (raw['sleep_quality'] as num?)?.toDouble(),
      activityLevel: (raw['activity_level'] as num?)?.toDouble(),
      respiratoryRate: (raw['respiratory_rate'] as num?)?.toDouble(),
      stressLevel: (raw['stress_level'] as num?)?.toDouble(),
    );
  }

  HealthPermissionStatus _parsePermissionStatus(String? status) {
    switch (status) {
      case 'authorized':
        return HealthPermissionStatus.authorized;
      case 'denied':
        return HealthPermissionStatus.denied;
      case 'unavailable':
        return HealthPermissionStatus.unavailable;
      case 'notDetermined':
      default:
        return HealthPermissionStatus.notDetermined;
    }
  }

  String _biometricTypeToString(BiometricType type) {
    switch (type) {
      case BiometricType.heartRate:
        return 'heart_rate';
      case BiometricType.hrv:
        return 'hrv';
      case BiometricType.sleepQuality:
        return 'sleep_quality';
      case BiometricType.activityLevel:
        return 'activity_level';
      case BiometricType.respiratoryRate:
        return 'respiratory_rate';
    }
  }

  BiometricType? _biometricTypeFromString(String value) {
    switch (value) {
      case 'heart_rate':
        return BiometricType.heartRate;
      case 'hrv':
        return BiometricType.hrv;
      case 'sleep_quality':
        return BiometricType.sleepQuality;
      case 'activity_level':
        return BiometricType.activityLevel;
      case 'respiratory_rate':
        return BiometricType.respiratoryRate;
      default:
        return null;
    }
  }

  void dispose() {
    _biometricStreamController.close();
  }
}

final healthServiceProvider = Provider<HealthService>((ref) {
  return HealthService.instance;
});

final latestBiometricDataProvider = FutureProvider<BiometricData?>((ref) async {
  final healthService = ref.watch(healthServiceProvider);
  return healthService.getLatestBiometricData();
});

final biometricStreamProvider = StreamProvider<BiometricData>((ref) {
  final healthService = ref.watch(healthServiceProvider);
  return healthService.biometricStream;
});

final healthKitAvailableProvider = FutureProvider<bool>((ref) async {
  final healthService = ref.watch(healthServiceProvider);
  return healthService.isHealthKitAvailable();
});

final biometricPermissionsProvider = Provider<Map<BiometricType, bool>>((ref) {
  final healthService = ref.watch(healthServiceProvider);
  return healthService.permissions;
});