import Foundation

@MainActor
class AchievementsViewModel: ObservableObject {
    @Published var achievements: [Achievement] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let apiClient = APIClient.shared

    var unlockedCount: Int {
        achievements.filter { $0.isUnlocked }.count
    }

    func loadAchievements() async {
        isLoading = true

        do {
            let response: AchievementsResponse = try await apiClient.request(endpoint: .achievements)
            achievements = response.achievements.sorted { a, b in
                // Unlocked first, then by progress percentage
                if a.isUnlocked != b.isUnlocked {
                    return a.isUnlocked
                }
                return a.progressPercentage > b.progressPercentage
            }
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load achievements"
        }

        isLoading = false
    }

    func checkForNewAchievements() async {
        do {
            let response: NewAchievementsResponse = try await apiClient.request(
                endpoint: .checkAchievements,
                method: .post
            )

            if let newAchievements = response.newAchievements ?? response.achievements, !newAchievements.isEmpty {
                await loadAchievements()
            }
        } catch {
            // Silently handle error
        }
    }
}
