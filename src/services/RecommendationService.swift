import Foundation
import Combine

enum TimeOfDay {
    case morning
    case afternoon
    case evening
    case night
    
    static func current() -> TimeOfDay {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 5..<12:
            return .morning
        case 12..<17:
            return .afternoon
        case 17..<22:
            return .evening
        default:
            return .night
        }
    }
}

struct RecommendationContext {
    let stressLevel: Int
    let timeOfDay: TimeOfDay
    let upcomingEvents: [CalendarEvent]
    let recentSessions: [MeditationSession]
    let userPreferences: [String: Any]?
    let currentStreak: Int
    let lastSessionTimestamp: Date?
}

struct ExerciseRecommendation {
    let primaryExercise: Exercise
    let alternatives: [Exercise]
    let confidence: Double
    let reasoning: String
}

class RecommendationService: ObservableObject {
    static let shared = RecommendationService()
    
    private let supabaseService = SupabaseService.shared
    private let calendarService = CalendarService.shared
    private let stressAnalysisService = StressAnalysisService.shared
    
    @Published var lastRecommendation: ExerciseRecommendation?
    
    private var cancellables = Set<AnyCancellable>()
    private var exerciseCache: [Exercise] = []
    private var lastCacheUpdate: Date?
    private let cacheValidityDuration: TimeInterval = 3600 // 1 hour
    
    private init() {
        loadExercisesCache()
    }
    
    func getRecommendation(for userId: UUID) async throws -> ExerciseRecommendation {
        let context = try await buildRecommendationContext(userId: userId)
        let recommendation = try await generateRecommendation(context: context)
        
        await MainActor.run {
            self.lastRecommendation = recommendation
        }
        
        await logRecommendation(userId: userId, recommendation: recommendation, context: context)
        
        return recommendation
    }
    
    func getQuickRecommendation(stressLevel: Int, timeOfDay: TimeOfDay) async throws -> ExerciseRecommendation {
        let exercises = try await getExercises()
        
        let context = RecommendationContext(
            stressLevel: stressLevel,
            timeOfDay: timeOfDay,
            upcomingEvents: [],
            recentSessions: [],
            userPreferences: nil,
            currentStreak: 0,
            lastSessionTimestamp: nil
        )
        
        return try await generateRecommendation(context: context, exercises: exercises)
    }
    
    private func buildRecommendationContext(userId: UUID) async throws -> RecommendationContext {
        async let upcomingEvents = calendarService.getUpcomingEvents(within: 3600 * 4) // 4 hours
        async let recentSessions = fetchRecentSessions(userId: userId)
        async let progress = fetchUserProgress(userId: userId)
        async let userPreferences = fetchUserPreferences(userId: userId)
        
        let currentStressLevel = await stressAnalysisService.getCurrentStressLevel()
        let timeOfDay = TimeOfDay.current()
        
        let (events, sessions, progressData, preferences) = try await (
            upcomingEvents,
            recentSessions,
            progress,
            userPreferences
        )
        
        return RecommendationContext(
            stressLevel: currentStressLevel,
            timeOfDay: timeOfDay,
            upcomingEvents: events,
            recentSessions: sessions,
            userPreferences: preferences,
            currentStreak: progressData?.currentStreak ?? 0,
            lastSessionTimestamp: sessions.first?.completedAt
        )
    }
    
    private func generateRecommendation(
        context: RecommendationContext,
        exercises: [Exercise]? = nil
    ) async throws -> ExerciseRecommendation {
        let availableExercises = try exercises ?? await getExercises()
        
        let scoredExercises = availableExercises.map { exercise in
            (exercise: exercise, score: calculateExerciseScore(exercise, context: context))
        }.sorted { $0.score > $1.score }
        
        guard let primary = scoredExercises.first else {
            throw NSError(
                domain: "RecommendationService",
                code: 404,
                userInfo: [NSLocalizedDescriptionKey: "No exercises available"]
            )
        }
        
        let alternatives = Array(scoredExercises.dropFirst().prefix(2)).map { $0.exercise }
        
        let reasoning = generateReasoning(
            exercise: primary.exercise,
            context: context,
            score: primary.score
        )
        
        let confidence = min(primary.score / 100.0, 1.0)
        
        return ExerciseRecommendation(
            primaryExercise: primary.exercise,
            alternatives: alternatives,
            confidence: confidence,
            reasoning: reasoning
        )
    }
    
