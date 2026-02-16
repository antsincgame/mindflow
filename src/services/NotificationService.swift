import Foundation
import UserNotifications
import Combine
import UIKit

enum NotificationType: String, Codable {
    case stressDetected = "stress_detected"
    case sessionReminder = "session_reminder"
    case achievementUnlocked = "achievement_unlocked"
    case streakReminder = "streak_reminder"
    case beforeMeetingReminder = "before_meeting_reminder"
}

struct NotificationContext: Codable {
    let stressLevel: Int?
    let eventName: String?
    let eventTime: Date?
    let achievementId: String?
    let streakDays: Int?
    let sessionId: String?
}

struct NotificationPayload: Codable {
    let type: NotificationType
    let title: String
    let body: String
    let context: NotificationContext?
    let actionable: Bool
    let priority: UNNotificationInterruptionLevel
}

final class NotificationService: NSObject {
    static let shared = NotificationService()
    
    private let center = UNUserNotificationCenter.current()
    private let supabaseService = SupabaseService.shared
    
    private var deviceToken: String?
    private var authorizationStatus: UNAuthorizationStatus = .notDetermined
    private var rejectionCount: Int = 0
    private var lastRejectionDate: Date?
    private var isInReducedFrequencyMode: Bool = false
    
    private var cancellables = Set<AnyCancellable>()
    
    @Published private(set) var isAuthorized: Bool = false
    @Published private(set) var pendingNotifications: [UNNotificationRequest] = []
    
    private override init() {
        super.init()
        center.delegate = self
        loadRejectionData()
        checkAuthorizationStatus()
    }
    
    // MARK: - Authorization
    
    func requestAuthorization() async throws -> Bool {
        let options: UNAuthorizationOptions = [.alert, .sound, .badge, .criticalAlert, .provisional]
        
        do {
            let granted = try await center.requestAuthorization(options: options)
            await MainActor.run {
                self.isAuthorized = granted
                self.authorizationStatus = granted ? .authorized : .denied
            }
            
            if granted {
                await registerForRemoteNotifications()
            }
            
            return granted
        } catch {
            Logger.shared.error("Failed to request notification authorization: \(error)")
            throw error
        }
    }
    
    func checkAuthorizationStatus() {
        center.getNotificationSettings { [weak self] settings in
            DispatchQueue.main.async {
                self?.authorizationStatus = settings.authorizationStatus
                self?.isAuthorized = settings.authorizationStatus == .authorized
            }
        }
    }
    
    @MainActor
    private func registerForRemoteNotifications() async {
        UIApplication.shared.registerForRemoteNotifications()
    }
    
    func setDeviceToken(_ token: Data) {
        let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
        self.deviceToken = tokenString
        
        Task {
            await uploadDeviceTokenToSupabase(tokenString)
        }
    }
    
    private func uploadDeviceTokenToSupabase(_ token: String) async {
        guard let userId = try? await supabaseService.getCurrentUserId() else {
            Logger.shared.error("Cannot upload device token: user not authenticated")
            return
        }
        
        do {
            try await supabaseService.client
                .from("user_devices")
                .upsert([
                    "user_id": userId,
                    "device_token": token,
                    "platform": "ios",
                    "updated_at": ISO8601DateFormatter().string(from: Date())
                ])
                .execute()
            
            Logger.shared.info("Device token uploaded successfully")
        } catch {
            Logger.shared.error("Failed to upload device token: \(error)")
        }
    }
    
    // MARK: - Local Notifications
    
    func scheduleStressDetectedNotification(stressLevel: Int, context: NotificationContext?) async throws {
        guard isAuthorized else {
            Logger.shared.warning("Cannot schedule notification: not authorized")
            return
        }
        
        if isInReducedFrequencyMode {
            Logger.shared.info("Skipping notification: in reduced frequency mode")
            return
        }
        
        let payload = NotificationPayload(
            type: .stressDetected,
            title: getStressTitle(for: stressLevel),
            body: getStressBody(for: stressLevel, context: context),
            context: context,
            actionable: true,
            priority: stressLevel >= 8 ? .critical : .timeSensitive
        )
        
        try await scheduleNotification(payload: payload, delay: 0)
        await logNotification(payload: payload)
    }
    
