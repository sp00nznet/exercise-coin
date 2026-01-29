import SwiftUI

struct LeaderboardView: View {
    @StateObject private var viewModel = LeaderboardViewModel()

    var body: some View {
        ZStack {
            Theme.Colors.background.ignoresSafeArea()

            VStack(spacing: 0) {
                // Period Picker
                Picker("Period", selection: $viewModel.selectedPeriod) {
                    Text("Daily").tag("daily")
                    Text("Weekly").tag("weekly")
                    Text("Monthly").tag("monthly")
                    Text("All Time").tag("alltime")
                }
                .pickerStyle(.segmented)
                .padding()
                .onChange(of: viewModel.selectedPeriod) { _, _ in
                    Task { await viewModel.loadLeaderboard() }
                }

                if viewModel.isLoading && viewModel.leaderboard.isEmpty {
                    Spacer()
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Theme.Colors.accent))
                    Spacer()
                } else if viewModel.leaderboard.isEmpty {
                    Spacer()
                    EmptyStateView(
                        icon: "chart.bar",
                        title: "No data yet",
                        message: "Start exercising to appear on the leaderboard!"
                    )
                    Spacer()
                } else {
                    ScrollView {
                        LazyVStack(spacing: Theme.Spacing.sm) {
                            // User Rank Card
                            if let userRank = viewModel.userRank {
                                UserRankCard(rank: userRank)
                                    .padding(.horizontal)
                                    .padding(.bottom, Theme.Spacing.sm)
                            }

                            // Leaderboard List
                            ForEach(viewModel.leaderboard) { entry in
                                LeaderboardRow(entry: entry, isCurrentUser: entry.rank == viewModel.userRank)
                            }
                            .padding(.horizontal)
                        }
                        .padding(.vertical)
                    }
                    .refreshable {
                        await viewModel.loadLeaderboard()
                    }
                }
            }
        }
        .navigationTitle("Leaderboard")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await viewModel.loadLeaderboard()
        }
    }
}

struct UserRankCard: View {
    let rank: Int

    var body: some View {
        CardView {
            HStack {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text("Your Rank")
                        .font(Theme.Typography.caption)
                        .foregroundColor(Theme.Colors.textSecondary)
                    Text("#\(rank)")
                        .font(Theme.Typography.title)
                        .foregroundColor(Theme.Colors.accent)
                }
                Spacer()
                Image(systemName: rankIcon(for: rank))
                    .font(.system(size: 32))
                    .foregroundColor(rankColor(for: rank))
            }
        }
    }

    private func rankIcon(for rank: Int) -> String {
        switch rank {
        case 1: return "trophy.fill"
        case 2, 3: return "medal.fill"
        default: return "star.fill"
        }
    }

    private func rankColor(for rank: Int) -> Color {
        switch rank {
        case 1: return Theme.Colors.coin
        case 2: return Color.gray
        case 3: return Color.orange
        default: return Theme.Colors.accent
        }
    }
}

struct LeaderboardRow: View {
    let entry: LeaderboardEntry
    let isCurrentUser: Bool

    var body: some View {
        CardView {
            HStack(spacing: Theme.Spacing.md) {
                // Rank
                ZStack {
                    Circle()
                        .fill(rankColor(for: entry.rank))
                        .frame(width: 40, height: 40)
                    Text("\(entry.rank)")
                        .font(Theme.Typography.body)
                        .fontWeight(.bold)
                        .foregroundColor(.white)
                }

                // User Info
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text(entry.username)
                        .font(Theme.Typography.body)
                        .foregroundColor(isCurrentUser ? Theme.Colors.accent : Theme.Colors.textPrimary)
                    if let steps = entry.totalSteps {
                        Text("\(formatNumber(steps)) steps")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }
                }

                Spacer()

                // Coins
                if let coins = entry.totalCoins {
                    CoinDisplay(amount: coins)
                }
            }
        }
        .overlay(
            RoundedRectangle(cornerRadius: Theme.BorderRadius.xl)
                .stroke(isCurrentUser ? Theme.Colors.accent : Color.clear, lineWidth: 2)
        )
    }

    private func rankColor(for rank: Int) -> Color {
        switch rank {
        case 1: return Theme.Colors.coin
        case 2: return Color.gray
        case 3: return Color.orange
        default: return Theme.Colors.surfaceVariant
        }
    }

    private func formatNumber(_ number: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: number)) ?? "\(number)"
    }
}

#Preview {
    NavigationStack {
        LeaderboardView()
    }
    .preferredColorScheme(.dark)
}
