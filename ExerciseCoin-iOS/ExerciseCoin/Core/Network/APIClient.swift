import Foundation

enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError(Error)
    case serverError(String)
    case unauthorized
    case networkError(Error)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError(let error):
            return "Decoding error: \(error.localizedDescription)"
        case .serverError(let message):
            return message
        case .unauthorized:
            return "Unauthorized. Please log in again."
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}

actor APIClient {
    static let shared = APIClient()

    private let baseURL: String
    private let session: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder

    private init() {
        self.baseURL = ProcessInfo.processInfo.environment["API_URL"] ?? "http://localhost:3000/api"
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        self.session = URLSession(configuration: config)
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }

    func request<T: Decodable>(
        endpoint: Endpoint,
        method: HTTPMethod = .get,
        body: Encodable? = nil,
        authenticated: Bool = true
    ) async throws -> T {
        guard let url = URL(string: baseURL + endpoint.path) else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if authenticated, let token = await KeychainManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        if let body = body {
            request.httpBody = try encoder.encode(body)
        }

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.networkError(NSError(domain: "Invalid response", code: 0))
            }

            if httpResponse.statusCode == 401 {
                throw APIError.unauthorized
            }

            if httpResponse.statusCode >= 400 {
                if let errorResponse = try? decoder.decode(ErrorResponse.self, from: data) {
                    throw APIError.serverError(errorResponse.message ?? errorResponse.error ?? "Unknown error")
                }
                throw APIError.serverError("Server error: \(httpResponse.statusCode)")
            }

            do {
                return try decoder.decode(T.self, from: data)
            } catch {
                throw APIError.decodingError(error)
            }
        } catch let error as APIError {
            throw error
        } catch {
            throw APIError.networkError(error)
        }
    }

    func requestWithQuery<T: Decodable>(
        endpoint: Endpoint,
        queryItems: [URLQueryItem],
        authenticated: Bool = true
    ) async throws -> T {
        guard var components = URLComponents(string: baseURL + endpoint.path) else {
            throw APIError.invalidURL
        }
        components.queryItems = queryItems

        guard let url = components.url else {
            throw APIError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.get.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if authenticated, let token = await KeychainManager.shared.getToken() {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }

        let (data, response) = try await session.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.networkError(NSError(domain: "Invalid response", code: 0))
        }

        if httpResponse.statusCode == 401 {
            throw APIError.unauthorized
        }

        if httpResponse.statusCode >= 400 {
            if let errorResponse = try? decoder.decode(ErrorResponse.self, from: data) {
                throw APIError.serverError(errorResponse.message ?? errorResponse.error ?? "Unknown error")
            }
            throw APIError.serverError("Server error: \(httpResponse.statusCode)")
        }

        return try decoder.decode(T.self, from: data)
    }
}

enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
}

struct ErrorResponse: Decodable {
    let error: String?
    let message: String?
}
