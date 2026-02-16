import Foundation
import EventKit

struct CalendarEvent: Identifiable, Codable, Equatable {
    let id: String
    let title: String
    let startDate: Date
    let endDate: Date
    let location: String?
    let notes: String?
    let isAllDay: Bool
    let importance: EventImportance
    let stressTrigger: StressTrigger?
    let attendeeCount: Int
    let url: URL?
    let calendar: CalendarInfo?
    let recurrenceRule: String?
    
    var duration: TimeInterval {
        endDate.timeIntervalSince(startDate)
    }
    
    var durationMinutes: Int {
        Int(duration / 60)
    }
    
    var isUpcoming: Bool {
        startDate > Date()
    }
    
    var isInProgress: Bool {
        let now = Date()
        return now >= startDate && now <= endDate
    }
    
    var isPast: Bool {
        endDate < Date()
    }
    
    var timeUntilStart: TimeInterval {
        startDate.timeIntervalSince(Date())
    }
    
    var minutesUntilStart: Int {
        Int(timeUntilStart / 60)
    }
    
    var stressScore: Double {
        guard let trigger = stressTrigger else { return 0 }
        
        var score = trigger.baseStressLevel
        
        // Увеличиваем стресс для важных событий
        score += importance.stressMultiplier * 10
        
        // Увеличиваем стресс для событий с большим количеством участников
        if attendeeCount > 5 {
            score += Double(attendeeCount) * 0.5
        }
        
        // Увеличиваем стресс для длинных встреч
        if durationMinutes > 60 {
            score += Double(durationMinutes - 60) * 0.1
        }
        
        // Увеличиваем стресс для событий, начинающихся скоро
        if minutesUntilStart > 0 && minutesUntilStart < 30 {
            score += Double(30 - minutesUntilStart) * 0.3
        }
        
        return min(score, 100)
    }
    
    var shouldTriggerMeditation: Bool {
        guard let trigger = stressTrigger else { return false }
        
        // Триггер за 15-30 минут до важного события
        if importance.rawValue >= EventImportance.high.rawValue {
            return minutesUntilStart > 15 && minutesUntilStart < 30
        }
        
        // Триггер за 10-20 минут до среднего события
        if importance.rawValue == EventImportance.medium.rawValue {
            return minutesUntilStart > 10 && minutesUntilStart < 20
        }
        
        return trigger.shouldTrigger(for: self)
    }
    
    init(
        id: String = UUID().uuidString,
        title: String,
        startDate: Date,
        endDate: Date,
        location: String? = nil,
        notes: String? = nil,
        isAllDay: Bool = false,
        importance: EventImportance = .medium,
        stressTrigger: StressTrigger? = nil,
        attendeeCount: Int = 0,
        url: URL? = nil,
        calendar: CalendarInfo? = nil,
        recurrenceRule: String? = nil
    ) {
        self.id = id
        self.title = title
        self.startDate = startDate
        self.endDate = endDate
        self.location = location
        self.notes = notes
        self.isAllDay = isAllDay
        self.importance = importance
        self.stressTrigger = stressTrigger
        self.attendeeCount = attendeeCount
        self.url = url
        self.calendar = calendar
        self.recurrenceRule = recurrenceRule
    }
    
    init(from ekEvent: EKEvent) {
        self.id = ekEvent.eventIdentifier
        self.title = ekEvent.title ?? "Без названия"
        self.startDate = ekEvent.startDate
        self.endDate = ekEvent.endDate
        self.location = ekEvent.location
        self.notes = ekEvent.notes
        self.isAllDay = ekEvent.isAllDay
        self.importance = EventImportance.from(ekEvent: ekEvent)
        self.stressTrigger = StressTrigger.from(ekEvent: ekEvent)
        self.attendeeCount = ekEvent.attendees?.count ?? 0
        self.url = ekEvent.url
        self.calendar = CalendarInfo(from: ekEvent.calendar)
        self.recurrenceRule = ekEvent.recurrenceRules?.first?.description
    }
}

enum EventImportance: Int, Codable, CaseIterable {
    case low = 1
    case medium = 2
    case high = 3
    case critical = 4
    
