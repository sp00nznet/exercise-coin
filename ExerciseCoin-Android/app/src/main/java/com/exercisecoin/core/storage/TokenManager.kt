package com.exercisecoin.core.storage

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import com.exercisecoin.core.network.models.User
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class TokenManager @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val masterKey = MasterKey.Builder(context)
        .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
        .build()

    private val sharedPreferences: SharedPreferences = EncryptedSharedPreferences.create(
        context,
        "exercise_coin_secure_prefs",
        masterKey,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private val json = Json {
        ignoreUnknownKeys = true
        isLenient = true
    }

    private val _token = MutableStateFlow<String?>(getTokenSync())
    val token: StateFlow<String?> = _token

    private val _user = MutableStateFlow<User?>(getUserSync())
    val user: StateFlow<User?> = _user

    fun getTokenSync(): String? {
        return sharedPreferences.getString(KEY_TOKEN, null)
    }

    suspend fun saveToken(token: String) {
        sharedPreferences.edit()
            .putString(KEY_TOKEN, token)
            .apply()
        _token.value = token
    }

    suspend fun clearToken() {
        sharedPreferences.edit()
            .remove(KEY_TOKEN)
            .apply()
        _token.value = null
    }

    private fun getUserSync(): User? {
        val userJson = sharedPreferences.getString(KEY_USER, null) ?: return null
        return try {
            json.decodeFromString<User>(userJson)
        } catch (e: Exception) {
            null
        }
    }

    suspend fun saveUser(user: User) {
        val userJson = json.encodeToString(user)
        sharedPreferences.edit()
            .putString(KEY_USER, userJson)
            .apply()
        _user.value = user
    }

    suspend fun clearUser() {
        sharedPreferences.edit()
            .remove(KEY_USER)
            .apply()
        _user.value = null
    }

    suspend fun clearAll() {
        sharedPreferences.edit()
            .clear()
            .apply()
        _token.value = null
        _user.value = null
    }

    fun hasToken(): Boolean = getTokenSync() != null

    companion object {
        private const val KEY_TOKEN = "auth_token"
        private const val KEY_USER = "user_data"
    }
}
