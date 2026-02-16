import SwiftUI
import AVFoundation

struct VoicePreviewCard: View {
    let voice: Voice
    let isSelected: Bool
    let onSelect: () -> Void
    
    @StateObject private var audioPlayer = AudioPlayerViewModel()
    @State private var isPlaying = false
    
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 16) {
                // Voice Icon
                ZStack {
                    Circle()
                        .fill(isSelected ? Color.primary.opacity(0.1) : Color.secondary.opacity(0.05))
                        .frame(width: 56, height: 56)
                    
                    Image(systemName: voiceIcon)
                        .font(.system(size: 24))
                        .foregroundColor(isSelected ? .primary : .secondary)
                }
                
                // Voice Info
                VStack(alignment: .leading, spacing: 4) {
                    Text(voice.name)
                        .font(.system(size: 17, weight: .semibold))
                        .foregroundColor(.primary)
                    
                    HStack(spacing: 8) {
                        Text(genderText)
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                        
                        Circle()
                            .fill(Color.secondary.opacity(0.3))
                            .frame(width: 3, height: 3)
                        
                        Text(voice.accent)
                            .font(.system(size: 14))
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                // Preview Button
                Button(action: togglePreview) {
                    ZStack {
                        Circle()
                            .fill(isPlaying ? Color.primary.opacity(0.1) : Color.secondary.opacity(0.05))
                            .frame(width: 44, height: 44)
                        
                        if audioPlayer.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .primary))
                                .scaleEffect(0.8)
                        } else {
                            Image(systemName: isPlaying ? "pause.fill" : "play.fill")
                                .font(.system(size: 16, weight: .medium))
                                .foregroundColor(.primary)
                        }
                    }
                }
                .buttonStyle(ScaleButtonStyle())
                .disabled(audioPlayer.isLoading)
            }
            .padding(16)
            
            // Selection Button
            Button(action: onSelect) {
                HStack {
                    Spacer()
                    
                    if isSelected {
                        HStack(spacing: 8) {
                            Image(systemName: "checkmark.circle.fill")
                                .font(.system(size: 16, weight: .medium))
                            
                            Text("Selected")
                                .font(.system(size: 15, weight: .semibold))
                        }
                        .foregroundColor(.white)
                    } else {
                        Text("Select Voice")
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundColor(.primary)
                    }
                    
                    Spacer()
                }
                .frame(height: 48)
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(isSelected ? Color.primary : Color.primary.opacity(0.05))
                )
            }
            .buttonStyle(ScaleButtonStyle())
            .padding(.horizontal, 16)
            .padding(.bottom, 16)
        }
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white)
                .shadow(
                    color: isSelected ? Color.primary.opacity(0.15) : Color.black.opacity(0.05),
                    radius: isSelected ? 12 : 8,
                    x: 0,
                    y: isSelected ? 4 : 2
                )
        )
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isSelected ? Color.primary : Color.clear, lineWidth: 2)
        )
        .animation(.spring(response: 0.3, dampingFraction: 0.7), value: isSelected)
        .onReceive(audioPlayer.$isPlaying) { playing in
            isPlaying = playing
        }
        .onDisappear {
            audioPlayer.stop()
        }
    }
    
    private var voiceIcon: String {
        switch voice.gender {
        case .male:
            return "person.fill"
        case .female:
            return "person.fill"
        }
    }
    
    private var genderText: String {
        switch voice.gender {
        case .male:
            return "Male"
        case .female:
            return "Female"
        }
    }
    
    private func togglePreview() {
        if isPlaying {
            audioPlayer.stop()
        } else {
            audioPlayer.playPreview(url: voice.previewAudioUrl)
        }
    }
}

// MARK: - Audio Player ViewModel
@MainActor
class AudioPlayerViewModel: ObservableObject {
    @Published var isPlaying = false
    @Published var isLoading = false
    
    private var player: AVPlayer?
    private var playerItem: AVPlayerItem?
    private var timeObserver: Any?
    
    deinit {
        stop()
    }
    
    func playPreview(url: String) {
        guard let audioURL = URL(string: url) else { return }
        
        isLoading = true
        
        playerItem = AVPlayerItem(url: audioURL)
        player = AVPlayer(playerItem: playerItem)
        
        // Configure audio session
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .default)
            try AVAudioSession.sharedInstance().setActive(true)
        } catch {
            print("Failed to configure audio session: \(error)")
            isLoading = false
            return
        }
        
        // Observe player status
        playerItem?.publisher(for: \.status)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] status in
                guard let self = self else { return }
                
                switch status {
                case .readyToPlay:
                    self.isLoading = false
                    self.player?.play()
                    self.isPlaying = true
                case .failed:
                    self.isLoading = false
                    self.isPlaying = false
                    print("Failed to load audio: \(self.playerItem?.error?.localizedDescription ?? "Unknown error")")
                default:
                    break
                }
            }
            .store(in: &cancellables)
        
        // Observe playback end
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(playerDidFinishPlaying),
            name: .AVPlayerItemDidPlayToEndTime,
            object: playerItem
        )
        
        // Observe time to auto-stop after 10 seconds
        let interval = CMTime(seconds: 0.5, preferredTimescale: CMTimeScale(NSEC_PER_SEC))
        timeObserver = player?.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] time in
            guard let self = self else { return }
            
            if time.seconds >= 10.0 {
                self.stop()
            }
        }
    }
    
    func stop() {
        player?.pause()
        
        if let observer = timeObserver {
            player?.removeTimeObserver(observer)
            timeObserver = nil
        }
        
        NotificationCenter.default.removeObserver(
            self,
            name: .AVPlayerItemDidPlayToEndTime,
            object: playerItem
        )
        
        playerItem = nil
        player = nil
        isPlaying = false
        isLoading = false
        
        try? AVAudioSession.sharedInstance().setActive(false)
    }
    
    @objc private func playerDidFinishPlaying() {
        stop()
    }
    
    private var cancellables = Set<AnyCancellable>()
}

// MARK: - Scale Button Style
struct ScaleButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .scaleEffect(configuration.isPressed ? 0.96 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.7), value: configuration.isPressed)
    }
}

// MARK: - Preview
struct VoicePreviewCard_Previews: PreviewProvider {
    static var previews: some View {
        VStack(spacing: 16) {
            VoicePreviewCard(
                voice: Voice(
                    id: UUID(),
                    name: "Sarah",
                    gender: .female,
                    accent: "American",
                    previewAudioUrl: "https://example.com/preview.mp3",
                    createdAt: Date()
                ),
                isSelected: false,
                onSelect: {}
            )
            
            VoicePreviewCard(
                voice: Voice(
                    id: UUID(),
                    name: "James",
                    gender: .male,
                    accent: "British",
                    previewAudioUrl: "https://example.com/preview.mp3",
                    createdAt: Date()
                ),
                isSelected: true,
                onSelect: {}
            )
        }
        .padding()
        .background(Color(UIColor.systemGroupedBackground))
    }
}

import Combine