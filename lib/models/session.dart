import 'package:freezed_annotation/freezed_annotation.dart';

part 'session.freezed.dart';
part 'session.g.dart';

@freezed
class Session with _$Session {
  const Session._();

  const factory Session({
    required String id,
    @JsonKey(name: 'exercise_id') required String exerciseId,
    @JsonKey(name: 'emotion_id') required String emotionId,
    @JsonKey(name: 'start_time', fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
    required DateTime startTime,
    @JsonKey(name: 'end_time', fromJson: _dateTimeNullableFromJson, toJson: _dateTimeNullableToJson)
    DateTime? endTime,
    @JsonKey(name: 'duration_seconds') required int durationSeconds,
    @JsonKey(name: 'stress_before') required int stressBefore,
    @JsonKey(name: 'stress_after') int? stressAfter,
    @JsonKey(name: 'heart_rate_before') double? heartRateBefore,
    @JsonKey(name: 'heart_rate_after') double? heartRateAfter,
    @JsonKey(defaultValue: false) required bool completed,
  }) = _Session;

  factory Session.fromJson(Map<String, dynamic> json) =>
      _$SessionFromJson(json);

  factory Session.fromDbMap(Map<String, dynamic> map) {
    return Session(
      id: map['id'] as String,
      exerciseId: map['exercise_id'] as String,
      emotionId: map['emotion_id'] as String,
      startTime: DateTime.fromMillisecondsSinceEpoch(map['start_time'] as int),
      endTime: map['end_time'] != null
          ? DateTime.fromMillisecondsSinceEpoch(map['end_time'] as int)
          : null,
      durationSeconds: map['duration_seconds'] as int,
      stressBefore: map['stress_before'] as int,
      stressAfter: map['stress_after'] as int?,
      heartRateBefore: map['heart_rate_before'] != null
          ? (map['heart_rate_before'] as num).toDouble()
          : null,
      heartRateAfter: map['heart_rate_after'] != null
          ? (map['heart_rate_after'] as num).toDouble()
          : null,
      completed: (map['completed'] as int) == 1,
    );
  }

  Map<String, dynamic> toDbMap() {
    return {
      'id': id,
      'exercise_id': exerciseId,
      'emotion_id': emotionId,
      'start_time': startTime.millisecondsSinceEpoch,
      'end_time': endTime?.millisecondsSinceEpoch,
      'duration_seconds': durationSeconds,
      'stress_before': stressBefore,
      'stress_after': stressAfter,
      'heart_rate_before': heartRateBefore,
      'heart_rate_after': heartRateAfter,
      'completed': completed ? 1 : 0,
    };
  }

  Duration get duration => Duration(seconds: durationSeconds);

  int? get stressReduction {
    if (stressAfter == null) return null;
    return stressBefore - stressAfter!;
  }

  double? get stressReductionPercentage {
    if (stressAfter == null || stressBefore == 0) return null;
    return ((stressBefore - stressAfter!) / stressBefore) * 100;
  }

  double? get heartRateChange {
    if (heartRateBefore == null || heartRateAfter == null) return null;
    return heartRateAfter! - heartRateBefore!;
  }

  bool get isEffective {
    final reduction = stressReduction;
    if (reduction == null) return false;
    return reduction > 0;
  }
}

DateTime _dateTimeFromJson(dynamic value) {
  if (value is int) {
    return DateTime.fromMillisecondsSinceEpoch(value);
  }
  return DateTime.parse(value as String);
}

String _dateTimeToJson(DateTime dateTime) {
  return dateTime.toIso8601String();
}

DateTime? _dateTimeNullableFromJson(dynamic value) {
  if (value == null) return null;
  if (value is int) {
    return DateTime.fromMillisecondsSinceEpoch(value);
  }
  return DateTime.parse(value as String);
}

String? _dateTimeNullableToJson(DateTime? dateTime) {
  return dateTime?.toIso8601String();
}