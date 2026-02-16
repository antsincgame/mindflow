import SwiftUI
import Combine

@MainActor
class ProgressViewModel: ObservableObject {
    @Published var progress: Progress?
    @Published var achievements: [UserAchievement] = []
    @Published var recentSessions: [MeditationSession] = []
    @Published var isLoading: Bool = false
    @Published var error: Error?
    
    private let supabaseService: SupabaseService
    private let achievementService: AchievementService
    private var cancellables = Set<AnyCancellable>()
    
    init(
        supabaseService: SupabaseService = .shared,
        achievementService: AchievementService = .shared
    ) {
        self.supabaseService = supabaseService
        self.achievementService = achievementService
        
        setupRealtimeSubscription()
    }
    
    func fetchProgress() async {
        isLoading = true
        error = nil
        
        do {
            guard let userId = supabaseService.currentUser?.id else {
                throw ProgressError.userNotAuthenticated
            }
            
            async let progressData = fetchProgressData(userId: userId)
            async let achievementsData = fetchAchievements(userId: userId)
            async let sessionsData = fetchRecentSessions(userId: userId)
            
            let (progress, achievements, sessions) = try await (progressData, achievementsData, sessionsData)
            
            self.progress = progress
            self.achievements = achievements
            self.recentSessions = sessions
            
        } catch {
            self.error = error
        }
        
        isLoading = false
    }
    
    func refreshProgress() async {
        await fetchProgress()
    }
    
    func updateProgress(after session: MeditationSession) async {
        guard let userId = supabaseService.currentUser?.id else { return }
        
        do {
            let updatedProgress = try await calculateUpdatedProgress(
                userId: userId,
                session: session
            )
            
            try await saveProgress(updatedProgress)
            
            self.progress = updatedProgress
            
            await checkAndUnlockAchievements(progress: updatedProgress)
            
        } catch {
            self.error = error
        }
    }
    
    func getStressReductionPercentage() -> Double {
        guard let progress = progress else { return 0 }
        return progress.stressReductionAvg
    }
    
    func getSessionsBeforeMeetingsCount() -> Int {
        guard let progress = progress else { return 0 }
        return progress.sessionsBeforeMeetings
    }
    
    func getCurrentStreak() -> Int {
        guard let progress = progress else { return 0 }
        return progress.currentStreak
    }
    
    func getLongestStreak() -> Int {
        guard let progress = progress else { return 0 }
        return progress.longestStreak
    }
    
    func getTotalMinutes() -> Int {
        guard let progress = progress else { return 0 }
        return progress.totalMinutes
    }
    
    func getTotalSessions() -> Int {
        guard let progress = progress else { return 0 }
        return progress.totalSessions
    }
    
    func getUnlockedAchievements() -> [UserAchievement] {
        return achievements.filter { $0.unlockedAt != nil }
    }
    
    func getLockedAchievements() async -> [Achievement] {
        let unlockedIds = achievements.map { $0.achievementId }
        return await achievementService.getAllAchievements()
            .filter { !unlockedIds.contains($0.id) }
    }
    
    func getProgressToNextAchievement() async -> (achievement: Achievement, progress: Double)? {
        guard let progress = progress else { return nil }
        
        let lockedAchievements = await getLockedAchievements()
        
        var closestAchievement: (achievement: Achievement, progress: Double)?
        
        for achievement in lockedAchievements {
            let progressValue = calculateAchievementProgress(
                achievement: achievement,
                userProgress: progress
            )
            
            if let closest = closestAchievement {
                if progressValue > closest.progress && progressValue < 1.0 {
                    closestAchievement = (achievement, progressValue)
                }
            } else if progressValue < 1.0 {
                closestAchievement = (achievement, progressValue)
            }
        }
        
        return closestAchievement
    }
    
    func getWeeklyProgress() -> [DailyProgress] {
        let calendar = Calendar.current
        let today = Date()
        let weekAgo = calendar.date(byAdding: .day, value: -7, to: today)!
        
        let weekSessions = recentSessions.filter { session in
            guard let completedAt = session.completedAt else { return false }
            return completedAt >= weekAgo && completedAt <= today
        }
        
        var dailyProgress: [Date: DailyProgress] = [:]
        
        for i in 0..<7 {
            if let date = calendar.date(byAdding: .day, value: -i, to: today) {
                let startOfDay = calendar.startOfDay(for: date)
                dailyProgress[startOfDay] = DailyProgress(
                    date: startOfDay,
                    sessionCount: 0,
                    totalMinutes: 0
                )
            }
        }
        
        for session in weekSessions {
            guard let completedAt = session.completedAt else { continue }
            let startOfDay = calendar.startOfDay(for: completedAt)
            
            if var dayProgress = dailyProgress[startOfDay] {
                dayProgress.sessionCount += 1
                dayProgress.totalMinutes += session.durationSeconds / 60
                dailyProgress[startOfDay] = dayProgress
            }
        }
        
        return dailyProgress.values.sorted { $0.date < $1.date }
    }
    
