import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/emotion.dart';
import '../services/stress_analysis_service.dart';
import '../services/database_service.dart';

part 'emotion_provider.g.dart';

class EmotionHistoryEntry {
  final Emotion emotion;
  final DateTime selectedAt;
  final double? stressLevel;

  const EmotionHistoryEntry({
    required this.emotion,
    required this.selectedAt,
    this.stressLevel,
  });

  Map<String, dynamic> toMap() {
    return {
      'emotion_type': emotion.type.name,
      'selected_at': selectedAt.toIso8601String(),
      'stress_level': stressLevel,
    };
  }

  factory EmotionHistoryEntry.fromMap(Map<String, dynamic> map) {
    final emotionType = EmotionType.values.firstWhere(
      (e) => e.name == map['emotion_type'],
      orElse: () => EmotionType.stress,
    );

    return EmotionHistoryEntry(
      emotion: Emotion.fromType(emotionType),
      selectedAt: DateTime.parse(map['selected_at'] as String),
      stressLevel: map['stress_level'] as double?,
    );
  }
}

class EmotionState {
  final Emotion? selectedEmotion;
  final List<EmotionHistoryEntry> history;
  final double? currentStressLevel;
  final bool isAnalyzing;

  const EmotionState({
    this.selectedEmotion,
    this.history = const [],
    this.currentStressLevel,
    this.isAnalyzing = false,
  });

  EmotionState copyWith({
    Emotion? selectedEmotion,
    List<EmotionHistoryEntry>? history,
    double? currentStressLevel,
    bool? isAnalyzing,
    bool clearSelectedEmotion = false,
    bool clearStressLevel = false,
  }) {
    return EmotionState(
      selectedEmotion: clearSelectedEmotion ? null : (selectedEmotion ?? this.selectedEmotion),
      history: history ?? this.history,
      currentStressLevel: clearStressLevel ? null : (currentStressLevel ?? this.currentStressLevel),
      isAnalyzing: isAnalyzing ?? this.isAnalyzing,
    );
  }

  Emotion? get mostFrequentEmotion {
    if (history.isEmpty) return null;

    final counts = <EmotionType, int>{};
    for (final entry in history) {
      counts[entry.emotion.type] = (counts[entry.emotion.type] ?? 0) + 1;
    }

    final sortedEntries = counts.entries.toList()
      ..sort((a, b) => b.value.compareTo(a.value));

    return Emotion.fromType(sortedEntries.first.key);
  }

  List<EmotionHistoryEntry> get todayHistory {
    final now = DateTime.now();
    final todayStart = DateTime(now.year, now.month, now.day);
    return history.where((entry) => entry.selectedAt.isAfter(todayStart)).toList();
  }

  List<EmotionHistoryEntry> get weekHistory {
    final now = DateTime.now();
    final weekStart = now.subtract(const Duration(days: 7));
    return history.where((entry) => entry.selectedAt.isAfter(weekStart)).toList();
  }
}

@riverpod
class EmotionNotifier extends _$EmotionNotifier {
  late final DatabaseService _databaseService;
  late final StressAnalysisService _stressAnalysisService;

  @override
  EmotionState build() {
    _databaseService = DatabaseService.instance;
    _stressAnalysisService = StressAnalysisService();
    _loadHistory();
    return const EmotionState();
  }

  Future<void> _loadHistory() async {
    try {
      final historyMaps = await _databaseService.getEmotionHistory();
      final entries = historyMaps
          .map((map) => EmotionHistoryEntry.fromMap(map))
          .toList();

      state = state.copyWith(history: entries);
    } catch (_) {
      // History loading failed silently; state remains with empty history.
    }
  }

  Future<void> selectEmotion(Emotion emotion) async {
    state = state.copyWith(
      selectedEmotion: emotion,
      isAnalyzing: true,
    );

    double? stressLevel;
    try {
      stressLevel = await _stressAnalysisService.analyzeStress(
        emotionType: emotion.type,
      );
    } catch (_) {
      stressLevel = _estimateStressFromEmotion(emotion.type);
    }

    final entry = EmotionHistoryEntry(
      emotion: emotion,
      selectedAt: DateTime.now(),
      stressLevel: stressLevel,
    );

    final updatedHistory = [entry, ...state.history];

    try {
      await _databaseService.insertEmotionHistory(entry.toMap());
    } catch (_) {
      // Database insert failed silently.
    }

    state = state.copyWith(
      selectedEmotion: emotion,
      history: updatedHistory,
      currentStressLevel: stressLevel,
      isAnalyzing: false,
    );
  }

  void clearSelection() {
    state = state.copyWith(
      clearSelectedEmotion: true,
      clearStressLevel: true,
      isAnalyzing: false,
    );
  }

  Future<void> refreshStressLevel() async {
    if (state.selectedEmotion == null) return;

    state = state.copyWith(isAnalyzing: true);

    try {
      final stressLevel = await _stressAnalysisService.analyzeStress(
        emotionType: state.selectedEmotion!.type,
      );
      state = state.copyWith(
        currentStressLevel: stressLevel,
        isAnalyzing: false,
      );
    } catch (_) {
      state = state.copyWith(isAnalyzing: false);
    }
  }

  double _estimateStressFromEmotion(EmotionType type) {
    switch (type) {
      case EmotionType.stress:
        return 75.0;
      case EmotionType.anxiety:
        return 65.0;
      case EmotionType.sadness:
        return 50.0;
      case EmotionType.fatigue:
        return 45.0;
    }
  }

  Map<EmotionType, int> getEmotionDistribution({Duration? period}) {
    final entries = period != null
        ? state.history.where(
            (e) => e.selectedAt.isAfter(DateTime.now().subtract(period)),
          )
        : state.history;

    final distribution = <EmotionType, int>{};
    for (final entry in entries) {
      distribution[entry.emotion.type] =
          (distribution[entry.emotion.type] ?? 0) + 1;
    }
    return distribution;
  }

  double? getAverageStressLevel({Duration? period}) {
    final entries = period != null
        ? state.history.where(
            (e) =>
                e.selectedAt.isAfter(DateTime.now().subtract(period)) &&
                e.stressLevel != null,
          )
        : state.history.where((e) => e.stressLevel != null);

    if (entries.isEmpty) return null;

    final total = entries.fold<double>(
      0.0,
      (sum, entry) => sum + (entry.stressLevel ?? 0.0),
    );

    return total / entries.length;
  }
}

final selectedEmotionProvider = Provider<Emotion?>((ref) {
  final emotionState = ref.watch(emotionNotifierProvider);
  return emotionState.selectedEmotion;
});

final currentStressLevelProvider = Provider<double?>((ref) {
  final emotionState = ref.watch(emotionNotifierProvider);
  return emotionState.currentStressLevel;
});

final isAnalyzingStressProvider = Provider<bool>((ref) {
  final emotionState = ref.watch(emotionNotifierProvider);
  return emotionState.isAnalyzing;
});

final todayEmotionHistoryProvider = Provider<List<EmotionHistoryEntry>>((ref) {
  final emotionState = ref.watch(emotionNotifierProvider);
  return emotionState.todayHistory;
});

final mostFrequentEmotionProvider = Provider<Emotion?>((ref) {
  final emotionState = ref.watch(emotionNotifierProvider);
  return emotionState.mostFrequentEmotion;
});