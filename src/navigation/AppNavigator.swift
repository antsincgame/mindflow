import SwiftUI

struct AppNavigator: View {
    @StateObject private var authState = AuthenticationState()
    @StateObject private var navigationState = NavigationState()
    
    var body: some View {
        Group {
            if authState.isLoading {
                LoadingView()
            } else if authState.isAuthenticated {
                MainNavigationView()
                    .environmentObject(navigationState)
                    .environmentObject(authState)
            } else {
                OnboardingNavigationView()
                    .environmentObject(navigationState)
                    .environmentObject(authState)
            }
        }
        .onAppear {
            authState.checkAuthenticationStatus()
        }
    }
}

struct MainNavigationView: View {
    @EnvironmentObject var navigationState: NavigationState
    @State private var selectedTab: Tab = .home
    
    var body: some View {
        NavigationStack(path: $navigationState.path) {
            TabView(selection: $selectedTab) {
                HomeScreen()
                    .tabItem {
                        Label("Home", systemImage: "house.fill")
                    }
                    .tag(Tab.home)
                
                ProgressScreen()
                    .tabItem {
                        Label("Progress", systemImage: "chart.line.uptrend.xyaxis")
                    }
                    .tag(Tab.progress)
                
                SettingsScreen()
                    .tabItem {
                        Label("Settings", systemImage: "gearshape.fill")
                    }
                    .tag(Tab.settings)
            }
            .navigationDestination(for: Route.self) { route in
                destinationView(for: route)
            }
        }
        .onChange(of: navigationState.shouldPopToRoot) { _, newValue in
            if newValue {
                navigationState.popToRoot()
            }
        }
    }
    
    @ViewBuilder
    private func destinationView(for route: Route) -> some View {
        switch route {
        case .meditationSession(let exercise):
            MeditationSessionScreen(exercise: exercise)
        case .sessionResult(let session):
            SessionResultScreen(session: session)
        case .exerciseSelection(let stressLevel):
            ExerciseSelectionScreen(stressLevel: stressLevel)
        case .voiceLibrary:
            VoiceLibraryScreen()
        case .settingsDetail(let section):
            SettingsDetailView(section: section)
        case .achievementDetail(let achievement):
            AchievementDetailView(achievement: achievement)
        case .sessionHistory:
            SessionHistoryView()
        case .stressAnalytics:
            StressAnalyticsView()
        }
    }
    
    enum Tab {
        case home
        case progress
        case settings
    }
}

struct OnboardingNavigationView: View {
    @EnvironmentObject var navigationState: NavigationState
    @EnvironmentObject var authState: AuthenticationState
    
    var body: some View {
        NavigationStack(path: $navigationState.path) {
            OnboardingScreen()
                .navigationDestination(for: Route.self) { route in
                    destinationView(for: route)
                }
        }
    }
    
    @ViewBuilder
    private func destinationView(for route: Route) -> some View {
        switch route {
        case .voiceLibrary:
            VoiceLibraryScreen()
        default:
            EmptyView()
        }
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            Color.background
                .ignoresSafeArea()
            
            VStack(spacing: 20) {
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: .primary))
                    .scaleEffect(1.5)
                
                Text("Loading...")
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

struct SettingsDetailView: View {
    let section: SettingsSection
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                Text(section.title)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.horizontal)
                
                Text(section.description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .padding(.horizontal)
                
                Divider()
                
                // Section-specific content
                switch section {
                case .notifications:
                    NotificationSettingsContent()
                case .permissions:
                    PermissionsSettingsContent()
                case .sessionInterval:
                    SessionIntervalContent()
                case .privacy:
                    PrivacySettingsContent()
                case .about:
                    AboutContent()
                }
            }
            .padding(.vertical)
        }
        .background(Color.background)
        .navigationTitle(section.title)
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct AchievementDetailView: View {
    let achievement: Achievement
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Achievement icon
                AsyncImage(url: URL(string: achievement.iconUrl)) { image in
                    image
                        .resizable()
                        .scaledToFit()
                } placeholder: {
                    Image(systemName: "trophy.fill")
                        .resizable()
                        .scaledToFit()
                        .foregroundColor(.secondary)
                }
                .frame(width: 120, height: 120)
                .padding(.top, 40)
                
                // Achievement name
                Text(achievement.name)
                    .font(.title)
                    .fontWeight(.bold)
                    .multilineTextAlignment(.center)
                
                // Achievement description
                Text(achievement.description)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                // Unlock condition
                if let condition = achievement.unlockCondition {
                    VStack(alignment: .leading, spacing: 12) {
                        Text("How to unlock")
                            .font(.headline)
                        
                        Text(condition.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(12)
                    .padding(.horizontal)
                }
                
                Spacer()
            }
        }
        .background(Color.background)
        .navigationTitle("Achievement")
        .navigationBarTitleDisplayMode(.inline)
    }
}

struct SessionHistoryView: View {
    @StateObject private var viewModel = SessionHistoryViewModel()
    
    var body: some View {
        ScrollView {
            LazyVStack(spacing: 16) {
                ForEach(viewModel.sessions) { session in
                    SessionHistoryCard(session: session)
                }
            }
            .padding()
        }
        .background(Color.background)
        .navigationTitle("Session History")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.loadSessions()
        }
    }
}

