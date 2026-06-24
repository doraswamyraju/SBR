package com.sbr.sms.ui.customer

import android.widget.Toast
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
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
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.data.models.CustomerDashboardStats
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.common.UiState
import com.sbr.sms.ui.common.components.StatusChip
import com.sbr.sms.ui.customer.viewmodels.CustomerDashboardUiState
import com.sbr.sms.ui.customer.viewmodels.CustomerDashboardViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun CustomerDashboardScreen(
    showDialog: Boolean,
    onShowDialogChange: (Boolean) -> Unit,
    onNavigateToSection: (CustomerSection) -> Unit,
    onNavigate: (String) -> Unit,
    viewModel: CustomerDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val submissionStatus by viewModel.submissionStatus.collectAsState()
    val context = LocalContext.current

    LaunchedEffect(submissionStatus) {
        when (val status = submissionStatus) {
            is UiState.Success -> {
                Toast.makeText(context, "Request submitted successfully!", Toast.LENGTH_SHORT).show()
                viewModel.resetSubmissionStatus()
            }
            is UiState.Error -> {
                Toast.makeText(context, "Error: ${status.message}", Toast.LENGTH_LONG).show()
                viewModel.resetSubmissionStatus()
            }
            else -> { /* Do nothing for Idle or Loading */ }
        }
    }

    if (showDialog) {
        NewRequestDialog(
            onDismiss = { onShowDialogChange(false) },
            onSubmit = { serviceType, description, address ->
                viewModel.submitNewRequest(serviceType, description, address)
                onShowDialogChange(false)
            }
        )
    }

    Box(modifier = Modifier.fillMaxSize()) {
        when (val state = uiState) {
            is CustomerDashboardUiState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            is CustomerDashboardUiState.Error -> Text(text = state.message, modifier = Modifier.align(Alignment.Center))
            is CustomerDashboardUiState.Success -> {
                DashboardContent(
                    stats = state.stats,
                    // Pass the new date down to the content composable
                    nextServiceDate = state.nextServiceDate,
                    onNavigateToSection = onNavigateToSection,
                    onNavigate = onNavigate
                )
            }
        }
    }
}

@Composable
private fun DashboardContent(
    stats: CustomerDashboardStats,
    // Receive the next service date
    nextServiceDate: Date?,
    onNavigateToSection: (CustomerSection) -> Unit,
    onNavigate: (String) -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(24.dp)
    ) {
        item {
            Text(
                "Welcome, ${stats.customerName}",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold
            )
        }
        item {
            SummaryGrid(
                stats = stats,
                nextServiceDate = nextServiceDate, // Pass date to the grid
                onNavigateToSection = onNavigateToSection
            )
        }
        item {
            Text("Quick Actions", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
        item {
            QuickActionsGrid(onNavigateToSection = onNavigateToSection)
        }
        item {
            Text("Recent Activity", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        }
        items(stats.recentActivities, key = { it.id }) { request ->
            RecentActivityItem(request = request, onClick = {
                onNavigate(AppRoutes.CustomerRequestDetail.createRoute(request.id))
            })
        }
    }
}

@Composable
private fun SummaryGrid(
    stats: CustomerDashboardStats,
    nextServiceDate: Date?,
    onNavigateToSection: (CustomerSection) -> Unit
) {
    val dateFormatter = remember { SimpleDateFormat("dd MMM, yyyy", Locale.getDefault()) }

    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            InfoCard(
                title = "Active Requests",
                value = stats.activeRequests.toString(),
                modifier = Modifier.weight(1f).clickable { onNavigateToSection(CustomerSection.Requests) }
            )
            InfoCard(
                title = "Pending Payments",
                value = "₹${"%,.0f".format(stats.pendingPayments)}",
                modifier = Modifier.weight(1f).clickable { onNavigateToSection(CustomerSection.Payments) }
            )
        }
        // NEW: Add a card to display the next scheduled service date.
        InfoCard(
            title = "Next Scheduled Service",
            value = nextServiceDate?.let { dateFormatter.format(it) } ?: "Not Scheduled",
            isPrimary = false // Use a different color to distinguish it
        )
    }
}

@Composable
private fun QuickActionsGrid(onNavigateToSection: (CustomerSection) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        QuickActionCard(
            title = "My Requests",
            icon = Icons.AutoMirrored.Filled.List,
            onClick = { onNavigateToSection(CustomerSection.Requests) },
            modifier = Modifier.weight(1f)
        )
        QuickActionCard(
            title = "Make Payment",
            icon = Icons.Default.Payment,
            onClick = { onNavigateToSection(CustomerSection.Payments) },
            modifier = Modifier.weight(1f)
        )
        QuickActionCard(
            title = "Contact Support",
            icon = Icons.Default.SupportAgent,
            onClick = { onNavigateToSection(CustomerSection.Support) },
            modifier = Modifier.weight(1f)
        )
    }
}


@Composable
private fun InfoCard(
    title: String,
    value: String,
    modifier: Modifier = Modifier,
    isPrimary: Boolean = true // Added a flag to control color
) {
    val containerColor = if (isPrimary) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.secondaryContainer
    val contentColor = if (isPrimary) MaterialTheme.colorScheme.onPrimary else MaterialTheme.colorScheme.onSecondaryContainer

    Card(
        modifier = modifier.fillMaxWidth(), // make all cards fill width for consistency
        elevation = CardDefaults.cardElevation(8.dp),
        shape = MaterialTheme.shapes.large,
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                color = contentColor
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = contentColor
            )
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
            modifier = Modifier
                .fillMaxSize()
                .padding(12.dp),
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

@Composable
private fun RecentActivityItem(request: ServiceRequest, onClick: () -> Unit) {
    val formattedDate = remember(request.createdAt) {
        request.createdAt?.let { timestamp ->
            SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault()).format(timestamp)
        } ?: "Date not available"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 12.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = request.serviceType,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyLarge
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = formattedDate,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            StatusChip(status = request.status)
        }
    }
}