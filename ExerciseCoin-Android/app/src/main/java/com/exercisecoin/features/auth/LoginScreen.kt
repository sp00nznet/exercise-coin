package com.exercisecoin.features.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.DirectionsWalk
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.exercisecoin.ui.components.ErrorBanner
import com.exercisecoin.ui.components.PrimaryButton
import com.exercisecoin.ui.components.StyledTextField
import com.exercisecoin.ui.theme.AppColors

@Composable
fun LoginScreen(
    onNavigateToRegister: () -> Unit,
    onLoginSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val authState by viewModel.authState.collectAsState()

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    LaunchedEffect(authState.isAuthenticated) {
        if (authState.isAuthenticated) {
            onLoginSuccess()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Logo
        Icon(
            imageVector = Icons.Default.DirectionsWalk,
            contentDescription = null,
            modifier = Modifier.size(80.dp),
            tint = AppColors.Accent
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Title
        Text(
            text = "ExerciseCoin",
            style = MaterialTheme.typography.displaySmall,
            color = AppColors.TextPrimary
        )

        Text(
            text = "Earn crypto while you exercise",
            style = MaterialTheme.typography.bodyMedium,
            color = AppColors.TextSecondary
        )

        Spacer(modifier = Modifier.height(48.dp))

        // Error Banner
        authState.error?.let { error ->
            ErrorBanner(
                message = error,
                onDismiss = { viewModel.clearError() }
            )
            Spacer(modifier = Modifier.height(16.dp))
        }

        // Email Field
        StyledTextField(
            value = email,
            onValueChange = { email = it },
            placeholder = "Email",
            keyboardType = KeyboardType.Email
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Password Field
        StyledTextField(
            value = password,
            onValueChange = { password = it },
            placeholder = "Password",
            isPassword = true
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Login Button
        PrimaryButton(
            text = "Login",
            onClick = { viewModel.login(email, password) },
            isLoading = authState.isLoading,
            enabled = email.isNotBlank() && password.isNotBlank()
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Register Link
        Row(
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Don't have an account?",
                style = MaterialTheme.typography.bodyMedium,
                color = AppColors.TextSecondary
            )
            TextButton(onClick = onNavigateToRegister) {
                Text(
                    text = "Sign up",
                    color = AppColors.Accent
                )
            }
        }
    }
}
