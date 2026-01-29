import SwiftUI

struct ContentView: View {
    @EnvironmentObject var authViewModel: AuthViewModel

    var body: some View {
        Group {
            if authViewModel.isLoading {
                LoadingView()
            } else if authViewModel.isAuthenticated {
                MainTabView()
            } else {
                AuthNavigationView()
            }
        }
        .task {
            await authViewModel.checkAuthStatus()
        }
    }
}

struct LoadingView: View {
    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()
            VStack(spacing: Theme.Spacing.lg) {
                Image(systemName: "figure.walk.circle.fill")
                    .font(.system(size: 60))
                    .foregroundColor(Theme.Colors.accent)
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle(tint: Theme.Colors.accent))
                Text("ExerciseCoin")
                    .font(Theme.Typography.title)
                    .foregroundColor(Theme.Colors.textPrimary)
            }
        }
    }
}

struct AuthNavigationView: View {
    @State private var showRegister = false

    var body: some View {
        NavigationStack {
            LoginView(showRegister: $showRegister)
                .navigationDestination(isPresented: $showRegister) {
                    RegisterView(showRegister: $showRegister)
                }
        }
    }
}

#Preview {
    ContentView()
        .environmentObject(AuthViewModel())
        .environmentObject(AppState())
}
