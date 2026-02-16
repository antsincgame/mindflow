import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/emotion.dart';
import '../models/biometric_data.dart';
import '../models/exercise.dart';
import '../services/health_service.dart';
import '../services/exercise_recommendation_service.dart';

part 'stress_analysis_service.g.dart';

class StressAnalysisResult {
  final int stressLevel;
  final String stressCategory;
  final Map<String, double> contributingFactors;
  final DateTime timestamp;

  const StressAnalysisResult({
    required this.stressLevel,
    required this.stressCategory,
    required this.contributingFactors,
    required this.timestamp,
  });

  bool get isLow => stressLevel <= 30;
  bool get isMedium => stressLevel > 30 && stressLevel <= 60;
  bool get isHigh => stressLevel > 60 && stressLevel <= 80;
  bool get isCritical => stressLevel > 80;
}

class StressAnalysisService {
  final HealthService _healthService;
  final ExerciseRecommendationService _recommendationService;

  StressAnalysisService({
    required HealthService healthService,
    required ExerciseRecommendationService recommendationService,
  })  : _healthService = healthService,
        _recommendationService = recommendationService;

  // Weight coefficients for stress calculation
  static const double _heartRateWeight = 0.25;
  static const double _hrvWeight = 0.30;
  static const double _sleepQualityWeight = 0.20;
  static const double _activityLevelWeight = 0.05;
  static const double _respiratoryRateWeight = 0.05;
  static const double _emotionWeight = 0.15;

  // Normal ranges for biometric data
  static const double _normalHeartRateMin = 60.0;
  static const double _normalHeartRateMax = 80.0;
  static const double _normalHrvMin = 40.0;
  static const double _normalHrvMax = 100.0;
  static const double _normalRespiratoryRateMin = 12.0;
  static const double _normalRespiratoryRateMax = 20.0;
  static const double _optimalSleepQuality = 90.0;
  static const double _optimalActivityLevel = 60.0;

  /// Calculate stress level combining emotion and biometric data
  Future<StressAnalysisResult> analyzeStress({
    EmotionType? selectedEmotion,
    BiometricData? biometricData,
  }) async {
    BiometricData? data = biometricData;

    if (data == null) {
      data = await _healthService.getLatestBiometricData();
    }

    final contributingFactors = <String, double>{};
    double totalStress = 0.0;
    double totalWeight = 0.0;

    // Heart rate contribution
    if (data?.heartRate != null && data!.heartRate! > 0) {
      final hrStress = _calculateHeartRateStress(data.heartRate!);
      contributingFactors['heart_rate'] = hrStress;
      totalStress += hrStress * _heartRateWeight;
      totalWeight += _heartRateWeight;
    }

    // HRV contribution (lower HRV = higher stress)
    if (data?.hrv != null && data!.hrv! > 0) {
      final hrvStress = _calculateHrvStress(data.hrv!);
      contributingFactors['hrv'] = hrvStress;
      totalStress += hrvStress * _hrvWeight;
      totalWeight += _hrvWeight;
    }

    // Sleep quality contribution (lower sleep quality = higher stress)
    if (data?.sleepQuality != null && data!.sleepQuality! > 0) {
      final sleepStress = _calculateSleepStress(data.sleepQuality!);
      contributingFactors['sleep_quality'] = sleepStress;
      totalStress += sleepStress * _sleepQualityWeight;
      totalWeight += _sleepQualityWeight;
    }

    // Activity level contribution
    if (data?.activityLevel != null && data!.activityLevel! > 0) {
      final activityStress = _calculateActivityStress(data.activityLevel!);
      contributingFactors['activity_level'] = activityStress;
      totalStress += activityStress * _activityLevelWeight;
      totalWeight += _activityLevelWeight;
    }

    // Respiratory rate contribution
    if (data?.respiratoryRate != null && data!.respiratoryRate! > 0) {
      final respStress = _calculateRespiratoryStress(data.respiratoryRate!);
      contributingFactors['respiratory_rate'] = respStress;
      totalStress += respStress * _respiratoryRateWeight;
      totalWeight += _respiratoryRateWeight;
    }

    // Emotion contribution
    if (selectedEmotion != null) {
      final emotionStress = _calculateEmotionStress(selectedEmotion);
      contributingFactors['emotion'] = emotionStress;
      totalStress += emotionStress * _emotionWeight;
      totalWeight += _emotionWeight;
    }

    // Normalize if we don't have all data points
    int stressLevel;
    if (totalWeight > 0) {
      stressLevel = (totalStress / totalWeight).round().clamp(0, 100);
    } else {
      // Default moderate stress if no data available
      stressLevel = 50;
    }

    final category = _categorizeStress(stressLevel);

    return StressAnalysisResult(
      stressLevel: stressLevel,
      stressCategory: category,
      contributingFactors: contributingFactors,
      timestamp: DateTime.now(),
    );
  }

