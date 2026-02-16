import Foundation

enum Constants {
    
    // MARK: - Supabase
    enum Supabase {
        static let url = ProcessInfo.processInfo.environment["SUPABASE_URL"] ?? ""
        static let anonKey = ProcessInfo.processInfo.environment["SUPABASE_ANON_KEY"] ?? ""
        static let serviceRoleKey = ProcessInfo.processInfo.environment["SUPABASE_SERVICE_ROLE_KEY"] ?? ""
        
        enum Tables {
            static let users = "users"
            static let meditationSessions = "meditation_sessions"
            static let exercises = "exercises"
            static let voices = "voices"
            static let achievements = "achievements"
            static let userAchievements = "user_achievements"
            static let progress = "progress"
            static let stressLogs = "stress_logs"
            static let notificationHistory = "notification_history"
        }
        
        enum Storage {
            static let voicesBucket = "voices"
            static let exercisesBucket = "exercises"
            static let achievementsBucket = "achievements"
        }
        
        enum RealtimeChannels {
            static let stressUpdates = "stress_updates"
            static let progressUpdates = "progress_updates"
            static let achievementUnlocks = "achievement_unlocks"
        }
    }
    
    // MARK: - API Endpoints
    enum API {
        static let baseURL = Supabase.url
        
        enum Functions {
            static let calculateProgress = "/rest/v1/rpc/calculate_progress"
            static let checkAchievements = "/rest/v1/rpc/check_achievements"
            static let getRecommendation = "/rest/v1/rpc/get_exercise_recommendation"
            static let analyzeStress = "/rest/v1/rpc/analyze_stress"
            static let updateStreak = "/rest/v1/rpc/update_streak"
        }
    }
    
    // MARK: - App Configuration
    enum App {
        static let bundleIdentifier = "com.mindflow.app"
        static let appGroupIdentifier = "group.com.mindflow.app"
        static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
        static let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
        
        enum Widget {
            static let kind = "MindFlowWidget"
            static let displayName = "MindFlow"
            static let description = "Quick meditation access"
        }
    }
    
    // MARK: - Stress Levels
    enum StressLevel {
        static let min = 0
        static let max = 10
        static let low = 0...3
        static let medium = 4...6
        static let high = 7...8
        static let critical = 9...10
        
        static let defaultValue = 5
        
        enum Threshold {
            static let notificationTrigger = 7
            static let instantSessionTrigger = 9
            static let mediumStressPreparation = 4
        }
    }
    
    // MARK: - Session Configuration
    enum Session {
        static let minDurationSeconds = 60
        static let maxDurationSeconds = 1800 // 30 minutes
        static let defaultDurationSeconds = 300 // 5 minutes
        
        enum PreparationTime {
            static let instant = 0
            static let quick = 5
            static let normal = 15
            static let extended = 30
        }
        
        enum IntervalHours {
            static let min = 1
            static let max = 8
            static let defaultValue = 4
        }
        
        enum Rating {
            static let min = 1
            static let max = 5
        }
    }
    
    // MARK: - Exercise Types
    enum ExerciseType {
        static let breathing = "breathing"
        static let mindfulness = "mindfulness"
        static let bodyScan = "body_scan"
        
        static let all = [breathing, mindfulness, bodyScan]
    }
    
    // MARK: - Voice Configuration
    enum Voice {
        enum Gender {
            static let male = "male"
            static let female = "female"
        }
        
        enum Accent {
            static let american = "american"
            static let british = "british"
            static let neutral = "neutral"
        }
        
        static let previewDurationSeconds = 10
    }
    
    // MARK: - Notifications
    enum Notification {
        static let categoryIdentifier = "MEDITATION_REMINDER"
        
        enum ActionIdentifier {
            static let startSession = "START_SESSION"
            static let dismiss = "DISMISS"
            static let snooze = "SNOOZE"
        }
        
        enum Type {
            static let stressDetected = "stress_detected"
            static let sessionReminder = "session_reminder"
            static let streakReminder = "streak_reminder"
            static let achievementUnlocked = "achievement_unlocked"
        }
        
        enum Timing {
            static let snoozeDurationMinutes = 30
            static let adaptiveBackoffHours = 24
            static let maxConsecutiveDismissals = 3
        }
    }
    
    // MARK: - HealthKit
    enum HealthKit {
        static let heartRateSampleInterval: TimeInterval = 60 // 1 minute
        static let activitySampleInterval: TimeInterval = 300 // 5 minutes
        
        enum HeartRate {
            static let restingMin = 40
            static let restingMax = 100
            static let elevatedThreshold = 100
            static let highThreshold = 120
        }
        
        enum Activity {
            static let sedentaryThresholdMinutes = 60
            static let activeThresholdMinutes = 30
        }
    }
    
    // MARK: - Calendar
    enum Calendar {
        static let lookAheadHours = 24
        static let lookBehindHours = 1
        
        enum EventPriority {
            static let high = ["meeting", "presentation", "interview", "deadline"]
            static let medium = ["call", "appointment", "review"]
            static let low = ["reminder", "task"]
        }
        
        enum StressTrigger {
            static let minutesBeforeEvent = 15
            static let backToBackThresholdMinutes = 15
            static let longMeetingThresholdMinutes = 60
        }
    }
    
    // MARK: - Progress & Achievements
    enum Progress {
        static let minSessionsForStats = 3
        static let streakResetHours = 48
        
        enum Streak {
            static let bronze = 3
            static let silver = 7
            static let gold = 14
            static let platinum = 30
            static let diamond = 100
        }
        
