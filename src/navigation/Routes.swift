import Foundation

enum Routes: Hashable, Equatable {
    // MARK: - Authentication & Onboarding
    case onboarding
    case permissionsSetup
    case voiceSelection
    
    // MARK: - Main Navigation
    case home
    case meditationSession(exerciseId: String, stressLevel: Int)
    case sessionResult(sessionId: String)
    case progress
    case settings
    
    // MARK: - Exercise & Voice
    case exerciseSelection(recommendedId: String?, alternatives: [String])
    case voiceLibrary
    case voicePreview(voiceId: String)
    
    // MARK: - Settings & Profile
    case notificationSettings
    case healthKitSettings
    case calendarSettings
    case sessionIntervalSettings
    case privacyPolicy
    case termsOfService
    case about
    
    // MARK: - Progress & Achievements
    case achievementDetails(achievementId: String)
    case sessionHistory
    case stressAnalytics
    case streakDetails
    
    // MARK: - Helper Properties
    var id: String {
        switch self {
        case .onboarding:
            return "onboarding"
        case .permissionsSetup:
            return "permissionsSetup"
        case .voiceSelection:
            return "voiceSelection"
        case .home:
            return "home"
        case .meditationSession(let exerciseId, let stressLevel):
            return "meditationSession_\(exerciseId)_\(stressLevel)"
        case .sessionResult(let sessionId):
            return "sessionResult_\(sessionId)"
        case .progress:
            return "progress"
        case .settings:
            return "settings"
        case .exerciseSelection(let recommendedId, let alternatives):
            return "exerciseSelection_\(recommendedId ?? "none")_\(alternatives.joined(separator: "_"))"
        case .voiceLibrary:
            return "voiceLibrary"
        case .voicePreview(let voiceId):
            return "voicePreview_\(voiceId)"
        case .notificationSettings:
            return "notificationSettings"
        case .healthKitSettings:
            return "healthKitSettings"
        case .calendarSettings:
            return "calendarSettings"
        case .sessionIntervalSettings:
            return "sessionIntervalSettings"
        case .privacyPolicy:
            return "privacyPolicy"
        case .termsOfService:
            return "termsOfService"
        case .about:
            return "about"
        case .achievementDetails(let achievementId):
            return "achievementDetails_\(achievementId)"
        case .sessionHistory:
            return "sessionHistory"
        case .stressAnalytics:
            return "stressAnalytics"
        case .streakDetails:
            return "streakDetails"
        }
    }
    
    var title: String {
        switch self {
        case .onboarding:
            return "Добро пожаловать"
        case .permissionsSetup:
            return "Разрешения"
        case .voiceSelection:
            return "Выбор голоса"
        case .home:
            return "Главная"
        case .meditationSession:
            return "Медитация"
        case .sessionResult:
            return "Результат"
        case .progress:
            return "Прогресс"
        case .settings:
            return "Настройки"
        case .exerciseSelection:
            return "Выбор упражнения"
        case .voiceLibrary:
            return "Библиотека голосов"
        case .voicePreview:
            return "Прослушать голос"
        case .notificationSettings:
            return "Уведомления"
        case .healthKitSettings:
            return "HealthKit"
        case .calendarSettings:
            return "Календарь"
        case .sessionIntervalSettings:
            return "Интервал между сессиями"
        case .privacyPolicy:
            return "Политика конфиденциальности"
        case .termsOfService:
            return "Условия использования"
        case .about:
            return "О приложении"
        case .achievementDetails:
            return "Достижение"
        case .sessionHistory:
            return "История сессий"
        case .stressAnalytics:
            return "Аналитика стресса"
        case .streakDetails:
            return "Стрики"
        }
    }
    
    var requiresAuth: Bool {
        switch self {
        case .onboarding, .permissionsSetup, .voiceSelection:
            return false
        default:
            return true
        }
    }
    
    var showsInTabBar: Bool {
        switch self {
        case .home, .progress, .settings:
            return true
        default:
            return false
        }
    }
    
    var tabBarIcon: String {
        switch self {
        case .home:
            return "house.fill"
        case .progress:
            return "chart.bar.fill"
        case .settings:
            return "gearshape.fill"
        default:
            return ""
        }
    }
    
