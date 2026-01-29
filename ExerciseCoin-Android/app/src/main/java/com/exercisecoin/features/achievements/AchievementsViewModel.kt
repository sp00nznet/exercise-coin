package com.exercisecoin.features.achievements

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.exercisecoin.core.network.ApiService
import com.exercisecoin.core.network.models.Achievement
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class AchievementsState(
    val isLoading: Boolean = false,
    val achievements: List<Achievement> = emptyList(),
    val error: String? = null
) {
    val unlockedCount: Int get() = achievements.count { it.isUnlocked }
}

@HiltViewModel
class AchievementsViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    private val _state = MutableStateFlow(AchievementsState())
    val state: StateFlow<AchievementsState> = _state.asStateFlow()

    fun loadAchievements() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            try {
                val response = apiService.getAchievements()
                _state.value = _state.value.copy(
                    isLoading = false,
                    achievements = response.achievements.sortedWith(
                        compareByDescending<Achievement> { it.isUnlocked }
                            .thenByDescending { it.progressPercentage }
                    )
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }
}
