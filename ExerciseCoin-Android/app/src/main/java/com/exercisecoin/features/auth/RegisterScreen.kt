package com.exercisecoin.features.auth

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RegisterScreen(
    onNavigateToLogin: () -> Unit,
    onRegisterSuccess: () -> Unit,
    viewModel: AuthViewModel = hiltViewModel()
) {
    val authState by viewModel.authState.collectAsState()

    var username by remember { mutableStateOf("") }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var localError by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(authState.isAuthenticated) {
        if (authState.isAuthenticated) {
            onRegisterSuccess()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = onNavigateToLogin) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back",
                            tint = AppColors.Accent
                        )
                    }
                },
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
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            // Title
            Text(
                text = "Create Account",
                style = MaterialTheme.typography.displaySmall,
                color = AppColors.TextPrimary
            )

            Text(
                text = "Start your fitness journey today",
                style = MaterialTheme.typography.bodyMedium,
                color = AppColors.TextSecondary
            )

            Spacer(modifier = Modifier.height(32.dp))

            // Error Banner
            (authState.error ?: localError)?.let { error ->
                ErrorBanner(
                    message = error,
                    onDismiss = {
                        viewModel.clearError()
                        localError = null
                    }
                )
                Spacer(modifier = Modifier.height(16.dp))
            }

            // Username Field
            StyledTextField(
                value = username,
                onValueChange = { username = it },
                placeholder = "Username"
            )

            Spacer(modifier = Modifier.height(16.dp))

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
                placeholder = "Password (min 8 characters)",
                isPassword = true
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Confirm Password Field
            StyledTextField(
                value = confirmPassword,
                onValueChange = { confirmPassword = it },
                placeholder = "Confirm Password",
                isPassword = true
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Register Button
            PrimaryButton(
                text = "Create Account",
                onClick = {
                    localError = null
                    when {
                        username.length < 3 -> localError = "Username must be at least 3 characters"
                        !email.contains("@") -> localError = "Please enter a valid email"
                        password.length < 8 -> localError = "Password must be at least 8 characters"
                        password != confirmPassword -> localError = "Passwords do not match"
                        else -> viewModel.register(username, email, password)
                    }
                },
                isLoading = authState.isLoading,
                enabled = username.isNotBlank() && email.isNotBlank() &&
                        password.isNotBlank() && confirmPassword.isNotBlank()
            )

            Spacer(modifier = Modifier.height(24.dp))

            // Login Link
            Row(
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Already have an account?",
                    style = MaterialTheme.typography.bodyMedium,
                    color = AppColors.TextSecondary
                )
                TextButton(onClick = onNavigateToLogin) {
                    Text(
                        text = "Log in",
                        color = AppColors.Accent
                    )
                }
            }
        }
    }
}
