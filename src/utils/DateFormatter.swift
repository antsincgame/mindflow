import Foundation

enum DateFormatter {
    private static let calendar = Calendar.current
    
    // MARK: - Date Formatters
    
    private static let shortDateFormatter: Foundation.DateFormatter = {
        let formatter = Foundation.DateFormatter()
        formatter.dateStyle = .short
        formatter.timeStyle = .none
        formatter.locale = Locale.current
        return formatter
    }()
    
    private static let mediumDateFormatter: Foundation.DateFormatter = {
        let formatter = Foundation.DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        formatter.locale = Locale.current
        return formatter
    }()
    
    private static let longDateFormatter: Foundation.DateFormatter = {
        let formatter = Foundation.DateFormatter()
        formatter.dateStyle = .long
        formatter.timeStyle = .none
        formatter.locale = Locale.current
        return formatter
    }()
    
    private static let timeFormatter: Foundation.DateFormatter = {
        let formatter = Foundation.DateFormatter()
        formatter.dateStyle = .none
        formatter.timeStyle = .short
        formatter.locale = Locale.current
        return formatter
    }()
    
    private static let dateTimeFormatter: Foundation.DateFormatter = {
        let formatter = Foundation.DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        formatter.locale = Locale.current
        return formatter
    }()
    
    private static let iso8601Formatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()
    
    private static let relativeDateFormatter: RelativeDateTimeFormatter = {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .full
        formatter.locale = Locale.current
        return formatter
    }()
    
    private static let shortRelativeDateFormatter: RelativeDateTimeFormatter = {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        formatter.locale = Locale.current
        return formatter
    }()
    
    // MARK: - Public Methods
    
    /// Форматирует дату в короткий формат (например, "12/31/23")
    static func shortDate(_ date: Date) -> String {
        return shortDateFormatter.string(from: date)
    }
    
    /// Форматирует дату в средний формат (например, "Dec 31, 2023")
    static func mediumDate(_ date: Date) -> String {
        return mediumDateFormatter.string(from: date)
    }
    
    /// Форматирует дату в длинный формат (например, "December 31, 2023")
    static func longDate(_ date: Date) -> String {
        return longDateFormatter.string(from: date)
    }
    
    /// Форматирует время (например, "2:30 PM")
    static func time(_ date: Date) -> String {
        return timeFormatter.string(from: date)
    }
    
    /// Форматирует дату и время (например, "Dec 31, 2023 at 2:30 PM")
    static func dateTime(_ date: Date) -> String {
        return dateTimeFormatter.string(from: date)
    }
    
    /// Форматирует дату в ISO8601 формат для API
    static func iso8601(_ date: Date) -> String {
        return iso8601Formatter.string(from: date)
    }
    
    /// Парсит ISO8601 строку в Date
    static func fromISO8601(_ string: String) -> Date? {
        return iso8601Formatter.date(from: string)
    }
    
    /// Форматирует дату относительно текущего момента (например, "2 hours ago", "in 3 days")
    static func relativeDate(_ date: Date) -> String {
        return relativeDateFormatter.localizedString(for: date, relativeTo: Date())
    }
    
    /// Форматирует дату относительно текущего момента в коротком формате (например, "2 hr ago", "in 3 days")
    static func shortRelativeDate(_ date: Date) -> String {
        return shortRelativeDateFormatter.localizedString(for: date, relativeTo: Date())
    }
    
    /// Форматирует длительность в секундах в читаемый формат (например, "5:30", "1:02:15")
    static func duration(seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60
        
        if hours > 0 {
            return String(format: "%d:%02d:%02d", hours, minutes, secs)
        } else {
            return String(format: "%d:%02d", minutes, secs)
        }
    }
    
    /// Форматирует длительность в секундах в читаемый текст (например, "5 минут 30 секунд")
    static func durationText(seconds: Int) -> String {
        let hours = seconds / 3600
        let minutes = (seconds % 3600) / 60
        let secs = seconds % 60
        
        var components: [String] = []
        
        if hours > 0 {
            components.append("\(hours) \(pluralize(hours, "час", "часа", "часов"))")
        }
        
        if minutes > 0 {
            components.append("\(minutes) \(pluralize(minutes, "минута", "минуты", "минут"))")
        }
        
        if secs > 0 && hours == 0 {
            components.append("\(secs) \(pluralize(secs, "секунда", "секунды", "секунд"))")
        }
        
        return components.joined(separator: " ")
    }
    
