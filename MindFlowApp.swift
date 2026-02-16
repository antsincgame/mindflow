import SwiftUI
import Combine

@main
struct MindFlowApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var navigationCoordinator = NavigationCoordinator()
    @StateObject private var healthKitService = HealthKitService()
    @StateObject private var calendarService = CalendarService()
    @StateObject private var notificationService = NotificationService()
    @StateObject private var supabaseService = SupabaseService.shared
    @StateObject private var stressAnalysisService = StressAnalysisService()
    @StateObject private var meditationService = MeditationService()
    @StateObject private var achievementService = AchievementService()
    @StateObject private var audioService = AudioService()
    
    @Environment(\.scenePhase) private var scenePhase
    
    init() {
        setupAppearance()
        setupNotifications()
    }
    
    var body: some Scene {
        WindowGroup {
            ZStack {
                if appState.isLoading {
                    LoadingView()
                } else if !appState.isAuthenticated {
                    OnboardingScreen()
                        .environmentObject(appState)
                        .environmentObject(navigationCoordinator)
                        .environmentObject(healthKitService)
                        .environmentObject(calendarService)
                        .environmentObject(notificationService)
                        .environmentObject(supabaseService)
                } else if !appState.hasCompletedOnboarding {
                    OnboardingScreen()
                        .environmentObject(appState)
                        .environmentObject(navigationCoordinator)
                        .environmentObject(healthKitService)
                        .environmentObject(calendarService)
                        .environmentObject(notificationService)
                        .environmentObject(supabaseService)
                } else {
                    NavigationStack(path: $navigationCoordinator.path) {
                        HomeScreen()
                            .navigationDestination(for: Route.self) { route in
                                destinationView(for: route)
                            }
                    }
                    .environmentObject(appState)
                    .environmentObject(navigationCoordinator)
                    .environmentObject(healthKitService)
                    .environmentObject(calendarService)
                    .environmentObject(notificationService)
                    .environmentObject(supabaseService)
                    .environmentObject(stressAnalysisService)
                    .environmentObject(meditationService)
                    .environmentObject(achievementService)
                    .environmentObject(audioService)
                }
            }
            .onAppear {
                Task {
                    await initializeApp()
                }
            }
            .onChange(of: scenePhase) { oldPhase, newPhase in
                handleScenePhaseChange(from: oldPhase, to: newPhase)
            }
            .onReceive(NotificationCenter.default.publisher(for: UIApplication.didBecomeActiveNotification)) { _ in
                Task {
                    await handleAppBecameActive()
                }
            }
            .onReceive(NotificationCenter.default.publisher(for: UIApplication.willResignActiveNotification)) { _ in
                handleAppWillResignActive()
            }
        }
    }
    
    @ViewBuilder
    private func destinationView(for route: Route) -> some View {
        switch route {
        case .home:
            HomeScreen()
        case .meditationSession(let exercise, let stressLevel):
            MeditationSessionScreen(exercise: exercise, initialStressLevel: stressLevel)
        case .sessionResult(let session):
            SessionResultScreen(session: session)
        case .progress:
            ProgressScreen()
        case .settings:
            SettingsScreen()
        case .voiceLibrary:
            VoiceLibraryScreen()
        case .exerciseSelection(let recommendedExercise, let alternatives):
            ExerciseSelectionScreen(
                recommendedExercise: recommendedExercise,
                alternatives: alternatives
            )
        }
    }
    
    private func setupAppearance() {
        let appearance = UINavigationBarAppearance()
        appearance.configureWithTransparentBackground()
        appearance.backgroundColor = UIColor(named: "Background")
        appearance.titleTextAttributes = [
            .foregroundColor: UIColor.label,
            .font: UIFont.systemFont(ofSize: 20, weight: .semibold)
        ]
        appearance.largeTitleTextAttributes = [
            .foregroundColor: UIColor.label,
            .font: UIFont.systemFont(ofSize: 34, weight: .bold)
        ]
        
        UINavigationBar.appearance().standardAppearance = appearance
        UINavigationBar.appearance().scrollEdgeAppearance = appearance
        UINavigationBar.appearance().compactAppearance = appearance
        
        UITabBar.appearance().backgroundColor = UIColor(named: "Background")
        UITabBar.appearance().unselectedItemTintColor = UIColor.systemGray
    }
    
    private func setupNotifications() {
        UNUserNotificationCenter.current().delegate = notificationService
    }
    
    private func initializeApp() async {
        appState.isLoading = true
        
        do {
            let session = try await supabaseService.getCurrentSession()
            
            if let session = session {
                appState.isAuthenticated = true
                appState.currentUser = try await supabaseService.getCurrentUser()
                
                if let user = appState.currentUser {
                    appState.hasCompletedOnboarding = user.hasCompletedOnboarding
                    
                    await initializeServices()
                    
                    if appState.hasCompletedOnboarding {
                        await startBackgroundMonitoring()
                    }
                }
            } else {
                appState.isAuthenticated = false
                appState.hasCompletedOnboarding = false
            }
        } catch {
            Logger.error("Failed to initialize app: \(error)")
            appState.isAuthenticated = false
            appState.hasCompletedOnboarding = false
        }
        
        appState.isLoading = false
    }
    
    private func initializeServices() async {
        guard let user = appState.currentUser else { return }
        
        await healthKitService.requestAuthorization()
        await calendarService.requestAccess()
        await notificationService.requestAuthorization()
        
        stressAnalysisService.configure(
            healthKitService: healthKitService,
            calendarService: calendarService,
            userId: user.id
        )
        
        meditationService.configure(
            audioService: audioService,
            userId: user.id
        )
        
        achievementService.configure(userId: user.id)
        
        if let voiceId = user.selectedVoiceId {
            await audioService.loadVoice(voiceId: voiceId)
        }
    }
    
    private func startBackgroundMonitoring() async {
        guard appState.hasCompletedOnboarding else { return }
        
        await stressAnalysisService.startMonitoring()
        
        stressAnalysisService.onStressDetected = { stressLevel in
            Task {
                await handleStressDetected(stressLevel: stressLevel)
            }
        }
        
        await calendarService.startMonitoring()
        
        calendarService.onUpcomingEvent = { event in
            Task {
                await handleUpcomingEvent(event: event)
            }
        }
    }
    
    private func handleStressDetected(stressLevel: StressLevel) async {
        guard stressLevel.level >= 7 else { return }
        
        let shouldNotify = await notificationService.shouldSendNotification(
            type: .stressDetected,
            userId: appState.currentUser?.id ?? ""
        )
        
        guard shouldNotify else { return }
        
        let recommendedExercise = await meditationService.getRecommendedExercise(
            stressLevel: stressLevel.level,
            context: stressLevel.context
        )
        
        await notificationService.sendStressDetectedNotification(
            stressLevel: stressLevel,
            recommendedExercise: recommendedExercise
        )
    }
    
    private func handleUpcomingEvent(event: CalendarEvent) async {
        guard event.isStressTrigger else { return }
        
        let shouldNotify = await notificationService.shouldSendNotification(
            type: .sessionReminder,
            userId: appState.currentUser?.id ?? ""
        )
        
        guard shouldNotify else { return }
        
        await notificationService.sendSessionReminderNotification(
            event: event
        )
    }
    
    private func handleScenePhaseChange(from oldPhase: ScenePhase, to newPhase: ScenePhase) {
        switch newPhase {
        case .active:
            Task {
                await handleAppBecameActive()
            }
        case .inactive:
            break
        case .background:
            handleAppWillResignActive()
        @unknown default:
            break
        }
    }
    
    private func handleAppBecameActive() async {
        guard appState.isAuthenticated && appState.hasCompletedOnboarding else { return }
        
        await stressAnalysisService.refreshStressLevel()
        
        if meditationService.isSessionActive {
            meditationService.resumeSession()
        }
        
        await notificationService.clearDeliveredNotifications()
        
        await achievementService.checkForNewAchievements()
    }
    
    private func handleAppWillResignActive() {
        if meditationService.isSessionActive {
            meditationService.pauseSession()
        }
        
        audioService.pause()
    }
}

