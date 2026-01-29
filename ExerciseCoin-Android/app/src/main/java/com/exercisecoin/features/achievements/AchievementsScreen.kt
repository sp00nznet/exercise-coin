package com.exercisecoin.features.achievements

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.exercisecoin.core.network.models.Achievement
import com.exercisecoin.ui.components.*
import com.exercisecoin.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AchievementsScreen(
    onNavigateBack: () -> Unit,
    viewModel: AchievementsViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadAchievements()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Achievements") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, null, tint = AppColors.Accent)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Background)
            )
        }
    ) { padding ->
        if (state.isLoading && state.achievements.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize().padding(padding), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = AppColors.Accent)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize().padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                item {
                    CardView {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Column {
                                Text("Progress", style = MaterialTheme.typography.labelMedium, color = AppColors.TextSecondary)
                                Text("${state.unlockedCount} / ${state.achievements.size}", style = MaterialTheme.typography.headlineMedium, color = AppColors.TextPrimary)
                            }
                            CircularProgressIndicator(
                                progress = { if (state.achievements.isNotEmpty()) state.unlockedCount.toFloat() / state.achievements.size else 0f },
                                modifier = Modifier.size(60.dp),
                                color = AppColors.Accent,
                                trackColor = AppColors.SurfaceVariant
                            )
                        }
                    }
                }

                items(state.achievements) { achievement ->
                    AchievementCard(achievement = achievement)
                }
            }
        }
    }
}

@Composable
private fun AchievementCard(achievement: Achievement) {
    CardView {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(
                modifier = Modifier.size(50.dp),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = if (achievement.isUnlocked) Icons.Default.EmojiEvents else Icons.Default.Lock,
                    contentDescription = null,
                    modifier = Modifier.size(28.dp),
                    tint = if (achievement.isUnlocked) AppColors.Coin else AppColors.TextDisabled
                )
            }

            Column(modifier = Modifier.weight(1f)) {
                Text(achievement.name, style = MaterialTheme.typography.bodyMedium, color = if (achievement.isUnlocked) AppColors.TextPrimary else AppColors.TextSecondary)
                achievement.description?.let { Text(it, style = MaterialTheme.typography.labelSmall, color = AppColors.TextSecondary, maxLines = 2) }
                if (!achievement.isUnlocked) {
                    Spacer(Modifier.height(4.dp))
                    LinearProgressIndicator(
                        progress = { achievement.progressPercentage.toFloat() },
                        modifier = Modifier.fillMaxWidth().height(4.dp),
                        color = AppColors.Accent,
                        trackColor = AppColors.SurfaceVariant
                    )
                    achievement.progress?.let { p ->
                        achievement.target?.let { t ->
                            Text("${p.toInt()} / ${t.toInt()}", style = MaterialTheme.typography.labelSmall, color = AppColors.TextSecondary)
                        }
                    }
                }
            }

            achievement.reward?.let { reward ->
                Column(horizontalAlignment = Alignment.End) {
                    Text("+${reward.toInt()}", style = MaterialTheme.typography.bodyMedium, color = AppColors.Coin)
                    Text("EXC", style = MaterialTheme.typography.labelSmall, color = AppColors.TextSecondary)
                }
            }
        }
    }
}
