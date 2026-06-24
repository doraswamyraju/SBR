package com.sbr.sms.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowForward
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.ui.admin.viewmodels.ServiceRequestUiState
import com.sbr.sms.ui.admin.viewmodels.ServiceRequestsViewModel
import com.sbr.sms.ui.admin.viewmodels.UiRequest
import java.text.SimpleDateFormat
import java.util.Locale
import com.google.firebase.Timestamp
// NEW: Import the common StatusChip composable
import com.sbr.sms.ui.common.components.StatusChip

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceRequestsScreen(
    navController: NavHostController,
    viewModel: ServiceRequestsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var searchQuery by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Service Requests") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .padding(16.dp)
        ) {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = { searchQuery = it },
                label = { Text("Search by service, agent, or status") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                modifier = Modifier.fillMaxWidth()
            )
            Spacer(Modifier.height(16.dp))

            when (val state = uiState) {
                is ServiceRequestUiState.Loading -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
                is ServiceRequestUiState.Error -> {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("Error: ${state.message}", color = MaterialTheme.colorScheme.error)
                    }
                }
                is ServiceRequestUiState.Success -> {
                    val filteredRequests = state.uiRequests.filter {
                        it.request.serviceType.contains(searchQuery, ignoreCase = true) ||
                                it.agentName.contains(searchQuery, ignoreCase = true) ||
                                it.request.status.contains(searchQuery, ignoreCase = true)
                    }

                    if (filteredRequests.isEmpty()) {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            Text(if (searchQuery.isNotBlank()) "No matching requests found." else "No service requests yet.")
                        }
                    } else {
                        LazyColumn(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            items(filteredRequests, key = { it.request.id }) { uiRequest ->
                                RequestCard(
                                    uiRequest = uiRequest,
                                    onViewDetails = { requestId ->
                                        navController.navigate("requestDetail/$requestId")
                                    },
                                    onDelete = { requestId ->
                                        viewModel.deleteRequest(requestId)
                                    }

                                )
                            }
                        }
                    }
                }
            }
        }
    }
}

fun formatDate(timestamp: Timestamp?): String {
    return if (timestamp == null) "N/A"
    else SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault()).format(timestamp.toDate())
}

@Composable
fun RequestCard(
    uiRequest: UiRequest,
    onViewDetails: (String) -> Unit,
    onDelete: (String) -> Unit
) {
    val request = uiRequest.request
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = request.serviceType,
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "Agent: ${uiRequest.agentName}",
                    style = MaterialTheme.typography.bodySmall
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Text(
                        text = formatDate(request.createdAt),
                        style = MaterialTheme.typography.bodySmall
                    )
                    // NEW: Display a small label if the request was created by an admin.
                    if (request.createdBy == "ADMIN") {
                        Text(
                            text = " (By Admin)",
                            style = MaterialTheme.typography.labelSmall,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.secondary
                        )
                    }
                }
            }
            StatusChip(request.status)
            IconButton(onClick = { onViewDetails(request.id) }) {
                Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = "View Details")
            }
            IconButton(onClick = { onDelete(request.id) }) {
                Icon(Icons.Default.Delete, contentDescription = "Delete Request")
            }
        }
    }
}

