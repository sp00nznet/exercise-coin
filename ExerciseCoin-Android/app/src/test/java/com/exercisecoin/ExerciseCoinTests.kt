package com.exercisecoin

import com.exercisecoin.core.network.models.*
import kotlinx.serialization.json.Json
import org.junit.Assert.*
import org.junit.Test

class ExerciseCoinTests {

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    @Test
    fun `user model decodes correctly`() {
        val jsonString = """
            {
                "id": "123",
                "username": "testuser",
                "email": "test@example.com",
                "walletAddress": "EXC123456"
            }
        """.trimIndent()

        val user = json.decodeFromString<User>(jsonString)

        assertEquals("123", user.id)
        assertEquals("testuser", user.username)
        assertEquals("test@example.com", user.email)
        assertEquals("EXC123456", user.walletAddress)
    }

    @Test
    fun `auth response decodes correctly`() {
        val jsonString = """
            {
                "token": "jwt_token_here",
                "user": {
                    "id": "123",
                    "username": "testuser",
                    "email": "test@example.com"
                }
            }
        """.trimIndent()

        val response = json.decodeFromString<AuthResponse>(jsonString)

        assertEquals("jwt_token_here", response.token)
        assertEquals("123", response.user.id)
        assertEquals("testuser", response.user.username)
    }

    @Test
    fun `exercise session decodes correctly`() {
        val jsonString = """
            {
                "id": "session123",
                "userId": "user123",
                "totalSteps": 5000,
                "totalCoinsEarned": 25.5,
                "status": "completed"
            }
        """.trimIndent()

        val session = json.decodeFromString<ExerciseSession>(jsonString)

        assertEquals("session123", session.id)
        assertEquals(5000, session.totalSteps)
        assertEquals(25.5, session.totalCoinsEarned)
        assertEquals("completed", session.status)
    }

    @Test
    fun `achievement progress calculation is correct`() {
        val achievement = Achievement(
            id = "1",
            name = "Test",
            description = null,
            icon = null,
            reward = 10.0,
            progress = 50.0,
            target = 100.0,
            unlockedAt = null
        )

        assertFalse(achievement.isUnlocked)
        assertEquals(0.5, achievement.progressPercentage, 0.001)
    }

    @Test
    fun `achievement unlocked state is correct`() {
        val achievement = Achievement(
            id = "1",
            name = "Test",
            description = null,
            icon = null,
            reward = 10.0,
            progress = 100.0,
            target = 100.0,
            unlockedAt = "2024-01-01T00:00:00Z"
        )

        assertTrue(achievement.isUnlocked)
    }

    @Test
    fun `wallet balance decodes correctly`() {
        val jsonString = """
            {
                "balance": 100.50,
                "pendingBalance": 10.25,
                "walletAddress": "EXC123456"
            }
        """.trimIndent()

        val balance = json.decodeFromString<WalletBalance>(jsonString)

        assertEquals(100.50, balance.balance, 0.001)
        assertEquals(10.25, balance.pendingBalance)
        assertEquals("EXC123456", balance.walletAddress)
    }

    @Test
    fun `treasure drop decodes correctly`() {
        val jsonString = """
            {
                "id": "drop123",
                "latitude": 37.7749,
                "longitude": -122.4194,
                "amount": 5.0,
                "rarity": "rare",
                "distance": 100.5
            }
        """.trimIndent()

        val drop = json.decodeFromString<TreasureDrop>(jsonString)

        assertEquals("drop123", drop.id)
        assertEquals(37.7749, drop.latitude, 0.0001)
        assertEquals(-122.4194, drop.longitude, 0.0001)
        assertEquals(5.0, drop.amount, 0.001)
        assertEquals("rare", drop.rarity)
    }

    @Test
    fun `login request encodes correctly`() {
        val request = LoginRequest(email = "test@example.com", password = "password123")
        val encoded = json.encodeToString(LoginRequest.serializer(), request)

        assertTrue(encoded.contains("test@example.com"))
        assertTrue(encoded.contains("password123"))
    }

    @Test
    fun `register request encodes correctly`() {
        val request = RegisterRequest(
            username = "testuser",
            email = "test@example.com",
            password = "password123"
        )
        val encoded = json.encodeToString(RegisterRequest.serializer(), request)

        assertTrue(encoded.contains("testuser"))
        assertTrue(encoded.contains("test@example.com"))
        assertTrue(encoded.contains("password123"))
    }
}
