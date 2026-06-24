package com.sbr.sms.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.SideEffect
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.core.view.WindowCompat

// Custom Colors from SBR Logo
val SBRBlue = Color(0xFF0D1B4F)
val SBRGreen = Color(0xFF34D399)
val SBRText = Color(0xFF1F2937)
val SBRBackground = Color(0xFFF9FAFB)
val SBRSurface = Color.White
val SBROnPrimary = Color.White

private val LightColors = lightColorScheme(
    primary = SBRBlue,
    onPrimary = SBROnPrimary,
    secondary = SBRGreen,
    onSecondary = Color.Black,
    background = SBRBackground,
    onBackground = SBRText,
    surface = SBRSurface,
    onSurface = SBRText,
    // You can define other colors like error, tertiary, etc. as needed
    error = Color(0xFFB00020)
)

// A sample dark theme, can be refined later
private val DarkColors = darkColorScheme(
    primary = Color(0xFF5C6BC0), // Lighter Blue for Dark Mode
    onPrimary = Color.White,
    secondary = SBRGreen,
    onSecondary = Color.Black,
    background = Color(0xFF111827),
    onBackground = Color(0xFFE5E7EB),
    surface = Color(0xFF1F2937),
    onSurface = Color(0xFFE5E7EB),
    error = Color(0xFFCF6679)
)

@Composable
fun SBRTheme(
    useDarkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colors = if (!useDarkTheme) LightColors else DarkColors
    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colors.primary.toArgb()
            WindowCompat.getInsetsController(window, view).isAppearanceLightStatusBars = useDarkTheme
        }
    }

    MaterialTheme(
        colorScheme = colors,
        typography = Typography, // Corrected: No parentheses
        shapes = Shapes,       // Corrected: No parentheses
        content = content
    )
}
