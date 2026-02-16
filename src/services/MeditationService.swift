import Foundation
import AVFoundation
import Combine

enum MeditationState {
    case idle
    case preparing
    case active
    case paused
    case completed
    case cancelled
}

enum MeditationError: Error {
    case audioFileNotFound
    case audioPlayerInitFailed
    case sessionAlreadyActive
    case noActiveSession
    case invalidDuration
}

class MeditationService: NSObject, ObservableObject {
    @Published var currentState: MeditationState = .idle
    @Published var currentSession: MeditationSession?
    @Published var elapsedTime: TimeInterval = 0
    @Published var progress: Double = 0
    @Published var isPlaying: Bool = false
    
    private var audioPlayer: AVAudioPlayer?
    private var timer: Timer?
    private var startTime: Date?
    private var pausedTime: TimeInterval = 0
    private var totalDuration: TimeInterval = 0
    
    private let supabaseService: SupabaseService
    private let audioService: AudioService
    private let healthKitService: HealthKitService
    private let achievementService: AchievementService
    
    private var cancellables = Set<AnyCancellable>()
    
    override init() {
        self.supabaseService = SupabaseService.shared
        self.audioService = AudioService.shared
        self.healthKitService = HealthKitService.shared
        self.achievementService = AchievementService.shared
        
        super.init()
        
        setupAudioSession()
        setupNotifications()
    }
    
