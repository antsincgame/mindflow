import SwiftUI
import Combine
import AVFoundation

struct MeditationSessionScreen: View {
    @StateObject private var viewModel: MeditationSessionViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var showExerciseSelection = false
    @State private var showExitConfirmation = false
    
    init(exercise: Exercise, stressLevel: Int) {
        _viewModel = StateObject(wrappedValue: MeditationSessionViewModel(
            exercise: exercise,
            stressLevel: stressLevel
        ))
    }
    
    var body: some View {
        ZStack {
            Color.background
                .ignoresSafeArea()
            
            VStack(spacing: 0) {
                headerView
                
                Spacer()
                
                breathingAnimationView
                
                Spacer()
                
                controlsView
                
                bottomActionsView
            }
            .padding(.horizontal, Spacing.large)
            .padding(.vertical, Spacing.medium)
            
            if viewModel.isPreparationPhase {
                preparationOverlay
            }
        }
        .navigationBarHidden(true)
        .onAppear {
            viewModel.startSession()
        }
        .onDisappear {
            viewModel.stopSession()
        }
        .sheet(isPresented: $showExerciseSelection) {
            ExerciseSelectionScreen(
                currentExercise: viewModel.currentExercise,
                stressLevel: viewModel.stressLevel,
                onExerciseSelected: { exercise in
                    viewModel.switchExercise(to: exercise)
                    showExerciseSelection = false
                }
            )
        }
        .alert("Завершить сессию?", isPresented: $showExitConfirmation) {
            Button("Отмена", role: .cancel) {}
            Button("Завершить", role: .destructive) {
                viewModel.stopSession()
                dismiss()
            }
        } message: {
            Text("Вы уверены, что хотите прервать медитацию?")
        }
    }
    
