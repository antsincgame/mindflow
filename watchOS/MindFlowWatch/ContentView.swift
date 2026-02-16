import SwiftUI
import WatchConnectivity

struct ContentView: View {
    @StateObject private var connectivityManager = WatchConnectivityManager.shared
    @State private var selectedEmotion: Emotion?
    @State private var showingExercises = false
    @State private var currentHeartRate: Int = 0
    @State private var isMonitoringHeartRate = false
    
    let emotions: [Emotion] = [
        Emotion(id: "stress", name: "Стресс", icon: "⚡️", color: .red),
        Emotion(id: "anxiety", name: "Тревога", icon: "😰", color: .orange),
        Emotion(id: "sadness", name: "Грусть", icon: "😢", color: .blue),
        Emotion(id: "fatigue", name: "Усталость", icon: "😴", color: .purple)
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 12) {
                    // Heart Rate Section
                    if isMonitoringHeartRate {
                        HeartRateCard(heartRate: currentHeartRate)
                            .padding(.horizontal, 8)
                    }
                    
                    // Quick Start Button
                    Button(action: {
                        startQuickExercise()
                    }) {
                        VStack(spacing: 4) {
                            Image(systemName: "bolt.fill")
                                .font(.system(size: 24))
                            Text("Быстрый старт")
                                .font(.caption2)
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .frame(height: 70)
                        .background(
                            LinearGradient(
                                gradient: Gradient(colors: [Color.blue, Color.purple]),
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .buttonStyle(PlainButtonStyle())
                    .padding(.horizontal, 8)
                    
                    // Emotions Grid
                    Text("Как вы себя чувствуете?")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(.horizontal, 8)
                        .padding(.top, 8)
                    
                    LazyVGrid(columns: [
                        GridItem(.flexible(), spacing: 8),
                        GridItem(.flexible(), spacing: 8)
                    ], spacing: 8) {
                        ForEach(emotions) { emotion in
                            EmotionButton(emotion: emotion) {
                                selectedEmotion = emotion
                                showingExercises = true
                            }
                        }
                    }
                    .padding(.horizontal, 8)
                    
                    // Stats Summary
                    StatsSummaryCard(
                        todaySessions: connectivityManager.todaySessions,
                        weekStreak: connectivityManager.weekStreak
                    )
                    .padding(.horizontal, 8)
                    .padding(.top, 8)
                }
                .padding(.vertical, 8)
            }
            .navigationTitle("MindFlow")
            .navigationBarTitleDisplayMode(.inline)
        }
        .sheet(isPresented: $showingExercises) {
            if let emotion = selectedEmotion {
                ExerciseListView(emotion: emotion)
            }
        }
        .onAppear {
            connectivityManager.startSession()
            startHeartRateMonitoring()
        }
        .onDisappear {
            stopHeartRateMonitoring()
        }
        .onChange(of: connectivityManager.heartRate) { newValue in
            currentHeartRate = newValue
        }
    }
    
    private func startQuickExercise() {
        let quickExercise = Exercise(
            id: "quick-breathing",
            name: "Быстрое дыхание",
            type: .breathing,
            duration: 180,
            description: "3 минуты осознанного дыхания"
        )
        
        let hostingController = WKHostingController(rootView: ExerciseView(exercise: quickExercise))
        WKInterfaceController.reloadRootControllers(withNames: ["ExerciseView"], contexts: [quickExercise])
    }
    
    private func startHeartRateMonitoring() {
        isMonitoringHeartRate = true
        connectivityManager.startHeartRateMonitoring()
    }
    
    private func stopHeartRateMonitoring() {
        isMonitoringHeartRate = false
        connectivityManager.stopHeartRateMonitoring()
    }
}

struct Emotion: Identifiable {
    let id: String
    let name: String
    let icon: String
    let color: Color
}

struct EmotionButton: View {
    let emotion: Emotion
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 4) {
                Text(emotion.icon)
                    .font(.system(size: 28))
                Text(emotion.name)
                    .font(.caption2)
                    .fontWeight(.medium)
                    .lineLimit(1)
                    .minimumScaleFactor(0.8)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 70)
            .background(emotion.color.opacity(0.2))
            .cornerRadius(10)
            .overlay(
                RoundedRectangle(cornerRadius: 10)
                    .stroke(emotion.color, lineWidth: 1)
            )
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct HeartRateCard: View {
    let heartRate: Int
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: "heart.fill")
                .foregroundColor(.red)
                .font(.system(size: 18))
            
            Text("\(heartRate)")
                .font(.system(size: 24, weight: .bold, design: .rounded))
                .foregroundColor(.primary)
            
            Text("BPM")
                .font(.caption2)
                .foregroundColor(.secondary)
            
            Spacer()
        }
        .padding(12)
        .background(Color.red.opacity(0.1))
        .cornerRadius(10)
    }
}

struct StatsSummaryCard: View {
    let todaySessions: Int
    let weekStreak: Int
    
    var body: some View {
        VStack(spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text("Сегодня")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    Text("\(todaySessions)")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(.primary)
                }
                
                Spacer()
                
                Divider()
                    .frame(height: 30)
                
                Spacer()
                
                VStack(alignment: .trailing, spacing: 2) {
                    Text("Серия")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                    HStack(spacing: 4) {
                        Text("\(weekStreak)")
                            .font(.system(size: 20, weight: .bold, design: .rounded))
                            .foregroundColor(.primary)
                        Image(systemName: "flame.fill")
                            .foregroundColor(.orange)
                            .font(.system(size: 16))
                    }
                }
            }
            .padding(12)
        }
        .background(Color.gray.opacity(0.1))
        .cornerRadius(10)
    }
}

