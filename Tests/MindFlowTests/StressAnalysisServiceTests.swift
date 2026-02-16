import XCTest
import Combine
@testable import MindFlow

final class StressAnalysisServiceTests: XCTestCase {
    
    var sut: StressAnalysisService!
    var mockHealthKitService: MockHealthKitService!
    var mockCalendarService: MockCalendarService!
    var mockSupabaseService: MockSupabaseService!
    var cancellables: Set<AnyCancellable>!
    
    override func setUp() {
        super.setUp()
        mockHealthKitService = MockHealthKitService()
        mockCalendarService = MockCalendarService()
        mockSupabaseService = MockSupabaseService()
        sut = StressAnalysisService(
            healthKitService: mockHealthKitService,
            calendarService: mockCalendarService,
            supabaseService: mockSupabaseService
        )
        cancellables = []
    }
    
    override func tearDown() {
        sut = nil
        mockHealthKitService = nil
        mockCalendarService = nil
        mockSupabaseService = nil
        cancellables = nil
        super.tearDown()
    }
    
    // MARK: - Biometric Analysis Tests
    
    func testAnalyzeStress_WithHighHeartRate_ReturnsHighStress() async throws {
        // Given
        mockHealthKitService.mockHeartRate = 120.0
        mockHealthKitService.mockRestingHeartRate = 70.0
        mockHealthKitService.mockHRV = 25.0
        mockCalendarService.mockUpcomingEvents = []
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertGreaterThanOrEqual(result.level, 7)
        XCTAssertEqual(result.source, .biometric)
        XCTAssertNotNil(result.context["heart_rate"])
        XCTAssertNotNil(result.context["hrv"])
    }
    
    func testAnalyzeStress_WithLowHeartRate_ReturnsLowStress() async throws {
        // Given
        mockHealthKitService.mockHeartRate = 65.0
        mockHealthKitService.mockRestingHeartRate = 70.0
        mockHealthKitService.mockHRV = 80.0
        mockCalendarService.mockUpcomingEvents = []
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertLessThanOrEqual(result.level, 3)
        XCTAssertEqual(result.source, .biometric)
    }
    
    func testAnalyzeStress_WithLowHRV_ReturnsHighStress() async throws {
        // Given
        mockHealthKitService.mockHeartRate = 80.0
        mockHealthKitService.mockRestingHeartRate = 70.0
        mockHealthKitService.mockHRV = 15.0
        mockCalendarService.mockUpcomingEvents = []
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertGreaterThanOrEqual(result.level, 6)
        XCTAssertEqual(result.source, .biometric)
    }
    
    // MARK: - Calendar Analysis Tests
    
    func testAnalyzeStress_WithUpcomingImportantMeeting_ReturnsHighStress() async throws {
        // Given
        mockHealthKitService.mockHeartRate = nil
        let importantMeeting = CalendarEvent(
            id: UUID().uuidString,
            title: "Board Meeting",
            startDate: Date().addingTimeInterval(900), // 15 minutes
            endDate: Date().addingTimeInterval(3600),
            isAllDay: false,
            location: nil,
            attendees: ["CEO", "CFO", "Board Members"],
            notes: nil,
            importance: .high
        )
        mockCalendarService.mockUpcomingEvents = [importantMeeting]
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertGreaterThanOrEqual(result.level, 7)
        XCTAssertEqual(result.source, .aiAnalysis)
        XCTAssertNotNil(result.context["calendar_event"])
    }
    
    func testAnalyzeStress_WithMultipleBackToBackMeetings_ReturnsHighStress() async throws {
        // Given
        mockHealthKitService.mockHeartRate = nil
        let now = Date()
        let meetings = [
            CalendarEvent(
                id: UUID().uuidString,
                title: "Meeting 1",
                startDate: now.addingTimeInterval(600),
                endDate: now.addingTimeInterval(2400),
                isAllDay: false,
                location: nil,
                attendees: ["Person 1"],
                notes: nil,
                importance: .medium
            ),
            CalendarEvent(
                id: UUID().uuidString,
                title: "Meeting 2",
                startDate: now.addingTimeInterval(2400),
                endDate: now.addingTimeInterval(4200),
                isAllDay: false,
                location: nil,
                attendees: ["Person 2"],
                notes: nil,
                importance: .medium
            ),
            CalendarEvent(
                id: UUID().uuidString,
                title: "Meeting 3",
                startDate: now.addingTimeInterval(4200),
                endDate: now.addingTimeInterval(6000),
                isAllDay: false,
                location: nil,
                attendees: ["Person 3"],
                notes: nil,
                importance: .medium
            )
        ]
        mockCalendarService.mockUpcomingEvents = meetings
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertGreaterThanOrEqual(result.level, 6)
        XCTAssertEqual(result.source, .aiAnalysis)
    }
    
