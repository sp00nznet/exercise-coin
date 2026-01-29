package com.exercisecoin.features.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.exercisecoin.core.network.ApiService
import com.exercisecoin.core.network.models.LoginRequest
import com.exercisecoin.core.network.models.RegisterRequest
import com.exercisecoin.core.network.models.User
import com.exercisecoin.core.storage.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AuthState(
    val isLoading: Boolean = true,
    val isAuthenticated: Boolean = false,
    val user: User? = null,
    val error: String? = null
)

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _authState = MutableStateFlow(AuthState())
    val authState: StateFlow<AuthState> = _authState.asStateFlow()

    init {
        checkAuthStatus()
    }

    private fun checkAuthStatus() {
        viewModelScope.launch {
            if (tokenManager.hasToken()) {
                try {
                    val user = apiService.getProfile()
                    tokenManager.saveUser(user)
                    _authState.value = AuthState(
                        isLoading = false,
                        isAuthenticated = true,
                        user = user
                    )
                } catch (e: Exception) {
                    tokenManager.clearAll()
                    _authState.value = AuthState(isLoading = false)
                }
            } else {
                _authState.value = AuthState(isLoading = false)
            }
        }
    }

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            try {
                val response = apiService.login(LoginRequest(email, password))
                tokenManager.saveToken(response.token)
                tokenManager.saveUser(response.user)
                _authState.value = AuthState(
                    isLoading = false,
                    isAuthenticated = true,
                    user = response.user
                )
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Login failed"
                )
            }
        }
    }

    fun register(username: String, email: String, password: String) {
        viewModelScope.launch {
            _authState.value = _authState.value.copy(isLoading = true, error = null)

            try {
                val response = apiService.register(RegisterRequest(username, email, password))
                tokenManager.saveToken(response.token)
                tokenManager.saveUser(response.user)
                _authState.value = AuthState(
                    isLoading = false,
                    isAuthenticated = true,
                    user = response.user
                )
            } catch (e: Exception) {
                _authState.value = _authState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Registration failed"
                )
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                apiService.logout()
            } catch (e: Exception) {
                // Ignore logout API errors
            }
            tokenManager.clearAll()
            _authState.value = AuthState(isLoading = false)
        }
    }

    fun clearError() {
        _authState.value = _authState.value.copy(error = null)
    }
}
