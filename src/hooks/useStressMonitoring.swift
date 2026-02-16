import SwiftUI
import Combine
import HealthKit
import EventKit

class StressMonitoringViewModel: ObservableObject {
    @Published var currentStressLevel: Int = 0
    @Published var stressSource: StressSource = .unknown
    @Published var isMonitoring: Bool = false
    @Published var lastUpdate: Date = Date()
    @Published var stressContext: StressContext?
    @Published var biometricAvailable: Bool = false
    @Published var calendarAccessGranted: Bool = false
    
    private let healthKitService: HealthKitService
    private let calendarService: CalendarService
    private let stressAnalysisService: StressAnalysisService
    private let supabaseService: SupabaseService
    
    private var cancellables = Set<AnyCancellable>()
    private var heartRateObserver: HKObserverQuery?
    private var calendarTimer: Timer?
    private var analysisTimer: Timer?
    
    private let minimumUpdateInterval: TimeInterval = 300 // 5 минут между обновлениями
    private var lastAnalysisTime: Date = Date.distantPast
    
    enum StressSource {
        case biometric
        case calendar
        case aiAnalysis
        case manual
        case unknown
    }
    
    struct StressContext {
        let heartRate: Int?
        let heartRateVariability: Double?
        let upcomingEvents: [CalendarEvent]
        let timeUntilNextEvent: TimeInterval?
        let eventImportance: EventImportance?
        let activityLevel: String?
        let timeOfDay: String
        let behaviorPattern: BehaviorPattern?
        
        enum EventImportance {
            case low
            case medium
            case high
            case critical
        }
        
        struct BehaviorPattern {
            let historicalStressBeforeEvents: Double
            let typicalResponseToEventType: String
            let recentSessionsCount: Int
            let averageStressReduction: Double
        }
    }
    
    init(
        healthKitService: HealthKitService = .shared,
        calendarService: CalendarService = .shared,
        stressAnalysisService: StressAnalysisService = .shared,
        supabaseService: SupabaseService = .shared
    ) {
        self.healthKitService = healthKitService
        self.calendarService = calendarService
        self.stressAnalysisService = stressAnalysisService
        self.supabaseService = supabaseService
        
        setupMonitoring()
    }
    
    private func setupMonitoring() {
        checkPermissions()
        setupHealthKitObserver()
        setupCalendarMonitoring()
        setupPeriodicAnalysis()
    }
    
    private func checkPermissions() {
        biometricAvailable = healthKitService.isAuthorized()
        calendarAccessGranted = calendarService.isAuthorized()
    }
    
    func startMonitoring() {
        guard !isMonitoring else { return }
        isMonitoring = true
        
        if biometricAvailable {
            startBiometricMonitoring()
        }
        
        if calendarAccessGranted {
            startCalendarMonitoring()
        }
        
        startAIAnalysis()
    }
    
    func stopMonitoring() {
        isMonitoring = false
        stopBiometricMonitoring()
        stopCalendarMonitoring()
        stopAIAnalysis()
    }
    
    private func setupHealthKitObserver() {
        guard biometricAvailable else { return }
        
        healthKitService.observeHeartRate { [weak self] heartRate, error in
            guard let self = self, error == nil else { return }
            
            Task { @MainActor in
                await self.updateStressFromBiometric(heartRate: heartRate)
            }
        }
        
        healthKitService.observeHeartRateVariability { [weak self] hrv, error in
            guard let self = self, error == nil else { return }
            
            Task { @MainActor in
                await self.updateStressFromHRV(hrv: hrv)
            }
        }
    }
    
