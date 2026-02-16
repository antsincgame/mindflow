import Foundation

struct Achievement: Identifiable, Codable, Equatable, Hashable {
    let id: UUID
    let name: String
    let description: String
    let iconUrl: String
    let unlockCondition: UnlockCondition
    let createdAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case iconUrl = "icon_url"
        case unlockCondition = "unlock_condition"
        case createdAt = "created_at"
    }
    
    init(
        id: UUID = UUID(),
        name: String,
        description: String,
        iconUrl: String,
        unlockCondition: UnlockCondition,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.iconUrl = iconUrl
        self.unlockCondition = unlockCondition
        self.createdAt = createdAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decode(String.self, forKey: .description)
        iconUrl = try container.decode(String.self, forKey: .iconUrl)
        unlockCondition = try container.decode(UnlockCondition.self, forKey: .unlockCondition)
        
        let timestamp = try container.decode(String.self, forKey: .createdAt)
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        createdAt = formatter.date(from: timestamp) ?? Date()
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(description, forKey: .description)
        try container.encode(iconUrl, forKey: .iconUrl)
        try container.encode(unlockCondition, forKey: .unlockCondition)
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        try container.encode(formatter.string(from: createdAt), forKey: .createdAt)
    }
}

struct UnlockCondition: Codable, Equatable, Hashable {
    let type: ConditionType
    let value: Int
    let metadata: [String: String]?
    
    enum ConditionType: String, Codable {
        case totalSessions = "total_sessions"
        case totalMinutes = "total_minutes"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case sessionsBeforeMeetings = "sessions_before_meetings"
        case averageStressReduction = "average_stress_reduction"
        case consecutiveDays = "consecutive_days"
        case sessionsInWeek = "sessions_in_week"
        case perfectWeek = "perfect_week"
        case earlyBird = "early_bird"
        case nightOwl = "night_owl"
        case weekendWarrior = "weekend_warrior"
        case stressReductionMilestone = "stress_reduction_milestone"
        case firstSession = "first_session"
        case sessionRating = "session_rating"
        case exerciseType = "exercise_type"
    }
    
    init(type: ConditionType, value: Int, metadata: [String: String]? = nil) {
        self.type = type
        self.value = value
        self.metadata = metadata
    }
}

extension Achievement {
    var iconName: String {
        if iconUrl.hasPrefix("http") {
            return "star.fill"
        }
        return iconUrl
    }
    
    var category: AchievementCategory {
        switch unlockCondition.type {
        case .totalSessions, .totalMinutes:
            return .consistency
        case .currentStreak, .longestStreak, .consecutiveDays, .perfectWeek:
            return .streak
        case .sessionsBeforeMeetings:
            return .preparation
        case .averageStressReduction, .stressReductionMilestone:
            return .effectiveness
        case .earlyBird, .nightOwl, .weekendWarrior:
            return .timing
        case .firstSession, .sessionRating, .exerciseType, .sessionsInWeek:
            return .milestone
        }
    }
    
    var progress: Double {
        return 0.0
    }
    
    func isUnlocked(with progress: Progress) -> Bool {
        switch unlockCondition.type {
        case .totalSessions:
            return progress.totalSessions >= unlockCondition.value
        case .totalMinutes:
            return progress.totalMinutes >= unlockCondition.value
        case .currentStreak:
            return progress.currentStreak >= unlockCondition.value
        case .longestStreak:
            return progress.longestStreak >= unlockCondition.value
        case .sessionsBeforeMeetings:
            return progress.sessionsBeforeMeetings >= unlockCondition.value
        case .averageStressReduction:
            return Int(progress.stressReductionAvg) >= unlockCondition.value
        default:
            return false
        }
    }
    
    func calculateProgress(with progress: Progress) -> Double {
        let current: Double
        let target = Double(unlockCondition.value)
        
        switch unlockCondition.type {
        case .totalSessions:
            current = Double(progress.totalSessions)
        case .totalMinutes:
            current = Double(progress.totalMinutes)
        case .currentStreak:
            current = Double(progress.currentStreak)
        case .longestStreak:
            current = Double(progress.longestStreak)
        case .sessionsBeforeMeetings:
            current = Double(progress.sessionsBeforeMeetings)
        case .averageStressReduction:
            current = progress.stressReductionAvg
        default:
            current = 0
        }
        
        return min(current / target, 1.0)
    }
}

enum AchievementCategory: String, Codable {
    case consistency = "Consistency"
    case streak = "Streak"
    case preparation = "Preparation"
    case effectiveness = "Effectiveness"
    case timing = "Timing"
    case milestone = "Milestone"
    
    var icon: String {
        switch self {
        case .consistency:
            return "calendar.badge.checkmark"
        case .streak:
            return "flame.fill"
        case .preparation:
            return "briefcase.fill"
        case .effectiveness:
            return "chart.line.uptrend.xyaxis"
        case .timing:
            return "clock.fill"
        case .milestone:
            return "flag.fill"
        }
    }
    
    var color: String {
        switch self {
        case .consistency:
            return "blue"
        case .streak:
            return "orange"
        case .preparation:
            return "purple"
        case .effectiveness:
            return "green"
        case .timing:
            return "indigo"
        case .milestone:
            return "pink"
        }
    }
}

