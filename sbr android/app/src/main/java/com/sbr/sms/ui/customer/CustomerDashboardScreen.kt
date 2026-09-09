package com.sbr.sms.ui.customer

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.animation.core.*
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.List
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.scale
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.data.models.CustomerDashboardStats
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.common.UiState
import com.sbr.sms.ui.common.components.StatusChip
import com.sbr.sms.ui.customer.viewmodels.CustomerDashboardUiState
import com.sbr.sms.ui.customer.viewmodels.CustomerDashboardViewModel
import com.sbr.sms.ui.theme.SBRBlue
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
    val customerProfile by viewModel.customerProfile.collectAsState()

    LaunchedEffect(submissionStatus) {
        when (val status = submissionStatus) {
            is UiState.Success -> {
                Toast.makeText(context, "Request submitted successfully!", Toast.LENGTH_SHORT).show()
                onShowDialogChange(false)
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
            customerProfile = customerProfile,
            isSubmitting = submissionStatus is UiState.Loading,
            onDismiss = { onShowDialogChange(false) },
            onSubmit = { serviceType, description, address, lat, lng ->
                viewModel.submitNewRequest(serviceType, description, address, lat, lng)
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
                    nextServiceDate = state.nextServiceDate,
                    activeTrackableJob = state.activeTrackableJob,
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
    nextServiceDate: Date?,
    activeTrackableJob: ServiceRequest?,
    onNavigateToSection: (CustomerSection) -> Unit,
    onNavigate: (String) -> Unit
) {
    val context = LocalContext.current

    fun openGoogleReview() {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://g.page/r/CbdJS-IzWTe2EBE/review"))
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Unable to open browser", Toast.LENGTH_SHORT).show()
        }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(20.dp)
    ) {
        item {
            Text(
                "Welcome, ${stats.customerName}",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground
            )
        }

        // Active Technician Live Tracking Banner (matching iOS layout)
        if (activeTrackableJob != null) {
            item {
                ActiveTechnicianBanner(
                    activeJob = activeTrackableJob,
                    onClick = {
                        onNavigate(AppRoutes.CustomerLiveTracking.createRoute(activeTrackableJob.id))
                    }
                )
            }
        }

        item {
            SummaryGrid(
                stats = stats,
                nextServiceDate = nextServiceDate,
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

        if (stats.recentActivities.isEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Text(
                        "No service requests booked yet.",
                        modifier = Modifier.padding(24.dp).fillMaxWidth(),
                        textAlign = TextAlign.Center,
                        color = Color.Gray
                    )
                }
            }
        } else {
            items(stats.recentActivities, key = { it.id }) { request ->
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    RecentActivityItem(
                        request = request,
                        onClick = {
                            onNavigate(AppRoutes.CustomerRequestDetail.createRoute(request.id))
                        }
                    )

                    // Google Maps Review Glow Button if requested
                    if ((request.status == "Completed" || request.status == "Paid") && request.requestReview == true) {
                        OutlinedButton(
                            onClick = { openGoogleReview() },
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp),
                            border = BorderStroke(1.5.dp, SBRBlue),
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = SBRBlue.copy(alpha = 0.06f),
                                contentColor = SBRBlue
                            )
                        ) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Leave Sri Balaji Renewables Review", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveTechnicianBanner(
    activeJob: ServiceRequest,
    onClick: () -> Unit
) {
    val infiniteTransition = rememberInfiniteTransition(label = "pulse")
    val scale by infiniteTransition.animateFloat(
        initialValue = 1f,
        targetValue = 1.35f,
        animationSpec = infiniteRepeatable(
            animation = tween(1000, easing = FastOutSlowInEasing),
            repeatMode = RepeatMode.Reverse
        ),
        label = "scale"
    )

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp)
    ) {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    Brush.horizontalGradient(
                        colors = listOf(
                            Color(0xFF1E40AF), // Deep royal blue
                            Color(0xFF3B82F6), // Vibrant blue
                            Color(0xFF4F46E5)  // Indigo
                        )
                    )
                )
                .padding(14.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Pulsing Green Live Dot
                Box(
                    modifier = Modifier.size(16.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Box(
                        modifier = Modifier
                            .size(14.dp)
                            .scale(scale)
                            .clip(CircleShape)
                            .background(Color(0xFF4ADE80).copy(alpha = 0.4f))
                    )
                    Box(
                        modifier = Modifier
                            .size(9.dp)
                            .clip(CircleShape)
                            .background(Color(0xFF22C55E))
                    )
                }

                Spacer(modifier = Modifier.width(10.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Technician Assigned • Live GPS Active",
                        color = Color.White,
                        fontWeight = FontWeight.Bold,
                        fontSize = 13.sp
                    )
                    Text(
                        text = "${activeJob.assignedAgentName ?: "Technician"} is assigned for ${activeJob.serviceType}",
                        color = Color.White.copy(alpha = 0.9f),
                        fontSize = 11.sp,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }

                Spacer(modifier = Modifier.width(8.dp))

                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = Color.White.copy(alpha = 0.22f),
                    contentColor = Color.White
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            imageVector = Icons.Default.Navigation,
                            contentDescription = null,
                            modifier = Modifier.size(14.dp),
                            tint = Color.White
                        )
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(
                            text = "Track Live",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = Color.White
                        )
                    }
                }
            }
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

    Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(14.dp)) {
            InfoCard(
                title = "Active Requests",
                value = stats.activeRequests.toString(),
                isPrimary = true,
                modifier = Modifier.weight(1f).clickable { onNavigateToSection(CustomerSection.Requests) }
            )
            InfoCard(
                title = "Pending Payments",
                value = "₹${"%,.0f".format(stats.pendingPayments)}",
                isPrimary = true,
                modifier = Modifier.weight(1f).clickable { onNavigateToSection(CustomerSection.Payments) }
            )
        }
        InfoCard(
            title = "Next Scheduled Service",
            value = nextServiceDate?.let { dateFormatter.format(it) } ?: "Not Scheduled",
            isPrimary = false
        )
    }
}