    private func setupCalendarMonitoring() {
        guard calendarAccessGranted else { return }
        
        calendarTimer = Timer.scheduledTimer(withTimeInterval: 60, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.analyzeCalendarStress()
            }
        }
    }
    
    private func setupPeriodicAnalysis() {
        analysisTimer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.performFullStressAnalysis()
            }
        }
    }
    
    private func startBiometricMonitoring() {
        healthKitService.startHeartRateMonitoring()
        healthKitService.startHRVMonitoring()
        healthKitService.startActivityMonitoring()
    }
    
    private func stopBiometricMonitoring() {
        healthKitService.stopHeartRateMonitoring()
        healthKitService.stopHRVMonitoring()
        healthKitService.stopActivityMonitoring()
    }
    
    private func startCalendarMonitoring() {
        calendarTimer?.fire()
    }
    
    private func stopCalendarMonitoring() {
        calendarTimer?.invalidate()
        calendarTimer = nil
    }
    
    private func startAIAnalysis() {
        analysisTimer?.fire()
    }
    
    private func stopAIAnalysis() {
        analysisTimer?.invalidate()
        analysisTimer = nil
    }
    
    @MainActor
    private func updateStressFromBiometric(heartRate: Int?) async {
        guard let heartRate = heartRate else { return }
        
        let baselineHeartRate = await fetchBaselineHeartRate()
        let deviation = Double(heartRate - baselineHeartRate) / Double(baselineHeartRate)
        
        var stressLevel = 0
        if deviation > 0.25 {
            stressLevel = 8
        } else if deviation > 0.20 {
            stressLevel = 7
        } else if deviation > 0.15 {
            stressLevel = 6
        } else if deviation > 0.10 {
            stressLevel = 5
        } else if deviation > 0.05 {
            stressLevel = 4
        } else {
            stressLevel = 3
        }
        
        await updateStressLevel(
            level: stressLevel,
            source: .biometric,
            context: StressContext(
                heartRate: heartRate,
                heartRateVariability: nil,
                upcomingEvents: [],
                timeUntilNextEvent: nil,
                eventImportance: nil,
                activityLevel: await fetchActivityLevel(),
                timeOfDay: getCurrentTimeOfDay(),
                behaviorPattern: nil
            )
        )
    }
    
    @MainActor
    private func updateStressFromHRV(hrv: Double?) async {
        guard let hrv = hrv else { return }
        
        var stressLevel = 0
        if hrv < 20 {
            stressLevel = 9
        } else if hrv < 30 {
            stressLevel = 7
        } else if hrv < 40 {
            stressLevel = 5
        } else if hrv < 50 {
            stressLevel = 4
        } else {
            stressLevel = 2
        }
        
        await updateStressLevel(
            level: stressLevel,
            source: .biometric,
            context: StressContext(
                heartRate: nil,
                heartRateVariability: hrv,
                upcomingEvents: [],
                timeUntilNextEvent: nil,
                eventImportance: nil,
                activityLevel: await fetchActivityLevel(),
                timeOfDay: getCurrentTimeOfDay(),
                behaviorPattern: nil
            )
        )
    }
    
    @MainActor
    private func analyzeCalendarStress() async {
        let upcomingEvents = await calendarService.fetchUpcomingEvents(hours: 2)
        guard let nextEvent = upcomingEvents.first else {
            await updateStressLevel(level: 2, source: .calendar, context: nil)
            return
        }
        
        let timeUntilEvent = nextEvent.startDate.timeIntervalSinceNow
        let importance = determineEventImportance(event: nextEvent)
        
        var stressLevel = 3
        
        switch importance {
        case .critical:
            if timeUntilEvent < 900 { // 15 минут
                stressLevel = 9
            } else if timeUntilEvent < 1800 { // 30 минут
                stressLevel = 8
            } else if timeUntilEvent < 3600 { // 1 час
                stressLevel = 7
            } else {
                stressLevel = 6
            }
        case .high:
            if timeUntilEvent < 900 {
                stressLevel = 7
            } else if timeUntilEvent < 1800 {
                stressLevel = 6
            } else if timeUntilEvent < 3600 {
                stressLevel = 5
            } else {
                stressLevel = 4
            }
        case .medium:
            if timeUntilEvent < 1800 {
                stressLevel = 5
            } else if timeUntilEvent < 3600 {
                stressLevel = 4
            } else {
                stressLevel = 3
            }
        case .low:
            stressLevel = 3
        }
        
        let behaviorPattern = await fetchBehaviorPattern(eventType: nextEvent.title)
        
        await updateStressLevel(
            level: stressLevel,
            source: .calendar,
            context: StressContext(
                heartRate: nil,
                heartRateVariability: nil,
                upcomingEvents: upcomingEvents,
                timeUntilNextEvent: timeUntilEvent,
                eventImportance: importance,
                activityLevel: nil,
                timeOfDay: getCurrentTimeOfDay(),
                behaviorPattern: behaviorPattern
            )
        )
    }
    
    @MainActor
    private func performFullStressAnalysis() async {
        guard Date().timeIntervalSince(lastAnalysisTime) >= minimumUpdateInterval else { return }
        
        let heartRate = await healthKitService.fetchLatestHeartRate()
        let hrv = await healthKitService.fetchLatestHRV()
        let upcomingEvents = await calendarService.fetchUpcomingEvents(hours: 2)
        let activityLevel = await fetchActivityLevel()
        let recentSessions = await fetchRecentSessions()
        
        let analysisInput = StressAnalysisService.AnalysisInput(
            heartRate: heartRate,
            heartRateVariability: hrv,
            upcomingEvents: upcomingEvents,
            activityLevel: activityLevel,
            timeOfDay: getCurrentTimeOfDay(),
            recentSessions: recentSessions,
            historicalPatterns: await fetchHistoricalPatterns()
        )
        
        let result = await stressAnalysisService.analyzeStress(input: analysisInput)
        
        await updateStressLevel(
            level: result.stressLevel,
            source: .aiAnalysis,
            context: StressContext(
                heartRate: heartRate,
                heartRateVariability: hrv,
                upcomingEvents: upcomingEvents,
                timeUntilNextEvent: upcomingEvents.first?.startDate.timeIntervalSinceNow,
                eventImportance: upcomingEvents.first.map { determineEventImportance(event: $0) },
                activityLevel: activityLevel,
                timeOfDay: getCurrentTimeOfDay(),
                behaviorPattern: result.behaviorPattern
            )
        )
        
        lastAnalysisTime = Date()
    }
    
    @MainActor
    func updateManualStressLevel(_ level: Int) async {
        await updateStressLevel(
            level: level,
            source: .manual,
            context: StressContext(
                heartRate: nil,
                heartRateVariability: nil,
                upcomingEvents: [],
                timeUntilNextEvent: nil,
                eventImportance: nil,
                activityLevel: nil,
                timeOfDay: getCurrentTimeOfDay(),
                behaviorPattern: nil
            )
        )
    }
    
    @MainActor
    private func updateStressLevel(level: Int, source: StressSource, context: StressContext?) async {
        let clampedLevel = max(0, min(10, level))
        
        currentStressLevel = clampedLevel
        stressSource = source
        lastUpdate = Date()
        stressContext = context
        
        await logStressLevel(level: clampedLevel, source: source, context: context)
        
        if clampedLevel >= 7 {
            NotificationCenter.default.post(
                name: NSNotification.Name("HighStressDetected"),
                object: nil,
                userInfo: [
                    "level": clampedLevel,
                    "source": source,
                    "context": context as Any
                ]
            )
        }
    }
    
    private func logStressLevel(level: Int, source: StressSource, context: StressContext?) async {
        let sourceString: String
        switch source {
        case .biometric: sourceString = "biometric"
        case .calendar: sourceString = "calendar"
        case .aiAnalysis: sourceString = "ai_analysis"
        case .manual: sourceString = "manual"
        case .unknown: sourceString = "unknown"
        }
        
        var contextJSON: [String: Any] = [:]
        if let context = context {
            if let heartRate = context.heartRate {
                contextJSON["heart_rate"] = heartRate
            }
            if let hrv = context.heartRateVariability {
                contextJSON["hrv"] = hrv
            }
            if let timeUntilEvent = context.timeUntilNextEvent {
                contextJSON["time_until_event"] = timeUntilEvent
            }
            if let importance = context.eventImportance {
                contextJSON["event_importance"] = String(describing: importance)
            }
            if let activityLevel = context.activityLevel {
                contextJSON["activity_level"] = activityLevel
            }
            contextJSON["time_of_day"] = context.timeOfDay
            contextJSON["upcoming_events_count"] = context.upcomingEvents.count
        }
        
        do {
            try await supabaseService.client
                .from("stress_logs")
                .insert([
                    "user_id": supabaseService.currentUserId ?? "",
                    "stress_level": level,
                    "source": sourceString,
                    "context": contextJSON,
                    "created_at": ISO8601DateFormatter().string(from: Date())
                ])
                .execute()
        } catch {
            print("Failed to log stress level: \(error)")
        }
    }
    
    private func fetchBaselineHeartRate() async -> Int {
        let calendar = Calendar.current
        let endDate = Date()
        let startDate = calendar.date(byAdding: .day, value: -7, to: endDate)!
        
        let heartRates = await healthKitService.fetchHeartRateHistory(
            startDate: startDate,
            endDate: endDate
        )
        
        guard !heartRates.isEmpty else { return 70 }
        
        let sum = heartRates.reduce(0, +)
        return sum / heartRates.count
    }
    
    private func fetchActivityLevel() async -> String {
        let steps = await healthKitService.fetchTodaySteps()
        let activeEnergy = await healthKitService.fetchTodayActiveEnergy()