package com.exercisecoin.features.wallet

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

data class WalletState(
    val isLoading: Boolean = false,
    val balance: WalletBalance? = null,
    val walletAddress: String? = null,
    val transactions: List<Transaction> = emptyList(),
    val daemonStatus: DaemonStatus? = null,
    val error: String? = null
)

@HiltViewModel
class WalletViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {

    private val _state = MutableStateFlow(WalletState())
    val state: StateFlow<WalletState> = _state.asStateFlow()

    fun loadWalletData() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)
            try {
                val balance = apiService.getWalletBalance()
                val address = apiService.getWalletAddress()
                val transactions = apiService.getTransactions()
                val daemon = apiService.getDaemonStatus()
                _state.value = _state.value.copy(
                    isLoading = false,
                    balance = balance,
                    walletAddress = address.address,
                    transactions = transactions.transactions,
                    daemonStatus = daemon
                )
            } catch (e: Exception) {
                _state.value = _state.value.copy(isLoading = false, error = e.message)
            }
        }
    }

    fun startDaemon() {
        viewModelScope.launch {
            try {
                val status = apiService.startDaemon()
                _state.value = _state.value.copy(daemonStatus = status)
            } catch (e: Exception) {
                _state.value = _state.value.copy(error = e.message)
            }
        }
    }
}
