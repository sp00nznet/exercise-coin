import SwiftUI

struct ExerciseView: View {
    @StateObject private var viewModel = ExerciseViewModel()
    @StateObject private var stepService = StepCountingService.shared

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: Theme.Spacing.lg) {
                        // Current Session Card
                        if viewModel.isExercising {
                            ActiveSessionCard(
                                viewModel: viewModel,
                                stepService: stepService
                            )
                        } else {
                            StartSessionCard(
                                viewModel: viewModel,
                                isStepCountingAvailable: stepService.isAvailable
                            )
                        }

                        // Stats
                        if let stats = viewModel.stats {
                            StatsSection(stats: stats)
                        }

                        // Session History
                        SessionHistorySection(sessions: viewModel.sessions)
                    }
                    .padding()
                }
            }
            .navigationTitle("Exercise")
            .navigationBarTitleDisplayMode(.large)
            .task {
                await viewModel.loadInitialData()
            }
        }
    }
}

struct ActiveSessionCard: View {
    @ObservedObject var viewModel: ExerciseViewModel
    @ObservedObject var stepService: StepCountingService

    var body: some View {
        CardView {
            VStack(spacing: Theme.Spacing.lg) {
                Text("Active Session")
                    .font(Theme.Typography.headline)
                    .foregroundColor(Theme.Colors.accent)

                // Timer
                Text(viewModel.formattedTime)
                    .font(Theme.Typography.hero)
                    .foregroundColor(Theme.Colors.textPrimary)
                    .monospacedDigit()

                // Steps
                HStack(spacing: Theme.Spacing.xl) {
                    VStack {
                        Text("\(stepService.currentSteps)")
                            .font(Theme.Typography.display)
                            .foregroundColor(Theme.Colors.textPrimary)
                        Text("Steps")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }

                    VStack {
                        Text(String(format: "%.1f", stepService.stepsPerSecond))
                            .font(Theme.Typography.display)
                            .foregroundColor(Theme.Colors.textPrimary)
                        Text("Steps/sec")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }
                }

                // Coins Earned
                CoinDisplay(amount: viewModel.coinsEarned, size: Theme.Typography.headline)

                // Stop Button
                PrimaryButton("Stop Exercise", isLoading: viewModel.isLoading) {
                    Task {
                        await viewModel.stopExercise()
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
    }
}

struct StartSessionCard: View {
    @ObservedObject var viewModel: ExerciseViewModel
    let isStepCountingAvailable: Bool

    var body: some View {
        CardView {
            VStack(spacing: Theme.Spacing.lg) {
                Image(systemName: "figure.walk")
                    .font(.system(size: 60))
                    .foregroundColor(Theme.Colors.accent)

                Text("Ready to Exercise?")
                    .font(Theme.Typography.headline)
                    .foregroundColor(Theme.Colors.textPrimary)

                Text("Start a session to track your steps and earn coins")
                    .font(Theme.Typography.body)
                    .foregroundColor(Theme.Colors.textSecondary)
                    .multilineTextAlignment(.center)

                if !isStepCountingAvailable {
                    HStack {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundColor(Theme.Colors.warning)
                        Text("Step counting not available")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.warning)
                    }
                }

                PrimaryButton("Start Exercise", isLoading: viewModel.isLoading) {
                    Task {
                        await viewModel.startExercise()
                    }
                }
                .disabled(!isStepCountingAvailable)
            }
            .frame(maxWidth: .infinity)
        }
    }
}

struct StatsSection: View {
    let stats: ExerciseStats

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text("Your Stats")
                .font(Theme.Typography.headline)
                .foregroundColor(Theme.Colors.textPrimary)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: Theme.Spacing.md) {
                StatCard(
                    title: "Total Sessions",
                    value: "\(stats.totalSessions)",
                    icon: "calendar"
                )
                StatCard(
                    title: "Total Steps",
                    value: formatNumber(stats.totalSteps),
                    icon: "figure.walk"
                )
                StatCard(
                    title: "Coins Earned",
                    value: String(format: "%.2f", stats.totalCoinsEarned),
                    icon: "circle.fill",
                    color: Theme.Colors.coin
                )
                StatCard(
                    title: "Streak",
                    value: "\(stats.streakDays ?? 0) days",
                    icon: "flame.fill",
                    color: Theme.Colors.warning
                )
            }
        }
    }

    private func formatNumber(_ number: Int) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .decimal
        return formatter.string(from: NSNumber(value: number)) ?? "\(number)"
    }
}

struct SessionHistorySection: View {
    let sessions: [ExerciseSession]

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text("Recent Sessions")
                .font(Theme.Typography.headline)
                .foregroundColor(Theme.Colors.textPrimary)

            if sessions.isEmpty {
                EmptyStateView(
                    icon: "figure.walk",
                    title: "No sessions yet",
                    message: "Start exercising to see your history"
                )
            } else {
                ForEach(sessions) { session in
                    SessionRow(session: session)
                }
            }
        }
    }
}

struct SessionRow: View {
    let session: ExerciseSession

    var body: some View {
        CardView {
            HStack {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    if let startTime = session.startTime {
                        Text(startTime, style: .date)
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.textPrimary)
                    }
                    Text("\(session.totalSteps ?? 0) steps")
                        .font(Theme.Typography.caption)
                        .foregroundColor(Theme.Colors.textSecondary)
                }
                Spacer()
                CoinDisplay(amount: session.totalCoinsEarned ?? 0)
            }
        }
    }
}

#Preview {
    ExerciseView()
        .preferredColorScheme(.dark)
}
