import Foundation
import EventKit
import Combine

@MainActor
class CalendarEventsViewModel: ObservableObject {
    @Published var upcomingEvents: [CalendarEvent] = []
    @Published var stressTriggers: [CalendarEvent] = []
    @Published var isLoading: Bool = false
    @Published var error: Error?
    @Published var authorizationStatus: EKAuthorizationStatus = .notDetermined
    
    private let eventStore = EKEventStore()
    private var cancellables = Set<AnyCancellable>()
    private var refreshTimer: Timer?
    
    private let stressKeywords = [
        "interview", "presentation", "deadline", "exam", "meeting",
        "performance review", "pitch", "demo", "conference call",
        "important", "urgent", "critical", "final", "launch"
    ]
    
    private let highStressEventTypes = [
        "interview", "presentation", "exam", "performance review",
        "pitch", "demo", "board meeting"
    ]
    
    init() {
        checkAuthorizationStatus()
        setupRefreshTimer()
    }
    
    deinit {
        refreshTimer?.invalidate()
    }
    
    func checkAuthorizationStatus() {
        authorizationStatus = EKEventStore.authorizationStatus(for: .event)
    }
    
    func requestAccess() async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let granted = try await eventStore.requestAccess(to: .event)
            authorizationStatus = granted ? .authorized : .denied
            
            if granted {
                await fetchEvents()
            }
        } catch {
            self.error = error
            throw error
        }
    }
    
    func fetchEvents(daysAhead: Int = 7) async {
        guard authorizationStatus == .authorized else {
            return
        }
        
        isLoading = true
        defer { isLoading = false }
        
        let startDate = Date()
        let endDate = Calendar.current.date(byAdding: .day, value: daysAhead, to: startDate) ?? startDate
        
        let predicate = eventStore.predicateForEvents(withStart: startDate, end: endDate, calendars: nil)
        let ekEvents = eventStore.events(matching: predicate)
        
        let events = ekEvents.compactMap { ekEvent -> CalendarEvent? in
            guard let startDate = ekEvent.startDate,
                  let endDate = ekEvent.endDate else {
                return nil
            }
            
            let stressScore = calculateStressScore(for: ekEvent)
            let isStressTrigger = stressScore >= 60
            
            return CalendarEvent(
                id: ekEvent.eventIdentifier,
                title: ekEvent.title ?? "Untitled Event",
                startDate: startDate,
                endDate: endDate,
                location: ekEvent.location,
                notes: ekEvent.notes,
                isAllDay: ekEvent.isAllDay,
                url: ekEvent.url,
                calendar: CalendarInfo(
                    title: ekEvent.calendar.title,
                    color: ekEvent.calendar.cgColor
                ),
                attendees: ekEvent.attendees?.map { attendee in
                    AttendeeInfo(
                        name: attendee.name ?? "Unknown",
                        email: attendee.emailAddress,
                        status: attendee.participantStatus.rawValue
                    )
                },
                stressScore: stressScore,
                isStressTrigger: isStressTrigger,
                stressFactors: identifyStressFactors(for: ekEvent, stressScore: stressScore)
            )
        }
        
        upcomingEvents = events.sorted { $0.startDate < $1.startDate }
        stressTriggers = events.filter { $0.isStressTrigger }
    }
    
    func getEventsForDate(_ date: Date) -> [CalendarEvent] {
        let calendar = Calendar.current
        return upcomingEvents.filter { event in
            calendar.isDate(event.startDate, inSameDayAs: date)
        }
    }
    
    func getNextStressTrigger() -> CalendarEvent? {
        let now = Date()
        return stressTriggers.first { $0.startDate > now }
    }
    
    func getEventsInNextHours(_ hours: Int) -> [CalendarEvent] {
        let now = Date()
        let futureDate = Calendar.current.date(byAdding: .hour, value: hours, to: now) ?? now
        
        return upcomingEvents.filter { event in
            event.startDate >= now && event.startDate <= futureDate
        }
    }
    
    func getHighStressEventsToday() -> [CalendarEvent] {
        let calendar = Calendar.current
        let today = Date()
        
        return stressTriggers.filter { event in
            calendar.isDate(event.startDate, inSameDayAs: today)
        }
    }
    
    func shouldTriggerMeditation(currentStressLevel: Int) -> Bool {
        let nextEvent = getNextStressTrigger()
        
        guard let event = nextEvent else {
            return false
        }
        
        let timeUntilEvent = event.startDate.timeIntervalSince(Date())
        let hoursUntilEvent = timeUntilEvent / 3600
        
        // Trigger meditation if:
        // 1. High stress event within 2 hours and current stress is medium-high
        // 2. Critical stress event within 4 hours
        // 3. Current stress is very high regardless of upcoming events
        
        if currentStressLevel >= 80 {
            return true
        }
        
        if event.stressScore >= 80 && hoursUntilEvent <= 4 {
            return true
        }
        
        if event.stressScore >= 60 && hoursUntilEvent <= 2 && currentStressLevel >= 60 {
            return true
        }
        
        return false
    }
    
    func getRecommendedMeditationTime(for event: CalendarEvent) -> Date? {
        let optimalMinutesBefore: TimeInterval
        
        switch event.stressScore {
        case 80...100:
            optimalMinutesBefore = 30 * 60 // 30 minutes before
        case 60..<80:
            optimalMinutesBefore = 20 * 60 // 20 minutes before
        default:
            optimalMinutesBefore = 15 * 60 // 15 minutes before
        }
        
        return event.startDate.addingTimeInterval(-optimalMinutesBefore)
    }
    
    private func calculateStressScore(for event: EKEvent) -> Int {
        var score = 30 // Base score
        
        let title = event.title?.lowercased() ?? ""
        let notes = event.notes?.lowercased() ?? ""
        let combinedText = "\(title) \(notes)"
        
        // Check for high stress event types
        for eventType in highStressEventTypes {
            if combinedText.contains(eventType) {
                score += 30
                break
            }
        }
        
        // Check for stress keywords
        let keywordMatches = stressKeywords.filter { combinedText.contains($0) }.count
        score += min(keywordMatches * 10, 30)
        
        // Duration factor
        let duration = event.endDate.timeIntervalSince(event.startDate) / 60 // minutes
        if duration >= 120 {
            score += 15
        } else if duration >= 60 {
            score += 10
        }
        
        // Number of attendees
        if let attendees = event.attendees {
            let attendeeCount = attendees.count
            if attendeeCount >= 10 {
                score += 20
            } else if attendeeCount >= 5 {
                score += 15
            } else if attendeeCount >= 3 {
                score += 10
            }
        }
        
        // Time of day (early morning or late afternoon meetings can be more stressful)
        let hour = Calendar.current.component(.hour, from: event.startDate)
        if hour <= 8 || hour >= 17 {
            score += 10
        }
        
        // URL presence (often indicates important meetings)
        if event.url != nil {
            score += 10
        }
        
        // All-day events are usually less stressful
        if event.isAllDay {
            score -= 20
        }
        
        return min(max(score, 0), 100)
    }
    
    private func identifyStressFactors(for event: EKEvent, stressScore: Int) -> [String] {
        var factors: [String] = []
        
        let title = event.title?.lowercased() ?? ""
        let notes = event.notes?.lowercased() ?? ""
        let combinedText = "\(title) \(notes)"
        
        for eventType in highStressEventTypes {
            if combinedText.contains(eventType) {
                factors.append("High-pressure event type")
                break
            }
        }
        
        if let attendees = event.attendees, attendees.count >= 5 {
            factors.append("Large number of attendees (\(attendees.count))")
        }
        
        let duration = event.endDate.timeIntervalSince(event.startDate) / 60
        if duration >= 120 {
            factors.append("Long duration (\(Int(duration)) minutes)")
        }
        
        let hour = Calendar.current.component(.hour, from: event.startDate)
        if hour <= 8 {
            factors.append("Early morning meeting")
        } else if hour >= 17 {
            factors.append("Late afternoon meeting")
        }
        
        let keywordMatches = stressKeywords.filter { combinedText.contains($0) }
        if !keywordMatches.isEmpty {
            factors.append("Contains stress keywords: \(keywordMatches.prefix(3).joined(separator: ", "))")
        }
        
        if event.url != nil {
            factors.append("Remote meeting")
        }
        
        return factors
    }
    
    private func setupRefreshTimer() {
        refreshTimer = Timer.scheduledTimer(withTimeInterval: 300, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                await self?.fetchEvents()
            }
        }
    }
    
    func refresh() async {
        await fetchEvents()
    }
    
    func clearError() {
        error = nil
    }
}

