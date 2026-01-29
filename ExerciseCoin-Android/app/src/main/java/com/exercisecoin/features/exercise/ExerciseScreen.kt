package com.exercisecoin.features.exercise

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.exercisecoin.ui.components.*
import com.exercisecoin.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExerciseScreen(
    viewModel: ExerciseViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadInitialData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Exercise") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = AppColors.Background
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Current Session Card
            if (state.isExercising) {
                ActiveSessionCard(
                    formattedTime = state.formattedTime,
                    currentSteps = state.currentSteps,
                    stepsPerSecond = state.stepsPerSecond,
                    coinsEarned = state.coinsEarned,
                    isLoading = state.isLoading,
                    onStop = { viewModel.stopExercise() }
                )
            } else {
                StartSessionCard(
                    isStepCountingAvailable = state.isStepCountingAvailable,
                    isLoading = state.isLoading,
                    onStart = { viewModel.startExercise() }
                )
            }

            // Stats Section
            state.stats?.let { stats ->
                Text(
                    text = "Your Stats",
                    style = MaterialTheme.typography.headlineSmall,
                    color = AppColors.TextPrimary
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    StatCard(
                        title = "Total Sessions",
                        value = "${stats.totalSessions}",
                        icon = {
                            Icon(Icons.Default.CalendarMonth, null, tint = AppColors.Accent)
                        },
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        title = "Total Steps",
                        value = "%,d".format(stats.totalSteps),
                        icon = {
                            Icon(Icons.Default.DirectionsWalk, null, tint = AppColors.Accent)
                        },
                        modifier = Modifier.weight(1f)
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    StatCard(
                        title = "Coins Earned",
                        value = String.format("%.2f", stats.totalCoinsEarned),
                        icon = {
                            Icon(Icons.Default.Circle, null, tint = AppColors.Coin)
                        },
                        iconColor = AppColors.Coin,
                        modifier = Modifier.weight(1f)
                    )
                    StatCard(
                        title = "Streak",
                        value = "${stats.streakDays ?: 0} days",
                        icon = {
                            Icon(Icons.Default.LocalFireDepartment, null, tint = AppColors.Warning)
                        },
                        iconColor = AppColors.Warning,
                        modifier = Modifier.weight(1f)
                    )
                }
            }

            // Recent Sessions
            Text(
                text = "Recent Sessions",
                style = MaterialTheme.typography.headlineSmall,
                color = AppColors.TextPrimary
            )

            if (state.sessions.isEmpty()) {
                EmptyStateView(
                    icon = {
                        Icon(
                            imageVector = Icons.Default.DirectionsWalk,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = AppColors.TextSecondary
                        )
                    },
                    title = "No sessions yet",
                    message = "Start exercising to see your history"
                )
            } else {
                state.sessions.forEach { session ->
                    SessionRow(session = session)
                }
            }
        }
    }
}

@Composable
private fun ActiveSessionCard(
    formattedTime: String,
    currentSteps: Int,
    stepsPerSecond: Double,
    coinsEarned: Double,
    isLoading: Boolean,
    onStop: () -> Unit
) {
    CardView {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Active Session",
                style = MaterialTheme.typography.headlineSmall,
                color = AppColors.Accent
            )

            Text(
                text = formattedTime,
                style = MaterialTheme.typography.displayLarge,
                color = AppColors.TextPrimary
            )

            Row(
                horizontalArrangement = Arrangement.spacedBy(32.dp)
            ) {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = "%,d".format(currentSteps),
                        style = MaterialTheme.typography.displaySmall,
                        color = AppColors.TextPrimary
                    )
                    Text(
                        text = "Steps",
                        style = MaterialTheme.typography.labelSmall,
                        color = AppColors.TextSecondary
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = String.format("%.1f", stepsPerSecond),
                        style = MaterialTheme.typography.displaySmall,
                        color = AppColors.TextPrimary
                    )
                    Text(
                        text = "Steps/sec",
                        style = MaterialTheme.typography.labelSmall,
                        color = AppColors.TextSecondary
                    )
                }
            }

            CoinDisplay(amount = coinsEarned, size = CoinDisplaySize.Medium)

            PrimaryButton(
                text = "Stop Exercise",
                onClick = onStop,
                isLoading = isLoading
            )
        }
    }
}

@Composable
private fun StartSessionCard(
    isStepCountingAvailable: Boolean,
    isLoading: Boolean,
    onStart: () -> Unit
) {
    CardView {
        Column(
            modifier = Modifier.fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(
                imageVector = Icons.Default.DirectionsWalk,
                contentDescription = null,
                modifier = Modifier.size(60.dp),
                tint = AppColors.Accent
            )

            Text(
                text = "Ready to Exercise?",
                style = MaterialTheme.typography.headlineSmall,
                color = AppColors.TextPrimary
            )

            Text(
                text = "Start a session to track your steps and earn coins",
                style = MaterialTheme.typography.bodyMedium,
                color = AppColors.TextSecondary,
                textAlign = TextAlign.Center
            )

            if (!isStepCountingAvailable) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Warning,
                        contentDescription = null,
                        tint = AppColors.Warning
                    )
                    Text(
                        text = "Step counting not available",
                        style = MaterialTheme.typography.labelSmall,
                        color = AppColors.Warning
                    )
                }
            }

            PrimaryButton(
                text = "Start Exercise",
                onClick = onStart,
                isLoading = isLoading,
                enabled = isStepCountingAvailable
            )
        }
    }
}

@Composable
private fun SessionRow(
    session: com.exercisecoin.core.network.models.ExerciseSession
) {
    CardView {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = session.startTime ?: "Unknown date",
                    style = MaterialTheme.typography.bodyMedium,
                    color = AppColors.TextPrimary
                )
                Text(
                    text = "${session.totalSteps ?: 0} steps",
                    style = MaterialTheme.typography.labelSmall,
                    color = AppColors.TextSecondary
                )
            }
            CoinDisplay(amount = session.totalCoinsEarned ?: 0.0)
        }
    }
}
