import 'package:freezed_annotation/freezed_annotation.dart';

part 'daily_stats.freezed.dart';
part 'daily_stats.g.dart';

@freezed
class DailyStats with _$DailyStats {
  const DailyStats._();

  const factory DailyStats({
    required DateTime date,
    @Default(0) int sessionCount,
    @Default(0) int totalDuration,
    @Default(0.0) double avgStress,
    @Default(0.0) double sleepQuality,
    @Default([]) List<String> exerciseTypesCompleted,
  }) = _DailyStats;

  factory DailyStats.fromJson(Map<String, dynamic> json) =>
      _$DailyStatsFromJson(json);

  factory DailyStats.fromMap(Map<String, dynamic> map) {
    return DailyStats(
      date: DateTime.parse(map['date'] as String),
      sessionCount: (map['session_count'] as int?) ?? 0,
      totalDuration: (map['total_duration'] as int?) ?? 0,
      avgStress: (map['avg_stress'] as num?)?.toDouble() ?? 0.0,
      sleepQuality: (map['sleep_quality'] as num?)?.toDouble() ?? 0.0,
      exerciseTypesCompleted: map['exercise_types_completed'] != null
          ? (map['exercise_types_completed'] as String)
              .split(',')
              .where((e) => e.isNotEmpty)
              .toList()
          : [],
    );
  }

  Map<String, dynamic> toMap() {
    return {
      'date': date.toIso8601String().substring(0, 10),
      'session_count': sessionCount,
      'total_duration': totalDuration,
      'avg_stress': avgStress,
      'sleep_quality': sleepQuality,
      'exercise_types_completed': exerciseTypesCompleted.join(','),
    };
  }

  /// Intensity level for heatmap: 0 = none, 1 = low, 2 = medium, 3 = high
  int get heatmapIntensity {
    if (sessionCount == 0) return 0;
    if (sessionCount <= 1) return 1;
    if (sessionCount <= 2) return 2;
    return 3;
  }

  /// Total duration formatted as human-readable string
  String get formattedDuration {
    if (totalDuration < 60) return '${totalDuration}с';
    final minutes = totalDuration ~/ 60;
    final seconds = totalDuration % 60;
    if (seconds == 0) return '${minutes}мин';
    return '${minutes}мин ${seconds}с';
  }

  /// Whether the user was active on this day
  bool get isActive => sessionCount > 0;

  /// Number of unique exercise types completed
  int get uniqueExerciseTypes => exerciseTypesCompleted.toSet().length;

  /// Date formatted as yyyy-MM-dd string
  String get dateKey => date.toIso8601String().substring(0, 10);

  /// Creates an empty stats entry for a given date
  factory DailyStats.empty(DateTime date) {
    return DailyStats(
      date: DateTime(date.year, date.month, date.day),
    );
  }
}