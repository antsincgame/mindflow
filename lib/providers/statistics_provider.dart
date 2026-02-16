import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/daily_stats.dart';
import '../services/database_service.dart';

part 'statistics_provider.g.dart';

enum StatsPeriod { week, month, allTime }

class StatisticsState {
  final List<DailyStats> allStats;
  final List<DailyStats> filteredStats;
  final StatsPeriod selectedPeriod;
  final Map<DateTime, int> heatmapData;
  final List<StressDataPoint> stressTrend;
  final List<SleepDataPoint> sleepTrend;
  final List<SessionCountDataPoint> sessionTrend;
  final double averageStress;
  final double averageSleepQuality;
  final int totalSessions;
  final int totalDuration;
  final int currentStreak;
  final int longestStreak;
  final double stressTrendDirection;
  final double sleepTrendDirection;
  final bool isLoading;
  final String? error;

  const StatisticsState({
    this.allStats = const [],
    this.filteredStats = const [],
    this.selectedPeriod = StatsPeriod.week,
    this.heatmapData = const {},
    this.stressTrend = const [],
    this.sleepTrend = const [],
    this.sessionTrend = const [],
    this.averageStress = 0.0,
    this.averageSleepQuality = 0.0,
    this.totalSessions = 0,
    this.totalDuration = 0,
    this.currentStreak = 0,
    this.longestStreak = 0,
    this.stressTrendDirection = 0.0,
    this.sleepTrendDirection = 0.0,
    this.isLoading = false,
    this.error,
  });

  StatisticsState copyWith({
    List<DailyStats>? allStats,
    List<DailyStats>? filteredStats,
    StatsPeriod? selectedPeriod,
    Map<DateTime, int>? heatmapData,
    List<StressDataPoint>? stressTrend,
    List<SleepDataPoint>? sleepTrend,
    List<SessionCountDataPoint>? sessionTrend,
    double? averageStress,
    double? averageSleepQuality,
    int? totalSessions,
    int? totalDuration,
    int? currentStreak,
    int? longestStreak,
    double? stressTrendDirection,
    double? sleepTrendDirection,
    bool? isLoading,
    String? error,
  }) {
    return StatisticsState(
      allStats: allStats ?? this.allStats,
      filteredStats: filteredStats ?? this.filteredStats,
      selectedPeriod: selectedPeriod ?? this.selectedPeriod,
      heatmapData: heatmapData ?? this.heatmapData,
      stressTrend: stressTrend ?? this.stressTrend,
      sleepTrend: sleepTrend ?? this.sleepTrend,
      sessionTrend: sessionTrend ?? this.sessionTrend,
      averageStress: averageStress ?? this.averageStress,
      averageSleepQuality: averageSleepQuality ?? this.averageSleepQuality,
      totalSessions: totalSessions ?? this.totalSessions,
      totalDuration: totalDuration ?? this.totalDuration,
      currentStreak: currentStreak ?? this.currentStreak,
      longestStreak: longestStreak ?? this.longestStreak,
      stressTrendDirection: stressTrendDirection ?? this.stressTrendDirection,
      sleepTrendDirection: sleepTrendDirection ?? this.sleepTrendDirection,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}

class StressDataPoint {
  final DateTime date;
  final double value;

  const StressDataPoint({required this.date, required this.value});
}

class SleepDataPoint {
  final DateTime date;
  final double value;

  const SleepDataPoint({required this.date, required this.value});
}

class SessionCountDataPoint {
  final DateTime date;
  final int count;

  const SessionCountDataPoint({required this.date, required this.count});
}

@riverpod
class Statistics extends _$Statistics {
  @override
  StatisticsState build() {
    _loadStats();
    return const StatisticsState(isLoading: true);
  }

  Future<void> _loadStats() async {
    try {
      final dbService = DatabaseService.instance;
      final allStats = await dbService.getAllDailyStats();

      allStats.sort((a, b) => a.date.compareTo(b.date));

      final heatmapData = _buildHeatmapData(allStats);
      final currentStreak = _calculateCurrentStreak(allStats);
      final longestStreak = _calculateLongestStreak(allStats);

      state = state.copyWith(
        allStats: allStats,
        heatmapData: heatmapData,
        currentStreak: currentStreak,
        longestStreak: longestStreak,
        isLoading: false,
        error: null,
      );

      _applyPeriodFilter(state.selectedPeriod);
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: e.toString(),
      );
    }
  }

  Future<void> refresh() async {
    state = state.copyWith(isLoading: true);
    await _loadStats();
  }

  void selectPeriod(StatsPeriod period) {
    state = state.copyWith(selectedPeriod: period);
    _applyPeriodFilter(period);
  }

  void _applyPeriodFilter(StatsPeriod period) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    DateTime startDate;
    switch (period) {
      case StatsPeriod.week:
        startDate = today.subtract(const Duration(days: 7));
        break;
      case StatsPeriod.month:
        startDate = today.subtract(const Duration(days: 30));
        break;
      case StatsPeriod.allTime:
        startDate = DateTime(2000);
        break;
    }

    final filtered = state.allStats.where((s) {
      final statsDate = DateTime(s.date.year, s.date.month, s.date.day);
      return !statsDate.isBefore(startDate);
    }).toList();

    final stressTrend = filtered
        .where((s) => s.avgStress != null && s.avgStress! > 0)
        .map((s) => StressDataPoint(date: s.date, value: s.avgStress!))
        .toList();

    final sleepTrend = filtered
        .where((s) => s.sleepQuality != null && s.sleepQuality! > 0)
        .map((s) => SleepDataPoint(date: s.date, value: s.sleepQuality!))
        .toList();

    final sessionTrend = filtered
        .map((s) => SessionCountDataPoint(date: s.date, count: s.sessionCount))
        .toList();

    final averageStress = _calculateAverage(
      filtered.where((s) => s.avgStress != null).map((s) => s.avgStress!).toList(),
    );

    final averageSleepQuality = _calculateAverage(
      filtered.where((s) => s.sleepQuality != null).map((s) => s.sleepQuality!).toList(),
    );

    final totalSessions = filtered.fold<int>(0, (sum, s) => sum + s.sessionCount);
    final totalDuration = filtered.fold<int>(0, (sum, s) => sum + s.totalDuration);

    final stressTrendDirection = _calculateTrendDirection(
      stressTrend.map((p) => p.value).toList(),
    );

    final sleepTrendDirection = _calculateTrendDirection(
      sleepTrend.map((p) => p.value).toList(),
    );

    state = state.copyWith(
      filteredStats: filtered,
      stressTrend: stressTrend,
      sleepTrend: sleepTrend,
      sessionTrend: sessionTrend,
      averageStress: averageStress,
      averageSleepQuality: averageSleepQuality,
      totalSessions: totalSessions,
      totalDuration: totalDuration,
      stressTrendDirection: stressTrendDirection,
      sleepTrendDirection: sleepTrendDirection,
    );
  }