  /// Calculate stress from emotion only (no biometric data needed)
  int calculateStressFromEmotion(EmotionType emotion) {
    return _calculateEmotionStress(emotion).round();
  }

  /// Calculate stress from biometric data only
  Future<int> calculateStressFromBiometrics() async {
    final result = await analyzeStress();
    return result.stressLevel;
  }

  /// Get combined stress level with emotion and biometrics
  Future<int> getCombinedStressLevel(EmotionType emotion) async {
    final result = await analyzeStress(selectedEmotion: emotion);
    return result.stressLevel;
  }

  /// Get optimal exercise recommendation based on current stress analysis
  Future<Exercise?> getOptimalExercise({
    required EmotionType emotion,
    int? overrideStressLevel,
  }) async {
    final stressLevel = overrideStressLevel ??
        (await analyzeStress(selectedEmotion: emotion)).stressLevel;

    final recommendations = _recommendationService.getRecommendedExercises(
      emotion: emotion,
      stressLevel: stressLevel,
    );

    if (recommendations.isEmpty) return null;
    return recommendations.first;
  }

  /// Get list of recommended exercises sorted by relevance
  Future<List<Exercise>> getRecommendedExercises({
    required EmotionType emotion,
    int? overrideStressLevel,
  }) async {
    final stressLevel = overrideStressLevel ??
        (await analyzeStress(selectedEmotion: emotion)).stressLevel;

    return _recommendationService.getRecommendedExercises(
      emotion: emotion,
      stressLevel: stressLevel,
    );
  }

  /// Calculate stress change after a session
  StressChangeResult calculateStressChange({
    required int stressBefore,
    required int stressAfter,
  }) {
    final change = stressAfter - stressBefore;
    final percentageChange =
        stressBefore > 0 ? (change / stressBefore * 100).round() : 0;

    String effectiveness;
    if (change <= -20) {
      effectiveness = 'excellent';
    } else if (change <= -10) {
      effectiveness = 'good';
    } else if (change <= 0) {
      effectiveness = 'moderate';
    } else {
      effectiveness = 'minimal';
    }

    return StressChangeResult(
      stressBefore: stressBefore,
      stressAfter: stressAfter,
      change: change,
      percentageChange: percentageChange,
      effectiveness: effectiveness,
    );
  }

  // --- Private calculation methods ---

  double _calculateHeartRateStress(double heartRate) {
    if (heartRate <= _normalHeartRateMin) {
      // Very low HR could indicate good fitness or bradycardia
      return _normalizeToRange(heartRate, 40, _normalHeartRateMin, 20, 0);
    } else if (heartRate <= _normalHeartRateMax) {
      // Normal range - low stress
      return _normalizeToRange(
          heartRate, _normalHeartRateMin, _normalHeartRateMax, 0, 30);
    } else if (heartRate <= 100) {
      // Slightly elevated
      return _normalizeToRange(heartRate, _normalHeartRateMax, 100, 30, 60);
    } else if (heartRate <= 120) {
      // Elevated
      return _normalizeToRange(heartRate, 100, 120, 60, 85);
    } else {
      // Very elevated
      return _normalizeToRange(heartRate, 120, 160, 85, 100);
    }
  }

  double _calculateHrvStress(double hrv) {
    // Higher HRV = lower stress, Lower HRV = higher stress
    if (hrv >= _normalHrvMax) {
      // Excellent HRV
      return _normalizeToRange(hrv, _normalHrvMax, 150, 10, 0);
    } else if (hrv >= _normalHrvMin) {
      // Normal HRV
      return _normalizeToRange(hrv, _normalHrvMin, _normalHrvMax, 40, 10);
    } else if (hrv >= 20) {
      // Low HRV
      return _normalizeToRange(hrv, 20, _normalHrvMin, 75, 40);
    } else {
      // Very low HRV
      return _normalizeToRange(hrv, 5, 20, 100, 75);
    }
  }