        enum TotalSessions {
            static let beginner = 1
            static let novice = 10
            static let intermediate = 25
            static let advanced = 50
            static let expert = 100
            static let master = 250
        }
        
        enum TotalMinutes {
            static let starter = 30
            static let regular = 120
            static let dedicated = 300
            static let committed = 600
            static let devoted = 1200
        }
        
        enum SessionsBeforeMeetings {
            static let aware = 1
            static let prepared = 5
            static let proactive = 12
            static let master = 25
            static let zen = 50
        }
    }
    
    // MARK: - Animation
    enum Animation {
        static let breathingCycleDuration: TimeInterval = 4.0
        static let breathingInDuration: TimeInterval = 4.0
        static let breathingHoldDuration: TimeInterval = 2.0
        static let breathingOutDuration: TimeInterval = 6.0
        
        static let fadeInDuration: TimeInterval = 0.3
        static let fadeOutDuration: TimeInterval = 0.2
        static let transitionDuration: TimeInterval = 0.35
        
        static let pulseMinScale: CGFloat = 0.8
        static let pulseMaxScale: CGFloat = 1.2
    }
    
    // MARK: - UI
    enum UI {
        enum Spacing {
            static let xxs: CGFloat = 4
            static let xs: CGFloat = 8
            static let sm: CGFloat = 12
            static let md: CGFloat = 16
            static let lg: CGFloat = 24
            static let xl: CGFloat = 32
            static let xxl: CGFloat = 48
        }
        
        enum CornerRadius {
            static let small: CGFloat = 8
            static let medium: CGFloat = 12
            static let large: CGFloat = 16
            static let xLarge: CGFloat = 24
        }
        
        enum IconSize {
            static let small: CGFloat = 16
            static let medium: CGFloat = 24
            static let large: CGFloat = 32
            static let xLarge: CGFloat = 48
        }
        
        enum CardHeight {
            static let small: CGFloat = 80
            static let medium: CGFloat = 120
            static let large: CGFloat = 200
        }
    }
    
    // MARK: - Audio
    enum Audio {
        static let fadeInDuration: TimeInterval = 2.0
        static let fadeOutDuration: TimeInterval = 3.0
        static let defaultVolume: Float = 0.7
        static let backgroundMusicVolume: Float = 0.3
        
        enum FileExtension {
            static let mp3 = "mp3"
            static let m4a = "m4a"
            static let wav = "wav"
        }
    }
    
    // MARK: - Cache
    enum Cache {
        static let voicePreviewCacheKey = "voice_preview_cache"
        static let exerciseCacheKey = "exercise_cache"
        static let achievementCacheKey = "achievement_cache"
        
        static let maxCacheAge: TimeInterval = 86400 // 24 hours
        static let maxCacheSize = 50 * 1024 * 1024 // 50 MB
    }
    
    // MARK: - UserDefaults Keys
    enum UserDefaultsKeys {
        static let selectedVoiceId = "selected_voice_id"
        static let sessionIntervalHours = "session_interval_hours"
        static let notificationsEnabled = "notifications_enabled"
        static let hasCompletedOnboarding = "has_completed_onboarding"
        static let lastSessionDate = "last_session_date"
        static let consecutiveDismissals = "consecutive_dismissals"
        static let adaptiveBackoffUntil = "adaptive_backoff_until"
        static let healthKitPermissionGranted = "healthkit_permission_granted"
        static let calendarPermissionGranted = "calendar_permission_granted"
        static let microphonePermissionGranted = "microphone_permission_granted"
    }
    
    // MARK: - Keychain Keys
    enum KeychainKeys {
        static let accessToken = "access_token"
        static let refreshToken = "refresh_token"
        static let userId = "user_id"
    }
    
    // MARK: - Error Messages
    enum ErrorMessage {
        static let networkUnavailable = "Network connection unavailable"
        static let authenticationFailed = "Authentication failed"
        static let healthKitNotAvailable = "HealthKit is not available on this device"
        static let healthKitPermissionDenied = "HealthKit permission denied"
        static let calendarPermissionDenied = "Calendar permission denied"
        static let notificationPermissionDenied = "Notification permission denied"
        static let audioPlaybackFailed = "Audio playback failed"
        static let sessionSaveFailed = "Failed to save session"
        static let unknownError = "An unknown error occurred"
    }
    
    // MARK: - Network
    enum Network {
        static let timeoutInterval: TimeInterval = 30
        static let maxRetryAttempts = 3
        static let retryDelay: TimeInterval = 2
    }
    
    // MARK: - AI Analysis
    enum AIAnalysis {
        static let minDataPointsForAnalysis = 3
        static let contextWindowHours = 24
        static let stressPatternThreshold = 0.7
        static let calendarWeightFactor = 0.4
        static let biometricWeightFactor = 0.4
        static let behaviorWeightFactor = 0.2
    }
    
    // MARK: - Recommendations
    enum Recommendation {
        static let maxAlternatives = 3
        static let contextualFactors = ["time_of_day", "stress_level", "recent_sessions", "calendar_events"]
        
        enum TimeOfDay {
            static let morning = 6...11
            static let afternoon = 12...17
            static let evening = 18...23
            static let night = 0...5
        }
    }
    
    // MARK: - Feature Flags
    enum FeatureFlags {
        static let enableBiometricAnalysis = true
        static let enableCalendarIntegration = true
        static let enableVoiceCustomization = false // Future feature
        static let enableAdvancedAI = true
        static let enableOfflineMode = false // Future feature
    }
}