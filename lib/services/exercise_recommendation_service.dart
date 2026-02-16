import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../models/emotion.dart';
import '../models/exercise.dart';
import '../models/biometric_data.dart';
import '../utils/exercise_data.dart';

class ExerciseRecommendationService {
  static final ExerciseRecommendationService _instance =
      ExerciseRecommendationService._internal();

  factory ExerciseRecommendationService() => _instance;

  ExerciseRecommendationService._internal();

  /// Returns a ranked list of exercises based on the selected emotion and stress level.
  List<Exercise> getRecommendedExercises({
    required EmotionType emotionType,
    int? stressLevel,
    BiometricData? biometricData,
  }) {
    final allExercises = ExerciseData.allExercises;

    // Filter exercises that match the selected emotion
    final matchingExercises = allExercises.where((exercise) {
      return exercise.suitableEmotions.contains(emotionType);
    }).toList();

    // If no matching exercises found, return all exercises ranked by general suitability
    if (matchingExercises.isEmpty) {
      return _rankExercises(
        exercises: allExercises,
        emotionType: emotionType,
        stressLevel: stressLevel ?? 50,
        biometricData: biometricData,
      );
    }

    return _rankExercises(
      exercises: matchingExercises,
      emotionType: emotionType,
      stressLevel: stressLevel ?? 50,
      biometricData: biometricData,
    );
  }

  /// Returns the single best exercise for the given context.
  Exercise? getBestExercise({
    required EmotionType emotionType,
    int? stressLevel,
    BiometricData? biometricData,
  }) {
    final recommendations = getRecommendedExercises(
      emotionType: emotionType,
      stressLevel: stressLevel,
      biometricData: biometricData,
    );

    if (recommendations.isEmpty) return null;
    return recommendations.first;
  }

  /// Returns quick exercises (under 3 minutes) for high stress situations.
  List<Exercise> getQuickReliefExercises() {
    final allExercises = ExerciseData.allExercises;
    return allExercises
        .where((e) => e.durationSeconds <= 180)
        .toList()
      ..sort((a, b) => a.durationSeconds.compareTo(b.durationSeconds));
  }

  /// Returns exercises filtered by type.
  List<Exercise> getExercisesByType(ExerciseType type) {
    return ExerciseData.allExercises
        .where((e) => e.type == type)
        .toList();
  }

  /// Ranks exercises based on multiple factors.
  List<Exercise> _rankExercises({
    required List<Exercise> exercises,
    required EmotionType emotionType,
    required int stressLevel,
    BiometricData? biometricData,
  }) {
    final scored = exercises.map((exercise) {
      final score = _calculateScore(
        exercise: exercise,
        emotionType: emotionType,
        stressLevel: stressLevel,
        biometricData: biometricData,
      );
      return _ScoredExercise(exercise: exercise, score: score);
    }).toList();

    scored.sort((a, b) => b.score.compareTo(a.score));

    return scored.map((s) => s.exercise).toList();
  }

  /// Calculates a relevance score (0-100) for an exercise given the user's context.
  double _calculateScore({
    required Exercise exercise,
    required EmotionType emotionType,
    required int stressLevel,
    BiometricData? biometricData,
  }) {
    double score = 0;

    // --- Emotion match score (0-40) ---
    score += _emotionMatchScore(exercise, emotionType);

    // --- Stress-based duration score (0-30) ---
    score += _stressDurationScore(exercise, stressLevel);

    // --- Exercise type preference score (0-20) ---
    score += _typePreferenceScore(exercise, emotionType, stressLevel);

    // --- Biometric adjustment score (0-10) ---
    if (biometricData != null) {
      score += _biometricAdjustmentScore(exercise, biometricData);
    }

    return score.clamp(0, 100);
  }

  /// Score based on how well the exercise matches the emotion (0-40).
  double _emotionMatchScore(Exercise exercise, EmotionType emotionType) {
    if (exercise.suitableEmotions.contains(emotionType)) {
      // Primary match — check if this emotion is the first listed (most suitable)
      final index = exercise.suitableEmotions.indexOf(emotionType);
      if (index == 0) return 40;
      if (index == 1) return 35;
      return 30;
    }
    return 0;
  }

  /// Score based on exercise duration relative to stress level (0-30).
  ///
  /// High stress (70-100): prefer short exercises (2-3 min / 120-180s)
  /// Medium stress (40-69): prefer medium exercises (3-5 min / 180-300s)
  /// Low stress (0-39): prefer longer exercises (5+ min / 300s+)
  double _stressDurationScore(Exercise exercise, int stressLevel) {
    final duration = exercise.durationSeconds;

    if (stressLevel >= 70) {
      // High stress → quick breathing exercises (2-3 min)
      if (duration <= 120) return 30;
      if (duration <= 180) return 28;
      if (duration <= 240) return 20;
      if (duration <= 300) return 12;
      return 5;
    } else if (stressLevel >= 40) {
      // Medium stress → moderate duration (3-5 min)
      if (duration >= 180 && duration <= 300) return 30;
      if (duration >= 120 && duration < 180) return 22;
      if (duration > 300 && duration <= 420) return 20;
      if (duration < 120) return 15;
      return 10;
    } else {
      // Low stress → longer, deeper exercises (5+ min)
      if (duration >= 300) return 30;
      if (duration >= 240) return 25;
      if (duration >= 180) return 20;
      return 10;
    }
  }