    private var headerView: some View {
        HStack {
            Button(action: {
                showExitConfirmation = true
            }) {
                Image(systemName: "xmark")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(.secondary)
                    .frame(width: 44, height: 44)
            }
            
            Spacer()
            
            VStack(spacing: 4) {
                Text(viewModel.currentExercise.name)
                    .font(Typography.title3)
                    .foregroundColor(.primary)
                
                Text(viewModel.currentPhaseDescription)
                    .font(Typography.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Button(action: {
                showExerciseSelection = true
            }) {
                Image(systemName: "arrow.triangle.2.circlepath")
                    .font(.system(size: 20, weight: .medium))
                    .foregroundColor(.primary)
                    .frame(width: 44, height: 44)
            }
        }
    }
    
    private var breathingAnimationView: some View {
        ZStack {
            BreathingAnimation(
                phase: viewModel.breathingPhase,
                stressLevel: viewModel.stressLevel,
                isActive: viewModel.isSessionActive && !viewModel.isPaused
            )
            
            VStack(spacing: 8) {
                Text(viewModel.breathingInstructionText)
                    .font(Typography.title1)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
                
                if viewModel.showBreathCount {
                    Text("\(viewModel.currentBreathCount)")
                        .font(.system(size: 48, weight: .light, design: .rounded))
                        .foregroundColor(.secondary)
                        .transition(.opacity)
                }
            }
        }
        .frame(maxWidth: .infinity)
    }
    
    private var controlsView: some View {
        VStack(spacing: Spacing.large) {
            SessionTimer(
                elapsedSeconds: viewModel.elapsedSeconds,
                totalSeconds: viewModel.currentExercise.durationSeconds,
                isActive: viewModel.isSessionActive && !viewModel.isPaused
            )
            
            HStack(spacing: Spacing.medium) {
                if viewModel.isSessionActive {
                    Button(action: {
                        viewModel.togglePause()
                    }) {
                        Image(systemName: viewModel.isPaused ? "play.fill" : "pause.fill")
                            .font(.system(size: 24))
                            .foregroundColor(.white)
                            .frame(width: 60, height: 60)
                            .background(Color.primary)
                            .clipShape(Circle())
                    }
                    
                    Button(action: {
                        viewModel.skipToNextPhase()
                    }) {
                        Image(systemName: "forward.fill")
                            .font(.system(size: 20))
                            .foregroundColor(.primary)
                            .frame(width: 50, height: 50)
                            .background(Color.secondary.opacity(0.1))
                            .clipShape(Circle())
                    }
                }
            }
        }
    }
    
    private var bottomActionsView: some View {
        HStack(spacing: Spacing.medium) {
            if viewModel.canAdjustDuration {
                Button(action: {
                    viewModel.extendDuration(by: 300)
                }) {
                    HStack(spacing: 8) {
                        Image(systemName: "plus.circle")
                        Text("+5 мин")
                    }
                    .font(Typography.body)
                    .foregroundColor(.primary)
                    .padding(.horizontal, Spacing.medium)
                    .padding(.vertical, Spacing.small)
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(20)
                }
            }
            
            Spacer()
            
            StressIndicator(
                level: viewModel.currentStressLevel,
                size: .compact
            )
        }
        .padding(.top, Spacing.medium)
    }
    
    private var preparationOverlay: some View {
        ZStack {
            Color.black.opacity(0.7)
                .ignoresSafeArea()
            
            VStack(spacing: Spacing.large) {
                Text("Подготовка к медитации")
                    .font(Typography.title2)
                    .foregroundColor(.white)
                
                Text(viewModel.preparationMessage)
                    .font(Typography.body)
                    .foregroundColor(.white.opacity(0.8))
                    .multilineTextAlignment(.center)
                    .padding(.horizontal, Spacing.xlarge)
                
                Text("\(viewModel.preparationCountdown)")
                    .font(.system(size: 72, weight: .light, design: .rounded))
                    .foregroundColor(.white)
                    .padding(.top, Spacing.medium)
                
                Button(action: {
                    viewModel.skipPreparation()
                }) {
                    Text("Пропустить")
                        .font(Typography.body)
                        .foregroundColor(.white.opacity(0.6))
                        .padding(.top, Spacing.medium)
                }
            }
        }
        .transition(.opacity)
    }
}

@MainActor
class MeditationSessionViewModel: ObservableObject {
    @Published var currentExercise: Exercise
    @Published var stressLevel: Int
    @Published var isSessionActive = false
    @Published var isPaused = false
    @Published var elapsedSeconds = 0
    @Published var breathingPhase: BreathingPhase = .inhale
    @Published var currentBreathCount = 0
    @Published var isPreparationPhase = false
    @Published var preparationCountdown = 15
    @Published var currentStressLevel: Int
    
    private let meditationService: MeditationService
    private let audioService: AudioService
    private let stressAnalysisService: StressAnalysisService
    private var sessionTimer: Timer?
    private var breathingTimer: Timer?
    private var preparationTimer: Timer?
    private var cancellables = Set<AnyCancellable>()
    private var sessionId: UUID?
    
    private var breathingCycleDuration: TimeInterval {
        switch stressLevel {
        case 0...3:
            return 16.0
        case 4...6:
            return 14.0
        case 7...8:
            return 12.0
        default:
            return 10.0
        }
    }
    
    private var preparationDuration: Int {
        switch stressLevel {
        case 0...3:
            return 15
        case 4...6:
            return 10
        case 7...8:
            return 5
        default:
            return 0
        }
    }
    
    var currentPhaseDescription: String {
        if isPreparationPhase {
            return "Подготовка"
        }
        return breathingPhase.description
    }
    
    var breathingInstructionText: String {
        switch breathingPhase {
        case .inhale:
            return "Вдох"
        case .hold:
            return "Задержка"
        case .exhale:
            return "Выдох"
        case .rest:
            return "Отдых"
        }
    }
    
    var showBreathCount: Bool {
        return currentExercise.type == .breathing && currentBreathCount > 0
    }
    
    var canAdjustDuration: Bool {
        return isSessionActive && !isPaused && elapsedSeconds > 60
    }
    
    var preparationMessage: String {
        switch stressLevel {
        case 0...3:
            return "Найдите удобное положение. Сделайте несколько глубоких вдохов."
        case 4...6:
            return "Устройтесь поудобнее. Готовимся начать практику."
        case 7...8:
            return "Сейчас начнём. Просто дышите."
        default:
            return "Начинаем прямо сейчас."
        }
    }
    
    init(
        exercise: Exercise,
        stressLevel: Int,
        meditationService: MeditationService = .shared,
        audioService: AudioService = .shared,
        stressAnalysisService: StressAnalysisService = .shared
    ) {
        self.currentExercise = exercise
        self.stressLevel = stressLevel
        self.currentStressLevel = stressLevel
        self.meditationService = meditationService
        self.audioService = audioService
        self.stressAnalysisService = stressAnalysisService
    }
    
    func startSession() {
        let prepDuration = preparationDuration
        
        if prepDuration > 0 {
            startPreparationPhase()
        } else {
            startMeditationPhase()
        }
    }
    
    private func startPreparationPhase() {
        isPreparationPhase = true
        preparationCountdown = preparationDuration
        
        audioService.playPreparationSound()
        
        preparationTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            if self.preparationCountdown > 1 {
                self.preparationCountdown -= 1
            } else {
                self.preparationTimer?.invalidate()
                self.isPreparationPhase = false
                self.startMeditationPhase()
            }
        }
    }
    
    func skipPreparation() {
        preparationTimer?.invalidate()
        isPreparationPhase = false
        startMeditationPhase()
    }
    
    private func startMeditationPhase() {
        Task {
            do {
                sessionId = try await meditationService.startSession(
                    exercise: currentExercise,
                    stressLevel: stressLevel
                )
                
                isSessionActive = true
                elapsedSeconds = 0
                currentBreathCount = 0
                
                await audioService.playExerciseAudio(currentExercise)
                startTimers()
                startStressMonitoring()
            } catch {
                Logger.error("Failed to start meditation session: \(error)")
            }
        }
    }
    
    private func startTimers() {
        sessionTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self, !self.isPaused else { return }
            
            self.elapsedSeconds += 1
            
            if self.elapsedSeconds >= self.currentExercise.durationSeconds {
                self.completeSession()
            }
        }
        
        startBreathingCycle()
    }
    
