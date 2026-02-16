import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:riverpod_annotation/riverpod_annotation.dart';

import '../models/achievement.dart';
import '../models/session.dart';
import '../services/achievement_service.dart';
import '../services/database_service.dart';

part 'achievements_provider.g.dart';

class AchievementsState {
  final List<Achievement> achievements;
  final List<Achievement> recentlyUnlocked;
  final int userLevel;
  final int totalPoints;
  final int pointsToNextLevel;
  final bool isLoading;
  final String? error;

  const AchievementsState({
    this.achievements = const [],
    this.recentlyUnlocked = const [],
    this.userLevel = 1,
    this.totalPoints = 0,
    this.pointsToNextLevel = 100,
    this.isLoading = false,
    this.error,
  });

  AchievementsState copyWith({
    List<Achievement>? achievements,
    List<Achievement>? recentlyUnlocked,
    int? userLevel,
    int? totalPoints,
    int? pointsToNextLevel,
    bool? isLoading,
    String? error,
  }) {
    return AchievementsState(
      achievements: achievements ?? this.achievements,
      recentlyUnlocked: recentlyUnlocked ?? this.recentlyUnlocked,
      userLevel: userLevel ?? this.userLevel,
      totalPoints: totalPoints ?? this.totalPoints,
      pointsToNextLevel: pointsToNextLevel ?? this.pointsToNextLevel,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  int get unlockedCount => achievements.where((a) => a.unlocked).length;
  int get totalCount => achievements.length;
  double get overallProgress =>
      totalCount > 0 ? unlockedCount / totalCount : 0.0;

  List<Achievement> get lockedAchievements =>
      achievements.where((a) => !a.unlocked).toList();

  List<Achievement> get unlockedAchievements =>
      achievements.where((a) => a.unlocked).toList();

  List<Achievement> get inProgressAchievements =>
      achievements.where((a) => !a.unlocked && a.currentProgress > 0).toList();

  List<Achievement> achievementsByType(AchievementType type) =>
      achievements.where((a) => a.type == type).toList();
}

class AchievementsNotifier extends StateNotifier<AchievementsState> {
  final AchievementService _achievementService;
  final DatabaseService _databaseService;

  AchievementsNotifier({
    required AchievementService achievementService,
    required DatabaseService databaseService,
  })  : _achievementService = achievementService,
        _databaseService = databaseService,
        super(const AchievementsState());

  Future<void> loadAchievements() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final achievements = await _databaseService.getAllAchievements();
      final userLevel = _calculateUserLevel(achievements);
      final totalPoints = _calculateTotalPoints(achievements);
      final pointsToNextLevel = _calculatePointsToNextLevel(totalPoints);

      state = state.copyWith(
        achievements: achievements,
        userLevel: userLevel,
        totalPoints: totalPoints,
        pointsToNextLevel: pointsToNextLevel,
        isLoading: false,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load achievements: $e',
      );
    }
  }

