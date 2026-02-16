import Foundation

struct MeditationSession: Identifiable, Codable, Equatable {
    let id: UUID
    let userId: UUID
    let exerciseId: UUID
    let stressBefore: Int
    let stressAfter: Int?
    let durationSeconds: Int
    let rating: Int?
    let startedAt: Date
    let completedAt: Date?
    
    var isCompleted: Bool {
        completedAt != nil && stressAfter != nil
    }
    
    var stressReduction: Int? {
        guard let stressAfter = stressAfter else { return nil }
        return stressBefore - stressAfter
    }
    
    var stressReductionPercentage: Double? {
        guard let reduction = stressReduction, stressBefore > 0 else { return nil }
        return (Double(reduction) / Double(stressBefore)) * 100
    }
    
    var durationMinutes: Int {
        durationSeconds / 60
    }
    
    var formattedDuration: String {
        let minutes = durationSeconds / 60
        let seconds = durationSeconds % 60
        if seconds == 0 {
            return "\(minutes)m"
        }
        return "\(minutes)m \(seconds)s"
    }
    
    var formattedStartTime: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: startedAt)
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case userId = "user_id"
        case exerciseId = "exercise_id"
        case stressBefore = "stress_before"
        case stressAfter = "stress_after"
        case durationSeconds = "duration_seconds"
        case rating
        case startedAt = "started_at"
        case completedAt = "completed_at"
    }
    
    init(
        id: UUID = UUID(),
        userId: UUID,
        exerciseId: UUID,
        stressBefore: Int,
        stressAfter: Int? = nil,
        durationSeconds: Int,
        rating: Int? = nil,
        startedAt: Date = Date(),
        completedAt: Date? = nil
    ) {
        self.id = id
        self.userId = userId
        self.exerciseId = exerciseId
        self.stressBefore = stressBefore
        self.stressAfter = stressAfter
        self.durationSeconds = durationSeconds
        self.rating = rating
        self.startedAt = startedAt
        self.completedAt = completedAt
    }
    
    func with(
        stressAfter: Int? = nil,
        rating: Int? = nil,
        completedAt: Date? = nil
    ) -> MeditationSession {
        MeditationSession(
            id: id,
            userId: userId,
            exerciseId: exerciseId,
            stressBefore: stressBefore,
            stressAfter: stressAfter ?? self.stressAfter,
            durationSeconds: durationSeconds,
            rating: rating ?? self.rating,
            startedAt: startedAt,
            completedAt: completedAt ?? self.completedAt
        )
    }
}

extension MeditationSession {
    static var preview: MeditationSession {
        MeditationSession(
            userId: UUID(),
            exerciseId: UUID(),
            stressBefore: 8,
            stressAfter: 4,
            durationSeconds: 300,
            rating: 5,
            startedAt: Date().addingTimeInterval(-600),
            completedAt: Date().addingTimeInterval(-300)
        )
    }
    
    static var inProgressPreview: MeditationSession {
        MeditationSession(
            userId: UUID(),
            exerciseId: UUID(),
            stressBefore: 7,
            durationSeconds: 180,
            startedAt: Date().addingTimeInterval(-180)
        )
    }
}

struct MeditationSessionCreate: Codable {
    let userId: UUID
    let exerciseId: UUID
    let stressBefore: Int
    let durationSeconds: Int
    let startedAt: Date
    
    enum CodingKeys: String, CodingKey {
        case userId = "user_id"
        case exerciseId = "exercise_id"
        case stressBefore = "stress_before"
        case durationSeconds = "duration_seconds"
        case startedAt = "started_at"
    }
}

struct MeditationSessionUpdate: Codable {
    let stressAfter: Int?
    let rating: Int?
    let completedAt: Date?
    
    enum CodingKeys: String, CodingKey {
        case stressAfter = "stress_after"
        case rating
        case completedAt = "completed_at"
    }
}

enum SessionRating: Int, CaseIterable {
    case terrible = 1
    case bad = 2
    case okay = 3
    case good = 4
    case excellent = 5
    
    var emoji: String {
        switch self {
        case .terrible: return "😞"
        case .bad: return "😕"
        case .okay: return "😐"
        case .good: return "🙂"
        case .excellent: return "😊"
        }
    }
    
    var description: String {
        switch self {
        case .terrible: return "Terrible"
        case .bad: return "Bad"
        case .okay: return "Okay"
        case .good: return "Good"
        case .excellent: return "Excellent"
        }
    }
}