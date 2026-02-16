import SwiftUI
import WatchKit
import HealthKit

struct ExerciseView: View {
    @Environment(\.presentationMode) var presentationMode
    @StateObject private var viewModel = ExerciseViewModel()
    
    let exercise: Exercise
    
    var body: some View {
        ZStack {
            if viewModel.isCompleted {
                completionView
            } else {
                exerciseView
            }
        }
        .navigationBarBackButtonHidden(viewModel.isActive)
        .onAppear {
            viewModel.setupExercise(exercise)
        }
        .onDisappear {
            viewModel.cleanup()
        }
    }
    
    private var exerciseView: some View {
        VStack(spacing: 12) {
            if !viewModel.isActive {
                startView
            } else {
                activeExerciseView
            }
        }
        .padding()
    }
    
    private var startView: some View {
        VStack(spacing: 16) {
            Text(exercise.name)
                .font(.headline)
                .multilineTextAlignment(.center)
            
            Text(exercise.duration.formattedTime)
                .font(.system(size: 40, weight: .bold, design: .rounded))
                .foregroundColor(.accentColor)
            
            Text(exercise.description)
                .font(.caption)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
            
            Button(action: {
                viewModel.startExercise()
            }) {
                HStack {
                    Image(systemName: "play.fill")
                    Text("Start")
                }
                .font(.headline)
            }
            .buttonStyle(.borderedProminent)
            .tint(.green)
        }
    }
    
    private var activeExerciseView: some View {
        VStack(spacing: 8) {
            // Timer Circle
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 8)
                
                Circle()
                    .trim(from: 0, to: viewModel.progress)
                    .stroke(
                        exerciseColor,
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.linear(duration: 0.5), value: viewModel.progress)
                
                VStack(spacing: 4) {
                    Text(viewModel.timeRemaining.formattedTime)
                        .font(.system(size: 32, weight: .bold, design: .rounded))
                    
                    if let heartRate = viewModel.currentHeartRate {
                        HStack(spacing: 4) {
                            Image(systemName: "heart.fill")
                                .foregroundColor(.red)
                                .font(.caption)
                            Text("\(heartRate)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .frame(width: 140, height: 140)
            
            // Current Phase
            if let phase = viewModel.currentPhase {
                Text(phase)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Control Buttons
            HStack(spacing: 16) {
                Button(action: {
                    viewModel.pauseExercise()
                }) {
                    Image(systemName: viewModel.isPaused ? "play.fill" : "pause.fill")
                        .font(.title3)
                }
                .buttonStyle(.bordered)
                .tint(.blue)
                
                Button(action: {
                    viewModel.stopExercise()
                }) {
                    Image(systemName: "stop.fill")
                        .font(.title3)
                }
                .buttonStyle(.bordered)
                .tint(.red)
            }
        }
    }
    
    private var completionView: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle.fill")
                .font(.system(size: 60))
                .foregroundColor(.green)
            
            Text("Well Done!")
                .font(.headline)
            
            if let avgHeartRate = viewModel.averageHeartRate {
                VStack(spacing: 4) {
                    Text("Avg Heart Rate")
                        .font(.caption)
                        .foregroundColor(.secondary)
                    HStack(spacing: 4) {
                        Image(systemName: "heart.fill")
                            .foregroundColor(.red)
                        Text("\(avgHeartRate) BPM")
                            .font(.title3)
                            .fontWeight(.semibold)
                    }
                }
            }
            
            Button(action: {
                presentationMode.wrappedValue.dismiss()
            }) {
                Text("Done")
                    .font(.headline)
            }
            .buttonStyle(.borderedProminent)
            .tint(.green)
        }
        .padding()
    }
    
    private var exerciseColor: Color {
        switch exercise.type {
        case .breathing:
            return .blue
        case .meditation:
            return .purple
        case .mindfulness:
            return .green
        }
    }
}

class ExerciseViewModel: NSObject, ObservableObject {
    @Published var isActive = false
    @Published var isPaused = false
    @Published var isCompleted = false
    @Published var timeRemaining: TimeInterval = 0
    @Published var progress: Double = 0
    @Published var currentPhase: String?
    @Published var currentHeartRate: Int?
    @Published var averageHeartRate: Int?
    
    private var exercise: Exercise?
    private var timer: Timer?
    private var startTime: Date?
    private var totalDuration: TimeInterval = 0
    private var healthStore: HKHealthStore?
    private var heartRateQuery: HKAnchoredObjectQuery?
    private var heartRateSamples: [Int] = []
    private var workoutSession: HKWorkoutSession?
    private var workoutBuilder: HKLiveWorkoutBuilder?
    
    override init() {
        super.init()
        setupHealthKit()
    }
    
    func setupExercise(_ exercise: Exercise) {
        self.exercise = exercise
        self.totalDuration = exercise.duration
        self.timeRemaining = exercise.duration
    }
    
    func startExercise() {
        guard let exercise = exercise else { return }
        
        isActive = true
        isPaused = false
        startTime = Date()
        
        startWorkoutSession()
        startHeartRateMonitoring()
        startTimer()
        startHapticFeedback()
        
        WKInterfaceDevice.current().play(.start)
    }
    
    func pauseExercise() {
        isPaused.toggle()
        
        if isPaused {
            timer?.invalidate()
            pauseWorkoutSession()
            WKInterfaceDevice.current().play(.click)
        } else {
            startTimer()
            resumeWorkoutSession()
            WKInterfaceDevice.current().play(.start)
        }
    }
    
    func stopExercise() {
        timer?.invalidate()
        stopHeartRateMonitoring()
        endWorkoutSession()
        
        if timeRemaining <= 0 {
            isCompleted = true
            calculateAverageHeartRate()
            WKInterfaceDevice.current().play(.success)
        } else {
            isActive = false
            WKInterfaceDevice.current().play(.stop)
        }
    }
    
    func cleanup() {
        timer?.invalidate()
        stopHeartRateMonitoring()
        endWorkoutSession()
    }
    
    private func startTimer() {
        timer = Timer.scheduledTimer(withTimeInterval: 0.1, repeats: true) { [weak self] _ in
            guard let self = self else { return }
            
            if self.timeRemaining > 0 {
                self.timeRemaining -= 0.1
                self.progress = 1 - (self.timeRemaining / self.totalDuration)
                self.updatePhase()
            } else {
                self.stopExercise()
            }
        }
    }
    
    private func updatePhase() {
        guard let exercise = exercise else { return }
        
        switch exercise.type {
        case .breathing:
            updateBreathingPhase()
        case .meditation:
            currentPhase = "Focus on your breath"
        case .mindfulness:
            currentPhase = "Be present"
        }
    }
    
    private func updateBreathingPhase() {
        let elapsed = totalDuration - timeRemaining
        let cycleTime = 16.0 // 4-7-8 breathing cycle
        let position = elapsed.truncatingRemainder(dividingBy: cycleTime)
        
        if position < 4 {
            currentPhase = "Breathe in..."
        } else if position < 11 {
            currentPhase = "Hold..."
        } else {
            currentPhase = "Breathe out..."
        }
    }
    
    private func startHapticFeedback() {
        guard let exercise = exercise, exercise.type == .breathing else { return }
        
        Timer.scheduledTimer(withTimeInterval: 4.0, repeats: true) { _ in
            WKInterfaceDevice.current().play(.notification)
        }
    }
    
    // MARK: - HealthKit
    
    private func setupHealthKit() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        
        healthStore = HKHealthStore()
        
        let typesToShare: Set = [
            HKObjectType.workoutType(),
            HKObjectType.quantityType(forIdentifier: .heartRate)!
        ]
        
        let typesToRead: Set = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!
        ]
        
        healthStore?.requestAuthorization(toShare: typesToShare, read: typesToRead) { success, error in
            if let error = error {
                print("HealthKit authorization error: \(error)")
            }
        }
    }
    