    func scheduleSessionReminder(interval: TimeInterval, context: NotificationContext?) async throws {
        guard isAuthorized else { return }
        guard !isInReducedFrequencyMode else { return }
        
        let payload = NotificationPayload(
            type: .sessionReminder,
            title: "Время для медитации",
            body: "Пора уделить несколько минут себе",
            context: context,
            actionable: true,
            priority: .active
        )
        
        try await scheduleNotification(payload: payload, delay: interval)
    }
    
    func scheduleBeforeMeetingNotification(eventName: String, eventTime: Date, stressLevel: Int?) async throws {
        guard isAuthorized else { return }
        
        let minutesBefore: TimeInterval = 15 * 60
        let notificationTime = eventTime.addingTimeInterval(-minutesBefore)
        
        guard notificationTime > Date() else {
            Logger.shared.info("Event too soon, skipping notification")
            return
        }
        
        let context = NotificationContext(
            stressLevel: stressLevel,
            eventName: eventName,
            eventTime: eventTime,
            achievementId: nil,
            streakDays: nil,
            sessionId: nil
        )
        
        let payload = NotificationPayload(
            type: .beforeMeetingReminder,
            title: "Встреча через 15 минут",
            body: "Медитация поможет подготовиться к '\(eventName)'",
            context: context,
            actionable: true,
            priority: .timeSensitive
        )
        
        let delay = notificationTime.timeIntervalSinceNow
        try await scheduleNotification(payload: payload, delay: delay)
    }
    
    func scheduleAchievementNotification(achievementName: String, achievementId: String) async throws {
        guard isAuthorized else { return }
        
        let context = NotificationContext(
            stressLevel: nil,
            eventName: nil,
            eventTime: nil,
            achievementId: achievementId,
            streakDays: nil,
            sessionId: nil
        )
        
        let payload = NotificationPayload(
            type: .achievementUnlocked,
            title: "🎉 Новое достижение!",
            body: achievementName,
            context: context,
            actionable: false,
            priority: .active
        )
        
        try await scheduleNotification(payload: payload, delay: 1)
    }
    
    func scheduleStreakReminder(streakDays: Int) async throws {
        guard isAuthorized else { return }
        guard !isInReducedFrequencyMode else { return }
        
        let context = NotificationContext(
            stressLevel: nil,
            eventName: nil,
            eventTime: nil,
            achievementId: nil,
            streakDays: streakDays,
            sessionId: nil
        )
        
        let payload = NotificationPayload(
            type: .streakReminder,
            title: "Не прерывайте серию!",
            body: "У вас \(streakDays) дней подряд. Медитируйте сегодня, чтобы продолжить.",
            context: context,
            actionable: true,
            priority: .active
        )
        
        let calendar = Calendar.current
        var components = DateComponents()
        components.hour = 20
        components.minute = 0
        
        let trigger = UNCalendarNotificationTrigger(dateMatching: components, repeats: false)
        
        try await scheduleNotification(payload: payload, trigger: trigger)
    }
    
    private func scheduleNotification(payload: NotificationPayload, delay: TimeInterval) async throws {
        let trigger = UNTimeIntervalNotificationTrigger(timeInterval: max(delay, 1), repeats: false)
        try await scheduleNotification(payload: payload, trigger: trigger)
    }
    
    private func scheduleNotification(payload: NotificationPayload, trigger: UNNotificationTrigger) async throws {
        let content = UNMutableNotificationContent()
        content.title = payload.title
        content.body = payload.body
        content.sound = .default
        content.interruptionLevel = payload.priority
        
        if payload.actionable {
            content.categoryIdentifier = "MEDITATION_ACTION"
        }
        
        if let context = payload.context,
           let contextData = try? JSONEncoder().encode(context) {
            content.userInfo = [
                "type": payload.type.rawValue,
                "context": String(data: contextData, encoding: .utf8) ?? "{}"
            ]
        } else {
            content.userInfo = ["type": payload.type.rawValue]
        }
        
        let identifier = UUID().uuidString
        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        
        try await center.add(request)
        Logger.shared.info("Notification scheduled: \(payload.type.rawValue)")
        
        await updatePendingNotifications()
    }
    
    // MARK: - Notification Actions
    
    func setupNotificationCategories() {
        let startAction = UNNotificationAction(
            identifier: "START_MEDITATION",
            title: "Начать медитацию",
            options: [.foreground]
        )
        
        let dismissAction = UNNotificationAction(
            identifier: "DISMISS",
            title: "Не сейчас",
            options: []
        )
        
        let meditationCategory = UNNotificationCategory(
            identifier: "MEDITATION_ACTION",
            actions: [startAction, dismissAction],
            intentIdentifiers: [],
            options: [.customDismissAction]
        )
        
        center.setNotificationCategories([meditationCategory])
    }
    
