package com.exercisecoin.features.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.exercisecoin.ui.components.CardView
import com.exercisecoin.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(
    onNavigateToAchievements: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var showLogoutDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Background)
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
            // Profile Header
            CardView {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .clip(CircleShape)
                            .background(AppColors.Accent),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = state.user?.username?.firstOrNull()?.uppercase() ?: "?",
                            style = MaterialTheme.typography.headlineLarge,
                            color = AppColors.TextPrimary
                        )
                    }
                    Text(state.user?.username ?: "Unknown", style = MaterialTheme.typography.headlineMedium, color = AppColors.TextPrimary)
                    Text(state.user?.email ?: "", style = MaterialTheme.typography.bodyMedium, color = AppColors.TextSecondary)
                }
            }

            // Menu Items
            ProfileMenuItem(icon = Icons.Default.EmojiEvents, title = "Achievements", color = AppColors.Coin, onClick = onNavigateToAchievements)
            ProfileMenuItem(icon = Icons.Default.Leaderboard, title = "Leaderboard", color = AppColors.Info, onClick = { })
            ProfileMenuItem(icon = Icons.Default.Person, title = "Edit Profile", color = AppColors.Accent, onClick = { })
            ProfileMenuItem(icon = Icons.Default.Lock, title = "Change Password", color = AppColors.Warning, onClick = { })

            // Logout
            Card(
                modifier = Modifier.fillMaxWidth().clickable { showLogoutDialog = true },
                colors = CardDefaults.cardColors(containerColor = AppColors.Surface)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Icon(Icons.Default.Logout, null, tint = AppColors.Error)
                    Text("Log Out", color = AppColors.Error)
                }
            }

            Spacer(Modifier.weight(1f))
            Text("ExerciseCoin v1.0.0", style = MaterialTheme.typography.labelSmall, color = AppColors.TextDisabled, modifier = Modifier.align(Alignment.CenterHorizontally))
        }
    }

    if (showLogoutDialog) {
        AlertDialog(
            onDismissRequest = { showLogoutDialog = false },
            title = { Text("Log Out") },
            text = { Text("Are you sure you want to log out?") },
            confirmButton = {
                TextButton(onClick = { showLogoutDialog = false; onLogout() }) {
                    Text("Log Out", color = AppColors.Error)
                }
            },
            dismissButton = {
                TextButton(onClick = { showLogoutDialog = false }) {
                    Text("Cancel")
                }
            },
            containerColor = AppColors.Surface
        )
    }
}

@Composable
private fun ProfileMenuItem(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    title: String,
    color: androidx.compose.ui.graphics.Color,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = AppColors.Surface)
    ) {
        Row(
            modifier = Modifier.padding(16.dp).fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Icon(icon, null, tint = color)
                Text(title, color = AppColors.TextPrimary)
            }
            Icon(Icons.Default.ChevronRight, null, tint = AppColors.TextSecondary)
        }
    }
}
