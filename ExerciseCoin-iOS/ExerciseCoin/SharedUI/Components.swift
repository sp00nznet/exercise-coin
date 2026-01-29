import SwiftUI

struct PrimaryButton: View {
    let title: String
    let isLoading: Bool
    let action: () -> Void

    init(_ title: String, isLoading: Bool = false, action: @escaping () -> Void) {
        self.title = title
        self.isLoading = isLoading
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        .scaleEffect(0.8)
                } else {
                    Text(title)
                        .font(.system(size: 16, weight: .semibold))
                }
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, Theme.Spacing.md)
            .background(Theme.Colors.accent)
            .foregroundColor(.white)
            .cornerRadius(Theme.BorderRadius.lg)
        }
        .disabled(isLoading)
    }
}

struct SecondaryButton: View {
    let title: String
    let action: () -> Void

    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 16, weight: .semibold))
                .frame(maxWidth: .infinity)
                .padding(.vertical, Theme.Spacing.md)
                .background(Color.clear)
                .foregroundColor(Theme.Colors.accent)
                .overlay(
                    RoundedRectangle(cornerRadius: Theme.BorderRadius.lg)
                        .stroke(Theme.Colors.accent, lineWidth: 1)
                )
        }
    }
}

struct StyledTextField: View {
    let placeholder: String
    @Binding var text: String
    var isSecure: Bool = false
    var keyboardType: UIKeyboardType = .default

    var body: some View {
        Group {
            if isSecure {
                SecureField(placeholder, text: $text)
            } else {
                TextField(placeholder, text: $text)
                    .keyboardType(keyboardType)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.surfaceVariant)
        .foregroundColor(Theme.Colors.textPrimary)
        .cornerRadius(Theme.BorderRadius.lg)
        .autocapitalization(.none)
        .disableAutocorrection(true)
    }
}

struct CardView<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(Theme.Spacing.md)
            .background(Theme.Colors.surface)
            .cornerRadius(Theme.BorderRadius.xl)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    let icon: String
    var color: Color = Theme.Colors.accent

    var body: some View {
        CardView {
            VStack(alignment: .leading, spacing: Theme.Spacing.sm) {
                HStack {
                    Image(systemName: icon)
                        .foregroundColor(color)
                    Text(title)
                        .font(Theme.Typography.caption)
                        .foregroundColor(Theme.Colors.textSecondary)
                }
                Text(value)
                    .font(Theme.Typography.headline)
                    .foregroundColor(Theme.Colors.textPrimary)
            }
        }
    }
}

struct CoinDisplay: View {
    let amount: Double
    var size: Font = Theme.Typography.headline

    var body: some View {
        HStack(spacing: Theme.Spacing.xs) {
            Image(systemName: "circle.fill")
                .foregroundColor(Theme.Colors.coin)
            Text(String(format: "%.2f", amount))
                .font(size)
                .foregroundColor(Theme.Colors.textPrimary)
            Text("EXC")
                .font(Theme.Typography.caption)
                .foregroundColor(Theme.Colors.textSecondary)
        }
    }
}

struct ErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        HStack {
            Image(systemName: "exclamationmark.triangle.fill")
                .foregroundColor(Theme.Colors.error)
            Text(message)
                .font(Theme.Typography.body)
                .foregroundColor(Theme.Colors.textPrimary)
            Spacer()
            Button(action: onDismiss) {
                Image(systemName: "xmark")
                    .foregroundColor(Theme.Colors.textSecondary)
            }
        }
        .padding(Theme.Spacing.md)
        .background(Theme.Colors.error.opacity(0.2))
        .cornerRadius(Theme.BorderRadius.md)
    }
}

struct EmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: Theme.Spacing.md) {
            Image(systemName: icon)
                .font(.system(size: 48))
                .foregroundColor(Theme.Colors.textSecondary)
            Text(title)
                .font(Theme.Typography.headline)
                .foregroundColor(Theme.Colors.textPrimary)
            Text(message)
                .font(Theme.Typography.body)
                .foregroundColor(Theme.Colors.textSecondary)
                .multilineTextAlignment(.center)
        }
        .padding(Theme.Spacing.xl)
    }
}

struct LoadingOverlay: View {
    var body: some View {
        ZStack {
            Color.black.opacity(0.5)
                .ignoresSafeArea()
            ProgressView()
                .progressViewStyle(CircularProgressViewStyle(tint: Theme.Colors.accent))
                .scaleEffect(1.5)
        }
    }
}

#Preview {
    ZStack {
        Theme.Colors.background.ignoresSafeArea()
        VStack(spacing: Theme.Spacing.md) {
            PrimaryButton("Primary Button") {}
            SecondaryButton("Secondary Button") {}
            StyledTextField(placeholder: "Email", text: .constant(""))
            StatCard(title: "Steps", value: "1,234", icon: "figure.walk")
            CoinDisplay(amount: 125.50)
        }
        .padding()
    }
}
