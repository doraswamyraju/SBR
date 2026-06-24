package com.sbr.sms.ui.customer

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.common.UiState
import com.sbr.sms.ui.common.components.StatusChip
import com.sbr.sms.ui.customer.viewmodels.CustomerRequestsViewModel
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun CustomerRequestsScreen(
    navController: NavHostController,
    viewModel: CustomerRequestsViewModel = hiltViewModel()
) {
    val requestsState by viewModel.customerRequests.collectAsState()
    var statusFilter by remember { mutableStateOf("All") }
    var searchQuery by remember { mutableStateOf("") }

    Column(Modifier.fillMaxSize().padding(16.dp)) {
        Text("My Service Requests", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
        Spacer(Modifier.height(16.dp))

        OutlinedTextField(
            value = searchQuery,
            onValueChange = { searchQuery = it },
            label = { Text("Search by service type...") },
            modifier = Modifier.fillMaxWidth()
        )
        Spacer(Modifier.height(8.dp))
        StatusDropdownFilter(selected = statusFilter, onChange = { statusFilter = it })
        Spacer(Modifier.height(16.dp))

        when (val state = requestsState) {
            is UiState.Loading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            }
            is UiState.Error -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("Error: ${state.message}", color = MaterialTheme.colorScheme.error)
                }
            }
            is UiState.Success -> {
                val filteredRequests = state.data.filter {
                    (statusFilter == "All" || it.status.equals(statusFilter, ignoreCase = true)) &&
                            (searchQuery.isBlank() || it.serviceType.contains(searchQuery, ignoreCase = true))
                }
                if (filteredRequests.isEmpty()) {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No requests match your criteria.")
                    }
                } else {
                    RequestsTable(requests = filteredRequests, navController = navController)
                }
            }
            is UiState.Empty -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("You haven't made any requests yet.")
                }
            }
            is UiState.Idle -> { /* Idle state */ }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun RequestsTable(requests: List<ServiceRequest>, navController: NavHostController) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        stickyHeader {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Service", Modifier.weight(1.5f), style = MaterialTheme.typography.labelLarge)
                Text("Date", Modifier.weight(1.2f), style = MaterialTheme.typography.labelLarge)
                Text("Status", Modifier.weight(1f), style = MaterialTheme.typography.labelLarge)
                Text("Actions", Modifier.weight(1f), style = MaterialTheme.typography.labelLarge, textAlign = TextAlign.Center)
            }
            Divider()
        }
        items(requests, key = { it.id }) { request ->
            CustomerRequestRow(request = request, navController = navController)
            Divider()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StatusDropdownFilter(selected: String, onChange: (String) -> Unit) {
    var expanded by remember { mutableStateOf(false) }
    ExposedDropdownMenuBox(expanded = expanded, onExpandedChange = { expanded = !expanded }) {
        OutlinedTextField(
            value = selected,
            onValueChange = {},
            readOnly = true,
            label = { Text("Filter by Status") },
            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
            modifier = Modifier
                .fillMaxWidth()
                .menuAnchor()
        )
        ExposedDropdownMenu(expanded = expanded, onDismissRequest = { expanded = false }) {
            listOf("All", "Pending", "Assigned", "In Progress", "Completed", "Paid").forEach {
                DropdownMenuItem(
                    text = { Text(it) },
                    onClick = {
                        onChange(it)
                        expanded = false
                    }
                )
            }
        }
    }
}

@Composable
fun CustomerRequestRow(request: ServiceRequest, navController: NavHostController) {
    val formattedDate = remember(request.createdAt) {
        request.createdAt?.let { SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(it) } ?: "N/A"
    }

    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(request.serviceType, Modifier.weight(1.5f), overflow = TextOverflow.Ellipsis, maxLines = 1)
        Text(formattedDate, Modifier.weight(1.2f))
        Box(modifier = Modifier.weight(1f)) {
            StatusChip(status = request.status)
        }
        Box(modifier = Modifier.weight(1f), contentAlignment = Alignment.Center) {
            Button(
                onClick = { navController.navigate(AppRoutes.CustomerRequestDetail.createRoute(request.id)) },
                modifier = Modifier.height(36.dp),
                contentPadding = PaddingValues(horizontal = 8.dp)
            ) {
                Text("View", style = MaterialTheme.typography.labelSmall)
            }
        }
    }
}