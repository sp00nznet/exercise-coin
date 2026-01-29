import SwiftUI

enum Theme {
    enum Colors {
        static let primary = Color(hex: "1a1a2e")
        static let secondary = Color(hex: "16213e")
        static let accent = Color(hex: "e94560")
        static let background = Color(hex: "0f0f23")
        static let surface = Color(hex: "1a1a2e")
        static let surfaceVariant = Color(hex: "252547")

        static let textPrimary = Color.white
        static let textSecondary = Color(hex: "a0a0b0")
        static let textDisabled = Color(hex: "606070")

        static let success = Color(hex: "4ade80")
        static let warning = Color(hex: "fbbf24")
        static let error = Color(hex: "ef4444")
        static let info = Color(hex: "60a5fa")

        static let coin = Color(hex: "ffd700")

        enum Rarity {
            static let common = Color(hex: "9ca3af")
            static let rare = Color(hex: "3b82f6")
            static let epic = Color(hex: "a855f7")
            static let legendary = Color(hex: "f59e0b")
        }
    }

    enum Spacing {
        static let xs: CGFloat = 4
        static let sm: CGFloat = 8
        static let md: CGFloat = 16
        static let lg: CGFloat = 24
        static let xl: CGFloat = 32
        static let xxl: CGFloat = 48
    }

    enum BorderRadius {
        static let sm: CGFloat = 4
        static let md: CGFloat = 8
        static let lg: CGFloat = 12
        static let xl: CGFloat = 16
    }

    enum Typography {
        static let caption = Font.system(size: 12)
        static let body = Font.system(size: 14)
        static let bodyLarge = Font.system(size: 16)
        static let title = Font.system(size: 24, weight: .bold)
        static let headline = Font.system(size: 18, weight: .semibold)
        static let display = Font.system(size: 32, weight: .bold)
        static let hero = Font.system(size: 48, weight: .bold)
    }

    enum Icons {
        static let home = "house.fill"
        static let exercise = "figure.walk"
        static let wallet = "creditcard.fill"
        static let treasureMap = "map.fill"
        static let profile = "person.fill"
        static let send = "arrow.up.circle.fill"
        static let receive = "arrow.down.circle.fill"
        static let qrCode = "qrcode"
        static let scan = "qrcode.viewfinder"
        static let achievement = "trophy.fill"
        static let coin = "circle.fill"
        static let settings = "gearshape.fill"
        static let logout = "rectangle.portrait.and.arrow.right"
    }
}

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3:
            (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6:
            (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8:
            (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default:
            (a, r, g, b) = (255, 0, 0, 0)
        }
        self.init(
            .sRGB,
            red: Double(r) / 255,
            green: Double(g) / 255,
            blue: Double(b) / 255,
            opacity: Double(a) / 255
        )
    }
}
