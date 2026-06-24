package com.sbr.sms.ui.admin.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Task
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.sbr.sms.data.models.ServiceRequest

@Composable
fun RecentActivities(requests: List<ServiceRequest>) {
    Column {
        if (requests.isNotEmpty()) {
            Text(
                text = "Recent Activities",
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            requests.forEach { request ->
                ActivityItem(request = request)
            }
        }
    }
}

@Composable
fun ActivityItem(request: ServiceRequest) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        shape = MaterialTheme.shapes.medium,
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Filled.Task,
                contentDescription = "Service Request Icon",
                modifier = Modifier.padding(end = 12.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Column {
                Text(
                    text = "New Request: ${request.serviceType}",
                    style = MaterialTheme.typography.titleSmall,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "ID: ${request.id}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "Status: ${request.status}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}
