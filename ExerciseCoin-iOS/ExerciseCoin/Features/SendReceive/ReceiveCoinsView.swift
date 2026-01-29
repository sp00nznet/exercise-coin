import SwiftUI

struct ReceiveCoinsView: View {
    let walletAddress: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                VStack(spacing: Theme.Spacing.xl) {
                    Text("Your Wallet Address")
                        .font(Theme.Typography.headline)
                        .foregroundColor(Theme.Colors.textPrimary)

                    // QR Code
                    if !walletAddress.isEmpty {
                        QRCodeView(content: walletAddress)
                            .frame(width: 200, height: 200)
                            .padding()
                            .background(Color.white)
                            .cornerRadius(Theme.BorderRadius.lg)
                    }

                    // Address
                    VStack(spacing: Theme.Spacing.sm) {
                        Text(walletAddress)
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundColor(Theme.Colors.textPrimary)
                            .multilineTextAlignment(.center)
                            .padding()
                            .background(Theme.Colors.surface)
                            .cornerRadius(Theme.BorderRadius.md)

                        Button(action: copyAddress) {
                            HStack {
                                Image(systemName: "doc.on.doc")
                                Text("Copy Address")
                            }
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.accent)
                        }
                    }
                    .padding(.horizontal)

                    Text("Share this QR code or address to receive coins")
                        .font(Theme.Typography.caption)
                        .foregroundColor(Theme.Colors.textSecondary)
                        .multilineTextAlignment(.center)

                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Receive Coins")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") { dismiss() }
                }
            }
        }
    }

    private func copyAddress() {
        UIPasteboard.general.string = walletAddress
    }
}

#Preview {
    ReceiveCoinsView(walletAddress: "EXC1234567890ABCDEF")
        .preferredColorScheme(.dark)
}
