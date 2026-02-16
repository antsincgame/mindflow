import XCTest
import Combine
@testable import MindFlow

final class MeditationServiceTests: XCTestCase {
    
    var sut: MeditationService!
    var mockSupabaseService: MockSupabaseService!
    var mockAudioService: MockAudioService!
    var mockHealthKitService: MockHealthKitService!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        mockSupabaseService = MockSupabaseService()
        mockAudioService = MockAudioService()
        mockHealthKitService = MockHealthKitService()
        sut = MeditationService(
            supabaseService: mockSupabaseService,
            audioService: mockAudioService,
            healthKitService: mockHealthKitService
        )
        cancellables = []
    }
    
    override func tearDown() {
        cancellables = nil
        sut = nil
        mockHealthKitService = nil
        mockAudioService = nil
        mockSupabaseService = nil
        super.tearDown()
    }
    
    // MARK: - Session Start Tests
    
    func testStartSession_Success() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Breathing Exercise",
            description: "Basic breathing",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        let stressLevel = 7
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        let session = try await sut.startSession(exercise: exercise, stressLevel: stressLevel)
        
        XCTAssertNotNil(session)
        XCTAssertEqual(session.exerciseId, exercise.id)
        XCTAssertEqual(session.stressBefore, stressLevel)
        XCTAssertNil(session.stressAfter)
        XCTAssertNil(session.completedAt)
        XCTAssertTrue(mockAudioService.playAudioCalled)
    }
    
    func testStartSession_AudioPlaybackFailure() async {
        let exercise = Exercise(
            id: UUID(),
            name: "Test Exercise",
            description: "Test",
            type: .mindfulness,
            durationSeconds: 180,
            audioURL: "invalid.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = false
        
        do {
            _ = try await sut.startSession(exercise: exercise, stressLevel: 5)
            XCTFail("Expected audio playback error")
        } catch {
            XCTAssertTrue(error is MeditationServiceError)
            if case MeditationServiceError.audioPlaybackFailed = error {
                XCTAssertTrue(true)
            } else {
                XCTFail("Wrong error type")
            }
        }
    }
    
    func testStartSession_DatabaseFailure() async {
        let exercise = Exercise(
            id: UUID(),
            name: "Test Exercise",
            description: "Test",
            type: .bodyScan,
            durationSeconds: 600,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = false
        
        do {
            _ = try await sut.startSession(exercise: exercise, stressLevel: 6)
            XCTFail("Expected database error")
        } catch {
            XCTAssertTrue(error is MeditationServiceError)
        }
    }
    
    func testStartSession_UpdatesCurrentSession() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        let expectation = expectation(description: "Current session updated")
        var receivedSession: MeditationSession?
        
        sut.currentSessionPublisher
            .dropFirst()
            .sink { session in
                receivedSession = session
                expectation.fulfill()
            }
            .store(in: &cancellables)
        
        _ = try await sut.startSession(exercise: exercise, stressLevel: 5)
        
        await fulfillment(of: [expectation], timeout: 2.0)
        XCTAssertNotNil(receivedSession)
        XCTAssertEqual(receivedSession?.exerciseId, exercise.id)
    }
    
    // MARK: - Session Pause Tests
    
    func testPauseSession_Success() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        _ = try await sut.startSession(exercise: exercise, stressLevel: 5)
        
        try await sut.pauseSession()
        
        XCTAssertTrue(mockAudioService.pauseAudioCalled)
        XCTAssertTrue(sut.isPaused)
    }
    
    func testPauseSession_NoActiveSession() async {
        do {
            try await sut.pauseSession()
            XCTFail("Expected no active session error")
        } catch {
            XCTAssertTrue(error is MeditationServiceError)
            if case MeditationServiceError.noActiveSession = error {
                XCTAssertTrue(true)
            } else {
                XCTFail("Wrong error type")
            }
        }
    }
    
    func testResumeSession_Success() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        _ = try await sut.startSession(exercise: exercise, stressLevel: 5)
        try await sut.pauseSession()
        
        try await sut.resumeSession()
        
        XCTAssertTrue(mockAudioService.resumeAudioCalled)
        XCTAssertFalse(sut.isPaused)
    }
    
    // MARK: - Session Complete Tests
    
    func testCompleteSession_Success() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        mockHealthKitService.shouldSucceed = true
        mockHealthKitService.mockHeartRate = 65.0
        
        let startedSession = try await sut.startSession(exercise: exercise, stressLevel: 8)
        
        try await Task.sleep(nanoseconds: 100_000_000)
        
        let stressAfter = 4
        let completedSession = try await sut.completeSession(stressAfter: stressAfter, rating: 5)
        
        XCTAssertEqual(completedSession.id, startedSession.id)
        XCTAssertEqual(completedSession.stressAfter, stressAfter)
        XCTAssertEqual(completedSession.rating, 5)
        XCTAssertNotNil(completedSession.completedAt)
        XCTAssertGreaterThan(completedSession.durationSeconds, 0)
        XCTAssertTrue(mockAudioService.stopAudioCalled)
        XCTAssertTrue(mockSupabaseService.updateSessionCalled)
    }
    
    func testCompleteSession_SavesHealthKitData() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .mindfulness,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        mockHealthKitService.shouldSucceed = true
        
        _ = try await sut.startSession(exercise: exercise, stressLevel: 7)
        try await Task.sleep(nanoseconds: 100_000_000)
        _ = try await sut.completeSession(stressAfter: 3, rating: 4)
        
        XCTAssertTrue(mockHealthKitService.saveMindfulSessionCalled)
    }
    
    func testCompleteSession_NoActiveSession() async {
        do {
            _ = try await sut.completeSession(stressAfter: 3, rating: 5)
            XCTFail("Expected no active session error")
        } catch {
            XCTAssertTrue(error is MeditationServiceError)
        }
    }
    
    func testCompleteSession_WithoutRating() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        _ = try await sut.startSession(exercise: exercise, stressLevel: 6)
        try await Task.sleep(nanoseconds: 100_000_000)
        
        let completedSession = try await sut.completeSession(stressAfter: 2, rating: nil)
        
        XCTAssertNil(completedSession.rating)
        XCTAssertNotNil(completedSession.completedAt)
    }
    
    // MARK: - Session Cancel Tests
    
    func testCancelSession_Success() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        _ = try await sut.startSession(exercise: exercise, stressLevel: 5)
        
        try await sut.cancelSession()
        
        XCTAssertTrue(mockAudioService.stopAudioCalled)
        XCTAssertNil(sut.currentSession)
    }
    
    func testCancelSession_NoActiveSession() async {
        do {
            try await sut.cancelSession()
            XCTFail("Expected no active session error")
        } catch {
            XCTAssertTrue(error is MeditationServiceError)
        }
    }
    
    // MARK: - Session Duration Tests
    
    func testGetSessionDuration_ReturnsCorrectDuration() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        _ = try await sut.startSession(exercise: exercise, stressLevel: 5)
        
        try await Task.sleep(nanoseconds: 1_000_000_000)
        
        let duration = sut.getCurrentSessionDuration()
        
        XCTAssertGreaterThanOrEqual(duration, 1)
        XCTAssertLessThan(duration, 2)
    }
    
    func testGetSessionDuration_NoActiveSession() {
        let duration = sut.getCurrentSessionDuration()
        XCTAssertEqual(duration, 0)
    }
    
    // MARK: - Session Progress Tests
    
    func testGetSessionProgress_ReturnsCorrectProgress() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 10,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        _ = try await sut.startSession(exercise: exercise, stressLevel: 5)
        
        try await Task.sleep(nanoseconds: 5_000_000_000)
        
        let progress = sut.getCurrentSessionProgress()
        
        XCTAssertGreaterThanOrEqual(progress, 0.4)
        XCTAssertLessThanOrEqual(progress, 0.6)
    }
    
    func testGetSessionProgress_NoActiveSession() {
        let progress = sut.getCurrentSessionProgress()
        XCTAssertEqual(progress, 0.0)
    }
    
    // MARK: - Exercise Switch Tests
    
    func testSwitchExercise_Success() async throws {
        let exercise1 = Exercise(
            id: UUID(),
            name: "Test 1",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test1.mp3",
            createdAt: Date()
        )
        
        let exercise2 = Exercise(
            id: UUID(),
            name: "Test 2",
            description: "Test",
            type: .mindfulness,
            durationSeconds: 180,
            audioURL: "test2.mp3",
            createdAt: Date()
        )
        
        mockAudioService.shouldSucceed = true
        mockSupabaseService.shouldSucceed = true
        
        let session1 = try await sut.startSession(exercise: exercise1, stressLevel: 7)
        
        let session2 = try await sut.switchExercise(to: exercise2)
        
        XCTAssertNotEqual(session1.id, session2.id)
        XCTAssertEqual(session2.exerciseId, exercise2.id)
        XCTAssertEqual(session2.stressBefore, session1.stressBefore)
        XCTAssertTrue(mockAudioService.stopAudioCalled)
        XCTAssertTrue(mockAudioService.playAudioCalled)
    }
    
    func testSwitchExercise_NoActiveSession() async {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "test.mp3",
            createdAt: Date()
        )
        
        do {
            _ = try await sut.switchExercise(to: exercise)
            XCTFail("Expected no active session error")
        } catch {
            XCTAssertTrue(error is MeditationServiceError)
        }
    }
    
    // MARK: - Audio Control Tests
    
    func testAdjustVolume_Success() async throws {
        let exercise = Exercise(
            id: UUID(),
            name: "Test",
            description: "Test",
            type: .breathing,
            durationSeconds: 300,
            audioURL: "