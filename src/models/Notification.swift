import Foundation

struct Notification: Codable, Identifiable, Equatable {
    let id: UUID
    let userId: UUID
    let type: NotificationType
    let title: String
    let body: String
    let context: NotificationContext
    let sentAt: Date
    var accepted: Bool?
    var respondedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case type
        case title
        case body
        case context
        case sentAt = "sent_at"
        case accepted
        case respondedAt = "responded_at"
    }
    
    init(
        id: UUID = UUID(),
        userId: UUID,
        type: NotificationType,
        title: String,
        body: String,
        context: NotificationContext,
        sentAt: Date = Date(),
        accepted: Bool? = nil,
        respondedAt: Date? = nil
    ) {
        self.id = id
        self.userId = userId
        self.type = type
        self.title = title
        self.body = body
        self.context = context
        self.sentAt = sentAt
        self.accepted = accepted
        self.respondedAt = respondedAt
    }
}

enum NotificationType: String, Codable {
    case stressDetected = "stress_detected"
    case sessionReminder = "session_reminder"
    case preEventReminder = "pre_event_reminder"
    case achievementUnlocked = "achievement_unlocked"
    case streakReminder = "streak_reminder"
    case dailyReminder = "daily_reminder"
    case postSessionFollowUp = "post_session_follow_up"
    case contextualTrigger = "contextual_trigger"
    
    var priority: UNNotificationInterruptionLevel {
        switch self {
        case .stressDetected, .preEventReminder:
            return .timeSensitive
        case .achievementUnlocked, .streakReminder:
            return .active
        case .sessionReminder, .dailyReminder, .postSessionFollowUp, .contextualTrigger:
            return .passive
        }
    }
    
    var categoryIdentifier: String {
        switch self {
        case .stressDetected, .preEventReminder:
            return "STRESS_ACTION"
        case .sessionReminder, .dailyReminder, .contextualTrigger:
            return "SESSION_REMINDER"
        case .achievementUnlocked:
            return "ACHIEVEMENT"
        case .streakReminder:
            return "STREAK_REMINDER"
        case .postSessionFollowUp:
            return "POST_SESSION"
        }
    }
    
    var defaultTitle: String {
        switch self {
        case .stressDetected:
            return "Стресс обнаружен"
        case .sessionReminder:
            return "Время для медитации"
        case .preEventReminder:
            return "Важное событие скоро"
        case .achievementUnlocked:
            return "Новое достижение!"
        case .streakReminder:
            return "Не теряй стрик!"
        case .dailyReminder:
            return "Ежедневная практика"
        case .postSessionFollowUp:
            return "Как вы себя чувствуете?"
        case .contextualTrigger:
            return "Время для перерыва"
        }
    }
}

struct NotificationContext: Codable, Equatable {
    let stressLevel: Int?
    let stressSource: StressSource?
    let calendarEvent: CalendarEventContext?
    let heartRate: Int?
    let sessionInterval: Int?
    let streakDays: Int?
    let achievementId: UUID?
    let exerciseRecommendation: ExerciseRecommendation?
    let metadata: [String: String]?
    
    enum CodingKeys: String, CodingKey {
        case stressLevel = "stress_level"
        case stressSource = "stress_source"
        case calendarEvent = "calendar_event"
        case heartRate = "heart_rate"
        case sessionInterval = "session_interval"
        case streakDays = "streak_days"
        case achievementId = "achievement_id"
        case exerciseRecommendation = "exercise_recommendation"
        case metadata
    }
    
    init(
        stressLevel: Int? = nil,
        stressSource: StressSource? = nil,
        calendarEvent: CalendarEventContext? = nil,
        heartRate: Int? = nil,
        sessionInterval: Int? = nil,
        streakDays: Int? = nil,
        achievementId: UUID? = nil,
        exerciseRecommendation: ExerciseRecommendation? = nil,
        metadata: [String: String]? = nil
    ) {
        self.stressLevel = stressLevel
        self.stressSource = stressSource
        self.calendarEvent = calendarEvent
        self.heartRate = heartRate
        self.sessionInterval = sessionInterval
        self.streakDays = streakDays
        self.achievementId = achievementId
        self.exerciseRecommendation = exerciseRecommendation
        self.metadata = metadata
    }
    
    static var empty: NotificationContext {
        NotificationContext()
    }
}

enum StressSource: String, Codable {
    case biometric
    case manual
    case aiAnalysis = "ai_analysis"
    case calendar
    case pattern
    case hybrid
}

