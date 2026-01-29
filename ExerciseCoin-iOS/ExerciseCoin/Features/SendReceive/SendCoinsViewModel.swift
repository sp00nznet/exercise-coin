import Foundation

enum SendMode {
    case direct
    case qrCode
}

@MainActor
class SendCoinsViewModel: ObservableObject {
    @Published var sendMode: SendMode = .direct
    @Published var recipient = ""
    @Published var amount = ""
    @Published var message = ""
    @Published var qrTransfer: QRTransfer?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showSuccess = false
    @Published var successMessage: String?

    private let apiClient = APIClient.shared

    func sendDirect() async {
        guard let amountValue = Double(amount), amountValue > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }

        guard !recipient.isEmpty else {
            errorMessage = "Please enter a recipient"
            return
        }

        isLoading = true

        do {
            let request = SendCoinsRequest(
                recipient: recipient,
                amount: amountValue,
                message: message.isEmpty ? nil : message
            )

            let response: SendCoinsResponse = try await apiClient.request(
                endpoint: .sendCoins,
                method: .post,
                body: request
            )

            successMessage = "Sent \(String(format: "%.2f", amountValue)) EXC to \(recipient)"
            showSuccess = true

            // Reset form
            recipient = ""
            amount = ""
            message = ""
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to send coins"
        }

        isLoading = false
    }

    func createQRTransfer() async {
        guard let amountValue = Double(amount), amountValue > 0 else {
            errorMessage = "Please enter a valid amount"
            return
        }

        isLoading = true

        do {
            let request = CreateQRTransferRequest(amount: amountValue, expiresInMinutes: 30)

            qrTransfer = try await apiClient.request(
                endpoint: .createQRTransfer,
                method: .post,
                body: request
            )
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to create QR transfer"
        }

        isLoading = false
    }

    func cancelQRTransfer() async {
        guard let transfer = qrTransfer else { return }

        isLoading = true

        do {
            let _: EmptyResponse = try await apiClient.request(
                endpoint: .cancelQRTransfer(transfer.id),
                method: .delete
            )
            qrTransfer = nil
            amount = ""
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to cancel transfer"
        }

        isLoading = false
    }
}
