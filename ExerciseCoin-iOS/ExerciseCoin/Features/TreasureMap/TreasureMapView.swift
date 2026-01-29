import SwiftUI
import MapKit

struct TreasureMapView: View {
    @StateObject private var viewModel = TreasureMapViewModel()
    @StateObject private var locationService = LocationService.shared

    var body: some View {
        NavigationStack {
            ZStack {
                // Map
                Map(coordinateRegion: $viewModel.region, annotationItems: viewModel.treasureDrops) { drop in
                    MapAnnotation(coordinate: CLLocationCoordinate2D(latitude: drop.latitude, longitude: drop.longitude)) {
                        TreasureMarker(drop: drop) {
                            viewModel.selectedDrop = drop
                            viewModel.showCollectSheet = true
                        }
                    }
                }
                .ignoresSafeArea(edges: .top)

                // Controls Overlay
                VStack {
                    Spacer()

                    // Bottom Controls
                    HStack(spacing: Theme.Spacing.md) {
                        // Current Location Button
                        Button(action: {
                            viewModel.centerOnUser()
                        }) {
                            Image(systemName: "location.fill")
                                .font(.system(size: 20))
                                .foregroundColor(Theme.Colors.accent)
                                .frame(width: 44, height: 44)
                                .background(Theme.Colors.surface)
                                .cornerRadius(Theme.BorderRadius.lg)
                        }

                        Spacer()

                        // Drop Treasure Button
                        Button(action: {
                            viewModel.showDropSheet = true
                        }) {
                            HStack {
                                Image(systemName: "mappin.and.ellipse")
                                Text("Drop Coins")
                            }
                            .font(Theme.Typography.body)
                            .foregroundColor(.white)
                            .padding(.horizontal, Theme.Spacing.lg)
                            .padding(.vertical, Theme.Spacing.md)
                            .background(Theme.Colors.accent)
                            .cornerRadius(Theme.BorderRadius.lg)
                        }

                        // Refresh Button
                        Button(action: {
                            Task { await viewModel.loadNearbyTreasure() }
                        }) {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 20))
                                .foregroundColor(Theme.Colors.accent)
                                .frame(width: 44, height: 44)
                                .background(Theme.Colors.surface)
                                .cornerRadius(Theme.BorderRadius.lg)
                        }
                    }
                    .padding()
                }

                // Loading Overlay
                if viewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: Theme.Colors.accent))
                        .scaleEffect(1.5)
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                        .background(Color.black.opacity(0.3))
                }
            }
            .navigationTitle("Treasure Map")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $viewModel.showDropSheet) {
                DropTreasureSheet(viewModel: viewModel)
            }
            .sheet(isPresented: $viewModel.showCollectSheet) {
                if let drop = viewModel.selectedDrop {
                    CollectTreasureSheet(drop: drop, viewModel: viewModel)
                }
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") { viewModel.errorMessage = nil }
            } message: {
                Text(viewModel.errorMessage ?? "")
            }
            .task {
                locationService.requestAuthorization()
                locationService.startUpdatingLocation()
                await viewModel.loadNearbyTreasure()
            }
        }
    }
}

struct TreasureMarker: View {
    let drop: TreasureDrop
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 2) {
                Image(systemName: "gift.fill")
                    .font(.system(size: 24))
                    .foregroundColor(colorForRarity(drop.rarity))
                Text("\(Int(drop.amount))")
                    .font(.system(size: 10, weight: .bold))
                    .foregroundColor(.white)
                    .padding(.horizontal, 4)
                    .background(Theme.Colors.surface)
                    .cornerRadius(4)
            }
        }
    }

    private func colorForRarity(_ rarity: String?) -> Color {
        switch rarity {
        case "legendary": return Theme.Colors.Rarity.legendary
        case "epic": return Theme.Colors.Rarity.epic
        case "rare": return Theme.Colors.Rarity.rare
        default: return Theme.Colors.Rarity.common
        }
    }
}

struct DropTreasureSheet: View {
    @ObservedObject var viewModel: TreasureMapViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var amount: String = ""
    @State private var message: String = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                VStack(spacing: Theme.Spacing.lg) {
                    Text("Drop coins at your current location for others to find!")
                        .font(Theme.Typography.body)
                        .foregroundColor(Theme.Colors.textSecondary)
                        .multilineTextAlignment(.center)

                    StyledTextField(placeholder: "Amount (EXC)", text: $amount, keyboardType: .decimalPad)

                    StyledTextField(placeholder: "Message (optional)", text: $message)

                    PrimaryButton("Drop Coins", isLoading: viewModel.isLoading) {
                        Task {
                            if let amountValue = Double(amount) {
                                await viewModel.dropTreasure(amount: amountValue, message: message.isEmpty ? nil : message)
                                if viewModel.errorMessage == nil {
                                    dismiss()
                                }
                            }
                        }
                    }
                    .disabled(amount.isEmpty || Double(amount) == nil)

                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Drop Treasure")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

struct CollectTreasureSheet: View {
    let drop: TreasureDrop
    @ObservedObject var viewModel: TreasureMapViewModel
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            ZStack {
                Theme.Colors.background.ignoresSafeArea()

                VStack(spacing: Theme.Spacing.lg) {
                    Image(systemName: "gift.fill")
                        .font(.system(size: 60))
                        .foregroundColor(Theme.Colors.coin)

                    Text("Treasure Found!")
                        .font(Theme.Typography.title)
                        .foregroundColor(Theme.Colors.textPrimary)

                    CoinDisplay(amount: drop.amount, size: Theme.Typography.display)

                    if let distance = drop.distance {
                        Text("\(Int(distance))m away")
                            .font(Theme.Typography.body)
                            .foregroundColor(Theme.Colors.textSecondary)
                    }

                    PrimaryButton("Collect", isLoading: viewModel.isLoading) {
                        Task {
                            await viewModel.collectTreasure(drop: drop)
                            if viewModel.errorMessage == nil {
                                dismiss()
                            }
                        }
                    }

                    Spacer()
                }
                .padding()
            }
            .navigationTitle("Collect Treasure")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") { dismiss() }
                }
            }
        }
        .presentationDetents([.medium])
    }
}

#Preview {
    TreasureMapView()
        .preferredColorScheme(.dark)
}
