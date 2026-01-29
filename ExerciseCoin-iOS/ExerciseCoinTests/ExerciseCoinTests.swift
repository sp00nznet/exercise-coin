import XCTest
@testable import ExerciseCoin

final class ExerciseCoinTests: XCTestCase {

    override func setUpWithError() throws {
        // Setup code before each test
    }

    override func tearDownWithError() throws {
        // Cleanup code after each test
    }

    // MARK: - Theme Tests

    func testThemeColorsExist() throws {
        XCTAssertNotNil(Theme.Colors.primary)
        XCTAssertNotNil(Theme.Colors.secondary)
        XCTAssertNotNil(Theme.Colors.accent)
        XCTAssertNotNil(Theme.Colors.background)
    }

    func testThemeSpacing() throws {
        XCTAssertEqual(Theme.Spacing.xs, 4)
        XCTAssertEqual(Theme.Spacing.sm, 8)
        XCTAssertEqual(Theme.Spacing.md, 16)
        XCTAssertEqual(Theme.Spacing.lg, 24)
        XCTAssertEqual(Theme.Spacing.xl, 32)
    }

    // MARK: - Model Tests

    func testUserDecoding() throws {
        let json = """
        {
            "id": "123",
            "username": "testuser",
            "email": "test@example.com",
            "walletAddress": "EXC123456"
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let user = try decoder.decode(User.self, from: json)

        XCTAssertEqual(user.id, "123")
        XCTAssertEqual(user.username, "testuser")
        XCTAssertEqual(user.email, "test@example.com")
        XCTAssertEqual(user.walletAddress, "EXC123456")
    }

    func testAuthResponseDecoding() throws {
        let json = """
        {
            "token": "jwt_token_here",
            "user": {
                "id": "123",
                "username": "testuser",
                "email": "test@example.com"
            }
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let response = try decoder.decode(AuthResponse.self, from: json)

        XCTAssertEqual(response.token, "jwt_token_here")
        XCTAssertEqual(response.user.id, "123")
        XCTAssertEqual(response.user.username, "testuser")
    }

    func testExerciseSessionDecoding() throws {
        let json = """
        {
            "id": "session123",
            "userId": "user123",
            "totalSteps": 5000,
            "totalCoinsEarned": 25.5,
            "status": "completed"
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let session = try decoder.decode(ExerciseSession.self, from: json)

        XCTAssertEqual(session.id, "session123")
        XCTAssertEqual(session.totalSteps, 5000)
        XCTAssertEqual(session.totalCoinsEarned, 25.5)
        XCTAssertEqual(session.status, "completed")
    }

    func testAchievementProgress() throws {
        let achievement = Achievement(
            id: "1",
            name: "Test",
            description: nil,
            icon: nil,
            reward: 10,
            progress: 50,
            target: 100,
            unlockedAt: nil
        )

        XCTAssertFalse(achievement.isUnlocked)
        XCTAssertEqual(achievement.progressPercentage, 0.5)
    }

    func testAchievementUnlocked() throws {
        let achievement = Achievement(
            id: "1",
            name: "Test",
            description: nil,
            icon: nil,
            reward: 10,
            progress: 100,
            target: 100,
            unlockedAt: Date()
        )

        XCTAssertTrue(achievement.isUnlocked)
    }

    func testWalletBalanceDecoding() throws {
        let json = """
        {
            "balance": 100.50,
            "pendingBalance": 10.25,
            "walletAddress": "EXC123456"
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let balance = try decoder.decode(WalletBalance.self, from: json)

        XCTAssertEqual(balance.balance, 100.50)
        XCTAssertEqual(balance.pendingBalance, 10.25)
        XCTAssertEqual(balance.walletAddress, "EXC123456")
    }

    func testTreasureDropDecoding() throws {
        let json = """
        {
            "id": "drop123",
            "latitude": 37.7749,
            "longitude": -122.4194,
            "amount": 5.0,
            "rarity": "rare",
            "distance": 100.5
        }
        """.data(using: .utf8)!

        let decoder = JSONDecoder()
        let drop = try decoder.decode(TreasureDrop.self, from: json)

        XCTAssertEqual(drop.id, "drop123")
        XCTAssertEqual(drop.latitude, 37.7749)
        XCTAssertEqual(drop.longitude, -122.4194)
        XCTAssertEqual(drop.amount, 5.0)
        XCTAssertEqual(drop.rarity, "rare")
    }

    // MARK: - Endpoint Tests

    func testEndpointPaths() throws {
        XCTAssertEqual(Endpoint.login.path, "/auth/login")
        XCTAssertEqual(Endpoint.register.path, "/auth/register")
        XCTAssertEqual(Endpoint.dashboard.path, "/user/dashboard")
        XCTAssertEqual(Endpoint.startSession.path, "/exercise/session/start")
        XCTAssertEqual(Endpoint.walletBalance.path, "/wallet/balance")
        XCTAssertEqual(Endpoint.achievements.path, "/achievements")
        XCTAssertEqual(Endpoint.nearbyTreasure.path, "/treasure/nearby")
        XCTAssertEqual(Endpoint.session("123").path, "/exercise/session/123")
        XCTAssertEqual(Endpoint.cancelQRTransfer("456").path, "/transfer/qr/456")
    }

    // MARK: - Request Model Tests

    func testLoginRequestEncoding() throws {
        let request = LoginRequest(email: "test@example.com", password: "password123")
        let encoder = JSONEncoder()
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertEqual(json?["email"] as? String, "test@example.com")
        XCTAssertEqual(json?["password"] as? String, "password123")
    }

    func testRegisterRequestEncoding() throws {
        let request = RegisterRequest(username: "testuser", email: "test@example.com", password: "password123")
        let encoder = JSONEncoder()
        let data = try encoder.encode(request)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]

        XCTAssertEqual(json?["username"] as? String, "testuser")
        XCTAssertEqual(json?["email"] as? String, "test@example.com")
        XCTAssertEqual(json?["password"] as? String, "password123")
    }

    // MARK: - Performance Tests

    func testColorInitializationPerformance() throws {
        measure {
            for _ in 0..<1000 {
                _ = Color(hex: "e94560")
            }
        }
    }
}