    var description: String {
        switch self {
        case .low: return "Низкая"
        case .medium: return "Средняя"
        case .high: return "Высокая"
        case .critical: return "Критическая"
        }
    }
    
    var stressMultiplier: Double {
        switch self {
        case .low: return 0.5
        case .medium: return 1.0
        case .high: return 1.5
        case .critical: return 2.0
        }
    }
    
    var color: String {
        switch self {
        case .low: return "green"
        case .medium: return "yellow"
        case .high: return "orange"
        case .critical: return "red"
        }
    }
    
    static func from(ekEvent: EKEvent) -> EventImportance {
        let title = ekEvent.title?.lowercased() ?? ""
        let notes = ekEvent.notes?.lowercased() ?? ""
        let attendeeCount = ekEvent.attendees?.count ?? 0
        
        // Критические события
        if title.contains("interview") || title.contains("собеседование") ||
           title.contains("presentation") || title.contains("презентация") ||
           title.contains("demo") || title.contains("демо") ||
           title.contains("pitch") || title.contains("питч") {
            return .critical
        }
        
        // Важные события
        if title.contains("meeting") || title.contains("встреча") ||
           title.contains("call") || title.contains("звонок") ||
           title.contains("review") || title.contains("ревью") ||
           attendeeCount > 5 {
            return .high
        }
        
        // Средние события
        if title.contains("sync") || title.contains("синк") ||
           title.contains("standup") || title.contains("стендап") ||
           title.contains("1:1") || title.contains("one-on-one") ||
           attendeeCount > 2 {
            return .medium
        }
        
        return .low
    }
}

struct StressTrigger: Codable, Equatable {
    let type: TriggerType
    let baseStressLevel: Double
    let keywords: [String]
    let timeBeforeEvent: TimeInterval
    let metadata: [String: String]?
    
    var description: String {
        switch type {
        case .interview: return "Собеседование"
        case .presentation: return "Презентация"
        case .importantMeeting: return "Важная встреча"
        case .deadline: return "Дедлайн"
        case .publicSpeaking: return "Публичное выступление"
        case .performance: return "Оценка производительности"
        case .conflict: return "Конфликтная ситуация"
        case .firstTime: return "Первый раз"
        case .highStakes: return "Высокие ставки"
        case .custom: return "Пользовательский триггер"
        }
    }
    
    func shouldTrigger(for event: CalendarEvent) -> Bool {
        let minutesUntil = event.minutesUntilStart
        let thresholdMinutes = Int(timeBeforeEvent / 60)
        
        return minutesUntil > 0 && minutesUntil <= thresholdMinutes
    }
    
    static func from(ekEvent: EKEvent) -> StressTrigger? {
        let title = ekEvent.title?.lowercased() ?? ""
        let notes = ekEvent.notes?.lowercased() ?? ""
        let combinedText = "\(title) \(notes)"
        
        // Собеседование
        if combinedText.contains("interview") || combinedText.contains("собеседование") {
            return StressTrigger(
                type: .interview,
                baseStressLevel: 75,
                keywords: ["interview", "собеседование"],
                timeBeforeEvent: 30 * 60,
                metadata: ["category": "career"]
            )
        }
        
        // Презентация
        if combinedText.contains("presentation") || combinedText.contains("презентация") ||
           combinedText.contains("demo") || combinedText.contains("демо") {
            return StressTrigger(
                type: .presentation,
                baseStressLevel: 70,
                keywords: ["presentation", "презентация", "demo", "демо"],
                timeBeforeEvent: 25 * 60,
                metadata: ["category": "performance"]
            )
        }
        
        // Публичное выступление
        if combinedText.contains("pitch") || combinedText.contains("питч") ||
           combinedText.contains("speech") || combinedText.contains("выступление") {
            return StressTrigger(
                type: .publicSpeaking,
                baseStressLevel: 80,
                keywords: ["pitch", "питч", "speech", "выступление"],
                timeBeforeEvent: 30 * 60,
                metadata: ["category": "performance"]
            )
        }
        
        // Дедлайн
        if combinedText.contains("deadline") || combinedText.contains("дедлайн") ||
           combinedText.contains("due") || combinedText.contains("срок") {
            return StressTrigger(
                type: .deadline,
                baseStressLevel: 65,
                keywords: ["deadline", "дедлайн", "due", "срок"],
                timeBeforeEvent: 20 * 60,
                metadata: ["category": "work"]
            )
        }
        
        // Оценка производительности
        if combinedText.contains("review") || combinedText.contains("ревью") ||
           combinedText.contains("evaluation") || combinedText.contains("оценка") ||
           combinedText.contains("performance") {
            return StressTrigger(
                type: .performance,
                baseStressLevel: 70,
                keywords: ["review", "ревью", "evaluation", "оценка"],
                timeBeforeEvent: 25 * 60,
                metadata: ["category": "career"]
            )
        }
        
        // Важная встреча с большим количеством участников
        if (ekEvent.attendees?.count ?? 0) > 5 {
            return StressTrigger(
                type: .importantMeeting,
                baseStressLevel: 60,
                keywords: ["meeting", "встреча"],
                timeBeforeEvent: 20 * 60,
                metadata: ["attendees": "\(ekEvent.attendees?.count ?? 0)"]
            )
        }
        
        return nil
    }
}

