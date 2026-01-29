package com.exercisecoin.features.exercise

import android.app.Application
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.content.ServiceConnection
import android.os.IBinder
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.exercisecoin.core.network.ApiService
import com.exercisecoin.core.network.models.*
import com.exercisecoin.core.services.StepCountingService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.Instant
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class ExerciseState(
    val isLoading: Boolean = false,
    val isExercising: Boolean = false,
    val isStepCountingAvailable: Boolean = true,
    val currentSession: ExerciseSession? = null,
    val sessions: List<ExerciseSession> = emptyList(),
    val stats: ExerciseStats? = null,
    val currentSteps: Int = 0,
    val stepsPerSecond: Double = 0.0,
    val elapsedSeconds: Int = 0,
    val coinsEarned: Double = 0.0,
    val error: String? = null
) {
    val formattedTime: String
        get() {
            val hours = elapsedSeconds / 3600
            val minutes = (elapsedSeconds % 3600) / 60
            val seconds = elapsedSeconds % 60
            return if (hours > 0) {
                String.format("%02d:%02d:%02d", hours, minutes, seconds)
            } else {
                String.format("%02d:%02d", minutes, seconds)
            }
        }
}

@HiltViewModel
class ExerciseViewModel @Inject constructor(
    private val apiService: ApiService,
    application: Application
) : AndroidViewModel(application) {

    private val _state = MutableStateFlow(ExerciseState())
    val state: StateFlow<ExerciseState> = _state.asStateFlow()

    private var stepService: StepCountingService? = null
    private var timerJob: Job? = null
    private var uploadJob: Job? = null
    private var stepDataBuffer = mutableListOf<StepData>()

    private val serviceConnection = object : ServiceConnection {
        override fun onServiceConnected(name: ComponentName?, service: IBinder?) {
            val binder = service as StepCountingService.LocalBinder
            stepService = binder.getService()
            collectStepData()
        }

        override fun onServiceDisconnected(name: ComponentName?) {
            stepService = null
        }
    }

    init {
        _state.value = _state.value.copy(
            isStepCountingAvailable = StepCountingService.isStepCounterAvailable(application)
        )
    }

    fun loadInitialData() {
        viewModelScope.launch {
            loadStats()
            loadSessions()
        }
    }

    private suspend fun loadStats() {
        try {
            val stats = apiService.getExerciseStats()
            _state.value = _state.value.copy(stats = stats)
        } catch (e: Exception) {
            // Silently handle
        }
    }

    private suspend fun loadSessions() {
        try {
            val response = apiService.getSessions()
            _state.value = _state.value.copy(sessions = response.sessions)
        } catch (e: Exception) {
            // Silently handle
        }
    }

    fun startExercise() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true, error = null)

            try {
                val session = apiService.startSession()
                _state.value = _state.value.copy(
                    isLoading = false,
                    isExercising = true,
                    currentSession = session,
                    elapsedSeconds = 0,
                    currentSteps = 0,
                    stepsPerSecond = 0.0,
                    coinsEarned = 0.0
                )

                startStepCounting()
                startTimer()
                startUploadTimer()
            } catch (e: Exception) {
                _state.value = _state.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun stopExercise() {
        viewModelScope.launch {
            _state.value = _state.value.copy(isLoading = true)

            stopTimer()
            stopUploadTimer()
            stopStepCounting()

            // Upload final step data
            uploadStepData()

            val session = _state.value.currentSession
            if (session != null) {
                try {
                    val completedSession = apiService.endSession(EndSessionRequest(session.id))
                    _state.value = _state.value.copy(
                        isLoading = false,
                        isExercising = false,
                        currentSession = null,
                        coinsEarned = completedSession.totalCoinsEarned ?: 0.0
                    )
                    loadStats()
                    loadSessions()
                } catch (e: Exception) {
                    _state.value = _state.value.copy(
                        isLoading = false,
                        error = e.message
                    )
                }
            } else {
                _state.value = _state.value.copy(
                    isLoading = false,
                    isExercising = false
                )
            }
        }
    }

    private fun startStepCounting() {
        val context = getApplication<Application>()
        val intent = Intent(context, StepCountingService::class.java).apply {
            action = StepCountingService.ACTION_START
        }
        context.startForegroundService(intent)
        context.bindService(intent, serviceConnection, Context.BIND_AUTO_CREATE)
    }

    private fun stopStepCounting() {
        val context = getApplication<Application>()
        try {
            context.unbindService(serviceConnection)
        } catch (e: Exception) {
            // Service not bound
        }
        val intent = Intent(context, StepCountingService::class.java).apply {
            action = StepCountingService.ACTION_STOP
        }
        context.startService(intent)
        stepService = null
    }

    private fun collectStepData() {
        viewModelScope.launch {
            stepService?.currentSteps?.collect { steps ->
                _state.value = _state.value.copy(currentSteps = steps)

                // Buffer step data
                stepDataBuffer.add(
                    StepData(
                        timestamp = DateTimeFormatter.ISO_INSTANT.format(Instant.now()),
                        stepCount = steps,
                        stepsPerSecond = _state.value.stepsPerSecond
                    )
                )
            }
        }

        viewModelScope.launch {
            stepService?.stepsPerSecond?.collect { rate ->
                _state.value = _state.value.copy(stepsPerSecond = rate)
            }
        }
    }

    private fun startTimer() {
        timerJob = viewModelScope.launch {
            while (isActive) {
                delay(1000)
                _state.value = _state.value.copy(
                    elapsedSeconds = _state.value.elapsedSeconds + 1
                )
            }
        }
    }

    private fun stopTimer() {
        timerJob?.cancel()
        timerJob = null
    }

    private fun startUploadTimer() {
        uploadJob = viewModelScope.launch {
            while (isActive) {
                delay(10000) // Upload every 10 seconds
                uploadStepData()
            }
        }
    }

    private fun stopUploadTimer() {
        uploadJob?.cancel()
        uploadJob = null
    }

    private suspend fun uploadStepData() {
        val session = _state.value.currentSession ?: return
        val dataToUpload = stepDataBuffer.toList()
        if (dataToUpload.isEmpty()) return

        stepDataBuffer.clear()

        try {
            val response = apiService.recordSteps(
                RecordStepsRequest(
                    sessionId = session.id,
                    stepData = dataToUpload
                )
            )
            _state.value = _state.value.copy(coinsEarned = response.coinsEarned)
        } catch (e: Exception) {
            // Re-add data to buffer on failure
            stepDataBuffer.addAll(0, dataToUpload)
        }
    }

    override fun onCleared() {
        super.onCleared()
        if (_state.value.isExercising) {
            stopStepCounting()
        }
    }
}
