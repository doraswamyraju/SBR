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
import com.sbr.sms.data.api.UserDto
import com.sbr.sms.data.models.AgentIndent
import com.sbr.sms.data.models.AgentInventoryItem

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreInchargeIndentsScreen(
    viewModel: StoreInchargeViewModel
) {
    val pendingIndents by viewModel.pendingIndents.collectAsState()
    val allIndents by viewModel.allIndents.collectAsState()
    val agents by viewModel.agents.collectAsState()
    val selectedAgentVanStock by viewModel.selectedAgentVanStock.collectAsState()
    val selectedAgentId by viewModel.selectedAgentForStock.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    var selectedTab by remember { mutableStateOf(0) }
    var indentToReject by remember { mutableStateOf<AgentIndent?>(null) }
    var rejectionReason by remember { mutableStateOf("") }

    LaunchedEffect(selectedTab) {
        if (selectedTab == 1) {
            viewModel.loadAllIndents()
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        // Tab Header
        Surface(
            tonalElevation = 2.dp,
            shadowElevation = 4.dp,
            modifier = Modifier.fillMaxWidth()
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        "Van Stock & Requisitions",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = {
                        viewModel.loadData()
                        if (selectedTab == 1) viewModel.loadAllIndents()
                        if (selectedTab == 2 && selectedAgentId != null) viewModel.loadAgentVanStock(selectedAgentId!!)
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = MaterialTheme.colorScheme.primary)
                    }
                }

                TabRow(selectedTabIndex = selectedTab) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Pending (${pendingIndents.size})") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("History (${allIndents.size})") }
                    )
                    Tab(
                        selected = selectedTab == 2,
                        onClick = { selectedTab = 2 },
                        text = { Text("Van Stock Audit") }
                    )
                }
            }
        }

        // Tab Content
        if (isLoading && pendingIndents.isEmpty() && allIndents.isEmpty() && selectedAgentVanStock.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            when (selectedTab) {
                0 -> PendingIndentsTab(
                    indents = pendingIndents,
                    onDispatch = { viewModel.dispatchIndent(it) },
                    onRejectClick = { indentToReject = it }
                )
                1 -> IndentsHistoryTab(indents = allIndents)
                2 -> VanStockAuditTab(
                    agents = agents,
                    selectedAgentId = selectedAgentId,
                    vanStock = selectedAgentVanStock,
                    onSelectAgent = { viewModel.loadAgentVanStock(it) }
                )
            }
        }
    }

    // Reject Indent Reason Dialog
    if (indentToReject != null) {
        val ind = indentToReject!!
        AlertDialog(
            onDismissRequest = { indentToReject = null },
            title = { Text("Reject Part Requisition") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Text("Technician: ${ind.agentId?.name ?: "Field Agent"}", fontWeight = FontWeight.Bold)
                    Text("Items: ${ind.items.joinToString { "${it.name} (Qty: ${it.requestedQuantity})" }}", fontSize = 12.sp, color = Color.Gray)
                    OutlinedTextField(
                        value = rejectionReason,
                        onValueChange = { rejectionReason = it },
                        label = { Text("Reason for Rejection *") },
                        placeholder = { Text("e.g. Out of stock at central warehouse") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val reason = rejectionReason.ifBlank { "Rejected by Store In-Charge" }
                        viewModel.rejectIndent(ind._id, reason)
                        indentToReject = null
                        rejectionReason = ""
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Confirm Reject")
                }
            },
            dismissButton = {
                TextButton(onClick = { indentToReject = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun PendingIndentsTab(
    indents: List<AgentIndent>,
    onDispatch: (String) -> Unit,
    onRejectClick: (AgentIndent) -> Unit
) {
    var urgencyFilter by remember { mutableStateOf("All") }

    val filteredIndents = remember(indents, urgencyFilter) {
        if (urgencyFilter == "All") {
            indents
        } else {
            indents.filter {
                it.urgency?.contains(urgencyFilter, ignoreCase = true) == true ||
                (urgencyFilter == "Normal" && (it.urgency.isNullOrBlank() || it.urgency.equals("LOW", ignoreCase = true) || it.urgency.equals("MEDIUM", ignoreCase = true)))
            }
        }
    }

    Column(modifier = Modifier.fillMaxSize()) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 6.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            listOf("All", "Emergency", "Urgent", "Normal").forEach { u ->
                FilterChip(
                    selected = urgencyFilter == u,
                    onClick = { urgencyFilter = u },
                    label = { Text(u) }
                )
            }
        }

        if (filteredIndents.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(Icons.Default.CheckCircleOutline, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color(0xFF16A34A))
                    Text("No requisitions matching selected urgency filter.", style = MaterialTheme.typography.bodyLarge, color = Color.Gray)
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(filteredIndents, key = { it._id }) { ind ->
                    val urgency = ind.urgency?.uppercase() ?: "MEDIUM"
                val (uBg, uFg) = when (urgency) {
                    "HIGH", "CRITICAL" -> Color(0xFFFEE2E2) to Color(0xFFDC2626)
                    "LOW" -> Color(0xFFE0F2FE) to Color(0xFF0284C7)
                    else -> Color(0xFFFFEDD5) to Color(0xFFEA580C)
                }

                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.elevatedCardElevation(2.dp)
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
                            Column {
                                Text(ind.agentId?.name ?: "Field Technician", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                if (!ind.agentId?.phone.isNullOrBlank()) {
                                    Text(ind.agentId?.phone ?: "", fontSize = 12.sp, color = Color.Gray)
                                }
                            }
                            Surface(
                                color = uBg,
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    urgency,
                                    color = uFg,
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 3.dp)
                                )
                            }
                        }

                        HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                        Text("Requested Spare Parts:", fontWeight = FontWeight.SemiBold, fontSize = 13.sp)

                        ind.items.forEach { item ->
                            Row(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .background(MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f), RoundedCornerShape(8.dp))
                                    .padding(horizontal = 10.dp, vertical = 6.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(item.name, fontSize = 13.sp, fontWeight = FontWeight.Medium)
                                Surface(
                                    color = MaterialTheme.colorScheme.primary.copy(alpha = 0.12f),
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        "Qty: ${item.requestedQuantity}",
                                        color = MaterialTheme.colorScheme.primary,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }

                        if (!ind.agentRemarks.isNullOrBlank()) {
                            Text("Agent Note: ${ind.agentRemarks}", fontSize = 12.sp, color = Color.DarkGray)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            Button(
                                onClick = { onDispatch(ind._id) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
                            ) {
                                Icon(Icons.Default.LocalShipping, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Dispatch to Van", fontSize = 13.sp)
                            }
                            OutlinedButton(
                                onClick = { onRejectClick(ind) },
                                modifier = Modifier.weight(0.7f),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFFDC2626))
                            ) {
                                Text("Reject", fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
}

@Composable
fun IndentsHistoryTab(
    indents: List<AgentIndent>
) {
    if (indents.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No past indent history recorded.", color = Color.Gray)
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(indents, key = { it._id }) { ind ->
                val status = ind.status.uppercase()
                val (sBg, sFg) = when (status) {
                    "DISPATCHED", "APPROVED" -> Color(0xFFDCFCE7) to Color(0xFF15803D)
                    "REJECTED" -> Color(0xFFFEE2E2) to Color(0xFFDC2626)
                    else -> Color(0xFFFEF3C7) to Color(0xFFB45309)
                }

                ElevatedCard(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(
                        modifier = Modifier.padding(14.dp),
                        verticalArrangement = Arrangement.spacedBy(6.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(ind.agentId?.name ?: "Field Agent", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Surface(
                                color = sBg,
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    status,
                                    color = sFg,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        ind.items.forEach { item ->
                            Text("• ${item.name} (Qty: ${item.requestedQuantity})", fontSize = 13.sp)
                        }

                        if (!ind.inchargeRemarks.isNullOrBlank()) {
                            Text("Remarks: ${ind.inchargeRemarks}", fontSize = 11.sp, color = Color.Gray)
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun VanStockAuditTab(
    agents: List<UserDto>,
    selectedAgentId: String?,
    vanStock: List<AgentInventoryItem>,
    onSelectAgent: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp)
    ) {
        Text("Select Technician to Inspect Van Kit:", fontWeight = FontWeight.Bold, fontSize = 14.sp)

        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(agents) { agent ->
                FilterChip(
                    selected = selectedAgentId == agent.id,
                    onClick = { onSelectAgent(agent.id) },
                    label = { Text(agent.name) },
                    leadingIcon = if (selectedAgentId == agent.id) {
                        { Icon(Icons.Default.Check, contentDescription = null, modifier = Modifier.size(16.dp)) }
                    } else null
                )
            }
        }

        HorizontalDivider()

        if (selectedAgentId == null) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("Select a technician above to view their active van kit inventory.", color = Color.Gray)
            }
        } else if (vanStock.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Text("No inventory items found in this technician's mobile kit.", color = Color.Gray)
            }
        } else {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(vanStock, key = { it._id }) { item ->
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(10.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(12.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(item.displayName, fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                Text(item.category ?: "General Spares", fontSize = 11.sp, color = Color.Gray)
                            }
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                if (item.isLowStock) {
                                    Surface(
                                        color = Color(0xFFFEE2E2),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            "LOW STOCK",
                                            color = Color(0xFFDC2626),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                                Surface(
                                    color = MaterialTheme.colorScheme.primaryContainer,
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        "In Van: ${item.quantity}",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp,
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
