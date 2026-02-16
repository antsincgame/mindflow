import SwiftUI
import Combine
import UserNotifications

@MainActor
class NotificationsManager: ObservableObject {
    @Published var authorizationStatus: UNAuthorizationStatus = .notDetermined
    @Published var isEnabled: Bool = false
    @Published var pendingNotifications: [UNNotificationRequest] = []
    @Published var deliveredNotifications: [UNNotification] = []
    @Published var lastNotificationResponse: UNNotificationResponse?
    @Published var error: Error?
    
    private let notificationService: NotificationService
    private let supabaseService: SupabaseService
    private var cancellables = Set<AnyCancellable>()
    
    init(
        notificationService: NotificationService = .shared,
        supabaseService: SupabaseService = .shared
    ) {
        self.notificationService = notificationService
        self.supabaseService = supabaseService
        
        setupBindings()
        checkAuthorizationStatus()
    }
    
    private func setupBindings() {
        notificationService.authorizationStatusPublisher
            .receive(on: DispatchQueue.main)
            .assign(to: &$authorizationStatus)
        
        notificationService.isEnabledPublisher
            .receive(on: DispatchQueue.main)
            .assign(to: &$isEnabled)
        
        notificationService.errorPublisher
            .receive(on: DispatchQueue.main)
            .assign(to: &$error)
        
        notificationService.notificationResponsePublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] response in
                self?.lastNotificationResponse = response
                self?.handleNotificationResponse(response)
            }
            .store(in: &cancellables)
    }
    
    func requestAuthorization() async -> Bool {
        do {
            let granted = try await notificationService.requestAuthorization()
            await checkAuthorizationStatus()
            return granted
        } catch {
            self.error = error
            return false
        }
    }
    
    func checkAuthorizationStatus() {
        Task {
            let status = await notificationService.getAuthorizationStatus()
            await MainActor.run {
                self.authorizationStatus = status
                self.isEnabled = status == .authorized
            }
        }
    }
    
    func registerForRemoteNotifications() {
        notificationService.registerForRemoteNotifications()
    }
    
    func scheduleStressDetectionNotification(
        stressLevel: Int,
        context: [String: Any],
        delay: TimeInterval = 0
    ) async throws {
        let notification = NotificationModel(
            id: UUID(),
            userId: try await getCurrentUserId(),
            type: .stressDetected,
            title: getStressNotificationTitle(level: stressLevel),
            body: getStressNotificationBody(level: stressLevel, context: context),
            data: [
                "stress_level": stressLevel,
                "context": context
            ],
            scheduledFor: Date().addingTimeInterval(delay),
            accepted: nil,
            sentAt: nil
        )
        
        try await notificationService.scheduleLocalNotification(notification)
        try await saveNotificationHistory(notification)
        await loadPendingNotifications()
    }
    
    func scheduleSessionReminder(
        intervalHours: Int,
        lastSessionDate: Date?
    ) async throws {
        guard isEnabled else { return }
        
        let nextSessionDate = calculateNextSessionDate(
            intervalHours: intervalHours,
            lastSessionDate: lastSessionDate
        )
        
        let notification = NotificationModel(
            id: UUID(),
            userId: try await getCurrentUserId(),
            type: .sessionReminder,
            title: "Время для медитации",
            body: "Прошло \(intervalHours) часа с последней практики. Готовы продолжить?",
            data: ["interval_hours": intervalHours],
            scheduledFor: nextSessionDate,
            accepted: nil,
            sentAt: nil
        )
        
        try await notificationService.scheduleLocalNotification(notification)
        try await saveNotificationHistory(notification)
        await loadPendingNotifications()
    }
    
    func scheduleCalendarBasedNotification(
        event: CalendarEvent,
        minutesBefore: Int = 15
    ) async throws {
        guard isEnabled else { return }
        guard event.isStressTrigger else { return }
        
        let notificationDate = event.startDate.addingTimeInterval(-Double(minutesBefore * 60))
        
        guard notificationDate > Date() else { return }
        
        let notification = NotificationModel(
            id: UUID(),
            userId: try await getCurrentUserId(),
            type: .calendarBased,
            title: "Подготовьтесь к событию",
            body: "Через \(minutesBefore) минут начнется '\(event.title)'. Хотите медитировать?",
            data: [
                "event_id": event.id.uuidString,
                "event_title": event.title,
                "minutes_before": minutesBefore
            ],
            scheduledFor: notificationDate,
            accepted: nil,
            sentAt: nil
        )
        
        try await notificationService.scheduleLocalNotification(notification)
        try await saveNotificationHistory(notification)
        await loadPendingNotifications()
    }
    
    func scheduleAchievementNotification(achievement: Achievement) async throws {
        let notification = NotificationModel(
            id: UUID(),
            userId: try await getCurrentUserId(),
            type: .achievementUnlocked,
            title: "Новое достижение! 🎉",
            body: "Вы получили '\(achievement.name)'",
            data: ["achievement_id": achievement.id.uuidString],
            scheduledFor: Date(),
            accepted: nil,
            sentAt: nil
        )
        
        try await notificationService.scheduleLocalNotification(notification)
        try await saveNotificationHistory(notification)
    }
    
    func scheduleStreakNotification(currentStreak: Int) async throws {
        guard currentStreak > 0 else { return }
        
        let notification = NotificationModel(
            id: UUID(),
            userId: try await getCurrentUserId(),
            type: .streakReminder,
            title: "Не теряйте стрик! 🔥",
            body: "У вас \(currentStreak) дней подряд. Продолжайте практику сегодня!",
            data: ["current_streak": currentStreak],
            scheduledFor: Calendar.current.date(bySettingHour: 20, minute: 0, second: 0, of: Date()) ?? Date(),
            accepted: nil,
            sentAt: nil
        )
        
        try await notificationService.scheduleLocalNotification(notification)
        try await saveNotificationHistory(notification)
    }
    
    func cancelNotification(identifier: String) async {
        notificationService.cancelNotification(identifier: identifier)
        await loadPendingNotifications()
    }
    
    func cancelAllNotifications() async {
        notificationService.cancelAllNotifications()
        await loadPendingNotifications()
    }
    
    func loadPendingNotifications() async {
        let notifications = await notificationService.getPendingNotifications()
        await MainActor.run {
            self.pendingNotifications = notifications
        }
    }
    
    func loadDeliveredNotifications() async {
        let notifications = await notificationService.getDeliveredNotifications()
        await MainActor.run {
            self.deliveredNotifications = notifications
        }
    }
    
    func markNotificationAsAccepted(identifier: String) async throws {
        try await supabaseService.updateNotificationAcceptance(
            identifier: identifier,
            accepted: true
        )
    }
    
    func markNotificationAsDeclined(identifier: String) async throws {
        try await supabaseService.updateNotificationAcceptance(
            identifier: identifier,
            accepted: false
        )
        
        await checkAdaptiveLogic(identifier: identifier)
    }
    
    func setBadgeCount(_ count: Int) {
        notificationService.setBadgeCount(count)
    }
    
    func clearBadge() {
        notificationService.clearBadge()
    }
    
    private func handleNotificationResponse(_ response: UNNotificationResponse) {
        let userInfo = response.notification.request.content.userInfo
        let identifier = response.notification.request.identifier
        
        Task {
            if response.actionIdentifier == UNNotificationDefaultActionIdentifier {
                try? await markNotificationAsAccepted(identifier: identifier)
                
                if let notificationType = userInfo["type"] as? String {
                    await handleNotificationAction(type: notificationType, userInfo: userInfo)
                }
            } else if response.actionIdentifier == UNNotificationDismissActionIdentifier {
                try? await markNotificationAsDeclined(identifier: identifier)
            }
        }
    }
    
    private func handleNotificationAction(type: String, userInfo: [AnyHashable: Any]) async {
        switch type {
        case "stress_detected", "calendar_based", "session_reminder":
            NotificationCenter.default.post(
                name: .startMeditationFromNotification,
                object: nil,
                userInfo: userInfo as? [String: Any]
            )
        case "achievement_unlocked":
            NotificationCenter.default.post(
                name: .showAchievementDetails,
                object: nil,
                userInfo: userInfo as? [String: Any]
            )
        case "streak_reminder":
            NotificationCenter.default.post(
                name: .showProgressScreen,
                object: nil
            )
        default:
            break
        }
    }
    
    private func checkAdaptiveLogic(identifier: String) async {
        do {
            let recentDeclines = try await supabaseService.getRecentDeclinedNotifications(limit: 3)
            
            if recentDeclines.count >= 3 {
                let allDeclined = recentDeclines.allSatisfy { !$0.accepted ?? false }
                
                if allDeclined {
                    try await supabaseService.updateUserNotificationFrequency(
                        reduceFor24Hours: true
                    )
                    
                    await cancelAllNotifications()
                    
                    Logger.shared.info("Adaptive logic triggered: reducing notification frequency for 24 hours")
                }
            }
        } catch {
            Logger.shared.error("Failed to check adaptive logic: \(error)")
        }
    }
    
    private func saveNotificationHistory(_ notification: NotificationModel) async throws {
        try await supabaseService.saveNotificationHistory(notification)
    }
    
    private func getCurrentUserId() async throws -> UUID {
        guard let userId = try await supabaseService.getCurrentUser()?.id else {
            throw NotificationError.userNotAuthenticated
        }
        return userId
    }
    
    private func calculateNextSessionDate(intervalHours: Int, lastSessionDate: Date?) -> Date {
        guard let lastSession = lastSessionDate else {
            return Date().addingTimeInterval(Double(intervalHours * 3600))
        }
        
        return lastSession.addingTimeInterval(Double(intervalHours * 3600))
    }
    
    private func getStressNotificationTitle(level: Int) -> String {
        switch level {
        case 8...10:
            return "Высокий уровень стресса обнаружен"
        case 5...7:
            return "Стресс повышается"
        default:
            return "Время для практики"
        }
    }
    
    private func getStressNotificationBody(level: Int, context: [String: Any]) -> String {
        var body = ""
        
        switch level {
        case 8...10:
            body = "Ваш пульс повышен. Медитация поможет успокоиться."
        case 5...7:
            body = "Обнаружены признаки стресса. Короткая практика?"
        default:
            body = "Регулярная практика помогает оставаться спокойным."
        }
        
        if let eventTitle = context["event_title"] as? String {
            body += " Перед событием '\(eventTitle)'."
        }
        
        return body
    }
}

enum NotificationError: LocalizedError {
    case userNotAuthenticated
    case authorizationDenied
    case schedulingFailed
    
    var errorDescription: String? {
        switch self {
        case .userNotAuthenticated:
            return "Пользователь не авторизован"
        case .authorizationDenied:
            return "Разрешение на уведомления отклонено"
        case .schedulingFailed:
            return "Не удалось запланировать уведомление"
        }
    }
}

extension Notification.Name {
    static let startMeditationFromNotification = Notification.Name("startMeditationFromNotification")
    static let showAchievementDetails = Notification.Name("showAchievementDetails")
    static let showProgressScreen = Notification.Name("showProgressScreen")
}

func useNotifications() -> NotificationsManager {
    return NotificationsManager()
}