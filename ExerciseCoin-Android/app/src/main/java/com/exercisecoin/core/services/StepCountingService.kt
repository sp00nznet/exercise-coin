package com.exercisecoin.core.services

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.os.Binder
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.exercisecoin.MainActivity
import com.exercisecoin.R
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class StepCountingService : Service(), SensorEventListener {

    private val binder = LocalBinder()
    private lateinit var sensorManager: SensorManager
    private var stepSensor: Sensor? = null

    private var initialSteps = -1
    private var lastStepCount = 0
    private var lastUpdateTime = System.currentTimeMillis()

    private val _currentSteps = MutableStateFlow(0)
    val currentSteps: StateFlow<Int> = _currentSteps

    private val _stepsPerSecond = MutableStateFlow(0.0)
    val stepsPerSecond: StateFlow<Double> = _stepsPerSecond

    private val _isTracking = MutableStateFlow(false)
    val isTracking: StateFlow<Boolean> = _isTracking

    inner class LocalBinder : Binder() {
        fun getService(): StepCountingService = this@StepCountingService
    }

    override fun onCreate() {
        super.onCreate()
        sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
        stepSensor = sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER)
        createNotificationChannel()
    }

    override fun onBind(intent: Intent): IBinder {
        return binder
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_START -> startTracking()
            ACTION_STOP -> stopTracking()
        }
        return START_STICKY
    }

    fun startTracking() {
        if (_isTracking.value) return

        stepSensor?.let { sensor ->
            sensorManager.registerListener(this, sensor, SensorManager.SENSOR_DELAY_UI)
            _isTracking.value = true
            initialSteps = -1
            _currentSteps.value = 0
            _stepsPerSecond.value = 0.0
            lastUpdateTime = System.currentTimeMillis()

            startForeground(NOTIFICATION_ID, createNotification())
        }
    }

    fun stopTracking() {
        sensorManager.unregisterListener(this)
        _isTracking.value = false
        stopForeground(STOP_FOREGROUND_REMOVE)
        stopSelf()
    }

    override fun onSensorChanged(event: SensorEvent?) {
        event?.let {
            if (it.sensor.type == Sensor.TYPE_STEP_COUNTER) {
                val totalSteps = it.values[0].toInt()

                if (initialSteps < 0) {
                    initialSteps = totalSteps
                }

                val currentStepCount = totalSteps - initialSteps
                val now = System.currentTimeMillis()
                val timeDiff = (now - lastUpdateTime) / 1000.0

                if (timeDiff > 0) {
                    val stepDiff = currentStepCount - lastStepCount
                    _stepsPerSecond.value = stepDiff / timeDiff
                }

                _currentSteps.value = currentStepCount
                lastStepCount = currentStepCount
                lastUpdateTime = now

                updateNotification(currentStepCount)
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {
        // Not needed for step counter
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Exercise Tracking",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Shows current exercise session progress"
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager.createNotificationChannel(channel)
        }
    }

    private fun createNotification(steps: Int = 0): Notification {
        val intent = Intent(this, MainActivity::class.java)
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("Exercise Session Active")
            .setContentText("Steps: $steps")
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentIntent(pendingIntent)
            .setOngoing(true)
            .build()
    }

    private fun updateNotification(steps: Int) {
        val notificationManager = getSystemService(NotificationManager::class.java)
        notificationManager.notify(NOTIFICATION_ID, createNotification(steps))
    }

    companion object {
        const val ACTION_START = "com.exercisecoin.START_TRACKING"
        const val ACTION_STOP = "com.exercisecoin.STOP_TRACKING"
        private const val CHANNEL_ID = "exercise_tracking_channel"
        private const val NOTIFICATION_ID = 1001

        fun isStepCounterAvailable(context: Context): Boolean {
            val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager
            return sensorManager.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null
        }
    }
}
