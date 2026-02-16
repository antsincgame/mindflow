import Foundation
import HealthKit
import EventKit
import UserNotifications

enum ValidationError: LocalizedError {
    case invalidEmail
    case emptyField
    case invalidStressLevel
    case invalidDuration
    case invalidRating
    case invalidSessionInterval
    case permissionDenied(String)
    case invalidVoiceID
    case invalidExerciseID
    case invalidAudioURL
    case invalidDateRange
    case futureDate
    case invalidStreak
    case invalidPhoneNumber
    case passwordTooShort
    case passwordTooWeak
    case invalidURL
    
    var errorDescription: String? {
        switch self {
        case .invalidEmail:
            return "Неверный формат email"
        case .emptyField:
            return "Поле не может быть пустым"
        case .invalidStressLevel:
            return "Уровень стресса должен быть от 1 до 10"
        case .invalidDuration:
            return "Длительность должна быть положительным числом"
        case .invalidRating:
            return "Оценка должна быть от 1 до 5"
        case .invalidSessionInterval:
            return "Интервал между сессиями должен быть от 1 до 8 часов"
        case .permissionDenied(let permission):
            return "Доступ к \(permission) запрещен"
        case .invalidVoiceID:
            return "Неверный идентификатор голоса"
        case .invalidExerciseID:
            return "Неверный идентификатор упражнения"
        case .invalidAudioURL:
            return "Неверный URL аудио файла"
        case .invalidDateRange:
            return "Неверный диапазон дат"
        case .futureDate:
            return "Дата не может быть в будущем"
        case .invalidStreak:
            return "Стрик должен быть неотрицательным числом"
        case .invalidPhoneNumber:
            return "Неверный формат номера телефона"
        case .passwordTooShort:
            return "Пароль должен содержать минимум 8 символов"
        case .passwordTooWeak:
            return "Пароль должен содержать буквы, цифры и специальные символы"
        case .invalidURL:
            return "Неверный формат URL"
        }
    }
}

struct Validator {
    
    // MARK: - Email Validation
    
    static func validateEmail(_ email: String) throws {
        let trimmed = email.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !trimmed.isEmpty else {
            throw ValidationError.emptyField
        }
        
        let emailRegex = "^[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}$"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        
        guard emailPredicate.evaluate(with: trimmed) else {
            throw ValidationError.invalidEmail
        }
    }
    
    static func isValidEmail(_ email: String) -> Bool {
        do {
            try validateEmail(email)
            return true
        } catch {
            return false
        }
    }
    
    // MARK: - Password Validation
    
    static func validatePassword(_ password: String) throws {
        guard !password.isEmpty else {
            throw ValidationError.emptyField
        }
        
        guard password.count >= 8 else {
            throw ValidationError.passwordTooShort
        }
        
        let hasLetter = password.rangeOfCharacter(from: .letters) != nil
        let hasNumber = password.rangeOfCharacter(from: .decimalDigits) != nil
        let hasSpecial = password.rangeOfCharacter(from: CharacterSet(charactersIn: "!@#$%^&*()_+-=[]{}|;:,.<>?")) != nil
        
        guard hasLetter && hasNumber && hasSpecial else {
            throw ValidationError.passwordTooWeak
        }
    }
    
    static func isValidPassword(_ password: String) -> Bool {
        do {
            try validatePassword(password)
            return true
        } catch {
            return false
        }
    }
    
    // MARK: - Stress Level Validation
    
    static func validateStressLevel(_ level: Int) throws {
        guard level >= 1 && level <= 10 else {
            throw ValidationError.invalidStressLevel
        }
    }
    
    static func isValidStressLevel(_ level: Int) -> Bool {
        return level >= 1 && level <= 10
    }
    
    // MARK: - Duration Validation
    
    static func validateDuration(_ seconds: Int) throws {
        guard seconds > 0 else {
            throw ValidationError.invalidDuration
        }
    }
    
    static func isValidDuration(_ seconds: Int) -> Bool {
        return seconds > 0
    }
    
    // MARK: - Rating Validation
    
