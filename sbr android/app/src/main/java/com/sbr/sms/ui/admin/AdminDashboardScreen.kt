package com.sbr.sms.ui.admin

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.DashboardStats
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.models.User
import com.sbr.sms.ui.admin.viewmodels.AdminDashboardUiState
import com.sbr.sms.ui.admin.viewmodels.AdminDashboardViewModel

@Composable
fun AdminDashboardScreen(
    navController: NavHostController,
    viewModel: AdminDashboardViewModel = hiltViewModel(),
    onCardClick: (AdminSection) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAgentDialog by remember { mutableStateOf<ServiceRequest?>(null) }

    // FIXED: Get the list of agents directly from the Success state.
    // It will be an empty list if the state is not Success.
    val availableAgents = (uiState as? AdminDashboardUiState.Success)?.availableAgents ?: emptyList()

    // Show the dialog when a request is selected
    showAgentDialog?.let { request ->
        AgentSelectionDialog(
            agents = availableAgents,
            onDismiss = { showAgentDialog = null },
            onAgentSelected = { agentId ->
                viewModel.assignAgentToRequest(request.id, agentId)
                showAgentDialog = null
            }
        )
    }

    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        when (val state = uiState) {
            is AdminDashboardUiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is AdminDashboardUiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = "Error: ${state.message}",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
            is AdminDashboardUiState.Success -> {
                DashboardContent(
                    stats = state.stats,
                    onCardClick = onCardClick,
                    onChooseAgentClick = { request -> showAgentDialog = request }
                )
            }
        }
    }
}

// ... (Rest of the file including DashboardContent, SummaryCardGrid, etc. remains unchanged) ...

@Composable
fun DashboardContent(
    stats: DashboardStats,
    onCardClick: (AdminSection) -> Unit,
    onChooseAgentClick: (ServiceRequest) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            Text(
                text = "Admin Dashboard",
                style = MaterialTheme.typography.headlineSmall,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        item {
            SummaryCardGrid(stats = stats, onCardClick = onCardClick)
        }

        item {
            Text(
                text = "Recent Activities",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        if (stats.recentPendingRequests.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                ) {
                    Text(
                        text = "No pending requests found.",
                        modifier = Modifier.padding(16.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }
        } else {
            items(stats.recentPendingRequests) { request ->
                RecentActivitiesCard(
                    request = request,
                    onChooseAgentClick = onChooseAgentClick
                )
            }
        }
    }
}

@Composable
fun SummaryCardGrid(stats: DashboardStats, onCardClick: (AdminSection) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SummaryCardItem(
                title = "Total Requests",
                value = stats.totalRequests.toString(),
                onClick = { onCardClick(AdminSection.Requests) },
                modifier = Modifier.weight(1f)
            )
            SummaryCardItem(
                title = "Active Agents",
                value = stats.activeAgents.toString(),
                onClick = { onCardClick(AdminSection.Agents) },
                modifier = Modifier.weight(1f)
            )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            SummaryCardItem(
                title = "Payments & Revenue",
                value = "₹${stats.pendingPayments}",
                onClick = { onCardClick(AdminSection.Payments) },
                modifier = Modifier.weight(1f)
            )
            SummaryCardItem(
                title = "Satisfaction",
                value = "${stats.customerSatisfaction}%",
                onClick = { onCardClick(AdminSection.Reports) },
                modifier = Modifier.weight(1f)
            )
        }
    }
}

@Composable
fun SummaryCardItem(
    title: String,
    value: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.aspectRatio(1.5f),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary),
        shape = RoundedCornerShape(16.dp),
        elevation = CardDefaults.cardElevation(8.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .clickable(onClick = onClick)
                .padding(16.dp),
            horizontalAlignment = Alignment.Start,
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimary
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineMedium,
                color = MaterialTheme.colorScheme.onPrimary,
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}

@Composable
fun RecentActivitiesCard(
    request: ServiceRequest,
    onChooseAgentClick: (ServiceRequest) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = "Request ID: ${request.id}",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
            InfoRow("Service:", request.serviceType)
            InfoRow("Status:", request.status, statusColor(request.status))

            Spacer(Modifier.height(4.dp))
            Button(
                onClick = { onChooseAgentClick(request) },
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                shape = RoundedCornerShape(8.dp)
            ) {
                Text(text = "Choose Agent", color = MaterialTheme.colorScheme.onPrimary)
            }
        }
    }
}

@Composable
fun InfoRow(label: String, value: String, valueColor: Color = Color.Unspecified) {
    Row {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.width(100.dp)
        )
        Text(
            text = value,
            style = MaterialTheme.typography.bodyMedium,
            color = if (valueColor != Color.Unspecified) valueColor else MaterialTheme.colorScheme.onSurface
        )
    }
}

@Composable
fun statusColor(status: String): Color {
    return when (status) {
        "Pending" -> Color(0xFFFFA726) // Orange
        "Assigned" -> Color(0xFF42A5F5) // Blue
        "Completed" -> Color(0xFF66BB6A) // Green
        else -> MaterialTheme.colorScheme.onSurface
    }
}

@Composable
fun AgentSelectionDialog(
    agents: List<User>,
    onDismiss: () -> Unit,
    onAgentSelected: (String) -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            shape = RoundedCornerShape(16.dp),
        ) {
            LazyColumn(modifier = Modifier.padding(16.dp)) {
                item {
                    Text("Select an Agent", style = MaterialTheme.typography.titleLarge)
                    Spacer(modifier = Modifier.height(16.dp))
                }
                if (agents.isEmpty()) {
                    item {
                        Text("No agents available.")
                    }
                } else {
                    items(agents) { agent ->
                        Text(
                            text = agent.name,
                            modifier = Modifier
                                .fillMaxWidth()
                                .clickable { onAgentSelected(agent.id) }
                                .padding(vertical = 12.dp)
                        )
                    }
                }
            }
        }
    }
}