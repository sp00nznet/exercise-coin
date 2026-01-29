import SwiftUI

struct HomeView: View {
    @EnvironmentObject var authViewModel: AuthViewModel
    @StateObject private var viewModel = HomeViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: Theme.Spacing.lg) {
                        // Welcome Header
                        HStack {
                            VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                                Text("Welcome back,")
                                    .font(Theme.Typography.body)
                                    .foregroundColor(Theme.Colors.textSecondary)
                                Text(authViewModel.user?.username ?? "User")
                                    .font(Theme.Typography.title)
                                    .foregroundColor(Theme.Colors.textPrimary)
                            }
                            Spacer()
                            Image(systemName: "figure.walk.circle.fill")
                                .font(.system(size: 44))
                                .foregroundColor(Theme.Colors.accent)
                        }
                        .padding(.horizontal)

                        // Balance Card
                        CardView {
                            VStack(spacing: Theme.Spacing.md) {
                                Text("Balance")
                                    .font(Theme.Typography.caption)
                                    .foregroundColor(Theme.Colors.textSecondary)
                                CoinDisplay(amount: viewModel.dashboard?.balance ?? 0, size: Theme.Typography.display)
                            }
                            .frame(maxWidth: .infinity)
                        }
                        .padding(.horizontal)

                        // Today's Stats
                        HStack(spacing: Theme.Spacing.md) {
                            StatCard(
                                title: "Today's Steps",
                                value: "\(viewModel.dashboard?.todaySteps ?? 0)",
                                icon: "figure.walk"
                            )
                            StatCard(
                                title: "Coins Earned",
                                value: String(format: "%.2f", viewModel.dashboard?.todayCoins ?? 0),
                                icon: "circle.fill",
                                color: Theme.Colors.coin
                            )
                        }
                        .padding(.horizontal)

                        // Quick Actions
                        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                            Text("Quick Actions")
                                .font(Theme.Typography.headline)
                                .foregroundColor(Theme.Colors.textPrimary)
                                .padding(.horizontal)

                            HStack(spacing: Theme.Spacing.md) {
                                QuickActionButton(
                                    icon: "figure.walk",
                                    title: "Exercise",
                                    color: Theme.Colors.accent
                                ) {
                                    // Navigate to exercise
                                }

                                QuickActionButton(
                                    icon: "arrow.up.circle.fill",
                                    title: "Send",
                                    color: Theme.Colors.info
                                ) {
                                    viewModel.showSendSheet = true
                                }

                                QuickActionButton(
                                    icon: "qrcode.viewfinder",
                                    title: "Scan",
                                    color: Theme.Colors.success
                                ) {
                                    viewModel.showScanSheet = true
                                }

                                QuickActionButton(
                                    icon: "map.fill",
                                    title: "Map",
                                    color: Theme.Colors.warning
                                ) {
                                    // Navigate to map
                                }
                            }
                            .padding(.horizontal)
                        }

                        // Recent Achievements
                        if let achievements = viewModel.dashboard?.recentAchievements, !achievements.isEmpty {
                            VStack(alignment: .leading, spacing: Theme.Spacing.md) {
                                Text("Recent Achievements")
                                    .font(Theme.Typography.headline)
                                    .foregroundColor(Theme.Colors.textPrimary)
                                    .padding(.horizontal)

                                ScrollView(.horizontal, showsIndicators: false) {
                                    HStack(spacing: Theme.Spacing.md) {
                                        ForEach(achievements) { achievement in
                                            AchievementBadge(achievement: achievement)
                                        }
                                    }
                                    .padding(.horizontal)
                                }
                            }
                        }

                        Spacer(minLength: Theme.Spacing.xl)
                    }
                    .padding(.top)
                }
                .refreshable {
                    await viewModel.loadDashboard()
                }
            }
            .navigationBarHidden(true)
            .sheet(isPresented: $viewModel.showSendSheet) {
                SendCoinsView()
            }
            .sheet(isPresented: $viewModel.showScanSheet) {
                QRScannerView()
            }
        }
        .task {
            await viewModel.loadDashboard()
        }
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: Theme.Spacing.sm) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
                Text(title)
                    .font(Theme.Typography.caption)
                    .foregroundColor(Theme.Colors.textSecondary)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.md)
            .background(Theme.Colors.surface)
            .cornerRadius(Theme.BorderRadius.lg)
        }
    }
}

struct AchievementBadge: View {
    let achievement: Achievement

    var body: some View {
        VStack(spacing: Theme.Spacing.sm) {
            Image(systemName: "trophy.fill")
                .font(.system(size: 28))
                .foregroundColor(Theme.Colors.coin)
            Text(achievement.name)
                .font(Theme.Typography.caption)
                .foregroundColor(Theme.Colors.textPrimary)
                .lineLimit(1)
        }
        .frame(width: 80)
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.surface)
        .cornerRadius(Theme.BorderRadius.lg)
    }
}

#Preview {
    HomeView()
        .environmentObject(AuthViewModel())
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
