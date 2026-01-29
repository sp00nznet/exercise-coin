import Foundation

@MainActor
class HomeViewModel: ObservableObject {
    @Published var dashboard: Dashboard?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showSendSheet = false
    @Published var showScanSheet = false

    private let apiClient = APIClient.shared

    func loadDashboard() async {
        isLoading = true
        errorMessage = nil

        do {
            dashboard = try await apiClient.request(endpoint: .dashboard)
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load dashboard"
        }

        isLoading = false
    }
}
