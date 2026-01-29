import Foundation

// MARK: - Auth Models

struct User: Codable, Identifiable {
    let id: String
    let username: String
    let email: String
    let walletAddress: String?
    let createdAt: Date?
}

struct AuthResponse: Codable {
    let token: String
    let user: User
}

struct LoginRequest: Encodable {
    let email: String
    let password: String
}

struct RegisterRequest: Encodable {
    let username: String
    let email: String
    let password: String
}

// MARK: - Exercise Models

struct ExerciseSession: Codable, Identifiable {
    let id: String
    let userId: String?
    let startTime: Date?
    let endTime: Date?
    let totalSteps: Int?
    let totalCoinsEarned: Double?
    let status: String?
}

struct StepData: Codable {
    let timestamp: Date
    let stepCount: Int
    let stepsPerSecond: Double
}

struct RecordStepsRequest: Encodable {
    let sessionId: String
    let stepData: [StepData]
}

struct EndSessionRequest: Encodable {
    let sessionId: String
}

struct StepsResponse: Codable {
    let totalSteps: Int
    let coinsEarned: Double
}

struct SessionsResponse: Codable {
    let sessions: [ExerciseSession]
    let total: Int?
    let page: Int?
    let totalPages: Int?
}

struct ExerciseStats: Codable {
    let totalSessions: Int
    let totalSteps: Int
    let totalCoinsEarned: Double
    let averageStepsPerSession: Double?
    let streakDays: Int?
}

// MARK: - Wallet Models

struct WalletBalance: Codable {
    let balance: Double
    let pendingBalance: Double?
    let walletAddress: String?
}

struct WalletAddress: Codable {
    let address: String
}

struct Transaction: Codable, Identifiable {
    let id: String
    let type: String
    let amount: Double
    let timestamp: Date?
    let description: String?
}

struct TransactionsResponse: Codable {
    let transactions: [Transaction]
    let total: Int?
}

struct DaemonStatus: Codable {
    let isRunning: Bool
    let miningRate: Double?
    let uptime: Int?
}

struct EarningsResponse: Codable {
    let earnings: [Earning]
}

struct Earning: Codable {
    let date: String
    let amount: Double
    let source: String
}

// MARK: - Dashboard Models

struct Dashboard: Codable {
    let balance: Double?
    let todaySteps: Int?
    let todayCoins: Double?
    let activeSessions: Int?
    let recentAchievements: [Achievement]?
}

// MARK: - Achievement Models

struct Achievement: Codable, Identifiable {
    let id: String
    let name: String
    let description: String?
    let icon: String?
    let reward: Double?
    let progress: Double?
    let target: Double?
    let unlockedAt: Date?

    var isUnlocked: Bool {
        unlockedAt != nil
    }

    var progressPercentage: Double {
        guard let progress = progress, let target = target, target > 0 else { return 0 }
        return min(progress / target, 1.0)
    }
}

struct AchievementsResponse: Codable {
    let achievements: [Achievement]
}

struct NewAchievementsResponse: Codable {
    let newAchievements: [Achievement]?
    let achievements: [Achievement]?
}

// MARK: - Treasure Models

struct TreasureDrop: Codable, Identifiable {
    let id: String
    let latitude: Double
    let longitude: Double
    let amount: Double
    let rarity: String?
    let expiresAt: Date?
    let distance: Double?
}

struct DropTreasureRequest: Encodable {
    let latitude: Double
    let longitude: Double
    let amount: Double
    let message: String?
}

struct NearbyTreasureResponse: Codable {
    let drops: [TreasureDrop]
}

struct CollectTreasureRequest: Encodable {
    let dropId: String
    let latitude: Double
    let longitude: Double
}

struct CollectTreasureResponse: Codable {
    let amount: Double
    let newBalance: Double
}

struct TreasureHistoryResponse: Codable {
    let drops: [TreasureDrop]?
    let collections: [TreasureDrop]?
}

// MARK: - Transfer Models

struct SendCoinsRequest: Encodable {
    let recipient: String
    let amount: Double
    let message: String?
}

struct SendCoinsResponse: Codable {
    let transactionId: String
    let newBalance: Double
}

struct QRTransfer: Codable, Identifiable {
    let id: String
    let amount: Double
    let code: String?
    let expiresAt: Date?
    let status: String?
}

struct CreateQRTransferRequest: Encodable {
    let amount: Double
    let expiresInMinutes: Int?
}

struct ClaimQRTransferRequest: Encodable {
    let code: String
}

struct ClaimQRTransferResponse: Codable {
    let amount: Double
    let newBalance: Double
    let sender: String?
}

struct PendingTransfersResponse: Codable {
    let transfers: [QRTransfer]
}

struct TransferHistoryItem: Codable, Identifiable {
    let id: String
    let type: String
    let amount: Double
    let otherParty: String?
    let timestamp: Date?
}

struct TransferHistoryResponse: Codable {
    let transfers: [TransferHistoryItem]
    let total: Int?
}

// MARK: - Leaderboard Models

struct LeaderboardEntry: Codable, Identifiable {
    var id: String { "\(rank)" }
    let rank: Int
    let username: String
    let totalSteps: Int?
    let totalCoins: Double?
}

struct LeaderboardResponse: Codable {
    let leaderboard: [LeaderboardEntry]
    let userRank: Int?
}

// MARK: - Profile Models

struct UpdateProfileRequest: Encodable {
    let username: String?
    let email: String?
}

struct ChangePasswordRequest: Encodable {
    let currentPassword: String
    let newPassword: String
}