    func testAnalyzeStress_WithNoUpcomingEvents_ReturnsLowStress() async throws {
        // Given
        mockHealthKitService.mockHeartRate = nil
        mockCalendarService.mockUpcomingEvents = []
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertLessThanOrEqual(result.level, 3)
    }
    
    // MARK: - Hybrid Analysis Tests
    
    func testAnalyzeStress_WithBothBiometricAndCalendar_CombinesStress() async throws {
        // Given
        mockHealthKitService.mockHeartRate = 110.0
        mockHealthKitService.mockRestingHeartRate = 70.0
        mockHealthKitService.mockHRV = 30.0
        
        let importantMeeting = CalendarEvent(
            id: UUID().uuidString,
            title: "Important Presentation",
            startDate: Date().addingTimeInterval(1200),
            endDate: Date().addingTimeInterval(3000),
            isAllDay: false,
            location: nil,
            attendees: ["Manager", "Team"],
            notes: nil,
            importance: .high
        )
        mockCalendarService.mockUpcomingEvents = [importantMeeting]
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertGreaterThanOrEqual(result.level, 8)
        XCTAssertNotNil(result.context["heart_rate"])
        XCTAssertNotNil(result.context["calendar_event"])
    }
    
    // MARK: - Pattern Recognition Tests
    
    func testAnalyzeStress_WithHistoricalPattern_AdjustsStressLevel() async throws {
        // Given
        mockHealthKitService.mockHeartRate = 85.0
        mockHealthKitService.mockRestingHeartRate = 70.0
        mockHealthKitService.mockHRV = 50.0
        
        let historicalLogs = [
            StressLog(
                id: UUID(),
                userId: UUID(),
                stressLevel: 8,
                source: .biometric,
                context: ["time_of_day": "09:00"],
                createdAt: Date().addingTimeInterval(-86400)
            ),
            StressLog(
                id: UUID(),
                userId: UUID(),
                stressLevel: 9,
                source: .biometric,
                context: ["time_of_day": "09:00"],
                createdAt: Date().addingTimeInterval(-172800)
            )
        ]
        mockSupabaseService.mockStressLogs = historicalLogs
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertGreaterThan(result.level, 5)
        XCTAssertEqual(result.source, .aiAnalysis)
    }
    
    // MARK: - Stress Trigger Detection Tests
    
    func testDetectStressTriggers_WithKeywords_ReturnsHighPriority() async throws {
        // Given
        let meeting = CalendarEvent(
            id: UUID().uuidString,
            title: "Performance Review",
            startDate: Date().addingTimeInterval(1800),
            endDate: Date().addingTimeInterval(3600),
            isAllDay: false,
            location: nil,
            attendees: ["Manager"],
            notes: nil,
            importance: .high
        )
        
        // When
        let triggers = await sut.detectStressTriggers(for: meeting)
        
        // Then
        XCTAssertFalse(triggers.isEmpty)
        XCTAssertTrue(triggers.contains(where: { $0.type == .highStakesMeeting }))
    }
    
    func testDetectStressTriggers_WithManyAttendees_ReturnsHighPriority() async throws {
        // Given
        let meeting = CalendarEvent(
            id: UUID().uuidString,
            title: "All Hands Meeting",
            startDate: Date().addingTimeInterval(1800),
            endDate: Date().addingTimeInterval(3600),
            isAllDay: false,
            location: nil,
            attendees: Array(repeating: "Attendee", count: 15),
            notes: nil,
            importance: .medium
        )
        
        // When
        let triggers = await sut.detectStressTriggers(for: meeting)
        
        // Then
        XCTAssertTrue(triggers.contains(where: { $0.type == .largeAudienceMeeting }))
    }
    
