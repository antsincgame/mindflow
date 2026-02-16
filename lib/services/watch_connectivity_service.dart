import 'dart:async';
import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/services.dart';

import '../models/biometric_data.dart';
import '../models/exercise.dart';
import '../models/session.dart';

enum WatchConnectionState {
  disconnected,
  connecting,
  connected,
  notSupported,
  notPaired,
  watchAppNotInstalled,
}

enum WatchMessageType {
  sessionStarted,
  sessionPaused,
  sessionResumed,
  sessionCompleted,
  sessionCancelled,
  exerciseData,
  biometricUpdate,
  stressLevelUpdate,
  heartRateUpdate,
  breathingPhaseUpdate,
  syncRequest,
  syncResponse,
  ping,
  pong,
}

class WatchMessage {
  final WatchMessageType type;
  final Map<String, dynamic> payload;
  final DateTime timestamp;

  WatchMessage({
    required this.type,
    required this.payload,
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();

  Map<String, dynamic> toMap() => {
        'type': type.name,
        'payload': payload,
        'timestamp': timestamp.toIso8601String(),
      };

  factory WatchMessage.fromMap(Map<String, dynamic> map) {
    return WatchMessage(
      type: WatchMessageType.values.firstWhere(
        (e) => e.name == map['type'],
        orElse: () => WatchMessageType.ping,
      ),
      payload: Map<String, dynamic>.from(map['payload'] ?? {}),
      timestamp: map['timestamp'] != null
          ? DateTime.parse(map['timestamp'])
          : DateTime.now(),
    );
  }
}

class WatchConnectivityService {
  static final WatchConnectivityService _instance =
      WatchConnectivityService._internal();
  factory WatchConnectivityService() => _instance;
  WatchConnectivityService._internal();

  static const MethodChannel _channel =
      MethodChannel('com.mindflow.app/watch_connectivity');

  static const EventChannel _biometricEventChannel =
      EventChannel('com.mindflow.app/watch_biometric_stream');

  static const EventChannel _messageEventChannel =
      EventChannel('com.mindflow.app/watch_message_stream');

  WatchConnectionState _connectionState = WatchConnectionState.disconnected;
  WatchConnectionState get connectionState => _connectionState;

  bool _isReachable = false;
  bool get isReachable => _isReachable;

  bool _isInitialized = false;

  final StreamController<WatchConnectionState> _connectionStateController =
      StreamController<WatchConnectionState>.broadcast();
  Stream<WatchConnectionState> get connectionStateStream =>
      _connectionStateController.stream;

  final StreamController<BiometricData> _biometricController =
      StreamController<BiometricData>.broadcast();
  Stream<BiometricData> get biometricStream => _biometricController.stream;

  final StreamController<double> _heartRateController =
      StreamController<double>.broadcast();
  Stream<double> get heartRateStream => _heartRateController.stream;

  final StreamController<int> _stressLevelController =
      StreamController<int>.broadcast();
  Stream<int> get stressLevelStream => _stressLevelController.stream;

  final StreamController<WatchMessage> _messageController =
      StreamController<WatchMessage>.broadcast();
  Stream<WatchMessage> get messageStream => _messageController.stream;

  StreamSubscription? _biometricStreamSubscription;
  StreamSubscription? _messageStreamSubscription;

  BiometricData? _latestBiometricData;
  BiometricData? get latestBiometricData => _latestBiometricData;

  double? _latestHeartRate;
  double? get latestHeartRate => _latestHeartRate;

  Timer? _heartbeatTimer;

  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      _channel.setMethodCallHandler(_handleMethodCall);

      final result = await _channel.invokeMethod<Map>('initialize');
      if (result != null) {
        _updateConnectionState(_parseConnectionState(result['state']));
        _isReachable = result['isReachable'] ?? false;
      }

      _listenToBiometricStream();
      _listenToMessageStream();
      _startHeartbeat();

      _isInitialized = true;
      debugPrint('WatchConnectivityService initialized');
    } on PlatformException catch (e) {
      debugPrint('WatchConnectivity initialization failed: ${e.message}');
      _updateConnectionState(WatchConnectionState.notSupported);
    } on MissingPluginException {
      debugPrint('WatchConnectivity plugin not available');
      _updateConnectionState(WatchConnectionState.notSupported);
    }
  }

