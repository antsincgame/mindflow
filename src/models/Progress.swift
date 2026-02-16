import Foundation

struct Progress: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    var totalSessions: Int
    var totalMinutes: Int
    var currentStreak: Int
    var longestStreak: Int
    var sessionsBeforeMeetings: Int
    var stressReductionAvg: Double
    var updatedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case totalSessions = "total_sessions"
        case totalMinutes = "total_minutes"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case sessionsBeforeMeetings = "sessions_before_meetings"
        case stressReductionAvg = "stress_reduction_avg"
        case updatedAt = "updated_at"
    }
    
    init(
        id: UUID = UUID(),
        userId: UUID,
        totalSessions: Int = 0,
        totalMinutes: Int = 0,
        currentStreak: Int = 0,
        longestStreak: Int = 0,
        sessionsBeforeMeetings: Int = 0,
        stressReductionAvg: Double = 0.0,
        updatedAt: Date = Date()
    ) {
        self.id = id
        self.userId = userId
        self.totalSessions = totalSessions
        self.totalMinutes = totalMinutes
        self.currentStreak = currentStreak
        self.longestStreak = longestStreak
        self.sessionsBeforeMeetings = sessionsBeforeMeetings
        self.stressReductionAvg = stressReductionAvg
        self.updatedAt = updatedAt
    }
    
    var totalHours: Int {
        totalMinutes / 60
    }
    
    var remainingMinutes: Int {
        totalMinutes % 60
    }
    
    var formattedTotalTime: String {
        if totalHours > 0 {
            return "\(totalHours)ч \(remainingMinutes)мин"
        } else {
            return "\(totalMinutes)мин"
        }
    }
    
    var averageSessionDuration: Int {
        guard totalSessions > 0 else { return 0 }
        return totalMinutes / totalSessions
    }
    
    var streakPercentage: Double {
        guard longestStreak > 0 else { return 0 }
        return Double(currentStreak) / Double(longestStreak) * 100
    }
    
    var isStreakActive: Bool {
        currentStreak > 0
    }
    
    var nextStreakMilestone: Int {
        let milestones = [7, 14, 30, 60, 90, 180, 365]
        return milestones.first { $0 > currentStreak } ?? currentStreak + 30
    }
    
    var daysUntilNextMilestone: Int {
        nextStreakMilestone - currentStreak
    }
    
    var formattedStressReduction: String {
        String(format: "%.0f%%", stressReductionAvg)
    }
    
    var meetingPreparationRate: Double {
        guard totalSessions > 0 else { return 0 }
        return Double(sessionsBeforeMeetings) / Double(totalSessions) * 100
    }
    
    var formattedMeetingPreparationRate: String {
        String(format: "%.0f%%", meetingPreparationRate)
    }
    
    mutating func incrementSession(duration: Int, stressReduction: Double, beforeMeeting: Bool = false) {
        totalSessions += 1
        totalMinutes += duration
        
        if beforeMeeting {
            sessionsBeforeMeetings += 1
        }
        
        let newAverage = ((stressReductionAvg * Double(totalSessions - 1)) + stressReduction) / Double(totalSessions)
        stressReductionAvg = newAverage
        
        updatedAt = Date()
    }
    
    mutating func updateStreak(isConsecutiveDay: Bool) {
        if isConsecutiveDay {
            currentStreak += 1
            if currentStreak > longestStreak {
                longestStreak = currentStreak
            }
        } else {
            currentStreak = 1
        }
        updatedAt = Date()
    }
    
    mutating func resetStreak() {
        currentStreak = 0
        updatedAt = Date()
    }
    
    func getProgressLevel() -> ProgressLevel {
        switch totalSessions {
        case 0..<5:
            return .beginner
        case 5..<20:
            return .intermediate
        case 20..<50:
            return .advanced
        case 50..<100:
            return .expert
        default:
            return .master
        }
    }
    
    func getStreakBadge() -> StreakBadge {
        switch currentStreak {
        case 0:
            return .none
        case 1..<7:
            return .starter
        case 7..<14:
            return .week
        case 14..<30:
            return .twoWeeks
        case 30..<60:
            return .month
        case 60..<90:
            return .twoMonths
        case 90..<180:
            return .threeMonths
        case 180..<365:
            return .halfYear
        default:
            return .year
        }
    }
    
    func getSessionMilestones() -> [SessionMilestone] {
        let milestones: [SessionMilestone] = [
            .init(count: 5, title: "Первые шаги", description: "Завершено 5 сессий"),
            .init(count: 10, title: "Формирование привычки", description: "Завершено 10 сессий"),
            .init(count: 20, title: "Постоянство", description: "Завершено 20 сессий"),
            .init(count: 50, title: "Мастер медитации", description: "Завершено 50 сессий"),
            .init(count: 100, title: "Эксперт осознанности", description: "Завершено 100 сессий"),
            .init(count: 200, title: "Легенда спокойствия", description: "Завершено 200 сессий")
        ]
        
        return milestones.filter { $0.count <= totalSessions }
    }
    
    func getNextMilestone() -> SessionMilestone? {
        let milestones: [SessionMilestone] = [
            .init(count: 5, title: "Первые шаги", description: "Завершено 5 сессий"),
            .init(count: 10, title: "Формирование привычки", description: "Завершено 10 сессий"),
            .init(count: 20, title: "Постоянство", description: "Завершено 20 сессий"),
            .init(count: 50, title: "Мастер медитации", description: "Завершено 50 сессий"),
            .init(count: 100, title: "Эксперт осознанности", description: "Завершено 100 сессий"),
            .init(count: 200, title: "Легенда спокойствия", description: "Завершено 200 сессий")
        ]
        
        return milestones.first { $0.count > totalSessions }
    }
    
    func getProgressToNextMilestone() -> Double {
        guard let nextMilestone = getNextMilestone() else { return 1.0 }
        
        let previousMilestoneCount = getSessionMilestones().last?.count ?? 0
        let range = nextMilestone.count - previousMilestoneCount
        let progress = totalSessions - previousMilestoneCount
        
        return Double(progress) / Double(range)
    }
}