struct ExerciseListView: View {
    let emotion: Emotion
    @Environment(\.dismiss) var dismiss
    
    let exercises: [Exercise] = [
        Exercise(
            id: "breathing-4-7-8",
            name: "4-7-8 дыхание",
            type: .breathing,
            duration: 300,
            description: "Вдох 4 сек, задержка 7 сек, выдох 8 сек"
        ),
        Exercise(
            id: "box-breathing",
            name: "Коробочное дыхание",
            type: .breathing,
            duration: 240,
            description: "Равные интервалы по 4 секунды"
        ),
        Exercise(
            id: "calm-meditation",
            name: "Медитация спокойствия",
            type: .meditation,
            duration: 600,
            description: "10 минут осознанной медитации"
        ),
        Exercise(
            id: "body-scan",
            name: "Сканирование тела",
            type: .mindfulness,
            duration: 420,
            description: "7 минут телесной осознанности"
        )
    ]
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 8) {
                    ForEach(exercises) { exercise in
                        NavigationLink(destination: ExerciseView(exercise: exercise)) {
                            ExerciseCard(exercise: exercise)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.vertical, 8)
                .padding(.horizontal, 8)
            }
            .navigationTitle(emotion.name)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Закрыть") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct ExerciseCard: View {
    let exercise: Exercise
    
    var typeIcon: String {
        switch exercise.type {
        case .breathing:
            return "wind"
        case .meditation:
            return "brain.head.profile"
        case .mindfulness:
            return "leaf.fill"
        }
    }
    
    var typeColor: Color {
        switch exercise.type {
        case .breathing:
            return .blue
        case .meditation:
            return .purple
        case .mindfulness:
            return .green
        }
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: typeIcon)
                    .foregroundColor(typeColor)
                    .font(.system(size: 16))
                
                Text(exercise.name)
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundColor(.primary)
                    .lineLimit(2)
                
                Spacer()
            }
            
            Text(exercise.description)
                .font(.caption2)
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            HStack {
                Image(systemName: "clock")
                    .font(.system(size: 10))
                Text("\(exercise.duration / 60) мин")
                    .font(.caption2)
                    .fontWeight(.medium)
            }
            .foregroundColor(typeColor)
        }
        .padding(10)
        .background(typeColor.opacity(0.1))
        .cornerRadius(10)
        .overlay(
            RoundedRectangle(cornerRadius: 10)
                .stroke(typeColor.opacity(0.3), lineWidth: 1)
        )
    }
}

struct Exercise: Identifiable {
    let id: String
    let name: String
    let type: ExerciseType
    let duration: Int
    let description: String
}

enum ExerciseType {
    case breathing
    case meditation
    case mindfulness
}

class WatchConnectivityManager: NSObject, ObservableObject {
    static let shared = WatchConnectivityManager()
    
    @Published var todaySessions: Int = 0
    @Published var weekStreak: Int = 0
    @Published var heartRate: Int = 0
    
    private var session: WCSession?
    private var workoutSession: HKWorkoutSession?
    private let healthStore = HKHealthStore()
    
    override init() {
        super.init()
        
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
        }
    }
    
    func startSession() {
        session?.activate()
        requestHealthKitAuthorization()
    }
    
    func startHeartRateMonitoring() {
        let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate)!
        
        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { [weak self] _, _, error in
            if error == nil {
                self?.fetchLatestHeartRate()
            }
        }
        
        healthStore.execute(query)
        
        // Initial fetch
        fetchLatestHeartRate()
    }
    
    func stopHeartRateMonitoring() {
        healthStore.stop(HKObserverQuery(sampleType: HKObjectType.quantityType(forIdentifier: .heartRate)!, predicate: nil) { _, _, _ in })
    }
    
    private func requestHealthKitAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else { return }
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!
        ]
        
        healthStore.requestAuthorization(toShare: nil, read: typesToRead) { success, error in
            if success {
                print("HealthKit authorization granted")
            }
        }
    }
    
    private func fetchLatestHeartRate() {
        let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        let query = HKSampleQuery(sampleType: heartRateType, predicate: nil, limit: 1, sortDescriptors: [sortDescriptor]) { [weak self] _, samples, error in
            guard let sample = samples?.first as? HKQuantitySample else { return }
            
            let heartRateUnit = HKUnit.count().unitDivided(by: HKUnit.minute())
            let heartRate = sample.quantity.doubleValue(for: heartRateUnit)
            
            DispatchQueue.main.async {
                self?.heartRate = Int(heartRate)
            }
        }
        
        healthStore.execute(query)
    }
    
    func sendSessionData(exercise: Exercise, duration: Int, heartRateAvg: Int) {
        guard let session = session, session.isReachable else { return }
        
        let data: [String: Any] = [
            "type": "sessionComplete",
            "exerciseId": exercise.id,
            "duration": duration,
            "heartRate": heartRateAvg,
            "timestamp": Date().timeIntervalSince1970
        ]
        
        session.sendMessage(data, replyHandler: nil) { error in
            print("Error sending session data: \(error.localizedDescription)")
        }
    }
}

extension WatchConnectivityManager: WCSessionDelegate {
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if activationState == .activated {
            print("WCSession activated")