// MARK: - Models

struct CalendarEvent: Identifiable, Codable {
    let id: String
    let title: String
    let startDate: Date
    let endDate: Date
    let location: String?
    let notes: String?
    let isAllDay: Bool
    let url: URL?
    let calendar: CalendarInfo
    let attendees: [AttendeeInfo]?
    let stressScore: Int
    let isStressTrigger: Bool
    let stressFactors: [String]
    
    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }
    
    var timeUntilStart: TimeInterval {
        startDate.timeIntervalSince(Date())
    }
    
    var isUpcoming: Bool {
        timeUntilStart > 0
    }
    
    var isPast: Bool {
        Date() > endDate
    }
    
    var isInProgress: Bool {
        let now = Date()
        return now >= startDate && now <= endDate
    }
    
    var stressLevel: StressLevel {
        switch stressScore {
        case 0..<40:
            return .low
        case 40..<60:
            return .medium
        case 60..<80:
            return .high
        default:
            return .critical
        }
    }
}

struct CalendarInfo: Codable {
    let title: String
    let color: CGColor?
    
    enum CodingKeys: String, CodingKey {
        case title
    }
    
    init(title: String, color: CGColor?) {
        self.title = title
        self.color = color
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        title = try container.decode(String.self, forKey: .title)
        color = nil
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(title, forKey: .title)
    }
}

struct AttendeeInfo: Codable {
    let name: String
    let email: String?
    let status: Int
    
    var participantStatus: String {
        switch status {
        case 0: return "Unknown"
        case 1: return "Pending"
        case 2: return "Accepted"
        case 3: return "Declined"
        case 4: return "Tentative"
        default: return "Unknown"
        }
    }
}

enum StressLevel: String, Codable {
    case low = "low"
    case medium = "medium"
    case high = "high"
    case critical = "critical"
    
    var color: String {
        switch self {
        case .low: return "green"
        case .medium: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        }
    }
    
    var description: String {
        switch self {
        case .low: return "Low stress"
        case .medium: return "Moderate stress"
        case .high: return "High stress"
        case .critical: return "Critical stress"
        }
    }
}

// MARK: - Hook Function

func useCalendarEvents() -> CalendarEventsViewModel {
    return CalendarEventsViewModel()
}