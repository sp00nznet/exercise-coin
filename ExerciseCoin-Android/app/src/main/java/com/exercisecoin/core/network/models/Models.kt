package com.exercisecoin.core.network.models

import kotlinx.serialization.Serializable

// Auth Models
@Serializable
data class User(
    val id: String,
    val username: String,
    val email: String,
    val walletAddress: String? = null,
    val createdAt: String? = null
)

@Serializable
data class AuthResponse(
    val token: String,
    val user: User
)

@Serializable
data class LoginRequest(
    val email: String,
    val password: String
)

@Serializable
data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String
)

// Exercise Models
@Serializable
data class ExerciseSession(
    val id: String,
    val userId: String? = null,
    val startTime: String? = null,
    val endTime: String? = null,
    val totalSteps: Int? = null,
    val totalCoinsEarned: Double? = null,
    val status: String? = null
)

@Serializable
data class StepData(
    val timestamp: String,
    val stepCount: Int,
    val stepsPerSecond: Double
)

@Serializable
data class RecordStepsRequest(
    val sessionId: String,
    val stepData: List<StepData>
)

@Serializable
data class EndSessionRequest(
    val sessionId: String
)

@Serializable
data class StepsResponse(
    val totalSteps: Int,
    val coinsEarned: Double
)

@Serializable
data class SessionsResponse(
    val sessions: List<ExerciseSession>,
    val total: Int? = null,
    val page: Int? = null,
    val totalPages: Int? = null
)

@Serializable
data class ExerciseStats(
    val totalSessions: Int,
    val totalSteps: Int,
    val totalCoinsEarned: Double,
    val averageStepsPerSession: Double? = null,
    val streakDays: Int? = null
)

// Wallet Models
@Serializable
data class WalletBalance(
    val balance: Double,
    val pendingBalance: Double? = null,
    val walletAddress: String? = null
)

@Serializable
data class WalletAddressResponse(
    val address: String
)

@Serializable
data class Transaction(
    val id: String,
    val type: String,
    val amount: Double,
    val timestamp: String? = null,
    val description: String? = null
)

@Serializable
data class TransactionsResponse(
    val transactions: List<Transaction>,
    val total: Int? = null
)

@Serializable
data class DaemonStatus(
    val isRunning: Boolean,
    val miningRate: Double? = null,
    val uptime: Int? = null
)

@Serializable
data class Earning(
    val date: String,
    val amount: Double,
    val source: String
)

@Serializable
data class EarningsResponse(
    val earnings: List<Earning>
)

// Dashboard Models
@Serializable
data class Dashboard(
    val balance: Double? = null,
    val todaySteps: Int? = null,
    val todayCoins: Double? = null,
    val activeSessions: Int? = null,
    val recentAchievements: List<Achievement>? = null
)

// Achievement Models
@Serializable
data class Achievement(
    val id: String,
    val name: String,
    val description: String? = null,
    val icon: String? = null,
    val reward: Double? = null,
    val progress: Double? = null,
    val target: Double? = null,
    val unlockedAt: String? = null
) {
    val isUnlocked: Boolean get() = unlockedAt != null
    val progressPercentage: Double get() {
        val p = progress ?: return 0.0
        val t = target ?: return 0.0
        return if (t > 0) minOf(p / t, 1.0) else 0.0
    }
}

@Serializable
data class AchievementsResponse(
    val achievements: List<Achievement>
)

@Serializable
data class NewAchievementsResponse(
    val newAchievements: List<Achievement>? = null,
    val achievements: List<Achievement>? = null
)

// Treasure Models
@Serializable
data class TreasureDrop(
    val id: String,
    val latitude: Double,
    val longitude: Double,
    val amount: Double,
    val rarity: String? = null,
    val expiresAt: String? = null,
    val distance: Double? = null
)

@Serializable
data class DropTreasureRequest(
    val latitude: Double,
    val longitude: Double,
    val amount: Double,
    val message: String? = null
)

@Serializable
data class NearbyTreasureResponse(
    val drops: List<TreasureDrop>
)

@Serializable
data class CollectTreasureRequest(
    val dropId: String,
    val latitude: Double,
    val longitude: Double
)

@Serializable
data class CollectTreasureResponse(
    val amount: Double,
    val newBalance: Double
)

@Serializable
data class TreasureHistoryResponse(
    val drops: List<TreasureDrop>? = null,
    val collections: List<TreasureDrop>? = null
)

// Transfer Models
@Serializable
data class SendCoinsRequest(
    val recipient: String,
    val amount: Double,
    val message: String? = null
)

@Serializable
data class SendCoinsResponse(
    val transactionId: String,
    val newBalance: Double
)

@Serializable
data class QRTransfer(
    val id: String,
    val amount: Double,
    val code: String? = null,
    val expiresAt: String? = null,
    val status: String? = null
)

@Serializable
data class CreateQRTransferRequest(
    val amount: Double,
    val expiresInMinutes: Int? = 30
)

@Serializable
data class ClaimQRTransferRequest(
    val code: String
)

@Serializable
data class ClaimQRTransferResponse(
    val amount: Double,
    val newBalance: Double,
    val sender: String? = null
)

@Serializable
data class PendingTransfersResponse(
    val transfers: List<QRTransfer>
)

@Serializable
data class TransferHistoryItem(
    val id: String,
    val type: String,
    val amount: Double,
    val otherParty: String? = null,
    val timestamp: String? = null
)

@Serializable
data class TransferHistoryResponse(
    val transfers: List<TransferHistoryItem>,
    val total: Int? = null
)

// Leaderboard Models
@Serializable
data class LeaderboardEntry(
    val rank: Int,
    val username: String,
    val totalSteps: Int? = null,
    val totalCoins: Double? = null
)

@Serializable
data class LeaderboardResponse(
    val leaderboard: List<LeaderboardEntry>,
    val userRank: Int? = null
)

// Profile Models
@Serializable
data class UpdateProfileRequest(
    val username: String? = null,
    val email: String? = null
)

@Serializable
data class ChangePasswordRequest(
    val currentPassword: String,
    val newPassword: String
)
