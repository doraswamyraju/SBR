package com.sbr.sms.ui.common.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Timer
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.sbr.sms.data.models.ServiceRequest
import kotlinx.coroutines.delay

/**
 * A visually distinct, reusable composable that displays a running timer
 * or the total duration for a ServiceRequest.
 *
 * It remains hidden for requests that have not yet been started.
 *
 * @param request The ServiceRequest containing the timing information.
 * @param modifier Optional modifier for the Card.
 */
@Composable
fun JobTimer(
    request: ServiceRequest,
    modifier: Modifier = Modifier
) {
    // This state holds the formatted "HH:mm:ss" string.
    var elapsed by remember { mutableStateOf("") }

    // This state determines the label below the timer.
    var timerLabel by remember { mutableStateOf("Time Elapsed") }

    // This LaunchedEffect is the core of the timer's logic.
    // It re-runs whenever the key inputs (status, timestamps) change.
    LaunchedEffect(request.status, request.acceptedAt, request.completedAt) {
        val startTime = request.acceptedAt?.time
        val endTime = request.completedAt?.time

        // Case 1: The job is actively running.
        if (startTime != null && endTime == null && (request.status == "Accepted" || request.status == "In Progress")) {
            timerLabel = "Time Elapsed"
            // This loop runs every second to update the elapsed time.
            while (true) {
                val now = System.currentTimeMillis()
                val seconds = (now - startTime) / 1000
                val minutes = seconds / 60
                val hours = minutes / 60
                elapsed = "%02d:%02d:%02d".format(hours, minutes % 60, seconds % 60)
                delay(1000) // Wait for one second before the next update.
            }
        }
        // Case 2: The job is finished.
        else if (startTime != null && endTime != null) {
            timerLabel = "Total Job Duration"
            val seconds = (endTime - startTime) / 1000
            val minutes = seconds / 60
            val hours = minutes / 60
            elapsed = "%02d:%02d:%02d".format(hours, minutes % 60, seconds % 60)
        }
    }

    // The timer should only be visible if the request has been accepted or is further along.
    // It's hidden for "Pending" or "Assigned" statuses.
    if (request.status != "Pending" && request.status != "Assigned") {
        Card(
            modifier = modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(4.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 20.dp, vertical = 16.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Icon(
                    imageVector = Icons.Default.Timer,
                    contentDescription = "Timer",
                    modifier = Modifier.size(40.dp),
                    tint = MaterialTheme.colorScheme.primary
                )
                Column {
                    Text(
                        text = elapsed.ifEmpty { "00:00:00" },
                        style = MaterialTheme.typography.headlineMedium,
                        fontWeight = FontWeight.Bold,
                        fontFamily = FontFamily.Monospace // Ensures numbers don't shift the layout
                    )
                    Text(
                        text = timerLabel,
                        style = MaterialTheme.typography.bodyMedium,
                        color = Color.Gray
                    )
                }
            }
        }
    }
}