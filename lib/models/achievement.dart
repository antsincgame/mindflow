import 'package:freezed_annotation/freezed_annotation.dart';

part 'achievement.generated.dart';
part 'achievement.freezed.dart';

enum AchievementType {
  @JsonValue('milestone')
  milestone,
  @JsonValue('streak')
  streak,
  @JsonValue('mastery')
  mastery,
  @JsonValue('level')
  level,
}

@freezed
class Achievement with _$Achievement {
  const Achievement._();

  const factory Achievement({
    required String id,
    required String title,
    required String description,
    required String icon,
    required AchievementType type,
    required String condition,
    @Default(0) int currentProgress,
    required int goal,
    @Default(false) bool unlocked,
    @JsonKey(fromJson: _dateTimeFromJson, toJson: _dateTimeToJson)
    DateTime? unlockedAt,
  }) = _Achievement;

  factory Achievement.fromJson(Map<String, dynamic> json) =>
      _$AchievementFromJson(json);

  double get progressPercentage =>
      goal > 0 ? (currentProgress / goal).clamp(0.0, 1.0) : 0.0;

  bool get isCompleted => currentProgress >= goal;

  bool get isInProgress => currentProgress > 0 && !unlocked;
}

DateTime? _dateTimeFromJson(dynamic value) {
  if (value == null) return null;
  if (value is int) return DateTime.fromMillisecondsSinceEpoch(value);
  if (value is String) return DateTime.tryParse(value);
  return null;
}

int? _dateTimeToJson(DateTime? dateTime) {
  return dateTime?.millisecondsSinceEpoch;
}