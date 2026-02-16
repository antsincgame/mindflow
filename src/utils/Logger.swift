import Foundation
import os.log

enum LogLevel: String {
    case debug = "🔍 DEBUG"
    case info = "ℹ️ INFO"
    case warning = "⚠️ WARNING"
    case error = "❌ ERROR"
    case critical = "🔥 CRITICAL"
    
    var osLogType: OSLogType {
        switch self {
        case .debug:
            return .debug
        case .info:
            return .info
        case .warning:
            return .default
        case .error:
            return .error
        case .critical:
            return .fault
        }
    }
}

enum LogCategory: String {
    case general = "General"
    case network = "Network"
    case database = "Database"
    case healthKit = "HealthKit"
    case calendar = "Calendar"
    case notification = "Notification"
    case audio = "Audio"
    case meditation = "Meditation"
    case stressAnalysis = "StressAnalysis"
    case ui = "UI"
    case authentication = "Authentication"
    case achievement = "Achievement"
}

final class Logger {
    static let shared = Logger()
    
    private let subsystem = Bundle.main.bundleIdentifier ?? "com.mindflow.app"
    private var loggers: [LogCategory: OSLog] = [:]
    
    #if DEBUG
    private var isEnabled = true
    private var minimumLevel: LogLevel = .debug
    #else
    private var isEnabled = true
    private var minimumLevel: LogLevel = .info
    #endif
    
    private var logFileURL: URL?
    private let fileManager = FileManager.default
    private let maxLogFileSize: UInt64 = 5 * 1024 * 1024 // 5 MB
    private let maxLogFiles = 3
    
    private init() {
        setupLoggers()
        setupLogFile()
    }
    
    private func setupLoggers() {
        LogCategory.allCases.forEach { category in
            loggers[category] = OSLog(subsystem: subsystem, category: category.rawValue)
        }
    }
    
    private func setupLogFile() {
        guard let documentsDirectory = fileManager.urls(for: .documentDirectory, in: .userDomainMask).first else {
            return
        }
        
        let logsDirectory = documentsDirectory.appendingPathComponent("Logs", isDirectory: true)
        
        if !fileManager.fileExists(atPath: logsDirectory.path) {
            try? fileManager.createDirectory(at: logsDirectory, withIntermediateDirectories: true)
        }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd"
        let dateString = dateFormatter.string(from: Date())
        
        logFileURL = logsDirectory.appendingPathComponent("mindflow-\(dateString).log")
        
        rotateLogsIfNeeded()
    }
    