struct CalendarEventContext: Codable, Equatable {
    let eventId: String
    let title: String
    let startDate: Date
    let endDate: Date
    let isImportant: Bool
    let minutesUntilEvent: Int
    
    enum CodingKeys: String, CodingKey {
        case eventId = "event_id"
        case title
        case startDate = "start_date"
        case endDate = "end_date"
        case isImportant = "is_important"
        case minutesUntilEvent = "minutes_until_event"
    }
}

struct ExerciseRecommendation: Codable, Equatable {
    let exerciseId: UUID
    let exerciseName: String
    let duration: Int
    let reason: String
    let confidence: Double
    
    enum CodingKeys: String, CodingKey {
        case exerciseId = "exercise_id"
        case exerciseName = "exercise_name"
        case duration
        case reason
        case confidence
    }
}

extension Notification {
    var isExpired: Bool {
        let expirationInterval: TimeInterval = 3600 // 1 час
        return Date().timeIntervalSince(sentAt) > expirationInterval
    }
    
    var wasAccepted: Bool {
        accepted == true
    }
    
    var wasDeclined: Bool {
        accepted == false
    }
    
    var isPending: Bool {
        accepted == nil
    }
    
    func toUserNotificationContent() -> UNMutableNotificationContent {
        let content = UNMutableNotificationContent()
        content.title = title
        content.body = body
        content.sound = .default
        content.interruptionLevel = type.priority
        content.categoryIdentifier = type.categoryIdentifier
        
        var userInfo: [String: Any] = [
            "notification_id": id.uuidString,
            "type": type.rawValue,
            "sent_at": ISO8601DateFormatter().string(from: sentAt)
        ]
        
        if let stressLevel = context.stressLevel {
            userInfo["stress_level"] = stressLevel
        }
        
        if let exerciseRecommendation = context.exerciseRecommendation {
            userInfo["exercise_id"] = exerciseRecommendation.exerciseId.uuidString
            userInfo["exercise_name"] = exerciseRecommendation.exerciseName
        }
        
        if let calendarEvent = context.calendarEvent {
            userInfo["event_title"] = calendarEvent.title
            userInfo["minutes_until_event"] = calendarEvent.minutesUntilEvent
        }
        
        content.userInfo = userInfo
        
        return content
    }
    
    static func createStressDetected(
        userId: UUID,
        stressLevel: Int,
        source: StressSource,
        calendarEvent: CalendarEventContext? = nil,
        heartRate: Int? = nil
    ) -> Notification {
        let context = NotificationContext(
            stressLevel: stressLevel,
            stressSource: source,
            calendarEvent: calendarEvent,
            heartRate: heartRate
        )
        
        var body = "Обнаружен повышенный уровень стресса (\(stressLevel)/10)."
        if let event = calendarEvent {
            body += " У вас скоро \"\(event.title)\" через \(event.minutesUntilEvent) мин."
        }
        body += " Медитация поможет успокоиться."
        
        return Notification(
            userId: userId,
            type: .stressDetected,
            title: NotificationType.stressDetected.defaultTitle,
            body: body,
            context: context
        )
    }
    
    static func createSessionReminder(
        userId: UUID,
        intervalHours: Int,
        exerciseRecommendation: ExerciseRecommendation? = nil
    ) -> Notification {
        let context = NotificationContext(
            sessionInterval: intervalHours,
            exerciseRecommendation: exerciseRecommendation
        )
        
        var body = "Прошло \(intervalHours) ч. с последней сессии."
        if let recommendation = exerciseRecommendation {
            body += " Попробуйте \"\(recommendation.exerciseName)\" (\(recommendation.duration/60) мин)."
        }
        
        return Notification(
            userId: userId,
            type: .sessionReminder,
            title: NotificationType.sessionReminder.defaultTitle,
            body: body,
            context: context
        )
    }
    
    static func createPreEventReminder(
        userId: UUID,
        calendarEvent: CalendarEventContext,
        stressLevel: Int? = nil
    ) -> Notification {
        let context = NotificationContext(
            stressLevel: stressLevel,
            calendarEvent: calendarEvent
        )
        
        let body = "У вас \"\(calendarEvent.title)\" через \(calendarEvent.minutesUntilEvent) мин. Подготовьтесь с короткой медитацией."
        
        return Notification(
            userId: userId,
            type: .preEventReminder,
            title: NotificationType.preEventReminder.defaultTitle,
            body: body,
            context: context
        )
    }
    
