import SwiftUI

struct RegisterView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @Binding var showRegister: Bool

    @State private var username = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var localError: String?

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: Theme.Spacing.xl) {
                    // Header
                    VStack(spacing: Theme.Spacing.sm) {
                        Text("Create Account")
                            .font(Theme.Typography.display)
                            .foregroundColor(Theme.Colors.textPrimary)

                        Text("Start your fitness journey today")
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }
                    .padding(.top, Theme.Spacing.xl)

                    // Error Message
                    if let error = authViewModel.errorMessage ?? localError {
                        ErrorBanner(message: error) {
                            authViewModel.clearError()
                            localError = nil
                        }
                    }

                    // Registration Form
                    VStack(spacing: Theme.Spacing.md) {
                        StyledTextField(
                            placeholder: "Username",
                            text: $username
                        )

                        StyledTextField(
                            placeholder: "Email",
                            text: $email,
                            keyboardType: .emailAddress
                        )

                        StyledTextField(
                            placeholder: "Password (min 8 characters)",
                            text: $password,
                            isSecure: true
                        )

                        StyledTextField(
                            placeholder: "Confirm Password",
                            text: $confirmPassword,
                            isSecure: true
                        )
                    }

                    // Register Button
                    PrimaryButton("Create Account", isLoading: authViewModel.isLoading) {
                        validateAndRegister()
                    }

                    // Login Link
                    HStack {
                        Text("Already have an account?")
                            .foregroundColor(Theme.Colors.textSecondary)
                        Button("Log in") {
                            showRegister = false
                        }
                        .foregroundColor(Theme.Colors.accent)
                    }
                    .font(Theme.Typography.body)

                    Spacer()
                }
                .padding(.horizontal, Theme.Spacing.lg)
            }
        }
        .navigationBarBackButtonHidden(true)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: { showRegister = false }) {
                    Image(systemName: "chevron.left")
                        .foregroundColor(Theme.Colors.accent)
                }
            }
        }
    }

    private func validateAndRegister() {
        localError = nil

        guard !username.isEmpty else {
            localError = "Please enter a username"
            return
        }

        guard username.count >= 3 else {
            localError = "Username must be at least 3 characters"
            return
        }

        guard !email.isEmpty else {
            localError = "Please enter your email"
            return
        }

        guard email.contains("@") && email.contains(".") else {
            localError = "Please enter a valid email"
            return
        }

        guard !password.isEmpty else {
            localError = "Please enter a password"
            return
        }

        guard password.count >= 8 else {
            localError = "Password must be at least 8 characters"
            return
        }

        guard password == confirmPassword else {
            localError = "Passwords do not match"
            return
        }

        Task {
            await authViewModel.register(username: username, email: email, password: password)
        }
    }
}

#Preview {
    NavigationStack {
        RegisterView(showRegister: .constant(true))
            .environmentObject(AuthViewModel())
    }
}