    private func rotateLogsIfNeeded() {
        guard let logFileURL = logFileURL,
              fileManager.fileExists(atPath: logFileURL.path) else {
            return
        }
        
        guard let attributes = try? fileManager.attributesOfItem(atPath: logFileURL.path),
              let fileSize = attributes[.size] as? UInt64,
              fileSize >= maxLogFileSize else {
            return
        }
        
        let logsDirectory = logFileURL.deletingLastPathComponent()
        
        guard let logFiles = try? fileManager.contentsOfDirectory(at: logsDirectory, includingPropertiesForKeys: [.creationDateKey], options: .skipsHiddenFiles) else {
            return
        }
        
        let sortedLogFiles = logFiles.sorted { url1, url2 in
            let date1 = (try? url1.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? Date.distantPast
            let date2 = (try? url2.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? Date.distantPast
            return date1 > date2
        }
        
        if sortedLogFiles.count >= maxLogFiles {
            let filesToDelete = sortedLogFiles.dropFirst(maxLogFiles - 1)
            filesToDelete.forEach { url in
                try? fileManager.removeItem(at: url)
            }
        }
        
        setupLogFile()
    }
    
    private func shouldLog(level: LogLevel) -> Bool {
        guard isEnabled else { return false }
        
        let levels: [LogLevel] = [.debug, .info, .warning, .error, .critical]
        guard let currentIndex = levels.firstIndex(of: minimumLevel),
              let levelIndex = levels.firstIndex(of: level) else {
            return false
        }
        
        return levelIndex >= currentIndex
    }
    
    private func getLogger(for category: LogCategory) -> OSLog {
        return loggers[category] ?? OSLog.default
    }
    
    private func formatMessage(level: LogLevel, category: LogCategory, message: String, file: String, function: String, line: Int) -> String {
        let timestamp = ISO8601DateFormatter().string(from: Date())
        let fileName = (file as NSString).lastPathComponent
        return "[\(timestamp)] \(level.rawValue) [\(category.rawValue)] \(fileName):\(line) \(function) - \(message)"
    }
    
    private func writeToFile(_ message: String) {
        guard let logFileURL = logFileURL else { return }
        
        let formattedMessage = message + "\n"
        
        if let data = formattedMessage.data(using: .utf8) {
            if fileManager.fileExists(atPath: logFileURL.path) {
                if let fileHandle = try? FileHandle(forWritingTo: logFileURL) {
                    fileHandle.seekToEndOfFile()
                    fileHandle.write(data)
                    fileHandle.closeFile()
                }
            } else {
                try? data.write(to: logFileURL)
            }
        }
        
        rotateLogsIfNeeded()
    }
    
    func debug(_ message: String, category: LogCategory = .general, file: String = #file, function: String = #function, line: Int = #line) {
        log(level: .debug, message: message, category: category, file: file, function: function, line: line)
    }
    
    func info(_ message: String, category: LogCategory = .general, file: String = #file, function: String = #function, line: Int = #line) {
        log(level: .info, message: message, category: category, file: file, function: function, line: line)
    }
    
    func warning(_ message: String, category: LogCategory = .general, file: String = #file, function: String = #function, line: Int = #line) {
        log(level: .warning, message: message, category: category, file: file, function: function, line: line)
    }
    
    func error(_ message: String, error: Error? = nil, category: LogCategory = .general, file: String = #file, function: String = #function, line: Int = #line) {
        var fullMessage = message
        if let error = error {
            fullMessage += " | Error: \(error.localizedDescription)"
        }
        log(level: .error, message: fullMessage, category: category, file: file, function: function, line: line)
    }
    
    func critical(_ message: String, error: Error? = nil, category: LogCategory = .general, file: String = #file, function: String = #function, line: Int = #line) {
        var fullMessage = message
        if let error = error {
            fullMessage += " | Error: \(error.localizedDescription)"
        }
        log(level: .critical, message: fullMessage, category: category, file: file, function: function, line: line)
    }
    
    private func log(level: LogLevel, message: String, category: LogCategory, file: String, function: String, line: Int) {
        guard shouldLog(level: level) else { return }
        
        let formattedMessage = formatMessage(level: level, category: category, message: message, file: file, function: function, line: line)
        
        let logger = getLogger(for: category)
        os_log("%{public}@", log: logger, type: level.osLogType, formattedMessage)
        
        #if DEBUG
        print(formattedMessage)
        #endif
        
        if level == .error || level == .critical {
            writeToFile(formattedMessage)
        }
    }
    
    func setEnabled(_ enabled: Bool) {
        isEnabled = enabled
    }
    
    func setMinimumLevel(_ level: LogLevel) {
        minimumLevel = level
    }
    
    func getLogFiles() -> [URL] {
        guard let logFileURL = logFileURL else { return [] }
        
        let logsDirectory = logFileURL.deletingLastPathComponent()
        
        guard let logFiles = try? fileManager.contentsOfDirectory(at: logsDirectory, includingPropertiesForKeys: [.creationDateKey], options: .skipsHiddenFiles) else {
            return []
        }
        
        return logFiles.sorted { url1, url2 in
            let date1 = (try? url1.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? Date.distantPast
            let date2 = (try? url2.resourceValues(forKeys: [.creationDateKey]))?.creationDate ?? Date.distantPast
            return date1 > date2
        }
    }
    
    func clearLogs() {
        guard let logFileURL = logFileURL else { return }
        
        let logsDirectory = logFileURL.deletingLastPathComponent()
        
        guard let logFiles = try? fileManager.contentsOfDirectory(at: logsDirectory, includingPropertiesForKeys: nil, options: .skipsHiddenFiles) else {
            return
        }
        
        logFiles.forEach { url in
            try? fileManager.removeItem(at: url)
        }
        
        setupLogFile()
    }
}

extension LogCategory: CaseIterable {}