    // MARK: - Badge Management
    
    func updateBadge(count: Int) {
        DispatchQueue.main.async {
            UIApplication.shared.applicationIconBadgeNumber = count
        }
    }
    
    func clearBadge() {
        updateBadge(count: 0)
    }
    
    // MARK: - Notification Management
    
    func cancelAllNotifications() async {
        center.removeAllPendingNotificationRequests()
        center.removeAllDeliveredNotifications()
        clearBadge()
        await updatePendingNotifications()
    }
    
    func cancelNotifications(ofType type: NotificationType) async {
        let pending = await center.pendingNotificationRequests()
        let identifiers = pending.filter { request in
            guard let typeString = request.content.userInfo["type"] as? String else { return false }
            return typeString == type.rawValue
        }.map { $0.identifier }
        
        center.removePendingNotificationRequests(withIdentifiers: identifiers)
        await updatePendingNotifications()
    }
    
    private func updatePendingNotifications() async {
        let pending = await center.pendingNotificationRequests()
        await MainActor.run {
            self.pendingNotifications = pending
        }
    }
    
    // MARK: - Rejection Tracking
    
    func trackNotificationRejection() {
        rejectionCount += 1
        lastRejectionDate = Date()
        saveRejectionData()
        
        if rejectionCount >= 3 {
            enableReducedFrequencyMode()
        }
    }
    
    func trackNotificationAcceptance() {
        rejectionCount = 0
        lastRejectionDate = nil
        isInReducedFrequencyMode = false
        saveRejectionData()
    }
    
    private func enableReducedFrequencyMode() {
        isInReducedFrequencyMode = true
        Logger.shared.info("Enabled reduced frequency mode for 24 hours")
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 24 * 60 * 60) { [weak self] in
            self?.isInReducedFrequencyMode = false
            self?.rejectionCount = 0
            self?.saveRejectionData()
            Logger.shared.info("Reduced frequency mode disabled")
        }
    }
    
    private func saveRejectionData() {
        UserDefaults.standard.set(rejectionCount, forKey: "notification_rejection_count")
        UserDefaults.standard.set(lastRejectionDate, forKey: "notification_last_rejection_date")
        UserDefaults.standard.set(isInReducedFrequencyMode, forKey: "notification_reduced_frequency")
    }
    
    private func loadRejectionData() {
        rejectionCount = UserDefaults.standard.integer(forKey: "notification_rejection_count")
        lastRejectionDate = UserDefaults.standard.object(forKey: "notification_last_rejection_date") as? Date
        isInReducedFrequencyMode = UserDefaults.standard.bool(forKey: "notification_reduced_frequency")
        
        if let lastRejection = lastRejectionDate,
           Date().timeIntervalSince(lastRejection) > 24 * 60 * 60 {
            rejectionCount = 0
            isInReducedFrequencyMode = false
            saveRejectionData()
        }
    }
    
    // MARK: - Logging
    
    private func logNotification(payload: NotificationPayload) async {
        guard let userId = try? await supabaseService.getCurrentUserId() else { return }
        
        var contextDict: [String: Any] = [:]
        if let context = payload.context {
            if let stressLevel = context.stressLevel {
                contextDict["stress_level"] = stressLevel
            }
            if let eventName = context.eventName {
                contextDict["event_name"] = eventName
            }
            if let eventTime = context.eventTime {
                contextDict["event_time"] = ISO8601DateFormatter().string(from: eventTime)
            }
            if let achievementId = context.achievementId {
                contextDict["achievement_id"] = achievementId
            }
            if let streakDays = context.streakDays {
                contextDict["streak_days"] = streakDays
            }
        }
        
        do {
            try await supabaseService.client
                .from("notification_history")
                .insert([
                    "user_id": userId,
                    "type": payload.type.rawValue,
                    "accepted": false,
                    "context": contextDict,
                    "sent_at": ISO8601DateFormatter().string(from: Date())
                ])
                .execute()
        } catch {
            Logger.shared.error("Failed to log notification: \(error)")
        }
    }
    
    func updateNotificationAcceptance(type: NotificationType, accepted: Bool) async {
        guard let userId = try? await supabaseService.getCurrentUserId() else { return }
        
        do {
            try await supabaseService.client
                .from("notification_history")
                .update(["accepted": accepted])
                .eq("user