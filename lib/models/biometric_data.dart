import 'package:freezed_annotation/freezed_annotation.dart';

part 'biometric_data.freezed.dart';
part 'biometric_data.g.dart';

@freezed
class BiometricData with _$BiometricData {
  const BiometricData._();

  const factory BiometricData({
    required String id,
    required DateTime timestamp,
    @JsonKey(name: 'heart_rate') double? heartRate,
    double? hrv,
    @JsonKey(name: 'sleep_quality') double? sleepQuality,
    @JsonKey(name: 'activity_level') double? activityLevel,
    @JsonKey(name: 'respiratory_rate') double? respiratoryRate,
    @JsonKey(name: 'stress_level') double? stressLevelOverride,
  }) = _BiometricData;

  /// Computed stress level (0-100) based on biometric data.
  /// If [stressLevelOverride] is provided, it takes precedence.
  /// Otherwise, stress is calculated from available biometrics.
  double get stressLevel {
    if (stressLevelOverride != null) {
      return stressLevelOverride!.clamp(0.0, 100.0);
    }
    return _calculateStressLevel();
  }

  double _calculateStressLevel() {
    double totalWeight = 0.0;
    double weightedSum = 0.0;

    // Heart rate contribution (weight: 0.30)
    // Normal resting HR: 60-100 bpm
    // Higher HR → higher stress
    if (heartRate != null) {
      const weight = 0.30;
      final normalizedHr = ((heartRate! - 60.0) / 40.0).clamp(0.0, 1.0);
      weightedSum += normalizedHr * 100.0 * weight;
      totalWeight += weight;
    }

    // HRV contribution (weight: 0.30)
    // Normal HRV: 20-100 ms
    // Lower HRV → higher stress (inverse relationship)
    if (hrv != null) {
      const weight = 0.30;
      final normalizedHrv = 1.0 - ((hrv! - 20.0) / 80.0).clamp(0.0, 1.0);
      weightedSum += normalizedHrv * 100.0 * weight;
      totalWeight += weight;
    }

    // Sleep quality contribution (weight: 0.20)
    // Sleep quality: 0-100 (higher is better)
    // Lower sleep quality → higher stress (inverse relationship)
    if (sleepQuality != null) {
      const weight = 0.20;
      final normalizedSleep = 1.0 - (sleepQuality! / 100.0).clamp(0.0, 1.0);
      weightedSum += normalizedSleep * 100.0 * weight;
      totalWeight += weight;
    }

    // Activity level contribution (weight: 0.10)
    // Activity level: 0-100
    // Very low or very high activity can indicate stress
    if (activityLevel != null) {
      const weight = 0.10;
      final normalized = activityLevel! / 100.0;
      // U-shaped curve: both extremes contribute to stress
      final stressContribution = (2.0 * (normalized - 0.5).abs()).clamp(0.0, 1.0);
      weightedSum += stressContribution * 100.0 * weight;
      totalWeight += weight;
    }

    // Respiratory rate contribution (weight: 0.10)
    // Normal: 12-20 breaths/min
    // Higher respiratory rate → higher stress
    if (respiratoryRate != null) {
      const weight = 0.10;
      final normalizedRr = ((respiratoryRate! - 12.0) / 8.0).clamp(0.0, 1.0);
      weightedSum += normalizedRr * 100.0 * weight;
      totalWeight += weight;
    }

    if (totalWeight == 0.0) {
      return 50.0; // Default neutral stress level when no data available
    }

    return (weightedSum / totalWeight).clamp(0.0, 100.0);
  }

  /// Returns a human-readable stress category.
  StressCategory get stressCategory {
    final level = stressLevel;
    if (level <= 25.0) return StressCategory.low;
    if (level <= 50.0) return StressCategory.moderate;
    if (level <= 75.0) return StressCategory.high;
    return StressCategory.veryHigh;
  }

  /// Whether any biometric data is available.
  bool get hasData =>
      heartRate != null ||
      hrv != null ||
      sleepQuality != null ||
      activityLevel != null ||
      respiratoryRate != null;

  /// Converts the model to a map suitable for SQLite storage.
  Map<String, dynamic> toSqliteMap() {
    return {
      'id': id,
      'timestamp': timestamp.toIso8601String(),
      'heart_rate': heartRate,
      'hrv': hrv,
      'sleep_quality': sleepQuality,
      'activity_level': activityLevel,
      'respiratory_rate': respiratoryRate,
      'stress_level': stressLevel,
    };
  }

  /// Creates a [BiometricData] instance from a SQLite row map.
  factory BiometricData.fromSqliteMap(Map<String, dynamic> map) {
    return BiometricData(
      id: map['id'] as String,
      timestamp: DateTime.parse(map['timestamp'] as String),
      heartRate: map['heart_rate'] as double?,
      hrv: map['hrv'] as double?,
      sleepQuality: map['sleep_quality'] as double?,
      activityLevel: map['activity_level'] as double?,
      respiratoryRate: map['respiratory_rate'] as double?,
      stressLevelOverride: map['stress_level'] as double?,
    );
  }

  factory BiometricData.fromJson(Map<String, dynamic> json) =>
      _$BiometricDataFromJson(json);
}

enum StressCategory {
  low('Low', 'You are feeling calm'),
  moderate('Moderate', 'Slightly elevated stress'),
  high('High', 'Consider taking a break'),
  veryHigh('Very High', 'A breathing exercise is recommended');

  const StressCategory(this.label, this.description);

  final String label;
  final String description;
}