    func getAverageSessionDuration() -> Int {
        guard !recentSessions.isEmpty else { return 0 }
        
        let totalSeconds = recentSessions.reduce(0) { $0 + $1.durationSeconds }
        return totalSeconds / recentSessions.count / 60
    }
    
    func getStressImprovementTrend() -> StressTrend {
        guard recentSessions.count >= 5 else { return .neutral }
        
        let lastFiveSessions = Array(recentSessions.prefix(5))
        let improvements = lastFiveSessions.compactMap { session -> Int? in
            guard let before = session.stressBefore,
                  let after = session.stressAfter else { return nil }
            return before - after
        }
        
        guard !improvements.isEmpty else { return .neutral }
        
        let averageImprovement = Double(improvements.reduce(0, +)) / Double(improvements.count)
        
        if averageImprovement > 2 {
            return .improving
        } else if averageImprovement < -1 {
            return .declining
        } else {
            return .neutral
        }
    }
    
    private func fetchProgressData(userId: UUID) async throws -> Progress {
        let response = try await supabaseService.client
            .from("progress")
            .select()
            .eq("user_id", value: userId.uuidString)
            .single()
            .execute()
        
        let progress = try JSONDecoder().decode(Progress.self, from: response.data)
        return progress
    }
    
    private func fetchAchievements(userId: UUID) async throws -> [UserAchievement] {
        let response = try await supabaseService.client
            .from("user_achievements")
            .select("*, achievements(*)")
            .eq("user_id", value: userId.uuidString)
            .order("unlocked_at", ascending: false)
            .execute()
        
        let achievements = try JSONDecoder().decode([UserAchievement].self, from: response.data)
        return achievements
    }
    
    private func fetchRecentSessions(userId: UUID) async throws -> [MeditationSession] {
        let response = try await supabaseService.client
            .from("meditation_sessions")
            .select("*, exercises(*)")
            .eq("user_id", value: userId.uuidString)
            .order("completed_at", ascending: false)
            .limit(30)
            .execute()
        
        let sessions = try JSONDecoder().decode([MeditationSession].self, from: response.data)
        return sessions
    }
    
    private func calculateUpdatedProgress(userId: UUID, session: MeditationSession) async throws -> Progress {
        var currentProgress = progress ?? Progress(
            id: UUID(),
            userId: userId,
            totalSessions: 0,
            totalMinutes: 0,
            currentStreak: 0,
            longestStreak: 0,
            sessionsBeforeMeetings: 0,
            stressReductionAvg: 0,
            updatedAt: Date()
        )
        
        currentProgress.totalSessions += 1
        currentProgress.totalMinutes += session.durationSeconds / 60
        
        let calendar = Calendar.current
        let today = calendar.startOfDay(for: Date())
        let lastSessionDate = recentSessions.first?.completedAt.map { calendar.startOfDay(for: $0) }
        
        if let lastDate = lastSessionDate {
            let daysDifference = calendar.dateComponents([.day], from: lastDate, to: today).day ?? 0
            
            if daysDifference == 0 {
                // Same day, keep streak
            } else if daysDifference == 1 {
                currentProgress.currentStreak += 1
            } else {
                currentProgress.currentStreak = 1
            }
        } else {
            currentProgress.currentStreak = 1
        }
        
        currentProgress.longestStreak = max(currentProgress.longestStreak, currentProgress.currentStreak)
        
        let allSessions = [session] + recentSessions
        let stressReductions = allSessions.compactMap { session -> Int? in
            guard let before = session.stressBefore,
                  let after = session.stressAfter else { return nil }
            return before - after
        }
        
        if !stressReductions.isEmpty {
            currentProgress.stressReductionAvg = Double(stressReductions.reduce(0, +)) / Double(stressReductions.count)
        }
        
        currentProgress.updatedAt = Date()
        
        return currentProgress
    }
    
