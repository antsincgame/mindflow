import 'package:just_audio/just_audio.dart';
import 'package:audio_session/audio_session.dart';

enum AudioType {
  instruction,
  backgroundMusic,
  breathingCue,
}

class AudioService {
  static final AudioService _instance = AudioService._internal();
  factory AudioService() => _instance;
  AudioService._internal();

  AudioPlayer? _instructionPlayer;
  AudioPlayer? _backgroundMusicPlayer;
  AudioPlayer? _breathingCuePlayer;

  bool _isInitialized = false;
  double _instructionVolume = 1.0;
  double _backgroundMusicVolume = 0.3;
  double _breathingCueVolume = 0.7;

  bool get isInstructionPlaying => _instructionPlayer?.playing ?? false;
  bool get isBackgroundMusicPlaying => _backgroundMusicPlayer?.playing ?? false;

  Duration? get instructionDuration => _instructionPlayer?.duration;
  Duration? get instructionPosition => _instructionPlayer?.position;

  Stream<Duration>? get instructionPositionStream =>
      _instructionPlayer?.positionStream;

  Stream<PlayerState>? get instructionPlayerStateStream =>
      _instructionPlayer?.playerStateStream;

  Stream<Duration>? get backgroundMusicPositionStream =>
      _backgroundMusicPlayer?.positionStream;

  Stream<PlayerState>? get backgroundMusicPlayerStateStream =>
      _backgroundMusicPlayer?.playerStateStream;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      final session = await AudioSession.instance;
      await session.configure(const AudioSessionConfiguration(
        avAudioSessionCategory: AVAudioSessionCategory.playback,
        avAudioSessionCategoryOptions:
            AVAudioSessionCategoryOptions.mixWithOthers,
        avAudioSessionMode: AVAudioSessionMode.defaultMode,
        avAudioSessionRouteSharingPolicy:
            AVAudioSessionRouteSharingPolicy.defaultPolicy,
        avAudioSessionSetActiveOptions: AVAudioSessionSetActiveOptions.none,
        androidAudioAttributes: AndroidAudioAttributes(
          contentType: AndroidAudioContentType.music,
          usage: AndroidAudioUsage.media,
        ),
        androidAudioFocusGainType:
            AndroidAudioFocusGainType.gainTransientMayDuck,
        androidWillPauseWhenDucked: false,
      ));

      _instructionPlayer = AudioPlayer();
      _backgroundMusicPlayer = AudioPlayer();
      _breathingCuePlayer = AudioPlayer();

      await _instructionPlayer!.setVolume(_instructionVolume);
      await _backgroundMusicPlayer!.setVolume(_backgroundMusicVolume);
      await _breathingCuePlayer!.setVolume(_breathingCueVolume);

