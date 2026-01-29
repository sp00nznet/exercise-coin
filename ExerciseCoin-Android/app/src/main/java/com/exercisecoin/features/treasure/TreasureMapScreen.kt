package com.exercisecoin.features.treasure

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.exercisecoin.ui.components.CoinDisplay
import com.exercisecoin.ui.components.PrimaryButton
import com.exercisecoin.ui.theme.AppColors
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TreasureMapScreen(
    viewModel: TreasureMapViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(LatLng(state.latitude, state.longitude), 15f)
    }

    var showDropSheet by remember { mutableStateOf(false) }
    var showCollectSheet by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        viewModel.loadNearbyTreasure()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Treasure Map") },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Background)
            )
        }
    ) { padding ->
        Box(modifier = Modifier.fillMaxSize().padding(padding)) {
            GoogleMap(
                modifier = Modifier.fillMaxSize(),
                cameraPositionState = cameraPositionState,
                uiSettings = MapUiSettings(zoomControlsEnabled = false)
            ) {
                state.treasureDrops.forEach { drop ->
                    Marker(
                        state = MarkerState(position = LatLng(drop.latitude, drop.longitude)),
                        title = "${drop.amount} EXC",
                        snippet = drop.rarity ?: "common",
                        onClick = {
                            viewModel.selectDrop(drop)
                            showCollectSheet = true
                            true
                        }
                    )
                }
            }

            // Bottom controls
            Column(
                modifier = Modifier.align(Alignment.BottomCenter).padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    FloatingActionButton(
                        onClick = { viewModel.centerOnUser() },
                        containerColor = AppColors.Surface
                    ) {
                        Icon(Icons.Default.MyLocation, null, tint = AppColors.Accent)
                    }

                    ExtendedFloatingActionButton(
                        onClick = { showDropSheet = true },
                        containerColor = AppColors.Accent
                    ) {
                        Icon(Icons.Default.Add, null)
                        Spacer(Modifier.width(8.dp))
                        Text("Drop Coins")
                    }

                    FloatingActionButton(
                        onClick = { viewModel.loadNearbyTreasure() },
                        containerColor = AppColors.Surface
                    ) {
                        Icon(Icons.Default.Refresh, null, tint = AppColors.Accent)
                    }
                }
            }

            if (state.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center),
                    color = AppColors.Accent
                )
            }
        }
    }

    if (showDropSheet) {
        DropTreasureSheet(
            onDismiss = { showDropSheet = false },
            onDrop = { amount, message ->
                viewModel.dropTreasure(amount, message)
                showDropSheet = false
            }
        )
    }

    if (showCollectSheet && state.selectedDrop != null) {
        CollectTreasureSheet(
            drop = state.selectedDrop!!,
            onDismiss = { showCollectSheet = false },
            onCollect = {
                viewModel.collectTreasure()
                showCollectSheet = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DropTreasureSheet(
    onDismiss: () -> Unit,
    onDrop: (Double, String?) -> Unit
) {
    var amount by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = AppColors.Background) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Text("Drop Treasure", style = MaterialTheme.typography.headlineSmall, color = AppColors.TextPrimary)
            OutlinedTextField(value = amount, onValueChange = { amount = it }, label = { Text("Amount (EXC)") }, modifier = Modifier.fillMaxWidth())
            OutlinedTextField(value = message, onValueChange = { message = it }, label = { Text("Message (optional)") }, modifier = Modifier.fillMaxWidth())
            PrimaryButton(text = "Drop Coins", onClick = { amount.toDoubleOrNull()?.let { onDrop(it, message.ifBlank { null }) } }, enabled = amount.toDoubleOrNull() != null)
            Spacer(Modifier.height(16.dp))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CollectTreasureSheet(
    drop: com.exercisecoin.core.network.models.TreasureDrop,
    onDismiss: () -> Unit,
    onCollect: () -> Unit
) {
    ModalBottomSheet(onDismissRequest = onDismiss, containerColor = AppColors.Background) {
        Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(16.dp)) {
            Icon(Icons.Default.CardGiftcard, null, modifier = Modifier.size(60.dp), tint = AppColors.Coin)
            Text("Treasure Found!", style = MaterialTheme.typography.headlineSmall, color = AppColors.TextPrimary)
            CoinDisplay(amount = drop.amount)
            drop.distance?.let { Text("${it.toInt()}m away", color = AppColors.TextSecondary) }
            PrimaryButton(text = "Collect", onClick = onCollect)
            Spacer(Modifier.height(16.dp))
        }
    }
}
