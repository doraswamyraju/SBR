package com.sbr.sms.ui.details

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import com.sbr.sms.ui.common.components.JobTimer
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
// CHANGED: Import SubcomposeAsyncImage instead of AsyncImage
import coil.compose.SubcomposeAsyncImage
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.models.User
import com.sbr.sms.data.models.UserRole
import com.sbr.sms.navigation.AppRoutes
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
    var imageUrlToShow by remember { mutableStateOf<String?>(null) }

    if (imageUrlToShow != null) {
        ImagePreviewDialog(
            imageUrl = imageUrlToShow!!,
            onDismiss = { imageUrlToShow = null }
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
                            // This check prevents navigating if the role isn't admin
                            if (state.viewerRole == UserRole.ADMIN) {
                                navController.navigate(AppRoutes.AdminSingleAgentTracking.createRoute(requestId))
                            }
                        },
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
    onViewBeforeImage: () -> Unit,
    onViewAfterImage: () -> Unit
) {
    // ... This composable is unchanged ...
LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(request.serviceType, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(request.description ?: "", style = MaterialTheme.typography.bodyLarge)
        }
        item {
            JobTimer(request = request)
        }
        item {
            DetailsCard(request = request, customer = customer, agent = agent)
        }
        item {
            DocumentationPhotosCard(
                request = request,
                onViewBeforeImage = onViewBeforeImage,
                onViewAfterImage = onViewAfterImage
            )
        }
        item {
            ActionsCard(
                request = request,
                onTrackAgent = onTrackAgent
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DetailsCard(request: ServiceRequest, customer: User?, agent: Agent?) {
    val dateFormatter = remember { SimpleDateFormat("dd MMM yyyy, HH:mm a", Locale.getDefault()) }
    val customerPhone = (customer as? Customer)?.phone
    val customerAddress = (customer as? Customer)?.address ?: request.customerAddress
    val agentPhone = agent?.phone
    val agentSpecialization = agent?.specialization

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(vertical = 8.dp)) {
            ListItem(
                headlineContent = { Text(request.status, fontWeight = FontWeight.Bold) },
                leadingContent = { Icon(Icons.Default.Info, contentDescription = null) },
                supportingContent = { Text("Status") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = {
                    Column {
                        Text(customer?.name ?: request.customerId)
                        if (!customerPhone.isNullOrBlank()) {
                            Text(customerPhone, style = MaterialTheme.typography.bodySmall)
                        }
                    }
                },
                leadingContent = { Icon(Icons.Default.Person, contentDescription = null) },
                supportingContent = { Text("Customer") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = { Text(customerAddress) },
                leadingContent = { Icon(Icons.Default.Home, contentDescription = null) },
                supportingContent = { Text("Service Address") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = {
                    Column {
                        Text(agent?.name ?: "Unassigned")
                        if (!agentSpecialization.isNullOrBlank()) {
                            Text(agentSpecialization, style = MaterialTheme.typography.bodySmall)
                        }
                        if (!agentPhone.isNullOrBlank()) {
                            Text(agentPhone, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                },
                leadingContent = { Icon(Icons.Default.Engineering, contentDescription = null) },
                supportingContent = { Text("Assigned Agent") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = {
                    val text = if (request.paymentStatus == "Paid") {
                        "₹${request.paymentAmount} via ${request.paymentMethod}"
                    } else {
                        "Pending"
                    }
                    Text(text)
                },
                leadingContent = { Icon(Icons.Default.Payment, contentDescription = null) },
                supportingContent = { Text("Payment Details") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = { Text(request.createdAt?.let { dateFormatter.format(it) } ?: "N/A") },
                leadingContent = { Icon(Icons.Default.Event, contentDescription = null) },
                supportingContent = { Text("Created At") }
            )
        }
    }
}

@Composable
private fun DocumentationPhotosCard(
    request: ServiceRequest,
    onViewBeforeImage: () -> Unit,
    onViewAfterImage: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "Service Documentation Photos",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                PhotoBox(
                    label = "Before Photo",
                    imageUrl = request.beforeImageUrl,
                    onClick = onViewBeforeImage,
                    modifier = Modifier.weight(1f)
                )
                PhotoBox(
                    label = "After Photo",
                    imageUrl = request.afterImageUrl,
                    onClick = onViewAfterImage,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun PhotoBox(
    label: String,
    imageUrl: String?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(4.dp))
        Card(
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(120.dp)
                .clickable(enabled = imageUrl != null, onClick = onClick),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
        ) {
            if (imageUrl != null) {
                SubcomposeAsyncImage(
                    model = imageUrl,
                    contentDescription = label,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = androidx.compose.ui.layout.ContentScale.Crop,
                    loading = {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(strokeWidth = 2.dp)
                        }
                    }
                )
            } else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Icon(
                        imageVector = Icons.Default.Photo,
                        contentDescription = "No Image",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                    )
                }
            }
        }
    }
}

@Composable
private fun ActionsCard(
    request: ServiceRequest,
    onTrackAgent: () -> Unit
) {
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Actions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Button(
                onClick = onTrackAgent,
                enabled = request.assignedAgentId != null && (request.status == "Assigned" || request.status == "Accepted" || request.status == "In Progress"),
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Track Agent Live")
            }
        }
    }
}

@Composable
private fun ImagePreviewDialog(
    imageUrl: String,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(shape = RoundedCornerShape(16.dp)) {
            SubcomposeAsyncImage(
                model = imageUrl,
                contentDescription = "Service Image",
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f),
                loading = {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            )
        }
    }
}