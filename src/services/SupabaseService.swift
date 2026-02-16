import Foundation
import Supabase
import Combine

enum SupabaseError: Error {
    case notAuthenticated
    case invalidResponse
    case networkError(Error)
    case databaseError(String)
    case authError(String)
}

final class SupabaseService: ObservableObject {
    static let shared = SupabaseService()
    
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?
    
    private let client: SupabaseClient
    private var cancellables = Set<AnyCancellable>()
    private var realtimeChannel: RealtimeChannel?
    
    private init() {
        guard let supabaseURL = URL(string: ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? ""),
              let supabaseKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] else {
            fatalError("Supabase credentials not found in environment")
        }
        
        self.client = SupabaseClient(
            supabaseURL: supabaseURL,
            supabaseKey: supabaseKey,
            options: SupabaseClientOptions(
                db: SupabaseClientOptions.DatabaseOptions(schema: "public"),
                auth: SupabaseClientOptions.AuthOptions(
                    autoRefreshToken: true,
                    persistSession: true
                )
            )
        )
        
        setupAuthListener()
    }
    
    // MARK: - Authentication
    
    private func setupAuthListener() {
        Task {
            for await state in await client.auth.authStateChanges {
                await MainActor.run {
                    self.isAuthenticated = state.session != nil
                    if let session = state.session {
                        Task {
                            await self.fetchCurrentUser(userId: session.user.id)
                        }
                    } else {
                        self.currentUser = nil
                    }
                }
            }
        }
    }
    
    func signUp(email: String, password: String) async throws -> User {
        do {
            let response = try await client.auth.signUp(
                email: email,
                password: password
            )
            
            guard let userId = response.user?.id else {
                throw SupabaseError.authError("User ID not found")
            }
            
            let newUser = User(
                id: userId,
                email: email,
                selectedVoiceId: nil,
                sessionIntervalHours: 4,
                notificationEnabled: true,
                createdAt: Date(),
                updatedAt: Date()
            )
            
            try await createUser(newUser)
            
            await MainActor.run {
                self.currentUser = newUser
                self.isAuthenticated = true
            }
            
            return newUser
        } catch {
            throw SupabaseError.authError(error.localizedDescription)
        }
    }
    
    func signIn(email: String, password: String) async throws {
        do {
            let session = try await client.auth.signIn(
                email: email,
                password: password
            )
            
            await fetchCurrentUser(userId: session.user.id)
            
            await MainActor.run {
                self.isAuthenticated = true
            }
        } catch {
            throw SupabaseError.authError(error.localizedDescription)
        }
    }
    
    func signOut() async throws {
        do {
            try await client.auth.signOut()
            
            await MainActor.run {
                self.currentUser = nil
                self.isAuthenticated = false
            }
        } catch {
            throw SupabaseError.authError(error.localizedDescription)
        }
    }
    
    func resetPassword(email: String) async throws {
        do {
            try await client.auth.resetPasswordForEmail(email)
        } catch {
            throw SupabaseError.authError(error.localizedDescription)
        }
    }
    
    func getCurrentSession() async throws -> Session {
        do {
            return try await client.auth.session
        } catch {
            throw SupabaseError.notAuthenticated
        }
    }
    
    // MARK: - User CRUD
    
    private func createUser(_ user: User) async throws {
        let userData: [String: AnyJSON] = [
            "id": .string(user.id.uuidString),
            "email": .string(user.email),
            "selected_voice_id": user.selectedVoiceId.map { .string($0.uuidString) } ?? .null,
            "session_interval_hours": .number(Double(user.sessionIntervalHours)),
            "notification_enabled": .bool(user.notificationEnabled),
            "created_at": .string(ISO8601DateFormatter().string(from: user.createdAt)),
            "updated_at": .string(ISO8601DateFormatter().string(from: user.updatedAt))
        ]
        
        do {
            try await client.database
                .from("users")
                .insert(userData)
                .execute()
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    func fetchCurrentUser(userId: UUID) async {
        do {
            let response: [User] = try await client.database
                .from("users")
                .select()
                .eq("id", value: userId.uuidString)
                .execute()
                .value
            
            await MainActor.run {
                self.currentUser = response.first
            }
        } catch {
            print("Error fetching user: \(error)")
        }
    }
    
    func updateUser(_ user: User) async throws {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        let userData: [String: AnyJSON] = [
            "selected_voice_id": user.selectedVoiceId.map { .string($0.uuidString) } ?? .null,
            "session_interval_hours": .number(Double(user.sessionIntervalHours)),
            "notification_enabled": .bool(user.notificationEnabled),
            "updated_at": .string(ISO8601DateFormatter().string(from: Date()))
        ]
        
        do {
            try await client.database
                .from("users")
                .update(userData)
                .eq("id", value: user.id.uuidString)
                .execute()
            
            await MainActor.run {
                self.currentUser = user
            }
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    // MARK: - Meditation Sessions
    
    func createMeditationSession(_ session: MeditationSession) async throws -> MeditationSession {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        let sessionData: [String: AnyJSON] = [
            "id": .string(session.id.uuidString),
            "user_id": .string(session.userId.uuidString),
            "exercise_id": .string(session.exerciseId.uuidString),
            "stress_before": .number(Double(session.stressBefore)),
            "stress_after": session.stressAfter.map { .number(Double($0)) } ?? .null,
            "duration_seconds": .number(Double(session.durationSeconds)),
            "rating": session.rating.map { .number(Double($0)) } ?? .null,
            "started_at": .string(ISO8601DateFormatter().string(from: session.startedAt)),
            "completed_at": session.completedAt.map { .string(ISO8601DateFormatter().string(from: $0)) } ?? .null
        ]
        
        do {
            let response: [MeditationSession] = try await client.database
                .from("meditation_sessions")
                .insert(sessionData)
                .select()
                .execute()
                .value
            
            guard let createdSession = response.first else {
                throw SupabaseError.invalidResponse
            }
            
            return createdSession
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    func updateMeditationSession(_ session: MeditationSession) async throws {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        let sessionData: [String: AnyJSON] = [
            "stress_after": session.stressAfter.map { .number(Double($0)) } ?? .null,
            "rating": session.rating.map { .number(Double($0)) } ?? .null,
            "completed_at": session.completedAt.map { .string(ISO8601DateFormatter().string(from: $0)) } ?? .null
        ]
        
        do {
            try await client.database
                .from("meditation_sessions")
                .update(sessionData)
                .eq("id", value: session.id.uuidString)
                .execute()
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    func fetchMeditationSessions(userId: UUID, limit: Int = 50) async throws -> [MeditationSession] {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        do {
            let response: [MeditationSession] = try await client.database
                .from("meditation_sessions")
                .select()
                .eq("user_id", value: userId.uuidString)
                .order("started_at", ascending: false)
                .limit(limit)
                .execute()
                .value
            
            return response
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    // MARK: - Exercises
    
    func fetchExercises() async throws -> [Exercise] {
        do {
            let response: [Exercise] = try await client.database
                .from("exercises")
                .select()
                .order("name", ascending: true)
                .execute()
                .value
            
            return response
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    func fetchExercise(id: UUID) async throws -> Exercise {
        do {
            let response: [Exercise] = try await client.database
                .from("exercises")
                .select()
                .eq("id", value: id.uuidString)
                .execute()
                .value
            
            guard let exercise = response.first else {
                throw SupabaseError.invalidResponse
            }
            
            return exercise
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    // MARK: - Voices
    
    func fetchVoices() async throws -> [Voice] {
        do {
            let response: [Voice] = try await client.database
                .from("voices")
                .select()
                .order("name", ascending: true)
                .execute()
                .value
            
            return response
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    func fetchVoice(id: UUID) async throws -> Voice {
        do {
            let response: [Voice] = try await client.database
                .from("voices")
                .select()
                .eq("id", value: id.uuidString)
                .execute()
                .value
            
            guard let voice = response.first else {
                throw SupabaseError.invalidResponse
            }
            
            return voice
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    // MARK: - Progress
    
    func fetchProgress(userId: UUID) async throws -> Progress {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        do {
            let response: [Progress] = try await client.database
                .from("progress")
                .select()
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            
            guard let progress = response.first else {
                throw SupabaseError.invalidResponse
            }
            
            return progress
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    // MARK: - Achievements
    
    func fetchAchievements() async throws -> [Achievement] {
        do {
            let response: [Achievement] = try await client.database
                .from("achievements")
                .select()
                .order("name", ascending: true)
                .execute()
                .value
            
            return response
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    func fetchUserAchievements(userId: UUID) async throws -> [Achievement] {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        do {
            let response: [Achievement] = try await client.database
                .from("user_achievements")
                .select("*, achievements(*)")
                .eq("user_id", value: userId.uuidString)
                .execute()
                .value
            
            return response
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    func unlockAchievement(userId: UUID, achievementId: UUID) async throws {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        let data: [String: AnyJSON] = [
            "user_id": .string(userId.uuidString),
            "achievement_id": .string(achievementId.uuidString),
            "unlocked_at": .string(ISO8601DateFormatter().string(from: Date()))
        ]
        
        do {
            try await client.database
                .from("user_achievements")
                .insert(data)
                .execute()
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    // MARK: - Stress Logs
    
    func createStressLog(_ log: StressLevel) async throws {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        let contextData = try? JSONEncoder().encode(log.context)
        let contextString = contextData.flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
        
        let logData: [String: AnyJSON] = [
            "id": .string(log.id.uuidString),
            "user_id": .string(log.userId.uuidString),
            "stress_level": .number(Double(log.level)),
            "source": .string(log.source.rawValue),
            "context": .string(contextString),
            "created_at": .string(ISO8601DateFormatter().string(from: log.timestamp))
        ]
        
        do {
            try await client.database
                .from("stress_logs")
                .insert(logData)
                .execute()
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    func fetchStressLogs(userId: UUID, limit: Int = 100) async throws -> [StressLevel] {
        guard isAuthenticated else {
            throw SupabaseError.notAuthenticated
        }
        
        do {
            let response: [StressLevel] = try await client.database
                .from("stress_logs")
                .select()
                .eq("user_id", value: userId.uuidString)
                .order("created_at", ascending: false)
                .limit(limit)
                .execute()
                .value
            
            return response
        } catch {
            throw SupabaseError.databaseError(error.localizedDescription)
        }
    }
    
    // MARK: - Notification History