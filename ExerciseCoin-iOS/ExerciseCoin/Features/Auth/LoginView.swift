import SwiftUI

struct LoginView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Binding var showRegister: Bool

    @State private var email = ""
    @State private var password = ""

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: Theme.Spacing.xl) {
                    // Logo and Title
                    VStack(spacing: Theme.Spacing.md) {
                        Image(systemName: "figure.walk.circle.fill")
                            .font(.system(size: 80))
                            .foregroundColor(Theme.Colors.accent)

                        Text("ExerciseCoin")
                            .font(Theme.Typography.display)
                            .foregroundColor(Theme.Colors.textPrimary)

                        Text("Earn crypto while you exercise")
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }
                    .padding(.top, Theme.Spacing.xxl)

                    // Error Message
                    if let error = authViewModel.errorMessage {
                        ErrorBanner(message: error) {
                            authViewModel.clearError()
                        }
                    }

                    // Login Form
                    VStack(spacing: Theme.Spacing.md) {
                        StyledTextField(
                            placeholder: "Email",
                            text: $email,
                            keyboardType: .emailAddress
                        )

                        StyledTextField(
                            placeholder: "Password",
                            text: $password,
                            isSecure: true
                        )
                    }

                    // Login Button
                    PrimaryButton("Login", isLoading: authViewModel.isLoading) {
                        Task {
                            await authViewModel.login(email: email, password: password)
                        }
                    }

                    // Register Link
                    HStack {
                        Text("Don't have an account?")
                            .foregroundColor(Theme.Colors.textSecondary)
                        Button("Sign up") {
                            showRegister = true
                        }
                        .foregroundColor(Theme.Colors.accent)
                    }
                    .font(Theme.Typography.body)

                    Spacer()
                }
                .padding(.horizontal, Theme.Spacing.lg)
            }
        }
        .navigationBarHidden(true)
    }
}

#Preview {
    LoginView(showRegister: .constant(false))
        .environmentObject(AuthViewModel())
}
