import 'package:freezed_annotation/freezed_annotation.dart';

part 'user_preferences.freezed.dart';
part 'user_preferences.g.dart';

enum AppThemeMode {
  @JsonValue('auto')
  auto,
  @JsonValue('light')
  light,
  @JsonValue('dark')
  dark,
}

enum BiometricType {
  @JsonValue('heart_rate')
  heartRate,
  @JsonValue('hrv')
  hrv,
  @JsonValue('sleep')
  sleep,
  @JsonValue('activity')
  activity,
  @JsonValue('respiratory_rate')
  respiratoryRate,
}

@freezed
class UserPreferences with _$UserPreferences {
  const UserPreferences._();

  const factory UserPreferences({
    @Default(AppThemeMode.auto) AppThemeMode themeMode,
    @Default(true) bool notificationsEnabled,
    @Default({
      BiometricType.heartRate: false,
      BiometricType.hrv: false,
      BiometricType.sleep: false,
      BiometricType.activity: false,
      BiometricType.respiratoryRate: false,
    })
    Map<BiometricType, bool> biometricPermissions,
    @Default(false) bool onboardingCompleted,
    @Default(true) bool soundEnabled,
    @Default(0.7) double volume,
    @Default(false) bool hapticFeedbackEnabled,
  }) = _UserPreferences;

  factory UserPreferences.fromJson(Map<String, dynamic> json) =>
      _$UserPreferencesFromJson(json);

  bool isBiometricEnabled(BiometricType type) =>
      biometricPermissions[type] ?? false;

  bool get hasAnyBiometricPermission =>
      biometricPermissions.values.any((enabled) => enabled);

  int get enabledBiometricCount =>
      biometricPermissions.values.where((enabled) => enabled).length;

  UserPreferences toggleBiometric(BiometricType type) {
    final updated = Map<BiometricType, bool>.from(biometricPermissions);
    updated[type] = !(updated[type] ?? false);
    return copyWith(biometricPermissions: updated);
  }

  UserPreferences enableAllBiometrics() {
    final updated = Map<BiometricType, bool>.from(biometricPermissions);
    for (final type in BiometricType.values) {
      updated[type] = true;
    }
    return copyWith(biometricPermissions: updated);
  }

  UserPreferences disableAllBiometrics() {
    final updated = Map<BiometricType, bool>.from(biometricPermissions);
    for (final type in BiometricType.values) {
      updated[type] = false;
    }
    return copyWith(biometricPermissions: updated);
  }

  Map<String, dynamic> toDbMap() {
    return {
      'theme_mode': themeMode.name,
      'notifications_enabled': notificationsEnabled ? 1 : 0,
      'biometric_heart_rate':
          (biometricPermissions[BiometricType.heartRate] ?? false) ? 1 : 0,
      'biometric_hrv':
          (biometricPermissions[BiometricType.hrv] ?? false) ? 1 : 0,
      'biometric_sleep':
          (biometricPermissions[BiometricType.sleep] ?? false) ? 1 : 0,
      'biometric_activity':
          (biometricPermissions[BiometricType.activity] ?? false) ? 1 : 0,
      'biometric_respiratory_rate':
          (biometricPermissions[BiometricType.respiratoryRate] ?? false)
              ? 1
              : 0,
      'onboarding_completed': onboardingCompleted ? 1 : 0,
      'sound_enabled': soundEnabled ? 1 : 0,
      'volume': volume,
      'haptic_feedback_enabled': hapticFeedbackEnabled ? 1 : 0,
    };
  }

  factory UserPreferences.fromDbMap(Map<String, dynamic> map) {
    return UserPreferences(
      themeMode: AppThemeMode.values.firstWhere(
        (e) => e.name == (map['theme_mode'] as String? ?? 'auto'),
        orElse: () => AppThemeMode.auto,
      ),
      notificationsEnabled: (map['notifications_enabled'] as int? ?? 1) == 1,
      biometricPermissions: {
        BiometricType.heartRate:
            (map['biometric_heart_rate'] as int? ?? 0) == 1,
        BiometricType.hrv: (map['biometric_hrv'] as int? ?? 0) == 1,
        BiometricType.sleep: (map['biometric_sleep'] as int? ?? 0) == 1,
        BiometricType.activity:
            (map['biometric_activity'] as int? ?? 0) == 1,
        BiometricType.respiratoryRate:
            (map['biometric_respiratory_rate'] as int? ?? 0) == 1,
      },
      onboardingCompleted:
          (map['onboarding_completed'] as int? ?? 0) == 1,
      soundEnabled: (map['sound_enabled'] as int? ?? 1) == 1,
      volume: (map['volume'] as num? ?? 0.7).toDouble(),
      hapticFeedbackEnabled:
          (map['haptic_feedback_enabled'] as int? ?? 0) == 1,
    );
  }
}