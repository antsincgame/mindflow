import UserNotifications
import Supabase

class NotificationService: UNNotificationServiceExtension {
    
    var contentHandler: ((UNNotificationContent) -> Void)?
    var bestAttemptContent: UNMutableNotificationContent?
    
    private let supabaseURL = URL(string: ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? "")!
    private let supabaseKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? ""
    
    private lazy var supabase: SupabaseClient = {
        return SupabaseClient(supabaseURL: supabaseURL, supabaseKey: supabaseKey)
    }()
    
    override func didReceive(_ request: UNNotificationRequest, withContentHandler contentHandler: @escaping (UNNotificationContent) -> Void) {
        self.contentHandler = contentHandler
        bestAttemptContent = (request.content.mutableCopy() as? UNMutableNotificationContent)
        
        guard let bestAttemptContent = bestAttemptContent else {
            contentHandler(request.content)
            return
        }
        
        let userInfo = request.content.userInfo
        let notificationType = userInfo["type"] as? String ?? "unknown"
        let stressLevel = userInfo["stress_level"] as? Int ?? 0
        let context = userInfo["context"] as? [String: Any] ?? [:]
        
        switch notificationType {
        case "stress_detected":
            handleStressDetectedNotification(content: bestAttemptContent, stressLevel: stressLevel, context: context)
            
        case "session_reminder":
            handleSessionReminderNotification(content: bestAttemptContent, context: context)
            
        case "achievement_unlocked":
            handleAchievementUnlockedNotification(content: bestAttemptContent, context: context)
            
        case "streak_reminder":
            handleStreakReminderNotification(content: bestAttemptContent, context: context)
            
        case "pre_meeting_suggestion":
            handlePreMeetingSuggestionNotification(content: bestAttemptContent, context: context)
            
        default:
            break
        }
        
        Task {
            await logNotificationHistory(type: notificationType, context: context)
        }
        
        contentHandler(bestAttemptContent)
    }
    
    override func serviceExtensionTimeWillExpire() {
        if let contentHandler = contentHandler, let bestAttemptContent = bestAttemptContent {
            contentHandler(bestAttemptContent)
        }
    }
    
    private func handleStressDetectedNotification(content: UNMutableNotificationContent, stressLevel: Int, context: [String: Any]) {
        let stressEmoji = getStressEmoji(level: stressLevel)
        
        content.title = "Стресс обнаружен \(stressEmoji)"
        
        if let eventTitle = context["event_title"] as? String {
            content.body = "Перед встречей \"\(eventTitle)\" — сделайте 3-минутную медитацию для спокойствия"
        } else if let heartRate = context["heart_rate"] as? Int {
            content.body = "Ваш пульс повышен (\(heartRate) уд/мин). Быстрая дыхательная практика поможет снять напряжение"
        } else {
            content.body = "Уровень стресса: \(stressLevel)/10. Начните короткую медитацию прямо сейчас"
        }
        
        content.sound = .default
        content.badge = NSNumber(value: 1)
        content.categoryIdentifier = "STRESS_DETECTED_CATEGORY"
        content.threadIdentifier = "stress_notifications"
        
        content.userInfo["stress_level"] = stressLevel
        content.userInfo["timestamp"] = Date().timeIntervalSince1970
        
        if let exerciseId = context["recommended_exercise_id"] as? String {
            content.userInfo["exercise_id"] = exerciseId
        }
        
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .timeSensitive
            content.relevanceScore = Double(stressLevel) / 10.0
        }
    }
    
    private func handleSessionReminderNotification(content: UNMutableNotificationContent, context: [String: Any]) {
        content.title = "Время для практики 🧘‍♀️"
        
        let hoursSinceLastSession = context["hours_since_last_session"] as? Int ?? 4
        
        if hoursSinceLastSession >= 8 {
            content.body = "Вы не медитировали \(hoursSinceLastSession) часов. Уделите 5 минут себе"
        } else {
            content.body = "Регулярная практика помогает поддерживать спокойствие. Начать сессию?"
        }
        
        content.sound = .default
        content.categoryIdentifier = "SESSION_REMINDER_CATEGORY"
        content.threadIdentifier = "reminder_notifications"
        
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .passive
        }
    }
    
    private func handleAchievementUnlockedNotification(content: UNMutableNotificationContent, context: [String: Any]) {
        let achievementName = context["achievement_name"] as? String ?? "Новое достижение"
        let achievementDescription = context["achievement_description"] as? String ?? ""
        
        content.title = "🎉 Достижение разблокировано!"
        content.body = "\(achievementName)\n\(achievementDescription)"
        content.sound = UNNotificationSound(named: UNNotificationSoundName("achievement_sound.wav"))
        content.categoryIdentifier = "ACHIEVEMENT_CATEGORY"
        content.threadIdentifier = "achievement_notifications"
        
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .active
        }
    }
    
    private func handleStreakReminderNotification(content: UNMutableNotificationContent, context: [String: Any]) {
        let currentStreak = context["current_streak"] as? Int ?? 0
        
        content.title = "Не теряйте свою серию! 🔥"
        content.body = "У вас \(currentStreak) дней подряд практики. Сделайте короткую медитацию, чтобы сохранить прогресс"
        content.sound = .default
        content.categoryIdentifier = "STREAK_REMINDER_CATEGORY"
        content.threadIdentifier = "streak_notifications"
        
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .active
        }
    }
    
    private func handlePreMeetingSuggestionNotification(content: UNMutableNotificationContent, context: [String: Any]) {
        let eventTitle = context["event_title"] as? String ?? "важной встречи"
        let minutesUntilEvent = context["minutes_until_event"] as? Int ?? 15
        
        content.title = "Подготовка к встрече 📅"
        content.body = "Через \(minutesUntilEvent) мин: \"\(eventTitle)\". Медитация поможет быть спокойнее и сфокусированнее"
        content.sound = .default
        content.categoryIdentifier = "PRE_MEETING_CATEGORY"
        content.threadIdentifier = "meeting_notifications"
        
        content.userInfo["event_id"] = context["event_id"]
        content.userInfo["event_start_time"] = context["event_start_time"]
        
        if #available(iOS 15.0, *) {
            content.interruptionLevel = .timeSensitive
            content.relevanceScore = 0.9
        }
    }
    
    private func getStressEmoji(level: Int) -> String {
        switch level {
        case 0...3:
            return "😌"
        case 4...6:
            return "😟"
        case 7...8:
            return "😰"
        case 9...10:
            return "🚨"
        default:
            return "😐"
        }
    }
    
    private func logNotificationHistory(type: String, context: [String: Any]) async {
        guard let userId = await getCurrentUserId() else {
            return
        }
        
        let contextJson: [String: Any] = context
        
        do {
            let _: EmptyResponse = try await supabase.database
                .from("notification_history")
                .insert([
                    "user_id": userId,
                    "type": type,
                    "accepted": false,
                    "context": contextJson,
                    "sent_at": ISO8601DateFormatter().string(from: Date())
                ])
                .execute()
                .value
        } catch {
            print("Failed to log notification history: \(error.localizedDescription)")
        }
    }
    
    private func getCurrentUserId() async -> String? {
        do {
            let session = try await supabase.auth.session
            return session.user.id.uuidString
        } catch {
            print("Failed to get current user: \(error.localizedDescription)")
            return nil
        }
    }
}

