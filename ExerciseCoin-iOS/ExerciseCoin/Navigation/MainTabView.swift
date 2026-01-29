import SwiftUI

struct MainTabView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: Theme.Icons.home)
                }
                .tag(0)

            ExerciseView()
                .tabItem {
                    Label("Exercise", systemImage: Theme.Icons.exercise)
                }
                .tag(1)

            WalletView()
                .tabItem {
                    Label("Wallet", systemImage: Theme.Icons.wallet)
                }
                .tag(2)

            TreasureMapView()
                .tabItem {
                    Label("Map", systemImage: Theme.Icons.treasureMap)
                }
                .tag(3)

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: Theme.Icons.profile)
                }
                .tag(4)
        }
        .tint(Theme.Colors.accent)
    }
}

#Preview {
    MainTabView()
        .environmentObject(AuthViewModel())
        .environmentObject(AppState())
        .preferredColorScheme(.dark)
}
