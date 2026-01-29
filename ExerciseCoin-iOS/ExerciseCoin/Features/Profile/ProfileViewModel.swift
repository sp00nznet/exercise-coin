import Foundation

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showSuccess = false
    @Published var successMessage: String?

    private let apiClient = APIClient.shared

    func updateProfile(username: String?, email: String?) async -> User? {
        isLoading = true
        errorMessage = nil

        do {
            let request = UpdateProfileRequest(username: username, email: email)
            let user: User = try await apiClient.request(
                endpoint: .updateProfile,
                method: .put,
                body: request
            )

            successMessage = "Profile updated successfully"
            showSuccess = true
            isLoading = false
            return user
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to update profile"
        }

        isLoading = false
        return nil
    }

    func changePassword(currentPassword: String, newPassword: String) async -> Bool {
        guard !currentPassword.isEmpty, !newPassword.isEmpty else {
            errorMessage = "Please fill in all fields"
            return false
        }

        guard newPassword.count >= 8 else {
            errorMessage = "New password must be at least 8 characters"
            return false
        }

        isLoading = true
        errorMessage = nil

        do {
            let request = ChangePasswordRequest(currentPassword: currentPassword, newPassword: newPassword)
            let _: EmptyResponse = try await apiClient.request(
                endpoint: .changePassword,
                method: .put,
                body: request
            )

            successMessage = "Password changed successfully"
            showSuccess = true
            isLoading = false
            return true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to change password"
        }

        isLoading = false
        return false
    }
}
