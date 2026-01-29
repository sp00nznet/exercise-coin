import SwiftUI

struct ProfileView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showLogoutAlert = false

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: Theme.Spacing.lg) {
                        // Profile Header
                        ProfileHeader(user: authViewModel.user)

                        // Menu Items
                        VStack(spacing: Theme.Spacing.sm) {
                            NavigationLink {
                                AchievementsView()
                            } label: {
                                ProfileMenuItem(
                                    icon: "trophy.fill",
                                    title: "Achievements",
                                    color: Theme.Colors.coin
                                )
                            }

                            NavigationLink {
                                LeaderboardView()
                            } label: {
                                ProfileMenuItem(
                                    icon: "chart.bar.fill",
                                    title: "Leaderboard",
                                    color: Theme.Colors.info
                                )
                            }

                            NavigationLink {
                                EditProfileView(user: authViewModel.user)
                            } label: {
                                ProfileMenuItem(
                                    icon: "person.fill",
                                    title: "Edit Profile",
                                    color: Theme.Colors.accent
                                )
                            }

                            NavigationLink {
                                ChangePasswordView()
                            } label: {
                                ProfileMenuItem(
                                    icon: "lock.fill",
                                    title: "Change Password",
                                    color: Theme.Colors.warning
                                )
                            }
                        }
                        .padding(.horizontal)

                        // Logout Button
                        Button(action: { showLogoutAlert = true }) {
                            HStack {
                                Image(systemName: "rectangle.portrait.and.arrow.right")
                                Text("Log Out")
                            }
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.error)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Theme.Colors.surface)
                            .cornerRadius(Theme.BorderRadius.lg)
                        }
                        .padding(.horizontal)

                        // App Version
                        Text("ExerciseCoin v1.0.0")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textDisabled)
                            .padding(.top, Theme.Spacing.lg)

                        Spacer()
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.large)
            .alert("Log Out", isPresented: $showLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Log Out", role: .destructive) {
                    Task { await authViewModel.logout() }
                }
            } message: {
                Text("Are you sure you want to log out?")
            }
        }
    }
}

struct ProfileHeader: View {
    let user: User?

    var body: some View {
        CardView {
            VStack(spacing: Theme.Spacing.md) {
                // Avatar
                ZStack {
                    Circle()
                        .fill(Theme.Colors.accent)
                        .frame(width: 80, height: 80)
                    Text(user?.username.prefix(1).uppercased() ?? "?")
                        .font(.system(size: 32, weight: .bold))
                        .foregroundColor(.white)
                }

                // User Info
                VStack(spacing: Theme.Spacing.xs) {
                    Text(user?.username ?? "Unknown")
                        .font(Theme.Typography.title)
                        .foregroundColor(Theme.Colors.textPrimary)
                    Text(user?.email ?? "")
                        .font(Theme.Typography.body)
                        .foregroundColor(Theme.Colors.textSecondary)
                }

                // Member Since
                if let createdAt = user?.createdAt {
                    Text("Member since \(createdAt, style: .date)")
                        .font(Theme.Typography.caption)
                        .foregroundColor(Theme.Colors.textSecondary)
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal)
    }
}

struct ProfileMenuItem: View {
    let icon: String
    let title: String
    let color: Color

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(color)
                .frame(width: 24)
            Text(title)
                .font(Theme.Typography.body)
                .foregroundColor(Theme.Colors.textPrimary)
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(Theme.Colors.textSecondary)
        }
        .padding()
        .background(Theme.Colors.surface)
        .cornerRadius(Theme.BorderRadius.lg)
    }
}

#Preview {
    ProfileView()
        .environmentObject(AuthViewModel())
        .preferredColorScheme(.dark)
}
