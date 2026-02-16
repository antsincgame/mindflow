import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'notification_settings.freezed.dart';
part 'notification_settings.g.dart';

enum NotificationMode {
  manual,
  smart,
  combined;

  String get displayName {
    switch (this) {
      case NotificationMode.manual:
        return 'Ручное расписание';
      case NotificationMode.smart:
        return 'Умные уведомления';
      case NotificationMode.combined:
        return 'Комбинированный';
    }
  }

  String get description {
    switch (this) {
      case NotificationMode.manual:
        return 'Уведомления в выбранное вами время';
      case NotificationMode.smart:
        return 'Уведомления на основе уровня стресса';
      case NotificationMode.combined:
        return 'Расписание + умные уведомления';
    }
  }
}

class TimeOfDayConverter implements JsonConverter<TimeOfDay, Map<String, dynamic>> {
  const TimeOfDayConverter();

  @override
  TimeOfDay fromJson(Map<String, dynamic> json) {
    return TimeOfDay(
      hour: json['hour'] as int,
      minute: json['minute'] as int,
    );
  }

  @override
  Map<String, dynamic> toJson(TimeOfDay timeOfDay) {
    return {
      'hour': timeOfDay.hour,
      'minute': timeOfDay.minute,
    };
  }
}

class TimeOfDayListConverter implements JsonConverter<List<TimeOfDay>, List<dynamic>> {
  const TimeOfDayListConverter();

  @override
  List<TimeOfDay> fromJson(List<dynamic> json) {
    return json
        .map((e) => TimeOfDay(
              hour: (e as Map<String, dynamic>)['hour'] as int,
              minute: e['minute'] as int,
            ))
        .toList();
  }

  @override
  List<dynamic> toJson(List<TimeOfDay> list) {
    return list
        .map((t) => {
              'hour': t.hour,
              'minute': t.minute,
            })
        .toList();
  }
}

@freezed
class NotificationSettings with _$NotificationSettings {
  const NotificationSettings._();

  const factory NotificationSettings({
    @Default(NotificationMode.manual) NotificationMode mode,
    @TimeOfDayListConverter()
    @Default([])
    List<TimeOfDay> scheduledTimes,
    @Default(false) bool smartEnabled,
    @Default(60) int smartThreshold,
    @Default(true) bool enabled,
    @Default(true) bool soundEnabled,
    @Default(false) bool vibrationEnabled,
    @Default(30) int quietHoursStart,
    @Default(8) int quietHoursEnd,
    @Default(true) bool quietHoursEnabled,
  }) = _NotificationSettings;

  factory NotificationSettings.fromJson(Map<String, dynamic> json) =>
      _$NotificationSettingsFromJson(json);

  factory NotificationSettings.defaultSettings() {
    return NotificationSettings(
      mode: NotificationMode.manual,
      scheduledTimes: [
        const TimeOfDay(hour: 9, minute: 0),
        const TimeOfDay(hour: 21, minute: 0),
      ],
      smartEnabled: false,
      smartThreshold: 60,
      enabled: true,
      soundEnabled: true,
      vibrationEnabled: false,
      quietHoursStart: 23,
      quietHoursEnd: 8,
      quietHoursEnabled: true,
    );
  }

  bool get isManualMode => mode == NotificationMode.manual;
  bool get isSmartMode => mode == NotificationMode.smart;
  bool get isCombinedMode => mode == NotificationMode.combined;

  bool get hasScheduledTimes => scheduledTimes.isNotEmpty;

  bool get usesSmartNotifications =>
      mode == NotificationMode.smart || mode == NotificationMode.combined;

  bool get usesScheduledNotifications =>
      mode == NotificationMode.manual || mode == NotificationMode.combined;

  bool isInQuietHours(TimeOfDay currentTime) {
    if (!quietHoursEnabled) return false;

    final currentMinutes = currentTime.hour * 60 + currentTime.minute;
    final startMinutes = quietHoursStart * 60;
    final endMinutes = quietHoursEnd * 60;

    if (startMinutes <= endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  List<TimeOfDay> get sortedScheduledTimes {
    final sorted = List<TimeOfDay>.from(scheduledTimes);
    sorted.sort((a, b) {
      final aMinutes = a.hour * 60 + a.minute;
      final bMinutes = b.hour * 60 + b.minute;
      return aMinutes.compareTo(bMinutes);
    });
    return sorted;
  }

  Map<String, dynamic> toDatabase() {
    return {
      'mode': mode.name,
      'scheduled_times': scheduledTimes
          .map((t) => '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}')
          .join(','),
      'smart_enabled': smartEnabled ? 1 : 0,
      'smart_threshold': smartThreshold,
      'enabled': enabled ? 1 : 0,
      'sound_enabled': soundEnabled ? 1 : 0,
      'vibration_enabled': vibrationEnabled ? 1 : 0,
      'quiet_hours_start': quietHoursStart,
      'quiet_hours_end': quietHoursEnd,
      'quiet_hours_enabled': quietHoursEnabled ? 1 : 0,
    };
  }

  factory NotificationSettings.fromDatabase(Map<String, dynamic> map) {
    final timesString = map['scheduled_times'] as String? ?? '';
    final times = timesString.isEmpty
        ? <TimeOfDay>[]
        : timesString.split(',').map((t) {
            final parts = t.trim().split(':');
            return TimeOfDay(
              hour: int.parse(parts[0]),
              minute: int.parse(parts[1]),
            );
          }).toList();

    return NotificationSettings(
      mode: NotificationMode.values.firstWhere(
        (m) => m.name == (map['mode'] as String? ?? 'manual'),
        orElse: () => NotificationMode.manual,
      ),
      scheduledTimes: times,
      smartEnabled: (map['smart_enabled'] as int? ?? 0) == 1,
      smartThreshold: map['smart_threshold'] as int? ?? 60,
      enabled: (map['enabled'] as int? ?? 1) == 1,
      soundEnabled: (map['sound_enabled'] as int? ?? 1) == 1,
      vibrationEnabled: (map['vibration_enabled'] as int? ?? 0) == 1,
      quietHoursStart: map['quiet_hours_start'] as int? ?? 23,
      quietHoursEnd: map['quiet_hours_end'] as int? ?? 8,
      quietHoursEnabled: (map['quiet_hours_enabled'] as int? ?? 1) == 1,
    );
  }
}