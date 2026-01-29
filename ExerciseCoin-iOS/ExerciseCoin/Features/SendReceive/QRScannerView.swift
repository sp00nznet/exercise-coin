import SwiftUI
import AVFoundation

struct QRScannerView: View {
    @StateObject private var viewModel = QRScannerViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                if viewModel.isCameraAuthorized {
                    CameraPreview(session: viewModel.captureSession)
                        .ignoresSafeArea()

                    // Scanner overlay
                    VStack {
                        Spacer()

                        // Scanning frame
                        RoundedRectangle(cornerRadius: Theme.BorderRadius.lg)
                            .stroke(Theme.Colors.accent, lineWidth: 3)
                            .frame(width: 250, height: 250)
                            .background(Color.clear)

                        Spacer()

                        // Instructions
                        Text("Point camera at QR code")
                            .font(Theme.Typography.body)
                            .foregroundColor(.white)
                            .padding()
                            .background(Color.black.opacity(0.6))
                            .cornerRadius(Theme.BorderRadius.md)
                            .padding(.bottom, Theme.Spacing.xl)
                    }
                } else {
                    VStack(spacing: Theme.Spacing.lg) {
                        Image(systemName: "camera.fill")
                            .font(.system(size: 60))
                            .foregroundColor(Theme.Colors.textSecondary)

                        Text("Camera Access Required")
                            .font(Theme.Typography.headline)
                            .foregroundColor(Theme.Colors.textPrimary)

                        Text("Please enable camera access in Settings to scan QR codes")
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.textSecondary)
                            .multilineTextAlignment(.center)

                        SecondaryButton("Open Settings") {
                            if let url = URL(string: UIApplication.openSettingsURLString) {
                                UIApplication.shared.open(url)
                            }
                        }
                    }
                    .padding()
                }

                if viewModel.isLoading {
                    LoadingOverlay()
                }
            }
            .navigationTitle("Scan QR Code")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
            .alert("Success", isPresented: $viewModel.showSuccess) {
                Button("OK") { dismiss() }
            } message: {
                Text(viewModel.successMessage ?? "Transfer claimed")
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
            .onAppear {
                viewModel.startScanning()
            }
            .onDisappear {
                viewModel.stopScanning()
            }
        }
    }
}

struct CameraPreview: UIViewRepresentable {
    let session: AVCaptureSession

    func makeUIView(context: Context) -> UIView {
        let view = UIView(frame: .zero)
        let previewLayer = AVCaptureVideoPreviewLayer(session: session)
        previewLayer.videoGravity = .resizeAspectFill
        view.layer.addSublayer(previewLayer)

        DispatchQueue.main.async {
            previewLayer.frame = view.bounds
        }

        return view
    }

    func updateUIView(_ uiView: UIView, context: Context) {
        if let previewLayer = uiView.layer.sublayers?.first as? AVCaptureVideoPreviewLayer {
            previewLayer.frame = uiView.bounds
        }
    }
}

@MainActor
class QRScannerViewModel: NSObject, ObservableObject {
    @Published var isCameraAuthorized = false
    @Published var scannedCode: String?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showSuccess = false
    @Published var successMessage: String?

    let captureSession = AVCaptureSession()
    private var isScanning = false
    private let apiClient = APIClient.shared

    override init() {
        super.init()
        checkCameraAuthorization()
    }

    private func checkCameraAuthorization() {
        switch AVCaptureDevice.authorizationStatus(for: .video) {
        case .authorized:
            isCameraAuthorized = true
            setupCamera()
        case .notDetermined:
            AVCaptureDevice.requestAccess(for: .video) { [weak self] granted in
                Task { @MainActor in
                    self?.isCameraAuthorized = granted
                    if granted {
                        self?.setupCamera()
                    }
                }
            }
        default:
            isCameraAuthorized = false
        }
    }

    private func setupCamera() {
        guard let device = AVCaptureDevice.default(for: .video),
              let input = try? AVCaptureDeviceInput(device: device) else {
            return
        }

        let output = AVCaptureMetadataOutput()

        if captureSession.canAddInput(input) && captureSession.canAddOutput(output) {
            captureSession.addInput(input)
            captureSession.addOutput(output)

            output.setMetadataObjectsDelegate(self, queue: DispatchQueue.main)
            output.metadataObjectTypes = [.qr]
        }
    }

    func startScanning() {
        guard isCameraAuthorized, !captureSession.isRunning else { return }
        isScanning = true
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.startRunning()
        }
    }

    func stopScanning() {
        isScanning = false
        DispatchQueue.global(qos: .userInitiated).async { [weak self] in
            self?.captureSession.stopRunning()
        }
    }

    func claimTransfer(code: String) async {
        isLoading = true

        do {
            let request = ClaimQRTransferRequest(code: code)
            let response: ClaimQRTransferResponse = try await apiClient.request(
                endpoint: .claimQRTransfer,
                method: .post,
                body: request
            )

            successMessage = "Received \(String(format: "%.2f", response.amount)) EXC"
            if let sender = response.sender {
                successMessage! += " from \(sender)"
            }
            showSuccess = true
        } catch let error as APIError {
            errorMessage = error.localizedDescription
            // Resume scanning on error
            isScanning = true
        } catch {
            errorMessage = "Failed to claim transfer"
            isScanning = true
        }

        isLoading = false
    }
}

extension QRScannerViewModel: AVCaptureMetadataOutputObjectsDelegate {
    nonisolated func metadataOutput(_ output: AVCaptureMetadataOutput, didOutput metadataObjects: [AVMetadataObject], from connection: AVCaptureConnection) {
        guard let metadataObject = metadataObjects.first as? AVMetadataMachineReadableCodeObject,
              let code = metadataObject.stringValue else {
            return
        }

        Task { @MainActor in
            guard self.isScanning else { return }
            self.isScanning = false
            self.scannedCode = code
            await self.claimTransfer(code: code)
        }
    }
}

#Preview {
    QRScannerView()
        .preferredColorScheme(.dark)
}
