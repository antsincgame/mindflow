import 'dart:math';

import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz_data;

import '../models/notification_settings.dart';
import '../models/biometric_data.dart';
import '../services/database_service.dart';

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  static const String _channelId = 'mindflow_reminders';
  static const String _channelName = 'MindFlow Reminders';
  static const String _channelDescription =
      'Reminders for mindfulness exercises';

  static const String _smartChannelId = 'mindflow_smart';
  static const String _smartChannelName = 'Smart Stress Alerts';
  static const String _smartChannelDescription =
      'Notifications based on your stress patterns';

  static const int _scheduledBaseId = 1000;
  static const int _smartBaseId = 2000;

  static const List<String> _reminderTitles = [
    'Time for a mindful break 🧘',
    'How are you feeling? 💭',
    'A moment of calm awaits ☁️',
    'Your mind deserves a break 🌿',
    'Ready for a quick exercise? ✨',
  ];

  static const List<String> _reminderBodies = [
    'Take 2 minutes to breathe and reset.',
    'Check in with yourself and try a quick exercise.',
    'A short breathing exercise can make a big difference.',
    'Even a brief meditation can reduce stress.',
    'Your wellbeing matters. Let\'s take a moment together.',
  ];

  static const List<String> _stressAlertTitles = [
    'We noticed elevated stress 📊',
    'Your body might need a break 💙',
    'Stress levels seem high ⚡',
  ];

  static const List<String> _stressAlertBodies = [
    'A quick breathing exercise could help you feel better.',
    'Try a 2-minute box breathing session to calm down.',
    'Take a moment to check in with yourself.',
  ];

  Future<void> initialize() async {
    if (_initialized) return;

    tz_data.initializeTimeZones();
    tz.setLocalLocation(tz.getLocation('America/New_York'));

    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: false,
      requestBadgePermission: false,
      requestSoundPermission: false,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    _initialized = true;
  }

  void _onNotificationTapped(NotificationResponse response) {
    // Handle notification tap - navigate to appropriate screen
    // This can be extended with a callback or stream
  }

  Future<bool> requestPermissions() async {
    final iOS = _plugin.resolvePlatformSpecificImplementation<
        IOSFlutterLocalNotificationsPlugin>();

    if (iOS != null) {
      final granted = await iOS.requestPermissions(
        alert: true,
        badge: true,
        sound: true,
      );
      return granted ?? false;
    }

    final android = _plugin.resolvePlatformSpecificImplementation<
        AndroidFlutterLocalNotificationsPlugin>();

    if (android != null) {
      final granted = await android.requestNotificationsPermission();
      return granted ?? false;
    }

    return false;
  }

  Future<void> applyNotificationSettings(
      NotificationSettings settings) async {
    await cancelAllNotifications();

    if (!settings.enabled) return;

    switch (settings.mode) {
      case NotificationMode.manual:
        await _scheduleManualNotifications(settings.scheduledTimes);
        break;
      case NotificationMode.smart:
        await _scheduleSmartNotifications(settings.smartThreshold);
        break;
      case NotificationMode.combined:
        await _scheduleManualNotifications(settings.scheduledTimes);
        await _scheduleSmartNotifications(settings.smartThreshold);
        break;
    }
  }

  Future<void> _scheduleManualNotifications(
      List<TimeOfDay> scheduledTimes) async {
    for (int i = 0; i < scheduledTimes.length; i++) {
      final time = scheduledTimes[i];
      await _scheduleDailyNotification(
        id: _scheduledBaseId + i,
        hour: time.hour,
        minute: time.minute,
        title: _getRandomReminder(_reminderTitles),
        body: _getRandomReminder(_reminderBodies),
        channelId: _channelId,
        channelName: _channelName,
        channelDescription: _channelDescription,
      );
    }
  }

  Future<void> _scheduleSmartNotifications(int stressThreshold) async {
    // Smart notifications are evaluated periodically.
    // We schedule check-in notifications at typical high-stress times
    // and adjust based on historical stress patterns.

    final highStressTimes = await _analyzeStressPatterns();

    if (highStressTimes.isEmpty) {
      // Default smart schedule: morning check-in and afternoon check-in
      await _scheduleDailyNotification(
        id: _smartBaseId,
        hour: 9,
        minute: 0,
        title: _getRandomReminder(_stressAlertTitles),
        body: _getRandomReminder(_stressAlertBodies),
        channelId: _smartChannelId,
        channelName: _smartChannelName,
        channelDescription: _smartChannelDescription,
      );
      await _scheduleDailyNotification(
        id: _smartBaseId + 1,
        hour: 15,
        minute: 0,
        title: _getRandomReminder(_stressAlertTitles),
        body: _getRandomReminder(_stressAlertBodies),
        channelId: _smartChannelId,
        channelName: _smartChannelName,
        channelDescription: _smartChannelDescription,
      );
    } else {
      for (int i = 0; i < highStressTimes.length; i++) {
        final time = highStressTimes[i];
        // Schedule 15 minutes before typical high-stress time
        int adjustedMinute = time.minute - 15;
        int adjustedHour = time.hour;
        if (adjustedMinute < 0) {
          adjustedMinute += 60;
          adjustedHour -= 1;
          if (adjustedHour < 0) adjustedHour = 23;
        }

        await _scheduleDailyNotification(
          id: _smartBaseId + i,
          hour: adjustedHour,
          minute: adjustedMinute,
          title: _getRandomReminder(_stressAlertTitles),
          body: _getRandomReminder(_stressAlertBodies),
          channelId: _smartChannelId,
          channelName: _smartChannelName,
          channelDescription: _smartChannelDescription,
        );
      }
    }
  }

  Future<List<TimeOfDay>> _analyzeStressPatterns() async {
    try {
      final db = DatabaseService.instance;
      final recentBiometrics = await db.getRecentBiometricData(days: 14);

      if (recentBiometrics.isEmpty) return [];

      // Group biometric readings by hour of day
      final Map<int, List<int>> stressByHour = {};

      for (final data in recentBiometrics) {
        final hour = data.timestamp.hour;
        stressByHour.putIfAbsent(hour, () => []);
        stressByHour[hour]!.add(data.stressLevel);
      }

      // Find hours with consistently high stress
      final highStressHours = <TimeOfDay>[];

      stressByHour.forEach((hour, stressValues) {
        if (stressValues.length >= 3) {
          final avgStress =
              stressValues.reduce((a, b) => a + b) / stressValues.length;
          if (avgStress >= 60) {
            highStressHours.add(TimeOfDay(hour: hour, minute: 0));
          }
        }
      });

      // Sort by hour and limit to 3 notifications max
      highStressHours.sort((a, b) => a.hour.compareTo(b.hour));
      return highStressHours.take(3).toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> _scheduleDailyNotification({
    required int id,
    required int hour,
    required int minute,
    required String title,
    required String body,
    required String channelId,
    required String channelName,
    required String channelDescription,
  }) async {
    final androidDetails = AndroidNotificationDetails(
      channelId,
      channelName,
      channelDescription: channelDescription,
      importance: Importance.defaultImportance,
      priority: Priority.defaultPriority,
      styleInformation: const BigTextStyleInformation(''),
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    final details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    final scheduledDate = _nextInstanceOfTime(hour, minute);

    await _plugin.zonedSchedule(
      id,
      title,
      body,
      scheduledDate,
      details,
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      matchDateTimeComponents: DateTimeComponents.time,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  tz.TZDateTime _nextInstanceOfTime(int hour, int minute) {
    final now = tz.TZDateTime.now(tz.local);
    var scheduled = tz.TZDateTime(
      tz.local,
      now.year,
      now.month,
      now.day,
      hour,
      minute,
    );

    if (scheduled.isBefore(now)) {
      scheduled = scheduled.add(const Duration(days: 1));
    }

    return scheduled;
  }

  Future<void> showImmediateNotification({
    required String title,
    required String body,
    int id = 0,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _plugin.show(id, title, body, details);
  }

  Future<void> showStressAlert({
    required int stressLevel,
  }) async {
    if (stressLevel < 70) return;

    final title = _getRandomReminder(_stressAlertTitles);
    final body = stressLevel >= 85
        ? 'Your stress level is very high ($stressLevel%). A breathing exercise can help right now.'
        : _getRandomReminder(_stressAlertBodies);

    const androidDetails = AndroidNotificationDetails(
      _smartChannelId,
      _smartChannelName,
      channelDescription: _smartChannelDescription,
      importance: Importance.high,
      priority: Priority.high,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _plugin.show(
      _smartBaseId + 100,
      title,
      body,
      details,
    );
  }

  Future<void> showSessionReminderNotification() async {
    await showImmediateNotification(
      id: 99,
      title: 'Great job! 🎉',
      body: 'You completed a mindfulness session. Keep up the good work!',
    );
  }

  Future<void> showAchievementNotification({
    required String achievementName,
    required String emoji,
  }) async {
    await showImmediateNotification(
      id: 98,
      title: 'Achievement Unlocked! $emoji',
      body: 'You earned "$achievementName". Tap to see your achievements.',
    );
  }

  Future<void> showStreakReminderNotification({
    required int currentStreak,
  }) async {
    await showImmediateNotification(
      id: 97,
      title: 'Don\'t break your streak! 🔥',
      body:
          'You\'re on a $currentStreak-day streak. Complete an exercise today to keep it going!',
    );
  }

  Future<void> cancelNotification(int id) async {
    await _plugin.cancel(id);
  }

  Future<void> cancelAllNotifications() async {
    await _plugin.cancelAll();
  }

  Future<void> cancelScheduledNotifications() async {
    for (int i = 0; i < 20; i++) {
      await _plugin.cancel(_scheduledBaseId + i);
    }
  }

  Future<void> cancelSmartNotifications() async {
    for (int i = 0; i < 20; i++) {
      await _plugin.cancel(_smartBaseId + i);
    }
    await _plugin.cancel(_smartBaseId + 100);
  }

  Future<List<PendingNotificationRequest>>
      getPendingNotifications() async {
    return _plugin.pendingNotificationRequests();
  }

  Future<void> refreshSmartNotifications({
    required NotificationSettings settings,
  }) async {
    if (!settings.enabled) return;
    if (settings.mode == NotificationMode.manual) return;

    await cancelSmartNotifications();
    await _scheduleSmartNotifications(settings.smartThreshold);
  }

  Future<void> evaluateAndNotify({
    required BiometricData biometricData,
    required NotificationSettings settings,
  }) async {
    if (!settings.enabled) return;
    if (settings.mode == NotificationMode.manual) return;

    if (biometricData.stressLevel >= settings.smartThreshold) {
      await showStressAlert(stressLevel: biometricData.stressLevel);
    }
  }

  String _getRandomReminder(List<String> options) {
    final random = Random();
    return options[random.nextInt(options.length)];
  }

  Future<void> dispose() async {
    _initialized = false;
  }
}