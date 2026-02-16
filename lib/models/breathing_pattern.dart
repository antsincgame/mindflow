import 'package:freezed_annotation/freezed_annotation.dart';

part 'breathing_pattern.freezed.dart';
part 'breathing_pattern.g.dart';

@freezed
class BreathingPattern with _$BreathingPattern {
  const BreathingPattern._();

  const factory BreathingPattern({
    required String id,
    required String name,
    required String description,
    @JsonKey(name: 'inhale_duration') required double inhaleDuration,
    @JsonKey(name: 'hold_duration') @Default(0.0) double holdDuration,
    @JsonKey(name: 'exhale_duration') required double exhaleDuration,
    @JsonKey(name: 'hold_after_exhale_duration')
    @Default(0.0)
    double holdAfterExhaleDuration,
    @Default(4) int cycles,
  }) = _BreathingPattern;

  factory BreathingPattern.fromJson(Map<String, dynamic> json) =>
      _$BreathingPatternFromJson(json);

  /// Total duration of a single cycle in seconds.
  double get cycleDuration =>
      inhaleDuration + holdDuration + exhaleDuration + holdAfterExhaleDuration;

  /// Total duration of the entire exercise in seconds.
  double get totalDuration => cycleDuration * cycles;

  /// Human-readable pattern label, e.g. "4-7-8".
  String get patternLabel {
    final parts = <String>[
      inhaleDuration.toInt().toString(),
      if (holdDuration > 0) holdDuration.toInt().toString(),
      exhaleDuration.toInt().toString(),
      if (holdAfterExhaleDuration > 0)
        holdAfterExhaleDuration.toInt().toString(),
    ];
    return parts.join('-');
  }

  // ──────────────────────────────────────────────
  // Presets
  // ──────────────────────────────────────────────

  /// 4-7-8 technique – calming, helps with sleep and anxiety.
  static const BreathingPattern relaxing478 = BreathingPattern(
    id: 'pattern_4_7_8',
    name: '4-7-8 Breathing',
    description:
        'Inhale for 4 seconds, hold for 7, exhale for 8. '
        'A deeply calming technique that activates the parasympathetic nervous system.',
    inhaleDuration: 4,
    holdDuration: 7,
    exhaleDuration: 8,
    holdAfterExhaleDuration: 0,
    cycles: 4,
  );

  /// Box breathing (4-4-4-4) – focus and stress relief.
  static const BreathingPattern boxBreathing = BreathingPattern(
    id: 'pattern_box',
    name: 'Box Breathing',
    description:
        'Equal phases of 4 seconds each: inhale, hold, exhale, hold. '
        'Used by Navy SEALs to stay calm under pressure.',
    inhaleDuration: 4,
    holdDuration: 4,
    exhaleDuration: 4,
    holdAfterExhaleDuration: 4,
    cycles: 4,
  );

  /// Extended exhale (4-0-8) – quick stress relief.
  static const BreathingPattern extendedExhale = BreathingPattern(
    id: 'pattern_extended_exhale',
    name: 'Extended Exhale',
    description:
        'Inhale for 4 seconds, then slowly exhale for 8. '
        'The longer exhale triggers a relaxation response in the body.',
    inhaleDuration: 4,
    holdDuration: 0,
    exhaleDuration: 8,
    holdAfterExhaleDuration: 0,
    cycles: 6,
  );

  /// Simple deep breathing (4-2-6) – gentle intro for beginners.
  static const BreathingPattern deepBreathing = BreathingPattern(
    id: 'pattern_deep',
    name: 'Deep Breathing',
    description:
        'A gentle pattern with a short hold: inhale 4, hold 2, exhale 6. '
        'Great for beginners or a quick reset.',
    inhaleDuration: 4,
    holdDuration: 2,
    exhaleDuration: 6,
    holdAfterExhaleDuration: 0,
    cycles: 5,
  );

  /// Energising breathing (2-0-2) – quick energiser.
  static const BreathingPattern energising = BreathingPattern(
    id: 'pattern_energising',
    name: 'Energising Breath',
    description:
        'Fast, rhythmic breathing with equal 2-second phases. '
        'Increases alertness and energy.',
    inhaleDuration: 2,
    holdDuration: 0,
    exhaleDuration: 2,
    holdAfterExhaleDuration: 0,
    cycles: 10,
  );

  /// All available presets.
  static const List<BreathingPattern> presets = [
    relaxing478,
    boxBreathing,
    extendedExhale,
    deepBreathing,
    energising,
  ];

  /// Look up a preset by its [id]. Returns `null` if not found.
  static BreathingPattern? findById(String id) {
    try {
      return presets.firstWhere((p) => p.id == id);
    } catch (_) {
      return null;
    }
  }
}