import Foundation

enum VoiceGender: String, Codable, CaseIterable {
    case male
    case female
    case neutral
}

enum VoiceAccent: String, Codable, CaseIterable {
    case american
    case british
    case australian
    case neutral
    case spanish
    case french
    case german
    case italian
    case russian
}

struct Voice: Identifiable, Codable, Equatable, Hashable {
    let id: UUID
    let name: String
    let gender: VoiceGender
    let accent: VoiceAccent
    let previewAudioUrl: String
    let description: String?
    let isPremium: Bool
    let language: String
    let sampleRate: Int
    let duration: TimeInterval
    let createdAt: Date
    let updatedAt: Date?
    
    var displayName: String {
        "\(name) (\(accent.displayName))"
    }
    
    var genderIcon: String {
        switch gender {
        case .male:
            return "person.fill"
        case .female:
            return "person.fill"
        case .neutral:
            return "person.2.fill"
        }
    }
    
    var accentFlag: String {
        switch accent {
        case .american:
            return "🇺🇸"
        case .british:
            return "🇬🇧"
        case .australian:
            return "🇦🇺"
        case .spanish:
            return "🇪🇸"
        case .french:
            return "🇫🇷"
        case .german:
            return "🇩🇪"
        case .italian:
            return "🇮🇹"
        case .russian:
            return "🇷🇺"
        case .neutral:
            return "🌐"
        }
    }
    
    init(
        id: UUID = UUID(),
        name: String,
        gender: VoiceGender,
        accent: VoiceAccent,
        previewAudioUrl: String,
        description: String? = nil,
        isPremium: Bool = false,
        language: String = "en",
        sampleRate: Int = 44100,
        duration: TimeInterval = 30,
        createdAt: Date = Date(),
        updatedAt: Date? = nil
    ) {
        self.id = id
        self.name = name
        self.gender = gender
        self.accent = accent
        self.previewAudioUrl = previewAudioUrl
        self.description = description
        self.isPremium = isPremium
        self.language = language
        self.sampleRate = sampleRate
        self.duration = duration
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case gender
        case accent
        case previewAudioUrl = "preview_audio_url"
        case description
        case isPremium = "is_premium"
        case language
        case sampleRate = "sample_rate"
        case duration
        case createdAt = "created_at"
        case updatedAt = "updated_at"
    }
}

extension VoiceAccent {
    var displayName: String {
        switch self {
        case .american:
            return "American"
        case .british:
            return "British"
        case .australian:
            return "Australian"
        case .spanish:
            return "Spanish"
        case .french:
            return "French"
        case .german:
            return "German"
        case .italian:
            return "Italian"
        case .russian:
            return "Russian"
        case .neutral:
            return "Neutral"
        }
    }
}

extension VoiceGender {
    var displayName: String {
        switch self {
        case .male:
            return "Male"
        case .female:
            return "Female"
        case .neutral:
            return "Neutral"
        }
    }
}

struct VoiceFilter {
    var gender: VoiceGender?
    var accent: VoiceAccent?
    var isPremium: Bool?
    var language: String?
    
    func matches(_ voice: Voice) -> Bool {
        if let gender = gender, voice.gender != gender {
            return false
        }
        if let accent = accent, voice.accent != accent {
            return false
        }
        if let isPremium = isPremium, voice.isPremium != isPremium {
            return false
        }
        if let language = language, voice.language != language {
            return false
        }
        return true
    }
}

