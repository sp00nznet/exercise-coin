package com.exercisecoin.core.network

import com.exercisecoin.core.network.models.*
import retrofit2.http.*

interface ApiService {
    // Auth
    @POST("/auth/register")
    suspend fun register(@Body request: RegisterRequest): AuthResponse

    @POST("/auth/login")
    suspend fun login(@Body request: LoginRequest): AuthResponse

    @GET("/auth/profile")
    suspend fun getProfile(): User

    @POST("/auth/logout")
    suspend fun logout()

    // Exercise
    @POST("/exercise/session/start")
    suspend fun startSession(): ExerciseSession

    @POST("/exercise/session/steps")
    suspend fun recordSteps(@Body request: RecordStepsRequest): StepsResponse

    @POST("/exercise/session/end")
    suspend fun endSession(@Body request: EndSessionRequest): ExerciseSession

    @GET("/exercise/sessions")
    suspend fun getSessions(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): SessionsResponse

    @GET("/exercise/session/{sessionId}")
    suspend fun getSession(@Path("sessionId") sessionId: String): ExerciseSession

    @GET("/exercise/stats")
    suspend fun getExerciseStats(): ExerciseStats

    // Wallet
    @GET("/wallet/balance")
    suspend fun getWalletBalance(): WalletBalance

    @GET("/wallet/address")
    suspend fun getWalletAddress(): WalletAddressResponse

    @GET("/wallet/transactions")
    suspend fun getTransactions(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("type") type: String? = null
    ): TransactionsResponse

    @GET("/wallet/daemon/status")
    suspend fun getDaemonStatus(): DaemonStatus

    @POST("/wallet/daemon/start")
    suspend fun startDaemon(): DaemonStatus

    @GET("/wallet/earnings")
    suspend fun getEarnings(): EarningsResponse

    // User
    @GET("/user/dashboard")
    suspend fun getDashboard(): Dashboard

    @PUT("/user/profile")
    suspend fun updateProfile(@Body request: UpdateProfileRequest): User

    @PUT("/user/password")
    suspend fun changePassword(@Body request: ChangePasswordRequest)

    @GET("/user/leaderboard")
    suspend fun getLeaderboard(
        @Query("period") period: String = "weekly",
        @Query("limit") limit: Int = 50
    ): LeaderboardResponse

    // Achievements
    @GET("/achievements")
    suspend fun getAchievements(): AchievementsResponse

    @POST("/achievements/check")
    suspend fun checkAchievements(): NewAchievementsResponse

    @GET("/achievements/new")
    suspend fun getNewAchievements(): NewAchievementsResponse

    // Treasure
    @POST("/treasure/drop")
    suspend fun dropTreasure(@Body request: DropTreasureRequest): TreasureDrop

    @GET("/treasure/nearby")
    suspend fun getNearbyTreasure(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Int = 1000
    ): NearbyTreasureResponse

    @POST("/treasure/collect")
    suspend fun collectTreasure(@Body request: CollectTreasureRequest): CollectTreasureResponse

    @GET("/treasure/history")
    suspend fun getTreasureHistory(): TreasureHistoryResponse

    // Transfers
    @POST("/transfer/send")
    suspend fun sendCoins(@Body request: SendCoinsRequest): SendCoinsResponse

    @POST("/transfer/qr/create")
    suspend fun createQRTransfer(@Body request: CreateQRTransferRequest): QRTransfer

    @POST("/transfer/qr/claim")
    suspend fun claimQRTransfer(@Body request: ClaimQRTransferRequest): ClaimQRTransferResponse

    @DELETE("/transfer/qr/{transferId}")
    suspend fun cancelQRTransfer(@Path("transferId") transferId: String)

    @GET("/transfer/pending")
    suspend fun getPendingTransfers(): PendingTransfersResponse

    @GET("/transfer/history")
    suspend fun getTransferHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): TransferHistoryResponse
}
