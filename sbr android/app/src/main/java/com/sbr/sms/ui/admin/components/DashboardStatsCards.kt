package com.sbr.sms.ui.admin.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import com.sbr.sms.data.models.DashboardStats
import androidx.compose.ui.unit.dp


@Composable
fun DashboardStatsCards(stats: DashboardStats) {
    Row(
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        modifier = Modifier.fillMaxWidth()
    ) {
        StatCard(
            title = "Total Requests",
            value = stats.totalRequests.toString(),
            color = MaterialTheme.colorScheme.primaryContainer,
                    modifier = Modifier.weight(1f)
        )
        StatCard(
            title = "Active Agents",
            value = stats.activeAgents.toString(),
            color = MaterialTheme.colorScheme.secondaryContainer,
            modifier = Modifier.weight(1f)
        )
        StatCard(
            title = "Pending Payments",
            value = stats.pendingPayments.toString(),
            color = MaterialTheme.colorScheme.tertiaryContainer,
            modifier = Modifier.weight(1f)
        )
        StatCard(
            title = "Satisfaction",
            value = "${(stats.customerSatisfaction * 100).toInt()}%",
            color = MaterialTheme.colorScheme.primaryContainer,
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun StatCard(
    title: String,
    value: String,
    color: Color,
    modifier: Modifier = Modifier // Add modifier parameter
) {
    Card(
        colors = CardDefaults.cardColors(containerColor = color),
        modifier = modifier // Use passed modifier
            .height(100.dp)
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(title, style = MaterialTheme.typography.labelMedium)
            Text(value, style = MaterialTheme.typography.displaySmall)
        }
    }
}

