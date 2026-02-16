import Foundation
import Combine
import Supabase

enum AchievementType: String, Codable {
    case firstSession = "first_session"
    case streak3Days = "streak_3_days"
    case streak7Days = "streak_7_days"
    case streak30Days = "streak_30_days"
    case sessions10 = "sessions_10"
    case sessions50 = "sessions_50"
    case sessions100 = "sessions_100"
    case totalMinutes60 = "total_minutes_60"
    case totalMinutes300 = "total_minutes_300"
    case totalMinutes1000 = "total_minutes_1000"
    case beforeMeetings5 = "before_meetings_5"
    case beforeMeetings20 = "before_meetings_20"
    case beforeMeetings50 = "before_meetings_50"
    case stressReduction20 = "stress_reduction_20"
    case stressReduction40 = "stress_reduction_40"
    case perfectWeek = "perfect_week"
    case earlyBird = "early_bird"
    case nightOwl = "night_owl"
}

struct AchievementProgress {
    let achievement: Achievement
    let currentValue: Int
    let targetValue: Int
    let isUnlocked: Bool
    let unlockedAt: Date?
    
    var progress: Double {
        return min(Double(currentValue) / Double(targetValue), 1.0)
    }
    
    var progressPercentage: Int {
        return Int(progress * 100)
    }
}

struct StreakInfo {
    let currentStreak: Int
    let longestStreak: Int
    let lastSessionDate: Date?
    let isActive: Bool
}

class AchievementService: ObservableObject {
    @Published var unlockedAchievements: [Achievement] = []
    @Published var allAchievements: [Achievement] = []
    @Published var achievementProgress: [AchievementProgress] = []
    @Published var streakInfo: StreakInfo?
    @Published var recentlyUnlocked: Achievement?
    
    private let supabase: SupabaseClient
    private var cancellables = Set<AnyCancellable>()
    private let userId: UUID
    
    init(supabase: SupabaseClient, userId: UUID) {
        self.supabase = supabase
        self.userId = userId
    }
    
    // MARK: - Load Achievements
    
    func loadAchievements() async throws {
        // Load all achievements
        let achievementsResponse: [Achievement] = try await supabase
            .from("achievements")
            .select()
            .order("created_at", ascending: true)
            .execute()
            .value
        
        // Load user's unlocked achievements
        let userAchievementsResponse: [UserAchievement] = try await supabase
            .from("user_achievements")
            .select("""
                *,
                achievement:achievements(*)
            """)
            .eq("user_id", value: userId.uuidString)
            .execute()
            .value
        
        await MainActor.run {
            self.allAchievements = achievementsResponse
            self.unlockedAchievements = userAchievementsResponse.compactMap { $0.achievement }
        }
        
        try await updateAchievementProgress()
    }
    
    // MARK: - Update Achievement Progress
    
    func updateAchievementProgress() async throws {
        let progress = try await fetchProgress()
        let streakInfo = try await fetchStreakInfo()
        
        var progressList: [AchievementProgress] = []
        
        for achievement in allAchievements {
            let isUnlocked = unlockedAchievements.contains { $0.id == achievement.id }
            let unlockedAt = unlockedAchievements.first { $0.id == achievement.id }?.unlockedAt
            
            let (currentValue, targetValue) = calculateProgressValues(
                achievement: achievement,
                progress: progress,
                streakInfo: streakInfo
            )
            
            progressList.append(AchievementProgress(
                achievement: achievement,
                currentValue: currentValue,
                targetValue: targetValue,
                isUnlocked: isUnlocked,
                unlockedAt: unlockedAt
            ))
        }
        
        await MainActor.run {
            self.achievementProgress = progressList.sorted { !$0.isUnlocked && $1.isUnlocked }
            self.streakInfo = streakInfo
        }
    }
    
