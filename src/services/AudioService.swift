import Foundation
import AVFoundation
import Combine

enum AudioServiceError: Error {
    case fileNotFound
    case invalidURL
    case playbackFailed
    case downloadFailed
    case audioSessionSetupFailed
}

enum AudioType {
    case voice
    case background
    case ambient
}

enum PlaybackState {
    case idle
    case loading
    case playing
    case paused
    case stopped
    case error(Error)
}

actor AudioService: NSObject, ObservableObject {
    static let shared = AudioService()
    
    @Published private(set) var playbackState: PlaybackState = .idle
    @Published private(set) var currentTime: TimeInterval = 0
    @Published private(set) var duration: TimeInterval = 0
    @Published private(set) var volume: Float = 1.0
    
    private var voicePlayer: AVAudioPlayer?
    private var backgroundPlayer: AVAudioPlayer?
    private var ambientPlayer: AVAudioPlayer?
    
    private var audioSession: AVAudioSession = .sharedInstance()
    private var updateTimer: Timer?
    private var cancellables = Set<AnyCancellable>()
    
    private let fileManager = FileManager.default
    private let cacheDirectory: URL
    
    private override init() {
        let cachePath = fileManager.urls(for: .cachesDirectory, in: .userDomainMask)[0]
        self.cacheDirectory = cachePath.appendingPathComponent("AudioCache", isDirectory: true)
        
        super.init()
        
        Task {
            await setupAudioSession()
            await createCacheDirectory()
            await setupNotifications()
        }
    }
    
    // MARK: - Setup
    
    private func setupAudioSession() async {
        do {
            try audioSession.setCategory(.playback, mode: .spokenAudio, options: [.mixWithOthers])
            try audioSession.setActive(true)
        } catch {
            Logger.shared.error("Failed to setup audio session: \(error)")
            await MainActor.run {
                self.playbackState = .error(AudioServiceError.audioSessionSetupFailed)
            }
        }
    }
    
    private func createCacheDirectory() async {
        if !fileManager.fileExists(atPath: cacheDirectory.path) {
            do {
                try fileManager.createDirectory(at: cacheDirectory, withIntermediateDirectories: true)
            } catch {
                Logger.shared.error("Failed to create cache directory: \(error)")
            }
        }
    }
    
    private func setupNotifications() async {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleInterruption),
            name: AVAudioSession.interruptionNotification,
            object: audioSession
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleRouteChange),
            name: AVAudioSession.routeChangeNotification,
            object: audioSession
        )
    }
    
    // MARK: - Playback Control
    
    func playVoice(url: String) async throws {
        await MainActor.run {
            self.playbackState = .loading
        }
        
        let audioURL = try await resolveAudioURL(url: url)
        
        do {
            let player = try AVAudioPlayer(contentsOf: audioURL)
            player.delegate = self
            player.prepareToPlay()
            
            voicePlayer = player
            
            await MainActor.run {
                self.duration = player.duration
            }
            
            player.play()
            
            await MainActor.run {
                self.playbackState = .playing
            }
            
            await startUpdateTimer()
            
        } catch {
            Logger.shared.error("Failed to play voice: \(error)")
            await MainActor.run {
                self.playbackState = .error(AudioServiceError.playbackFailed)
            }
            throw AudioServiceError.playbackFailed
        }
    }
    
    func playBackground(url: String, volume: Float = 0.3, loop: Bool = true) async throws {
        let audioURL = try await resolveAudioURL(url: url)
        
        do {
            let player = try AVAudioPlayer(contentsOf: audioURL)
            player.volume = volume
            player.numberOfLoops = loop ? -1 : 0
            player.prepareToPlay()
            
            backgroundPlayer = player
            player.play()
            
        } catch {
            Logger.shared.error("Failed to play background: \(error)")
            throw AudioServiceError.playbackFailed
        }
    }
    
    func playAmbient(url: String, volume: Float = 0.2, loop: Bool = true) async throws {
        let audioURL = try await resolveAudioURL(url: url)
        
        do {
            let player = try AVAudioPlayer(contentsOf: audioURL)
            player.volume = volume
            player.numberOfLoops = loop ? -1 : 0
            player.prepareToPlay()
            
            ambientPlayer = player
            player.play()
            
        } catch {
            Logger.shared.error("Failed to play ambient: \(error)")
            throw AudioServiceError.playbackFailed
        }
    }
    
    func pause() async {
        voicePlayer?.pause()
        await stopUpdateTimer()
        
        await MainActor.run {
            self.playbackState = .paused
        }
    }
    
    func resume() async {
        voicePlayer?.play()
        await startUpdateTimer()
        
        await MainActor.run {
            self.playbackState = .playing
        }
    }
    
    func stop() async {
        voicePlayer?.stop()
        backgroundPlayer?.stop()
        ambientPlayer?.stop()
        
        await stopUpdateTimer()
        
        await MainActor.run {
            self.playbackState = .stopped
            self.currentTime = 0
        }
    }
    
    func seek(to time: TimeInterval) async {
        voicePlayer?.currentTime = time
        
        await MainActor.run {
            self.currentTime = time
        }
    }
    
    func setVolume(_ volume: Float, for type: AudioType) async {
        let clampedVolume = max(0, min(1, volume))
        
        switch type {
        case .voice:
            voicePlayer?.volume = clampedVolume
        case .background:
            backgroundPlayer?.volume = clampedVolume
        case .ambient:
            ambientPlayer?.volume = clampedVolume
        }
        
        if type == .voice {
            await MainActor.run {
                self.volume = clampedVolume
            }
        }
    }
    
    func fadeOut(duration: TimeInterval = 2.0) async {
        guard let player = voicePlayer, player.isPlaying else { return }
        
        let steps = 20
        let stepDuration = duration / Double(steps)
        let volumeStep = player.volume / Float(steps)
        
        for _ in 0..<steps {
            try? await Task.sleep(nanoseconds: UInt64(stepDuration * 1_000_000_000))
            await setVolume(player.volume - volumeStep, for: .voice)
        }
        
        await stop()
    }
    
    func fadeIn(duration: TimeInterval = 2.0, targetVolume: Float = 1.0) async {
        guard let player = voicePlayer else { return }
        
        player.volume = 0
        player.play()
        
        let steps = 20
        let stepDuration = duration / Double(steps)
        let volumeStep = targetVolume / Float(steps)
        
        await MainActor.run {
            self.playbackState = .playing
        }
        
        for _ in 0..<steps {
            try? await Task.sleep(nanoseconds: UInt64(stepDuration * 1_000_000_000))
            await setVolume(player.volume + volumeStep, for: .voice)
        }
    }
    
    // MARK: - URL Resolution
    
    private func resolveAudioURL(url: String) async throws -> URL {
        if url.hasPrefix("http://") || url.hasPrefix("https://") {
            return try await downloadAndCacheAudio(url: url)
        } else if url.hasPrefix("file://") {
            guard let localURL = URL(string: url) else {
                throw AudioServiceError.invalidURL
            }
            return localURL
        } else {
            guard let bundleURL = Bundle.main.url(forResource: url, withExtension: nil) else {
                throw AudioServiceError.fileNotFound
            }
            return bundleURL
        }
    }
    
    private func downloadAndCacheAudio(url: String) async throws -> URL {
        guard let remoteURL = URL(string: url) else {
            throw AudioServiceError.invalidURL
        }
        
        let fileName = remoteURL.lastPathComponent
        let cachedURL = cacheDirectory.appendingPathComponent(fileName)
        
        if fileManager.fileExists(atPath: cachedURL.path) {
            return cachedURL
        }
        
        do {
            let (data, _) = try await URLSession.shared.data(from: remoteURL)
            try data.write(to: cachedURL)
            return cachedURL
        } catch {
            Logger.shared.error("Failed to download audio: \(error)")
            throw AudioServiceError.downloadFailed
        }
    }
    
    // MARK: - Timer
    
    private func startUpdateTimer() async {
        await stopUpdateTimer()
        
        await MainActor.run {
            self.updateTimer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
                guard let self = self else { return }
                Task {
                    await self.updateCurrentTime()
                }
            }
        }
    }
    
    private func stopUpdateTimer() async {
        await MainActor.run {
            self.updateTimer?.invalidate()
            self.updateTimer = nil
        }
    }
    
    private func updateCurrentTime() async {
        guard let player = voicePlayer, player.isPlaying else { return }
        
        await MainActor.run {
            self.currentTime = player.currentTime
        }
    }
    
    // MARK: - Cache Management
    
    func clearCache() async throws {
        let contents = try fileManager.contentsOfDirectory(at: cacheDirectory, includingPropertiesForKeys: nil)
        
        for fileURL in contents {
            try fileManager.removeItem(at: fileURL)
        }
        
        Logger.shared.info("Audio cache cleared")
    }
    
    func getCacheSize() async -> Int64 {
        guard let contents = try? fileManager.contentsOfDirectory(at: cacheDirectory, includingPropertiesForKeys: [.fileSizeKey]) else {
            return 0
        }
        
        var totalSize: Int64 = 0
        
        for fileURL in contents {
            if let resourceValues = try? fileURL.resourceValues(forKeys: [.fileSizeKey]),
               let fileSize = resourceValues.fileSize {
                totalSize += Int64(fileSize)
            }
        }
        
        return totalSize
    }
    
    // MARK: - Preloading
    
    func preloadAudio(urls: [String]) async {
        await withTaskGroup(of: Void.self) { group in
            for url in urls {
                group.addTask {
                    do {
                        _ = try await self.resolveAudioURL(url: url)
                        Logger.shared.info("Preloaded audio: \(url)")
                    } catch {
                        Logger.shared.error("Failed to preload audio \(url): \(error)")
                    }
                }
            }
        }
    }
    
    // MARK: - Interruption Handling
    
    @objc private func handleInterruption(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let typeValue = userInfo[AVAudioSessionInterruptionTypeKey] as? UInt,
              let type = AVAudioSession.InterruptionType(rawValue: typeValue) else {
            return
        }
        
        Task {
            switch type {
            case .began:
                await pause()
                Logger.shared.info("Audio interrupted - paused")
                
            case .ended:
                guard let optionsValue = userInfo[AVAudioSessionInterruptionOptionKey] as? UInt else { return }
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                
                if options.contains(.shouldResume) {
                    await resume()
                    Logger.shared.info("Audio interruption ended - resumed")
                }
                
            @unknown default:
                break
            }
        }
    }
    
    @objc private func handleRouteChange(notification: Notification) {
        guard let userInfo = notification.userInfo,
              let reasonValue = userInfo[AVAudioSessionRouteChangeReasonKey] as? UInt,
              let reason = AVAudioSession.RouteChangeReason(rawValue: reasonValue) else {
            return
        }
        
        Task {
            switch reason {
            case .oldDeviceUnavailable:
                await pause()
                Logger.shared.info("Audio device disconnected - paused")
                
            default:
                break
            }
        }
    }
    
    // MARK: - State Queries
    
    func isPlaying() async -> Bool {
        return voicePlayer?.isPlaying ?? false
    }
    
    func getCurrentTime() async -> TimeInterval {
        return voicePlayer?.currentTime ?? 0
    }
    
    func getDuration() async -> TimeInterval {
        return voicePlayer?.duration ?? 0
    }
    
    // MARK: - Cleanup
    
    func cleanup() async {
        await stop()
        
        voicePlayer = nil
        backgroundPlayer = nil
        ambientPlayer = nil
        
        await stopUpdateTimer()
        
        NotificationCenter.default.removeObserver(self)
        
        do {
            try audioSession.setActive(false)
        } catch {
            Logger.shared.error("Failed to deactivate audio session: \(error)")
        }
    }
}

// MARK: - AVAudioPlayerDelegate

extension AudioService: AVAudioPlayerDelegate {
    nonisolated func audioPlayerDidFinishPlaying(_ player: AVAudioPlayer, successfully flag: Bool) {
        Task {
            await stopUpdateTimer()
            
            await MainActor.run {
                self.playbackState = .stopped
                self.currentTime = 0
            }
            
            if flag {
                Logger.shared.info("Audio playback finished successfully")
            } else {
                Logger.shared.error("Audio playback finished with error")
            }
        }
    }
    
    nonisolated func audioPlayerDecodeErrorDidOccur(_ player: AVAudioPlayer, error: Error?) {
        Task {
            Logger.shared.error("Audio decode error: \(error?.localizedDescription ?? "unknown")")
            
            await MainActor.run {
                self.playbackState = .error(AudioServiceError.playbackFailed)
            }
        }
    }
}

// MARK: - Preview Helper

extension AudioService {
    func playPreview(url: String, duration: TimeInterval = 10.0) async throws {
        try await playVoice(url: url)
        
        try? await Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
        
        await fadeOut(duration: 1.0)
    }
}