enum ProgressLevel: String, Codable {
    case beginner = "Новичок"
    case intermediate = "Практикующий"
    case advanced = "Продвинутый"
    case expert = "Эксперт"
    case master = "Мастер"
    
    var icon: String {
        switch self {
        case .beginner: return "🌱"
        case .intermediate: return "🌿"
        case .advanced: return "🌳"
        case .expert: return "🏆"
        case .master: return "👑"
        }
    }
    
    var description: String {
        switch self {
        case .beginner: return "Начало пути к осознанности"
        case .intermediate: return "Формирование привычки медитации"
        case .advanced: return "Регулярная практика медитации"
        case .expert: return "Глубокое понимание медитации"
        case .master: return "Мастерство в искусстве медитации"
        }
    }
}

enum StreakBadge: String, Codable {
    case none = "Нет стрика"
    case starter = "Старт"
    case week = "Неделя"
    case twoWeeks = "2 недели"
    case month = "Месяц"
    case twoMonths = "2 месяца"
    case threeMonths = "3 месяца"
    case halfYear = "Полгода"
    case year = "Год"
    
    var icon: String {
        switch self {
        case .none: return "⭕️"
        case .starter: return "🔥"
        case .week: return "🌟"
        case .twoWeeks: return "✨"
        case .month: return "💫"
        case .twoMonths: return "🌠"
        case .threeMonths: return "⚡️"
        case .halfYear: return "🏅"
        case .year: return "🏆"
        }
    }
    
    var color: String {
        switch self {
        case .none: return "gray"
        case .starter: return "orange"
        case .week: return "yellow"
        case .twoWeeks: return "green"
        case .month: return "blue"
        case .twoMonths: return "purple"
        case .threeMonths: return "pink"
        case .halfYear: return "gold"
        case .year: return "platinum"
        }
    }
}

struct SessionMilestone: Identifiable {
    let id = UUID()
    let count: Int
    let title: String
    let description: String
    
    var icon: String {
        switch count {
        case 5: return "🎯"
        case 10: return "🌟"
        case 20: return "💪"
        case 50: return "🏅"
        case 100: return "👑"
        case 200: return "🏆"
        default: return "✨"
        }
    }
}

struct ProgressStats: Codable {
    let totalSessions: Int
    let totalMinutes: Int
    let currentStreak: Int
    let longestStreak: Int
    let averageStressReduction: Double
    let sessionsThisWeek: Int
    let sessionsThisMonth: Int
    let mostProductiveTime: String
    let favoriteExerciseType: String
    
    enum CodingKeys: String, CodingKey {
        case totalSessions = "total_sessions"
        case totalMinutes = "total_minutes"
        case currentStreak = "current_streak"
        case longestStreak = "longest_streak"
        case averageStressReduction = "average_stress_reduction"
        case sessionsThisWeek = "sessions_this_week"
        case sessionsThisMonth = "sessions_this_month"
        case mostProductiveTime = "most_productive_time"
        case favoriteExerciseType = "favorite_exercise_type"
    }
}

struct ProgressHistory: Codable, Identifiable {
    let id: UUID
    let userId: UUID
    let date: Date
    let sessionsCount: Int
    let totalMinutes: Int
    let averageStressReduction: Double
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case date
        case sessionsCount = "sessions_count"
        case totalMinutes = "total_minutes"
        case averageStressReduction = "average_stress_reduction"
    }
}