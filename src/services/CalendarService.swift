import Foundation
import EventKit
import Combine

enum CalendarServiceError: Error {
    case accessDenied
    case noCalendarsAvailable
    case eventFetchFailed
    case invalidDateRange
}

struct CalendarEvent {
    let id: String
    let title: String
    let startDate: Date
    let endDate: Date
    let isAllDay: Bool
    let calendar: String
    let location: String?
    let attendees: [String]
    let notes: String?
    let url: URL?
    
    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }
    
    var isUpcoming: Bool {
        startDate > Date()
    }
    
    var isInProgress: Bool {
        let now = Date()
        return now >= startDate && now <= endDate
    }
    
    var minutesUntilStart: Int {
        let interval = startDate.timeIntervalSince(Date())
        return max(0, Int(interval / 60))
    }
}

struct StressTrigger {
    let event: CalendarEvent
    let stressLevel: Int // 1-10
    let reason: StressTriggerReason
    let recommendedPreparationTime: TimeInterval
    
    enum StressTriggerReason {
        case upcomingMeeting(minutesUntil: Int)
        case backToBackMeetings
        case longMeeting(duration: TimeInterval)
        case manyAttendees(count: Int)
        case importantKeywords([String])
        case noBreakBetweenMeetings
        case firstMeetingOfDay
        case lateNightMeeting
        case externalMeeting
        case presentationOrDemo
        
        var description: String {
            switch self {
            case .upcomingMeeting(let minutes):
                return "Встреча через \(minutes) минут"
            case .backToBackMeetings:
                return "Встречи подряд без перерыва"
            case .longMeeting(let duration):
                let hours = Int(duration / 3600)
                return "Длинная встреча (\(hours)ч)"
            case .manyAttendees(let count):
                return "Много участников (\(count) человек)"
            case .importantKeywords(let keywords):
                return "Важная встреча: \(keywords.joined(separator: ", "))"
            case .noBreakBetweenMeetings:
                return "Нет перерыва между встречами"
            case .firstMeetingOfDay:
                return "Первая встреча дня"
            case .lateNightMeeting:
                return "Поздняя встреча"
            case .externalMeeting:
                return "Встреча с внешними участниками"
            case .presentationOrDemo:
                return "Презентация или демо"
            }
        }
    }
}

struct CalendarAnalytics {
    let totalMeetings: Int
    let totalDuration: TimeInterval
    let averageMeetingDuration: TimeInterval
    let backToBackMeetingsCount: Int
    let longestMeetingStreak: Int
    let busyPercentage: Double
    let peakHours: [Int] // Hours of day with most meetings
    let stressTriggers: [StressTrigger]
}

final class CalendarService: ObservableObject {
    static let shared = CalendarService()
    
    private let eventStore = EKEventStore()
    private var cancellables = Set<AnyCancellable>()
    
    @Published private(set) var authorizationStatus: EKAuthorizationStatus = .notDetermined
    @Published private(set) var upcomingEvents: [CalendarEvent] = []
    @Published private(set) var currentStressTriggers: [StressTrigger] = []
    
    private let stressKeywords = [
        "performance review", "review", "evaluation",
        "presentation", "demo", "pitch",
        "interview", "hiring",
        "deadline", "urgent",
        "board", "executive",
        "client", "customer",
        "conflict", "issue", "problem",
        "quarterly", "annual",
        "budget", "financial",
        "layoff", "restructure"
    ]
    
    private let highPriorityCalendars = [
        "work", "office", "business",
        "meetings", "calendar"
    ]
    
    private init() {
        updateAuthorizationStatus()
        startMonitoring()
    }
    
    // MARK: - Authorization
    
    func requestAccess() async throws {
        let granted = try await eventStore.requestAccess(to: .event)
        
        DispatchQueue.main.async {
            self.updateAuthorizationStatus()
        }
        
        guard granted else {
            throw CalendarServiceError.accessDenied
        }
    }
    
    private func updateAuthorizationStatus() {
        authorizationStatus = EKEventStore.authorizationStatus(for: .event)
    }
    
    var hasAccess: Bool {
        authorizationStatus == .authorized
    }
    
    // MARK: - Event Fetching
    
