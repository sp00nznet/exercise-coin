import SwiftUI

struct WalletView: View {
    @StateObject private var viewModel = WalletViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: Theme.Spacing.lg) {
                        // Balance Card
                        BalanceCard(
                            balance: viewModel.balance?.balance ?? 0,
                            pendingBalance: viewModel.balance?.pendingBalance ?? 0,
                            walletAddress: viewModel.balance?.walletAddress ?? viewModel.walletAddress
                        )

                        // Daemon Status
                        DaemonStatusCard(
                            status: viewModel.daemonStatus,
                            isLoading: viewModel.isStartingDaemon,
                            onStart: {
                                Task { await viewModel.startDaemon() }
                            }
                        )

                        // Quick Actions
                        HStack(spacing: Theme.Spacing.md) {
                            SecondaryButton("Send") {
                                viewModel.showSendSheet = true
                            }
                            SecondaryButton("Receive") {
                                viewModel.showReceiveSheet = true
                            }
                        }
                        .padding(.horizontal)

                        // Transactions
                        TransactionHistorySection(
                            transactions: viewModel.transactions,
                            isLoading: viewModel.isLoading
                        )
                    }
                    .padding(.vertical)
                }
                .refreshable {
                    await viewModel.loadWalletData()
                }
            }
            .navigationTitle("Wallet")
            .navigationBarTitleDisplayMode(.large)
            .sheet(isPresented: $viewModel.showSendSheet) {
                SendCoinsView()
            }
            .sheet(isPresented: $viewModel.showReceiveSheet) {
                ReceiveCoinsView(walletAddress: viewModel.walletAddress ?? "")
            }
            .task {
                await viewModel.loadWalletData()
            }
        }
    }
}

struct BalanceCard: View {
    let balance: Double
    let pendingBalance: Double
    let walletAddress: String?

    var body: some View {
        CardView {
            VStack(spacing: Theme.Spacing.lg) {
                Text("Available Balance")
                    .font(Theme.Typography.body)
                    .foregroundColor(Theme.Colors.textSecondary)

                CoinDisplay(amount: balance, size: Theme.Typography.hero)

                if pendingBalance > 0 {
                    HStack {
                        Image(systemName: "clock.fill")
                            .foregroundColor(Theme.Colors.warning)
                        Text("Pending: \(String(format: "%.2f", pendingBalance)) EXC")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.warning)
                    }
                }

                if let address = walletAddress, !address.isEmpty {
                    Divider()
                        .background(Theme.Colors.surfaceVariant)

                    VStack(spacing: Theme.Spacing.xs) {
                        Text("Wallet Address")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                        Text(address)
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundColor(Theme.Colors.textPrimary)
                            .lineLimit(1)
                            .truncationMode(.middle)
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
        .padding(.horizontal)
    }
}

struct DaemonStatusCard: View {
    let status: DaemonStatus?
    let isLoading: Bool
    let onStart: () -> Void

    var body: some View {
        CardView {
            HStack {
                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    HStack {
                        Circle()
                            .fill(status?.isRunning == true ? Theme.Colors.success : Theme.Colors.error)
                            .frame(width: 8, height: 8)
                        Text("Mining Daemon")
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.textPrimary)
                    }

                    if let rate = status?.miningRate, status?.isRunning == true {
                        Text("\(String(format: "%.2f", rate)) EXC/min")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                    } else {
                        Text("Offline")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }
                }

                Spacer()

                if status?.isRunning != true {
                    Button(action: onStart) {
                        if isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: Theme.Colors.accent))
                        } else {
                            Text("Start")
                                .font(Theme.Typography.body)
                                .foregroundColor(Theme.Colors.accent)
                        }
                    }
                    .disabled(isLoading)
                }
            }
        }
        .padding(.horizontal)
    }
}

struct TransactionHistorySection: View {
    let transactions: [Transaction]
    let isLoading: Bool

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.md) {
            Text("Recent Transactions")
                .font(Theme.Typography.headline)
                .foregroundColor(Theme.Colors.textPrimary)
                .padding(.horizontal)

            if isLoading && transactions.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity, alignment: .center)
                    .padding()
            } else if transactions.isEmpty {
                EmptyStateView(
                    icon: "creditcard",
                    title: "No transactions",
                    message: "Your transaction history will appear here"
                )
            } else {
                ForEach(transactions) { transaction in
                    TransactionRow(transaction: transaction)
                }
                .padding(.horizontal)
            }
        }
    }
}

struct TransactionRow: View {
    let transaction: Transaction

    var body: some View {
        CardView {
            HStack {
                Image(systemName: iconForType(transaction.type))
                    .foregroundColor(colorForType(transaction.type))
                    .frame(width: 32)

                VStack(alignment: .leading, spacing: Theme.Spacing.xs) {
                    Text(transaction.description ?? transaction.type)
                        .font(Theme.Typography.body)
                        .foregroundColor(Theme.Colors.textPrimary)
                    if let timestamp = transaction.timestamp {
                        Text(timestamp, style: .relative)
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }
                }

                Spacer()

                Text(formatAmount(transaction.amount, type: transaction.type))
                    .font(Theme.Typography.body)
                    .foregroundColor(amountColor(transaction.type))
            }
        }
    }

    private func iconForType(_ type: String) -> String {
        switch type {
        case "exercise_reward": return "figure.walk"
        case "transfer_in": return "arrow.down.circle.fill"
        case "transfer_out": return "arrow.up.circle.fill"
        case "treasure_drop": return "mappin.circle.fill"
        case "treasure_collect": return "gift.fill"
        default: return "circle.fill"
        }
    }

    private func colorForType(_ type: String) -> Color {
        switch type {
        case "exercise_reward": return Theme.Colors.accent
        case "transfer_in": return Theme.Colors.success
        case "transfer_out": return Theme.Colors.error
        case "treasure_drop": return Theme.Colors.warning
        case "treasure_collect": return Theme.Colors.coin
        default: return Theme.Colors.textSecondary
        }
    }

    private func formatAmount(_ amount: Double, type: String) -> String {
        let sign = type.contains("out") || type == "treasure_drop" ? "-" : "+"
        return "\(sign)\(String(format: "%.2f", amount)) EXC"
    }

    private func amountColor(_ type: String) -> Color {
        if type.contains("out") || type == "treasure_drop" {
            return Theme.Colors.error
        }
        return Theme.Colors.success
    }
}

#Preview {
    WalletView()
        .preferredColorScheme(.dark)
}
