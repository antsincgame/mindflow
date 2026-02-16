import Foundation

enum StressSource: String, Codable {
    case biometric = "biometric"
    case manual = "manual"
    case aiAnalysis = "ai_analysis"
    case calendar = "calendar"
    case hybrid = "hybrid"
}

enum StressIntensity: Int, Codable, Comparable {
    case veryLow = 1
    case low = 2
    case moderate = 3
    case high = 4
    case veryHigh = 5
    case critical = 6
    
    var description: String {
        switch self {
        case .veryLow:
            return "Очень низкий"
        case .low:
            return "Низкий"
        case .moderate:
            return "Умеренный"
        case .high:
            return "Высокий"
        case .veryHigh:
            return "Очень высокий"
        case .critical:
            return "Критический"
        }
    }
    
    var color: String {
        switch self {
        case .veryLow, .low:
            return "green"
        case .moderate:
            return "yellow"
        case .high:
            return "orange"
        case .veryHigh, .critical:
            return "red"
        }
    }
    
    static func < (lhs: StressIntensity, rhs: StressIntensity) -> Bool {
        return lhs.rawValue < rhs.rawValue
    }
}

struct BiometricContext: Codable {
    let heartRate: Int?
    let heartRateVariability: Double?
    let activeEnergyBurned: Double?
    let stepCount: Int?
    let restingHeartRate: Int?
    let bloodPressureSystolic: Int?
    let bloodPressureDiastolic: Int?
    
    enum CodingKeys: String, CodingKey {
        case heartRate = "heart_rate"
        case heartRateVariability = "heart_rate_variability"
        case activeEnergyBurned = "active_energy_burned"
        case stepCount = "step_count"
        case restingHeartRate = "resting_heart_rate"
        case bloodPressureSystolic = "blood_pressure_systolic"
        case bloodPressureDiastolic = "blood_pressure_diastolic"
    }
}

struct CalendarContext: Codable {
    let upcomingEventTitle: String?
    let upcomingEventStart: Date?
    let minutesUntilEvent: Int?
    let eventImportance: String?
    let isBackToBackMeetings: Bool
    let totalMeetingsToday: Int
    
    enum CodingKeys: String, CodingKey {
        case upcomingEventTitle = "upcoming_event_title"
        case upcomingEventStart = "upcoming_event_start"
        case minutesUntilEvent = "minutes_until_event"
        case eventImportance = "event_importance"
        case isBackToBackMeetings = "is_back_to_back_meetings"
        case totalMeetingsToday = "total_meetings_today"
    }
}

struct AIAnalysisContext: Codable {
    let confidence: Double
    let factors: [String]
    let recommendation: String?
    let patternMatched: String?
    
    enum CodingKeys: String, CodingKey {
        case confidence
        case factors
        case recommendation
        case patternMatched = "pattern_matched"
    }
}

struct StressContext: Codable {
    let biometric: BiometricContext?
    let calendar: CalendarContext?
    let aiAnalysis: AIAnalysisContext?
    let timeOfDay: String?
    let dayOfWeek: String?
    let location: String?
    let weather: String?
    
    enum CodingKeys: String, CodingKey {
        case biometric
        case calendar
        case aiAnalysis = "ai_analysis"
        case timeOfDay = "time_of_day"
        case dayOfWeek = "day_of_week"
        case location
        case weather
    }
}