    static func validateRating(_ rating: Int) throws {
        guard rating >= 1 && rating <= 5 else {
            throw ValidationError.invalidRating
        }
    }
    
    static func isValidRating(_ rating: Int) -> Bool {
        return rating >= 1 && rating <= 5
    }
    
    // MARK: - Session Interval Validation
    
    static func validateSessionInterval(_ hours: Int) throws {
        guard hours >= 1 && hours <= 8 else {
            throw ValidationError.invalidSessionInterval
        }
    }
    
    static func isValidSessionInterval(_ hours: Int) -> Bool {
        return hours >= 1 && hours <= 8
    }
    
    // MARK: - UUID Validation
    
    static func validateUUID(_ uuidString: String) throws {
        guard UUID(uuidString: uuidString) != nil else {
            throw ValidationError.invalidVoiceID
        }
    }
    
    static func isValidUUID(_ uuidString: String) -> Bool {
        return UUID(uuidString: uuidString) != nil
    }
    
    static func validateVoiceID(_ id: String) throws {
        try validateUUID(id)
    }
    
    static func validateExerciseID(_ id: String) throws {
        guard UUID(uuidString: id) != nil else {
            throw ValidationError.invalidExerciseID
        }
    }
    
    // MARK: - URL Validation
    
    static func validateURL(_ urlString: String) throws {
        guard !urlString.isEmpty else {
            throw ValidationError.emptyField
        }
        
        guard URL(string: urlString) != nil else {
            throw ValidationError.invalidURL
        }
    }
    
    static func isValidURL(_ urlString: String) -> Bool {
        do {
            try validateURL(urlString)
            return true
        } catch {
            return false
        }
    }
    
    static func validateAudioURL(_ urlString: String) throws {
        try validateURL(urlString)
        
        let validExtensions = ["mp3", "m4a", "wav", "aac"]
        let url = URL(string: urlString)
        let pathExtension = url?.pathExtension.lowercased() ?? ""
        
        guard validExtensions.contains(pathExtension) else {
            throw ValidationError.invalidAudioURL
        }
    }
    
    static func isValidAudioURL(_ urlString: String) -> Bool {
        do {
            try validateAudioURL(urlString)
            return true
        } catch {
            return false
        }
    }
    
    // MARK: - Date Validation
    
    static func validateDateRange(start: Date, end: Date) throws {
        guard start <= end else {
            throw ValidationError.invalidDateRange
        }
    }
    
    static func validateNotFutureDate(_ date: Date) throws {
        guard date <= Date() else {
            throw ValidationError.futureDate
        }
    }
    
    static func isNotFutureDate(_ date: Date) -> Bool {
        return date <= Date()
    }
    
    // MARK: - Streak Validation
    
    static func validateStreak(_ streak: Int) throws {
        guard streak >= 0 else {
            throw ValidationError.invalidStreak
        }
    }
    
    static func isValidStreak(_ streak: Int) -> Bool {
        return streak >= 0
    }
    
    // MARK: - Phone Number Validation
    
    static func validatePhoneNumber(_ phone: String) throws {
        let trimmed = phone.trimmingCharacters(in: .whitespacesAndNewlines)
        
        guard !trimmed.isEmpty else {
            throw ValidationError.emptyField
        }
        
        let phoneRegex = "^[+]?[0-9]{10,15}$"
        let phonePredicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
        
        guard phonePredicate.evaluate(with: trimmed.replacingOccurrences(of: " ", with: "")) else {
            throw ValidationError.invalidPhoneNumber
        }
    }
    
    static func isValidPhoneNumber(_ phone: String) -> Bool {
        do {
            try validatePhoneNumber(phone)
            return true
        } catch {
            return false
        }
    }
    
    // MARK: - Empty String Validation
    
