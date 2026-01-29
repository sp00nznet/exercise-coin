import Foundation
import CoreLocation

@MainActor
class LocationService: NSObject, ObservableObject {
    static let shared = LocationService()

    private let locationManager = CLLocationManager()

    @Published var currentLocation: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined
    @Published var isAuthorized = false
    @Published var errorMessage: String?

    override private init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        authorizationStatus = locationManager.authorizationStatus
        updateAuthorizedStatus()
    }

    func requestAuthorization() {
        locationManager.requestWhenInUseAuthorization()
    }

    func startUpdatingLocation() {
        guard isAuthorized else {
            requestAuthorization()
            return
        }
        locationManager.startUpdatingLocation()
    }

    func stopUpdatingLocation() {
        locationManager.stopUpdatingLocation()
    }

    func requestCurrentLocation() {
        guard isAuthorized else {
            requestAuthorization()
            return
        }
        locationManager.requestLocation()
    }

    private func updateAuthorizedStatus() {
        isAuthorized = authorizationStatus == .authorizedWhenInUse ||
                       authorizationStatus == .authorizedAlways
    }
}

extension LocationService: CLLocationManagerDelegate {
    nonisolated func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        Task { @MainActor in
            self.currentLocation = location
        }
    }

    nonisolated func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        Task { @MainActor in
            self.errorMessage = error.localizedDescription
        }
    }

    nonisolated func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        Task { @MainActor in
            self.authorizationStatus = manager.authorizationStatus
            self.updateAuthorizedStatus()
        }
    }
}
