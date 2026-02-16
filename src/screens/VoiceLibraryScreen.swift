import SwiftUI
import AVFoundation
import Combine

struct VoiceLibraryScreen: View {
    @StateObject private var viewModel = VoiceLibraryViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var selectedVoiceId: UUID?
    @State private var playingVoiceId: UUID?
    
    var body: some View {
        ZStack {
            Color.background
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                headerView
                
                if viewModel.isLoading {
                    loadingView
                } else if let error = viewModel.error {
                    errorView(error)
                } else {
                    voiceListView
                }
            }
        }
        .onAppear {
            Task {
                await viewModel.loadVoices()
                selectedVoiceId = viewModel.currentVoiceId
            }
        }
        .onDisappear {
            viewModel.stopPreview()
        }
    }
    
    private var headerView: some View {
        VStack(spacing: Spacing.xs) {
            HStack {
                Button(action: { dismiss() }) {
                    Image(systemName: "chevron.left")
                        .font(.system(size: 20, weight: .medium))
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                Text("Voice Library")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(.primary)
                
                Spacer()
                
                Button(action: { saveSelection() }) {
                    Text("Save")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(selectedVoiceId != viewModel.currentVoiceId ? .primary : .secondary)
                }
                .disabled(selectedVoiceId == viewModel.currentVoiceId)
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
            
            Text("Choose your meditation instructor")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
                .padding(.bottom, Spacing.sm)
        }
        .background(Color.background)
    }
    
    private var voiceListView: some View {
        ScrollView {
            LazyVStack(spacing: Spacing.md) {
                ForEach(viewModel.voices) { voice in
                    VoicePreviewCard(
                        voice: voice,
                        isSelected: selectedVoiceId == voice.id,
                        isPlaying: playingVoiceId == voice.id,
                        onSelect: { selectVoice(voice) },
                        onPreview: { togglePreview(voice) }
                    )
                }
            }
            .padding(.horizontal, Spacing.md)
            .padding(.vertical, Spacing.sm)
        }
    }
    
    private var loadingView: some View {
        VStack(spacing: Spacing.md) {
            ProgressView()
                .scaleEffect(1.2)
            
            Text("Loading voices...")
                .font(.system(size: 14))
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func errorView(_ error: String) -> some View {
        VStack(spacing: Spacing.md) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 48))
                .foregroundColor(.secondary)
            
            Text(error)
                .font(.system(size: 16))
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
                .padding(.horizontal, Spacing.lg)
            
            Button(action: {
                Task {
                    await viewModel.loadVoices()
                }
            }) {
                Text("Try Again")
                    .font(.system(size: 16, weight: .semibold))
                    .foregroundColor(.white)
                    .padding(.horizontal, Spacing.lg)
                    .padding(.vertical, Spacing.sm)
                    .background(Color.primary)
                    .cornerRadius(12)
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
    
    private func selectVoice(_ voice: Voice) {
        withAnimation(.easeInOut(duration: 0.2)) {
            selectedVoiceId = voice.id
        }
        
        let generator = UIImpactFeedbackGenerator(style: .light)
        generator.impactOccurred()
    }
    
    private func togglePreview(_ voice: Voice) {
        if playingVoiceId == voice.id {
            viewModel.stopPreview()
            playingVoiceId = nil
        } else {
            playingVoiceId = voice.id
            Task {
                await viewModel.playPreview(voice)
                if viewModel.isPreviewPlaying {
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
                        if !viewModel.isPreviewPlaying {
                            playingVoiceId = nil
                        }
                    }
                } else {
                    playingVoiceId = nil
                }
            }
        }
        
        let generator = UIImpactFeedbackGenerator(style: .medium)
        generator.impactOccurred()
    }
    
    private func saveSelection() {
        guard let voiceId = selectedVoiceId else { return }
        
        Task {
            await viewModel.saveSelectedVoice(voiceId)
            
            let generator = UINotificationFeedbackGenerator()
            generator.notificationOccurred(.success)
            
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                dismiss()
            }
        }
    }
}

@MainActor
class VoiceLibraryViewModel: ObservableObject {
    @Published var voices: [Voice] = []
    @Published var currentVoiceId: UUID?
    @Published var isLoading = false
    @Published var error: String?
    @Published var isPreviewPlaying = false
    
    private let supabaseService = SupabaseService.shared
    private let audioService = AudioService.shared
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        setupAudioObserver()
    }
    
    func loadVoices() async {
        isLoading = true
        error = nil
        
        do {
            let fetchedVoices = try await supabaseService.fetchVoices()
            voices = fetchedVoices.sorted { voice1, voice2 in
                if voice1.gender != voice2.gender {
                    return voice1.gender == "female"
                }
                return voice1.name < voice2.name
            }
            
            if let user = try? await supabaseService.getCurrentUser() {
                currentVoiceId = user.selectedVoiceId
            }
            
            isLoading = false
        } catch {
            self.error = "Failed to load voices. Please try again."
            isLoading = false
            Logger.error("Failed to load voices: \(error)")
        }
    }
    
    func playPreview(_ voice: Voice) async {
        guard let url = URL(string: voice.previewAudioUrl) else {
            Logger.error("Invalid preview URL for voice: \(voice.name)")
            return
        }
        
        do {
            try await audioService.playPreview(url: url)
            isPreviewPlaying = true
        } catch {
            Logger.error("Failed to play preview: \(error)")
            isPreviewPlaying = false
        }
    }
    
    func stopPreview() {
        audioService.stopPreview()
        isPreviewPlaying = false
    }
    
    func saveSelectedVoice(_ voiceId: UUID) async {
        do {
            try await supabaseService.updateUserVoice(voiceId: voiceId)
            currentVoiceId = voiceId
            Logger.info("Voice updated successfully: \(voiceId)")
        } catch {
            self.error = "Failed to save voice selection"
            Logger.error("Failed to save voice: \(error)")
        }
    }
    
    private func setupAudioObserver() {
        audioService.isPlayingPublisher
            .receive(on: DispatchQueue.main)
            .sink { [weak self] isPlaying in
                self?.isPreviewPlaying = isPlaying
            }
            .store(in: &cancellables)
    }
}

