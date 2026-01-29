package com.exercisecoin.features.home

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.exercisecoin.ui.components.CardView
import com.exercisecoin.ui.components.CoinDisplay
import com.exercisecoin.ui.components.CoinDisplaySize
import com.exercisecoin.ui.components.StatCard
import com.exercisecoin.ui.theme.AppColors

@Composable
fun HomeScreen(
    onNavigateToSend: () -> Unit,
    viewModel: HomeViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadDashboard()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Welcome Header
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "Welcome back,",
                    style = MaterialTheme.typography.bodyMedium,
                    color = AppColors.TextSecondary
                )
                Text(
                    text = state.username ?: "User",
                    style = MaterialTheme.typography.headlineMedium,
                    color = AppColors.TextPrimary
                )
            }
            Icon(
                imageVector = Icons.Default.DirectionsWalk,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = AppColors.Accent
            )
        }

        // Balance Card
        CardView {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Balance",
                    style = MaterialTheme.typography.labelMedium,
                    color = AppColors.TextSecondary
                )
                CoinDisplay(
                    amount = state.dashboard?.balance ?: 0.0,
                    size = CoinDisplaySize.Large
                )
            }
        }

        // Today's Stats
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            StatCard(
                title = "Today's Steps",
                value = "${state.dashboard?.todaySteps ?: 0}",
                icon = {
                    Icon(
                        imageVector = Icons.Default.DirectionsWalk,
                        contentDescription = null,
                        tint = AppColors.Accent
                    )
                },
                modifier = Modifier.weight(1f)
            )
            StatCard(
                title = "Coins Earned",
                value = String.format("%.2f", state.dashboard?.todayCoins ?: 0.0),
                icon = {
                    Icon(
                        imageVector = Icons.Default.Circle,
                        contentDescription = null,
                        tint = AppColors.Coin
                    )
                },
                iconColor = AppColors.Coin,
                modifier = Modifier.weight(1f)
            )
        }

        // Quick Actions
        Text(
            text = "Quick Actions",
            style = MaterialTheme.typography.headlineSmall,
            color = AppColors.TextPrimary
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            QuickActionButton(
                icon = Icons.Default.DirectionsWalk,
                label = "Exercise",
                color = AppColors.Accent,
                modifier = Modifier.weight(1f),
                onClick = { }
            )
            QuickActionButton(
                icon = Icons.Default.Send,
                label = "Send",
                color = AppColors.Info,
                modifier = Modifier.weight(1f),
                onClick = onNavigateToSend
            )
            QuickActionButton(
                icon = Icons.Default.QrCodeScanner,
                label = "Scan",
                color = AppColors.Success,
                modifier = Modifier.weight(1f),
                onClick = { }
            )
            QuickActionButton(
                icon = Icons.Default.Map,
                label = "Map",
                color = AppColors.Warning,
                modifier = Modifier.weight(1f),
                onClick = { }
            )
        }

        // Recent Achievements
        state.dashboard?.recentAchievements?.let { achievements ->
            if (achievements.isNotEmpty()) {
                Text(
                    text = "Recent Achievements",
                    style = MaterialTheme.typography.headlineSmall,
                    color = AppColors.TextPrimary
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    achievements.take(3).forEach { achievement ->
                        AchievementBadge(
                            name = achievement.name,
                            modifier = Modifier.weight(1f)
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QuickActionButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    label: String,
    color: androidx.compose.ui.graphics.Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    Card(
        modifier = modifier,
        onClick = onClick,
        colors = CardDefaults.cardColors(
            containerColor = AppColors.Surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = icon,
                contentDescription = label,
                tint = color
            )
            Text(
                text = label,
                style = MaterialTheme.typography.labelSmall,
                color = AppColors.TextSecondary
            )
        }
    }
}

@Composable
private fun AchievementBadge(
    name: String,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(
            containerColor = AppColors.Surface
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.EmojiEvents,
                contentDescription = null,
                modifier = Modifier.size(28.dp),
                tint = AppColors.Coin
            )
            Text(
                text = name,
                style = MaterialTheme.typography.labelSmall,
                color = AppColors.TextPrimary,
                maxLines = 1
            )
        }
    }
}
