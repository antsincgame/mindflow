import SwiftUI
import HealthKit
import Combine

@MainActor
class HealthKitViewModel: ObservableObject {
    @Published var isAuthorized: Bool = false
    @Published var currentHeartRate: Int?
    @Published var restingHeartRate: Int?
    @Published var heartRateVariability: Double?
    @Published var activeEnergyBurned: Double?
    @Published var stepCount: Int?
    @Published var isMonitoring: Bool = false
    @Published var error: HealthKitError?
    
    private let healthStore = HKHealthStore()
    private var cancellables = Set<AnyCancellable>()
    private var heartRateQuery: HKAnchoredObjectQuery?
    private var observers: [HKObserverQuery] = []
    
    private let heartRateType = HKQuantityType.quantityType(forIdentifier: .heartRate)!
    private let restingHeartRateType = HKQuantityType.quantityType(forIdentifier: .restingHeartRate)!
    private let hrvType = HKQuantityType.quantityType(forIdentifier: .heartRateVariabilitySDNN)!
    private let activeEnergyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned)!
    private let stepCountType = HKQuantityType.quantityType(forIdentifier: .stepCount)!
    
    enum HealthKitError: LocalizedError {
        case notAvailable
        case authorizationDenied
        case dataNotAvailable
        case queryFailed(String)
        
        var errorDescription: String? {
            switch self {
            case .notAvailable:
                return "HealthKit is not available on this device"
            case .authorizationDenied:
                return "HealthKit authorization was denied"
            case .dataNotAvailable:
                return "Health data is not available"
            case .queryFailed(let message):
                return "Query failed: \(message)"
            }
        }
    }
    
    init() {
        checkAuthorization()
    }
    
    func requestAuthorization() async throws {
        guard HKHealthStore.isHealthDataAvailable() else {
            error = .notAvailable
            throw HealthKitError.notAvailable
        }
        
        let typesToRead: Set<HKObjectType> = [
            heartRateType,
            restingHeartRateType,
            hrvType,
            activeEnergyType,
            stepCountType
        ]
        
        do {
            try await healthStore.requestAuthorization(toShare: [], read: typesToRead)
            
            let heartRateStatus = healthStore.authorizationStatus(for: heartRateType)
            isAuthorized = heartRateStatus == .sharingAuthorized
            
            if !isAuthorized {
                error = .authorizationDenied
                throw HealthKitError.authorizationDenied
            }
            
            await startMonitoring()
        } catch {
            self.error = .authorizationDenied
            throw HealthKitError.authorizationDenied
        }
    }
    
    func checkAuthorization() {
        guard HKHealthStore.isHealthDataAvailable() else {
            isAuthorized = false
            return
        }
        
        let status = healthStore.authorizationStatus(for: heartRateType)
        isAuthorized = status == .sharingAuthorized
        
        if isAuthorized {
            Task {
                await startMonitoring()
            }
        }
    }
    
    func startMonitoring() async {
        guard isAuthorized else { return }
        
        isMonitoring = true
        
        await startHeartRateMonitoring()
        await fetchRestingHeartRate()
        await fetchHeartRateVariability()
        await fetchTodayActivity()
        
        setupBackgroundObservers()
    }
    
    func stopMonitoring() {
        isMonitoring = false
        
        if let query = heartRateQuery {
            healthStore.stop(query)
            heartRateQuery = nil
        }
        
        observers.forEach { healthStore.stop($0) }
        observers.removeAll()
    }
    
    private func startHeartRateMonitoring() async {
        let predicate = HKQuery.predicateForSamples(
            withStart: Date().addingTimeInterval(-3600),
            end: nil,
            options: .strictStartDate
        )
        
        let query = HKAnchoredObjectQuery(
            type: heartRateType,
            predicate: predicate,
            anchor: nil,
            limit: HKObjectQueryNoLimit
        ) { [weak self] query, samples, deletedObjects, anchor, error in
            guard let self = self else { return }
            
            Task { @MainActor in
                if let error = error {
                    self.error = .queryFailed(error.localizedDescription)
                    return
                }
                
                if let samples = samples as? [HKQuantitySample], let latest = samples.last {
                    let value = latest.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    self.currentHeartRate = Int(value)
                }
            }
        }
        
        query.updateHandler = { [weak self] query, samples, deletedObjects, anchor, error in
            guard let self = self else { return }
            
            Task { @MainActor in
                if let samples = samples as? [HKQuantitySample], let latest = samples.last {
                    let value = latest.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    self.currentHeartRate = Int(value)
                }
            }
        }
        
        heartRateQuery = query
        healthStore.execute(query)
    }
    
    private func fetchRestingHeartRate() async {
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let predicate = HKQuery.predicateForSamples(
            withStart: Calendar.current.startOfDay(for: Date()),
            end: Date(),
            options: .strictStartDate
        )
        
        let query = HKSampleQuery(
            sampleType: restingHeartRateType,
            predicate: predicate,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { [weak self] query, samples, error in
            guard let self = self else { return }
            
            Task { @MainActor in
                if let error = error {
                    self.error = .queryFailed(error.localizedDescription)
                    return
                }
                
                if let sample = samples?.first as? HKQuantitySample {
                    let value = sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    self.restingHeartRate = Int(value)
                }
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchHeartRateVariability() async {
        let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
        let predicate = HKQuery.predicateForSamples(
            withStart: Calendar.current.startOfDay(for: Date()),
            end: Date(),
            options: .strictStartDate
        )
        
        let query = HKSampleQuery(
            sampleType: hrvType,
            predicate: predicate,
            limit: 1,
            sortDescriptors: [sortDescriptor]
        ) { [weak self] query, samples, error in
            guard let self = self else { return }
            
            Task { @MainActor in
                if let error = error {
                    self.error = .queryFailed(error.localizedDescription)
                    return
                }
                
                if let sample = samples?.first as? HKQuantitySample {
                    let value = sample.quantity.doubleValue(for: HKUnit.secondUnit(with: .milli))
                    self.heartRateVariability = value
                }
            }
        }
        
        healthStore.execute(query)
    }
    
    private func fetchTodayActivity() async {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: Date(), options: .strictStartDate)
        
        // Active Energy
        let energyQuery = HKStatisticsQuery(
            quantityType: activeEnergyType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { [weak self] query, statistics, error in
            guard let self = self else { return }
            
            Task { @MainActor in
                if let sum = statistics?.sumQuantity() {
                    self.activeEnergyBurned = sum.doubleValue(for: .kilocalorie())
                }
            }
        }
        
        // Step Count
        let stepsQuery = HKStatisticsQuery(
            quantityType: stepCountType,
            quantitySamplePredicate: predicate,
            options: .cumulativeSum
        ) { [weak self] query, statistics, error in
            guard let self = self else { return }
            
            Task { @MainActor in
                if let sum = statistics?.sumQuantity() {
                    self.stepCount = Int(sum.doubleValue(for: .count()))
                }
            }
        }
        
        healthStore.execute(energyQuery)
        healthStore.execute(stepsQuery)
    }
    
    private func setupBackgroundObservers() {
        let types: [HKSampleType] = [
            restingHeartRateType,
            hrvType,
            activeEnergyType,
            stepCountType
        ]
        
        types.forEach { type in
            let query = HKObserverQuery(sampleType: type, predicate: nil) { [weak self] query, completionHandler, error in
                guard let self = self else {
                    completionHandler()
                    return
                }
                
                Task { @MainActor in
                    switch type {
                    case self.restingHeartRateType:
                        await self.fetchRestingHeartRate()
                    case self.hrvType:
                        await self.fetchHeartRateVariability()
                    case self.activeEnergyType, self.stepCountType:
                        await self.fetchTodayActivity()
                    default:
                        break
                    }
                    completionHandler()
                }
            }
            
            healthStore.execute(query)
            observers.append(query)
        }
    }
    
    func getAverageHeartRate(for duration: TimeInterval) async -> Double? {
        let endDate = Date()
        let startDate = endDate.addingTimeInterval(-duration)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let query = HKStatisticsQuery(
                quantityType: heartRateType,
                quantitySamplePredicate: predicate,
                options: .discreteAverage
            ) { query, statistics, error in
                if let average = statistics?.averageQuantity() {
                    let value = average.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    continuation.resume(returning: value)
                } else {
                    continuation.resume(returning: nil)
                }
            }
            
            healthStore.execute(query)
        }
    }
    
    func getHeartRateRange(for duration: TimeInterval) async -> (min: Double, max: Double)? {
        let endDate = Date()
        let startDate = endDate.addingTimeInterval(-duration)
        let predicate = HKQuery.predicateForSamples(withStart: startDate, end: endDate, options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            let sortDescriptor = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            
            let query = HKSampleQuery(
                sampleType: heartRateType,
                predicate: predicate,
                limit: HKObjectQueryNoLimit,
                sortDescriptors: [sortDescriptor]
            ) { query, samples, error in
                guard let samples = samples as? [HKQuantitySample], !samples.isEmpty else {
                    continuation.resume(returning: nil)
                    return
                }
                
                let values = samples.map { sample in
                    sample.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                }
                
                if let min = values.min(), let max = values.max() {
                    continuation.resume(returning: (min: min, max: max))
                } else {
                    continuation.resume(returning: nil)
                }
            }
            
            healthStore.execute(query)
        }
    }
    
    func getActivitySummary(for date: Date) async -> (steps: Int, energy: Double, distance: Double)? {
        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: date)
        let endOfDay = calendar.date(byAdding: .day, value: 1, to: startOfDay)!
        let predicate = HKQuery.predicateForSamples(withStart: startOfDay, end: endOfDay, options: .strictStartDate)
        
        return await withCheckedContinuation { continuation in
            var steps: Int?
            var energy: Double?
            var distance: Double?
            let group = DispatchGroup()
            
            // Steps
            group.enter()
            let stepsQuery = HKStatisticsQuery(
                quantityType: stepCountType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { query, statistics, error in
                if let sum = statistics?.sumQuantity() {
                    steps = Int(sum.doubleValue(for: .count()))
                }
                group.leave()
            }
            
            // Active Energy
            group.enter()
            let energyQuery = HKStatisticsQuery(
                quantityType: activeEnergyType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { query, statistics, error in
                if let sum = statistics?.sumQuantity() {
                    energy = sum.doubleValue(for: .kilocalorie())
                }
                group.leave()
            }
            
            // Distance
            group.enter()
            let distanceType = HKQuantityType.quantityType(forIdentifier: .distanceWalkingRunning)!
            let distanceQuery = HKStatisticsQuery(
                quantityType: distanceType,
                quantitySamplePredicate: predicate,
                options: .cumulativeSum
            ) { query, statistics, error in
                if let sum = statistics?.sumQuantity() {
                    distance = sum.doubleValue(for: .meter()) / 1000.0
                }
                group.leave()
            }
            
            healthStore.execute(stepsQuery)
            healthStore.execute(energyQuery)
            healthStore.execute(distanceQuery)
            
            group.notify(queue: .main) {
                if let steps = steps, let energy = energy, let distance = distance {
                    continuation.resume(returning: (steps: steps, energy: energy, distance: distance))
                } else {
                    continuation.resume(returning: nil)
                }
            }
        }
    }
    
    deinit {
        stopMonitoring()
    }
}

func useHealthKit() -> HealthKitViewModel {
    return HealthKitViewModel()
}