    private func calculateProgressValues(
        achievement: Achievement,
        progress: Progress,
        streakInfo: StreakInfo
    ) -> (current: Int, target: Int) {
        guard let type = AchievementType(rawValue: achievement.type) else {
            return (0, 1)
        }
        
        switch type {
        case .firstSession:
            return (min(progress.totalSessions, 1), 1)
        case .streak3Days:
            return (min(streakInfo.currentStreak, 3), 3)
        case .streak7Days:
            return (min(streakInfo.currentStreak, 7), 7)
        case .streak30Days:
            return (min(streakInfo.currentStreak, 30), 30)
        case .sessions10:
            return (min(progress.totalSessions, 10), 10)
        case .sessions50:
            return (min(progress.totalSessions, 50), 50)
        case .sessions100:
            return (min(progress.totalSessions, 100), 100)
        case .totalMinutes60:
            return (min(progress.totalMinutes, 60), 60)
        case .totalMinutes300:
            return (min(progress.totalMinutes, 300), 300)
        case .totalMinutes1000:
            return (min(progress.totalMinutes, 1000), 1000)
        case .beforeMeetings5:
            return (min(progress.sessionsBeforeMeetings, 5), 5)
        case .beforeMeetings20:
            return (min(progress.sessionsBeforeMeetings, 20), 20)
        case .beforeMeetings50:
            return (min(progress.sessionsBeforeMeetings, 50), 50)
        case .stressReduction20:
            let avgReduction = Int(progress.stressReductionAvg)
            return (min(avgReduction, 20), 20)
        case .stressReduction40:
            let avgReduction = Int(progress.stressReductionAvg)
            return (min(avgReduction, 40), 40)
        case .perfectWeek:
            return (streakInfo.currentStreak >= 7 ? 1 : 0, 1)
        case .earlyBird, .nightOwl:
            return (0, 1) // Calculated separately
        }
    }
    
    // MARK: - Check and Unlock Achievements
    
    func checkAndUnlockAchievements(after session: MeditationSession) async throws {
        let progress = try await fetchProgress()
        let streakInfo = try await fetchStreakInfo()
        
        var newlyUnlocked: [Achievement] = []
        
        for achievement in allAchievements {
            let isAlreadyUnlocked = unlockedAchievements.contains { $0.id == achievement.id }
            if isAlreadyUnlocked { continue }
            
            if try await shouldUnlockAchievement(
                achievement: achievement,
                progress: progress,
                streakInfo: streakInfo,
                session: session
            ) {
                try await unlockAchievement(achievement)
                newlyUnlocked.append(achievement)
            }
        }
        
        if let first = newlyUnlocked.first {
            await MainActor.run {
                self.recentlyUnlocked = first
            }
            
            // Clear after 3 seconds
            DispatchQueue.main.asyncAfter(deadline: .now() + 3) {
                self.recentlyUnlocked = nil
            }
        }
    }
    
    private func shouldUnlockAchievement(
        achievement: Achievement,
        progress: Progress,
        streakInfo: StreakInfo,
        session: MeditationSession
    ) async throws -> Bool {
        guard let type = AchievementType(rawValue: achievement.type) else {
            return false
        }
        
        switch type {
        case .firstSession:
            return progress.totalSessions >= 1
        case .streak3Days:
            return streakInfo.currentStreak >= 3
        case .streak7Days:
            return streakInfo.currentStreak >= 7
        case .streak30Days:
            return streakInfo.currentStreak >= 30
        case .sessions10:
            return progress.totalSessions >= 10
        case .sessions50:
            return progress.totalSessions >= 50
        case .sessions100:
            return progress.totalSessions >= 100
        case .totalMinutes60:
            return progress.totalMinutes >= 60
        case .totalMinutes300:
            return progress.totalMinutes >= 300
        case .totalMinutes1000:
            return progress.totalMinutes >= 1000
        case .beforeMeetings5:
            return progress.sessionsBeforeMeetings >= 5
        case .beforeMeetings20:
            return progress.sessionsBeforeMeetings >= 20
        case .beforeMeetings50:
            return progress.sessionsBeforeMeetings >= 50
        case .stressReduction20:
            return progress.stressReductionAvg >= 20
        case .stressReduction40:
            return progress.stressReductionAvg >= 40
        case .perfectWeek:
            return streakInfo.currentStreak >= 7
        case .earlyBird:
            let hour = Calendar.current.component(.hour, from: session.startedAt)
            return hour >= 5 && hour < 9 && try await checkConsecutiveEarlyBirdSessions(count: 5)
        case .nightOwl:
            let hour = Calendar.current.component(.hour, from: session.startedAt)
            return hour >= 21 || hour < 5 && try await checkConsecutiveNightOwlSessions(count: 5)
        }
    }
    
