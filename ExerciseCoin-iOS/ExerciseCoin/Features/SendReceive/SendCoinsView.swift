import SwiftUI

struct SendCoinsView: View {
    @StateObject private var viewModel = SendCoinsViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                ScrollView {
                    VStack(spacing: Theme.Spacing.lg) {
                        // Send Mode Selection
                        Picker("Send Mode", selection: $viewModel.sendMode) {
                            Text("Direct").tag(SendMode.direct)
                            Text("QR Code").tag(SendMode.qrCode)
                        }
                        .pickerStyle(.segmented)
                        .padding(.horizontal)

                        if viewModel.sendMode == .direct {
                            DirectSendView(viewModel: viewModel)
                        } else {
                            QRCodeSendView(viewModel: viewModel)
                        }
                    }
                    .padding(.vertical)
                }
            }
            .navigationTitle("Send Coins")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .alert("Success", isPresented: $viewModel.showSuccess) {
                Button("OK") { dismiss() }
            } message: {
                Text(viewModel.successMessage ?? "Transfer completed")
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
        }
    }
}

struct DirectSendView: View {
    @ObservedObject var viewModel: SendCoinsViewModel

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            // Recipient Field
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("Recipient")
                    .font(Theme.Typography.caption)
                    .foregroundColor(Theme.Colors.textSecondary)
                StyledTextField(
                    placeholder: "Username or wallet address",
                    text: $viewModel.recipient
                )
            }
            .padding(.horizontal)

            // Amount Field
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("Amount")
                    .font(Theme.Typography.caption)
                    .foregroundColor(Theme.Colors.textSecondary)
                StyledTextField(
                    placeholder: "0.00 EXC",
                    text: $viewModel.amount,
                    keyboardType: .decimalPad
                )
            }
            .padding(.horizontal)

            // Message Field
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                Text("Message (Optional)")
                    .font(Theme.Typography.caption)
                    .foregroundColor(Theme.Colors.textSecondary)
                StyledTextField(
                    placeholder: "Add a note",
                    text: $viewModel.message
                )
            }
            .padding(.horizontal)

            // Send Button
            PrimaryButton("Send Coins", isLoading: viewModel.isLoading) {
                Task { await viewModel.sendDirect() }
            }
            .disabled(viewModel.recipient.isEmpty || viewModel.amount.isEmpty)
            .padding(.horizontal)

            Spacer()
        }
    }
}

struct QRCodeSendView: View {
    @ObservedObject var viewModel: SendCoinsViewModel

    var body: some View {
        VStack(spacing: Theme.Spacing.lg) {
            if let qrTransfer = viewModel.qrTransfer {
                // Show generated QR code
                VStack(spacing: Theme.Spacing.md) {
                    Text("Scan to receive")
                        .font(Theme.Typography.headline)
                        .foregroundColor(Theme.Colors.textPrimary)

                    if let code = qrTransfer.code {
                        QRCodeView(content: code)
                            .frame(width: 200, height: 200)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(Theme.BorderRadius.lg)
                    }

                    CoinDisplay(amount: qrTransfer.amount, size: Theme.Typography.headline)

                    if let expiresAt = qrTransfer.expiresAt {
                        Text("Expires: \(expiresAt, style: .relative)")
                            .font(Theme.Typography.caption)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }

                    SecondaryButton("Cancel Transfer") {
                        Task { await viewModel.cancelQRTransfer() }
                    }
                    .padding(.horizontal)
                }
            } else {
                // Amount input
                VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                    Text("Amount to send")
                        .font(Theme.Typography.caption)
                        .foregroundColor(Theme.Colors.textSecondary)
                    StyledTextField(
                        placeholder: "0.00 EXC",
                        text: $viewModel.amount,
                        keyboardType: .decimalPad
                    )
                }
                .padding(.horizontal)

                PrimaryButton("Generate QR Code", isLoading: viewModel.isLoading) {
                    Task { await viewModel.createQRTransfer() }
                }
                .disabled(viewModel.amount.isEmpty)
                .padding(.horizontal)
            }

            Spacer()
        }
    }
}

#Preview {
    SendCoinsView()
        .preferredColorScheme(.dark)
}
