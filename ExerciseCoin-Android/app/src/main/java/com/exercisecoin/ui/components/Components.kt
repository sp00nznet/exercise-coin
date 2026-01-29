package com.exercisecoin.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Circle
import androidx.compose.material.icons.filled.Visibility
import androidx.compose.material.icons.filled.VisibilityOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import com.exercisecoin.ui.theme.AppColors

@Composable
fun PrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    isLoading: Boolean = false,
    enabled: Boolean = true
) {
    Button(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp),
        enabled = enabled && !isLoading,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = AppColors.Accent,
            disabledContainerColor = AppColors.SurfaceVariant
        )
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                modifier = Modifier.size(24.dp),
                color = Color.White,
                strokeWidth = 2.dp
            )
        } else {
            Text(
                text = text,
                style = MaterialTheme.typography.labelLarge
            )
        }
    }
}

@Composable
fun SecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier
            .fillMaxWidth()
            .height(56.dp),
        enabled = enabled,
        shape = RoundedCornerShape(12.dp),
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = AppColors.Accent
        ),
        border = ButtonDefaults.outlinedButtonBorder.copy(
            brush = androidx.compose.ui.graphics.SolidColor(AppColors.Accent)
        )
    ) {
        Text(
            text = text,
            style = MaterialTheme.typography.labelLarge
        )
    }
}

@Composable
fun StyledTextField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    isPassword: Boolean = false,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    var passwordVisible by remember { mutableStateOf(false) }

    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        modifier = modifier.fillMaxWidth(),
        placeholder = {
            Text(
                text = placeholder,
                color = AppColors.TextDisabled
            )
        },
        shape = RoundedCornerShape(12.dp),
        colors = OutlinedTextFieldDefaults.colors(
            focusedContainerColor = AppColors.SurfaceVariant,
            unfocusedContainerColor = AppColors.SurfaceVariant,
            focusedBorderColor = AppColors.Accent,
            unfocusedBorderColor = Color.Transparent,
            focusedTextColor = AppColors.TextPrimary,
            unfocusedTextColor = AppColors.TextPrimary
        ),
        visualTransformation = if (isPassword && !passwordVisible) {
            PasswordVisualTransformation()
        } else {
            VisualTransformation.None
        },
        keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
        trailingIcon = if (isPassword) {
            {
                IconButton(onClick = { passwordVisible = !passwordVisible }) {
                    Icon(
                        imageVector = if (passwordVisible) Icons.Filled.Visibility else Icons.Filled.VisibilityOff,
                        contentDescription = if (passwordVisible) "Hide password" else "Show password",
                        tint = AppColors.TextSecondary
                    )
                }
            }
        } else null,
        singleLine = true
    )
}

@Composable
fun CardView(
    modifier: Modifier = Modifier,
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = AppColors.Surface
        )
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            content = content
        )
    }
}

@Composable
fun StatCard(
    title: String,
    value: String,
    icon: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    iconColor: Color = AppColors.Accent
) {
    CardView(modifier = modifier) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(40.dp)
                    .background(
                        color = iconColor.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(8.dp)
                    ),
                contentAlignment = Alignment.Center
            ) {
                icon()
            }
            Column {
                Text(
                    text = title,
                    style = MaterialTheme.typography.labelSmall,
                    color = AppColors.TextSecondary
                )
                Text(
                    text = value,
                    style = MaterialTheme.typography.headlineSmall,
                    color = AppColors.TextPrimary
                )
            }
        }
    }
}

@Composable
fun CoinDisplay(
    amount: Double,
    modifier: Modifier = Modifier,
    size: CoinDisplaySize = CoinDisplaySize.Medium
) {
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        Icon(
            imageVector = Icons.Default.Circle,
            contentDescription = null,
            modifier = Modifier.size(
                when (size) {
                    CoinDisplaySize.Small -> 12.dp
                    CoinDisplaySize.Medium -> 16.dp
                    CoinDisplaySize.Large -> 24.dp
                }
            ),
            tint = AppColors.Coin
        )
        Text(
            text = String.format("%.2f", amount),
            style = when (size) {
                CoinDisplaySize.Small -> MaterialTheme.typography.bodySmall
                CoinDisplaySize.Medium -> MaterialTheme.typography.bodyLarge
                CoinDisplaySize.Large -> MaterialTheme.typography.headlineMedium
            },
            color = AppColors.TextPrimary
        )
        Text(
            text = "EXC",
            style = MaterialTheme.typography.labelSmall,
            color = AppColors.TextSecondary
        )
    }
}

enum class CoinDisplaySize {
    Small, Medium, Large
}

@Composable
fun ErrorBanner(
    message: String,
    onDismiss: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        shape = RoundedCornerShape(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = AppColors.Error.copy(alpha = 0.2f)
        )
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            Text(
                text = message,
                modifier = Modifier.weight(1f),
                style = MaterialTheme.typography.bodyMedium,
                color = AppColors.TextPrimary
            )
            TextButton(onClick = onDismiss) {
                Text(
                    text = "Dismiss",
                    color = AppColors.Error
                )
            }
        }
    }
}

@Composable
fun EmptyStateView(
    icon: @Composable () -> Unit,
    title: String,
    message: String,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxWidth()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        icon()
        Text(
            text = title,
            style = MaterialTheme.typography.headlineSmall,
            color = AppColors.TextPrimary
        )
        Text(
            text = message,
            style = MaterialTheme.typography.bodyMedium,
            color = AppColors.TextSecondary
        )
    }
}

@Composable
fun LoadingOverlay() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color.Black.copy(alpha = 0.5f)),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            color = AppColors.Accent
        )
    }
}