  Future<dynamic> _handleMethodCall(MethodCall call) async {
    switch (call.method) {
      case 'onConnectionStateChanged':
        final state = _parseConnectionState(call.arguments['state']);
        _updateConnectionState(state);
        break;

      case 'onReachabilityChanged':
        _isReachable = call.arguments['isReachable'] ?? false;
        if (_isReachable) {
          _updateConnectionState(WatchConnectionState.connected);
        }
        break;

      case 'onMessageReceived':
        final messageMap = Map<String, dynamic>.from(call.arguments);
        _handleIncomingMessage(messageMap);
        break;

      case 'onBiometricDataReceived':
        final dataMap = Map<String, dynamic>.from(call.arguments);
        _handleBiometricData(dataMap);
        break;

      case 'onSessionCompletedOnWatch':
        final sessionMap = Map<String, dynamic>.from(call.arguments);
        _handleWatchSessionCompleted(sessionMap);
        break;

      case 'onHeartRateUpdate':
        final heartRate = (call.arguments['heartRate'] as num).toDouble();
        _latestHeartRate = heartRate;
        _heartRateController.add(heartRate);
        break;

      default:
        debugPrint('Unhandled watch method: ${call.method}');
    }
  }

  void _listenToBiometricStream() {
    _biometricStreamSubscription?.cancel();
    _biometricStreamSubscription = _biometricEventChannel
        .receiveBroadcastStream()
        .listen(
      (event) {
        if (event is Map) {
          _handleBiometricData(Map<String, dynamic>.from(event));
        }
      },
      onError: (error) {
        debugPrint('Biometric stream error: $error');
      },
    );
  }

  void _listenToMessageStream() {
    _messageStreamSubscription?.cancel();
    _messageStreamSubscription = _messageEventChannel
        .receiveBroadcastStream()
        .listen(
      (event) {
        if (event is Map) {
          _handleIncomingMessage(Map<String, dynamic>.from(event));
        }
      },
      onError: (error) {
        debugPrint('Message stream error: $error');
      },
    );
  }