enum TriggerType: String, Codable, CaseIterable {
    case interview
    case presentation
    case importantMeeting
    case deadline
    case publicSpeaking
    case performance
    case conflict
    case firstTime
    case highStakes
    case custom
}

struct CalendarInfo: Codable, Equatable {
    let identifier: String
    let title: String
    let color: String
    let source: String
    
    init(identifier: String, title: String, color: String, source: String) {
        self.identifier = identifier
        self.title = title
        self.color = color
        self.source = source
    }
    
    init(from ekCalendar: EKCalendar) {
        self.identifier = ekCalendar.calendarIdentifier
        self.title = ekCalendar.title
        self.color = ekCalendar.cgColor.components?.map { String(format: "%02X", Int($0 * 255)) }.joined() ?? "000000"
        self.source = ekCalendar.source.title
    }
}

extension CalendarEvent {
    static func mock(
        title: String = "Важная встреча",
        minutesFromNow: Int = 20,
        duration: Int = 60,
        importance: EventImportance = .high,
        attendeeCount: Int = 3
    ) -> CalendarEvent {
        let start = Date().addingTimeInterval(TimeInterval(minutesFromNow * 60))
        let end = start.addingTimeInterval(TimeInterval(duration * 60))
        
        return CalendarEvent(
            title: title,
            startDate: start,
            endDate: end,
            location: "Zoom",
            importance: importance,
            stressTrigger: StressTrigger(
                type: .importantMeeting,
                baseStressLevel: 60,
                keywords: ["meeting"],
                timeBeforeEvent: 20 * 60,
                metadata: nil
            ),
            attendeeCount: attendeeCount
        )
    }
    
    static var mockInterview: CalendarEvent {
        CalendarEvent.mock(
            title: "Техническое собеседование",
            minutesFromNow: 25,
            duration: 90,
            importance: .critical,
            attendeeCount: 2
        )
    }
    
    static var mockPresentation: CalendarEvent {
        CalendarEvent.mock(
            title: "Презентация проекта",
            minutesFromNow: 20,
            duration: 45,
            importance: .high,
            attendeeCount: 8
        )
    }
    
    static var mockDeadline: CalendarEvent {
        CalendarEvent.mock(
            title: "Дедлайн по проекту",
            minutesFromNow: 15,
            duration: 30,
            importance: .high,
            attendeeCount: 1
        )
    }
}

extension Array where Element == CalendarEvent {
    func upcomingEvents(within minutes: Int) -> [CalendarEvent] {
        let threshold = Date().addingTimeInterval(TimeInterval(minutes * 60))
        return self
            .filter { $0.startDate > Date() && $0.startDate <= threshold }
            .sorted { $0.startDate < $1.startDate }
    }
    
    func stressfulEvents(threshold: Double = 50) -> [CalendarEvent] {
        self.filter { $0.stressScore >= threshold }
    }
    
    func eventsRequiringMeditation() -> [CalendarEvent] {
        self.filter { $0.shouldTriggerMeditation }
    }
    
    func nextStressfulEvent() -> CalendarEvent? {
        self
            .filter { $0.isUpcoming }
            .sorted { $0.startDate < $1.startDate }
            .first { $0.stressScore >= 50 }
    }
}