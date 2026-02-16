import XCTest
import Combine
@testable import MindFlow

final class AchievementServiceTests: XCTestCase {
    
    var sut: AchievementService!
    var mockSupabaseService: MockSupabaseService!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        mockSupabaseService = MockSupabaseService()
        sut = AchievementService(supabaseService: mockSupabaseService)
        cancellables = Set<AnyCancellable>()
    }
    
    override func tearDown() {
        sut = nil
        mockSupabaseService = nil
        cancellables = nil
        super.tearDown()
    }
    
    // MARK: - Achievement Unlocking Tests
    
    func testUnlockAchievement_Success() async throws {
        // Given
        let userId = UUID()
        let achievement = Achievement(
            id: UUID(),
            name: "First Step",
            description: "Complete your first meditation session",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "sessions_count", "value": 1],
            createdAt: Date()
        )
        
        mockSupabaseService.shouldSucceed = true
        mockSupabaseService.mockUserAchievement = UserAchievement(
            id: UUID(),
            userId: userId,
            achievementId: achievement.id,
            unlockedAt: Date()
        )
        
        // When
        let result = try await sut.unlockAchievement(achievement, for: userId)
        
        // Then
        XCTAssertNotNil(result)
        XCTAssertEqual(result.achievementId, achievement.id)
        XCTAssertEqual(result.userId, userId)
        XCTAssertEqual(mockSupabaseService.insertCallCount, 1)
    }
    
    func testUnlockAchievement_AlreadyUnlocked() async throws {
        // Given
        let userId = UUID()
        let achievement = Achievement(
            id: UUID(),
            name: "First Step",
            description: "Complete your first meditation session",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "sessions_count", "value": 1],
            createdAt: Date()
        )
        
        mockSupabaseService.shouldSucceed = false
        mockSupabaseService.errorToThrow = AchievementError.alreadyUnlocked
        
        // When/Then
        do {
            _ = try await sut.unlockAchievement(achievement, for: userId)
            XCTFail("Should throw alreadyUnlocked error")
        } catch {
            XCTAssertTrue(error is AchievementError)
            XCTAssertEqual(error as? AchievementError, .alreadyUnlocked)
        }
    }
    
    func testUnlockAchievement_NetworkError() async throws {
        // Given
        let userId = UUID()
        let achievement = Achievement(
            id: UUID(),
            name: "First Step",
            description: "Complete your first meditation session",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "sessions_count", "value": 1],
            createdAt: Date()
        )
        
        mockSupabaseService.shouldSucceed = false
        mockSupabaseService.errorToThrow = NetworkError.connectionFailed
        
        // When/Then
        do {
            _ = try await sut.unlockAchievement(achievement, for: userId)
            XCTFail("Should throw network error")
        } catch {
            XCTAssertTrue(error is NetworkError)
        }
    }
    
    // MARK: - Check Achievements Tests
    
    func testCheckAchievements_FirstSession() async throws {
        // Given
        let userId = UUID()
        let progress = Progress(
            id: UUID(),
            userId: userId,
            totalSessions: 1,
            totalMinutes: 10,
            currentStreak: 1,
            longestStreak: 1,
            sessionsBeforeMeetings: 0,
            stressReductionAvg: 20.0,
            updatedAt: Date()
        )
        
        let firstSessionAchievement = Achievement(
            id: UUID(),
            name: "First Step",
            description: "Complete your first meditation session",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "sessions_count", "value": 1],
            createdAt: Date()
        )
        
        mockSupabaseService.mockAchievements = [firstSessionAchievement]
        mockSupabaseService.mockUserAchievements = []
        mockSupabaseService.shouldSucceed = true
        
        // When
        let unlockedAchievements = try await sut.checkAchievements(for: userId, progress: progress)
        
        // Then
        XCTAssertEqual(unlockedAchievements.count, 1)
        XCTAssertEqual(unlockedAchievements.first?.name, "First Step")
    }
    
    func testCheckAchievements_StreakMilestone() async throws {
        // Given
        let userId = UUID()
        let progress = Progress(
            id: UUID(),
            userId: userId,
            totalSessions: 7,
            totalMinutes: 70,
            currentStreak: 7,
            longestStreak: 7,
            sessionsBeforeMeetings: 0,
            stressReductionAvg: 25.0,
            updatedAt: Date()
        )
        
        let streakAchievement = Achievement(
            id: UUID(),
            name: "Week Warrior",
            description: "Meditate 7 days in a row",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "streak", "value": 7],
            createdAt: Date()
        )
        
        mockSupabaseService.mockAchievements = [streakAchievement]
        mockSupabaseService.mockUserAchievements = []
        mockSupabaseService.shouldSucceed = true
        
        // When
        let unlockedAchievements = try await sut.checkAchievements(for: userId, progress: progress)
        
        // Then
        XCTAssertEqual(unlockedAchievements.count, 1)
        XCTAssertEqual(unlockedAchievements.first?.name, "Week Warrior")
    }
    
    func testCheckAchievements_TotalMinutes() async throws {
        // Given
        let userId = UUID()
        let progress = Progress(
            id: UUID(),
            userId: userId,
            totalSessions: 10,
            totalMinutes: 100,
            currentStreak: 3,
            longestStreak: 5,
            sessionsBeforeMeetings: 0,
            stressReductionAvg: 30.0,
            updatedAt: Date()
        )
        
        let minutesAchievement = Achievement(
            id: UUID(),
            name: "Mindful Hour",
            description: "Meditate for 100 minutes total",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "total_minutes", "value": 100],
            createdAt: Date()
        )
        
        mockSupabaseService.mockAchievements = [minutesAchievement]
        mockSupabaseService.mockUserAchievements = []
        mockSupabaseService.shouldSucceed = true
        
        // When
        let unlockedAchievements = try await sut.checkAchievements(for: userId, progress: progress)
        
        // Then
        XCTAssertEqual(unlockedAchievements.count, 1)
        XCTAssertEqual(unlockedAchievements.first?.name, "Mindful Hour")
    }
    
    func testCheckAchievements_SessionsBeforeMeetings() async throws {
        // Given
        let userId = UUID()
        let progress = Progress(
            id: UUID(),
            userId: userId,
            totalSessions: 15,
            totalMinutes: 150,
            currentStreak: 5,
            longestStreak: 7,
            sessionsBeforeMeetings: 10,
            stressReductionAvg: 35.0,
            updatedAt: Date()
        )
        
        let meetingsAchievement = Achievement(
            id: UUID(),
            name: "Meeting Master",
            description: "Meditate before 10 meetings",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "sessions_before_meetings", "value": 10],
            createdAt: Date()
        )
        
        mockSupabaseService.mockAchievements = [meetingsAchievement]
        mockSupabaseService.mockUserAchievements = []
        mockSupabaseService.shouldSucceed = true
        
        // When
        let unlockedAchievements = try await sut.checkAchievements(for: userId, progress: progress)
        
        // Then
        XCTAssertEqual(unlockedAchievements.count, 1)
        XCTAssertEqual(unlockedAchievements.first?.name, "Meeting Master")
    }
    
    func testCheckAchievements_StressReduction() async throws {
        // Given
        let userId = UUID()
        let progress = Progress(
            id: UUID(),
            userId: userId,
            totalSessions: 20,
            totalMinutes: 200,
            currentStreak: 10,
            longestStreak: 10,
            sessionsBeforeMeetings: 5,
            stressReductionAvg: 40.0,
            updatedAt: Date()
        )
        
        let stressAchievement = Achievement(
            id: UUID(),
            name: "Stress Buster",
            description: "Achieve 40% average stress reduction",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "stress_reduction_avg", "value": 40],
            createdAt: Date()
        )
        
        mockSupabaseService.mockAchievements = [stressAchievement]
        mockSupabaseService.mockUserAchievements = []
        mockSupabaseService.shouldSucceed = true
        
        // When
        let unlockedAchievements = try await sut.checkAchievements(for: userId, progress: progress)
        
        // Then
        XCTAssertEqual(unlockedAchievements.count, 1)
        XCTAssertEqual(unlockedAchievements.first?.name, "Stress Buster")
    }
    
    func testCheckAchievements_NoNewAchievements() async throws {
        // Given
        let userId = UUID()
        let progress = Progress(
            id: UUID(),
            userId: userId,
            totalSessions: 1,
            totalMinutes: 10,
            currentStreak: 1,
            longestStreak: 1,
            sessionsBeforeMeetings: 0,
            stressReductionAvg: 20.0,
            updatedAt: Date()
        )
        
        let achievement = Achievement(
            id: UUID(),
            name: "First Step",
            description: "Complete your first meditation session",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "sessions_count", "value": 1],
            createdAt: Date()
        )
        
        let userAchievement = UserAchievement(
            id: UUID(),
            userId: userId,
            achievementId: achievement.id,
            unlockedAt: Date()
        )
        
        mockSupabaseService.mockAchievements = [achievement]
        mockSupabaseService.mockUserAchievements = [userAchievement]
        mockSupabaseService.shouldSucceed = true
        
        // When
        let unlockedAchievements = try await sut.checkAchievements(for: userId, progress: progress)
        
        // Then
        XCTAssertEqual(unlockedAchievements.count, 0)
    }
    
    func testCheckAchievements_MultipleAchievements() async throws {
        // Given
        let userId = UUID()
        let progress = Progress(
            id: UUID(),
            userId: userId,
            totalSessions: 10,
            totalMinutes: 100,
            currentStreak: 7,
            longestStreak: 7,
            sessionsBeforeMeetings: 5,
            stressReductionAvg: 30.0,
            updatedAt: Date()
        )
        
        let achievement1 = Achievement(
            id: UUID(),
            name: "Week Warrior",
            description: "Meditate 7 days in a row",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "streak", "value": 7],
            createdAt: Date()
        )
        
        let achievement2 = Achievement(
            id: UUID(),
            name: "Mindful Hour",
            description: "Meditate for 100 minutes total",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "total_minutes", "value": 100],
            createdAt: Date()
        )
        
        let achievement3 = Achievement(
            id: UUID(),
            name: "Perfect Ten",
            description: "Complete 10 meditation sessions",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "sessions_count", "value": 10],
            createdAt: Date()
        )
        
        mockSupabaseService.mockAchievements = [achievement1, achievement2, achievement3]
        mockSupabaseService.mockUserAchievements = []
        mockSupabaseService.shouldSucceed = true
        
        // When
        let unlockedAchievements = try await sut.checkAchievements(for: userId, progress: progress)
        
        // Then
        XCTAssertEqual(unlockedAchievements.count, 3)
        XCTAssertTrue(unlockedAchievements.contains(where: { $0.name == "Week Warrior" }))
        XCTAssertTrue(unlockedAchievements.contains(where: { $0.name == "Mindful Hour" }))
        XCTAssertTrue(unlockedAchievements.contains(where: { $0.name == "Perfect Ten" }))
    }
    
    // MARK: - Get User Achievements Tests
    
    func testGetUserAchievements_Success() async throws {
        // Given
        let userId = UUID()
        let achievement = Achievement(
            id: UUID(),
            name: "First Step",
            description: "Complete your first meditation session",
            iconUrl: "https://example.com/icon.png",
            unlockCondition: ["type": "sessions_count", "value": 1],
            createdAt: Date()
        )
        
        let userAchievement = UserAchievement(
            id: UUID(),
            userId: userId,
            achievementId: achievement.id,
            unlockedAt: Date()
        )
        
        mockSupabaseService.mockUserAchievements = [userAchievement]
        mockSupabaseService.mockAchievements = [achievement]
        mockSupabaseService.shouldSucceed = true
        
        // When
        let achievements = try await sut.getUserAchievements(for: userId)
        
        // Then
        XCTAssertEqual(achievements.count, 1)
        XCTAssertEqual(achievements.first?.name, "First Step")