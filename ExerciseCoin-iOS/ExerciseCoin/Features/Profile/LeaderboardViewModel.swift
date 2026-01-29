import Foundation

@MainActor
class LeaderboardViewModel: ObservableObject {
    @Published var leaderboard: [LeaderboardEntry] = []
    @Published var userRank: Int?
    @Published var selectedPeriod = "weekly"
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiClient = APIClient.shared

    func loadLeaderboard() async {
        isLoading = true

        do {
            let queryItems = [
                URLQueryItem(name: "period", value: selectedPeriod),
                URLQueryItem(name: "limit", value: "50")
            ]

            let response: LeaderboardResponse = try await apiClient.requestWithQuery(
                endpoint: .leaderboard,
                queryItems: queryItems
            )

            leaderboard = response.leaderboard
            userRank = response.userRank
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load leaderboard"
        }

        isLoading = false
    }
}
