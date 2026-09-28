package com.sbr.sms.ui.storeincharge

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import com.sbr.sms.data.models.CashHandover
import com.sbr.sms.data.models.ServiceRequest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreInchargeCashHandoverScreen(
    viewModel: StoreInchargeViewModel
) {
    val requests by viewModel.requests.collectAsState()
    val pendingHandovers by viewModel.pendingHandovers.collectAsState()
    val allHandovers by viewModel.allHandovers.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    val handledRequestIds = remember(pendingHandovers, allHandovers) {
        (pendingHandovers + allHandovers).flatMap { h ->
            h.completedRequests.mapNotNull { item ->
                when (item) {
                    is String -> item
                    is Map<*, *> -> (item["id"] ?: item["_id"])?.toString()
                    else -> null
                }
            }
        }.toSet()
    }

    val unsubmittedCashRequests = remember(requests, handledRequestIds) {
        requests.filter { req ->
            val isPaid = req.paymentStatus.equals("Paid", ignoreCase = true) || req.status.equals("Completed", ignoreCase = true)
            val isCash = req.paymentMethod.isNullOrBlank() || req.paymentMethod?.contains("cash", ignoreCase = true) == true
            val amt = (req.finalAmount?.takeIf { it > 0 } ?: req.paymentAmount ?: 0.0)
            isPaid && isCash && amt > 0 && !handledRequestIds.contains(req.id)
        }
    }

    var selectedTab by remember { mutableStateOf(0) }
    var selectedHandoverForDialog by remember { mutableStateOf<CashHandover?>(null) }
    var receivedAmountText by remember { mutableStateOf("") }
    var notesText by remember { mutableStateOf("") }

    LaunchedEffect(selectedTab) {
        if (selectedTab == 1) {
            viewModel.loadAllHandovers()
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
                        "Cash Collection & Settlements",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = {
                        viewModel.loadData()
                        if (selectedTab == 1) viewModel.loadAllHandovers()
                    }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = MaterialTheme.colorScheme.primary)
                    }
                }

                TabRow(selectedTabIndex = selectedTab) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = {
                            val activeCount = pendingHandovers.size + (if (unsubmittedCashRequests.isNotEmpty()) 1 else 0)
                            Text("Pending ($activeCount)")
                        }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Settled History (${allHandovers.size})") }
                    )
                }
            }
        }

        // Body
        if (isLoading && pendingHandovers.isEmpty() && allHandovers.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator()
            }
        } else {
            when (selectedTab) {
                0 -> PendingHandoversTab(
                    handovers = pendingHandovers,
                    unsubmittedRequests = unsubmittedCashRequests,
                    onSettleClick = { h ->
                        selectedHandoverForDialog = h
                        receivedAmountText = h.totalCollectedCash.toString()
                        notesText = ""
                    }
                )
                1 -> HandoverHistoryTab(handovers = allHandovers)
            }
        }
    }

    // Reconcile Handover Modal Dialog
    if (selectedHandoverForDialog != null) {
        val h = selectedHandoverForDialog!!
        val countedAmount = receivedAmountText.toDoubleOrNull() ?: h.totalCollectedCash
        val discrepancy = countedAmount - h.totalCollectedCash

        AlertDialog(
            onDismissRequest = { selectedHandoverForDialog = null },
            title = { Text("Reconcile Field Cash Handover") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Technician: ${h.agentId?.name ?: "Field Agent"}", fontWeight = FontWeight.Bold)
                    Text("Date: ${h.date}", fontSize = 12.sp, color = Color.Gray)
                    Text("System Expected Cash: ₹${String.format("%.2f", h.totalCollectedCash)}", fontSize = 13.sp, fontWeight = FontWeight.SemiBold)

                    OutlinedTextField(
                        value = receivedAmountText,
                        onValueChange = { receivedAmountText = it },
                        label = { Text("Counted Physical Cash (₹) *") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    if (discrepancy != 0.0) {
                        Surface(
                            color = if (discrepancy < 0) Color(0xFFFEE2E2) else Color(0xFFDCFCE7),
                            shape = RoundedCornerShape(6.dp),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = if (discrepancy < 0) "Shortage Variance: -₹${String.format("%.2f", -discrepancy)}" else "Surplus Variance: +₹${String.format("%.2f", discrepancy)}",
                                color = if (discrepancy < 0) Color(0xFFDC2626) else Color(0xFF15803D),
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                modifier = Modifier.padding(8.dp)
                            )
                        }
                    }

                    OutlinedTextField(
                        value = notesText,
                        onValueChange = { notesText = it },
                        label = { Text(if (discrepancy != 0.0) "Variance Reason / Remarks *" else "Store Remarks (Optional)") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        viewModel.acknowledgeHandover(h._id, countedAmount, notesText)
                        selectedHandoverForDialog = null
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                ) {
                    Text("Confirm Settlement")
                }
            },
            dismissButton = {
                TextButton(onClick = { selectedHandoverForDialog = null }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun PendingHandoversTab(
    handovers: List<CashHandover>,
    unsubmittedRequests: List<ServiceRequest> = emptyList(),
    onSettleClick: (CashHandover) -> Unit
) {
    if (handovers.isEmpty() && unsubmittedRequests.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Icon(Icons.Default.CheckCircleOutline, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color(0xFF16A34A))
                Text("All field agent cash collections are settled!", style = MaterialTheme.typography.bodyLarge, color = Color.Gray)
            }
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // 1. Ready to Settle (Submitted EOD handovers)
            if (handovers.isNotEmpty()) {
                item {
                    Text(
                        "Submitted EOD Handovers (${handovers.size})",
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF15803D)
                    )
                }

                items(handovers, key = { it._id }) { h ->
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
                                    Text(h.agentId?.name ?: "Field Technician", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                    Text("Date: ${h.date}", fontSize = 12.sp, color = Color.Gray)
                                }
                                Text(
                                    "₹${String.format("%.2f", h.totalCollectedCash)}",
                                    fontWeight = FontWeight.Black,
                                    fontSize = 20.sp,
                                    color = Color(0xFF0284C7)
                                )
                            }

                            if (!h.agentNotes.isNullOrBlank()) {
                                Text("Agent Remarks: ${h.agentNotes}", fontSize = 12.sp, color = Color.DarkGray)
                            }

                            HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))

                            Button(
                                onClick = { onSettleClick(h) },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669)),
                                shape = RoundedCornerShape(8.dp)
                            ) {
                                Icon(Icons.Default.CheckCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Verify & Settle Handover", fontSize = 13.sp)
                            }
                        }
                    }
                }
            }

            // 2. Active Technician Field Cash (Circulation / Handover Pending)
            if (unsubmittedRequests.isNotEmpty()) {
                item {
                    val totalField = unsubmittedRequests.sumOf { (it.finalAmount?.takeIf { a -> a > 0 } ?: it.paymentAmount ?: 0.0) }
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            "Technician Field Cash in Transit",
                            style = MaterialTheme.typography.titleSmall,
                            fontWeight = FontWeight.Bold,
                            color = Color(0xFFD97706)
                        )
                        Surface(
                            color = Color(0xFFFEF3C7),
                            shape = RoundedCornerShape(12.dp)
                        ) {
                            Text(
                                "Total: ₹${String.format("%.0f", totalField)}",
                                fontSize = 12.sp,
                                fontWeight = FontWeight.Bold,
                                color = Color(0xFFB45309),
                                modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                            )
                        }
                    }
                }

                val groupedByAgent = unsubmittedRequests.groupBy { it.assignedAgentName ?: it.assignedAgentId ?: "Field Technician" }
                items(groupedByAgent.entries.toList(), key = { it.key }) { (agentName, agentReqs) ->
                    val agentCash = agentReqs.sumOf { (it.finalAmount?.takeIf { a -> a > 0 } ?: it.paymentAmount ?: 0.0) }
                    ElevatedCard(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.elevatedCardColors(containerColor = Color(0xFFFFFBEB)),
                        elevation = CardDefaults.elevatedCardElevation(1.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    Surface(
                                        color = Color(0xFFFDE68A),
                                        shape = androidx.compose.foundation.shape.CircleShape,
                                        modifier = Modifier.size(32.dp)
                                    ) {
                                        Box(contentAlignment = Alignment.Center) {
                                            Icon(Icons.Default.AccountBalanceWallet, contentDescription = null, tint = Color(0xFFB45309), modifier = Modifier.size(18.dp))
                                        }
                                    }
                                    Column {
                                        Text(agentName, fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                        Text("${agentReqs.size} job${if (agentReqs.size > 1) "s" else ""} collected • Handover Pending", fontSize = 12.sp, color = Color(0xFF92400E))
                                    }
                                }
                                Text(
                                    "₹${String.format("%.2f", agentCash)}",
                                    fontWeight = FontWeight.Black,
                                    fontSize = 17.sp,
                                    color = Color(0xFFB45309)
                                )
                            }

                            HorizontalDivider(color = Color(0xFFFDE68A))

                            agentReqs.forEach { req ->
                                Row(
                                    modifier = Modifier.fillMaxWidth(),
                                    horizontalArrangement = Arrangement.SpaceBetween,
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Text(
                                        req.serviceType.ifBlank { "Service Job" },
                                        fontSize = 12.sp,
                                        color = Color(0xFF78350F)
                                    )
                                    Text(
                                        "₹${String.format("%.2f", (req.finalAmount?.takeIf { it > 0 } ?: req.paymentAmount ?: 0.0))}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color(0xFF78350F)
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

@Composable
fun HandoverHistoryTab(
    handovers: List<CashHandover>
) {
    if (handovers.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No settled handover records found.", color = Color.Gray)
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            items(handovers, key = { it._id }) { h ->
                val status = h.status.uppercase()
                val isDiscrepancy = (h.discrepancyAmount ?: 0.0) != 0.0

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
                            Column {
                                Text(h.agentId?.name ?: "Field Agent", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Text("Date: ${h.date}", fontSize = 11.sp, color = Color.Gray)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text(
                                    "₹${String.format("%.2f", h.acknowledgedAmount ?: h.totalCollectedCash)}",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    color = Color(0xFF15803D)
                                )
                                if (isDiscrepancy) {
                                    Surface(
                                        color = Color(0xFFFEE2E2),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Text(
                                            "Variance: ₹${String.format("%.2f", h.discrepancyAmount ?: 0.0)}",
                                            color = Color(0xFFDC2626),
                                            fontSize = 10.sp,
                                            fontWeight = FontWeight.Bold,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                        )
                                    }
                                }
                            }
                        }

                        if (!h.inchargeNotes.isNullOrBlank()) {
                            Text("Store Note: ${h.inchargeNotes}", fontSize = 12.sp, color = Color.DarkGray)
                        }
                    }
                }
            }
        }
    }
}