      _isInitialized = true;
    } catch (e) {
      _isInitialized = false;
      rethrow;
    }
  }

  Future<void> _ensureInitialized() async {
    if (!_isInitialized) {
      await initialize();
    }
  }

  AudioPlayer? _getPlayer(AudioType type) {
    switch (type) {
      case AudioType.instruction:
        return _instructionPlayer;
      case AudioType.backgroundMusic:
        return _backgroundMusicPlayer;
      case AudioType.breathingCue:
        return _breathingCuePlayer;
    }
  }

  // --- Instruction Audio ---

  Future<void> playInstruction(String assetPath) async {
    await _ensureInitialized();
    final player = _instructionPlayer;
    if (player == null) return;

    try {
      await player.setAsset(assetPath);
      await player.setVolume(_instructionVolume);
      await player.play();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> pauseInstruction() async {
    await _instructionPlayer?.pause();
  }

  Future<void> resumeInstruction() async {
    if (_instructionPlayer != null && !_instructionPlayer!.playing) {
      await _instructionPlayer!.play();
    }
  }

  Future<void> stopInstruction() async {
    await _instructionPlayer?.stop();
    await _instructionPlayer?.seek(Duration.zero);
  }

  Future<void> seekInstruction(Duration position) async {
    await _instructionPlayer?.seek(position);
  }

  // --- Background Music ---

  Future<void> playBackgroundMusic(String assetPath,
      {bool loop = true}) async {
    await _ensureInitialized();
    final player = _backgroundMusicPlayer;
    if (player == null) return;

    try {
      await player.setAsset(assetPath);
      await player.setVolume(_backgroundMusicVolume);
      if (loop) {
        await player.setLoopMode(LoopMode.one);
      } else {
        await player.setLoopMode(LoopMode.off);
      }
      await player.play();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> pauseBackgroundMusic() async {
    await _backgroundMusicPlayer?.pause();
  }

  Future<void> resumeBackgroundMusic() async {
    if (_backgroundMusicPlayer != null && !_backgroundMusicPlayer!.playing) {
      await _backgroundMusicPlayer!.play();
    }
  }

  Future<void> stopBackgroundMusic() async {
    await _backgroundMusicPlayer?.stop();
    await _backgroundMusicPlayer?.seek(Duration.zero);
  }

  Future<void> fadeOutBackgroundMusic({
    Duration duration = const Duration(seconds: 2),
  }) async {
    final player = _backgroundMusicPlayer;
    if (player == null || !player.playing) return;

    final startVolume = player.volume;
    const steps = 20;
    final stepDuration = duration ~/ steps;
    final volumeStep = startVolume / steps;

    for (int i = 0; i < steps; i++) {
      final newVolume = startVolume - (volumeStep * (i + 1));
      await player.setVolume(newVolume.clamp(0.0, 1.0));
      await Future.delayed(stepDuration);
    }

    await player.stop();
    await player.setVolume(_backgroundMusicVolume);
  }

  Future<void> fadeInBackgroundMusic(
    String assetPath, {
    Duration duration = const Duration(seconds: 2),
    bool loop = true,
  }) async {
    await _ensureInitialized();
    final player = _backgroundMusicPlayer;
    if (player == null) return;

    try {
      await player.setAsset(assetPath);
      if (loop) {
        await player.setLoopMode(LoopMode.one);
      }
      await player.setVolume(0.0);
      await player.play();

      const steps = 20;
      final stepDuration = duration ~/ steps;
      final volumeStep = _backgroundMusicVolume / steps;

      for (int i = 0; i < steps; i++) {
        final newVolume = volumeStep * (i + 1);
        await player.setVolume(newVolume.clamp(0.0, 1.0));
        await Future.delayed(stepDuration);
      }
    } catch (e) {
      rethrow;
    }
  }

  // --- Breathing Cue ---

  Future<void> playBreathingCue(String assetPath) async {
    await _ensureInitialized();
    final player = _breathingCuePlayer;
    if (player == null) return;

    try {
      await player.setAsset(assetPath);
      await player.setVolume(_breathingCueVolume);
      await player.play();
    } catch (e) {
      rethrow;
    }
  }

  Future<void> stopBreathingCue() async {
    await _breathingCuePlayer?.stop();
    await _breathingCuePlayer?.seek(Duration.zero);
  }

  // --- Volume Control ---

  Future<void> setVolume(AudioType type, double volume) async {
    final clampedVolume = volume.clamp(0.0, 1.0);

    switch (type) {
      case AudioType.instruction:
        _instructionVolume = clampedVolume;
        await _instructionPlayer?.setVolume(clampedVolume);
        break;
      case AudioType.backgroundMusic:
        _backgroundMusicVolume = clampedVolume;
        await _backgroundMusicPlayer?.setVolume(clampedVolume);
        break;
      case AudioType.breathingCue:
        _breathingCueVolume = clampedVolume;
        await _breathingCuePlayer?.setVolume(clampedVolume);
        break;
    }
  }

  double getVolume(AudioType type) {
    switch (type) {
      case AudioType.instruction:
        return _instructionVolume;
      case AudioType.backgroundMusic:
        return _backgroundMusicVolume;
      case AudioType.breathingCue:
        return _breathingCueVolume;
    }
  }

  // --- Session Control ---

  Future<void> pauseAll() async {
    await _instructionPlayer?.pause();
    await _backgroundMusicPlayer?.pause();
    await _breathingCuePlayer?.pause();
  }

  Future<void> resumeAll() async {
    if (_instructionPlayer != null &&
        _instructionPlayer!.processingState != ProcessingState.idle &&
        _instructionPlayer!.processingState != ProcessingState.completed) {
      await _instructionPlayer!.play();
    }
    if (_backgroundMusicPlayer != null &&
        _backgroundMusicPlayer!.processingState != ProcessingState.idle &&
        _backgroundMusicPlayer!.processingState != ProcessingState.completed) {
      await _backgroundMusicPlayer!.play();
    }
  }

  Future<void> stopAll() async {
    await stopInstruction();
    await stopBackgroundMusic();
    await stopBreathingCue();
  }

  // --- Exercise Session Helpers ---

  Future<void> startExerciseAudio({
    String? instructionAsset,
    String? backgroundMusicAsset,
  }) async {
    await _ensureInitialized();

    if (backgroundMusicAsset != null) {
      await fadeInBackgroundMusic(backgroundMusicAsset);
    }

    if (instructionAsset != null) {
      // Small delay so background music starts first
      await Future.delayed(const Duration(milliseconds: 500));
      await playInstruction(instructionAsset);
    }
  }

  Future<void> stopExerciseAudio() async {
    await stopInstruction();
    await fadeOutBackgroundMusic();
    await stopBreathingCue();
  }

  // --- Breathing Exercise Helpers ---

  static const String _breathInCueAsset = 'assets/audio/cues/breathe_in.mp3';
  static const String _breathOutCueAsset = 'assets/audio/cues/breathe_out.mp3';
  static const String _holdCueAsset = 'assets/audio/cues/hold.mp3';

  Future<void> playBreathInCue() async {
    await playBreathingCue(_breathInCueAsset);
  }

  Future<void> playBreathOutCue() async {
    await playBreathingCue(_breathOutCueAsset);
  }

  Future<void> playHoldCue() async {
    await playBreathingCue(_holdCueAsset);
  }

  // --- Lifecycle ---

  Future<void> dispose() async {
    await _instructionPlayer?.dispose();
    await _backgroundMusicPlayer?.dispose();
    await _breathingCuePlayer?.dispose();

    _instructionPlayer = null;
    _backgroundMusicPlayer = null;
    _breathingCuePlayer = null;
    _isInitialized = false;
  }
}