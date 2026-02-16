import 'package:freezed_annotation/freezed_annotation.dart';
import 'package:flutter/foundation.dart';
import 'emotion.dart';
import 'breathing_pattern.dart';

part 'exercise.freezed.dart';
part 'exercise.g.dart';

enum ExerciseType {
  @JsonValue('breathing')
  breathing,
  @JsonValue('meditation')
  meditation,
  @JsonValue('mindfulness')
  mindfulness,
}

extension ExerciseTypeExtension on ExerciseType {
  String get displayName {
    switch (this) {
      case ExerciseType.breathing:
        return 'Дыхание';
      case ExerciseType.meditation:
        return 'Медитация';
      case ExerciseType.mindfulness:
        return 'Внимательность';
    }
  }

  String get icon {
    switch (this) {
      case ExerciseType.breathing:
        return '🌬️';
      case ExerciseType.meditation:
        return '🧘';
      case ExerciseType.mindfulness:
        return '🧠';
    }
  }
}

@freezed
class Exercise with _$Exercise {
  const Exercise._();

  const factory Exercise({
    required String id,
    required String name,
    required ExerciseType type,
    required int durationSeconds,
    required String description,
    required String icon,
    String? audioFile,
    @Default([]) List<EmotionType> suitableEmotions,
    BreathingPattern? breathingPattern,
  }) = _Exercise;

  factory Exercise.fromJson(Map<String, dynamic> json) =>
      _$ExerciseFromJson(json);

  factory Exercise.fromMap(Map<String, dynamic> map) {
    return Exercise(
      id: map['id'] as String,
      name: map['name'] as String,
      type: ExerciseType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => ExerciseType.breathing,
      ),
      durationSeconds: map['duration_seconds'] as int,
      description: map['description'] as String,
      icon: map['icon'] as String,
      audioFile: map['audio_file'] as String?,
      suitableEmotions: map['suitable_emotions'] != null
          ? (map['suitable_emotions'] as String)
              .split(',')
              .where((e) => e.isNotEmpty)
              .map(
                (e) => EmotionType.values.firstWhere(
                  (et) => et.name == e.trim(),
                  orElse: () => EmotionType.stress,
                ),
              )
              .toList()
          : [],
      breathingPattern: map['breathing_pattern_inhale'] != null
          ? BreathingPattern(
              inhaleDuration: map['breathing_pattern_inhale'] as int,
              holdDuration: map['breathing_pattern_hold'] as int,
              exhaleDuration: map['breathing_pattern_exhale'] as int,
              holdAfterExhaleDuration:
                  (map['breathing_pattern_hold_after_exhale'] as int?) ?? 0,
              cycles: (map['breathing_pattern_cycles'] as int?) ?? 4,
            )
          : null,
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'name': name,
      'type': type.name,
      'duration_seconds': durationSeconds,
      'description': description,
      'icon': icon,
      'audio_file': audioFile,
      'suitable_emotions': suitableEmotions.map((e) => e.name).join(','),
      'breathing_pattern_inhale': breathingPattern?.inhaleDuration,
      'breathing_pattern_hold': breathingPattern?.holdDuration,
      'breathing_pattern_exhale': breathingPattern?.exhaleDuration,
      'breathing_pattern_hold_after_exhale':
          breathingPattern?.holdAfterExhaleDuration,
      'breathing_pattern_cycles': breathingPattern?.cycles,
    };
  }

  Duration get duration => Duration(seconds: durationSeconds);

  String get formattedDuration {
    final minutes = durationSeconds ~/ 60;
    final seconds = durationSeconds % 60;
    if (seconds == 0) {
      return '$minutes мин';
    }
    return '$minutes мин $seconds сек';
  }

  bool isSuitableFor(EmotionType emotion) {
    return suitableEmotions.contains(emotion);
  }

  bool get isBreathingExercise => type == ExerciseType.breathing;

  bool get hasAudio => audioFile != null && audioFile!.isNotEmpty;
}