    private func unlockAchievement(_ achievement: Achievement) async throws {
        let userAchievement = UserAchievement(
            id: UUID(),
            userId: userId,
            achievementId: achievement.id,
            unlockedAt: Date()
        )
        
        try await supabase
            .from("user_achievements")
            .insert(userAchievement)
            .execute()
        
        await MainActor.run {
            self.unlockedAchievements.append(achievement)
        }
        
        // Send notification
        await sendAchievementNotification(achievement)
    }
    
    // MARK: - Streak Management
    
    func updateStreak(after session: MeditationSession) async throws {
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        var progress = try await fetchProgress()
        
        guard let lastSessionDate = try await getLastSessionDate(before: session) else {
            // First session ever
            progress.currentStreak = 1
            progress.longestStreak = 1
            try await updateProgress(progress)
            return
        }
        
        let lastSessionDay = calendar.startOfDay(for: lastSessionDate)
        let daysDifference = calendar.dateComponents([.day], from: lastSessionDay, to: today).day ?? 0
        
        if daysDifference == 0 {
            // Same day, no change
            return
        } else if daysDifference == 1 {
            // Consecutive day
            progress.currentStreak += 1
            if progress.currentStreak > progress.longestStreak {
                progress.longestStreak = progress.currentStreak
            }
        } else {
            // Streak broken
            progress.currentStreak = 1
        }
        
        try await updateProgress(progress)
    }
    
    func fetchStreakInfo() async throws -> StreakInfo {
        let progress = try await fetchProgress()
        let lastSessionDate = try await getLastSessionDate()
        
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        
        var isActive = false
        if let lastDate = lastSessionDate {
            let lastDay = calendar.startOfDay(for: lastDate)
            let daysDifference = calendar.dateComponents([.day], from: lastDay, to: today).day ?? 0
            isActive = daysDifference <= 1
        }
        
        return StreakInfo(
            currentStreak: progress.currentStreak,
            longestStreak: progress.longestStreak,
            lastSessionDate: lastSessionDate,
            isActive: isActive
        )
    }
    
    // MARK: - Helper Methods
    
    private func fetchProgress() async throws -> Progress {
        let response: [Progress] = try await supabase
            .from("progress")
            .select()
            .eq("user_id", value: userId.uuidString)
            .limit(1)
            .execute()
            .value
        
        guard let progress = response.first else {
            throw AchievementServiceError.progressNotFound
        }
        
        return progress
    }
    
    private func updateProgress(_ progress: Progress) async throws {
        try await supabase
            .from("progress")
            .update(progress)
            .eq("user_id", value: userId.uuidString)
            .execute()
    }
    
    private func getLastSessionDate(before session: MeditationSession? = nil) async throws -> Date? {
        var query = supabase
            .from("meditation_sessions")
            .select("completed_at")
            .eq("user_id", value: userId.uuidString)
            .not("completed_at", operator: .is, value: "null")
            .order("completed_at", ascending: false)
            .limit(1)
        
        if let session = session {
            query = query.lt("completed_at", value: session.completedAt?.ISO8601Format() ?? "")
        }
        
        let response: [MeditationSession] = try await query.execute().value
        return response.first?.completedAt
    }
    
    private func checkConsecutiveEarlyBirdSessions(count: Int) async throws -> Bool {
        let sessions: [MeditationSession] = try await supabase
            .from("meditation_sessions")
            .select()
            .eq("user_id", value: userId.uuidString)
            .not("completed_at", operator: .is, value: "null")
            .order("completed_at", ascending: false)
            .limit(count)
            .execute()
            .value
        
        guard sessions.count >= count else { return false }
        
        return sessions.allSatisfy { session in
            let hour = Calendar.current.component(.hour, from: session.startedAt)
            return hour >= 5 && hour < 9
        }
    }
    
    private func checkConsecutiveNightOwlSessions(count: Int) async throws -> Bool {
        let sessions: [MeditationSession] = try await supabase
            .from("meditation_sessions")
            .select()
            .eq("user_id", value: userId.uuidString)
            .not("completed_at", operator: .is, value: "null")
            .order("completed_at", ascending: false)
            .limit(count)
            .execute()
            .value
        
        guard sessions.count >= count else { return false }
        
        return sessions.allSatisfy { session in
            let hour = Calendar.current.component(.hour, from: session.startedAt)
            return hour >= 21 || hour < 5
        }
    }
    
    private func sendAchievementNotification(_ achievement: Achievement