@Composable
private fun QuickActionsGrid(onNavigateToSection: (CustomerSection) -> Unit) {
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        QuickActionCard(
            title = "My Requests",
            icon = Icons.AutoMirrored.Filled.List,
            onClick = { onNavigateToSection(CustomerSection.Requests) },
            modifier = Modifier.weight(1f)
        )
        QuickActionCard(
            title = "Make Payment",
            icon = Icons.Default.CreditCard,
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
    isPrimary: Boolean = true
) {
    val containerColor = if (isPrimary) SBRBlue else MaterialTheme.colorScheme.surfaceVariant
    val contentColor = if (isPrimary) Color.White else MaterialTheme.colorScheme.onSurfaceVariant

    Card(
        modifier = modifier.fillMaxWidth().height(105.dp),
        elevation = CardDefaults.cardElevation(4.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = containerColor)
    ) {
        Column(
            modifier = Modifier.fillMaxSize().padding(14.dp),
            verticalArrangement = Arrangement.SpaceBetween
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = contentColor
            )
            Text(
                text = value,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black,
                color = contentColor,
                modifier = Modifier.align(Alignment.End)
            )
        }
    }
}

@Composable
private fun QuickActionCard(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .height(115.dp)
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(10.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Box(
                modifier = Modifier
                    .size(44.dp)
                    .clip(CircleShape)
                    .background(SBRBlue.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = title,
                    modifier = Modifier.size(24.dp),
                    tint = SBRBlue
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = title,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.labelMedium,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
private fun RecentActivityItem(request: ServiceRequest, onClick: () -> Unit) {
    val formattedDate = remember(request.createdAt) {
        request.createdAt?.let { timestamp ->
            SimpleDateFormat("dd MMM, HH:mm", Locale.getDefault()).format(timestamp)
        } ?: "Recent"
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(2.dp),
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.4f))
    ) {
        Row(
            verticalAlignment = Alignment.CenterVertically,
            modifier = Modifier.padding(horizontal = 14.dp, vertical = 12.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(42.dp)
                    .clip(RoundedCornerShape(10.dp))
                    .background(SBRBlue.copy(alpha = 0.1f)),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Handyman,
                    contentDescription = null,
                    tint = SBRBlue,
                    modifier = Modifier.size(22.dp)
                )
            }

            Spacer(Modifier.width(12.dp))

            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = request.serviceType,
                    fontWeight = FontWeight.Bold,
                    style = MaterialTheme.typography.bodyMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(2.dp))
                Text(
                    text = request.customerAddress.takeIf { it.isNotBlank() } ?: formattedDate,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
            }

            Spacer(Modifier.width(8.dp))

            Column(horizontalAlignment = Alignment.End) {
                StatusChip(status = request.status)
                Spacer(Modifier.height(2.dp))
                Text(
                    text = formattedDate,
                    style = MaterialTheme.typography.labelSmall,
                    color = Color.Gray
                )
            }
        }
    }
}