    private func startWorkoutSession() {
        guard let healthStore = healthStore else { return }
        
        let configuration = HKWorkoutConfiguration()
        configuration.activityType = .mindAndBody
        configuration.locationType = .indoor
        
        do {
            workoutSession = try HKWorkoutSession(healthStore: healthStore, configuration: configuration)
            workoutBuilder = workoutSession?.associatedWorkoutBuilder()
            
            workoutBuilder?.dataSource = HKLiveWorkoutDataSource(
                healthStore: healthStore,
                workoutConfiguration: configuration
            )
            
            workoutSession?.startActivity(with: Date())
            workoutBuilder?.beginCollection(withStart: Date()) { success, error in
                if let error = error {
                    print("Workout builder error: \(error)")
                }
            }
        } catch {
            print("Workout session error: \(error)")
        }
    }
    
    private func pauseWorkoutSession() {
        workoutSession?.pause()
    }
    
    private func resumeWorkoutSession() {
        workoutSession?.resume()
    }
    
    private func endWorkoutSession() {
        workoutSession?.end()
        
        workoutBuilder?.endCollection(withEnd: Date()) { success, error in
            if success {
                self.workoutBuilder?.finishWorkout { workout, error in
                    if let error = error {
                        print("Finish workout error: \(error)")
                    }
                }
            }
        }
    }
    
    private func startHeartRateMonitoring() {
        guard let healthStore = healthStore,
              let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            return
        }
        
        let predicate = HKQuery.predicateForSamples(
            withStart: Date(),
            end: nil,
            options: .strictStartDate
        )
        
        heartRateQuery = HKAnchoredObjectQuery(
            type: heartRateType,
            predicate: predicate,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processHeartRateSamples(samples)
        }
        
        heartRateQuery?.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
            self?.processHeartRateSamples(samples)
        }
        
        healthStore.execute(heartRateQuery!)
    }
    
    private func stopHeartRateMonitoring() {
        if let query = heartRateQuery {
            healthStore?.stop(query)
        }
    }
    
    private func processHeartRateSamples(_ samples: [HKSample]?) {
        guard let heartRateSamples = samples as? [HKQuantitySample] else { return }
        
        for sample in heartRateSamples {
            let heartRateUnit = HKUnit.count().unitDivided(by: .minute())
            let heartRate = Int(sample.quantity.doubleValue(for: heartRateUnit))
            
            DispatchQueue.main.async {
                self.currentHeartRate = heartRate
                self.heartRateSamples.append(heartRate)
            }
        }
    }
    
    private func calculateAverageHeartRate() {
        guard !heartRateSamples.isEmpty else { return }
        
        let sum = heartRateSamples.reduce(0, +)
        averageHeartRate = sum / heartRateSamples.count
    }
}

// MARK: - Models

struct Exercise: Identifiable {
    let id = UUID()
    let name: String
    let description: String
    let type: ExerciseType
    let duration: TimeInterval
}

enum ExerciseType {
    case breathing
    case meditation
    case mindfulness
}

// MARK: - Extensions

extension TimeInterval {
    var formattedTime: String {
        let minutes = Int(self) / 60
        let seconds = Int(self) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }
}