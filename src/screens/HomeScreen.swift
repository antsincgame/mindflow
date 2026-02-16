import SwiftUI
import Combine

struct HomeScreen: View {
    @StateObject private var viewModel = HomeViewModel()
    @State private var showExerciseSelection = false
    @State private var showSessionScreen = false
    @State private var selectedExercise: Exercise?
    @State private var isAnimating = false
    
    var body: some View {
        NavigationStack {
            ZStack {
                Color.background
                    .ignoresSafeArea()
                
                if viewModel.isLoading {
                    ProgressView()
                        .scaleEffect(1.5)
                } else {
                    ScrollView {
                        VStack(spacing: 32) {
                            headerSection
                            stressIndicatorSection
                            quickStartSection
                            progressSection
                            upcomingEventsSection
                            recentSessionsSection
                        }
                        .padding(.horizontal, 24)
                        .padding(.top, 20)
                        .padding(.bottom, 40)
                    }
                }
            }
            .navigationDestination(isPresented: $showExerciseSelection) {
                ExerciseSelectionScreen(
                    recommendedExercise: viewModel.recommendedExercise,
                    onExerciseSelected: { exercise in
                        selectedExercise = exercise
                        showExerciseSelection = false
                        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                            showSessionScreen = true
                        }
                    }
                )
            }
            .navigationDestination(isPresented: $showSessionScreen) {
                if let exercise = selectedExercise {
                    MeditationSessionScreen(
                        exercise: exercise,
                        initialStressLevel: viewModel.currentStressLevel
                    )
                }
            }
            .onAppear {
                viewModel.loadData()
                startPulseAnimation()
            }
            .refreshable {
                await viewModel.refresh()
            }
            .alert("Permissions Required", isPresented: $viewModel.showPermissionsAlert) {
                Button("Open Settings") {
                    if let url = URL(string: UIApplication.openSettingsURLString) {
                        UIApplication.shared.open(url)
                    }
                }
                Button("Cancel", role: .cancel) {}
            } message: {
                Text(viewModel.permissionsAlertMessage)
            }
        }
    }
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(greetingText)
                .font(.system(size: 28, weight: .bold))
                .foregroundColor(.primary)
            
            Text(motivationalText)
                .font(.system(size: 16, weight: .regular))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
    
    private var stressIndicatorSection: some View {
        VStack(spacing: 16) {
            Text("Current Stress Level")
                .font(.system(size: 14, weight: .medium))
                .foregroundColor(.secondary)
            
            StressIndicator(
                level: viewModel.currentStressLevel,
                source: viewModel.stressSource,
                isAnimating: isAnimating
            )
            .frame(height: 200)
            
            if let lastUpdate = viewModel.lastStressUpdate {
                Text("Updated \(timeAgoString(from: lastUpdate))")
                    .font(.system(size: 12, weight: .regular))
                    .foregroundColor(.secondary)
            }
            
            if !viewModel.hasAppleWatch {
                Button(action: {
                    viewModel.showManualStressInput = true
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "hand.tap")
                            .font(.system(size: 14))
                        Text("Manual Input")
                            .font(.system(size: 14, weight: .medium))
                    }
                    .foregroundColor(.primary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 8)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(20)
                }
            }
        }
        .padding(.vertical, 24)
        .padding(.horizontal, 20)
        .background(Color.white)
        .cornerRadius(20)
        .shadow(color: Color.black.opacity(0.05), radius: 10, x: 0, y: 4)
    }
    
    private var quickStartSection: some View {
        VStack(spacing: 16) {
            if viewModel.shouldShowQuickStart {
                Button(action: {
                    handleQuickStart()
                }) {
                    HStack {
                        VStack(alignment: .leading, spacing: 8) {
                            HStack(spacing: 8) {
                                Image(systemName: "sparkles")
                                    .font(.system(size: 16, weight: .semibold))
                                Text("Quick Start")
                                    .font(.system(size: 18, weight: .bold))
                            }
                            
                            if let exercise = viewModel.recommendedExercise {
                                Text(exercise.name)
                                    .font(.system(size: 14, weight: .medium))
                                    .foregroundColor(.white.opacity(0.9))
                                
                                Text("\(exercise.durationSeconds / 60) min • \(exercise.type.displayName)")
                                    .font(.system(size: 12, weight: .regular))
                                    .foregroundColor(.white.opacity(0.7))
                            }
                        }
                        
                        Spacer()
                        
                        Image(systemName: "play.circle.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.white)
                    }
                    .padding(20)
                    .frame(maxWidth: .infinity)
                    .background(
                        LinearGradient(
                            gradient: Gradient(colors: [Color.primary, Color.primary.opacity(0.8)]),
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .cornerRadius(20)
                    .shadow(color: Color.primary.opacity(0.3), radius: 10, x: 0, y: 4)
                }
                .buttonStyle(ScaleButtonStyle())
            }
            
            Button(action: {
                showExerciseSelection = true
            }) {
                HStack {
                    Image(systemName: "list.bullet")
                        .font(.system(size: 16, weight: .semibold))
                    Text("Browse Exercises")
                        .font(.system(size: 16, weight: .semibold))
                }
                .foregroundColor(.primary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 16)
                .background(Color.secondary.opacity(0.1))
                .cornerRadius(16)
            }
            .buttonStyle(ScaleButtonStyle())
        }
    }
    
    private var progressSection: some View {
        VStack(spacing: 16) {
            HStack {
                Text("Your Progress")
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                NavigationLink(destination: ProgressScreen()) {
                    HStack(spacing: 4) {
                        Text("View All")
                            .font(.system(size: 14, weight: .medium))
                        Image(systemName: "chevron.right")
                            .font(.system(size: 12, weight: .semibold))
                    }
                    .foregroundColor(.primary)
                }
            }
            
            if let progress = viewModel.userProgress {
                VStack(spacing: 12) {
                    ProgressCard(
                        title: "Current Streak",
                        value: "\(progress.currentStreak)",
                        subtitle: "days",
                        icon: "flame.fill",
                        color: .orange,
                        progress: Double(progress.currentStreak) / Double(max(progress.longestStreak, 7))
                    )
                    
                    ProgressCard(
                        title: "Total Sessions",
                        value: "\(progress.totalSessions)",
                        subtitle: "completed",
                        icon: "checkmark.circle.fill",
                        color: .green,
                        progress: Double(progress.totalSessions) / 100.0
                    )
                    
                    ProgressCard(
                        title: "Meditation Time",
                        value: "\(progress.totalMinutes)",
                        subtitle: "minutes",
                        icon: "clock.fill",
                        color: .blue,
                        progress: Double(progress.totalMinutes) / 1000.0
                    )
                    
                    if progress.sessionsBeforeMeetings > 0 {
                        ProgressCard(
                            title: "Pre-Meeting Calm",
                            value: "\(progress.sessionsBeforeMeetings)",
                            subtitle: "sessions • \(Int(progress.stressReductionAvg))% calmer",
                            icon: "calendar.badge.checkmark",
                            color: .purple,
                            progress: Double(progress.sessionsBeforeMeetings) / 20.0
                        )
                    }
                }
            } else {
                VStack(spacing: 12) {
                    Image(systemName: "chart.line.uptrend.xyaxis")
                        .font(.system(size: 40))
                        .foregroundColor(.secondary.opacity(0.5))
                    
                    Text("Start your first session to track progress")
                        .font(.system(size: 14, weight: .medium))
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
                .background(Color.secondary.opacity(0.05))
                .cornerRadius(16)
            }
        }
    }
    
    private var upcomingEventsSection: some View {
        Group {
            if !viewModel.upcomingStressfulEvents.isEmpty {
                VStack(spacing: 16) {
                    HStack {
                        Image(systemName: "calendar.badge.exclamationmark")
                            .font(.system(size: 16, weight: .semibold))
                            .foregroundColor(.orange)
                        
                        Text("Upcoming Events")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.primary)
                        
                        Spacer()
                    }
                    
                    ForEach(viewModel.upcomingStressfulEvents.prefix(3), id: \.id) { event in
                        HStack(spacing: 12) {
                            VStack {
                                Image(systemName: stressLevelIcon(for: event.stressTrigger))
                                    .font(.system(size: 16, weight: .semibold))
                                    .foregroundColor(stressLevelColor(for: event.stressTrigger))
                                    .frame(width: 40, height: 40)
                                    .background(stressLevelColor(for: event.stressTrigger).opacity(0.1))
                                    .cornerRadius(10)
                            }
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(event.title)
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                
                                Text(timeUntilString(for: event.startDate))
                                    .font(.system(size: 12, weight: .regular))
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            if event.isImportant {
                                Image(systemName: "star.fill")
                                    .font(.system(size: 12))
                                    .foregroundColor(.yellow)
                            }
                        }
                        .padding(12)
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }
                }
            }
        }
    }
    
    private var recentSessionsSection: some View {
        Group {
            if !viewModel.recentSessions.isEmpty {
                VStack(spacing: 16) {
                    HStack {
                        Text("Recent Sessions")
                            .font(.system(size: 18, weight: .bold))
                            .foregroundColor(.primary)
                        
                        Spacer()
                    }
                    
                    ForEach(viewModel.recentSessions.prefix(3), id: \.id) { session in
                        HStack(spacing: 12) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 24))
                                .foregroundColor(.green)
                            
                            VStack(alignment: .leading, spacing: 4) {
                                Text(session.exercise?.name ?? "Meditation")
                                    .font(.system(size: 14, weight: .semibold))
                                    .foregroundColor(.primary)
                                
                                Text(dateString(from: session.startedAt))
                                    .font(.system(size: 12, weight: .regular))
                                    .foregroundColor(.secondary)
                            }
                            
                            Spacer()
                            
                            VStack(alignment: .trailing, spacing: 4) {
                                HStack(spacing: 4) {
                                    Image(systemName: "arrow.down")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundColor(.green)
                                    Text("\(session.stressReduction)%")
                                        .font(.system(size: 12, weight: .semibold))
                                        .foregroundColor(.green)
                                }
                                
                                Text("\(session.durationSeconds / 60) min")
                                    .font(.system(size: 12, weight: .regular))
                                    .foregroundColor(.secondary)
                            }
                        }
                        .padding(12)
                        .background(Color.white)
                        .cornerRadius(12)
                        .shadow(color: Color.black.opacity(0.05), radius: 5, x: 0, y: 2)
                    }
                }
            }
        }
    }
    
    private var greetingText: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "Good Morning"
        case 12..<17: return "Good Afternoon"
        default: return "Good Evening"
        }
    }
    
    private var motivationalText: String {
        guard let progress = viewModel.userProgress else {
            return "Start your mindfulness journey today"
        }
        
        if progress.currentStreak > 0 {
            return "You're on a \(progress.currentStreak) day streak! Keep it going 🔥"
        } else if progress.totalSessions > 0 {
            return "Welcome back! Ready for another session?"
        } else {
            return "Take a moment to breathe and find your calm"
        }
    }
    
    private func handleQuickStart() {
        guard let exercise = viewModel.recommendedExercise else {
            showExerciseSelection = true
            return
        }
        
        let adaptiveDelay = viewModel.currentStressLevel >= 8 ? 0.0 : 0.5
        
        if adaptiveDelay == 0.0 {
            selectedExercise = exercise
            showSessionScreen = true
        } else {
            selected