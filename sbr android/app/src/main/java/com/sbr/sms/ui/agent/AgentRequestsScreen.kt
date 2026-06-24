package com.sbr.sms.ui.agent

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Call
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.ui.agent.viewmodels.AgentDashboardUiState
import com.sbr.sms.ui.agent.viewmodels.AgentRequestsViewModel
import com.sbr.sms.ui.agent.viewmodels.RequestWithCustomerDetails
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentRequestsScreen(
    navController: NavHostController,
    viewModel: AgentRequestsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(title = { Text("New Assigned Requests") })
        }
    ) { padding ->
        Box(modifier = Modifier
            .padding(padding)
            .fillMaxSize()) {

            when (val state = uiState) {
                is AgentDashboardUiState.Loading -> {
                    CircularProgressIndicator(Modifier.align(Alignment.Center))
                }
                is AgentDashboardUiState.Error -> {
                    Text(
                        text = state.message,
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is AgentDashboardUiState.Success -> {
                    if (state.assignedRequests.isEmpty()) {
                        Text("No new requests assigned.", Modifier.align(Alignment.Center))
                    } else {
                        RequestAcceptanceList(
                            requestsWithDetails = state.assignedRequests,
                            isJobActive = state.activeRequest != null,
                            onAccept = { requestId ->
                                viewModel.acceptRequest(requestId)
                            }
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun RequestAcceptanceList(
    // CHANGED: The parameter now takes the new data class
    requestsWithDetails: List<RequestWithCustomerDetails>,
    isJobActive: Boolean,
    onAccept: (String) -> Unit
) {
    val context = LocalContext.current
    val dateFormatter = remember { SimpleDateFormat("dd MMM, yyyy HH:mm", Locale.getDefault()) }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(requestsWithDetails, key = { it.request.id }) { details ->
            val request = details.request
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(4.dp),
                shape = MaterialTheme.shapes.large
            ) {
                Column(Modifier.padding(16.dp)) {
                    Text(
                        text = request.serviceType,
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))

                    // NEW: Display Customer Name
                    Text(
                        text = "Customer: ${details.customerName}",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Address: ${request.customerAddress}",
                        style = MaterialTheme.typography.bodyLarge
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = "Received: ${request.createdAt?.toDate()?.let { dateFormatter.format(it) } ?: "N/A"}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        // NEW: "Call Customer" button
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
                            Icon(Icons.Default.Call, contentDescription = "Call Icon", modifier = Modifier.size(ButtonDefaults.IconSize))
                            Spacer(modifier = Modifier.size(ButtonDefaults.IconSpacing))
                            Text("Call Customer")
                        }

                        // "Accept Request" button
                        Button(
                            onClick = {
                                onAccept(request.id)
                                Toast.makeText(context, "Request Accepted!", Toast.LENGTH_SHORT).show()
                            },
                            enabled = !isJobActive,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text("Accept")
                        }
                    }
                }
            }
        }
    }
}