    // MARK: - Stress Level Calculation Tests
    
    func testCalculateStressLevel_WithNoBiometricData_UsesCalendarOnly() async throws {
        // Given
        mockHealthKitService.mockHeartRate = nil
        let meeting = CalendarEvent(
            id: UUID().uuidString,
            title: "Client Call",
            startDate: Date().addingTimeInterval(600),
            endDate: Date().addingTimeInterval(2400),
            isAllDay: false,
            location: nil,
            attendees: ["Client"],
            notes: nil,
            importance: .high
        )
        mockCalendarService.mockUpcomingEvents = [meeting]
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertEqual(result.source, .aiAnalysis)
        XCTAssertGreaterThan(result.level, 5)
    }
    
    func testCalculateStressLevel_WithNoCalendarData_UsesBiometricOnly() async throws {
        // Given
        mockHealthKitService.mockHeartRate = 100.0
        mockHealthKitService.mockRestingHeartRate = 70.0
        mockHealthKitService.mockHRV = 35.0
        mockCalendarService.mockUpcomingEvents = []
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertEqual(result.source, .biometric)
        XCTAssertGreaterThan(result.level, 5)
    }
    
    // MARK: - Time-based Analysis Tests
    
    func testAnalyzeStress_MorningRush_IncreasesStress() async throws {
        // Given
        mockHealthKitService.mockHeartRate = 85.0
        mockHealthKitService.mockRestingHeartRate = 70.0
        mockHealthKitService.mockHRV = 50.0
        
        let calendar = Calendar.current
        var components = calendar.dateComponents([.year, .month, .day], from: Date())
        components.hour = 8
        components.minute = 30
        let morningTime = calendar.date(from: components)!
        
        let meeting = CalendarEvent(
            id: UUID().uuidString,
            title: "Morning Standup",
            startDate: morningTime,
            endDate: morningTime.addingTimeInterval(1800),
            isAllDay: false,
            location: nil,
            attendees: ["Team"],
            notes: nil,
            importance: .medium
        )
        mockCalendarService.mockUpcomingEvents = [meeting]
        
        // When
        let result = try await sut.analyzeCurrentStressLevel()
        
        // Then
        XCTAssertGreaterThan(result.level, 4)
    }
    
    // MARK: - Stress Reduction Calculation Tests
    
    func testCalculateStressReduction_ValidBeforeAfter_ReturnsPercentage() {
        // Given
        let stressBefore = 8
        let stressAfter = 3
        
        // When
        let reduction = sut.calculateStressReduction(before: stressBefore, after: stressAfter)
        
        // Then
        XCTAssertEqual(reduction, 62.5, accuracy: 0.1)
    }
    
    func testCalculateStressReduction_NoReduction_ReturnsZero() {
        // Given
        let stressBefore = 5
        let stressAfter = 5
        
        // When
        let reduction = sut.calculateStressReduction(before: stressBefore, after: stressAfter)
        
        // Then
        XCTAssertEqual(reduction, 0.0)
    }
    
    func testCalculateStressReduction_StressIncreased_ReturnsNegative() {
        // Given
        let stressBefore = 3
        let stressAfter = 7
        
        // When
        let reduction = sut.calculateStressReduction(before: stressBefore, after: stressAfter)
        
        // Then
        XCTAssertLessThan(reduction, 0)
    }
    
    // MARK: - Stress Log Tests
    
    func testSaveStressLog_ValidData_SavesSuccessfully() async throws {
        // Given
        let stressLevel = StressLevel(
            level: 7,
            source: .biometric,
            context: ["heart_rate": 110],
            timestamp: Date()
        )
        mockSupabaseService.shouldSucceed = true
        
        // When
        try await sut.saveStressLog(stressLevel, for: UUID())
        
        // Then
        XCTAssertTrue(mockSupabaseService.saveStressLogCalled)
    }
    
    func testGetStressHistory_ValidUserId_ReturnsLogs() async throws {
        // Given
        let userId = UUID()
        let logs = [
            StressLog(
                id: UUID(),
                userId: userId,
                stressLevel: 7,
                source: .biometric,
                context: [:],
                createdAt: