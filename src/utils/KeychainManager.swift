import Foundation
import Security

enum KeychainError: Error {
    case duplicateItem
    case itemNotFound
    case invalidData
    case unhandledError(status: OSStatus)
    case unexpectedData
}

final class KeychainManager {
    static let shared = KeychainManager()
    
    private let service: String
    
    private init(service: String = Bundle.main.bundleIdentifier ?? "com.mindflow.app") {
        self.service = service
    }
    
    // MARK: - Public Methods
    
    func save(_ value: String, for key: String) throws {
        guard let data = value.data(using: .utf8) else {
            throw KeychainError.invalidData
        }
        
        try save(data, for: key)
    }
    
    func save(_ data: Data, for key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        if status == errSecDuplicateItem {
            try update(data, for: key)
            return
        }
        
        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }
    
    func get(_ key: String) throws -> String {
        let data = try getData(for: key)
        
        guard let string = String(data: data, encoding: .utf8) else {
            throw KeychainError.invalidData
        }
        
        return string
    }
    
    func getData(for key: String) throws -> Data {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess else {
            if status == errSecItemNotFound {
                throw KeychainError.itemNotFound
            }
            throw KeychainError.unhandledError(status: status)
        }
        
        guard let data = result as? Data else {
            throw KeychainError.unexpectedData
        }
        
        return data
    }
    
    func delete(_ key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandledError(status: status)
        }
    }
    
    func deleteAll() throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service
        ]
        
        let status = SecItemDelete(query as CFDictionary)
        
        guard status == errSecSuccess || status == errSecItemNotFound else {
            throw KeychainError.unhandledError(status: status)
        }
    }
    
    func exists(_ key: String) -> Bool {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecReturnData as String: false
        ]
        
        let status = SecItemCopyMatching(query as CFDictionary, nil)
        return status == errSecSuccess
    }
    
    // MARK: - Private Methods
    
    private func update(_ data: Data, for key: String) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key
        ]
        
        let attributes: [String: Any] = [
            kSecValueData as String: data
        ]
        
        let status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        
        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }
}

// MARK: - Convenience Methods for Common Keys

extension KeychainManager {
    enum Key {
        static let accessToken = "access_token"
        static let refreshToken = "refresh_token"
        static let userId = "user_id"
        static let userEmail = "user_email"
        static let deviceToken = "device_token"
        static let biometricEnabled = "biometric_enabled"
    }
    
    // Access Token
    func saveAccessToken(_ token: String) throws {
        try save(token, for: Key.accessToken)
    }
    
    func getAccessToken() throws -> String {
        try get(Key.accessToken)
    }
    
    func deleteAccessToken() throws {
        try delete(Key.accessToken)
    }
    
    func hasAccessToken() -> Bool {
        exists(Key.accessToken)
    }
    
    // Refresh Token
    func saveRefreshToken(_ token: String) throws {
        try save(token, for: Key.refreshToken)
    }
    
    func getRefreshToken() throws -> String {
        try get(Key.refreshToken)
    }
    
    func deleteRefreshToken() throws {
        try delete(Key.refreshToken)
    }
    
    // User ID
    func saveUserId(_ userId: String) throws {
        try save(userId, for: Key.userId)
    }
    
    func getUserId() throws -> String {
        try get(Key.userId)
    }
    
    func deleteUserId() throws {
        try delete(Key.userId)
    }
    
    // User Email
    func saveUserEmail(_ email: String) throws {
        try save(email, for: Key.userEmail)
    }
    
    func getUserEmail() throws -> String {
        try get(Key.userEmail)
    }
    
    func deleteUserEmail() throws {
        try delete(Key.userEmail)
    }
    
    // Device Token (for push notifications)
    func saveDeviceToken(_ token: String) throws {
        try save(token, for: Key.deviceToken)
    }
    
    func getDeviceToken() throws -> String {
        try get(Key.deviceToken)
    }
    
    func deleteDeviceToken() throws {
        try delete(Key.deviceToken)
    }
    
    // Clear all auth data
    func clearAuthData() throws {
        try? deleteAccessToken()
        try? deleteRefreshToken()
        try? deleteUserId()
        try? deleteUserEmail()
        try? deleteDeviceToken()
    }
}

// MARK: - Codable Support

extension KeychainManager {
    func save<T: Encodable>(_ value: T, for key: String) throws {
        let encoder = JSONEncoder()
        let data = try encoder.encode(value)
        try save(data, for: key)
    }
    
    func get<T: Decodable>(_ key: String, as type: T.Type) throws -> T {
        let data = try getData(for: key)
        let decoder = JSONDecoder()
        return try decoder.decode(type, from: data)
    }
}

// MARK: - Biometric Authentication Support

#if canImport(LocalAuthentication)
import LocalAuthentication

extension KeychainManager {
    func saveWithBiometric(_ value: String, for key: String, reason: String = "Authenticate to save data") throws {
        guard let data = value.data(using: .utf8) else {
            throw KeychainError.invalidData
        }
        
        let context = LAContext()
        var error: NSError?
        
        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw KeychainError.unhandledError(status: errSecAuthFailed)
        }
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessControl as String: try createAccessControl()
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        if status == errSecDuplicateItem {
            let updateQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrService as String: service,
                kSecAttrAccount as String: key
            ]
            
            let attributes: [String: Any] = [
                kSecValueData as String: data,
                kSecAttrAccessControl as String: try createAccessControl()
            ]
            
            let updateStatus = SecItemUpdate(updateQuery as CFDictionary, attributes as CFDictionary)
            
            guard updateStatus == errSecSuccess else {
                throw KeychainError.unhandledError(status: updateStatus)
            }
            
            return
        }
        
        guard status == errSecSuccess else {
            throw KeychainError.unhandledError(status: status)
        }
    }
    
    private func createAccessControl() throws -> SecAccessControl {
        var error: Unmanaged<CFError>?
        
        guard let accessControl = SecAccessControlCreateWithFlags(
            kCFAllocatorDefault,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            .biometryCurrentSet,
            &error
        ) else {
            if let error = error?.takeRetainedValue() {
                throw error
            }
            throw KeychainError.unhandledError(status: errSecParam)
        }
        
        return accessControl
    }
}
#endif