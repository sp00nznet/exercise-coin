package com.exercisecoin.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Design tokens from shared/design-tokens.json
object AppColors {
    val Primary = Color(0xFF1A1A2E)
    val Secondary = Color(0xFF16213E)
    val Accent = Color(0xFFE94560)
    val Background = Color(0xFF0F0F23)
    val Surface = Color(0xFF1A1A2E)
    val SurfaceVariant = Color(0xFF252547)

    val TextPrimary = Color.White
    val TextSecondary = Color(0xFFA0A0B0)
    val TextDisabled = Color(0xFF606070)

    val Success = Color(0xFF4ADE80)
    val Warning = Color(0xFFFBBF24)
    val Error = Color(0xFFEF4444)
    val Info = Color(0xFF60A5FA)

    val Coin = Color(0xFFFFD700)

    object Rarity {
        val Common = Color(0xFF9CA3AF)
        val Rare = Color(0xFF3B82F6)
        val Epic = Color(0xFFA855F7)
        val Legendary = Color(0xFFF59E0B)
    }
}

private val DarkColorScheme = darkColorScheme(
    primary = AppColors.Accent,
    secondary = AppColors.Secondary,
    tertiary = AppColors.Info,
    background = AppColors.Background,
    surface = AppColors.Surface,
    surfaceVariant = AppColors.SurfaceVariant,
    onPrimary = Color.White,
    onSecondary = Color.White,
    onTertiary = Color.White,
    onBackground = AppColors.TextPrimary,
    onSurface = AppColors.TextPrimary,
    onSurfaceVariant = AppColors.TextSecondary,
    error = AppColors.Error,
    onError = Color.White
)

@Composable
fun ExerciseCoinTheme(
    darkTheme: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = DarkColorScheme

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = false
        }
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = Typography,
        content = content
    )
}