    private func calculateExerciseScore(_ exercise: Exercise, context: RecommendationContext) -> Double {
        var score: Double = 50.0
        
        // Stress level matching (40% weight)
        score += calculateStressMatchScore(exercise, stressLevel: context.stressLevel) * 0.4
        
        // Time of day matching (20% weight)
        score += calculateTimeOfDayScore(exercise, timeOfDay: context.timeOfDay) * 0.2
        
        // Calendar context (20% weight)
        score += calculateCalendarScore(exercise, events: context.upcomingEvents) * 0.2
        
        // Recent session variety (10% weight)
        score += calculateVarietyScore(exercise, recentSessions: context.recentSessions) * 0.1
        
        // Duration appropriateness (10% weight)
        score += calculateDurationScore(exercise, context: context) * 0.1
        
        return score
    }
    
    private func calculateStressMatchScore(_ exercise: Exercise, stressLevel: Int) -> Double {
        switch (exercise.type, stressLevel) {
        case (.breathing, 7...10):
            return 100.0 // Critical stress - breathing exercises most effective
        case (.breathing, 4...6):
            return 80.0 // Medium stress - breathing still good
        case (.mindfulness, 4...6):
            return 90.0 // Medium stress - mindfulness optimal
        case (.mindfulness, 1...3):
            return 85.0 // Low stress - mindfulness for maintenance
        case (.bodyScan, 1...3):
            return 80.0 // Low stress - body scan for relaxation
        case (.bodyScan, 4...6):
            return 70.0 // Medium stress - body scan can help
        default:
            return 50.0
        }
    }
    
    private func calculateTimeOfDayScore(_ exercise: Exercise, timeOfDay: TimeOfDay) -> Double {
        switch (exercise.type, timeOfDay) {
        case (.breathing, .morning):
            return 90.0 // Energizing breathing in morning
        case (.mindfulness, .morning):
            return 80.0 // Mindfulness sets tone for day
        case (.bodyScan, .evening):
            return 95.0 // Body scan perfect for evening wind-down
        case (.mindfulness, .evening):
            return 85.0 // Mindfulness good for reflection
        case (.breathing, .afternoon):
            return 85.0 // Quick breathing for afternoon reset
        case (.bodyScan, .night):
            return 90.0 // Body scan for sleep preparation
        default:
            return 60.0
        }
    }
    
    private func calculateCalendarScore(_ exercise: Exercise, events: [CalendarEvent]) -> Double {
        guard let nextEvent = events.first else {
            return 70.0 // No upcoming events - neutral score
        }
        
        let timeUntilEvent = nextEvent.startDate.timeIntervalSinceNow
        let eventImportance = nextEvent.isImportant ? 1.2 : 1.0
        
        // Prefer shorter exercises if event is soon
        if timeUntilEvent < 1800 { // Less than 30 minutes
            let durationScore = exercise.durationSeconds <= 300 ? 100.0 : 50.0
            return durationScore * eventImportance
        } else if timeUntilEvent < 3600 { // Less than 1 hour
            let durationScore = exercise.durationSeconds <= 600 ? 90.0 : 60.0
            return durationScore * eventImportance
        }
        
        // If important event coming up, prefer breathing exercises
        if nextEvent.isImportant && exercise.type == .breathing {
            return 95.0
        }
        
        return 75.0
    }
    
    private func calculateVarietyScore(_ exercise: Exercise, recentSessions: [MeditationSession]) -> Double {
        guard !recentSessions.isEmpty else {
            return 70.0 // No history - neutral score
        }
        
        let recentTypes = Set(recentSessions.prefix(3).compactMap { session in
            session.exercise?.type
        })
        
        // Prefer exercises not recently used
        if recentTypes.contains(exercise.type) {
            return 40.0
        } else {
            return 100.0
        }
    }
    
    private func calculateDurationScore(_ exercise: Exercise, context: RecommendationContext) -> Double {
        // Prefer shorter sessions for high stress or if user hasn't meditated recently
        if context.stressLevel >= 7 {
            return exercise.durationSeconds <= 300 ? 100.0 : 70.0
        }
        
        // If maintaining streak, prefer medium duration
        if context.currentStreak > 0 {
            return exercise.durationSeconds >= 300 && exercise.durationSeconds <= 600 ? 90.0 : 70.0
        }
        
        // If last session was recent (within 4 hours), prefer shorter
        if let lastSession = context.lastSessionTimestamp,
           Date().timeIntervalSince(lastSession) < 14400 {
            return exercise.durationSeconds <= 300 ? 85.0 : 60.0
        }
        
        return 75.0
    }
    
