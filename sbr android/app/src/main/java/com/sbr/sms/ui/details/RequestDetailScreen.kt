package com.sbr.sms.ui.details

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.SubcomposeAsyncImage
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.models.User
import com.sbr.sms.data.models.UserRole
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.common.components.JobTimer
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RequestDetailScreen(
    requestId: String,
    navController: NavHostController,
    viewModel: RequestDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val availableAgents by viewModel.availableAgents.collectAsState()

    var imageUrlToShow by remember { mutableStateOf<String?>(null) }
    var showAssignDialog by remember { mutableStateOf(false) }

    if (imageUrlToShow != null) {
        ImagePreviewDialog(
            imageUrl = imageUrlToShow!!,
            onDismiss = { imageUrlToShow = null }
        )
    }

    if (showAssignDialog) {
        AlertDialog(
            onDismissRequest = { showAssignDialog = false },
            title = { Text("Assign / Reassign Technician") },
            text = {
                if (availableAgents.isEmpty()) {
                    Text("No technicians registered in the system.")
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth().heightIn(max = 350.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        items(availableAgents, key = { it.id }) { tech ->
                            val isCurrent = tech.id == (uiState as? RequestDetailUiState.Success)?.request?.assignedAgentId
                            Card(
                                modifier = Modifier.fillMaxWidth().clickable {
                                    viewModel.reassignTechnician(tech.id) {
                                        showAssignDialog = false
                                    }
                                },
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isCurrent) {
                                        MaterialTheme.colorScheme.primaryContainer
                                    } else {
                                        MaterialTheme.colorScheme.surfaceVariant
                                    }
                                )
                            ) {
                                Row(
                                    modifier = Modifier.padding(12.dp).fillMaxWidth(),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier.size(36.dp).clip(CircleShape).background(MaterialTheme.colorScheme.primary),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(tech.name.take(1).uppercase(), color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(modifier = Modifier.width(10.dp))
                                    Column(modifier = Modifier.weight(1f)) {
                                        Text(tech.name, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                                        Text(tech.phone ?: tech.specialization ?: "Technician", fontSize = 12.sp, color = Color.Gray)
                                    }
                                    Surface(
                                        shape = RoundedCornerShape(4.dp),
                                        color = if (tech.status == "Active") Color(0xFFDCFCE7) else Color(0xFFFEE2E2)
                                    ) {
                                        Text(
                                            tech.status,
                                            color = if (tech.status == "Active") Color(0xFF15803D) else Color(0xFFB91C1C),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {},
            dismissButton = {
                TextButton(onClick = { showAssignDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Request Details") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    val state = uiState
                    if (state is RequestDetailUiState.Success && (state.viewerRole == UserRole.ADMIN || state.viewerRole == UserRole.STORE_INCHARGE)) {
                        IconButton(onClick = { showAssignDialog = true }) {
                            Icon(Icons.Default.PersonAdd, contentDescription = "Assign Technician")
                        }
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (val state = uiState) {
                is RequestDetailUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is RequestDetailUiState.Error -> {
                    Text(text = state.message, modifier = Modifier.align(Alignment.Center).padding(16.dp))
                }
                is RequestDetailUiState.Success -> {
                    RequestDetailsContent(
                        request = state.request,
                        customer = state.customer,
                        agent = state.agent,
                        viewerRole = state.viewerRole,
                        onTrackAgent = {
                            if (state.viewerRole == UserRole.ADMIN || state.viewerRole == UserRole.STORE_INCHARGE) {
                                navController.navigate(AppRoutes.AdminSingleAgentTracking.createRoute(requestId))
                            }
                        },
                        onReassignTechnician = { showAssignDialog = true },
                        onViewBeforeImage = { imageUrlToShow = state.request.beforeImageUrl },
                        onViewAfterImage = { imageUrlToShow = state.request.afterImageUrl }
                    )
                }
            }
        }
    }
}

@Composable
fun RequestDetailsContent(
    request: ServiceRequest,
    customer: User?,
    agent: Agent?,
    viewerRole: UserRole?,
    onTrackAgent: () -> Unit,
    onReassignTechnician: () -> Unit,
    onViewBeforeImage: () -> Unit,
    onViewAfterImage: () -> Unit
) {
    val isDispatcher = viewerRole == UserRole.ADMIN || viewerRole == UserRole.STORE_INCHARGE

    val customerAddress = request.customerAddress.ifBlank {
        (customer as? Customer)?.address ?: "No Address Provided"
    }
    val customerPhone = request.customerPhone ?: (customer as? Customer)?.phone
    val agentPhone = request.assignedAgentPhone ?: agent?.phone
    val agentSpecialization = agent?.specialization

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(request.serviceType, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            StatusChip(status = request.status)
        }

        // Timer Section
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Job Duration", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(8.dp))
                    JobTimer(request = request)
                }
            }
        }

        // Details List Section
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                ListItem(
                    headlineContent = { Text(request.description) },
                    leadingContent = { Icon(Icons.Default.Description, contentDescription = null) },
                    supportingContent = { Text("Issue Description") }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ListItem(
                    headlineContent = {
                        Column {
                            Text(customer?.name ?: request.customerName ?: request.customerId)
                            if (!customerPhone.isNullOrBlank()) {
                                Text(customerPhone, style = MaterialTheme.typography.bodySmall)
                            }
                        }
                    },
                    leadingContent = { Icon(Icons.Default.Person, contentDescription = null) },
                    supportingContent = { Text("Customer") }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ListItem(
                    headlineContent = { Text(customerAddress) },
                    leadingContent = { Icon(Icons.Default.Home, contentDescription = null) },
                    supportingContent = { Text("Service Address") }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ListItem(
                    headlineContent = {
                        Column {
                            Text(agent?.name ?: request.assignedAgentName ?: "Unassigned")
                            if (!agentSpecialization.isNullOrBlank()) {
                                Text(agentSpecialization, style = MaterialTheme.typography.bodySmall)
                            }
                            if (!agentPhone.isNullOrBlank()) {
                                Text(agentPhone, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                            }
                        }
                    },
                    leadingContent = { Icon(Icons.Default.Engineering, contentDescription = null) },
                    supportingContent = { Text("Assigned Technician") },
                    trailingContent = {
                        if (isDispatcher) {
                            OutlinedButton(
                                onClick = onReassignTechnician,
                                contentPadding = PaddingValues(horizontal = 10.dp, vertical = 4.dp)
                            ) {
                                Text(if (agent != null || !request.assignedAgentId.isNullOrBlank()) "Reassign" else "Assign", fontSize = 12.sp)
                            }
                        }
                    }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ListItem(
                    headlineContent = {
                        val text = if (request.paymentStatus == "Paid") {
                            "₹${request.paymentAmount ?: request.finalAmount ?: 0.0} via ${request.paymentMethod ?: "Cash"}"
                        } else {
                            "Pending (₹${request.paymentAmount ?: request.finalAmount ?: 0.0})"
                        }
                        Text(text)
                    },
                    leadingContent = { Icon(Icons.Default.Payment, contentDescription = null) },
                    supportingContent = { Text("Payment Details") }
                )
                HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
                ListItem(
                    headlineContent = {
                        Text(request.createdAt?.let { SimpleDateFormat("dd MMM yyyy, hh:mm a", Locale.getDefault()).format(it) } ?: "N/A")
                    },
                    leadingContent = { Icon(Icons.Default.CalendarToday, contentDescription = null) },
                    supportingContent = { Text("Created At") }
                )
            }
        }

        // Live Tracking Button
        if (isDispatcher && request.status in listOf("In Progress", "Accepted", "En Route")) {
            item {
                Button(
                    onClick = onTrackAgent,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Icon(Icons.Default.Navigation, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Track Technician Live on Map")
                }
            }
        }

        // Before & After Documentation Images
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("Service Documentation Photos", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(16.dp)
                    ) {
                        ImageThumbnail(
                            modifier = Modifier.weight(1f),
                            title = "Before Service",
                            imageUrl = request.beforeImageUrl,
                            onViewImage = onViewBeforeImage
                        )
                        ImageThumbnail(
                            modifier = Modifier.weight(1f),
                            title = "After Service",
                            imageUrl = request.afterImageUrl,
                            onViewImage = onViewAfterImage
                        )
                    }
                }
            }
        }
    }
}

@Composable
fun ImageThumbnail(
    title: String,
    imageUrl: String?,
    onViewImage: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier,
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(text = title, style = MaterialTheme.typography.bodyMedium, fontWeight = FontWeight.SemiBold)
        Spacer(modifier = Modifier.height(8.dp))
        Box(
            modifier = Modifier
                .aspectRatio(1f)
                .clip(RoundedCornerShape(8.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
                .clickable(enabled = imageUrl != null, onClick = onViewImage),
            contentAlignment = Alignment.Center
        ) {
            if (imageUrl != null) {
                SubcomposeAsyncImage(
                    model = imageUrl,
                    loading = { CircularProgressIndicator(modifier = Modifier.size(24.dp)) },
                    error = { Icon(Icons.Default.BrokenImage, contentDescription = "Error loading image") },
                    contentDescription = title,
                    modifier = Modifier.fillMaxSize()
                )
            } else {
                Text(text = "No Image", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
            }
        }
    }
}

@Composable
fun StatusChip(status: String) {
    val (backgroundColor, textColor) = when (status) {
        "Pending" -> Color(0xFFFEF3C7) to Color(0xFF92400E)
        "In Progress", "Accepted", "En Route" -> Color(0xFFE0E7FF) to Color(0xFF3730A3)
        "Completed" -> Color(0xFFDCFCE7) to Color(0xFF166534)
        "Cancelled" -> Color(0xFFFEE2E2) to Color(0xFF991B1B)
        else -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
    Surface(
        color = backgroundColor,
        shape = RoundedCornerShape(16.dp)
    ) {
        Text(
            text = status,
            color = textColor,
            style = MaterialTheme.typography.labelMedium,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp)
        )
    }
}

@Composable
private fun ImagePreviewDialog(imageUrl: String, onDismiss: () -> Unit) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = RoundedCornerShape(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                SubcomposeAsyncImage(
                    model = imageUrl,
                    loading = { CircularProgressIndicator() },
                    error = { Text("Failed to load image") },
                    contentDescription = "Full Image",
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1f)
                        .clip(RoundedCornerShape(8.dp))
                )
                Spacer(modifier = Modifier.height(16.dp))
                TextButton(onClick = onDismiss) {
                    Text("Close")
                }
            }
        }
    }
}