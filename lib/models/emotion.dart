import 'package:flutter/material.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'emotion.freezed.dart';
part 'emotion.g.dart';

enum EmotionType {
  @JsonValue('sadness')
  sadness,
  @JsonValue('stress')
  stress,
  @JsonValue('anxiety')
  anxiety,
  @JsonValue('fatigue')
  fatigue,
}

extension EmotionTypeExtension on EmotionType {
  String get displayName {
    switch (this) {
      case EmotionType.sadness:
        return 'Грусть';
      case EmotionType.stress:
        return 'Стресс';
      case EmotionType.anxiety:
        return 'Беспокойство';
      case EmotionType.fatigue:
        return 'Усталость';
    }
  }

  String get description {
    switch (this) {
      case EmotionType.sadness:
        return 'Чувство печали, подавленности или меланхолии';
      case EmotionType.stress:
        return 'Ощущение напряжения, давления или перегрузки';
      case EmotionType.anxiety:
        return 'Тревога, беспокойство или нервозность';
      case EmotionType.fatigue:
        return 'Чувство усталости, истощения или нехватки энергии';
    }
  }

  String get icon {
    switch (this) {
      case EmotionType.sadness:
        return '☁️';
      case EmotionType.stress:
        return '⚡';
      case EmotionType.anxiety:
        return '🌀';
      case EmotionType.fatigue:
        return '🪫';
    }
  }

  IconData get iconData {
    switch (this) {
      case EmotionType.sadness:
        return Icons.cloud;
      case EmotionType.stress:
        return Icons.flash_on;
      case EmotionType.anxiety:
        return Icons.cyclone;
      case EmotionType.fatigue:
        return Icons.battery_2_bar;
    }
  }

  Color get color {
    switch (this) {
      case EmotionType.sadness:
        return const Color(0xFF7EB3D8);
      case EmotionType.stress:
        return const Color(0xFFE8A87C);
      case EmotionType.anxiety:
        return const Color(0xFFB39DDB);
      case EmotionType.fatigue:
        return const Color(0xFF8CBFA0);
    }
  }

  Color get gradientStartColor {
    switch (this) {
      case EmotionType.sadness:
        return const Color(0xFFA8D4F0);
      case EmotionType.stress:
        return const Color(0xFFF0C8A0);
      case EmotionType.anxiety:
        return const Color(0xFFD1C4E9);
      case EmotionType.fatigue:
        return const Color(0xFFB2DFCB);
    }
  }

  Color get gradientEndColor {
    switch (this) {
      case EmotionType.sadness:
        return const Color(0xFF5A9AC4);
      case EmotionType.stress:
        return const Color(0xFFD4896A);
      case EmotionType.anxiety:
        return const Color(0xFF9575CD);
      case EmotionType.fatigue:
        return const Color(0xFF6DA87E);
    }
  }

  LinearGradient get gradient {
    return LinearGradient(
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
      colors: [gradientStartColor, gradientEndColor],
    );
  }
}

@freezed
class Emotion with _$Emotion {
  const Emotion._();

  const factory Emotion({
    required String id,
    required EmotionType type,
    String? customName,
    String? customDescription,
    @JsonKey(includeFromJson: false, includeToJson: false)
    @Default(null)
    Color? customColor,
  }) = _Emotion;

  factory Emotion.fromJson(Map<String, dynamic> json) =>
      _$EmotionFromJson(json);

  String get displayName => customName ?? type.displayName;

  String get description => customDescription ?? type.description;

  String get icon => type.icon;

  IconData get iconData => type.iconData;

  Color get color => customColor ?? type.color;

  LinearGradient get gradient => type.gradient;

  factory Emotion.sadness() => const Emotion(
        id: 'emotion_sadness',
        type: EmotionType.sadness,
      );

  factory Emotion.stress() => const Emotion(
        id: 'emotion_stress',
        type: EmotionType.stress,
      );

  factory Emotion.anxiety() => const Emotion(
        id: 'emotion_anxiety',
        type: EmotionType.anxiety,
      );

  factory Emotion.fatigue() => const Emotion(
        id: 'emotion_fatigue',
        type: EmotionType.fatigue,
      );

  static List<Emotion> get allEmotions => [
        Emotion.sadness(),
        Emotion.stress(),
        Emotion.anxiety(),
        Emotion.fatigue(),
      ];

  Map<String, dynamic> toDbMap() {
    return {
      'id': id,
      'type': type.name,
      'custom_name': customName,
      'custom_description': customDescription,
    };
  }

  factory Emotion.fromDbMap(Map<String, dynamic> map) {
    final typeStr = map['type'] as String;
    final emotionType = EmotionType.values.firstWhere(
      (e) => e.name == typeStr,
      orElse: () => EmotionType.stress,
    );

    return Emotion(
      id: map['id'] as String,
      type: emotionType,
      customName: map['custom_name'] as String?,
      customDescription: map['custom_description'] as String?,
    );
  }
}