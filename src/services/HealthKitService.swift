import Foundation
import HealthKit
import Combine

enum HealthKitError: LocalizedError {
    case notAvailable
    case authorizationDenied
    case dataUnavailable
    case queryFailed(Error)
    case writeFailed(Error)
    
    var errorDescription: String? {
        switch self {
        case .notAvailable:
            return "HealthKit is not available on this device"
        case .authorizationDenied:
            return "HealthKit authorization was denied"
        case .dataUnavailable:
            return "Health data is unavailable"
        case .queryFailed(let error):
            return "Failed to query health data: \(error.localizedDescription)"
        case .writeFailed(let error):
            return "Failed to write health data: \(error.localizedDescription)"
        }
    }
}

struct HeartRateData {
    let bpm: Double
    let timestamp: Date
    let source: String
}

struct ActivityData {
    let steps: Int
    let activeEnergyBurned: Double
    let exerciseMinutes: Int
    let standHours: Int
    let timestamp: Date
}

struct StressIndicators {
    let restingHeartRate: Double?
    let heartRateVariability: Double?
    let averageHeartRate: Double?
    let activityLevel: ActivityData?
    let timestamp: Date
}

final class HealthKitService: ObservableObject {
    static let shared = HealthKitService()
    
    private let healthStore = HKHealthStore()
    private var cancellables = Set<AnyCancellable>()
    private var heartRateQuery: HKObserverQuery?
    private var activityQuery: HKObserverQuery?
    
    @Published var isAuthorized = false
    @Published var currentHeartRate: HeartRateData?
    @Published var stressIndicators: StressIndicators?
    
    let heartRatePublisher = PassthroughSubject<HeartRateData, Never>()
    let activityPublisher = PassthroughSubject<ActivityData, Never>()
    let stressIndicatorsPublisher = PassthroughSubject<StressIndicators, Never>()
    
    private init() {
        checkAvailability()
    }
    
    // MARK: - Availability Check
    
    func checkAvailability() -> Bool {
        return HKHealthStore.isHealthDataAvailable()
    }
    
    // MARK: - Authorization
    
    func requestAuthorization() async throws {
        guard checkAvailability() else {
            throw HealthKitError.notAvailable
        }
        
        let typesToRead: Set<HKObjectType> = [
            HKObjectType.quantityType(forIdentifier: .heartRate)!,
            HKObjectType.quantityType(forIdentifier: .restingHeartRate)!,
            HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!,
            HKObjectType.quantityType(forIdentifier: .stepCount)!,
            HKObjectType.quantityType(forIdentifier: .activeEnergyBurned)!,
            HKObjectType.quantityType(forIdentifier: .appleExerciseTime)!,
            HKObjectType.quantityType(forIdentifier: .appleStandTime)!,
            HKObjectType.categoryType(forIdentifier: .mindfulSession)!
        ]
        
        let typesToWrite: Set<HKSampleType> = [
            HKObjectType.categoryType(forIdentifier: .mindfulSession)!
        ]
        
        return try await withCheckedThrowingContinuation { continuation in
            healthStore.requestAuthorization(toShare: typesToWrite, read: typesToRead) { success, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error))
                    return
                }
                
