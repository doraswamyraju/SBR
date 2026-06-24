package com.sbr.sms.ui.details

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.common.components.JobTimer

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerRequestDetailScreen(
    requestId: String,
    navController: NavHostController,
    // Use the specific ViewModel for this screen
    viewModel: CustomerRequestDetailViewModel = hiltViewModel()
) {
    // The UI State from the new ViewModel
    val uiState by viewModel.uiState.collectAsState()

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
                            // CHANGED: Use the new createRoute function to pass the request ID
                            navController.navigate(AppRoutes.CustomerLiveTracking.createRoute(state.request.id))
                        }
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
    onTrackAgent: () -> Unit
) {
    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(request.serviceType, style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(4.dp))
            Text(request.description, style = MaterialTheme.typography.bodyLarge)
        }

        item {
            JobTimer(request = request)
        }

        item {
            DetailsCard(request = request, agentName = agent?.name)
        }

        item {
            // The button is now enabled when the agent is assigned and the job is in progress.
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
private fun DetailsCard(request: ServiceRequest, agentName: String?) {
    OutlinedCard(modifier = Modifier.fillMaxWidth()) {
        Column(modifier = Modifier.padding(vertical = 8.dp)) {
            ListItem(
                headlineContent = { Text(request.status, fontWeight = FontWeight.Bold) },
                leadingContent = { Icon(Icons.Default.Info, contentDescription = "Status") },
                supportingContent = { Text("Current Status") }
            )
            Divider(modifier = Modifier.padding(horizontal = 16.dp))
            ListItem(
                headlineContent = { Text(agentName ?: "Not yet assigned") },
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