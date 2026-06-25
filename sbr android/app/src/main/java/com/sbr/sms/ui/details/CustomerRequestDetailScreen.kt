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
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.SubcomposeAsyncImage
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.common.components.JobTimer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerRequestDetailScreen(
    requestId: String,
    navController: NavHostController,
    viewModel: CustomerRequestDetailViewModel = hiltViewModel()
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
                title = { Text("My Request Details") },
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
                is CustomerRequestDetailUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is CustomerRequestDetailUiState.Error -> {
                    Text(text = state.message, modifier = Modifier.align(Alignment.Center).padding(16.dp))
                }
                is CustomerRequestDetailUiState.Success -> {
                    CustomerRequestDetailsContent(
                        request = state.request,
                        agent = state.agent,
                        onTrackAgent = {
                            navController.navigate(AppRoutes.CustomerLiveTracking.createRoute(state.request.id))
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
fun CustomerRequestDetailsContent(
    request: ServiceRequest,
    agent: Agent?,
    onTrackAgent: () -> Unit,
    onViewBeforeImage: () -> Unit,
    onViewAfterImage: () -> Unit
) {
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
            DetailsCard(request = request, agent = agent)
        }

        item {
            DocumentationPhotosCard(
                request = request,
                onViewBeforeImage = onViewBeforeImage,
                onViewAfterImage = onViewAfterImage
            )
        }

        item {
            Button(
                onClick = onTrackAgent,
                enabled = request.assignedAgentId != null && request.status == "In Progress",
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.TrackChanges, contentDescription = null, modifier = Modifier.size(ButtonDefaults.IconSize))
                Spacer(modifier = Modifier.size(ButtonDefaults.IconSpacing))
                Text("Track Agent Live")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DetailsCard(request: ServiceRequest, agent: Agent?) {
    val agentPhone = agent?.phone
    val agentSpecialization = agent?.specialization

    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(vertical = 8.dp)) {
            ListItem(
                headlineContent = { Text(request.status, fontWeight = FontWeight.Bold) },
                leadingContent = { Icon(Icons.Default.Info, contentDescription = "Status") },
                supportingContent = { Text("Current Status") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = { Text(request.customerAddress) },
                leadingContent = { Icon(Icons.Default.Home, contentDescription = "Address") },
                supportingContent = { Text("Service Address") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = {
                    Column {
                        Text(agent?.name ?: "Not yet assigned")
                        if (!agentSpecialization.isNullOrBlank()) {
                            Text(agentSpecialization, style = MaterialTheme.typography.bodySmall)
                        }
                        if (!agentPhone.isNullOrBlank()) {
                            Text(agentPhone, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.primary)
                        }
                    }
                },
                leadingContent = { Icon(Icons.Default.Engineering, contentDescription = "Agent") },
                supportingContent = { Text("Assigned Agent") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = { Text(request.paymentStatus) },
                leadingContent = { Icon(Icons.Default.Payment, contentDescription = "Payment") },
                supportingContent = { Text("Payment Status") }
            )
            if (request.paymentStatus == "Paid") {
                ListItem(
                    headlineContent = { Text("₹${"%,.0f".format(request.paymentAmount)} via ${request.paymentMethod}") }
                )
            }
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