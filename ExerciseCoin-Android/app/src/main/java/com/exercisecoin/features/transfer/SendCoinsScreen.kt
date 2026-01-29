package com.exercisecoin.features.transfer

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.exercisecoin.ui.components.*
import com.exercisecoin.ui.theme.AppColors

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SendCoinsScreen(
    onNavigateBack: () -> Unit,
    viewModel: TransferViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()

    var recipient by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var message by remember { mutableStateOf("") }

    LaunchedEffect(state.success) {
        if (state.success) {
            onNavigateBack()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Send Coins") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, null, tint = AppColors.Accent)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = AppColors.Background)
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            state.error?.let { error ->
                ErrorBanner(message = error, onDismiss = { viewModel.clearError() })
            }

            StyledTextField(
                value = recipient,
                onValueChange = { recipient = it },
                placeholder = "Recipient (username or address)"
            )

            StyledTextField(
                value = amount,
                onValueChange = { amount = it },
                placeholder = "Amount (EXC)",
                keyboardType = KeyboardType.Decimal
            )

            StyledTextField(
                value = message,
                onValueChange = { message = it },
                placeholder = "Message (optional)"
            )

            Spacer(Modifier.weight(1f))

            PrimaryButton(
                text = "Send Coins",
                onClick = {
                    amount.toDoubleOrNull()?.let {
                        viewModel.sendCoins(recipient, it, message.ifBlank { null })
                    }
                },
                isLoading = state.isLoading,
                enabled = recipient.isNotBlank() && amount.toDoubleOrNull() != null
            )
        }
    }
}