    func fetchEvents(from startDate: Date, to endDate: Date) async throws -> [CalendarEvent] {
        guard hasAccess else {
            throw CalendarServiceError.accessDenied
        }
        
        guard startDate < endDate else {
            throw CalendarServiceError.invalidDateRange
        }
        
        let calendars = eventStore.calendars(for: .event)
        guard !calendars.isEmpty else {
            throw CalendarServiceError.noCalendarsAvailable
        }
        
        let predicate = eventStore.predicateForEvents(
            withStart: startDate,
            end: endDate,
            calendars: calendars
        )
        
        let events = eventStore.events(matching: predicate)
        
        return events.map { mapToCalendarEvent($0) }
    }
    
    func fetchUpcomingEvents(hoursAhead: Int = 24) async throws -> [CalendarEvent] {
        let now = Date()
        let endDate = Calendar.current.date(byAdding: .hour, value: hoursAhead, to: now) ?? now
        
        let events = try await fetchEvents(from: now, to: endDate)
        return events.filter { $0.isUpcoming }.sorted { $0.startDate < $1.startDate }
    }
    
    func fetchTodayEvents() async throws -> [CalendarEvent] {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? startOfDay
        
        return try await fetchEvents(from: startOfDay, to: endOfDay)
    }
    
    // MARK: - Stress Trigger Analysis
    
    func analyzeStressTriggers(for events: [CalendarEvent]) -> [StressTrigger] {
        var triggers: [StressTrigger] = []
        let now = Date()
        
        for (index, event) in events.enumerated() {
            var eventTriggers: [StressTrigger] = []
            var stressLevel = 1
            
            // Check upcoming meeting
            let minutesUntil = event.minutesUntilStart
            if event.isUpcoming && minutesUntil <= 60 {
                stressLevel = max(stressLevel, calculateStressForUpcoming(minutesUntil: minutesUntil))
                eventTriggers.append(StressTrigger(
                    event: event,
                    stressLevel: stressLevel,
                    reason: .upcomingMeeting(minutesUntil: minutesUntil),
                    recommendedPreparationTime: 300 // 5 minutes
                ))
            }
            
            // Check back-to-back meetings
            if index > 0 {
                let previousEvent = events[index - 1]
                let timeBetween = event.startDate.timeIntervalSince(previousEvent.endDate)
                if timeBetween < 300 { // Less than 5 minutes
                    stressLevel = max(stressLevel, 7)
                    eventTriggers.append(StressTrigger(
                        event: event,
                        stressLevel: stressLevel,
                        reason: .backToBackMeetings,
                        recommendedPreparationTime: 180 // 3 minutes
                    ))
                }
            }
            
            // Check long meeting
            if event.duration > 3600 { // More than 1 hour
                stressLevel = max(stressLevel, 6)
                eventTriggers.append(StressTrigger(
                    event: event,
                    stressLevel: stressLevel,
                    reason: .longMeeting(duration: event.duration),
                    recommendedPreparationTime: 600 // 10 minutes
                ))
            }
            
            // Check many attendees
            if event.attendees.count > 5 {
                stressLevel = max(stressLevel, 7)
                eventTriggers.append(StressTrigger(
                    event: event,
                    stressLevel: stressLevel,
                    reason: .manyAttendees(count: event.attendees.count),
                    recommendedPreparationTime: 600 // 10 minutes
                ))
            }
            
            // Check important keywords
            let foundKeywords = findStressKeywords(in: event)
            if !foundKeywords.isEmpty {
                stressLevel = max(stressLevel, 8)
                eventTriggers.append(StressTrigger(
                    event: event,
                    stressLevel: stressLevel,
                    reason: .importantKeywords(foundKeywords),
                    recommendedPreparationTime: 900 // 15 minutes
                ))
            }
            
            // Check first meeting of day
            if isFirstMeetingOfDay(event, in: events) {
                stressLevel = max(stressLevel, 5)
                eventTriggers.append(StressTrigger(
                    event: event,
                    stressLevel: stressLevel,
                    reason: .firstMeetingOfDay,
                    recommendedPreparationTime: 300 // 5 minutes
                ))
            }
            
            // Check late night meeting
            let hour = Calendar.current.component(.hour, from: event.startDate)
            if hour >= 19 || hour <= 6 {
                stressLevel = max(stressLevel, 6)
                eventTriggers.append(StressTrigger(
                    event: event,
                    stressLevel: stressLevel,
                    reason: .lateNightMeeting,
                    recommendedPreparationTime: 300 // 5 minutes
                ))
            }
            
            // Check external meeting
            if hasExternalAttendees(event) {
                stressLevel = max(stressLevel, 7)
                eventTriggers.append(StressTrigger(
                    event: event,
                    stressLevel: stressLevel,
                    reason: .externalMeeting,
                    recommendedPreparationTime: 600 // 10 minutes
                ))
            }
            
            // Check presentation or demo
            if isPresentationOrDemo(event) {
                stressLevel = max(stressLevel, 9)
                eventTriggers.append(StressTrigger(
                    event: event,
                    stressLevel: stressLevel,
                    reason: .presentationOrDemo,
                    recommendedPreparationTime: 900 // 15 minutes
                ))
            }
            
            triggers.append(contentsOf: eventTriggers)
        }
        
        return triggers.sorted { $0.stressLevel > $1.stressLevel }
    }
    
