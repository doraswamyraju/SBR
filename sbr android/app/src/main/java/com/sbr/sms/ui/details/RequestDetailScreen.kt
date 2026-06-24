package com.sbr.sms.ui.details

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
            Text(request.description, style = MaterialTheme.typography.bodyLarge)
        }
        item {
            JobTimer(request = request)
        }
        item {
            DetailsCard(request = request, customerName = customer?.name, agentName = agent?.name)
        }
        item {
            ActionsCard(
                request = request,
                viewerRole = viewerRole,
                onTrackAgent = onTrackAgent,
                onViewBeforeImage = onViewBeforeImage,
                onViewAfterImage = onViewAfterImage
            )
        }
    }
}


@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DetailsCard(request: ServiceRequest, customerName: String?, agentName: String?) {
    // ... This composable is unchanged ...
    val dateFormatter = remember { SimpleDateFormat("dd MMM dd, HH:mm a", Locale.getDefault()) }

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(vertical = 8.dp)) {
            ListItem(
                headlineContent = { Text(request.status, fontWeight = FontWeight.Bold) },
                leadingContent = { Icon(Icons.Default.Info, contentDescription = null) },
                supportingContent = { Text("Status") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = { Text(customerName ?: request.customerId) },
                leadingContent = { Icon(Icons.Default.Person, contentDescription = null) },
                supportingContent = { Text("Customer") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = { Text(agentName ?: "Unassigned") },
                leadingContent = { Icon(Icons.Default.Engineering, contentDescription = null) },
                supportingContent = { Text("Agent") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = { Text(request.paymentStatus) },
                leadingContent = { Icon(Icons.Default.Payment, contentDescription = null) },
                supportingContent = { Text("Payment Status") }
            )
            if (request.paymentStatus == "Paid") {
                ListItem(
                    headlineContent = { Text("₹${request.paymentAmount} via ${request.paymentMethod}") }
                )
            }
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
private fun ActionsCard(
    request: ServiceRequest,
    viewerRole: UserRole?,
    onTrackAgent: () -> Unit,
    onViewBeforeImage: () -> Unit,
    onViewAfterImage: () -> Unit
) {
    // ... This composable is unchanged ...
    Card(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            Text("Actions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            if (viewerRole == UserRole.ADMIN) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    Button(
                        onClick = onViewBeforeImage,
                        enabled = request.beforeImageUrl != null,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Before Pic")
                    }
                    Button(
                        onClick = onViewAfterImage,
                        enabled = request.afterImageUrl != null,
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("After Pic")
                    }
                }
            }
            Button(
                onClick = onTrackAgent,
                enabled = request.assignedAgentId != null && request.status == "In Progress",
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
            // CHANGED: Use SubcomposeAsyncImage to provide a custom loading composable.
            // This resolves both errors.
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