                if success {
                    DispatchQueue.main.async {
                        self.isAuthorized = true
                    }
                    continuation.resume()
                } else {
                    continuation.resume(throwing: HealthKitError.authorizationDenied)
                }
            }
        }
    }
    
    func checkAuthorizationStatus() -> HKAuthorizationStatus {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            return .notDetermined
        }
        return healthStore.authorizationStatus(for: heartRateType)
    }
    
    // MARK: - Heart Rate
    
    func startHeartRateMonitoring() {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            Logger.shared.error("Heart rate type not available", category: .healthKit)
            return
        }
        
        let query = HKObserverQuery(sampleType: heartRateType, predicate: nil) { [weak self] _, completionHandler, error in
            guard let self = self else { return }
            
            if let error = error {
                Logger.shared.error("Heart rate monitoring error: \(error.localizedDescription)", category: .healthKit)
                completionHandler()
                return
            }
            
            Task {
                do {
                    let heartRate = try await self.fetchLatestHeartRate()
                    DispatchQueue.main.async {
                        self.currentHeartRate = heartRate
                        self.heartRatePublisher.send(heartRate)
                    }
                } catch {
                    Logger.shared.error("Failed to fetch heart rate: \(error.localizedDescription)", category: .healthKit)
                }
                completionHandler()
            }
        }
        
        heartRateQuery = query
        healthStore.execute(query)
        
        Logger.shared.info("Heart rate monitoring started", category: .healthKit)
    }
    
    func stopHeartRateMonitoring() {
        if let query = heartRateQuery {
            healthStore.stop(query)
            heartRateQuery = nil
            Logger.shared.info("Heart rate monitoring stopped", category: .healthKit)
        }
    }
    
    func fetchLatestHeartRate() async throws -> HeartRateData {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            throw HealthKitError.dataUnavailable
        }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let query = HKSampleQuery(
            sampleType: heartRateType,
            predicate: nil,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { _, samples, error in }
        
        return try await withCheckedThrowingContinuation { continuation in
            let sampleQuery = HKSampleQuery(
                sampleType: heartRateType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error))
                    return
                }
                
                guard let sample = samples?.first as? HKQuantitySample else {
                    continuation.resume(throwing: HealthKitError.dataUnavailable)
                    return
                }
                
                let bpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                let data = HeartRateData(
                    bpm: bpm,
                    timestamp: sample.endDate,
                    source: sample.sourceRevision.source.name
                )
                
                continuation.resume(returning: data)
            }
            
            healthStore.execute(sampleQuery)
        }
    }
    
    func fetchAverageHeartRate(startDate: Date, endDate: Date) async throws -> Double {
        guard let heartRateType = HKObjectType.quantityType(forIdentifier: .heartRate) else {
            throw HealthKitError.dataUnavailable
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: heartRateType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { _, statistics, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error))
                    return
                }
                
                guard let average = statistics?.averageQuantity() else {
                    continuation.resume(throwing: HealthKitError.dataUnavailable)
                    return
                }
                
                let bpm = average.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                continuation.resume(returning: bpm)
            }
            
            healthStore.execute(query)
        }
    }
    
    // MARK: - Resting Heart Rate
    
    func fetchRestingHeartRate() async throws -> Double {
        guard let restingHRType = HKObjectType.quantityType(forIdentifier: .restingHeartRate) else {
            throw HealthKitError.dataUnavailable
        }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: restingHRType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error))
                    return
                }
                
                guard let sample = samples?.first as? HKQuantitySample else {
                    continuation.resume(throwing: HealthKitError.dataUnavailable)
                    return
                }
                
                let bpm = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                continuation.resume(returning: bpm)
            }
            
            healthStore.execute(query)
        }
    }
    
    // MARK: - Heart Rate Variability
    
    func fetchHeartRateVariability() async throws -> Double {
        guard let hrvType = HKObjectType.quantityType(forIdentifier: .heartRateVariabilitySDNN) else {
            throw HealthKitError.dataUnavailable
        }
        
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKSampleQuery(
                sampleType: hrvType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sortDescriptor]
            ) { _, samples, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error))
                    return
                }
                
                guard let sample = samples?.first as? HKQuantitySample else {
                    continuation.resume(throwing: HealthKitError.dataUnavailable)
                    return
                }
                
                let ms = sample.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
                continuation.resume(returning: ms)
            }
            
            healthStore.execute(query)
        }
    }
    
    // MARK: - Activity Data
    
    func fetchActivityData(for date: Date) async throws -> ActivityData {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        
        async let steps = fetchSteps(startDate: startOfDay, endDate: endOfDay)
        async let energy = fetchActiveEnergy(startDate: startOfDay, endDate: endOfDay)
        async let exercise = fetchExerciseMinutes(startDate: startOfDay, endDate: endOfDay)
        async let stand = fetchStandHours(startDate: startOfDay, endDate: endOfDay)
        
        let (stepsCount, energyBurned, exerciseMin, standHrs) = try await (steps, energy, exercise, stand)
        
        return ActivityData(
            steps: stepsCount,
            activeEnergyBurned: energyBurned,
            exerciseMinutes: exerciseMin,
            standHours: standHrs,
            timestamp: date
        )
    }
    
    private func fetchSteps(startDate: Date, endDate: Date) async throws -> Int {
        guard let stepsType = HKObjectType.quantityType(forIdentifier: .stepCount) else {
            throw HealthKitError.dataUnavailable
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: stepsType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error))
                    return
                }
                
                guard let sum = statistics?.sumQuantity() else {
                    continuation.resume(returning: 0)
                    return
                }
                
                let steps = Int(sum.doubleValue(for: .count()))
                continuation.resume(returning: steps)
            }
            
            healthStore.execute(query)
        }
    }
    
    private func fetchActiveEnergy(startDate: Date, endDate: Date) async throws -> Double {
        guard let energyType = HKObjectType.quantityType(forIdentifier: .activeEnergyBurned) else {
            throw HealthKitError.dataUnavailable
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: energyType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error))
                    return
                }
                
                guard let sum = statistics?.sumQuantity() else {
                    continuation.resume(returning: 0)
                    return
                }
                
                let kcal = sum.doubleValue(for: .kilocalorie())
                continuation.resume(returning: kcal)
            }
            
            healthStore.execute(query)
        }
    }
    
    private func fetchExerciseMinutes(startDate: Date, endDate: Date) async throws -> Int {
        guard let exerciseType = HKObjectType.quantityType(forIdentifier: .appleExerciseTime) else {
            throw HealthKitError.dataUnavailable
        }
        
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        return try await withCheckedThrowingContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: exerciseType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { _, statistics, error in
                if let error = error {
                    continuation.resume(throwing: HealthKitError.queryFailed(error