    static func createAchievementUnlocked(
        userId: UUID,
        achievementId: UUID,
        achievementName: String
    ) -> Notification {
        let context = NotificationContext(
            achievementId: achievementId
        )
        
        return Notification(
            userId: userId,
            type: .achievementUnlocked,
            title: NotificationType.achievementUnlocked.defaultTitle,
            body: "Вы разблокировали достижение: \"\(achievementName)\"",
            context: context
        )
    }
    
    static func createStreakReminder(
        userId: UUID,
        currentStreak: Int
    ) -> Notification {
        let context = NotificationContext(
            streakDays: currentStreak
        )
        
        return Notification(
            userId: userId,
            type: .streakReminder,
            title: NotificationType.streakReminder.defaultTitle,
            body: "У вас стрик \(currentStreak) дней! Не прерывайте серию.",
            context: context
        )
    }
}

struct NotificationResponse: Codable {
    let notificationId: UUID
    let accepted: Bool
    let respondedAt: Date
    let actionIdentifier: String?
    
    enum CodingKeys: String, CodingKey {
        case notificationId = "notification_id"
        case accepted
        case respondedAt = "responded_at"
        case actionIdentifier = "action_identifier"
    }
}

struct NotificationSettings: Codable {
    var enabled: Bool
    var stressDetectionEnabled: Bool
    var sessionRemindersEnabled: Bool
    var preEventRemindersEnabled: Bool
    var achievementNotificationsEnabled: Bool
    var streakRemindersEnabled: Bool
    var dailyRemindersEnabled: Bool
    var quietHoursStart: Date?
    var quietHoursEnd: Date?
    var maxNotificationsPerDay: Int
    
    enum CodingKeys: String, CodingKey {
        case enabled
        case stressDetectionEnabled = "stress_detection_enabled"
        case sessionRemindersEnabled = "session_reminders_enabled"
        case preEventRemindersEnabled = "pre_event_reminders_enabled"
        case achievementNotificationsEnabled = "achievement_notifications_enabled"
        case streakRemindersEnabled = "streak_reminders_enabled"
        case dailyRemindersEnabled = "daily_reminders_enabled"
        case quietHoursStart = "quiet_hours_start"
        case quietHoursEnd = "quiet_hours_end"
        case maxNotificationsPerDay = "max_notifications_per_day"
    }
    
    static var `default`: NotificationSettings {
        NotificationSettings(
            enabled: true,
            stressDetectionEnabled: true,
            sessionRemindersEnabled: true,
            preEventRemindersEnabled: true,
            achievementNotificationsEnabled: true,
            streakRemindersEnabled: true,
            dailyRemindersEnabled: false,
            quietHoursStart: nil,
            quietHoursEnd: nil,
            maxNotificationsPerDay: 8
        )
    }
    
    func isNotificationAllowed(type: NotificationType, at date: Date = Date()) -> Bool {
        guard enabled else { return false }
        
        switch type {
        case .stressDetected:
            return stressDetectionEnabled
        case .sessionReminder:
            return sessionRemindersEnabled
        case .preEventReminder:
            return preEventRemindersEnabled
        case .achievementUnlocked:
            return achievementNotificationsEnabled
        case .streakReminder:
            return streakRemindersEnabled
        case .dailyReminder:
            return dailyRemindersEnabled
        case .postSessionFollowUp, .contextualTrigger:
            return true
        }
    }
    
    func isInQuietHours(date: Date = Date()) -> Bool {
        guard let start = quietHoursStart, let end = quietHoursEnd else {
            return false
        }
        
        let calendar = Calendar.current
        let hour = calendar.component(.hour, from: date)
        let minute = calendar.component(.minute, from: date)
        
        let startHour = calendar.component(.hour, from: start)
        let startMinute = calendar.component(.minute, from: start)
        let endHour = calendar.component(.hour, from: end)
        let endMinute = calendar.component(.minute, from: end)
        
        let currentMinutes = hour * 60 + minute
        let startMinutes = startHour * 60 + startMinute
        let endMinutes = endHour * 60 + endMinute
        
        if startMinutes <= endMinutes {
            return currentMinutes >= startMinutes && currentMinutes <= endMinutes
        } else {
            return currentMinutes >= startMinutes || currentMinutes <= endMinutes
        }
    }
}