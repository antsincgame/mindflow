import SwiftUI
import HealthKit
import EventKit
import UserNotifications
import AVFoundation

struct OnboardingScreen: View {
    @StateObject private var viewModel = OnboardingViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        ZStack {
            Color.background
                .ignoresSafeArea()
            
            TabView(selection: $viewModel.currentStep) {
                WelcomeView()
                    .tag(OnboardingStep.welcome)
                
                PermissionsView(viewModel: viewModel)
                    .tag(OnboardingStep.permissions)
                
                VoiceSelectionView(viewModel: viewModel)
                    .tag(OnboardingStep.voiceSelection)
                
                CompletionView(viewModel: viewModel)
                    .tag(OnboardingStep.completion)
            }
            .tabViewStyle(.page(indexDisplayMode: .never))
            .disabled(viewModel.isLoading)
            
            if viewModel.isLoading {
                ProgressView()
                    .scaleEffect(1.5)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.black.opacity(0.3))
            }
        }
        .alert("Permission Error", isPresented: $viewModel.showError) {
            Button("OK") {
                viewModel.showError = false
            }
        } message: {
            Text(viewModel.errorMessage)
        }
        .onAppear {
            viewModel.onAppear()
        }
    }
}

struct WelcomeView: View {
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            Image(systemName: "heart.circle.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 120, height: 120)
                .foregroundColor(.primary)
            
            VStack(spacing: 16) {
                Text("Welcome to MindFlow")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .multilineTextAlignment(.center)
                
                Text("Your personal meditation assistant that helps you find calm before important moments")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            Spacer()
            
            VStack(spacing: 12) {
                FeatureRow(
                    icon: "calendar",
                    title: "Smart Scheduling",
                    description: "Automatically detects stressful events"
                )
                
                FeatureRow(
                    icon: "waveform.path.ecg",
                    title: "Stress Monitoring",
                    description: "Real-time stress level tracking"
                )
                
                FeatureRow(
                    icon: "speaker.wave.2",
                    title: "Guided Sessions",
                    description: "Choose your favorite instructor voice"
                )
            }
            .padding(.horizontal, 32)
            
            Spacer()
        }
        .padding()
    }
}

struct FeatureRow: View {
    let icon: String
    let title: String
    let description: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.primary)
                .frame(width: 32)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                
                Text(description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
        }
    }
}

struct PermissionsView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            VStack(spacing: 16) {
                Text("Permissions")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("MindFlow needs access to provide personalized stress management")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            Spacer()
            
            VStack(spacing: 20) {
                PermissionCard(
                    icon: "bell.fill",
                    title: "Notifications",
                    description: "Get alerts when stress is detected",
                    status: viewModel.notificationPermissionStatus,
                    isRequired: true,
                    action: {
                        Task {
                            await viewModel.requestNotificationPermission()
                        }
                    }
                )
                
                PermissionCard(
                    icon: "calendar",
                    title: "Calendar",
                    description: "Analyze upcoming events for stress triggers",
                    status: viewModel.calendarPermissionStatus,
                    isRequired: true,
                    action: {
                        Task {
                            await viewModel.requestCalendarPermission()
                        }
                    }
                )
                
                PermissionCard(
                    icon: "heart.fill",
                    title: "HealthKit",
                    description: "Monitor heart rate and activity data",
                    status: viewModel.healthKitPermissionStatus,
                    isRequired: false,
                    action: {
                        Task {
                            await viewModel.requestHealthKitPermission()
                        }
                    }
                )
                
                PermissionCard(
                    icon: "mic.fill",
                    title: "Microphone",
                    description: "Optional: Personalize instructor voice",
                    status: viewModel.microphonePermissionStatus,
                    isRequired: false,
                    action: {
                        Task {
                            await viewModel.requestMicrophonePermission()
                        }
                    }
                )
            }
            .padding(.horizontal, 24)
            
            Spacer()
            
            Button(action: {
                viewModel.currentStep = .voiceSelection
            }) {
                Text("Continue")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(viewModel.canContinueFromPermissions ? Color.primary : Color.gray)
                    .cornerRadius(16)
            }
            .disabled(!viewModel.canContinueFromPermissions)
            .padding(.horizontal, 32)
            .padding(.bottom, 32)
        }
    }
}