    private func startBreathingCycle() {
        let cycleDuration = breathingCycleDuration
        let phaseDuration = cycleDuration / 4.0
        
        breathingTimer = Timer.scheduledTimer(withTimeInterval: phaseDuration, repeats: true) { [weak self] _ in
            guard let self = self, !self.isPaused else { return }
            
            switch self.breathingPhase {
            case .inhale:
                self.breathingPhase = .hold
                self.audioService.playPhaseTransitionSound()
            case .hold:
                self.breathingPhase = .exhale
                self.audioService.playPhaseTransitionSound()
            case .exhale:
                self.breathingPhase = .rest
                self.currentBreathCount += 1
                self.audioService.playPhaseTransitionSound()
            case .rest:
                self.breathingPhase = .inhale
            }
        }
    }
    
    private func startStressMonitoring() {
        Timer.scheduledTimer(withTimeInterval: 30.0, repeats: true) { [weak self] timer in
            guard let self = self, self.isSessionActive else {
                timer.invalidate()
                return
            }
            
            Task {
                let newStressLevel = await self.stressAnalysisService.getCurrentStressLevel()
                await MainActor.run {
                    self.currentStressLevel = newStressLevel
                }
            }
        }
    }
    
    func togglePause() {
        isPaused.toggle()
        
        if isPaused {
            audioService.pauseAudio()
        } else {
            audioService.resumeAudio()
        }
    }
    
    func skipToNextPhase() {
        switch breathingPhase {
        case .inhale:
            breathingPhase = .hold
        case .hold:
            breathingPhase = .exhale
        case .exhale:
            breathingPhase = .rest
            currentBreathCount += 1
        case .rest:
            breathingPhase = .inhale
        }
        
        audioService.playPhaseTransitionSound()
    }
    
    func extendDuration(by seconds: Int) {
        currentExercise = Exercise(
            id: currentExercise.id,
            name: currentExercise.name,
            description: currentExercise.description,
            type: currentExercise.type,
            durationSeconds: currentExercise.durationSeconds + seconds,
            audioUrl: currentExercise.audioUrl,
            createdAt: currentExercise.createdAt
        )
    }
    
    func switchExercise(to exercise: Exercise) {
        stopTimers()
        currentExercise = exercise
        
        Task {