    /// Форматирует дату для экрана прогресса (например, "Сегодня", "Вчера", "15 декабря")
    static func progressDate(_ date: Date) -> String {
        if calendar.isDateInToday(date) {
            return NSLocalizedString("Сегодня", comment: "Today")
        } else if calendar.isDateInYesterday(date) {
            return NSLocalizedString("Вчера", comment: "Yesterday")
        } else if calendar.isDate(date, equalTo: Date(), toGranularity: .weekOfYear) {
            let formatter = Foundation.DateFormatter()
            formatter.dateFormat = "EEEE"
            formatter.locale = Locale.current
            return formatter.string(from: date)
        } else {
            let formatter = Foundation.DateFormatter()
            formatter.dateFormat = "d MMMM"
            formatter.locale = Locale.current
            return formatter.string(from: date)
        }
    }
    
    /// Форматирует дату для уведомлений (например, "сейчас", "5 минут назад", "в 14:30")
    static func notificationDate(_ date: Date) -> String {
        let now = Date()
        let interval = now.timeIntervalSince(date)
        
        if interval < 60 {
            return NSLocalizedString("сейчас", comment: "now")
        } else if interval < 3600 {
            let minutes = Int(interval / 60)
            return "\(minutes) \(pluralize(minutes, "минуту", "минуты", "минут")) назад"
        } else if calendar.isDateInToday(date) {
            return "в \(time(date))"
        } else if calendar.isDateInYesterday(date) {
            return "вчера в \(time(date))"
        } else {
            return dateTime(date)
        }
    }
    
    /// Форматирует дату для календарного события (например, "Сегодня в 14:30", "Завтра в 10:00", "31 декабря в 18:00")
    static func calendarEventDate(_ date: Date) -> String {
        if calendar.isDateInToday(date) {
            return "Сегодня в \(time(date))"
        } else if calendar.isDateInTomorrow(date) {
            return "Завтра в \(time(date))"
        } else if calendar.isDate(date, equalTo: Date(), toGranularity: .weekOfYear) {
            let formatter = Foundation.DateFormatter()
            formatter.dateFormat = "EEEE"
            formatter.locale = Locale.current
            return "\(formatter.string(from: date)) в \(time(date))"
        } else {
            let formatter = Foundation.DateFormatter()
            formatter.dateFormat = "d MMMM"
            formatter.locale = Locale.current
            return "\(formatter.string(from: date)) в \(time(date))"
        }
    }
    
    /// Форматирует временной интервал до события (например, "через 30 минут", "через 2 часа")
    static func timeUntil(_ date: Date) -> String {
        let now = Date()
        let interval = date.timeIntervalSince(now)
        
        if interval < 0 {
            return NSLocalizedString("прошло", comment: "past")
        } else if interval < 60 {
            return NSLocalizedString("менее минуты", comment: "less than a minute")
        } else if interval < 3600 {
            let minutes = Int(interval / 60)
            return "через \(minutes) \(pluralize(minutes, "минуту", "минуты", "минут"))"
        } else if interval < 86400 {
            let hours = Int(interval / 3600)
            return "через \(hours) \(pluralize(hours, "час", "часа", "часов"))"
        } else {
            let days = Int(interval / 86400)
            return "через \(days) \(pluralize(days, "день", "дня", "дней"))"
        }
    }
    
    /// Проверяет, является ли дата сегодня
    static func isToday(_ date: Date) -> Bool {
        return calendar.isDateInToday(date)
    }
    
    /// Проверяет, является ли дата вчера
    static func isYesterday(_ date: Date) -> Bool {
        return calendar.isDateInYesterday(date)
    }
    
    /// Проверяет, является ли дата завтра
    static func isTomorrow(_ date: Date) -> Bool {
        return calendar.isDateInTomorrow(date)
    }
    