struct PermissionCard: View {
    let icon: String
    let title: String
    let description: String
    let status: PermissionStatus
    let isRequired: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(statusColor.opacity(0.1))
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: icon)
                        .font(.title2)
                        .foregroundColor(statusColor)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(title)
                            .font(.headline)
                        
                        if isRequired {
                            Text("Required")
                                .font(.caption2)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.red.opacity(0.1))
                                .foregroundColor(.red)
                                .cornerRadius(4)
                        }
                    }
                    
                    Text(description)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.leading)
                }
                
                Spacer()
                
                statusIcon
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(16)
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
    
    private var statusColor: Color {
        switch status {
        case .notDetermined:
            return .gray
        case .granted:
            return .green
        case .denied:
            return .red
        case .requesting:
            return .orange
        }
    }
    
    @ViewBuilder
    private var statusIcon: some View {
        switch status {
        case .notDetermined:
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
        case .granted:
            Image(systemName: "checkmark.circle.fill")
                .foregroundColor(.green)
        case .denied:
            Image(systemName: "xmark.circle.fill")
                .foregroundColor(.red)
        case .requesting:
            ProgressView()
        }
    }
}

struct VoiceSelectionView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    
    var body: some View {
        VStack(spacing: 32) {
            VStack(spacing: 16) {
                Text("Choose Your Instructor")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Select a voice that resonates with you")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            .padding(.top, 60)
            
            if viewModel.voices.isEmpty {
                ProgressView()
                    .scaleEffect(1.5)
                    .frame(maxHeight: .infinity)
            } else {
                ScrollView {
                    LazyVStack(spacing: 16) {
                        ForEach(viewModel.voices) { voice in
                            VoiceCard(
                                voice: voice,
                                isSelected: viewModel.selectedVoiceId == voice.id,
                                isPlaying: viewModel.playingVoiceId == voice.id,
                                onSelect: {
                                    viewModel.selectVoice(voice)
                                },
                                onPlayPreview: {
                                    Task {
                                        await viewModel.playVoicePreview(voice)
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal, 24)
                }
            }
            
            Button(action: {
                Task {
                    await viewModel.completeVoiceSelection()
                }
            }) {
                Text("Continue")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(viewModel.selectedVoiceId != nil ? Color.primary : Color.gray)
                    .cornerRadius(16)
            }
            .disabled(viewModel.selectedVoiceId == nil)
            .padding(.horizontal, 32)
            .padding(.bottom, 32)
        }
    }
}

struct VoiceCard: View {
    let voice: Voice
    let isSelected: Bool
    let isPlaying: Bool
    let onSelect: () -> Void
    let onPlayPreview: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: 16) {
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.primary.opacity(0.1) : Color.gray.opacity(0.1))
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: voice.gender == "male" ? "person.fill" : "person.fill")
                        .font(.title2)
                        .foregroundColor(isSelected ? .primary : .gray)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(voice.name)
                        .font(.headline)
                    
                    HStack(spacing: 8) {
                        Text(voice.gender.capitalized)
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        Text("•")
                            .foregroundColor(.secondary)
                        
                        Text(voice.accent)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                Button(action: onPlayPreview) {
                    ZStack {
                        Circle()
                            .fill(Color.primary.opacity(0.1))
                            .frame(width: 40, height: 40)
                        
                        Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                            .font(.system(size: 14))
                            .foregroundColor(.primary)
                    }
                }
                .buttonStyle(.plain)
                
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundColor(.primary)
                        .font(.title3)
                }
            }
            .padding(16)
            .background(Color.white)
            .cornerRadius(16)
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? Color.primary : Color.clear, lineWidth: 2)
            )
            .shadow(color: Color.black.opacity(0.05), radius: 8, x: 0, y: 2)
        }
        .buttonStyle(.plain)
    }
}

struct CompletionView: View {
    @ObservedObject var viewModel: OnboardingViewModel
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        VStack(spacing: 32) {
            Spacer()
            
            Image(systemName: "checkmark.circle.fill")
                .resizable()
                .scaledToFit()
                .frame(width: 120, height: 120)
                .foregroundColor(.green)
            
            VStack(spacing: 16) {
                Text("You're All Set!")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("MindFlow will now monitor your stress levels and help you find calm when you need it most")
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, 32)
            }
            
            Spacer()
            
            VStack(spacing: 12) {
                InfoRow(
                    icon: "bell.badge.fill",
                    text: "You'll receive notifications when stress is detected"
                )
                
                InfoRow(
                    icon: "calendar.badge.clock",
                    text: "Meditation suggestions before important events"
                )
                
                InfoRow(
                    icon: "chart.line.uptrend.xyaxis",
                    text: "Track your progress and earn achievements"
                )
            }
            .padding(.horizontal, 32)
            
            Spacer()
            
            Button(action: {
                Task {
                    await viewModel.completeOnboarding()
                }
            }) {
                Text("Start Your Journey")
                    .font(.headline)
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .frame(height: 56)
                    .background(Color.primary)
                    .cornerRadius(16)
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 32)
        }
    }
}

struct InfoRow: View {
    let icon: String
    let text: String
    
    var body: some View {
        HStack(spacing: 16) {
            Image(systemName: icon)
                .font(.title3)
                .foregroundColor(.primary)
                .frame(width: 32)
            
            Text(text)
                .font(.subheadline