  Future<List<Achievement>> checkAndUnlockAfterSession(Session session) async {
    try {
      final newlyUnlocked =
          await _achievementService.checkAchievementsAfterSession(session);

      if (newlyUnlocked.isNotEmpty) {
        final updatedAchievements = await _databaseService.getAllAchievements();
        final userLevel = _calculateUserLevel(updatedAchievements);
        final totalPoints = _calculateTotalPoints(updatedAchievements);
        final pointsToNextLevel = _calculatePointsToNextLevel(totalPoints);

        state = state.copyWith(
          achievements: updatedAchievements,
          recentlyUnlocked: [
            ...state.recentlyUnlocked,
            ...newlyUnlocked,
          ],
          userLevel: userLevel,
          totalPoints: totalPoints,
          pointsToNextLevel: pointsToNextLevel,
        );
      } else {
        final updatedAchievements = await _databaseService.getAllAchievements();
        state = state.copyWith(achievements: updatedAchievements);
      }

      return newlyUnlocked;
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to check achievements: $e',
      );
      return [];
    }
  }

  void clearRecentlyUnlocked() {
    state = state.copyWith(recentlyUnlocked: []);
  }

  void dismissRecentlyUnlocked(String achievementId) {
    final updated = state.recentlyUnlocked
        .where((a) => a.id != achievementId)
        .toList();
    state = state.copyWith(recentlyUnlocked: updated);
  }

  Future<void> updateAchievementProgress(
    String achievementId,
    int progress,
  ) async {
    try {
      await _databaseService.updateAchievementProgress(
        achievementId,
        progress,
      );
      await loadAchievements();
    } catch (e) {
      state = state.copyWith(
        error: 'Failed to update achievement progress: $e',
      );
    }
  }

  Future<void> resetAchievements() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _databaseService.resetAllAchievements();
      await loadAchievements();
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to reset achievements: $e',
      );
    }
  }

  int _calculateUserLevel(List<Achievement> achievements) {
    final totalPoints = _calculateTotalPoints(achievements);
    int level = 1;
    int pointsNeeded = 100;
    int accumulatedPoints = 0;

    while (accumulatedPoints + pointsNeeded <= totalPoints) {
      accumulatedPoints += pointsNeeded;
      level++;
      pointsNeeded = (pointsNeeded * 1.5).round();
    }

    return level.clamp(1, 10);
  }

  int _calculateTotalPoints(List<Achievement> achievements) {
    int points = 0;
    for (final achievement in achievements) {
      if (achievement.unlocked) {
        switch (achievement.type) {
          case AchievementType.milestone:
            points += 50;
            break;
          case AchievementType.streak:
            points += 100;
            break;
          case AchievementType.mastery:
            points += 150;
            break;
          case AchievementType.level:
            points += 200;
            break;
        }
      }
    }
    return points;
  }

  int _calculatePointsToNextLevel(int totalPoints) {
    int pointsNeeded = 100;
    int accumulatedPoints = 0;

    while (accumulatedPoints + pointsNeeded <= totalPoints) {
      accumulatedPoints += pointsNeeded;
      pointsNeeded = (pointsNeeded * 1.5).round();
    }

    return (accumulatedPoints + pointsNeeded) - totalPoints;
  }
}

final databaseServiceProvider = Provider<DatabaseService>((ref) {
  return DatabaseService();
});

final achievementServiceProvider = Provider<AchievementService>((ref) {
  final databaseService = ref.watch(databaseServiceProvider);
  return AchievementService(databaseService: databaseService);
});

final achievementsProvider =
    StateNotifierProvider<AchievementsNotifier, AchievementsState>((ref) {
  final achievementService = ref.watch(achievementServiceProvider);
  final databaseService = ref.watch(databaseServiceProvider);

  final notifier = AchievementsNotifier(
    achievementService: achievementService,
    databaseService: databaseService,
  );

  notifier.loadAchievements();

  return notifier;
});

final unlockedAchievementsProvider = Provider<List<Achievement>>((ref) {
  final state = ref.watch(achievementsProvider);
  return state.unlockedAchievements;
});

final lockedAchievementsProvider = Provider<List<Achievement>>((ref) {
  final state = ref.watch(achievementsProvider);
  return state.lockedAchievements;
});

final inProgressAchievementsProvider = Provider<List<Achievement>>((ref) {
  final state = ref.watch(achievementsProvider);
  return state.inProgressAchievements;
});

final userLevelProvider = Provider<int>((ref) {
  final state = ref.watch(achievementsProvider);
  return state.userLevel;
});

final achievementsByTypeProvider =
    Provider.family<List<Achievement>, AchievementType>((ref, type) {
  final state = ref.watch(achievementsProvider);
  return state.achievementsByType(type);
});

final recentlyUnlockedProvider = Provider<List<Achievement>>((ref) {
  final state = ref.watch(achievementsProvider);
  return state.recentlyUnlocked;
});

final achievementsProgressProvider = Provider<double>((ref) {
  final state = ref.watch(achievementsProvider);
  return state.overallProgress;
});