extension Voice {
    static let mockVoices: [Voice] = [
        Voice(
            name: "Sarah",
            gender: .female,
            accent: .american,
            previewAudioUrl: "https://example.com/voices/sarah_preview.mp3",
            description: "Calm and soothing female voice with American accent",
            isPremium: false,
            language: "en",
            duration: 30
        ),
        Voice(
            name: "James",
            gender: .male,
            accent: .british,
            previewAudioUrl: "https://example.com/voices/james_preview.mp3",
            description: "Deep and reassuring male voice with British accent",
            isPremium: false,
            language: "en",
            duration: 30
        ),
        Voice(
            name: "Emma",
            gender: .female,
            accent: .australian,
            previewAudioUrl: "https://example.com/voices/emma_preview.mp3",
            description: "Gentle and warm female voice with Australian accent",
            isPremium: true,
            language: "en",
            duration: 30
        ),
        Voice(
            name: "Michael",
            gender: .male,
            accent: .american,
            previewAudioUrl: "https://example.com/voices/michael_preview.mp3",
            description: "Professional and confident male voice",
            isPremium: false,
            language: "en",
            duration: 30
        ),
        Voice(
            name: "Sofia",
            gender: .female,
            accent: .spanish,
            previewAudioUrl: "https://example.com/voices/sofia_preview.mp3",
            description: "Melodic female voice with Spanish accent",
            isPremium: true,
            language: "es",
            duration: 30
        )
    ]
    
    static var defaultVoice: Voice {
        mockVoices[0]
    }
}

struct VoicePlaybackState {
    let voice: Voice
    var isPlaying: Bool
    var currentTime: TimeInterval
    var duration: TimeInterval
    var isLoading: Bool
    var error: Error?
    
    init(
        voice: Voice,
        isPlaying: Bool = false,
        currentTime: TimeInterval = 0,
        duration: TimeInterval = 0,
        isLoading: Bool = false,
        error: Error? = nil
    ) {
        self.voice = voice
        self.isPlaying = isPlaying
        self.currentTime = currentTime
        self.duration = duration
        self.isLoading = isLoading
        self.error = error
    }
    
    var progress: Double {
        guard duration > 0 else { return 0 }
        return currentTime / duration
    }
}

extension Voice {
    func toSupabaseDict() -> [String: Any] {
        var dict: [String: Any] = [
            "id": id.uuidString,
            "name": name,
            "gender": gender.rawValue,
            "accent": accent.rawValue,
            "preview_audio_url": previewAudioUrl,
            "is_premium": isPremium,
            "language": language,
            "sample_rate": sampleRate,
            "duration": duration,
            "created_at": ISO8601DateFormatter().string(from: createdAt)
        ]
        
        if let description = description {
            dict["description"] = description
        }
        
        if let updatedAt = updatedAt {
            dict["updated_at"] = ISO8601DateFormatter().string(from: updatedAt)
        }
        
        return dict
    }
    
    static func fromSupabaseDict(_ dict: [String: Any]) -> Voice? {
        guard
            let idString = dict["id"] as? String,
            let id = UUID(uuidString: idString),
            let name = dict["name"] as? String,
            let genderString = dict["gender"] as? String,
            let gender = VoiceGender(rawValue: genderString),
            let accentString = dict["accent"] as? String,
            let accent = VoiceAccent(rawValue: accentString),
            let previewAudioUrl = dict["preview_audio_url"] as? String
        else {
            return nil
        }
        
        let description = dict["description"] as? String
        let isPremium = dict["is_premium"] as? Bool ?? false
        let language = dict["language"] as? String ?? "en"
        let sampleRate = dict["sample_rate"] as? Int ?? 44100
        let duration = dict["duration"] as? TimeInterval ?? 30
        
        let createdAt: Date
        if let createdAtString = dict["created_at"] as? String,
           let date = ISO8601DateFormatter().date(from: createdAtString) {
            createdAt = date
        } else {
            createdAt = Date()
        }
        
        let updatedAt: Date?
        if let updatedAtString = dict["updated_at"] as? String {
            updatedAt = ISO8601DateFormatter().date(from: updatedAtString)
        } else {
            updatedAt = nil
        }
        
        return Voice(
            id: id,
            name: name,
            gender: gender,
            accent: accent,
            previewAudioUrl: previewAudioUrl,
            description: description,
            isPremium: isPremium,
            language: language,
            sampleRate: sampleRate,
            duration: duration,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }
}