    private func setupAudioSession() {
        do {
            let audioSession = AVAudioSession.sharedInstance()
            try audioSession.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers])
            try audioSession.setActive(true)
        } catch {
            print("Failed to setup audio session: \(error)")
        }
    }
    
    private func setupNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: AVAudioSession.sharedInstance()
        )
    }
    
    func startSession(
        exercise: Exercise,
        stressBefore: Int,
        userId: UUID
    ) async throws {
        guard currentState == .idle else {
            throw MeditationError.sessionAlreadyActive
        }
        
        currentState = .preparing
        totalDuration = TimeInterval(exercise.durationSeconds)
        
        let session = MeditationSession(
            id: UUID(),
            userId: userId,
            exerciseId: exercise.id,
            stressBefore: stressBefore,
            stressAfter: nil,
            durationSeconds: exercise.durationSeconds,
            rating: nil,
            startedAt: Date(),
            completedAt: nil
        )
        
        currentSession = session
        
        try await loadAudio(exercise: exercise)
        
        startTime = Date()
        elapsedTime = 0
        progress = 0
        currentState = .active
        
        startTimer()
        playAudio()
        
        try await healthKitService.startMeditationWorkout()
        
        try await saveSessionToDatabase(session)
    }
    
    private func loadAudio(exercise: Exercise) async throws {
        guard let audioURL = URL(string: exercise.audioUrl) else {
            throw MeditationError.audioFileNotFound
        }
        
        let audioData = try await audioService.downloadAudio(from: audioURL)
        
        do {
            audioPlayer = try AVAudioPlayer(data: audioData)
            audioPlayer?.delegate = self
            audioPlayer?.prepareToPlay()
            audioPlayer?.volume = 1.0
        } catch {
            throw MeditationError.audioPlayerInitFailed
        }
    }
    
    private func playAudio() {
        audioPlayer?.play()
        isPlaying = true
    }
    
    func pauseSession() {
        guard currentState == .active else { return }
        
        currentState = .paused
        audioPlayer?.pause()
        isPlaying = false
        timer?.invalidate()
        timer = nil
        
        if let start = startTime {
            pausedTime += Date().timeIntervalSince(start)
        }
    }
    
    func resumeSession() {
        guard currentState == .paused else { return }
        
        currentState = .active
        startTime = Date()
        playAudio()
        startTimer()
    }
    
    func stopSession(stressAfter: Int?) async throws {
        guard let session = currentSession else {
            throw MeditationError.noActiveSession
        }
        
        currentState = .completed
        timer?.invalidate()
        timer = nil
        audioPlayer?.stop()
        isPlaying = false
        
        try await healthKitService.endMeditationWorkout()
        
        let completedSession = MeditationSession(
            id: session.id,
            userId: session.userId,
            exerciseId: session.exerciseId,
            stressBefore: session.stressBefore,
            stressAfter: stressAfter,
            durationSeconds: Int(elapsedTime),
            rating: session.rating,
            startedAt: session.startedAt,
            completedAt: Date()
        )
        
        currentSession = completedSession
        
        try await updateSessionInDatabase(completedSession)
        
        try await achievementService.checkAchievements(
            userId: session.userId,
            sessionCompleted: true,
            stressReduction: calculateStressReduction(
                before: session.stressBefore,
                after: stressAfter
            )
        )
        
        try await saveHealthKitData(session: completedSession)
    }
    
    func cancelSession() async throws {
        guard let session = currentSession else {
            throw MeditationError.noActiveSession
        }
        
        currentState = .cancelled
        timer?.invalidate()
        timer = nil
        audioPlayer?.stop()
        isPlaying = false
        
        try await healthKitService.endMeditationWorkout()
        
        try await deleteSessionFromDatabase(sessionId: session.id)
        
        currentSession = nil
        elapsedTime = 0
        progress = 0
        pausedTime = 0
    }
    
    func rateSession(rating: Int) async throws {
        guard var session = currentSession else {
            throw MeditationError.noActiveSession
        }
        
        session.rating = rating
        currentSession = session
        
        try await updateSessionInDatabase(session)
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            if let start = self.startTime {
                self.elapsedTime = self.pausedTime + Date().timeIntervalSince(start)
                self.progress = min(self.elapsedTime / self.totalDuration, 1.0)
                
                if self.elapsedTime >= self.totalDuration {
                    Task {
                        try? await self.stopSession(stressAfter: nil)
                    }
                }
            }
        }
    }
    
    private func calculateStressReduction(before: Int, after: Int?) -> Int? {
        guard let after = after else { return nil }
        return before - after
    }
    
    private func saveSessionToDatabase(_ session: MeditationSession) async throws {
        let data: [String: Any] = [
            "id": session.id.uuidString,
            "user_id": session.userId.uuidString,
            "exercise_id": session.exerciseId.uuidString,
            "stress_before": session.stressBefore,
            "duration_seconds": session.durationSeconds,
            "started_at": ISO8601DateFormatter().string(from: session.startedAt)
        ]
        
        _ = try await supabaseService.client
            .from("meditation_sessions")
            .insert(data)
            .execute()
    }
    
    private func updateSessionInDatabase(_ session: MeditationSession) async throws {
        var data: [String: Any] = [
            "stress_after": session.stressAfter as Any,
            "duration_seconds": session.durationSeconds,
            "rating": session.rating as Any
        ]
        
        if let completedAt = session.completedAt {
            data["completed_at"] = ISO8601DateFormatter().string(from: completedAt)
        }
        
        _ = try await supabaseService.client
            .from("meditation_sessions")
            .update(data)
            .eq("id", value: session.id.uuidString)
            .execute()
    }
    
    private func deleteSessionFromDatabase(sessionId: UUID) async throws {
        _ = try await supabaseService.client
            .from("meditation_sessions")
            .delete()
            .eq("id", value: sessionId.uuidString)
            .execute()
    }
    
    private func saveHealthKitData(session: MeditationSession) async throws {
        guard let completedAt = session.completedAt else { return }
        
        try await healthKitService.saveMeditationSession(
            startDate: session.startedAt,
            endDate: completedAt,
            duration: TimeInterval(session.durationSeconds)
        )
    }
    
    func getSessionHistory(userId: UUID, limit: Int = 50) async throws -> [MeditationSession] {
        let response = try await supabaseService.client
            .from("meditation_sessions")
            .select()
            .eq("user_id", value: userId.uuidString)
            .order("started_at", ascending: false)
            .limit(limit)
            .execute()
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        decoder.keyDecodingStrategy = .convertFromSnakeCase
        
        let sessions = try decoder.decode([MeditationSession].self, from: response.data)
        return sessions
    }
    
    func getSessionStats(userId: UUID) async throws -> SessionStats {
        let sessions = try await getSessionHistory(userId: userId)
        
        let totalSessions = sessions.count
        let totalMinutes = sessions.reduce(0) { $0 + $1.durationSeconds } / 60
        
        let completedSessions = sessions.filter { $0.completedAt != nil }
        let avgStressReduction = completedSessions.compactMap { session -> Double? in
            guard let after = session.stressAfter else { return nil }
            return Double(session.stressBefore - after)
        }.reduce(0, +) / Double(max(completedSessions.count, 1))
        
        let avgRating = completedSessions.compactMap { $0.rating }.reduce(0, +) / max(completedSessions.count, 1)
        
        return SessionStats(
            totalSessions: totalSessions,
            totalMinutes: totalMinutes,
            averageStressReduction: avgStressReduction,
            averageRating: Double(avgRating)
        )
    }
    
    @objc private func handleInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }
        
        switch type {
        case .began:
            if currentState == .active {
                pauseSession()
            }
        case .ended:
            guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else {
                return
            }
            let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
            if options.contains(.shouldResume) && currentState == .paused {
                resumeSession()
            }
        @unknown default:
            break
        }
    }
    
    @objc private func handleRouteChange(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        switch reason {
        case .oldDeviceUnavailable:
            if currentState == .active {
                pauseSession()
            }
        default:
            break
        }
    }
    
    deinit {
        timer?.invalidate()
        audioPlayer?.stop()
        NotificationCenter.default.removeObserver(self)
    }
}

extension MeditationService: AVAudioPlayerDelegate {
    func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        if flag && currentState == .active {
            Task {
                try? await stopSession(stressAfter: nil)
            }
        }
    }
    
    func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        print("Audio player decode error: \(error?.localizedDescription ?? "unknown")")
        if currentState == .active {
            pauseSession()
        }
    }
}

struct SessionStats {
    let totalSessions: Int
    let totalMinutes: Int
    let averageStressReduction: Double
    let averageRating: Double
}