struct VoicePreviewCard: View {
    let voice: Voice
    let isSelected: Bool
    let isPlaying: Bool
    let onSelect: () -> Void
    let onPreview: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack(spacing: Spacing.md) {
                voiceIcon
                
                VStack(alignment: .leading, spacing: Spacing.xxs) {
                    Text(voice.name)
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    HStack(spacing: Spacing.xs) {
                        Text(voice.gender.capitalized)
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                        
                        Text("•")
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                        
                        Text(voice.accent)
                            .font(.system(size: 13))
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                previewButton
                
                selectionIndicator
            }
            .padding(Spacing.md)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isSelected ? Color.primary.opacity(0.05) : Color.white)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 16)
                    .stroke(isSelected ? Color.primary : Color.gray.opacity(0.2), lineWidth: isSelected ? 2 : 1)
            )
        }
        .buttonStyle(ScaleButtonStyle())
    }
    
    private var voiceIcon: some View {
        ZStack {
            Circle()
                .fill(Color.primary.opacity(0.1))
                .frame(width: 48, height: 48)
            
            Image(systemName: voice.gender == "male" ? "person.fill" : "person.fill")
                .font(.system(size: 20))
                .foregroundColor(.primary)
        }
    }
    
    private var previewButton: some View {
        Button(action: onPreview) {
            ZStack {
                Circle()
                    .fill(Color.primary.opacity(0.1))
                    .frame(width: 40, height: 40)
                
                Image(systemName: isPlaying ? "stop.fill" : "play.fill")
                    .font(.system(size: 14))
                    .foregroundColor(.primary)
            }
        }
        .buttonStyle(ScaleButtonStyle())
    }
    
    private var selectionIndicator: some View {
        ZStack {
            Circle()
                .stroke(isSelected ? Color.primary : Color.gray.opacity(0.3), lineWidth: 2)
                .frame(width: 24, height: 24)
            
            if isSelected {
                Circle()
                    .fill(Color.primary)
                    .frame(width: 14, height: 14)
                    .transition(.scale)
            }
        }
        .animation(.easeInOut(duration: 0.2), value: isSelected)
    }
}

struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.97 : 1.0)
            .animation(.easeInOut(duration: 0.15), value: configuration.isPressed)
    }
}

#Preview {
    VoiceLibraryScreen()
}