  void _startHeartbeat() {
    _heartbeatTimer?.cancel();
    _heartbeatTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => _sendPing(),
    );
  }

  Future<void> _sendPing() async {
    if (_connectionState != WatchConnectionState.connected) return;
    try {
      await sendMessage(WatchMessage(
        type: WatchMessageType.ping,
        payload: {'timestamp': DateTime.now().toIso8601String()},
      ));
    } catch (_) {}
  }

  // --- Public API ---

  Future<bool> isWatchPaired() async {
    try {
      final result = await _channel.invokeMethod<bool>('isPaired');
      return result ?? false;
    } on PlatformException {
      return false;
    }
  }

  Future<bool> isWatchAppInstalled() async {
    try {
      final result = await _channel.invokeMethod<bool>('isWatchAppInstalled');
      return result ?? false;
    } on PlatformException {
      return false;
    }
  }

  Future<bool> isWatchReachable() async {
    try {
      final result = await _channel.invokeMethod<bool>('isReachable');
      _isReachable = result ?? false;
      return _isReachable;
    } on PlatformException {
      return false;
    }
  }

  Future<void> sendMessage(WatchMessage message) async {
    if (_connectionState != WatchConnectionState.connected && !_isReachable) {
      debugPrint('Watch not connected, queuing message');
      await _queueMessage(message);
      return;
    }

    try {
      await _channel.invokeMethod('sendMessage', message.toMap());
    } on PlatformException catch (e) {
      debugPrint('Failed to send message to watch: ${e.message}');
      await _queueMessage(message);
    }
  }

  Future<void> sendSessionStarted(Session session, Exercise exercise) async {
    final message = WatchMessage(
      type: WatchMessageType.sessionStarted,
      payload: {
        'sessionId': session.id,
        'exerciseId': exercise.id,
        'exerciseName': exercise.name,
        'exerciseType': exercise.type.name,
        'durationSeconds': exercise.durationSeconds,
        'breathingPattern': exercise.breathingPattern != null
            ? {
                'inhaleDuration': exercise.breathingPattern!.inhaleDuration,
                'holdDuration': exercise.breathingPattern!.holdDuration,
                'exhaleDuration': exercise.breathingPattern!.exhaleDuration,
                'holdAfterExhaleDuration':
                    exercise.breathingPattern!.holdAfterExhaleDuration,
                'cycles': exercise.breathingPattern!.cycles,
              }
            : null,
      },
    );
    await sendMessage(message);
  }

  Future<void> sendSessionPaused(String sessionId) async {
    await sendMessage(WatchMessage(
      type: WatchMessageType.sessionPaused,
      payload: {'sessionId': sessionId},
    ));
  }

  Future<void> sendSessionResumed(String sessionId) async {
    await sendMessage(WatchMessage(
      type: WatchMessageType.sessionResumed,
      payload: {'sessionId': sessionId},
    ));
  }

  Future<void> sendSessionCompleted(Session session) async {
    await sendMessage(WatchMessage(
      type: WatchMessageType.sessionCompleted,
      payload: {
        'sessionId': session.id,
        'exerciseId': session.exerciseId,
        'duration': session.duration,
        'stressBefore': session.stressBefore,
        'stressAfter': session.stressAfter,
        'heartRateBefore': session.heartRateBefore,
        'heartRateAfter': session.heartRateAfter,
        'completed': session.completed,
      },
    ));
  }

  Future<void> sendSessionCancelled(String sessionId) async {
    await sendMessage(WatchMessage(
      type: WatchMessageType.sessionCancelled,
      payload: {'sessionId': sessionId},
    ));
  }

  Future<void> sendExerciseToWatch(Exercise exercise) async {
    await sendMessage(WatchMessage(
      type: WatchMessageType.exerciseData,
      payload: {
        'id': exercise.id,
        'name': exercise.name,
        'type': exercise.type.name,
        'durationSeconds': exercise.durationSeconds,
        'description': exercise.description,
        'breathingPattern': exercise.breathingPattern != null
            ? {
                'inhaleDuration': exercise.breathingPattern!.inhaleDuration,
                'holdDuration': exercise.breathingPattern!.holdDuration,
                'exhaleDuration': exercise.breathingPattern!.exhaleDuration,
                'holdAfterExhaleDuration':
                    exercise.breathingPattern!.holdAfterExhaleDuration,
                'cycles': exercise.breathingPattern!.cycles,
              }
            : null,
      },
    ));
  }

  Future<void> syncExercisesToWatch(List<Exercise> exercises) async {
    for (final exercise in exercises) {
      await sendExerciseToWatch(exercise);
      await Future.delayed(const Duration(milliseconds: 100));
    }
  }

  Future<void> sendBreathingPhaseUpdate({
    required String phase,
    required int remainingSeconds,
    required int currentCycle,
    required int totalCycles,
  }) async {
    await sendMessage(WatchMessage(
      type: WatchMessageType.breathingPhaseUpdate,
      payload: {
        'phase': phase,
        'remainingSeconds': remainingSeconds,
        'currentCycle': currentCycle,
        'totalCycles': totalCycles,
      },
    ));
  }

  Future<void> requestBiometricSync() async {
    await sendMessage(WatchMessage(
      type: WatchMessageType.syncRequest,
      payload: {'dataType': 'biometric'},
    ));
  }

  Future<void> startRealtimeHeartRateMonitoring() async {
    try {
      await _channel.invokeMethod('startHeartRateMonitoring');
    } on PlatformException catch (e) {
      debugPrint('Failed to start heart rate monitoring: ${e.message}');
    }
  }

  Future<void> stopRealtimeHeartRateMonitoring() async {
    try {
      await _channel.invokeMethod('stopHeartRateMonitoring');
    } on PlatformException catch (e) {
      debugPrint('Failed to stop heart rate monitoring: ${e.message}');
    }
  }

  Future<void> transferUserContext(Map<String, dynamic> context) async {
    try {
      await _channel.invokeMethod('updateApplicationContext', context);
    } on PlatformException catch (e) {
      debugPrint('Failed to transfer user context: ${e.message}');
    }
  }

  Future<void> sendComplicationUpdate({
    required int stressLevel,
    required int todaySessions,
    required int currentStreak,
  }) async {
    await transferUserContext({
      'complication': {
        'stressLevel': stressLevel,
        'todaySessions': todaySessions,
        'currentStreak': currentStreak,
        'updatedAt': DateTime.now().toIso8601String(),
      },
    });
  }

  // --- Private helpers ---

  void _handleIncomingMessage(Map<String, dynamic> messageMap) {
    try {
      final message = WatchMessage.fromMap(messageMap);
      _messageController.add(message);

      switch (message.type) {
        case WatchMessageType.biometricUpdate:
          _handleBiometricData(message.payload);
          break;
        case WatchMessageType.heartRateUpdate:
          final hr = (message.payload['heartRate'] as num).toDouble();
          _latestHeartRate = hr;
          _heartRateController.add(hr);
          break;
        case WatchMessageType.stressLevelUpdate:
          final level = message.payload['stressLevel'] as int;
          _stressLevelController.add(level);
          break;
        case WatchMessageType.pong:
          debugPrint('Watch pong received');
          break;
        case WatchMessageType.sessionCompleted:
          _handleWatchSessionCompleted(message.payload);
          break;
        default:
          break;
      }
    } catch (e) {
      debugPrint('Error handling incoming watch message: $e');