    var tabBarTitle: String {
        switch self {
        case .home:
            return "Главная"
        case .progress:
            return "Прогресс"
        case .settings:
            return "Настройки"
        default:
            return ""
        }
    }
    
    var isModal: Bool {
        switch self {
        case .meditationSession, .sessionResult, .voicePreview, .exerciseSelection:
            return true
        default:
            return false
        }
    }
    
    var allowsSwipeBack: Bool {
        switch self {
        case .meditationSession:
            return false
        default:
            return true
        }
    }
    
    var hidesTabBar: Bool {
        switch self {
        case .meditationSession, .sessionResult, .onboarding, .permissionsSetup, .voiceSelection:
            return true
        default:
            return false
        }
    }
    
    // MARK: - Navigation Methods
    static func initial(isAuthenticated: Bool, hasCompletedOnboarding: Bool) -> Routes {
        if !hasCompletedOnboarding {
            return .onboarding
        }
        return isAuthenticated ? .home : .onboarding
    }
    
    func canNavigate(from currentRoute: Routes) -> Bool {
        // Prevent navigation away from active meditation session
        if case .meditationSession = currentRoute {
            return false
        }
        return true
    }
    
    // MARK: - Deep Link Support
    static func from(deepLink: URL) -> Routes? {
        guard let components = URLComponents(url: deepLink, resolvingAgainstBaseURL: true),
              let host = components.host else {
            return nil
        }
        
        switch host {
        case "meditation":
            if let exerciseId = components.queryItems?.first(where: { $0.name == "exerciseId" })?.value,
               let stressLevelString = components.queryItems?.first(where: { $0.name == "stressLevel" })?.value,
               let stressLevel = Int(stressLevelString) {
                return .meditationSession(exerciseId: exerciseId, stressLevel: stressLevel)
            }
        case "progress":
            return .progress
        case "settings":
            return .settings
        case "achievement":
            if let achievementId = components.queryItems?.first(where: { $0.name == "id" })?.value {
                return .achievementDetails(achievementId: achievementId)
            }
        case "voice":
            if let voiceId = components.queryItems?.first(where: { $0.name == "id" })?.value {
                return .voicePreview(voiceId: voiceId)
            }
        default:
            break
        }
        
        return .home
    }
    
    func toDeepLink() -> URL? {
        var components = URLComponents()
        components.scheme = "mindflow"
        
        switch self {
        case .home:
            components.host = "home"
        case .meditationSession(let exerciseId, let stressLevel):
            components.host = "meditation"
            components.queryItems = [
                URLQueryItem(name: "exerciseId", value: exerciseId),
                URLQueryItem(name: "stressLevel", value: String(stressLevel))
            ]
        case .progress:
            components.host = "progress"
        case .settings:
            components.host = "settings"
        case .achievementDetails(let achievementId):
            components.host = "achievement"
            components.queryItems = [URLQueryItem(name: "id", value: achievementId)]
        case .voicePreview(let voiceId):
            components.host = "voice"
            components.queryItems = [URLQueryItem(name: "id", value: voiceId)]
        default:
            return nil
        }
        
        return components.url
    }
}

// MARK: - Route Groups
extension Routes {
    enum Group {
        case onboarding
        case main
        case settings
        case progress
        
        var routes: [Routes] {
            switch self {
            case .onboarding:
                return [.onboarding, .permissionsSetup, .voiceSelection]
            case .main:
                return [.home, .exerciseSelection(recommendedId: nil, alternatives: [])]
            case .settings:
                return [.settings, .notificationSettings, .healthKitSettings, .calendarSettings, .sessionIntervalSettings, .voiceLibrary]
            case .progress:
                return [.progress, .sessionHistory, .stressAnalytics, .streakDetails]
            }
        }
    }
}

// MARK: - Navigation Transitions
extension Routes {
    enum Transition {
        case push
        case present
        case replace
        case dismiss
        
        static func `for`(route: Routes) -> Transition {
            if route.isModal {
                return .present
            }
            return .push
        }
    }
}