  double _calculateSleepStress(double sleepQuality) {
    // Sleep quality 0-100, higher = better sleep = lower stress
    if (sleepQuality >= _optimalSleepQuality) {
      return _normalizeToRange(sleepQuality, _optimalSleepQuality, 100, 10, 0);
    } else if (sleepQuality >= 70) {
      return _normalizeToRange(sleepQuality, 70, _optimalSleepQuality, 30, 10);
    } else if (sleepQuality >= 50) {
      return _normalizeToRange(sleepQuality, 50, 70, 60, 30);
    } else if (sleepQuality >= 30) {
      return _normalizeToRange(sleepQuality, 30, 50, 80, 60);
    } else {
      return _normalizeToRange(sleepQuality, 0, 30, 100, 80);
    }
  }

  double _calculateActivityStress(double activityLevel) {
    // Moderate activity is optimal; too low or too high increases stress
    final deviation = (activityLevel - _optimalActivityLevel).abs();
    if (deviation <= 20) {
      return _normalizeToRange(deviation, 0, 20, 0, 25);
    } else if (deviation <= 40) {
      return _normalizeToRange(deviation, 20, 40, 25, 50);
    } else {
      return _normalizeToRange(deviation, 40, 100, 50, 80);
    }
  }

  double _calculateRespiratoryStress(double respiratoryRate) {
    if (respiratoryRate >= _normalRespiratoryRateMin &&
        respiratoryRate <= _normalRespiratoryRateMax) {
      return _normalizeToRange(respiratoryRate, _normalRespiratoryRateMin,
          _normalRespiratoryRateMax, 0, 20);
    } else if (respiratoryRate < _normalRespiratoryRateMin) {
      return _normalizeToRange(respiratoryRate, 8, _normalRespiratoryRateMin, 40, 20);
    } else if (respiratoryRate <= 25) {
      return _normalizeToRange(
          respiratoryRate, _normalRespiratoryRateMax, 25, 20, 60);
    } else {
      return _normalizeToRange(respiratoryRate, 25, 35, 60, 100);
    }
  }

  double _calculateEmotionStress(EmotionType emotion) {
    switch (emotion) {
      case EmotionType.stress:
        return 80.0;
      case EmotionType.anxiety:
        return 70.0;
      case EmotionType.sadness:
        return 55.0;
      case EmotionType.fatigue:
        return 45.0;
    }
  }

  String _categorizeStress(int stressLevel) {
    if (stressLevel <= 20) return 'very_low';
    if (stressLevel <= 40) return 'low';
    if (stressLevel <= 60) return 'moderate';
    if (stressLevel <= 80) return 'high';
    return 'critical';
  }

  /// Normalize a value from one range to another
  double _normalizeToRange(
    double value,
    double inputMin,
    double inputMax,
    double outputMin,
    double outputMax,
  ) {
    if (inputMax == inputMin) return outputMin;

    final normalized =
        ((value - inputMin) / (inputMax - inputMin)).clamp(0.0, 1.0);
    return outputMin + normalized * (outputMax - outputMin);
  }
}

class StressChangeResult {
  final int stressBefore;
  final int stressAfter;
  final int change;
  final int percentageChange;
  final String effectiveness;

  const StressChangeResult({
    required this.stressBefore,
    required this.stressAfter,
    required this.change,
    required this.percentageChange,
    required this.effectiveness,
  });

  bool get improved => change < 0;
  int get absoluteChange => change.abs();
}

@riverpod
StressAnalysisService stressAnalysisService(Ref ref) {
  final healthService = ref.watch(healthServiceProvider);
  final recommendationService =
      ref.watch(exerciseRecommendationServiceProvider);

  return StressAnalysisService(
    healthService: healthService,
    recommendationService: recommendationService,
  );
}

@riverpod
Future<StressAnalysisResult> currentStressAnalysis(
  Ref ref, {
  EmotionType? emotion,
}) async {
  final service = ref.watch(stressAnalysisServiceProvider);
  return service.analyzeStress(selectedEmotion: emotion);
}