    private func generateReasoning(exercise: Exercise, context: RecommendationContext, score: Double) -> String {
        var reasons: [String] = []
        
        // Stress-based reasoning
        if context.stressLevel >= 7 {
            reasons.append("Your stress level is high")
            if exercise.type == .breathing {
                reasons.append("breathing exercises can provide quick relief")
            }
        } else if context.stressLevel >= 4 {
            reasons.append("You're experiencing moderate stress")
            if exercise.type == .mindfulness {
                reasons.append("mindfulness can help you regain focus")
            }
        } else {
            reasons.append("You're relatively calm")
            if exercise.type == .bodyScan {
                reasons.append("body scan can deepen your relaxation")
            }
        }
        
        // Time-based reasoning
        switch context.timeOfDay {
        case .morning:
            reasons.append("morning sessions help set a positive tone for the day")
        case .afternoon:
            reasons.append("afternoon practice can reset your energy")
        case .evening:
            reasons.append("evening meditation helps you unwind")
        case .night:
            reasons.append("nighttime practice can improve sleep quality")
        }
        
        // Calendar-based reasoning
        if let nextEvent = context.upcomingEvents.first {
            let timeUntil = nextEvent.startDate.timeIntervalSinceNow
            if timeUntil < 3600 {
                let minutes = Int(timeUntil / 60)
                reasons.append("you have a meeting in \(minutes) minutes")
                if exercise.durationSeconds <= 300 {
                    reasons.append("this quick session fits perfectly")
                }
            }
            if nextEvent.isImportant {
                reasons.append("preparing for an important event")
            }
        }
        
        // Streak-based reasoning
        if context.currentStreak >= 7 {
            reasons.append("you're on a \(context.currentStreak)-day streak")
        }
        
        return reasons.joined(separator: ", ") + "."
    }
    
    private func getExercises() async throws -> [Exercise] {
        if let lastUpdate = lastCacheUpdate,
           Date().timeIntervalSince(lastUpdate) < cacheValidityDuration,
           !exerciseCache.isEmpty {
            return exerciseCache
        }
        
        let exercises: [Exercise] = try await supabaseService.client
            .from("exercises")
            .select()
            .execute()
            .value
        
        await MainActor.run {
            self.exerciseCache = exercises
            self.lastCacheUpdate = Date()
        }
        
        return exercises
    }
    
    private func loadExercisesCache() {
        Task {
            do {
                _ = try await getExercises()
            } catch {
                print("Failed to load exercises cache: \(error.localizedDescription)")
            }
        }
    }
    
    private func fetchRecentSessions(userId: UUID) async throws -> [MeditationSession] {
        let sevenDaysAgo = Calendar.current.date(byAdding: .day, value: -7, to: Date()) ?? Date()
        
        let sessions: [MeditationSession] = try await supabaseService.client
            .from("meditation_sessions")
            .select(
                """
                *,
                exercise:exercises(*)
                """
            )
            .eq("user_id", value: userId.uuidString)
            .gte("completed_at", value: sevenDaysAgo.ISO8601Format())
            .order("completed_at", ascending: false)
            .limit(10)
            .execute()
            .value
        
        return sessions
    }
    
    private func fetchUserProgress(userId: UUID) async throws -> Progress? {
        let progress: [Progress] = try await supabaseService.client
            .from("progress")
            .select()
            .eq("user_id", value: userId.uuidString)
            .limit(1)
            .execute()
            .value
        
        return progress.first
    }
    
    private func fetchUserPreferences(userId: UUID) async throws -> [String: Any]? {
        let users: [User] = try await supabaseService.client
            .from("users")
            .select()
            .eq("id", value: userId.uuidString)
            .limit(1)
            .execute()
            .value
        
        return users.first?.preferences
    }
    
    private func logRecommendation(
        userId: UUID,
        recommendation: ExerciseRecommendation,
        context: RecommendationContext
    ) async {
        do {
            let logData: [String: Any] = [
                "user_id": userId.uuidString,
                "primary_exercise_id": recommendation.primaryExercise.id.uuidString,
                "alternative_exercise_ids": recommendation.alternatives.map { $0.id.uuidString },
                "confidence": recommendation.confidence,
                "reasoning": recommendation.reasoning,
                "stress_level": context.stressLevel,
                "time_of_day": String(describing: context.timeOfDay),
                "upcoming_events_count": context.upcomingEvents.count,
                "created_at": Date().ISO8601Format()
            ]
            
            try await supabaseService.client
                .from("recommendation_logs")
                .insert(logData)
                .execute()
        } catch {
            print("Failed to log recommendation: \(error.localizedDescription)")
        }
    }
    
    func refreshExerciseCache() async throws {
        exerciseCache = []
        lastCacheUpdate = nil
        _ = try