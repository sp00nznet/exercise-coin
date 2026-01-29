import SwiftUI

struct ChangePasswordView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @Environment(\.dismiss) private var dismiss

    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var localError: String?

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    // Icon
                    Image(systemName: "lock.shield.fill")
                        .font(.system(size: 60))
                        .foregroundColor(Theme.Colors.accent)
                        .padding(.top, Theme.Spacing.xl)

                    Text("Create a strong password with at least 8 characters")
                        .font(Theme.Typography.body)
                        .foregroundColor(Theme.Colors.textSecondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal)

                    // Form
                    VStack(spacing: Theme.Spacing.md) {
                        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                            Text("Current Password")
                                .font(Theme.Typography.caption)
                                .foregroundColor(Theme.Colors.textSecondary)
                            StyledTextField(placeholder: "Current Password", text: $currentPassword, isSecure: true)
                        }

                        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                            Text("New Password")
                                .font(Theme.Typography.caption)
                                .foregroundColor(Theme.Colors.textSecondary)
                            StyledTextField(placeholder: "New Password", text: $newPassword, isSecure: true)
                        }

                        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                            Text("Confirm New Password")
                                .font(Theme.Typography.caption)
                                .foregroundColor(Theme.Colors.textSecondary)
                            StyledTextField(placeholder: "Confirm Password", text: $confirmPassword, isSecure: true)
                        }
                    }
                    .padding(.horizontal)

                    // Error Message
                    if let error = viewModel.errorMessage ?? localError {
                        ErrorBanner(message: error) {
                            viewModel.errorMessage = nil
                            localError = nil
                        }
                        .padding(.horizontal)
                    }

                    // Change Button
                    PrimaryButton("Change Password", isLoading: viewModel.isLoading) {
                        changePassword()
                    }
                    .disabled(currentPassword.isEmpty || newPassword.isEmpty || confirmPassword.isEmpty)
                    .padding(.horizontal)

                    Spacer()
                }
            }
        }
        .navigationTitle("Change Password")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Success", isPresented: $viewModel.showSuccess) {
            Button("OK") { dismiss() }
        } message: {
            Text(viewModel.successMessage ?? "Password changed")
        }
    }

    private func changePassword() {
        localError = nil

        guard newPassword == confirmPassword else {
            localError = "New passwords do not match"
            return
        }

        guard newPassword.count >= 8 else {
            localError = "Password must be at least 8 characters"
            return
        }

        Task {
            _ = await viewModel.changePassword(currentPassword: currentPassword, newPassword: newPassword)
        }
    }
}

#Preview {
    NavigationStack {
        ChangePasswordView()
    }
    .preferredColorScheme(.dark)
}
