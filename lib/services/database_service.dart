import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:async';

import '../models/session.dart';
import '../models/achievement.dart';
import '../models/daily_stats.dart';
import '../models/user_preferences.dart';
import '../models/notification_settings.dart';
import '../models/biometric_data.dart';
import '../utils/constants.dart';

class DatabaseService {
  static final DatabaseService _instance = DatabaseService._internal();
  static Database? _database;

  factory DatabaseService() => _instance;

  DatabaseService._internal();

  static DatabaseService get instance => _instance;

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDatabase();
    return _database!;
  }

  Future<Database> _initDatabase() async {
    final directory = await getApplicationDocumentsDirectory();
    final path = join(directory.path, DbConstants.databaseName);

    return await openDatabase(
      path,
      version: DbConstants.databaseVersion,
      onCreate: _onCreate,
      onUpgrade: _onUpgrade,
      onConfigure: _onConfigure,
    );
  }

  Future<void> _onConfigure(Database db) async {
    await db.execute('PRAGMA foreign_keys = ON');
  }

  Future<void> _onCreate(Database db, int version) async {
    await db.execute('''
      CREATE TABLE ${DbConstants.sessionsTable} (
        id TEXT PRIMARY KEY,
        exercise_id TEXT NOT NULL,
        emotion_id TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration INTEGER NOT NULL DEFAULT 0,
        stress_before INTEGER,
        stress_after INTEGER,
        heart_rate_before REAL,
        heart_rate_after REAL,
        completed INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    ''');

    await db.execute('''
      CREATE TABLE ${DbConstants.achievementsTable} (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        icon TEXT NOT NULL,
        type TEXT NOT NULL,
        condition_key TEXT NOT NULL,
        current_progress INTEGER NOT NULL DEFAULT 0,
        target INTEGER NOT NULL DEFAULT 1,
        unlocked INTEGER NOT NULL DEFAULT 0,
        unlocked_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    ''');

    await db.execute('''
      CREATE TABLE ${DbConstants.dailyStatsTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL UNIQUE,
        session_count INTEGER NOT NULL DEFAULT 0,
        total_duration INTEGER NOT NULL DEFAULT 0,
        avg_stress REAL,
        sleep_quality REAL,
        exercise_types_completed TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    ''');

    await db.execute('''
      CREATE TABLE ${DbConstants.userPreferencesTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT NOT NULL UNIQUE,
        value TEXT NOT NULL,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    ''');

    await db.execute('''
      CREATE TABLE ${DbConstants.notificationSettingsTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        mode TEXT NOT NULL DEFAULT 'manual',
        scheduled_times TEXT,
        smart_enabled INTEGER NOT NULL DEFAULT 0,
        smart_threshold INTEGER NOT NULL DEFAULT 70,
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    ''');

    await db.execute('''
      CREATE TABLE ${DbConstants.biometricDataTable} (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        heart_rate REAL,
        hrv REAL,
        sleep_quality REAL,
        activity_level REAL,
        respiratory_rate REAL,
        stress_level INTEGER,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    ''');

    await db.execute('''
      CREATE INDEX idx_sessions_start_time ON ${DbConstants.sessionsTable} (start_time)
    ''');

    await db.execute('''
      CREATE INDEX idx_sessions_emotion ON ${DbConstants.sessionsTable} (emotion_id)
    ''');

    await db.execute('''
      CREATE INDEX idx_daily_stats_date ON ${DbConstants.dailyStatsTable} (date)
    ''');

    await db.execute('''
      CREATE INDEX idx_biometric_timestamp ON ${DbConstants.biometricDataTable} (timestamp)
    ''');

    await _insertDefaultNotificationSettings(db);
  }

  Future<void> _onUpgrade(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute('''
        ALTER TABLE ${DbConstants.sessionsTable} 
        ADD COLUMN created_at TEXT NOT NULL DEFAULT (datetime('now'))
      ''');
    }
    if (oldVersion < 3) {
      await db.execute('''
        CREATE TABLE IF NOT EXISTS ${DbConstants.biometricDataTable} (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          heart_rate REAL,
          hrv REAL,
          sleep_quality REAL,
          activity_level REAL,
          respiratory_rate REAL,
          stress_level INTEGER,
          created_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
      ''');
    }
  }

  Future<void> _insertDefaultNotificationSettings(Database db) async {
    await db.insert(
      DbConstants.notificationSettingsTable,
      {
        'mode': 'manual',
        'scheduled_times': '[]',
        'smart_enabled': 0,
        'smart_threshold': 70,
        'updated_at': DateTime.now().toIso8601String(),
      },
    );
  }

  // ==================== Sessions CRUD ====================

  Future<String> insertSession(Session session) async {
    final db = await database;
    await db.insert(
      DbConstants.sessionsTable,
      session.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    return session.id;
  }

  Future<Session?> getSession(String id) async {
    final db = await database;
    final maps = await db.query(
      DbConstants.sessionsTable,
      where: 'id = ?',
      whereArgs: [id],
    );
    if (maps.isEmpty) return null;
    return Session.fromMap(maps.first);
  }

  Future<List<Session>> getAllSessions({int? limit, int? offset}) async {
    final db = await database;
    final maps = await db.query(
      DbConstants.sessionsTable,
      orderBy: 'start_time DESC',
      limit: limit,
      offset: offset,
    );
    return maps.map((map) => Session.fromMap(map)).toList();
  }

  Future<List<Session>> getSessionsByDateRange(
    DateTime start,
    DateTime end,
  ) async {
    final db = await database;
    final maps = await db.query(
      DbConstants.sessionsTable,
      where: 'start_time >= ? AND start_time <= ?',
      whereArgs: [start.toIso8601String(), end.toIso8601String()],
      orderBy: 'start_time DESC',
    );
    return maps.map((map) => Session.fromMap(map)).toList();
  }

  Future<List<Session>> getSessionsByEmotion(String emotionId) async {
    final db = await database;
    final maps = await db.query(
      DbConstants.sessionsTable,
      where: 'emotion_id = ?',
      whereArgs: [emotionId],
      orderBy: 'start_time DESC',
    );
    return maps.map((map) => Session.fromMap(map)).toList();
  }

  Future<List<Session>> getCompletedSessions({int? limit}) async {
    final db = await database;
    final maps = await db.query(
      DbConstants.sessionsTable,
      where: 'completed = 1',
      orderBy: 'start_time DESC',
      limit: limit,
    );
    return maps.map((map) => Session.fromMap(map)).toList();
  }

  Future<Session?> getLastSession() async {
    final db = await database;
    final maps = await db.query(
      DbConstants.sessionsTable,
      where: 'completed = 1',
      orderBy: 'start_time DESC',
      limit: 1,
    );
    if (maps.isEmpty) return null;
    return Session.fromMap(maps.first);
  }

  Future<int> updateSession(Session session) async {
    final db = await database;
    return await db.update(
      DbConstants.sessionsTable,
      session.toMap(),
      where: 'id = ?',
      whereArgs: [session.id],
    );
  }

  Future<int> deleteSession(String id) async {
    final db = await database;
    return await db.delete(
      DbConstants.sessionsTable,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> getSessionCount() async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM ${DbConstants.sessionsTable} WHERE completed = 1',
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<int> getTotalSessionDuration() async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT COALESCE(SUM(duration), 0) as total FROM ${DbConstants.sessionsTable} WHERE completed = 1',
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  Future<int> getCurrentStreak() async {
    final db = await database;
    final results = await db.rawQuery('''
      SELECT DISTINCT date(start_time) as session_date
      FROM ${DbConstants.sessionsTable}
      WHERE completed = 1
      ORDER BY session_date DESC
    ''');

    if (results.isEmpty) return 0;

    int streak = 0;
    DateTime expectedDate = DateTime.now();
    expectedDate = DateTime(expectedDate.year, expectedDate.month, expectedDate.day);

    for (final row in results) {
      final sessionDate = DateTime.parse(row['session_date'] as String);
      final normalizedSessionDate = DateTime(
        sessionDate.year,
        sessionDate.month,
        sessionDate.day,
      );

      if (normalizedSessionDate == expectedDate) {
        streak++;
        expectedDate = expectedDate.subtract(const Duration(days: 1));
      } else if (normalizedSessionDate ==
          expectedDate.subtract(const Duration(days: 1))) {
        expectedDate = normalizedSessionDate;
        streak++;
        expectedDate = expectedDate.subtract(const Duration(days: 1));
      } else {
        break;
      }
    }

    return streak;
  }

  Future<int> getSessionCountByExerciseType(String exerciseType) async {
    final db = await database;
    final result = await db.rawQuery(
      '''
      SELECT COUNT(*) as count FROM ${DbConstants.sessionsTable} 
      WHERE completed = 1 AND exercise_id LIKE ?
      ''',
      ['%$exerciseType%'],
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  // ==================== Achievements CRUD ====================

  Future<String> insertAchievement(Achievement achievement) async {
    final db = await database;
    await db.insert(
      DbConstants.achievementsTable,
      achievement.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
    return achievement.id;
  }

  Future<Achievement?> getAchievement(String id) async {
    final db = await database;
    final maps = await db.query(
      DbConstants.achievementsTable,
      where: 'id = ?',
      whereArgs: [id],
    );
    if (maps.isEmpty) return null;
    return Achievement.fromMap(maps.first);
  }

  Future<List<Achievement>> getAllAchievements() async {
    final db = await database;
    final maps = await db.query(
      DbConstants.achievementsTable,
      orderBy: 'unlocked DESC, current_progress DESC',
    );
    return maps.map((map) => Achievement.fromMap(map)).toList();
  }

  Future<List<Achievement>> getUnlockedAchievements() async {
    final db = await database;
    final maps = await db.query(
      DbConstants.achievementsTable,
      where: 'unlocked = 1',
      orderBy: 'unlocked_at DESC',
    );
    return maps.map((map) => Achievement.fromMap(map)).toList();
  }

  Future<List<Achievement>> getLockedAchievements() async {
    final db = await database;
    final maps = await db.query(
      DbConstants.achievementsTable,
      where: 'unlocked = 0',
      orderBy: 'current_progress DESC',
    );
    return maps.map((map) => Achievement.fromMap(map)).toList();
  }

  Future<int> updateAchievement(Achievement achievement) async {
    final db = await database;
    return await db.update(
      DbConstants.achievementsTable,
      achievement.toMap(),
      where: 'id = ?',
      whereArgs: [achievement.id],
    );
  }

  Future<int> updateAchievementProgress(
    String id,
    int progress, {
    bool unlock = false,
  }) async {
    final db = await database;
    final Map<String, dynamic> values = {
      'current_progress': progress,
    };
    if (unlock) {
      values['unlocked'] = 1;
      values['unlocked_at'] = DateTime.now().toIso8601String();
    }
    return await db.update(
      DbConstants.achievementsTable,
      values,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> deleteAchievement(String id) async {
    final db = await database;
    return await db.delete(
      DbConstants.achievementsTable,
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> insertAchievements(List<Achievement> achievements) async {
    final db = await database;
    final batch = db.batch();
    for (final achievement in achievements) {
      batch.insert(
        DbConstants.achievementsTable,
        achievement.toMap(),
        conflictAlgorithm: ConflictAlgorithm.ignore,
      );
    }
    await batch.commit(noResult: true);
  }

  // ==================== Daily Stats CRUD ====================

  Future<int> insertDailyStats(DailyStats stats) async {
    final db = await database;
    return await db.insert(
      DbConstants.dailyStatsTable,
      stats.toMap(),
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  Future<DailyStats?> getDailyStats(String date) async {
    final db = await database;
    final maps = await db.query(
      DbConstants.dailyStatsTable,
      where: 'date = ?',
      whereArgs: [date],
    );
    if (maps.isEmpty) return null;
    return DailyStats.fromMap(maps.first);
  }

  Future<DailyStats?> getDailyStatsForDate(DateTime date) async {
    final dateStr =
        '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(