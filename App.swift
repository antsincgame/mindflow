import SwiftUI
import UserNotifications
import Supabase

@main
struct App: SwiftUI.App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) var appDelegate
    @StateObject private var appState = AppState()
    
    init() {
        configureSupabase()
    }
    
    var body: some Scene {
        WindowGroup {
            MindFlowApp()
                .environmentObject(appState)
                .onAppear {
                    setupNotifications()
                    setupHealthKit()
                }
        }
    }
    
    private func configureSupabase() {
        guard let supabaseURL = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_URL") as? String,
              let supabaseKey = Bundle.main.object(forInfoDictionaryKey: "SUPABASE_ANON_KEY") as? String else {
            fatalError("Supabase configuration missing in Info.plist")
        }
        
        SupabaseService.shared.configure(url: supabaseURL, key: supabaseKey)
    }
    
    private func setupNotifications() {
        Task {
            await NotificationService.shared.requestAuthorization()
        }
    }
    
    private func setupHealthKit() {
        Task {
            await HealthKitService.shared.requestAuthorization()
        }
    }
}

class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        registerForPushNotifications(application)
        configureAudioSession()
        return true
    }
    
    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let token = deviceToken.map { String(format: "%02.2hhx", $0) }.joined()
        Task {
            await NotificationService.shared.registerDeviceToken(token)
        }
        Logger.shared.info("Registered for push notifications: \(token)")
    }
    
    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        Logger.shared.error("Failed to register for push notifications: \(error.localizedDescription)")
    }
    
    func application(
        _ application: UIApplication,
        didReceiveRemoteNotification userInfo: [AnyHashable: Any],
        fetchCompletionHandler completionHandler: @escaping (UIBackgroundFetchResult) -> Void
    ) {
        Task {
            await NotificationService.shared.handleRemoteNotification(userInfo)
            completionHandler(.newData)
        }
    }
    
    private func registerForPushNotifications(_ application: UIApplication) {
        UNUserNotificationCenter.current().delegate = self
        application.registerForRemoteNotifications()
    }
    
    private func configureAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setCategory(
                .playback,
                mode: .default,
                options: [.mixWithOthers, .allowAirPlay]
            )
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            Logger.shared.error("Failed to configure audio session: \(error.localizedDescription)")
        }
    }
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        completionHandler([.banner, .sound, .badge])
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse,
        withCompletionHandler completionHandler: @escaping () -> Void
    ) {
        let userInfo = response.notification.request.content.userInfo
        
        Task {
            await NotificationService.shared.handleNotificationResponse(
                response.actionIdentifier,
                userInfo: userInfo
            )
            completionHandler()
        }
    }
}

@MainActor
class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var hasCompletedOnboarding = false
    @Published var currentUser: User?
    @Published var isLoading = true
    
    init() {
        checkAuthenticationStatus()
    }
    
    private func checkAuthenticationStatus() {
        Task {
            do {
                let session = try await SupabaseService.shared.getSession()
                if let session = session {
                    self.isAuthenticated = true
                    await loadUserProfile(userId: session.user.id)
                } else {
                    self.isAuthenticated = false
                }
            } catch {
                Logger.shared.error("Failed to check authentication: \(error.localizedDescription)")
                self.isAuthenticated = false
            }
            self.isLoading = false
        }
    }
    
    private func loadUserProfile(userId: UUID) async {
        do {
            let user = try await SupabaseService.shared.fetchUser(userId: userId)
            self.currentUser = user
            self.hasCompletedOnboarding = user != nil
        } catch {
            Logger.shared.error("Failed to load user profile: \(error.localizedDescription)")
        }
    }
    
    func signIn(email: String, password: String) async throws {
        let session = try await SupabaseService.shared.signIn(email: email, password: password)
        self.isAuthenticated = true
        await loadUserProfile(userId: session.user.id)
    }
    
    func signUp(email: String, password: String) async throws {
        let session = try await SupabaseService.shared.signUp(email: email, password: password)
        self.isAuthenticated = true
        await loadUserProfile(userId: session.user.id)
    }
    
    func signOut() async throws {
        try await SupabaseService.shared.signOut()
        self.isAuthenticated = false
        self.currentUser = nil
        self.hasCompletedOnboarding = false
    }
    
    func completeOnboarding() {
        self.hasCompletedOnboarding = true
    }
}