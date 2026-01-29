import SwiftUI
import CoreImage.CIFilterBuiltins

struct QRCodeView: View {
    let content: String

    var body: some View {
        if let qrImage = generateQRCode(from: content) {
            Image(uiImage: qrImage)
                .interpolation(.none)
                .resizable()
                .scaledToFit()
        } else {
            Image(systemName: "qrcode")
                .font(.system(size: 100))
                .foregroundColor(.gray)
        }
    }

    private func generateQRCode(from string: String) -> UIImage? {
        let context = CIContext()
        let filter = CIFilter.qrCodeGenerator()

        filter.message = Data(string.utf8)
        filter.correctionLevel = "M"

        guard let outputImage = filter.outputImage else { return nil }

        // Scale up the image
        let scale = UIScreen.main.scale
        let transform = CGAffineTransform(scaleX: 10 * scale, y: 10 * scale)
        let scaledImage = outputImage.transformed(by: transform)

        guard let cgImage = context.createCGImage(scaledImage, from: scaledImage.extent) else {
            return nil
        }

        return UIImage(cgImage: cgImage)
    }
}

#Preview {
    QRCodeView(content: "EXC1234567890ABCDEF")
        .frame(width: 200, height: 200)
        .padding()
        .background(Color.white)
}
