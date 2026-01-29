import Foundation

@MainActor
class ExerciseViewModel: ObservableObject {
    @Published var isExercising = false
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var currentSession: ExerciseSession?
    @Published var sessions: [ExerciseSession] = []
    @Published var stats: ExerciseStats?
    @Published var elapsedSeconds = 0
    @Published var coinsEarned: Double = 0

    private let apiClient = APIClient.shared
    private let stepService = StepCountingService.shared
    private var timer: Timer?
    private var uploadTimer: Timer?

    var formattedTime: String {
        let hours = elapsedSeconds / 3600
        let minutes = (elapsedSeconds % 3600) / 60
        let seconds = elapsedSeconds % 60

        if hours > 0 {
            return String(format: "%02d:%02d:%02d", hours, minutes, seconds)
        } else {
            return String(format: "%02d:%02d", minutes, seconds)
        }
    }

    func loadInitialData() async {
        await loadStats()
        await loadSessions()
    }

    func loadStats() async {
        do {
            stats = try await apiClient.request(endpoint: .exerciseStats)
        } catch {
            // Silently handle stats loading error
        }
    }

    func loadSessions() async {
        do {
            let response: SessionsResponse = try await apiClient.request(endpoint: .sessions)
            sessions = response.sessions
        } catch {
            // Silently handle sessions loading error
        }
    }

    func startExercise() async {
        isLoading = true
        errorMessage = nil

        do {
            currentSession = try await apiClient.request(
                endpoint: .startSession,
                method: .post
            )

            isExercising = true
            elapsedSeconds = 0
            coinsEarned = 0

            // Start step counting
            stepService.startTracking()

            // Start timer
            startTimers()
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to start session"
        }

        isLoading = false
    }

    func stopExercise() async {
        guard let session = currentSession else { return }

        isLoading = true

        // Stop timers first
        stopTimers()
        stepService.stopTracking()

        // Upload final step data
        await uploadStepData()

        do {
            let request = EndSessionRequest(sessionId: session.id)
            let completedSession: ExerciseSession = try await apiClient.request(
                endpoint: .endSession,
                method: .post,
                body: request
            )

            currentSession = nil
            isExercising = false

            // Refresh data
            await loadStats()
            await loadSessions()

            coinsEarned = completedSession.totalCoinsEarned ?? 0
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to end session"
        }

        isLoading = false
    }

    private func startTimers() {
        // Main timer for UI update
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                self?.elapsedSeconds += 1
            }
        }

        // Upload timer (every 10 seconds)
        uploadTimer = Timer.scheduledTimer(withTimeInterval: 10.0, repeats: true) { [weak self] _ in
            Task { @MainActor in
                await self?.uploadStepData()
            }
        }
    }

    private func stopTimers() {
        timer?.invalidate()
        timer = nil
        uploadTimer?.invalidate()
        uploadTimer = nil
    }

    private func uploadStepData() async {
        guard let session = currentSession else { return }

        let stepData = stepService.getBufferedStepData()
        guard !stepData.isEmpty else { return }

        do {
            let request = RecordStepsRequest(sessionId: session.id, stepData: stepData)
            let response: StepsResponse = try await apiClient.request(
                endpoint: .recordSteps,
                method: .post,
                body: request
            )
            coinsEarned = response.coinsEarned
        } catch {
            // Silently handle upload error - data will be sent on next attempt
        }
    }
}