  /// Score based on exercise type preference for the given emotion (0-20).
  ///
  /// Stress → breathing exercises preferred
  /// Sadness → meditation preferred
  /// Anxiety → breathing + mindfulness
  /// Fatigue → mindfulness + short meditation
  double _typePreferenceScore(
    Exercise exercise,
    EmotionType emotionType,
    int stressLevel,
  ) {
    switch (emotionType) {
      case EmotionType.stress:
        switch (exercise.type) {
          case ExerciseType.breathing:
            return stressLevel >= 70 ? 20 : 18;
          case ExerciseType.mindfulness:
            return 12;
          case ExerciseType.meditation:
            return 8;
        }

      case EmotionType.sadness:
        switch (exercise.type) {
          case ExerciseType.meditation:
            return 20;
          case ExerciseType.mindfulness:
            return 15;
          case ExerciseType.breathing:
            return 10;
        }

      case EmotionType.anxiety:
        switch (exercise.type) {
          case ExerciseType.breathing:
            return 20;
          case ExerciseType.mindfulness:
            return 18;
          case ExerciseType.meditation:
            return 12;
        }

      case EmotionType.fatigue:
        switch (exercise.type) {
          case ExerciseType.mindfulness:
            return 20;
          case ExerciseType.meditation:
            return 16;
          case ExerciseType.breathing:
            return 14;
        }
    }
  }

  /// Adjustment score based on biometric data (0-10).
  double _biometricAdjustmentScore(
    Exercise exercise,
    BiometricData biometricData,
  ) {
    double score = 0;

    // High heart rate → prefer calming breathing exercises
    if (biometricData.heartRate != null && biometricData.heartRate! > 90) {
      if (exercise.type == ExerciseType.breathing) {
        score += 5;
      }
    }

    // Low HRV (high stress indicator) → prefer short, focused exercises
    if (biometricData.hrv != null && biometricData.hrv! < 40) {
      if (exercise.durationSeconds <= 180) {
        score += 3;
      }
    }

    // Poor sleep quality → prefer gentle mindfulness or meditation
    if (biometricData.sleepQuality != null &&
        biometricData.sleepQuality! < 50) {
      if (exercise.type == ExerciseType.meditation ||
          exercise.type == ExerciseType.mindfulness) {
        score += 3;
      }
    }

    // Low activity level → prefer energizing short exercises
    if (biometricData.activityLevel != null &&
        biometricData.activityLevel! < 30) {
      if (exercise.durationSeconds <= 180) {
        score += 2;
      }
    }

    return score.clamp(0, 10);
  }

  /// Returns a human-readable reason why this exercise was recommended.
  String getRecommendationReason({
    required Exercise exercise,
    required EmotionType emotionType,
    int? stressLevel,
  }) {
    final stress = stressLevel ?? 50;

    if (stress >= 70 && exercise.type == ExerciseType.breathing) {
      return 'Быстрое дыхательное упражнение поможет снизить высокий уровень стресса';
    }

    switch (emotionType) {
      case EmotionType.stress:
        if (exercise.type == ExerciseType.breathing) {
          return 'Дыхательная техника — самый быстрый способ снять напряжение';
        }
        return 'Это упражнение поможет вам расслабиться и снять стресс';

      case EmotionType.sadness:
        if (exercise.type == ExerciseType.meditation) {
          return 'Медитация поможет мягко проработать грусть и восстановить баланс';
        }
        return 'Это упражнение поддержит вас в моменты грусти';

      case EmotionType.anxiety:
        if (exercise.type == ExerciseType.breathing) {
          return 'Контролируемое дыхание быстро снижает тревожность';
        }
        if (exercise.type == ExerciseType.mindfulness) {
          return 'Практика осознанности помогает заземлиться и уменьшить беспокойство';
        }
        return 'Это упражнение поможет справиться с тревогой';

      case EmotionType.fatigue:
        if (exercise.type == ExerciseType.mindfulness) {
          return 'Практика внимательности мягко восстановит вашу энергию';
        }
        return 'Это упражнение поможет восстановить силы';
    }
  }
}

class _ScoredExercise {
  final Exercise exercise;
  final double score;

  const _ScoredExercise({
    required this.exercise,
    required this.score,
  });
}

/// Riverpod provider for the recommendation service.
final exerciseRecommendationServiceProvider =
    Provider<ExerciseRecommendationService>((ref) {
  return ExerciseRecommendationService();
});

/// Provider that returns recommended exercises based on current emotion and stress.
final recommendedExercisesProvider =
    Provider.family<List<Exercise>, ({EmotionType emotionType, int? stressLevel})>(
  (ref, params) {
    final service = ref.watch(exerciseRecommendationServiceProvider);
    return service.getRecommendedExercises(
      emotionType: params.emotionType,
      stressLevel: params.stressLevel,
    );
  },
);

/// Provider for quick relief exercises.
final quickReliefExercisesProvider = Provider<List<Exercise>>((ref) {
  final service = ref.watch(exerciseRecommendationServiceProvider);
  return service.getQuickReliefExercises();
});