class AppState: ObservableObject {
    @Published var isLoading: Bool = true
    @Published var isAuthenticated: Bool = false
    @Published var hasCompletedOnboarding: Bool = false
    @Published var currentUser: User?
    @Published var currentStressLevel: StressLevel?
    @Published var unreadNotificationsCount: Int = 0
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupSubscriptions()
    }
    
    private func setupSubscriptions() {
        NotificationCenter.default.publisher(for: .userDidUpdate)
            .compactMap { $0.object as? User }
            .sink { [weak self] user in
                self?.currentUser = user
            }
            .store(in: &cancellables)
        
        NotificationCenter.default.publisher(for: .stressLevelDidUpdate)
            .compactMap { $0.object as? StressLevel }
            .sink { [weak self] stressLevel in
                self?.currentStressLevel = stressLevel
            }
            .store(in: &cancellables)
    }
}

class NavigationCoordinator: ObservableObject {
    @Published var path = NavigationPath()
    
    func navigate(to route: Route) {
        path.append(route)
    }
    
    func navigateBack() {
        if !path.isEmpty {
            path.removeLast()
        }
    }
    
    func navigateToRoot() {
        path = NavigationPath()
    }
    
    func replace(with route: Route) {
        path = NavigationPath()
        path.append(route)
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            Color("Background")
                .ignoresSafeArea()
            
            VStack(spacing: Spacing.large) {
                ProgressView()
                    .scaleEffect(1.5)
                    .tint(Color("Primary"))
                
                Text("Loading...")
                    .font(.body)
                    .foregroundColor(.secondary)
            }
        }
    }
}

extension Notification.Name {
    static let userDidUpdate = Notification.Name("userDidUpdate")
    static let stressLevelDidUpdate = Notification.Name("stressLevelDidUpdate")
    static let meditationSessionCompleted = Notification.Name("meditationSessionCompleted")
    static let achievementUnlocked = Notification.Name("achievementUnlocked")
}