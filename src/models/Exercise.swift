import Foundation

enum ExerciseType: String, Codable {
    case breathing = "breathing"
    case mindfulness = "mindfulness"
    case bodyScan = "body_scan"
    
    var displayName: String {
        switch self {
        case .breathing:
            return "Breathing"
        case .mindfulness:
            return "Mindfulness"
        case .bodyScan:
            return "Body Scan"
        }
    }
    
    var icon: String {
        switch self {
        case .breathing:
            return "wind"
        case .mindfulness:
            return "brain.head.profile"
        case .bodyScan:
            return "figure.stand"
        }
    }
}

struct Exercise: Identifiable, Codable, Equatable {
    let id: UUID
    let name: String
    let description: String
    let type: ExerciseType
    let durationSeconds: Int
    let audioUrl: String
    let createdAt: Date
    
    var durationMinutes: Int {
        return durationSeconds / 60
    }
    
    var durationFormatted: String {
        let minutes = durationSeconds / 60
        let seconds = durationSeconds % 60
        
        if seconds == 0 {
            return "\(minutes) min"
        } else {
            return "\(minutes):\(String(format: "%02d", seconds)) min"
        }
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case type
        case durationSeconds = "duration_seconds"
        case audioUrl = "audio_url"
        case createdAt = "created_at"
    }
    
    init(
        id: UUID = UUID(),
        name: String,
        description: String,
        type: ExerciseType,
        durationSeconds: Int,
        audioUrl: String,
        createdAt: Date = Date()
    ) {
        self.id = id
        self.name = name
        self.description = description
        self.type = type
        self.durationSeconds = durationSeconds
        self.audioUrl = audioUrl
        self.createdAt = createdAt
    }
    
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        
        id = try container.decode(UUID.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        description = try container.decode(String.self, forKey: .description)
        type = try container.decode(ExerciseType.self, forKey: .type)
        durationSeconds = try container.decode(Int.self, forKey: .durationSeconds)
        audioUrl = try container.decode(String.self, forKey: .audioUrl)
        
        if let timestamp = try? container.decode(String.self, forKey: .createdAt) {
            let formatter = ISO8601DateFormatter()
            formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            createdAt = formatter.date(from: timestamp) ?? Date()
        } else {
            createdAt = try container.decode(Date.self, forKey: .createdAt)
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(description, forKey: .description)
        try container.encode(type, forKey: .type)
        try container.encode(durationSeconds, forKey: .durationSeconds)
        try container.encode(audioUrl, forKey: .audioUrl)
        
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        try container.encode(formatter.string(from: createdAt), forKey: .createdAt)
    }
    
    static func == (lhs: Exercise, rhs: Exercise) -> Bool {
        return lhs.id == rhs.id
    }
}

extension Exercise {
    static let preview = Exercise(
        name: "Deep Breathing",
        description: "A calming breathing exercise to reduce stress and anxiety",
        type: .breathing,
        durationSeconds: 300,
        audioUrl: "https://example.com/audio/deep-breathing.mp3"
    )
    
    static let previewList: [Exercise] = [
        Exercise(
            name: "Deep Breathing",
            description: "A calming breathing exercise to reduce stress and anxiety",
            type: .breathing,
            durationSeconds: 300,
            audioUrl: "https://example.com/audio/deep-breathing.mp3"
        ),
        Exercise(
            name: "Mindful Awareness",
            description: "Focus on the present moment and let go of worries",
            type: .mindfulness,
            durationSeconds: 600,
            audioUrl: "https://example.com/audio/mindful-awareness.mp3"
        ),
        Exercise(
            name: "Body Scan Relaxation",
            description: "Progressive relaxation technique for full body awareness",
            type: .bodyScan,
            durationSeconds: 900,
            audioUrl: "https://example.com/audio/body-scan.mp3"
        )
    ]
}

struct ExerciseRecommendation: Identifiable {
    let id: UUID
    let exercise: Exercise
    let reason: String
    let confidence: Double
    let isAIRecommended: Bool
    
    init(
        id: UUID = UUID(),
        exercise: Exercise,
        reason: String,
        confidence: Double,
        isAIRecommended: Bool = false
    ) {
        self.id = id
        self.exercise = exercise
        self.reason = reason
        self.confidence = confidence
        self.isAIRecommended = isAIRecommended
    }
}

extension ExerciseRecommendation {
    static let preview = ExerciseRecommendation(
        exercise: .preview,
        reason: "Based on your current stress level and time of day",
        confidence: 0.85,
        isAIRecommended: true
    )
    
    static let previewList: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            exercise: Exercise.previewList[0],
            reason: "Best for quick stress relief before meetings",
            confidence: 0.92,
            isAIRecommended: true
        ),
        ExerciseRecommendation(
            exercise: Exercise.previewList[1],
            reason: "Helps maintain focus during busy workdays",
            confidence: 0.78,
            isAIRecommended: false
        ),
        ExerciseRecommendation(
            exercise: Exercise.previewList[2],
            reason: "Perfect for evening relaxation",
            confidence: 0.65,
            isAIRecommended: false
        )
    ]
}