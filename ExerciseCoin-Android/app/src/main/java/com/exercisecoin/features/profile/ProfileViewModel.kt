package com.exercisecoin.features.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.exercisecoin.core.network.models.User
import com.exercisecoin.core.storage.TokenManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class ProfileState(
    val isLoading: Boolean = false,
    val user: User? = null,
    val error: String? = null
)

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val tokenManager: TokenManager
) : ViewModel() {

    private val _state = MutableStateFlow(ProfileState())
    val state: StateFlow<ProfileState> = _state.asStateFlow()

    init {
        viewModelScope.launch {
            tokenManager.user.collect { user ->
                _state.value = _state.value.copy(user = user)
            }
        }
    }
}
