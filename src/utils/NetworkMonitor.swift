import Foundation
import Network
import Combine

@MainActor
final class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()
    
    @Published private(set) var isConnected: Bool = true
    @Published private(set) var connectionType: ConnectionType = .unknown
    @Published private(set) var isExpensive: Bool = false
    @Published private(set) var isConstrained: Bool = false
    
    private let monitor: NWPathMonitor
    private let monitorQueue = DispatchQueue(label: "com.mindflow.networkmonitor", qos: .utility)
    private var cancellables = Set<AnyCancellable>()
    
    enum ConnectionType: String, Codable {
        case wifi
        case cellular
        case wiredEthernet
        case unknown
        
        var displayName: String {
            switch self {
            case .wifi: return "Wi-Fi"
            case .cellular: return "Cellular"
            case .wiredEthernet: return "Ethernet"
            case .unknown: return "Unknown"
            }
        }
    }
    
    enum NetworkError: LocalizedError {
        case notConnected
        case connectionLost
        case expensiveConnection
        case constrainedConnection
        
        var errorDescription: String? {
            switch self {
            case .notConnected:
                return "No internet connection available"
            case .connectionLost:
                return "Internet connection was lost"
            case .expensiveConnection:
                return "Using expensive network connection"
            case .constrainedConnection:
                return "Network connection is constrained"
            }
        }
    }
    
    private init() {
        monitor = NWPathMonitor()
        startMonitoring()
    }
    
    deinit {
        stopMonitoring()
    }
    
    func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor [weak self] in
                guard let self = self else { return }
                
                let wasConnected = self.isConnected
                self.isConnected = path.status == .satisfied
                self.isExpensive = path.isExpensive
                self.isConstrained = path.isConstrained
                self.connectionType = self.determineConnectionType(from: path)
                
                if wasConnected && !self.isConnected {
                    NotificationCenter.default.post(
                        name: .networkConnectionLost,
                        object: nil
                    )
                    Logger.shared.log("Network connection lost", level: .warning)
                } else if !wasConnected && self.isConnected {
                    NotificationCenter.default.post(
                        name: .networkConnectionRestored,
                        object: nil,
                        userInfo: ["connectionType": self.connectionType.rawValue]
                    )
                    Logger.shared.log("Network connection restored: \(self.connectionType.displayName)", level: .info)
                }
                
                if self.isExpensive {
                    Logger.shared.log("Network connection is expensive", level: .warning)
                }
                
                if self.isConstrained {
                    Logger.shared.log("Network connection is constrained", level: .warning)
                }
            }
        }
        
        monitor.start(queue: monitorQueue)
        Logger.shared.log("Network monitoring started", level: .info)
    }
    
    func stopMonitoring() {
        monitor.cancel()
        Logger.shared.log("Network monitoring stopped", level: .info)
    }
    
    func waitForConnection(timeout: TimeInterval = 30.0) async throws {
        if isConnected {
            return
        }
        
        let startTime = Date()
        
        while !isConnected {
            if Date().timeIntervalSince(startTime) > timeout {
                throw NetworkError.notConnected
            }
            
            try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
        }
    }
    
    func requireConnection() throws {
        guard isConnected else {
            throw NetworkError.notConnected
        }
    }
    
    func requireNonExpensiveConnection() throws {
        try requireConnection()
        
        guard !isExpensive else {
            throw NetworkError.expensiveConnection
        }
    }
    
    func requireNonConstrainedConnection() throws {
        try requireConnection()
        
        guard !isConstrained else {
            throw NetworkError.constrainedConnection
        }
    }
    
    func isWiFiConnected() -> Bool {
        return isConnected && connectionType == .wifi
    }
    
    func isCellularConnected() -> Bool {
        return isConnected && connectionType == .cellular
    }
    
    func shouldDownloadLargeFiles() -> Bool {
        return isConnected && !isExpensive && !isConstrained && connectionType == .wifi
    }
    
    func shouldSyncData() -> Bool {
        return isConnected && !isConstrained
    }
    
    func getConnectionQuality() -> ConnectionQuality {
        if !isConnected {
            return .offline
        }
        
        if isConstrained {
            return .poor
        }
        
        if isExpensive {
            return .fair
        }
        
        switch connectionType {
        case .wifi:
            return .excellent
        case .cellular:
            return .good
        case .wiredEthernet:
            return .excellent
        case .unknown:
            return .fair
        }
    }
    
    private func determineConnectionType(from path: NWPath) -> ConnectionType {
        if path.usesInterfaceType(.wifi) {
            return .wifi
        } else if path.usesInterfaceType(.cellular) {
            return .cellular
        } else if path.usesInterfaceType(.wiredEthernet) {
            return .wiredEthernet
        } else {
            return .unknown
        }
    }
}

