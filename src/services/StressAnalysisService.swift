import Foundation
import HealthKit
import EventKit
import Combine

enum StressSource: String, Codable {
    case biometric
    case calendar
    case aiAnalysis
    case manual
    case pattern
}

struct StressContext: Codable {
    let heartRate: Int?
    let heartRateVariability: Double?
    let activityLevel: String?
    let upcomingEvents: [CalendarEventContext]?
    let timeOfDay: String
    let dayOfWeek: String
    let historicalPattern: HistoricalPattern?
    let environmentalFactors: EnvironmentalFactors?
}

struct CalendarEventContext: Codable {
    let title: String
    let startDate: Date
    let endDate: Date
    let isImportant: Bool
    let minutesUntilStart: Int
    let stressTriggerScore: Double
}

struct HistoricalPattern: Codable {
    let averageStressAtTime: Double
    let typicalStressBeforeSimilarEvents: Double
    let recentTrend: String
    let stressFrequency: Double
}

struct EnvironmentalFactors: Codable {
    let isWorkingHours: Bool
    let consecutiveHighStressMinutes: Int
    let timeSinceLastMeditation: TimeInterval?
    let sessionDeclineCount: Int
}

struct StressAnalysisResult {
    let stressLevel: Int
    let confidence: Double
    let primarySource: StressSource
    let context: StressContext
    let recommendedAction: RecommendedAction
    let urgency: StressUrgency
}

enum StressUrgency {
    case critical
    case high
    case moderate
    case low
}

enum RecommendedAction {
    case immediateSession
    case scheduledReminder(minutes: Int)
    case gentleNotification
    case noAction
}

final class StressAnalysisService: ObservableObject {
    static let shared = StressAnalysisService()
    
    @Published var currentStressLevel: Int = 5
    @Published var isAnalyzing: Bool = false
    
    private let healthKitService: HealthKitService
    private let calendarService: CalendarService
    private let supabaseService: SupabaseService
    private var cancellables = Set<AnyCancellable>()
    
    private let stressThresholds = (
        critical: 8,
        high: 7,
        moderate: 5,
        low: 3
    )
    
    private let heartRateThresholds = (
        veryHigh: 100,
        high: 85,
        normal: 70,
        low: 60
    )
    
    private let hrvThresholds = (
        veryLow: 20.0,
        low: 40.0,
        normal: 60.0,
        high: 80.0
    )
    
    private init(
        healthKitService: HealthKitService = .shared,
        calendarService: CalendarService = .shared,
        supabaseService: SupabaseService = .shared
    ) {
        self.healthKitService = healthKitService
        self.calendarService = calendarService
        self.supabaseService = supabaseService
    }
    
    func analyzeCurrentStress() async throws -> StressAnalysisResult {
        isAnalyzing = true
        defer { isAnalyzing = false }
        
        async let biometricData = analyzeBiometricStress()
        async let calendarData = analyzeCalendarStress()
        async let patternData = analyzeHistoricalPatterns()
        async let environmentalData = analyzeEnvironmentalFactors()
        
        let (biometric, calendar, pattern, environmental) = try await (
            biometricData,
            calendarData,
            patternData,
            environmentalData
        )
        
        let aggregatedStress = calculateAggregatedStress(
            biometric: biometric,
            calendar: calendar,
            pattern: pattern,
            environmental: environmental
        )
        
        let context = StressContext(
            heartRate: biometric.heartRate,
            heartRateVariability: biometric.hrv,
            activityLevel: biometric.activityLevel,
            upcomingEvents: calendar.upcomingEvents,
            timeOfDay: getCurrentTimeOfDay(),
            dayOfWeek: getCurrentDayOfWeek(),
            historicalPattern: pattern,
            environmentalFactors: environmental
        )
        
        let result = StressAnalysisResult(
            stressLevel: aggregatedStress.level,
            confidence: aggregatedStress.confidence,
            primarySource: aggregatedStress.primarySource,
            context: context,
            recommendedAction: determineRecommendedAction(
                stressLevel: aggregatedStress.level,
                context: context
            ),
            urgency: determineUrgency(stressLevel: aggregatedStress.level)
        )
        
        try await logStressAnalysis(result: result)
        
        await MainActor.run {
            self.currentStressLevel = result.stressLevel
        }
        
        return result
    }
    
