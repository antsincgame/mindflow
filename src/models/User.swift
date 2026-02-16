import Foundation

struct User: Codable, Identifiable, Equatable {
    let id: UUID
    let email: String
    var selectedVoiceId: UUID?
    var sessionIntervalHours: Int
    var notificationEnabled: Bool
    let createdAt: Date
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case email
        case selectedVoiceId = "selected_voice_id"
        case sessionIntervalHours = "session_interval_hours"
        case notificationEnabled = "notification_enabled"
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
    
    init(
        id: UUID = UUID(),
        email: String,
        selectedVoiceId: UUID? = nil,
        sessionIntervalHours: Int = 4,
        notificationEnabled: Bool = true,
        createdAt: Date = Date(),
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.email = email
        self.selectedVoiceId = selectedVoiceId
        self.sessionIntervalHours = sessionIntervalHours
        self.notificationEnabled = notificationEnabled
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decode(UUID.self, forKey: .id)
        email = try container.decode(String.self, forKey: .email)
        selectedVoiceId = try container.decodeIfPresent(UUID.self, forKey: .selectedVoiceId)
        sessionIntervalHours = try container.decode(Int.self, forKey: .sessionIntervalHours)
        notificationEnabled = try container.decode(Bool.self, forKey: .notificationEnabled)
        
        let createdAtString = try container.decode(String.self, forKey: .createdAt)
        let updatedAtString = try container.decode(String.self, forKey: .updatedAt)
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        guard let createdDate = formatter.date(from: createdAtString) else {
            throw DecodingError.dataCorruptedError(
                forKey: .createdAt,
                in: container,
                debugDescription: "Invalid date format for created_at"
            )
        }
        
        guard let updatedDate = formatter.date(from: updatedAtString) else {
            throw DecodingError.dataCorruptedError(
                forKey: .updatedAt,
                in: container,
                debugDescription: "Invalid date format for updated_at"
            )
        }
        
        createdAt = createdDate
        updatedAt = updatedDate
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(id, forKey: .id)
        try container.encode(email, forKey: .email)
        try container.encodeIfPresent(selectedVoiceId, forKey: .selectedVoiceId)
        try container.encode(sessionIntervalHours, forKey: .sessionIntervalHours)
        try container.encode(notificationEnabled, forKey: .notificationEnabled)
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        
        try container.encode(formatter.string(from: createdAt), forKey: .createdAt)
        try container.encode(formatter.string(from: updatedAt), forKey: .updatedAt)
    }
    
    var isSessionIntervalValid: Bool {
        sessionIntervalHours >= 1 && sessionIntervalHours <= 8
    }
    
    var hasSelectedVoice: Bool {
        selectedVoiceId != nil
    }
    
    mutating func updateSessionInterval(_ hours: Int) {
        guard hours >= 1 && hours <= 8 else { return }
        sessionIntervalHours = hours
        updatedAt = Date()
    }
    
    mutating func updateNotificationEnabled(_ enabled: Bool) {
        notificationEnabled = enabled
        updatedAt = Date()
    }
    
    mutating func updateSelectedVoice(_ voiceId: UUID?) {
        selectedVoiceId = voiceId
        updatedAt = Date()
    }
    
    static func == (lhs: User, rhs: User) -> Bool {
        lhs.id == rhs.id &&
        lhs.email == rhs.email &&
        lhs.selectedVoiceId == rhs.selectedVoiceId &&
        lhs.sessionIntervalHours == rhs.sessionIntervalHours &&
        lhs.notificationEnabled == rhs.notificationEnabled
    }
}

extension User {
    static var preview: User {
        User(
            id: UUID(),
            email: "user@example.com",
            selectedVoiceId: UUID(),
            sessionIntervalHours: 4,
            notificationEnabled: true,
            createdAt: Date().addingTimeInterval(-86400 * 30),
            updatedAt: Date()
        )
    }
    
    static var previewWithoutVoice: User {
        User(
            id: UUID(),
            email: "newuser@example.com",
            selectedVoiceId: nil,
            sessionIntervalHours: 4,
            notificationEnabled: true,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

struct UserProfile: Codable, Equatable {
    let user: User
    var selectedVoice: Voice?
    var totalSessions: Int
    var totalMinutes: Int
    var currentStreak: Int
    var longestStreak: Int
    
    init(
        user: User,
        selectedVoice: Voice? = nil,
        totalSessions: Int = 0,
        totalMinutes: Int = 0,
        currentStreak: Int = 0,
        longestStreak: Int = 0
    ) {
        self.user = user
        self.selectedVoice = selectedVoice
        self.totalSessions = totalSessions
        self.totalMinutes = totalMinutes
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
    }
    
    var hasCompletedOnboarding: Bool {
        user.hasSelectedVoice
    }
    
    var averageSessionDuration: Double {
        guard totalSessions > 0 else { return 0 }
        return Double(totalMinutes) / Double(totalSessions)
    }
    
    var isActiveUser: Bool {
        currentStreak > 0
    }
}

struct UserSettings: Codable, Equatable {
    var sessionIntervalHours: Int
    var notificationEnabled: Bool
    var selectedVoiceId: UUID?
    var healthKitEnabled: Bool
    var calendarEnabled: Bool
    var microphoneEnabled: Bool
    
    init(
        sessionIntervalHours: Int = 4,
        notificationEnabled: Bool = true,
        selectedVoiceId: UUID? = nil,
        healthKitEnabled: Bool = false,
        calendarEnabled: Bool = false,
        microphoneEnabled: Bool = false
    ) {
        self.sessionIntervalHours = sessionIntervalHours
        self.notificationEnabled = notificationEnabled
        self.selectedVoiceId = selectedVoiceId
        self.healthKitEnabled = healthKitEnabled
        self.calendarEnabled = calendarEnabled
        self.microphoneEnabled = microphoneEnabled
    }
    
    init(from user: User) {
        self.sessionIntervalHours = user.sessionIntervalHours
        self.notificationEnabled = user.notificationEnabled
        self.selectedVoiceId = user.selectedVoiceId
        self.healthKitEnabled = false
        self.calendarEnabled = false
        self.microphoneEnabled = false
    }
    
    var hasAllPermissions: Bool {
        healthKitEnabled && calendarEnabled && notificationEnabled
    }
    
    var hasMinimalPermissions: Bool {
        calendarEnabled && notificationEnabled
    }
}