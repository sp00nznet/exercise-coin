import SwiftUI

struct EditProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = ProfileViewModel()
    @Environment(\.dismiss) private var dismiss

    let user: User?

    @State private var username: String = ""
    @State private var email: String = ""

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            ScrollView {
                VStack(spacing: Theme.Spacing.lg) {
                    // Avatar
                    ZStack {
                        Circle()
                            .fill(Theme.Colors.accent)
                            .frame(width: 100, height: 100)
                        Text(username.prefix(1).uppercased())
                            .font(.system(size: 40, weight: .bold))
                            .foregroundColor(.white)
                    }
                    .padding(.top, Theme.Spacing.lg)

                    // Form
                    VStack(spacing: Theme.Spacing.md) {
                        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                            Text("Username")
                                .font(Theme.Typography.caption)
                                .foregroundColor(Theme.Colors.textSecondary)
                            StyledTextField(placeholder: "Username", text: $username)
                        }

                        VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                            Text("Email")
                                .font(Theme.Typography.caption)
                                .foregroundColor(Theme.Colors.textSecondary)
                            StyledTextField(placeholder: "Email", text: $email, keyboardType: .emailAddress)
                        }
                    }
                    .padding(.horizontal)

                    // Error Message
                    if let error = viewModel.errorMessage {
                        ErrorBanner(message: error) {
                            viewModel.errorMessage = nil
                        }
                        .padding(.horizontal)
                    }

                    // Save Button
                    PrimaryButton("Save Changes", isLoading: viewModel.isLoading) {
                        Task {
                            if let updatedUser = await viewModel.updateProfile(username: username, email: email) {
                                authViewModel.user = updatedUser
                            }
                        }
                    }
                    .disabled(username.isEmpty || email.isEmpty)
                    .padding(.horizontal)

                    Spacer()
                }
            }
        }
        .navigationTitle("Edit Profile")
        .navigationBarTitleDisplayMode(.inline)
        .onAppear {
            username = user?.username ?? ""
            email = user?.email ?? ""
        }
        .alert("Success", isPresented: $viewModel.showSuccess) {
            Button("OK") { dismiss() }
        } message: {
            Text(viewModel.successMessage ?? "Profile updated")
        }
    }
}

#Preview {
    NavigationStack {
        EditProfileView(user: nil)
            .environmentObject(AuthViewModel())
    }
    .preferredColorScheme(.dark)
}
