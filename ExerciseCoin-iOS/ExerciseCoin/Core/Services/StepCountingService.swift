import Foundation
import CoreMotion

@MainActor
class StepCountingService: ObservableObject {
    static let shared = StepCountingService()

    private let pedometer = CMPedometer()
    private var stepUpdateTimer: Timer?

    @Published var isAvailable = false
    @Published var isTracking = false
    @Published var currentSteps = 0
    @Published var stepsPerSecond: Double = 0

    private var startDate: Date?
    private var lastStepCount = 0
    private var lastUpdateTime: Date?
    private var stepBuffer: [StepData] = []

    private init() {
        checkAvailability()
    }

    private func checkAvailability() {
        isAvailable = CMPedometer.isStepCountingAvailable()
    }

    func startTracking() {
        guard isAvailable, !isTracking else { return }

        startDate = Date()
        lastStepCount = 0
        lastUpdateTime = Date()
        stepBuffer.removeAll()
        isTracking = true
        currentSteps = 0
        stepsPerSecond = 0

        pedometer.startUpdates(from: startDate!) { [weak self] data, error in
            guard let self = self, error == nil, let data = data else { return }

            Task { @MainActor in
                let newSteps = Int(truncating: data.numberOfSteps)
                let now = Date()

                if let lastTime = self.lastUpdateTime {
                    let timeDiff = now.timeIntervalSince(lastTime)
                    if timeDiff > 0 {
                        let stepDiff = newSteps - self.lastStepCount
                        self.stepsPerSecond = Double(stepDiff) / timeDiff
                    }
                }

                self.currentSteps = newSteps
                self.lastStepCount = newSteps
                self.lastUpdateTime = now

                // Buffer step data
                let stepData = StepData(
                    timestamp: now,
                    stepCount: newSteps,
                    stepsPerSecond: self.stepsPerSecond
                )
                self.stepBuffer.append(stepData)
            }
        }
    }

    func stopTracking() {
        pedometer.stopUpdates()
        isTracking = false
        stepUpdateTimer?.invalidate()
        stepUpdateTimer = nil
    }

    func getBufferedStepData() -> [StepData] {
        let data = stepBuffer
        stepBuffer.removeAll()
        return data
    }

    func reset() {
        stopTracking()
        currentSteps = 0
        stepsPerSecond = 0
        stepBuffer.removeAll()
        startDate = nil
        lastStepCount = 0
        lastUpdateTime = nil
    }
}