    func getHighestStressTrigger(for events: [CalendarEvent]) -> StressTrigger? {
        let triggers = analyzeStressTriggers(for: events)
        return triggers.first
    }
    
    func getNextStressTrigger() async throws -> StressTrigger? {
        let events = try await fetchUpcomingEvents(hoursAhead: 4)
        return getHighestStressTrigger(for: events)
    }
    
    // MARK: - Analytics
    
    func analyzeCalendar(from startDate: Date, to endDate: Date) async throws -> CalendarAnalytics {
        let events = try await fetchEvents(from: startDate, to: endDate)
        
        let totalMeetings = events.count
        let totalDuration = events.reduce(0) { $0 + $1.duration }
        let averageDuration = totalMeetings > 0 ? totalDuration / Double(totalMeetings) : 0
        
        var backToBackCount = 0
        var currentStreak = 0
        var longestStreak = 0
        
        for (index, event) in events.enumerated() {
            if index > 0 {
                let previousEvent = events[index - 1]
                let timeBetween = event.startDate.timeIntervalSince(previousEvent.endDate)
                if timeBetween < 300 {
                    backToBackCount += 1
                    currentStreak += 1
                    longestStreak = max(longestStreak, currentStreak)
                } else {
                    currentStreak = 0
                }
            }
        }
        
        let workingHours: TimeInterval = endDate.timeIntervalSince(startDate)
        let busyPercentage = workingHours > 0 ? (totalDuration / workingHours) * 100 : 0
        
        let peakHours = calculatePeakHours(events: events)
        let stressTriggers = analyzeStressTriggers(for: events)
        
        return CalendarAnalytics(
            totalMeetings: totalMeetings,
            totalDuration: totalDuration,
            averageMeetingDuration: averageDuration,
            backToBackMeetingsCount: backToBackCount,
            longestMeetingStreak: longestStreak,
            busyPercentage: busyPercentage,
            peakHours: peakHours,
            stressTriggers: stressTriggers
        )
    }
    
    func getTodayAnalytics() async throws -> CalendarAnalytics {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay) ?? startOfDay
        
        return try await analyzeCalendar(from: startOfDay, to: endOfDay)
    }
    
    // MARK: - Monitoring
    
    private func startMonitoring() {
        Timer.publish(every: 300, on: .main, in: .common) // Every 5 minutes
            .autoconnect()
            .sink { [weak self] _ in
                Task {
                    await self?.updateUpcomingEvents()
                }
            }
            .store(in: &cancellables)
        
        NotificationCenter.default.publisher(for: .EKEventStoreChanged)
            .sink { [weak self] _ in
                Task {
                    await self?.updateUpcomingEvents()
                }
            }
            .store(in: &cancellables)
    }
    
    private func updateUpcomingEvents() async {
        guard hasAccess else { return }
        
        do {
            let events = try await fetchUpcomingEvents(hoursAhead: 4)
            let triggers = analyzeStressTriggers(for: events)
            
            DispatchQueue.main.async {
                self.upcomingEvents = events
                self.currentStressTriggers = triggers
            }
        } catch {
            print("Failed to update upcoming events: \(error)")
        }
    }
    
    //