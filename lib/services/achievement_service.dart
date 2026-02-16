import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:uuid/uuid.dart';

import '../models/achievement.dart';
import '../models/session.dart';
import '../services/database_service.dart';
import '../utils/achievement_definitions.dart';

class AchievementService {
  final DatabaseService _databaseService;
  static const _uuid = Uuid();

  AchievementService({required DatabaseService databaseService})
      : _databaseService = databaseService;

  Future<List<Achievement>> getAllAchievements() async {
    final db = await _databaseService.database;
    final rows = await db.query('achievements', orderBy: 'sort_order ASC');
    if (rows.isEmpty) {
      return _initializeAchievements();
    }
    return rows.map((row) => Achievement.fromMap(row)).toList();
  }

  Future<List<Achievement>> getUnlockedAchievements() async {
    final db = await _databaseService.database;
    final rows = await db.query(
      'achievements',
      where: 'unlocked = ?',
      whereArgs: [1],
      orderBy: 'unlocked_at DESC',
    );
    return rows.map((row) => Achievement.fromMap(row)).toList();
  }

  Future<Achievement?> getAchievementById(String id) async {
    final db = await _databaseService.database;
    final rows = await db.query(
      'achievements',
      where: 'id = ?',
      whereArgs: [id],
      limit: 1,
    );
    if (rows.isEmpty) return null;
    return Achievement.fromMap(rows.first);
  }

  Future<List<Achievement>> _initializeAchievements() async {
    final definitions = AchievementDefinitions.all;
    final achievements = <Achievement>[];

    for (int i = 0; i < definitions.length; i++) {
      final def = definitions[i];
      final achievement = Achievement(
        id: def.id,
        name: def.name,
        description: def.description,
        icon: def.icon,
        type: def.type,
        condition: def.condition,
        currentProgress: 0,
        goal: def.goal,
        unlocked: false,
        unlockedAt: null,
        sortOrder: i,
      );
      achievements.add(achievement);
      await _saveAchievement(achievement);
    }

    return achievements;
  }