struct EmptyResponse: Decodable {}

extension UNNotificationCategory {
    static func registerCustomCategories() {
        let stressDetectedCategory = UNNotificationCategory(
            identifier: "STRESS_DETECTED_CATEGORY",
            actions: [
                UNNotificationAction(
                    identifier: "START_MEDITATION",
                    title: "Начать медитацию",
                    options: [.foreground]
                ),
                UNNotificationAction(
                    identifier: "DISMISS",
                    title: "Позже",
                    options: []
                )
            ],
            intentIdentifiers: [],
            options: []
        )
        
        let sessionReminderCategory = UNNotificationCategory(
            identifier: "SESSION_REMINDER_CATEGORY",
            actions: [
                UNNotificationAction(
                    identifier: "START_SESSION",
                    title: "Начать",
                    options: [.foreground]
                ),
                UNNotificationAction(
                    identifier: "SNOOZE",
                    title: "Напомнить через час",
                    options: []
                )
            ],
            intentIdentifiers: [],
            options: []
        )
        
        let achievementCategory = UNNotificationCategory(
            identifier: "ACHIEVEMENT_CATEGORY",
            actions: [
                UNNotificationAction(
                    identifier: "VIEW_ACHIEVEMENT",
                    title: "Посмотреть",
                    options: [.foreground]
                )
            ],
            intentIdentifiers: [],
            options: []
        )
        
        let streakReminderCategory = UNNotificationCategory(
            identifier: "STREAK_REMINDER_CATEGORY",
            actions: [
                UNNotificationAction(
                    identifier: "CONTINUE_STREAK",
                    title: "Продолжить серию",
                    options: [.foreground]
                ),
                UNNotificationAction(
                    identifier: "DISMISS",
                    title: "Позже",
                    options: []
                )
            ],
            intentIdentifiers: [],
            options: []
        )
        
        let preMeetingCategory = UNNotificationCategory(
            identifier: "PRE_MEETING_CATEGORY",
            actions: [
                UNNotificationAction(
                    identifier: "MEDITATE_BEFORE_MEETING",
                    title: "Медитировать",
                    options: [.foreground]
                ),
                UNNotificationAction(
                    identifier: "SKIP",
                    title: "Пропустить",
                    options: []
                )
            ],
            intentIdentifiers: [],
            options: []
        )
        
        UNUserNotificationCenter.current().setNotificationCategories([
            stressDetectedCategory,
            sessionReminderCategory,
            achievementCategory,
            streakReminderCategory,
            preMeetingCategory
        ])
    }
}