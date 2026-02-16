import SwiftUI
import Combine

enum SessionState {
    case idle
    case preparing
    case active
    case paused
    case completed
    case cancelled
}

enum SessionError: Error {
    case audioPlaybackFailed
    case healthKitUnavailable
    case sessionNotStarted
    case alreadyInProgress
}

class MeditationSessionManager: ObservableObject {
    @Published var state: SessionState = .idle
    @Published var currentExercise: Exercise?
    @Published var elapsedTime: TimeInterval = 0
    @Published var remainingTime: TimeInterval = 0
    @Published var stressBefore: Int = 0
    @Published var stressAfter: Int = 0
    @Published var isAudioPlaying: Bool = false
    @Published var error: SessionError?
    
    private let meditationService = MeditationService.shared
    private let audioService = AudioService.shared
    private let healthKitService = HealthKitService.shared
    private let stressAnalysisService = StressAnalysisService.shared
    
    private var sessionId: UUID?
    private var startTime: Date?
    private var timer: Timer?
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupAudioStateObserver()
    }
    
    private func setupAudioStateObserver() {
        audioService.$isPlaying
            .assign(to: &$isAudioPlaying)
    }
    
    func startSession(exercise: Exercise, stressLevel: Int) async throws {
        guard state == .idle else {
            throw SessionError.alreadyInProgress
        }
        
        state = .preparing
        currentExercise = exercise
        stressBefore = stressLevel
        remainingTime = TimeInterval(exercise.durationSeconds)
        
        // Адаптивная подготовка на основе стресса
        let preparationTime: TimeInterval = stressLevel >= 7 ? 0 : 15
        
        if preparationTime > 0 {
            try await Task.sleep(nanoseconds: UInt64(preparationTime * 1_000_000_000))
        }
        
        // Создаем сессию в БД
        sessionId = try await meditationService.createSession(
            exerciseId: exercise.id,
            stressBefore: stressLevel
        )
        
        // Запускаем аудио
        do {
            try await audioService.playExerciseAudio(exercise: exercise)
        } catch {
            state = .idle
            self.error = .audioPlaybackFailed
            throw SessionError.audioPlaybackFailed
        }
        
        // Начинаем сессию
        state = .active
        startTime = Date()
        startTimer()
        
        // Начинаем отслеживание HealthKit если доступно
        if healthKitService.isAuthorized {
            healthKitService.startHeartRateMonitoring()
        }
    }
    
    func pauseSession() {
        guard state == .active else { return }
        
        state = .paused
        timer?.invalidate()
        timer = nil
        audioService.pause()
    }
    
    func resumeSession() {
        guard state == .paused else { return }
        
        state = .active
        startTimer()
        audioService.resume()
    }
    
    func completeSession() async throws {
        guard state == .active || state == .paused else {
            throw SessionError.sessionNotStarted
        }
        
        timer?.invalidate()
        timer = nil
        audioService.stop()
        
        if healthKitService.isAuthorized {
            healthKitService.stopHeartRateMonitoring()
        }
        
        state = .completed
        
        // Анализируем стресс после сессии
        let currentStress = await stressAnalysisService.getCurrentStressLevel()
        stressAfter = currentStress
        
        // Сохраняем результат в БД
        if let sessionId = sessionId,
           let startTime = startTime {
            try await meditationService.completeSession(
                sessionId: sessionId,
                stressAfter: stressAfter,
                durationSeconds: Int(elapsedTime),
                completedAt: Date()
            )
            
            // Записываем в HealthKit
            if healthKitService.isAuthorized {
                try await healthKitService.saveMeditationSession(
                    startDate: startTime,
                    endDate: Date()
                )
            }
        }
    }
    
    func cancelSession() {
        timer?.invalidate()
        timer = nil
        audioService.stop()
        
        if healthKitService.isAuthorized {
            healthKitService.stopHeartRateMonitoring()
        }
        
        state = .cancelled
        reset()
    }
    
    func rateSession(rating: Int) async throws {
        guard let sessionId = sessionId else {
            throw SessionError.sessionNotStarted
        }
        
        try await meditationService.rateSession(
            sessionId: sessionId,
            rating: rating
        )
    }
    
    func switchExercise(_ newExercise: Exercise) async throws {
        guard state == .active || state == .paused else {
            throw SessionError.sessionNotStarted
        }
        
        let wasActive = state == .active
        
        // Останавливаем текущее аудио
        audioService.stop()
        
        // Обновляем упражнение
        currentExercise = newExercise
        remainingTime = TimeInterval(newExercise.durationSeconds)
        elapsedTime = 0
        
        // Запускаем новое аудио
        try await audioService.playExerciseAudio(exercise: newExercise)
        
        if wasActive {
            state = .active
            startTimer()
        } else {
            state = .paused
        }
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            self.elapsedTime += 1
            self.remainingTime = max(0, TimeInterval(self.currentExercise?.durationSeconds ?? 0) - self.elapsedTime)
            
            // Автоматическое завершение при истечении времени
            if self.remainingTime <= 0 {
                Task {
                    try? await self.completeSession()
                }
            }
        }
    }
    
    private func reset() {
        sessionId = nil
        startTime = nil
        currentExercise = nil
        elapsedTime = 0
        remainingTime = 0
        stressBefore = 0
        stressAfter = 0
        error = nil
    }
    
    deinit {
        timer?.invalidate()
        audioService.stop()
        if healthKitService.isAuthorized {
            healthKitService.stopHeartRateMonitoring()
        }
    }
}

// MARK: - SwiftUI Hook
struct UseMeditationSession {
    @StateObject private var manager = MeditationSessionManager()
    
    var state: SessionState {
        manager.state
    }
    
    var currentExercise: Exercise? {
        manager.currentExercise
    }
    
    var elapsedTime: TimeInterval {
        manager.elapsedTime
    }
    
    var remainingTime: TimeInterval {
        manager.remainingTime
    }
    
    var stressBefore: Int {
        manager.stressBefore
    }
    
    var stressAfter: Int {
        manager.stressAfter
    }
    
    var isAudioPlaying: Bool {
        manager.isAudioPlaying
    }
    
    var error: SessionError? {
        manager.error
    }
    
    var progress: Double {
        guard let exercise = currentExercise else { return 0 }
        return min(1.0, manager.elapsedTime / TimeInterval(exercise.durationSeconds))
    }
    
    var formattedElapsedTime: String {
        formatTime(manager.elapsedTime)
    }
    
    var formattedRemainingTime: String {
        formatTime(manager.remainingTime)
    }
    
    func startSession(exercise: Exercise, stressLevel: Int) async throws {
        try await manager.startSession(exercise: exercise, stressLevel: stressLevel)
    }
    
    func pauseSession() {
        manager.pauseSession()
    }
    
    func resumeSession() {
        manager.resumeSession()
    }
    
    func completeSession() async throws {
        try await manager.completeSession()
    }
    
    func cancelSession() {
        manager.cancelSession()
    }
    
    func rateSession(rating: Int) async throws {
        try await manager.rateSession(rating: rating)
    }
    
    func switchExercise(_ newExercise: Exercise) async throws {
        try await manager.switchExercise(newExercise)
    }
    
    private func formatTime(_ timeInterval: TimeInterval) -> String {
        let minutes = Int(timeInterval) / 60
        let seconds = Int(timeInterval) % 60
        return String(format: "%02d:%02d", minutes, seconds)
    }
}

// MARK: - View Extension
extension View {
    func useMeditationSession() -> UseMeditationSession {
        UseMeditationSession()
    }
}