  Future<void> _saveAchievement(Achievement achievement) async {
    final db = await _databaseService.database;
    await db.insert(
      'achievements',
      achievement.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<void> _updateAchievement(Achievement achievement) async {
    final db = await _databaseService.database;
    await db.update(
      'achievements',
      achievement.toMap(),
      where: 'id = ?',
      whereArgs: [achievement.id],
    );
  }

  /// Main entry point: check all achievement conditions after a session completes
  Future<List<Achievement>> checkAndUnlockAfterSession(Session session) async {
    final newlyUnlocked = <Achievement>[];

    final achievements = await getAllAchievements();
    final sessions = await _getAllCompletedSessions();

    for (final achievement in achievements) {
      if (achievement.unlocked) continue;

      final updatedAchievement = await _evaluateAchievement(
        achievement,
        session,
        sessions,
      );

      if (updatedAchievement != null) {
        await _updateAchievement(updatedAchievement);
        if (updatedAchievement.unlocked && !achievement.unlocked) {
          newlyUnlocked.add(updatedAchievement);
        }
      }
    }

    return newlyUnlocked;
  }

  Future<Achievement?> _evaluateAchievement(
    Achievement achievement,
    Session latestSession,
    List<Session> allSessions,
  ) async {
    switch (achievement.condition) {
      case 'first_exercise':
        return _checkFirstExercise(achievement, allSessions);
      case 'sessions_5':
        return _checkSessionCount(achievement, allSessions, 5);
      case 'sessions_10':
        return _checkSessionCount(achievement, allSessions, 10);
      case 'sessions_25':
        return _checkSessionCount(achievement, allSessions, 25);
      case 'sessions_50':
        return _checkSessionCount(achievement, allSessions, 50);
      case 'sessions_100':
        return _checkSessionCount(achievement, allSessions, 100);
      case 'streak_3':
        return _checkStreak(achievement, allSessions, 3);
      case 'streak_7':
        return _checkStreak(achievement, allSessions, 7);
      case 'streak_14':
        return _checkStreak(achievement, allSessions, 14);
      case 'streak_30':
        return _checkStreak(achievement, allSessions, 30);
      case 'breathing_master':
        return _checkExerciseTypeMastery(achievement, allSessions, 'breathing', 50);
      case 'meditation_master':
        return _checkExerciseTypeMastery(achievement, allSessions, 'meditation', 50);
      case 'mindfulness_master':
        return _checkExerciseTypeMastery(achievement, allSessions, 'mindfulness', 50);
      case 'breathing_10':
        return _checkExerciseTypeMastery(achievement, allSessions, 'breathing', 10);
      case 'meditation_10':
        return _checkExerciseTypeMastery(achievement, allSessions, 'meditation', 10);
      case 'mindfulness_10':
        return _checkExerciseTypeMastery(achievement, allSessions, 'mindfulness', 10);
      case 'stress_reduction_20':
        return _checkStressReduction(achievement, latestSession, 20);
      case 'stress_reduction_50':
        return _checkStressReduction(achievement, latestSession, 50);
      case 'total_minutes_60':
        return _checkTotalMinutes(achievement, allSessions, 60);
      case 'total_minutes_300':
        return _checkTotalMinutes(achievement, allSessions, 300);
      case 'total_minutes_600':
        return _checkTotalMinutes(achievement, allSessions, 600);
      case 'total_minutes_1800':
        return _checkTotalMinutes(achievement, allSessions, 1800);
      case 'all_emotions':
        return _checkAllEmotions(achievement, allSessions);
      case 'all_exercise_types':
        return _checkAllExerciseTypes(achievement, allSessions);
      case 'night_owl':
        return _checkTimeOfDay(achievement, latestSession, allSessions, 22, 5);
      case 'early_bird':
        return _checkTimeOfDay(achievement, latestSession, allSessions, 5, 9);
      case 'level_1':
        return _checkLevel(achievement, allSessions, 1);
      case 'level_2':
        return _checkLevel(achievement, allSessions, 2);
      case 'level_3':
        return _checkLevel(achievement, allSessions, 3);
      case 'level_4':
        return _checkLevel(achievement, allSessions, 4);
      case 'level_5':
        return _checkLevel(achievement, allSessions, 5);
      case 'level_6':
        return _checkLevel(achievement, allSessions, 6);
      case 'level_7':
        return _checkLevel(achievement, allSessions, 7);
      case 'level_8':
        return _checkLevel(achievement, allSessions, 8);
      case 'level_9':
        return _checkLevel(achievement, allSessions, 9);
      case 'level_10':
        return _checkLevel(achievement, allSessions, 10);
      default:
        return null;
    }
  }

  Achievement _checkFirstExercise(
    Achievement achievement,
    List<Session> sessions,
  ) {
    final progress = sessions.isNotEmpty ? 1 : 0;
    return achievement.copyWith(
      currentProgress: progress,
      unlocked: progress >= achievement.goal,
      unlockedAt: progress >= achievement.goal ? DateTime.now() : null,
    );
  }

  Achievement _checkSessionCount(
    Achievement achievement,
    List<Session> sessions,
    int target,
  ) {
    final progress = sessions.length.clamp(0, target);
    return achievement.copyWith(
      currentProgress: progress,
      unlocked: progress >= target,
      unlockedAt: progress >= target && !achievement.unlocked
          ? DateTime.now()
          : achievement.unlockedAt,
    );
  }

  Achievement _checkStreak(
    Achievement achievement,
    List<Session> sessions,
    int targetDays,
  ) {
    final currentStreak = _calculateCurrentStreak(sessions);
    final progress = currentStreak.clamp(0, targetDays);
    return achievement.copyWith(
      currentProgress: progress,
      unlocked: progress >= targetDays,
      unlockedAt: progress >= targetDays && !achievement.unlocked
          ? DateTime.now()
          : achievement.unlockedAt,
    );
  }

  int _calculateCurrentStreak(List<Session> sessions) {
    if (sessions.isEmpty) return 0;

    final uniqueDays = <String>{};
    for (final session in sessions) {
      if (session.completed) {
        final date = session.startTime;
        uniqueDays.add('${date.year}-${date.month}-${date.day}');
      }
    }

    if (uniqueDays.isEmpty) return 0;

    final sortedDays = uniqueDays.toList()..sort((a, b) => b.compareTo(a));

    final today = DateTime.now();
    final todayStr = '${today.year}-${today.month}-${today.day}';
    final yesterday = today.subtract(const Duration(days: 1));
    final yesterdayStr =
        '${yesterday.year}-${yesterday.month}-${yesterday.day}';

    // Streak must include today or yesterday
    if (sortedDays.first != todayStr && sortedDays.first != yesterdayStr) {
      return 0;
    }

    int streak = 1;
    DateTime currentDate = _parseDate(sortedDays.first);

    for (int i = 1; i < sortedDays.length; i++) {
      final previousDate = currentDate.subtract(const Duration(days: 1));
      final previousStr =
          '${previousDate.year}-${previousDate.month}-${previousDate.day}';

      if (sortedDays[i] == previousStr) {
        streak++;
        currentDate = previousDate;
      } else {
        break;
      }
    }

    return streak;
  }

  DateTime _parseDate(String dateStr) {
    final parts = dateStr.split('-');
    return DateTime(
      int.parse(parts[0]),
      int.parse(parts[1]),
      int.parse(parts[2]),
    );
  }

  Achievement _checkExerciseTypeMastery(
    Achievement achievement,
    List<Session> sessions,
    String exerciseType,
    int target,
  ) {
    final count = sessions
        .where((s) => s.completed && s.exerciseType == exerciseType)
        .length
        .clamp(0, target);
    return achievement.copyWith(
      currentProgress: count,
      unlocked: count >= target,
      unlockedAt: count >= target && !achievement.unlocked
          ? DateTime.now()
          : achievement.unlockedAt,
    );
  }

  Achievement _checkStressReduction(
    Achievement achievement,
    Session latestSession,
    int targetReduction,
  ) {
    if (latestSession.stressBefore == null ||
        latestSession.stressAfter == null) {
      return achievement;
    }

    final reduction = latestSession.stressBefore! - latestSession.stressAfter!;
    final progress = reduction >= targetReduction ? achievement.goal : 0;

    return achievement.copyWith(
      currentProgress: progress,
      unlocked: progress >= achievement.goal,
      unlockedAt: progress >= achievement.goal && !achievement.unlocked
          ? DateTime.now()
          : achievement.unlockedAt,
    );
  }

  Achievement _checkTotalMinutes(
    Achievement achievement,
    List<Session> sessions,
    int targetMinutes,
  ) {
    final totalSeconds = sessions
        .where((s) => s.completed)
        .fold<int>(0, (sum, s) => sum + s.duration);
    final totalMinutes = (totalSeconds / 60).floor().clamp(0, targetMinutes);

    return achievement.copyWith(
      currentProgress: totalMinutes,
      unlocked: totalMinutes >= targetMinutes,
      unlockedAt: totalMinutes >= targetMinutes && !achievement.unlocked
          ? DateTime.now()
          : achievement.unlockedAt,
    );
  }

  Achievement _checkAllEmotions(
    Achievement achievement,
    List<Session> sessions,
  ) {
    final uniqueEmotions = sessions
        .where((s) => s.completed && s.emotionId != null)
        .map((s) => s.emotionId!)
        .toSet();

    const totalEmotions = 4; // грусть, стресс, беспокойство, усталость
    final progress = uniqueEmotions.length.clamp(0, totalEmotions);

    return achievement.copyWith(
      currentProgress: progress,
      unlocked: progress >= totalEmotions,
      unlockedAt: progress >= totalEmotions && !achievement.unlocked
          ? DateTime.now()
          : achievement.unlockedAt,
    );
  }

  Achievement _checkAllExerciseTypes(
    Achievement achievement,
    List<Session> sessions,
  ) {
    final uniqueTypes = sessions
        .where((s) => s.completed && s.exerciseType != null)
        .map((s) => s.exerciseType!)
        .toSet();

    const totalTypes = 3; // breathing, meditation, mindfulness
    final progress = uniqueTypes.length.clamp(0, totalTypes);

    return achievement.copyWith(
      currentProgress: progress,
      unlocked: progress >= totalTypes,
      unlockedAt: progress >= totalTypes && !achievement.unlocked
          ? DateTime.now()
          : achievement.unlockedAt,
    );
  }

  Achievement _checkTimeOfDay(
    Achievement achievement,
    Session latestSession,
    List<Session> sessions,
    int startHour,
    int endHour,
  ) {
    int count = 0;
    for (final session in sessions) {
      if (!session.completed) continue;
      final hour = session.startTime.hour;
      if (startHour < endHour) {
        if (hour >= startHour && hour < endHour) count++;
      } else {
        // Wraps around midnight (e.g., 22-5)
        if (hour >= startHour || hour < endHour) count++;
      }
    }

    final target = achievement.goal;
    final progress = count.clamp(0, target);

    return achievement.copyWith(
      currentProgress: progress,
      unlocked: progress >= target,
      unlockedAt: progress >= target && !achievement.unlocked
          ? DateTime.now()
          : achievement.unlockedAt,
    );
  }

  Achievement _checkLevel(
    Achievement achievement,
    List<Session> sessions,
    int level,
  ) {
    final completedSessions = sessions.where((s) => s.completed).length;
    final currentLevel = _calculateLevel(completedSessions);