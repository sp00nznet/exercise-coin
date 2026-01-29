import SwiftUI

@main
struct ExerciseCoinApp: App {
    @StateObject private var authViewModel = AuthViewModel()
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(authViewModel)
                .environmentObject(appState)
                .preferredColorScheme(.dark)
        }
    }
}

class AppState: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?

    func showError(_ message: String) {
        errorMessage = message
    }

    func clearError() {
        errorMessage = nil
    }
}