struct UserAchievement: Identifiable, Codable, Equatable {
    let id: UUID
    let userId: UUID
    let achievementId: UUID
    let unlockedAt: Date
    var achievement: Achievement?
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case achievementId = "achievement_id"
        case unlockedAt = "unlocked_at"
        case achievement
    }
    
    init(
        id: UUID = UUID(),
        userId: UUID,
        achievementId: UUID,
        unlockedAt: Date = Date(),
        achievement: Achievement? = nil
    ) {
        self.id = id
        self.userId = userId
        self.achievementId = achievementId
        self.unlockedAt = unlockedAt
        self.achievement = achievement
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        userId = try container.decode(UUID.self, forKey: .userId)
        achievementId = try container.decode(UUID.self, forKey: .achievementId)
        
        let timestamp = try container.decode(String.self, forKey: .unlockedAt)
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        unlockedAt = formatter.date(from: timestamp) ?? Date()
        
        achievement = try container.decodeIfPresent(Achievement.self, forKey: .achievement)
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(userId, forKey: .userId)
        try container.encode(achievementId, forKey: .achievementId)
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        try container.encode(formatter.string(from: unlockedAt), forKey: .unlockedAt)
        
        try container.encodeIfPresent(achievement, forKey: .achievement)
    }
}

extension Achievement {
    static let predefinedAchievements: [Achievement] = [
        Achievement(
            name: "First Step",
            description: "Complete your first meditation session",
            iconUrl: "star.circle.fill",
            unlockCondition: UnlockCondition(type: .firstSession, value: 1)
        ),
        Achievement(
            name: "Week Warrior",
            description: "Meditate for 7 days in a row",
            iconUrl: "flame.fill",
            unlockCondition: UnlockCondition(type: .currentStreak, value: 7)
        ),
        Achievement(
            name: "Month Master",
            description: "Meditate for 30 days in a row",
            iconUrl: "crown.fill",
            unlockCondition: UnlockCondition(type: .currentStreak, value: 30)
        ),
        Achievement(
            name: "Zen Apprentice",
            description: "Complete 10 meditation sessions",
            iconUrl: "leaf.fill",
            unlockCondition: UnlockCondition(type: .totalSessions, value: 10)
        ),
        Achievement(
            name: "Mindful Master",
            description: "Complete 50 meditation sessions",
            iconUrl: "sparkles",
            unlockCondition: UnlockCondition(type: .totalSessions, value: 50)
        ),
        Achievement(
            name: "Meditation Guru",
            description: "Complete 100 meditation sessions",
            iconUrl: "figure.mind.and.body",
            unlockCondition: UnlockCondition(type: .totalSessions, value: 100)
        ),
        Achievement(
            name: "Hour of Peace",
            description: "Meditate for 60 minutes total",
            iconUrl: "clock.fill",
            unlockCondition: UnlockCondition(type: .totalMinutes, value: 60)
        ),
        Achievement(
            name: "Day of Calm",
            description: "Meditate for 24 hours total",
            iconUrl: "moon.stars.fill",
            unlockCondition: UnlockCondition(type: .totalMinutes, value: 1440)
        ),
        Achievement(
            name: "Meeting Prep Pro",
            description: "Meditate before 5 meetings",
            iconUrl: "briefcase.fill",
            unlockCondition: UnlockCondition(type: .sessionsBeforeMeetings, value: 5)
        ),
        Achievement(
            name: "Calm Commander",
            description: "Meditate before 20 meetings",
            iconUrl: "person.crop.circle.badge.checkmark",
            unlockCondition: UnlockCondition(type: .sessionsBeforeMeetings, value: 20)
        ),
        Achievement(
            name: "Stress Buster",
            description: "Reduce stress by 30% on average",
            iconUrl: "heart.fill",
            unlockCondition: UnlockCondition(type: .averageStressReduction, value: 30)
        ),
        Achievement(
            name: "Zen Master",
            description: "Reduce stress by 50% on average",
            iconUrl: "hands.sparkles.fill",
            unlockCondition: UnlockCondition(type: .averageStressReduction, value: 50)
        ),
        Achievement(
            name: "Early Bird",
            description: "Complete 10 morning sessions (before 10 AM)",
            iconUrl: "sunrise.fill",
            unlockCondition: UnlockCondition(type: .earlyBird, value: 10)
        ),
        Achievement(
            name: "Night Owl",
            description: "Complete 10 evening sessions (after 8 PM)",
            iconUrl: "moon.fill",
            unlockCondition: UnlockCondition(type: .nightOwl, value: 10)
        ),
        Achievement(
            name: "Weekend Warrior",
            description: "Complete 10 weekend sessions",
            iconUrl: "sun.max.fill",
            unlockCondition: UnlockCondition(type: .weekendWarrior, value: 10)
        ),
        Achievement(
            name: "Perfect Week",
            description: "Meditate every day for a week",
            iconUrl: "star.square.fill",
            unlockCondition: UnlockCondition(type: .perfectWeek, value: 1)
        )
    ]
}