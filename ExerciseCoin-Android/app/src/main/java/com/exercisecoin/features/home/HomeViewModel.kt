package com.exercisecoin.features.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.exercisecoin.core.network.ApiService
import com.exercisecoin.core.network.models.Dashboard
import com.exercisecoin.core.storage.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class HomeState(
    val isLoading: Boolean = false,
    val dashboard: Dashboard? = null,
    val username: String? = null,
    val error: String? = null
)

@HiltViewModel
class HomeViewModel @Inject constructor(
    private val apiService: ApiService,
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _state = MutableStateFlow(HomeState())
    val state: StateFlow<HomeState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            tokenManager.user.collect { user ->
                _state.value = _state.value.copy(username = user?.username)
            }
        }
    }

    fun loadDashboard() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            try {
                val dashboard = apiService.getDashboard()
                _state.value = _state.value.copy(
                    isLoading = false,
                    dashboard = dashboard
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }
}
