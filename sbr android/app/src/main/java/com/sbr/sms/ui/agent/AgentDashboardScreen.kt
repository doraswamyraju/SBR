package com.sbr.sms.ui.agent

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.sbr.sms.data.models.AgentDashboardStats
import com.sbr.sms.ui.agent.viewmodels.AgentDashboardUiState
import com.sbr.sms.ui.agent.viewmodels.AgentRequestsViewModel
import com.sbr.sms.ui.agent.viewmodels.RequestWithCustomerDetails
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun AgentDashboardScreen(
    viewModel: AgentRequestsViewModel,
    onNavigateToSection: (AgentSection) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Box(modifier = Modifier.fillMaxSize()) {
        when (val state = uiState) {
            is AgentDashboardUiState.Loading -> {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            }
            is AgentDashboardUiState.Error -> {
                Text(text = state.message, modifier = Modifier.align(Alignment.Center))
            }
            is AgentDashboardUiState.Success -> {
                DashboardContent(
                    stats = state.stats,
                    newRequests = state.assignedRequests,
                    viewModel = viewModel,
                    onNavigateToSection = onNavigateToSection
                )
            }
        }
    }
}

@Composable
private fun DashboardContent(
    stats: AgentDashboardStats,
    newRequests: List<RequestWithCustomerDetails>,
    viewModel: AgentRequestsViewModel,
    onNavigateToSection: (AgentSection) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item {
            Text("Welcome, ${stats.agentName}", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        }
        item {
            SummaryGrid(stats = stats, onNavigateToSection = onNavigateToSection)
        }
        item {
            Text("Quick Actions", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
        item {
            QuickActionsGrid(onNavigateToSection = onNavigateToSection)
        }
        if (newRequests.isNotEmpty()) {
            item {
                Text("New Assigned Requests", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
            }
            items(newRequests, key = { it.request.id }) { details ->
                RequestCard(details = details, viewModel = viewModel)
            }
        } else {
            item {
                Box(modifier = Modifier.fillMaxWidth().padding(vertical = 32.dp), contentAlignment = Alignment.Center) {
                    Text("You have no new requests assigned.")
                }
            }
        }
    }
}

@Composable
private fun SummaryGrid(stats: AgentDashboardStats, onNavigateToSection: (AgentSection) -> Unit) {
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        InfoCard(
            title = "Current Active Job",
            value = stats.activeRequestTitle,
            isPrimary = true,
            modifier = Modifier
                .fillMaxWidth()
                .clickable(enabled = stats.activeRequestTitle != "No active job") {
                    onNavigateToSection(AgentSection.ActiveService)
                }
        )
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            InfoCard(title = "New Requests", value = stats.newAssignedRequests.toString(), modifier = Modifier.weight(1f))
            InfoCard(title = "Completed Today", value = stats.completedToday.toString(), modifier = Modifier.weight(1f))
        }
        InfoCard(
            title = "Today's Earnings",
            value = "₹${"%,.0f".format(stats.todaysEarnings)}",
            isPrimary = true,
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun QuickActionsGrid(onNavigateToSection: (AgentSection) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        QuickActionCard(
            title = "Active Service",
            icon = Icons.Default.Construction,
            onClick = { onNavigateToSection(AgentSection.ActiveService) },
            modifier = Modifier.weight(1f)
        )
        QuickActionCard(
            title = "Payments",
            icon = Icons.Default.Payment,
            onClick = { onNavigateToSection(AgentSection.Payments) },
            modifier = Modifier.weight(1f)
        )
        QuickActionCard(
            title = "My Profile",
            icon = Icons.Default.Person,
            onClick = { onNavigateToSection(AgentSection.Profile) },
            modifier = Modifier.weight(1f)
        )
    }
}

@Composable
private fun RequestCard(details: RequestWithCustomerDetails, viewModel: AgentRequestsViewModel) {
    val context = LocalContext.current
    val dateFormatter = remember { SimpleDateFormat("dd MMM, HH:mm", Locale.getDefault()) }
    val request = details.request

    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        shape = MaterialTheme.shapes.large
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Service: ${request.serviceType}", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Text("Customer: ${details.customerName}", style = MaterialTheme.typography.bodyMedium)
            Text("Address: ${request.customerAddress}", style = MaterialTheme.typography.bodyMedium)
            Text("Received: ${request.createdAt?.let { dateFormatter.format(it) } ?: "N/A"}", style = MaterialTheme.typography.bodySmall)

            Spacer(modifier = Modifier.height(8.dp))

            Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.fillMaxWidth()) {
                OutlinedButton(
                    onClick = {
                        details.customerPhone?.let { phone ->
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
                            context.startActivity(intent)
                        }
                    },
                    enabled = !details.customerPhone.isNullOrBlank(),
                    modifier = Modifier.weight(1f)
                ) {
                    Icon(Icons.Default.Call, contentDescription = "Call", modifier = Modifier.size(ButtonDefaults.IconSize))
                    Spacer(Modifier.size(ButtonDefaults.IconSpacing))
                    Text("Call")
                }

                Button(
                    onClick = {
                        viewModel.acceptRequest(request.id)
                        Toast.makeText(context, "Request Accepted!", Toast.LENGTH_SHORT).show()
                    },
                    modifier = Modifier.weight(1f)
                ) {
                    Text("Accept")
                }
            }
        }
    }
}

@Composable
private fun InfoCard(title: String, value: String, modifier: Modifier = Modifier, isPrimary: Boolean = false) {
    val containerColor = if (isPrimary) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondaryContainer
    val contentColor = if (isPrimary) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSecondaryContainer

    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(text = title, style = MaterialTheme.typography.bodyMedium, color = contentColor)
            Spacer(modifier = Modifier.height(4.dp))
            Text(text = value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = contentColor)
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun QuickActionCard(title: String, icon: ImageVector, onClick: () -> Unit, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier.height(120.dp),
        onClick = onClick,
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Icon(
                imageVector = icon,
                contentDescription = title,
                modifier = Modifier.size(32.dp),
                tint = MaterialTheme.colorScheme.onPrimaryContainer
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.labelLarge,
                color = MaterialTheme.colorScheme.onPrimaryContainer
            )
        }
    }
}