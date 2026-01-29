import Foundation

enum Endpoint {
    // Auth
    case register
    case login
    case profile
    case logout

    // Exercise
    case startSession
    case recordSteps
    case endSession
    case sessions
    case session(String)
    case exerciseStats

    // Wallet
    case walletBalance
    case walletAddress
    case transactions
    case daemonStatus
    case daemonStart
    case earnings

    // User
    case dashboard
    case updateProfile
    case changePassword
    case leaderboard

    // Achievements
    case achievements
    case checkAchievements
    case newAchievements

    // Treasure
    case dropTreasure
    case nearbyTreasure
    case collectTreasure
    case treasureHistory

    // Transfers
    case sendCoins
    case createQRTransfer
    case claimQRTransfer
    case cancelQRTransfer(String)
    case pendingTransfers
    case transferHistory

    var path: String {
        switch self {
        // Auth
        case .register:
            return "/auth/register"
        case .login:
            return "/auth/login"
        case .profile:
            return "/auth/profile"
        case .logout:
            return "/auth/logout"

        // Exercise
        case .startSession:
            return "/exercise/session/start"
        case .recordSteps:
            return "/exercise/session/steps"
        case .endSession:
            return "/exercise/session/end"
        case .sessions:
            return "/exercise/sessions"
        case .session(let id):
            return "/exercise/session/\(id)"
        case .exerciseStats:
            return "/exercise/stats"

        // Wallet
        case .walletBalance:
            return "/wallet/balance"
        case .walletAddress:
            return "/wallet/address"
        case .transactions:
            return "/wallet/transactions"
        case .daemonStatus:
            return "/wallet/daemon/status"
        case .daemonStart:
            return "/wallet/daemon/start"
        case .earnings:
            return "/wallet/earnings"

        // User
        case .dashboard:
            return "/user/dashboard"
        case .updateProfile:
            return "/user/profile"
        case .changePassword:
            return "/user/password"
        case .leaderboard:
            return "/user/leaderboard"

        // Achievements
        case .achievements:
            return "/achievements"
        case .checkAchievements:
            return "/achievements/check"
        case .newAchievements:
            return "/achievements/new"

        // Treasure
        case .dropTreasure:
            return "/treasure/drop"
        case .nearbyTreasure:
            return "/treasure/nearby"
        case .collectTreasure:
            return "/treasure/collect"
        case .treasureHistory:
            return "/treasure/history"

        // Transfers
        case .sendCoins:
            return "/transfer/send"
        case .createQRTransfer:
            return "/transfer/qr/create"
        case .claimQRTransfer:
            return "/transfer/qr/claim"
        case .cancelQRTransfer(let id):
            return "/transfer/qr/\(id)"
        case .pendingTransfers:
            return "/transfer/pending"
        case .transferHistory:
            return "/transfer/history"
        }
    }
}