  Map<DateTime, int> _buildHeatmapData(List<DailyStats> stats) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final threeMonthsAgo = today.subtract(const Duration(days: 90));

    final heatmap = <DateTime, int>{};

    for (var day = threeMonthsAgo;
        !day.isAfter(today);
        day = day.add(const Duration(days: 1))) {
      final normalizedDay = DateTime(day.year, day.month, day.day);
      heatmap[normalizedDay] = 0;
    }

    for (final stat in stats) {
      final normalizedDate = DateTime(stat.date.year, stat.date.month, stat.date.day);
      if (!normalizedDate.isBefore(threeMonthsAgo)) {
        heatmap[normalizedDate] = stat.sessionCount;
      }
    }

    return heatmap;
  }

  int _calculateCurrentStreak(List<DailyStats> stats) {
    if (stats.isEmpty) return 0;

    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    final activeDays = <DateTime>{};
    for (final stat in stats) {
      if (stat.sessionCount > 0) {
        activeDays.add(DateTime(stat.date.year, stat.date.month, stat.date.day));
      }
    }

    int streak = 0;
    var checkDate = today;

    if (!activeDays.contains(checkDate)) {
      checkDate = checkDate.subtract(const Duration(days: 1));
    }

    while (activeDays.contains(checkDate)) {
      streak++;
      checkDate = checkDate.subtract(const Duration(days: 1));
    }

    return streak;
  }

  int _calculateLongestStreak(List<DailyStats> stats) {
    if (stats.isEmpty) return 0;

    final activeDays = stats
        .where((s) => s.sessionCount > 0)
        .map((s) => DateTime(s.date.year, s.date.month, s.date.day))
        .toSet()
        .toList()
      ..sort();

    if (activeDays.isEmpty) return 0;

    int longest = 1;
    int current = 1;

    for (int i = 1; i < activeDays.length; i++) {
      final diff = activeDays[i].difference(activeDays[i - 1]).inDays;
      if (diff == 1) {
        current++;
        if (current > longest) longest = current;
      } else {
        current = 1;
      }
    }

    return longest;
  }

  double _calculateAverage(List<double> values) {
    if (values.isEmpty) return 0.0;
    final sum = values.fold<double>(0.0, (s, v) => s + v);
    return sum / values.length;
  }

  /// Returns a value indicating trend direction:
  /// positive = increasing, negative = decreasing, ~0 = stable
  double _calculateTrendDirection(List<double> values) {
    if (values.length < 2) return 0.0;

    final halfIndex = values.length ~/ 2;
    final firstHalf = values.sublist(0, halfIndex);
    final secondHalf = values.sublist(halfIndex);

    final firstAvg = _calculateAverage(firstHalf);
    final secondAvg = _calculateAverage(secondHalf);

    if (firstAvg == 0) return 0.0;

    return ((secondAvg - firstAvg) / firstAvg) * 100.0;
  }
}

@riverpod
Map<DateTime, int> heatmapData(Ref ref) {
  final stats = ref.watch(statisticsProvider);
  return stats.heatmapData;
}

@riverpod
List<StressDataPoint> stressTrendData(Ref ref) {
  final stats = ref.watch(statisticsProvider);
  return stats.stressTrend;
}

@riverpod
List<SleepDataPoint> sleepTrendData(Ref ref) {
  final stats = ref.watch(statisticsProvider);
  return stats.sleepTrend;
}

@riverpod
List<SessionCountDataPoint> sessionTrendData(Ref ref) {
  final stats = ref.watch(statisticsProvider);
  return stats.sessionTrend;
}

@riverpod
int currentStreak(Ref ref) {
  final stats = ref.watch(statisticsProvider);
  return stats.currentStreak;
}

@riverpod
int longestStreak(Ref ref) {
  final stats = ref.watch(statisticsProvider);
  return stats.longestStreak;
}

@riverpod
StatsPeriod selectedPeriod(Ref ref) {
  final stats = ref.watch(statisticsProvider);
  return stats.selectedPeriod;
}

@riverpod
bool statisticsLoading(Ref ref) {
  final stats = ref.watch(statisticsProvider);
  return stats.isLoading;
}