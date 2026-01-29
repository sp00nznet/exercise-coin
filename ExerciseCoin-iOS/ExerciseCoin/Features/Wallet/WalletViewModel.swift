import Foundation

@MainActor
class WalletViewModel: ObservableObject {
    @Published var balance: WalletBalance?
    @Published var walletAddress: String?
    @Published var transactions: [Transaction] = []
    @Published var daemonStatus: DaemonStatus?
    @Published var isLoading = false
    @Published var isStartingDaemon = false
    @Published var errorMessage: String?
    @Published var showSendSheet = false
    @Published var showReceiveSheet = false

    private let apiClient = APIClient.shared

    func loadWalletData() async {
        isLoading = true

        async let balanceTask: () = loadBalance()
        async let addressTask: () = loadAddress()
        async let transactionsTask: () = loadTransactions()
        async let daemonTask: () = loadDaemonStatus()

        _ = await (balanceTask, addressTask, transactionsTask, daemonTask)

        isLoading = false
    }

    private func loadBalance() async {
        do {
            balance = try await apiClient.request(endpoint: .walletBalance)
        } catch {
            // Silently handle error
        }
    }

    private func loadAddress() async {
        do {
            let response: WalletAddress = try await apiClient.request(endpoint: .walletAddress)
            walletAddress = response.address
        } catch {
            // Silently handle error
        }
    }

    private func loadTransactions() async {
        do {
            let response: TransactionsResponse = try await apiClient.request(endpoint: .transactions)
            transactions = response.transactions
        } catch {
            // Silently handle error
        }
    }

    private func loadDaemonStatus() async {
        do {
            daemonStatus = try await apiClient.request(endpoint: .daemonStatus)
        } catch {
            // Silently handle error
        }
    }

    func startDaemon() async {
        isStartingDaemon = true

        do {
            daemonStatus = try await apiClient.request(
                endpoint: .daemonStart,
                method: .post
            )
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to start daemon"
        }

        isStartingDaemon = false
    }
}