struct StressAnalyticsView: View {
    @StateObject private var viewModel = StressAnalyticsViewModel()
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // Average stress reduction
                StatsCard(
                    title: "Average Stress Reduction",
                    value: "\(Int(viewModel.averageStressReduction))%",
                    icon: "arrow.down.circle.fill",
                    color: .green
                )
                
                // Stress trend chart
                VStack(alignment: .leading, spacing: 12) {
                    Text("Stress Trend")
                        .font(.headline)
                    
                    StressTrendChart(data: viewModel.stressTrend)
                        .frame(height: 200)
                }
                .padding()
                .background(Color.white)
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
                
                // Peak stress times
                VStack(alignment: .leading, spacing: 12) {
                    Text("Peak Stress Times")
                        .font(.headline)
                    
                    ForEach(viewModel.peakStressTimes, id: \.hour) { timeData in
                        HStack {
                            Text(timeData.timeRange)
                                .font(.body)
                            
                            Spacer()
                            
                            Text("\(timeData.averageStress)")
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .padding()
                .background(Color.white)
                .cornerRadius(12)
                .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
            }
            .padding()
        }
        .background(Color.background)
        .navigationTitle("Stress Analytics")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            viewModel.loadAnalytics()
        }
    }
}

struct SessionHistoryCard: View {
    let session: MeditationSession
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Text(session.exercise.name)
                    .font(.headline)
                
                Spacer()
                
                Text(session.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            HStack(spacing: 16) {
                // Duration
                HStack(spacing: 4) {
                    Image(systemName: "clock.fill")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text("\(session.durationMinutes) min")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                // Stress reduction
                HStack(spacing: 4) {
                    Image(systemName: "arrow.down.circle.fill")
                        .font(.caption)
                        .foregroundColor(.green)
                    Text("-\(session.stressReduction)%")
                        .font(.caption)
                        .foregroundColor(.green)
                }
                
                Spacer()
                
                // Rating
                if let rating = session.rating {
                    HStack(spacing: 2) {
                        ForEach(0..<rating, id: \.self) { _ in
                            Image(systemName: "star.fill")
                                .font(.caption)
                                .foregroundColor(.yellow)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
    }
}

struct StatsCard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color
    
    var body: some View {
        VStack(spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(color)
                
                Spacer()
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(value)
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text(title)
                    .font(.body)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.05), radius: 10, x: 0, y: 5)
    }
}

struct StressTrendChart: View {
    let data: [StressDataPoint]
    
    var body: some View {
        GeometryReader { geometry in
            Path { path in
                guard !data.isEmpty else { return }
                
                let maxValue = data.map(\.value).max() ?? 100
                let stepX = geometry.size.width / CGFloat(data.count - 1)
                let stepY = geometry.size.height / CGFloat(maxValue)
                
                path.move(to: CGPoint(
                    x: 0,
                    y: geometry.size.height - CGFloat(data[0].value) * stepY
                ))
                
                for (index, point) in data.enumerated() where index > 0 {
                    path.addLine(to: CGPoint(
                        x: CGFloat(index) * stepX,
                        y: geometry.size.height - CGFloat(point.value) * stepY
                    ))
                }
            }
            .stroke(Color.primary, lineWidth: 2)
        }
    }
}

struct NotificationSettingsContent: View {
    @State private var notificationsEnabled = true
    @State private var stressDetectionEnabled = true
    @State private var sessionRemindersEnabled = true
    
    var body: some View {
        VStack(spacing: 16) {
            Toggle("Enable Notifications", isOn: $notificationsEnabled)
                .padding(.horizontal)
            
            Toggle("Stress Detection Alerts", isOn: $stressDetectionEnabled)
                .padding(.horizontal)
                .disabled(!notificationsEnabled)
            
            Toggle("Session Reminders", isOn: $sessionRemindersEnabled)
                .padding(.horizontal)
                .disabled(!notificationsEnabled)
        }
    }
}

struct PermissionsSettingsContent: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            PermissionRow(
                title: "HealthKit",
                description: "Access heart rate and activity data",
                icon: "heart.fill",
                color: .red
            )
            
            PermissionRow(
                title: "Calendar",
                description: "Analyze upcoming events for stress triggers",
                icon: "calendar",
                color: .blue
            )
            
            PermissionRow(
                title: "Notifications",
                description: "Receive meditation reminders",
                icon: "bell.fill",
                color: .orange
            )
        }
        .padding(.horizontal)
    }
}

struct PermissionRow: View {
    let title: String
    let description: String
    let icon: String
    let color: Color
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(color)
                .frame(width: 40)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(12)
    }
}

struct SessionIntervalContent: View {
    @State private var selectedInterval = 4
    let intervals = [1, 2, 4, 6, 8]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Choose how often you'd like to receive meditation reminders")
                .font(.body)
                .foregroundColor(.secondary)
                .padding(.horizontal)
            
            Picker("Interval", selection: $selectedInterval) {
                ForEach(intervals, id: \.self) { interval in
                    Text("\(interval) hour\(interval > 1 ? "s" : "")")