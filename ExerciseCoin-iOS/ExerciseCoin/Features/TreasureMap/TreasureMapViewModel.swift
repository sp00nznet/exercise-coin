import Foundation
import MapKit

@MainActor
class TreasureMapViewModel: ObservableObject {
    @Published var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
    )
    @Published var treasureDrops: [TreasureDrop] = []
    @Published var selectedDrop: TreasureDrop?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showDropSheet = false
    @Published var showCollectSheet = false

    private let apiClient = APIClient.shared
    private let locationService = LocationService.shared

    func loadNearbyTreasure() async {
        guard let location = locationService.currentLocation else {
            errorMessage = "Location not available"
            return
        }

        isLoading = true

        do {
            let queryItems = [
                URLQueryItem(name: "latitude", value: String(location.coordinate.latitude)),
                URLQueryItem(name: "longitude", value: String(location.coordinate.longitude)),
                URLQueryItem(name: "radius", value: "1000")
            ]

            let response: NearbyTreasureResponse = try await apiClient.requestWithQuery(
                endpoint: .nearbyTreasure,
                queryItems: queryItems
            )
            treasureDrops = response.drops

            // Update region to user's location
            region = MKCoordinateRegion(
                center: location.coordinate,
                span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
            )
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to load nearby treasure"
        }

        isLoading = false
    }

    func dropTreasure(amount: Double, message: String?) async {
        guard let location = locationService.currentLocation else {
            errorMessage = "Location not available"
            return
        }

        isLoading = true

        do {
            let request = DropTreasureRequest(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                amount: amount,
                message: message
            )

            let _: TreasureDrop = try await apiClient.request(
                endpoint: .dropTreasure,
                method: .post,
                body: request
            )

            await loadNearbyTreasure()
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to drop treasure"
        }

        isLoading = false
    }

    func collectTreasure(drop: TreasureDrop) async {
        guard let location = locationService.currentLocation else {
            errorMessage = "Location not available"
            return
        }

        isLoading = true

        do {
            let request = CollectTreasureRequest(
                dropId: drop.id,
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude
            )

            let _: CollectTreasureResponse = try await apiClient.request(
                endpoint: .collectTreasure,
                method: .post,
                body: request
            )

            // Remove from local list
            treasureDrops.removeAll { $0.id == drop.id }
            selectedDrop = nil
        } catch let error as APIError {
            errorMessage = error.localizedDescription
        } catch {
            errorMessage = "Failed to collect treasure"
        }

        isLoading = false
    }

    func centerOnUser() {
        guard let location = locationService.currentLocation else {
            locationService.requestAuthorization()
            return
        }

        region = MKCoordinateRegion(
            center: location.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        )
    }
}
