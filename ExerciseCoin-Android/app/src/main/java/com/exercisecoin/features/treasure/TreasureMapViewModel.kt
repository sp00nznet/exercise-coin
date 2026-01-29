package com.exercisecoin.features.treasure

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.exercisecoin.core.network.ApiService
import com.exercisecoin.core.network.models.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

data class TreasureMapState(
    val isLoading: Boolean = false,
    val latitude: Double = 37.7749,
    val longitude: Double = -122.4194,
    val treasureDrops: List<TreasureDrop> = emptyList(),
    val selectedDrop: TreasureDrop? = null,
    val error: String? = null
)

@HiltViewModel
class TreasureMapViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    private val _state = MutableStateFlow(TreasureMapState())
    val state: StateFlow<TreasureMapState> = _state.asStateFlow()

    fun loadNearbyTreasure() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            try {
                val response = apiService.getNearbyTreasure(
                    latitude = _state.value.latitude,
                    longitude = _state.value.longitude
                )
                _state.value = _state.value.copy(isLoading = false, treasureDrops = response.drops)
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun dropTreasure(amount: Double, message: String?) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            try {
                apiService.dropTreasure(DropTreasureRequest(
                    latitude = _state.value.latitude,
                    longitude = _state.value.longitude,
                    amount = amount,
                    message = message
                ))
                loadNearbyTreasure()
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun collectTreasure() {
        val drop = _state.value.selectedDrop ?: return
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            try {
                apiService.collectTreasure(CollectTreasureRequest(
                    dropId = drop.id,
                    latitude = _state.value.latitude,
                    longitude = _state.value.longitude
                ))
                _state.value = _state.value.copy(
                    treasureDrops = _state.value.treasureDrops.filter { it.id != drop.id },
                    selectedDrop = null,
                    isLoading = false
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun selectDrop(drop: TreasureDrop) {
        _state.value = _state.value.copy(selectedDrop = drop)
    }

    fun centerOnUser() {
        // Would use FusedLocationProviderClient in real implementation
    }
}