extension NetworkMonitor {
    enum ConnectionQuality: String {
        case offline
        case poor
        case fair
        case good
        case excellent
        
        var displayName: String {
            switch self {
            case .offline: return "Offline"
            case .poor: return "Poor"
            case .fair: return "Fair"
            case .good: return "Good"
            case .excellent: return "Excellent"
            }
        }
        
        var color: String {
            switch self {
            case .offline: return "red"
            case .poor: return "orange"
            case .fair: return "yellow"
            case .good: return "lightGreen"
            case .excellent: return "green"
            }
        }
    }
}

extension Notification.Name {
    static let networkConnectionLost = Notification.Name("networkConnectionLost")
    static let networkConnectionRestored = Notification.Name("networkConnectionRestored")
    static let networkTypeChanged = Notification.Name("networkTypeChanged")
}

extension NetworkMonitor {
    func publisher() -> AnyPublisher<Bool, Never> {
        $isConnected.eraseToAnyPublisher()
    }
    
    func connectionTypePublisher() -> AnyPublisher<ConnectionType, Never> {
        $connectionType.eraseToAnyPublisher()
    }
    
    func expensivePublisher() -> AnyPublisher<Bool, Never> {
        $isExpensive.eraseToAnyPublisher()
    }
    
    func constrainedPublisher() -> AnyPublisher<Bool, Never> {
        $isConstrained.eraseToAnyPublisher()
    }
}

struct NetworkStatusView: View {
    @StateObject private var networkMonitor = NetworkMonitor.shared
    
    var body: some View {
        HStack(spacing: 8) {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
            
            Text(statusText)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
    
    private var statusColor: Color {
        let quality = networkMonitor.getConnectionQuality()
        switch quality {
        case .offline:
            return .red
        case .poor:
            return .orange
        case .fair:
            return .yellow
        case .good:
            return Color(red: 0.6, green: 0.8, blue: 0.4)
        case .excellent:
            return .green
        }
    }
    
    private var statusText: String {
        if !networkMonitor.isConnected {
            return "Offline"
        }
        
        var text = networkMonitor.connectionType.displayName
        
        if networkMonitor.isExpensive {
            text += " (Expensive)"
        }
        
        if networkMonitor.isConstrained {
            text += " (Constrained)"
        }
        
        return text
    }
}

extension NetworkMonitor {
    func performNetworkTask<T>(
        _ task: @escaping () async throws -> T,
        requireNonExpensive: Bool = false,
        requireNonConstrained: Bool = false
    ) async throws -> T {
        if requireNonExpensive {
            try requireNonExpensiveConnection()
        } else if requireNonConstrained {
            try requireNonConstrainedConnection()
        } else {
            try requireConnection()
        }
        
        return try await task()
    }
    
    func retryWithConnection<T>(
        maxRetries: Int = 3,
        delay: TimeInterval = 2.0,
        _ task: @escaping () async throws -> T
    ) async throws -> T {
        var lastError: Error?
        
        for attempt in 0..<maxRetries {
            do {
                try await waitForConnection(timeout: 10.0)
                return try await task()
            } catch {
                lastError = error
                Logger.shared.log("Network task failed (attempt \(attempt + 1)/\(maxRetries)): \(error.localizedDescription)", level: .warning)
                
                if attempt < maxRetries - 1 {
                    try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                }
            }
        }
        
        throw lastError ?? NetworkError.notConnected
    }
}