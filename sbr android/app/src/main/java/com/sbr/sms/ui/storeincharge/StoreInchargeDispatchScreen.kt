package com.sbr.sms.ui.storeincharge

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavHostController
import com.sbr.sms.data.api.UserDto
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes

val DISPATCH_STATUS_FILTERS = listOf("All", "Pending", "Assigned", "In-Progress", "Completed", "Cancelled")

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreInchargeDispatchScreen(
    navController: NavHostController,
    viewModel: StoreInchargeViewModel
) {
    val requests by viewModel.requests.collectAsState()
    val agents by viewModel.agents.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    var selectedFilter by remember { mutableStateOf("Pending") }
    var searchQuery by remember { mutableStateOf("") }
    var selectedRequestForAssign by remember { mutableStateOf<ServiceRequest?>(null) }

    val filteredRequests = remember(requests, selectedFilter, searchQuery) {
        requests.filter { req ->
            val matchesFilter = when (selectedFilter) {
                "All" -> true
                "Pending" -> req.status.equals("Pending", ignoreCase = true) || req.assignedAgentId.isNullOrBlank()
                else -> req.status.equals(selectedFilter, ignoreCase = true)
            }
            val matchesSearch = searchQuery.isBlank() ||
                    req.serviceType.contains(searchQuery, ignoreCase = true) ||
                    (req.customerAddress?.contains(searchQuery, ignoreCase = true) == true) ||
                    (req.id.contains(searchQuery, ignoreCase = true))

            matchesFilter && matchesSearch
        }
    }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(
                onClick = { navController.navigate(AppRoutes.AdminCreateRequest.route) },
                containerColor = MaterialTheme.colorScheme.primary
            ) {
                Icon(Icons.Default.Add, contentDescription = "Create Walk-In Ticket", tint = Color.White)
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Header Search & Filter Bar
            Surface(
                tonalElevation = 2.dp,
                shadowElevation = 4.dp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Dispatch & Service Tickets",
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        IconButton(onClick = { viewModel.loadData() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = MaterialTheme.colorScheme.primary)
                        }
                    }

                    OutlinedTextField(
                        value = searchQuery,
                        onValueChange = { searchQuery = it },
                        placeholder = { Text("Search by type, address, or ticket ID...") },
                        leadingIcon = { Icon(Icons.Default.Search, contentDescription = "Search") },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { searchQuery = "" }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Clear")
                                }
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )

                    LazyRow(
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        items(DISPATCH_STATUS_FILTERS) { filter ->
                            val count = when (filter) {
                                "All" -> requests.size
                                "Pending" -> requests.count { it.status.equals("Pending", ignoreCase = true) || it.assignedAgentId.isNullOrBlank() }
                                else -> requests.count { it.status.equals(filter, ignoreCase = true) }
                            }
                            FilterChip(
                                selected = selectedFilter == filter,
                                onClick = { selectedFilter = filter },
                                label = { Text("$filter ($count)") }
                            )
                        }
                    }
                }
            }

            // Body
            if (isLoading && requests.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (filteredRequests.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(
                            Icons.Default.AssignmentTurnedIn,
                            contentDescription = null,
                            modifier = Modifier.size(48.dp),
                            tint = Color.Gray
                        )
                        Text(
                            "No tickets found for '$selectedFilter'",
                            style = MaterialTheme.typography.bodyLarge,
                            color = Color.Gray
                        )
                    }
                }
            } else {
                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    items(filteredRequests, key = { it.id }) { req ->
                        StoreTicketCard(
                            request = req,
                            agents = agents,
                            onAssignClick = { selectedRequestForAssign = req },
                            onCardClick = {
                                navController.navigate(AppRoutes.RequestDetail.createRoute(req.id))
                            },
                            onViewDetailsClick = {
                                navController.navigate(AppRoutes.RequestDetail.createRoute(req.id))
                            }
                        )
                    }
                }
            }
        }
    }

    // Assign Agent Modal Dialog
    if (selectedRequestForAssign != null) {
        val req = selectedRequestForAssign!!
        var chosenAgentId by remember { mutableStateOf<String?>(null) }

        AlertDialog(
            onDismissRequest = { selectedRequestForAssign = null },
            title = { Text("Assign Field Technician") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Ticket: ${req.serviceType}", fontWeight = FontWeight.Bold)
                    Text("Location: ${req.customerAddress ?: "Customer Site"}", fontSize = 12.sp, color = Color.Gray)
                    HorizontalDivider()
                    Text("Select Active Technician:", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)

                    if (agents.isEmpty()) {
                        Text("No active agents found.", color = Color.Red, fontSize = 12.sp)
                    } else {
                        LazyColumn(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 240.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            items(agents) { agent ->
                                val isSelected = chosenAgentId == agent.id
                                Card(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .clickable { chosenAgentId = agent.id },
                                    colors = CardDefaults.cardColors(
                                        containerColor = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                                    )
                                ) {
                                    Row(
                                        modifier = Modifier.padding(10.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column {
                                            Text(agent.name, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                            Text(agent.phone ?: "No phone", fontSize = 11.sp, color = Color.Gray)
                                        }
                                        RadioButton(
                                            selected = isSelected,
                                            onClick = { chosenAgentId = agent.id }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (chosenAgentId != null) {
                            viewModel.assignAgent(req.id, chosenAgentId!!)
                            selectedRequestForAssign = null
                        }
                    },
                    enabled = chosenAgentId != null
                ) {
                    Text("Confirm Dispatch")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedRequestForAssign = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun StoreTicketCard(
    request: ServiceRequest,
    agents: List<UserDto>,
    onAssignClick: () -> Unit,
    onCardClick: () -> Unit,
    onViewDetailsClick: () -> Unit
) {
    val assignedAgent = remember(request.assignedAgentId, agents) {
        agents.find { it.id == request.assignedAgentId }
    }

    val (badgeBg, badgeFg) = when (request.status.lowercase()) {
        "completed" -> Color(0xFFDCFCE7) to Color(0xFF15803D)
        "in-progress", "in_progress" -> Color(0xFFDBEAFE) to Color(0xFF1D4ED8)
        "assigned" -> Color(0xFFE0E7FF) to Color(0xFF4338CA)
        "cancelled" -> Color(0xFFFEE2E2) to Color(0xFFB91C1C)
        else -> Color(0xFFFEF3C7) to Color(0xFFB45309)
    }

    ElevatedCard(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onCardClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = request.serviceType,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Surface(
                    color = badgeBg,
                    shape = RoundedCornerShape(6.dp)
                ) {
                    Text(
                        text = request.status.uppercase(),
                        color = badgeFg,
                        fontWeight = FontWeight.Bold,
                        fontSize = 11.sp,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                    )
                }
            }

            if (!request.customerAddress.isNullOrBlank()) {
                Row(
                    verticalAlignment = Alignment.Top,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        Icons.Default.LocationOn,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.size(16.dp)
                    )
                    Text(
                        text = request.customerAddress ?: "",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Icon(
                        Icons.Default.Person,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp),
                        tint = if (assignedAgent != null) Color(0xFF0284C7) else Color.Gray
                    )
                    Text(
                        text = assignedAgent?.let { "Assigned: ${it.name}" } ?: "Unassigned Field Tech",
                        fontSize = 12.sp,
                        fontWeight = if (assignedAgent != null) FontWeight.SemiBold else FontWeight.Normal,
                        color = if (assignedAgent != null) MaterialTheme.colorScheme.onSurface else Color.Gray
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedButton(
                    onClick = onViewDetailsClick,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.Visibility, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text("View Details", fontSize = 12.sp)
                }

                Button(
                    onClick = onAssignClick,
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.weight(1f),
                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 6.dp)
                ) {
                    Icon(Icons.Default.PersonAdd, contentDescription = null, modifier = Modifier.size(14.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(if (assignedAgent != null) "Re-assign" else "Assign Tech", fontSize = 12.sp)
                }
            }
        }
    }
}