    func analyzeStressWithManualInput(manualLevel: Int) async throws -> StressAnalysisResult {
        let context = try await buildContextWithoutBiometrics()
        
        let adjustedLevel = adjustManualInputWithContext(
            manualLevel: manualLevel,
            context: context
        )
        
        let result = StressAnalysisResult(
            stressLevel: adjustedLevel,
            confidence: 0.7,
            primarySource: .manual,
            context: context,
            recommendedAction: determineRecommendedAction(
                stressLevel: adjustedLevel,
                context: context
            ),
            urgency: determineUrgency(stressLevel: adjustedLevel)
        )
        
        try await logStressAnalysis(result: result)
        
        await MainActor.run {
            self.currentStressLevel = result.stressLevel
        }
        
        return result
    }
    
    private func analyzeBiometricStress() async throws -> BiometricStressData {
        guard healthKitService.isHealthKitAvailable else {
            return BiometricStressData(
                heartRate: nil,
                hrv: nil,
                activityLevel: nil,
                stressScore: 0,
                confidence: 0
            )
        }
        
        let heartRate = try await healthKitService.getLatestHeartRate()
        let hrv = try await healthKitService.getLatestHRV()
        let activityLevel = try await healthKitService.getCurrentActivityLevel()
        
        let stressScore = calculateBiometricStress(
            heartRate: heartRate,
            hrv: hrv,
            activityLevel: activityLevel
        )
        
        return BiometricStressData(
            heartRate: heartRate,
            hrv: hrv,
            activityLevel: activityLevel,
            stressScore: stressScore,
            confidence: 0.85
        )
    }
    
    private func analyzeCalendarStress() async throws -> CalendarStressData {
        let events = try await calendarService.getUpcomingEvents(hoursAhead: 4)
        
        let stressfulEvents = events.compactMap { event -> CalendarEventContext? in
            let triggerScore = calculateEventStressTrigger(event: event)
            guard triggerScore > 0.3 else { return nil }
            
            let minutesUntil = Int(event.startDate.timeIntervalSince(Date()) / 60)
            
            return CalendarEventContext(
                title: event.title,
                startDate: event.startDate,
                endDate: event.endDate,
                isImportant: event.isImportant,
                minutesUntilStart: minutesUntil,
                stressTriggerScore: triggerScore
            )
        }
        
        let aggregatedScore = calculateCalendarStressScore(events: stressfulEvents)
        
        return CalendarStressData(
            upcomingEvents: stressfulEvents,
            stressScore: aggregatedScore,
            confidence: 0.75
        )
    }
    
    private func analyzeHistoricalPatterns() async throws -> HistoricalPattern? {
        guard let userId = try await supabaseService.getCurrentUserId() else {
            return nil
        }
        
        let recentLogs = try await supabaseService.getRecentStressLogs(
            userId: userId,
            days: 7
        )
        
        guard !recentLogs.isEmpty else { return nil }
        
        let currentHour = Calendar.current.component(.hour, from: Date())
        let logsAtSimilarTime = recentLogs.filter { log in
            let logHour = Calendar.current.component(.hour, from: log.createdAt)
            return abs(logHour - currentHour) <= 1
        }
        
        let averageStressAtTime = logsAtSimilarTime.isEmpty
            ? Double(recentLogs.map { $0.stressLevel }.reduce(0, +)) / Double(recentLogs.count)
            : Double(logsAtSimilarTime.map { $0.stressLevel }.reduce(0, +)) / Double(logsAtSimilarTime.count)
        
        let recentTrend = calculateTrend(logs: Array(recentLogs.prefix(10)))
        let stressFrequency = calculateStressFrequency(logs: recentLogs)
        
        return HistoricalPattern(
            averageStressAtTime: averageStressAtTime,
            typicalStressBeforeSimilarEvents: averageStressAtTime,
            recentTrend: recentTrend,
            stressFrequency: stressFrequency
        )
    }
    
    private func analyzeEnvironmentalFactors() async throws -> EnvironmentalFactors {
        let isWorkingHours = isCurrentlyWorkingHours()
        let consecutiveHighStress = try await getConsecutiveHighStressMinutes()
        let timeSinceLastMeditation = try await getTimeSinceLastMeditation()
        let declineCount = try await getRecentDeclineCount()
        
        return EnvironmentalFactors(
            isWorkingHours: isWorkingHours,
            consecutiveHighStressMinutes: consecutiveHighStress,
            timeSinceLastMeditation: timeSinceLastMeditation,
            sessionDeclineCount: declineCount
        )
    }
    