struct StressLevel: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let stressLevel: Int
    let intensity: StressIntensity
    let source: StressSource
    let context: StressContext?
    let confidence: Double?
    let isManualInput: Bool
    let requiresAction: Bool
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case stressLevel = "stress_level"
        case intensity
        case source
        case context
        case confidence
        case isManualInput = "is_manual_input"
        case requiresAction = "requires_action"
        case createdAt = "created_at"
    }
    
    init(
        id: UUID = UUID(),
        userId: UUID,
        stressLevel: Int,
        source: StressSource,
        context: StressContext? = nil,
        confidence: Double? = nil,
        isManualInput: Bool = false,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.stressLevel = min(max(stressLevel, 1), 10)
        self.intensity = StressLevel.calculateIntensity(from: self.stressLevel)
        self.source = source
        self.context = context
        self.confidence = confidence
        self.isManualInput = isManualInput
        self.requiresAction = StressLevel.shouldRequireAction(intensity: self.intensity, source: source)
        self.createdAt = createdAt
    }
    
    static func calculateIntensity(from level: Int) -> StressIntensity {
        switch level {
        case 1...2:
            return .veryLow
        case 3...4:
            return .low
        case 5...6:
            return .moderate
        case 7...8:
            return .high
        case 9:
            return .veryHigh
        case 10:
            return .critical
        default:
            return .moderate
        }
    }
    
    static func shouldRequireAction(intensity: StressIntensity, source: StressSource) -> Bool {
        switch intensity {
        case .critical:
            return true
        case .veryHigh:
            return source == .biometric || source == .hybrid
        case .high:
            return source == .aiAnalysis || source == .hybrid
        default:
            return false
        }
    }
    
    var normalizedLevel: Double {
        return Double(stressLevel) / 10.0
    }
    
    var percentageLevel: Int {
        return stressLevel * 10
    }
    
    var shouldTriggerNotification: Bool {
        return requiresAction && intensity >= .high
    }
    
    var shouldShowImmediateSession: Bool {
        return intensity == .critical || (intensity == .veryHigh && source == .biometric)
    }
    
    var recommendedSessionDuration: Int {
        switch intensity {
        case .veryLow, .low:
            return 180
        case .moderate:
            return 300
        case .high:
            return 420
        case .veryHigh:
            return 600
        case .critical:
            return 900
        }
    }
    
    var breathingSpeed: Double {
        switch intensity {
        case .veryLow, .low:
            return 1.0
        case .moderate:
            return 0.9
        case .high:
            return 0.8
        case .veryHigh:
            return 0.7
        case .critical:
            return 0.6
        }
    }
    
    var entrySpeed: Double {
        switch intensity {
        case .critical:
            return 0.0
        case .veryHigh:
            return 5.0
        case .high:
            return 10.0
        case .moderate:
            return 15.0
        default:
            return 15.0
        }
    }
    
    func isSignificantlyDifferent(from other: StressLevel) -> Bool {
        return abs(self.stressLevel - other.stressLevel) >= 2
    }
    
    func calculateReduction(from previous: StressLevel) -> Int {
        return previous.stressLevel - self.stressLevel
    }
    
    func calculateReductionPercentage(from previous: StressLevel) -> Double {
        guard previous.stressLevel > 0 else { return 0.0 }
        let reduction = Double(previous.stressLevel - self.stressLevel)
        return (reduction / Double(previous.stressLevel)) * 100.0
    }
}

extension StressLevel {
    static func fromManualInput(userId: UUID, level: Int) -> StressLevel {
        return StressLevel(
            userId: userId,
            stressLevel: level,
            source: .manual,
            isManualInput: true
        )
    }
    
    static func fromBiometric(
        userId: UUID,
        level: Int,
        heartRate: Int?,
        hrv: Double?,
        confidence: Double
    ) -> StressLevel {
        let biometricContext = BiometricContext(
            heartRate: heartRate,
            heartRateVariability: hrv,
            activeEnergyBurned: nil,
            stepCount: nil,
            restingHeartRate: nil,
            bloodPressureSystolic: nil,
            bloodPressureDiastolic: nil
        )
        
        let context = StressContext(
            biometric: biometricContext,
            calendar: nil,
            aiAnalysis: nil,
            timeOfDay: nil,
            dayOfWeek: nil,
            location: nil,
            weather: nil
        )
        
        return StressLevel(
            userId: userId,
            stressLevel: level,
            source: .biometric,
            context: context,
            confidence: confidence
        )
    }
    
    static func fromCalendar(
        userId: UUID,
        level: Int,
        eventTitle: String?,
        minutesUntil: Int?,
        confidence: Double
    ) -> StressLevel {
        let calendarContext = CalendarContext(
            upcomingEventTitle: eventTitle,
            upcomingEventStart: minutesUntil != nil ? Date().addingTimeInterval(TimeInterval(minutesUntil! * 60)) : nil,
            minutesUntilEvent: minutesUntil,
            eventImportance: nil,
            isBackToBackMeetings: false,
            totalMeetingsToday: 0
        )
        
        let context = StressContext(
            biometric: nil,
            calendar: calendarContext,
            aiAnalysis: nil,
            timeOfDay: nil,
            dayOfWeek: nil,
            location: nil,
            weather: nil
        )
        
        return StressLevel(
            userId: userId,
            stressLevel: level,
            source: .calendar,
            context: context,
            confidence: confidence
        )
    }
    
    static func fromAIAnalysis(
        userId: UUID,
        level: Int,
        factors: [String],
        recommendation: String?,
        confidence: Double
    ) -> StressLevel {
        let aiContext = AIAnalysisContext(
            confidence: confidence,
            factors: factors,
            recommendation: recommendation,
            patternMatched: nil
        )
        
        let context = StressContext(
            biometric: nil,
            calendar: nil,
            aiAnalysis: aiContext,
            timeOfDay: nil,
            dayOfWeek: nil,
            location: nil,
            weather: nil
        )
        
        return StressLevel(
            userId: userId,
            stressLevel: level,
            source: .aiAnalysis,
            context: context,
            confidence: confidence
        )
    }
}

extension StressLevel: Equatable {
    static func == (lhs: StressLevel, rhs: StressLevel) -> Bool {
        return lhs.id == rhs.id
    }
}

extension StressLevel: Hashable {
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}