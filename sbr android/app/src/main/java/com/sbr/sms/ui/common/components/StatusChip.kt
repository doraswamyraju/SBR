package com.sbr.sms.ui.common.components

import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@Composable
fun StatusChip(status: String) {
    val (backgroundColor, textColor) = when (status) {
        "In Progress" -> MaterialTheme.colorScheme.primaryContainer to MaterialTheme.colorScheme.onPrimaryContainer
        "Completed" -> Color(0xFFCEEAD6) to Color(0xFF00210B) // Light Green
        "Paid" -> Color(0xFFD1E3FF) to Color(0xFF001D36) // Light Blue
        "Assigned" -> Color(0xFFFFE0B2) to Color(0xFF2E1500) // Light Orange
        "Pending" -> Color(0xFFE0E0E0) to Color(0xFF1C1B1F) // Light Gray
        else -> MaterialTheme.colorScheme.secondaryContainer to MaterialTheme.colorScheme.onSecondaryContainer
    }

    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(16.dp),
        tonalElevation = 1.dp
    ) {
        Text(
            text = status,
            color = textColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}