import Foundation

@MainActor
class AuthViewModel: ObservableObject {
    @Published var user: User?
    @Published var isLoading = false
    @Published var isAuthenticated = false
    @Published var errorMessage: String?

    private let apiClient = APIClient.shared

    func checkAuthStatus() async {
        isLoading = true
        defer { isLoading = false }

        guard let _ = await KeychainManager.shared.getToken() else {
            isAuthenticated = false
            return
        }

        do {
            let user: User = try await apiClient.request(endpoint: .profile)
            self.user = user
            self.isAuthenticated = true
        } catch {
            await KeychainManager.shared.clearAll()
            isAuthenticated = false
        }
    }

    func login(email: String, password: String) async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please enter email and password"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            let request = LoginRequest(email: email, password: password)
            let response: AuthResponse = try await apiClient.request(
                endpoint: .login,
                method: .post,
                body: request,
                authenticated: false
            )

            try await KeychainManager.shared.saveToken(response.token)
            try await KeychainManager.shared.saveUser(response.user)
            self.user = response.user
            self.isAuthenticated = true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Login failed: \(error.localizedDescription)"
        }

        isLoading = false
    }

    func register(username: String, email: String, password: String) async {
        guard !username.isEmpty, !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }

        guard password.count >= 8 else {
            errorMessage = "Password must be at least 8 characters"
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            let request = RegisterRequest(username: username, email: email, password: password)
            let response: AuthResponse = try await apiClient.request(
                endpoint: .register,
                method: .post,
                body: request,
                authenticated: false
            )

            try await KeychainManager.shared.saveToken(response.token)
            try await KeychainManager.shared.saveUser(response.user)
            self.user = response.user
            self.isAuthenticated = true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Registration failed: \(error.localizedDescription)"
        }

        isLoading = false
    }

    func logout() async {
        isLoading = true

        do {
            let _: EmptyResponse = try await apiClient.request(
                endpoint: .logout,
                method: .post
            )
        } catch {
            // Continue with logout even if server call fails
        }

        await KeychainManager.shared.clearAll()
        user = nil
        isAuthenticated = false
        isLoading = false
    }

    func clearError() {
        errorMessage = nil
    }
}

struct EmptyResponse: Codable {}