    private func calculateBiometricStress(
        heartRate: Int?,
        hrv: Double?,
        activityLevel: String?
    ) -> Int {
        var stressScore = 5
        
        if let hr = heartRate {
            if hr > heartRateThresholds.veryHigh {
                stressScore += 3
            } else if hr > heartRateThresholds.high {
                stressScore += 2
            } else if hr > heartRateThresholds.normal {
                stressScore += 1
            }
        }
        
        if let hrv = hrv {
            if hrv < hrvThresholds.veryLow {
                stressScore += 3
            } else if hrv < hrvThresholds.low {
                stressScore += 2
            } else if hrv < hrvThresholds.normal {
                stressScore += 1
            } else {
                stressScore -= 1
            }
        }
        
        if let activity = activityLevel {
            switch activity {
            case "high":
                stressScore -= 1
            case "sedentary":
                stressScore += 1
            default:
                break
            }
        }
        
        return min(max(stressScore, 1), 10)
    }
    
    private func calculateEventStressTrigger(event: CalendarEvent) -> Double {
        var score = 0.0
        
        if event.isImportant {
            score += 0.5
        }
        
        let minutesUntil = event.startDate.timeIntervalSince(Date()) / 60
        if minutesUntil < 30 {
            score += 0.4
        } else if minutesUntil < 60 {
            score += 0.3
        } else if minutesUntil < 120 {
            score += 0.2
        }
        
        let keywords = ["meeting", "interview", "presentation", "deadline", "review"]
        if keywords.contains(where: { event.title.lowercased().contains($0) }) {
            score += 0.3
        }
        
        return min(score, 1.0)
    }
    
    private func calculateCalendarStressScore(events: [CalendarEventContext]) -> Int {
        guard !events.isEmpty else { return 0 }
        
        let totalTriggerScore = events.reduce(0.0) { $0 + $1.stressTriggerScore }
        let averageScore = totalTriggerScore / Double(events.count)
        
        let urgentEvents = events.filter { $0.minutesUntilStart < 30 }.count
        let urgencyBonus = Double(urgentEvents) * 0.5
        
        let finalScore = (averageScore * 10) + urgencyBonus
        
        return min(Int(finalScore.rounded()), 10)
    }
    
    private func calculateAggregatedStress(
        biometric: BiometricStressData,
        calendar: CalendarStressData,
        pattern: HistoricalPattern?,
        environmental: EnvironmentalFactors
    ) -> (level: Int, confidence: Double, primarySource: StressSource) {
        var weightedScore = 0.0
        var totalWeight = 0.0
        var primarySource: StressSource = .aiAnalysis
        var maxContribution = 0.0
        
        if biometric.confidence > 0 {
            let weight = biometric.confidence * 0.5
            let contribution = Double(biometric.stressScore) * weight
            weightedScore += contribution
            totalWeight += weight
            
            if contribution > maxContribution {
                maxContribution = contribution
                primarySource = .biometric
            }
        }
        
        if calendar.confidence > 0 {
            let weight = calendar.confidence * 0.3
            let contribution = Double(calendar.stressScore) * weight
            weightedScore += contribution
            totalWeight += weight
            
            if contribution > maxContribution {
                maxContribution = contribution
                primarySource = .calendar
            }
        }
        
        if let pattern = pattern {
            let weight = 0.2
            let contribution = pattern.averageStressAtTime * weight
            weightedScore += contribution
            totalWeight += weight
            
            if contribution > maxContribution {
                maxContribution = contribution
                primarySource = .pattern
            }
        }
        
        if environmental.consecutiveHighStressMinutes > 30 {
            weightedScore += 2.0
        }
        
        if environmental.isWorkingHours {
            weightedScore += 1.0
        }
        
        let finalScore = totalWeight > 0 ? Int((weightedScore / totalWeight).rounded()) : 5
        let confidence = totalWeight / 1.0
        
        return (
            level: min(max(finalScore, 1), 10),
            confidence: min(confidence, 1.0),
            primarySource: primarySource
        )
    }
    
    private func determineRecommendedAction(
        stressLevel: Int,
        context: StressContext
    ) -> RecommendedAction {
        if stressLevel >= stressThresholds.critical {
            return .immediateSession
        }
        
        if stressLevel >= stressThresholds.high {
            if let events = context.upcomingEvents, !events.isEmpty {
                let nextEvent = events.min(by: { $0.minutesUntilStart < $1.minutesUntilStart })
                if let event = nextEvent, event.minutesUntilStart < 15 {
                    return .