    static func validateNotEmpty(_ string: String) throws {
        guard !string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw ValidationError.emptyField
        }
    }
    
    static func isNotEmpty(_ string: String) -> Bool {
        return !string.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    // MARK: - Permission Validation
    
    static func validateHealthKitPermission() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            throw ValidationError.permissionDenied("HealthKit")
        }
        
        let healthStore = HKHealthStore()
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        
        let status = healthStore.authorizationStatus(for: heartRateType)
        
        switch status {
        case .notDetermined:
            throw ValidationError.permissionDenied("HealthKit (не запрошено)")
        case .sharingDenied:
            throw ValidationError.permissionDenied("HealthKit")
        case .sharingAuthorized:
            return
        @unknown default:
            throw ValidationError.permissionDenied("HealthKit (неизвестный статус)")
        }
    }
    
    static func isHealthKitAuthorized() -> Bool {
        guard HKHealthStore.isHealthDataAvailable() else {
            return false
        }
        
        let healthStore = HKHealthStore()
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        
        return healthStore.authorizationStatus(for: heartRateType) == .sharingAuthorized
    }
    
    static func validateCalendarPermission() async throws {
        let eventStore = EKEventStore()
        
        if #available(iOS 17.0, *) {
            let status = EKEventStore.authorizationStatus(for: .event)
            
            switch status {
            case .notDetermined:
                throw ValidationError.permissionDenied("Календарь (не запрошено)")
            case .restricted, .denied:
                throw ValidationError.permissionDenied("Календарь")
            case .fullAccess, .writeOnly:
                return
            @unknown default:
                throw ValidationError.permissionDenied("Календарь (неизвестный статус)")
            }
        } else {
            let status = EKEventStore.authorizationStatus(for: .event)
            
            switch status {
            case .notDetermined:
                throw ValidationError.permissionDenied("Календарь (не запрошено)")
            case .restricted, .denied:
                throw ValidationError.permissionDenied("Календарь")
            case .authorized:
                return
            @unknown default:
                throw ValidationError.permissionDenied("Календарь (неизвестный статус)")
            }
        }
    }
    
    static func isCalendarAuthorized() -> Bool {
        if #available(iOS 17.0, *) {
            let status = EKEventStore.authorizationStatus(for: .event)
            return status == .fullAccess || status == .writeOnly
        } else {
            let status = EKEventStore.authorizationStatus(for: .event)
            return status == .authorized
        }
    }
    
    static func validateNotificationPermission() async throws {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        
        switch settings.authorizationStatus {
        case .notDetermined:
            throw ValidationError.permissionDenied("Уведомления (не запрошено)")
        case .denied:
            throw ValidationError.permissionDenied("Уведомления")
        case .authorized, .provisional, .ephemeral:
            return
        @unknown default:
            throw ValidationError.permissionDenied("Уведомления (неизвестный статус)")
        }
    }
    
    static func isNotificationAuthorized() async -> Bool {
        let center = UNUserNotificationCenter.current()
        let settings = await center.notificationSettings()
        
        return settings.authorizationStatus == .authorized ||
               settings.authorizationStatus == .provisional ||
               settings.authorizationStatus == .ephemeral
    }
    
    // MARK: - Combined Validation
    
    static func validateMeditationSession(
        stressBefore: Int,
        stressAfter: Int,
        duration: Int,
        rating: Int?
    ) throws {
        try validateStressLevel(stressBefore)
        try validateStressLevel(stressAfter)
        try validateDuration(duration)
        
        if let rating = rating {
            try validateRating(rating)
        }
    }
    
    static func validateUserSettings(
        email: String,
        sessionInterval: Int,
        voiceID: String?
    ) throws {
        try validateEmail(email)
        try validateSessionInterval(sessionInterval)
        
        if let voiceID = voiceID {
            try validateVoiceID(voiceID)
        }
    }
    
    static func validateProgress(
        totalSessions: Int,
        totalMinutes: Int,
        currentStreak: Int,
        longestStreak: Int
    ) throws {
        guard totalSessions >= 0 else {
            throw ValidationError.invalidDuration
        }
        
        guard totalMinutes >= 0 else {
            throw ValidationError.invalidDuration
        }
        
        try validateStreak(currentStreak)
        try validateStreak(longestStreak)
        
        guard longestStreak >= currentStreak else {
            throw ValidationError.invalidStreak
        }
    }
}