import SwiftUI

struct AchievementsView: View {
    @StateObject private var viewModel = AchievementsViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                if viewModel.isLoading && viewModel.achievements.isEmpty {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Theme.Colors.accent))
                } else if viewModel.achievements.isEmpty {
                    EmptyStateView(
                        icon: "trophy",
                        title: "No achievements yet",
                        message: "Start exercising to unlock achievements!"
                    )
                } else {
                    ScrollView {
                        LazyVStack(spacing: Theme.Spacing.md) {
                            // Stats Header
                            AchievementStatsHeader(
                                unlocked: viewModel.unlockedCount,
                                total: viewModel.achievements.count
                            )

                            // Achievement List
                            ForEach(viewModel.achievements) { achievement in
                                AchievementCard(achievement: achievement)
                            }
                        }
                        .padding()
                    }
                    .refreshable {
                        await viewModel.loadAchievements()
                    }
                }
            }
            .navigationTitle("Achievements")
            .navigationBarTitleDisplayMode(.large)
            .task {
                await viewModel.loadAchievements()
            }
        }
    }
}

struct AchievementStatsHeader: View {
    let unlocked: Int
    let total: Int

    var body: some View {
        CardView {
            HStack {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text("Progress")
                        .font(Theme.Typography.caption)
                        .foregroundColor(Theme.Colors.textSecondary)
                    Text("\(unlocked) / \(total)")
                        .font(Theme.Typography.title)
                        .foregroundColor(Theme.Colors.textPrimary)
                }

                Spacer()

                // Progress Ring
                ZStack {
                    Circle()
                        .stroke(Theme.Colors.surfaceVariant, lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: total > 0 ? CGFloat(unlocked) / CGFloat(total) : 0)
                        .stroke(Theme.Colors.accent, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Image(systemName: "trophy.fill")
                        .foregroundColor(Theme.Colors.coin)
                }
                .frame(width: 60, height: 60)
            }
        }
    }
}

struct AchievementCard: View {
    let achievement: Achievement

    var body: some View {
        CardView {
            HStack(spacing: Theme.Spacing.md) {
                // Icon
                ZStack {
                    Circle()
                        .fill(achievement.isUnlocked ? Theme.Colors.accent.opacity(0.2) : Theme.Colors.surfaceVariant)
                        .frame(width: 50, height: 50)
                    Image(systemName: achievement.isUnlocked ? "trophy.fill" : "lock.fill")
                        .font(.system(size: 20))
                        .foregroundColor(achievement.isUnlocked ? Theme.Colors.coin : Theme.Colors.textDisabled)
                }

                // Details
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text(achievement.name)
                        .font(Theme.Typography.body)
                        .foregroundColor(achievement.isUnlocked ? Theme.Colors.textPrimary : Theme.Colors.textSecondary)

                    if let description = achievement.description {
                        Text(description)
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                            .lineLimit(2)
                    }

                    // Progress bar for locked achievements
                    if !achievement.isUnlocked {
                        ProgressView(value: achievement.progressPercentage)
                            .progressViewStyle(LinearProgressViewStyle(tint: Theme.Colors.accent))
                            .frame(height: 4)

                        if let progress = achievement.progress, let target = achievement.target {
                            Text("\(Int(progress)) / \(Int(target))")
                                .font(Theme.Typography.caption)
                                .foregroundColor(Theme.Colors.textSecondary)
                        }
                    }
                }

                Spacer()

                // Reward
                if let reward = achievement.reward {
                    VStack {
                        Text("+\(Int(reward))")
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.coin)
                        Text("EXC")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }
                }
            }
        }
    }
}

#Preview {
    AchievementsView()
        .preferredColorScheme(.dark)
}
