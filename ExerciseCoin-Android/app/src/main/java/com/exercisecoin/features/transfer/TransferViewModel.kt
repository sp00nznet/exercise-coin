package com.exercisecoin.features.transfer

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

data class TransferState(
    val isLoading: Boolean = false,
    val qrTransfer: QRTransfer? = null,
    val success: Boolean = false,
    val successMessage: String? = null,
    val error: String? = null
)

@HiltViewModel
class TransferViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    private val _state = MutableStateFlow(TransferState())
    val state: StateFlow<TransferState> = _state.asStateFlow()

    fun sendCoins(recipient: String, amount: Double, message: String?) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val response = apiService.sendCoins(SendCoinsRequest(recipient, amount, message))
                _state.value = _state.value.copy(
                    isLoading = false,
                    success = true,
                    successMessage = "Sent $amount EXC to $recipient"
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun createQRTransfer(amount: Double) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val transfer = apiService.createQRTransfer(CreateQRTransferRequest(amount))
                _state.value = _state.value.copy(isLoading = false, qrTransfer = transfer)
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun claimQRTransfer(code: String) {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)
            try {
                val response = apiService.claimQRTransfer(ClaimQRTransferRequest(code))
                _state.value = _state.value.copy(
                    isLoading = false,
                    success = true,
                    successMessage = "Received ${response.amount} EXC"
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun cancelQRTransfer() {
        val transfer = _state.value.qrTransfer ?: return
        viewModelScope.launch {
            try {
                apiService.cancelQRTransfer(transfer.id)
                _state.value = _state.value.copy(qrTransfer = null)
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message)
            }
        }
    }

    fun clearError() {
        _state.value = _state.value.copy(error = null)
    }
}