    private func saveProgress(_ progress: Progress) async throws {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(progress)
        
        _ = try await supabaseService.client
            .from("progress")
            .upsert(data)
            .execute()
    }
    
    private func checkAndUnlockAchievements(progress: Progress) async {
        let allAchievements = await achievementService.getAllAchievements()
        
        for achievement in allAchievements {
            let isUnlocked = achievements.contains { $0.achievementId == achievement.id }
            
            if !isUnlocked && await achievementService.checkUnlockCondition(
                achievement: achievement,
                progress: progress
            ) {
                await unlockAchievement(achievement)
            }
        }
    }
    
    private func unlockAchievement(_ achievement: Achievement) async {
        guard let userId = supabaseService.currentUser?.id else { return }
        
        let userAchievement = UserAchievement(
            id: UUID(),
            userId: userId,
            achievementId: achievement.id,
            achievement: achievement,
            unlockedAt: Date()
        )
        
        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(userAchievement)
            
            _ = try await supabaseService.client
                .from("user_achievements")
                .insert(data)
                .execute()
            
            achievements.insert(userAchievement, at: 0)
            
        } catch {
            self.error = error
        }
    }
    
    private func calculateAchievementProgress(achievement: Achievement, userProgress: Progress) -> Double {
        guard let condition = achievement.unlockCondition else { return 0 }
        
        if let sessionsRequired = condition["total_sessions"] as? Int {
            return Double(userProgress.totalSessions) / Double(sessionsRequired)
        }
        
        if let streakRequired = condition["streak"] as? Int {
            return Double(userProgress.currentStreak) / Double(streakRequired)
        }
        
        if let minutesRequired = condition["total_minutes"] as? Int {
            return Double(userProgress.totalMinutes) / Double(minutesRequired)
        }
        
        return 0
    }
    
    private func setupRealtimeSubscription() {
        guard let userId = supabaseService.currentUser?.id else { return }
        
        Task {
            do {
                let channel = await supabaseService.client.channel("progress_changes")
                
                await channel
                    .on("postgres_changes", filter: ChannelFilter(
                        event: "UPDATE",
                        schema: "public",
                        table: "progress",
                        filter: "user_id=eq.\(userId.uuidString)"
                    )) { [weak self] payload in
                        Task { @MainActor in
                            await self?.fetchProgress()
                        }
                    }
                    .subscribe()
                
            } catch {
                self.error = error
            }
        }
    }
}

enum ProgressError: LocalizedError {
    case userNotAuthenticated
    case fetchFailed
    case updateFailed
    
    var errorDescription: String? {
        switch self {
        case .userNotAuthenticated:
            return "User not authenticated"
        case .fetchFailed:
            return "Failed to fetch progress data"
        case .updateFailed:
            return "Failed to update progress"
        }
    }
}

enum StressTrend {
    case improving
    case neutral
    case declining
}

struct DailyProgress: Identifiable {
    let id = UUID()
    let date: Date
    var sessionCount: Int
    var totalMinutes: Int
}

extension ProgressViewModel {
    static var preview: ProgressViewModel {
        let viewModel = ProgressViewModel()
        viewModel.progress = Progress(
            id: UUID(),
            userId: UUID(),
            totalSessions: 42,
            totalMinutes: 315,
            currentStreak: 7,
            longestStreak: 14,
            sessionsBeforeMeetings: 12,
            stressReductionAvg: 3.5,
            updatedAt: Date()
        )
        viewModel.achievements = [
            UserAchievement(
                id: UUID(),
                userId: UUID(),
                achievementId: UUID(),
                achievement: Achievement(
                    id: UUID(),
                    name: "First Steps",
                    description: "Complete your first meditation session",
                    iconUrl: "star.fill",
                    unlockCondition: ["total_sessions": 1],
                    createdAt: Date()
                ),
                unlockedAt: Date()
            )
        ]
        viewModel.recentSessions = [
            MeditationSession(
                id: UUID(),
                userId: UUID(),
                exerciseId: UUID(),
                exercise: Exercise(
                    id: UUID(),
                    name: "Breathing Exercise",
                    description: "Calm your mind",
                    type: .breathing,
                    durationSeconds: 300,
                    audioUrl: "",
                    createdAt: Date()
                ),
                stressBefore: 8,
                stressAfter: 4,
                durationSeconds: 300,