    /// Проверяет, находятся ли две даты в одном дне
    static func isSameDay(_ date1: Date, _ date2: Date) -> Bool {
        return calendar.isDate(date1, inSameDayAs: date2)
    }
    
    /// Возвращает начало дня для даты
    static func startOfDay(_ date: Date) -> Date {
        return calendar.startOfDay(for: date)
    }
    
    /// Возвращает конец дня для даты
    static func endOfDay(_ date: Date) -> Date {
        var components = DateComponents()
        components.day = 1
        components.second = -1
        return calendar.date(byAdding: components, to: startOfDay(date)) ?? date
    }
    
    /// Возвращает начало недели для даты
    static func startOfWeek(_ date: Date) -> Date {
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return calendar.date(from: components) ?? date
    }
    
    /// Возвращает начало месяца для даты
    static func startOfMonth(_ date: Date) -> Date {
        let components = calendar.dateComponents([.year, .month], from: date)
        return calendar.date(from: components) ?? date
    }
    
    /// Возвращает количество дней между датами
    static func daysBetween(_ date1: Date, _ date2: Date) -> Int {
        let components = calendar.dateComponents([.day], from: startOfDay(date1), to: startOfDay(date2))
        return abs(components.day ?? 0)
    }
    
    /// Возвращает дату N дней назад/вперед
    static func dateByAdding(days: Int, to date: Date = Date()) -> Date {
        return calendar.date(byAdding: .day, value: days, to: date) ?? date
    }
    
    /// Возвращает дату N часов назад/вперед
    static func dateByAdding(hours: Int, to date: Date = Date()) -> Date {
        return calendar.date(byAdding: .hour, value: hours, to: date) ?? date
    }
    
    /// Возвращает дату N минут назад/вперед
    static func dateByAdding(minutes: Int, to date: Date = Date()) -> Date {
        return calendar.date(byAdding: .minute, value: minutes, to: date) ?? date
    }
    
    /// Форматирует дату для отображения стрика (например, "5 дней подряд")
    static func streakText(days: Int) -> String {
        return "\(days) \(pluralize(days, "день", "дня", "дней")) подряд"
    }
    
    /// Форматирует общее время медитации (например, "12 часов 30 минут")
    static func totalMeditationTime(minutes: Int) -> String {
        let hours = minutes / 60
        let mins = minutes % 60
        
        if hours > 0 && mins > 0 {
            return "\(hours) \(pluralize(hours, "час", "часа", "часов")) \(mins) \(pluralize(mins, "минута", "минуты", "минут"))"
        } else if hours > 0 {
            return "\(hours) \(pluralize(hours, "час", "часа", "часов"))"
        } else {
            return "\(mins) \(pluralize(mins, "минута", "минуты", "минут"))"
        }
    }
    
    // MARK: - Private Helpers
    
    /// Плюрализация русских слов
    private static func pluralize(_ count: Int, _ one: String, _ few: String, _ many: String) -> String {
        let mod10 = count % 10
        let mod100 = count % 100
        
        if mod10 == 1 && mod100 != 11 {
            return one
        } else if (2...4).contains(mod10) && !(12...14).contains(mod100) {
            return few
        } else {
            return many
        }
    }
}

// MARK: - Date Extensions

extension Date {
    /// Форматирует дату в короткий формат
    var shortDate: String {
        DateFormatter.shortDate(self)
    }
    
    /// Форматирует дату в средний формат
    var mediumDate: String {
        DateFormatter.mediumDate(self)
    }
    
    /// Форматирует дату в длинный формат
    var longDate: String {
        DateFormatter.longDate(self)
    }
    
    /// Форматирует время
    var time: String {
        DateFormatter.time(self)
    }
    
    /// Форматирует дату и время
    var dateTime: String {
        DateFormatter.dateTime(self)
    }
    
    /// Форматирует дату в ISO8601
    var iso8601: String {
        DateFormatter.iso8601(self)
    }
    
    /// Форматирует дату относительно текущего момента
    var relativeDate: String {
        DateFormatter.relativeDate(self)
    }
    
    /// Фор