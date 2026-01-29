package com.exercisecoin.features.wallet

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
import com.exercisecoin.ui.components.*
import com.exercisecoin.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WalletScreen(
    onNavigateToSend: () -> Unit,
    viewModel: WalletViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadWalletData()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Wallet") },
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
            // Balance Card
            CardView {
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text("Available Balance", style = MaterialTheme.typography.bodyMedium, color = AppColors.TextSecondary)
                    CoinDisplay(amount = state.balance?.balance ?: 0.0, size = CoinDisplaySize.Large)
                    state.balance?.pendingBalance?.let { pending ->
                        if (pending > 0) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Schedule, null, tint = AppColors.Warning, modifier = Modifier.size(16.dp))
                                Spacer(Modifier.width(4.dp))
                                Text("Pending: ${String.format("%.2f", pending)} EXC", style = MaterialTheme.typography.labelSmall, color = AppColors.Warning)
                            }
                        }
                    }
                }
            }

            // Daemon Status
            CardView {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        Icon(Icons.Default.Circle, null, modifier = Modifier.size(8.dp), tint = if (state.daemonStatus?.isRunning == true) AppColors.Success else AppColors.Error)
                        Column {
                            Text("Mining Daemon", style = MaterialTheme.typography.bodyMedium, color = AppColors.TextPrimary)
                            Text(if (state.daemonStatus?.isRunning == true) "${state.daemonStatus?.miningRate ?: 0} EXC/min" else "Offline", style = MaterialTheme.typography.labelSmall, color = AppColors.TextSecondary)
                        }
                    }
                    if (state.daemonStatus?.isRunning != true) {
                        TextButton(onClick = { viewModel.startDaemon() }) {
                            Text("Start", color = AppColors.Accent)
                        }
                    }
                }
            }

            // Actions
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                SecondaryButton(text = "Send", onClick = onNavigateToSend, modifier = Modifier.weight(1f))
                SecondaryButton(text = "Receive", onClick = { }, modifier = Modifier.weight(1f))
            }

            // Transactions
            Text("Recent Transactions", style = MaterialTheme.typography.headlineSmall, color = AppColors.TextPrimary)

            if (state.transactions.isEmpty()) {
                EmptyStateView(
                    icon = { Icon(Icons.Default.Receipt, null, modifier = Modifier.size(48.dp), tint = AppColors.TextSecondary) },
                    title = "No transactions",
                    message = "Your transaction history will appear here"
                )
            } else {
                state.transactions.forEach { transaction ->
                    CardView {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Icon(
                                    imageVector = when (transaction.type) {
                                        "exercise_reward" -> Icons.Default.DirectionsWalk
                                        "transfer_in" -> Icons.Default.ArrowDownward
                                        "transfer_out" -> Icons.Default.ArrowUpward
                                        else -> Icons.Default.Circle
                                    },
                                    contentDescription = null,
                                    tint = AppColors.Accent
                                )
                                Column {
                                    Text(transaction.description ?: transaction.type, style = MaterialTheme.typography.bodyMedium, color = AppColors.TextPrimary)
                                    Text(transaction.timestamp ?: "", style = MaterialTheme.typography.labelSmall, color = AppColors.TextSecondary)
                                }
                            }
                            Text(
                                text = "${if (transaction.type.contains("out")) "-" else "+"}${String.format("%.2f", transaction.amount)} EXC",
                                color = if (transaction.type.contains("out")) AppColors.Error else AppColors.Success
                            )
                        }
                    }
                }
            }
        }
    }
}
