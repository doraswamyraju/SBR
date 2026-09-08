package com.sbr.sms.ui.storeincharge

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.DispatchIndentRequest
import com.sbr.sms.data.api.HandoverAcknowledgeRequest
import com.sbr.sms.data.api.RejectIndentRequest
import com.sbr.sms.data.api.UserDto
import com.sbr.sms.data.models.AgentIndent
import com.sbr.sms.data.models.CashHandover
import com.sbr.sms.data.models.ServiceRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class StoreInchargeViewModel @Inject constructor(
    private val apiService: ApiService,
    private val credentialManager: com.sbr.sms.data.CredentialManager
) : ViewModel() {
    val requests = MutableStateFlow<List<ServiceRequest>>(emptyList())
    val agents = MutableStateFlow<List<UserDto>>(emptyList())
    val pendingHandovers = MutableStateFlow<List<CashHandover>>(emptyList())
    val pendingIndents = MutableStateFlow<List<AgentIndent>>(emptyList())
    val isLoading = MutableStateFlow(false)
    val message = MutableStateFlow<String?>(null)

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            isLoading.value = true
            try {
                val reqRes = apiService.getRequests()
                if (reqRes.isSuccessful && reqRes.body()?.success == true) {
                    val dtos = reqRes.body()?.data ?: emptyList()
                    requests.value = dtos.map { dto ->
                        val agentId = when (val agent = dto.assignedAgentId) {
                            is String -> agent
                            is Map<*, *> -> (agent["id"] ?: agent["_id"]) as? String
                            else -> null
                        }
                        ServiceRequest(
                            id = dto.id,
                            serviceType = dto.serviceType,
                            customerAddress = dto.customerAddress,
                            status = dto.status,
                            assignedAgentId = agentId
                        )
                    }
                }

                val usersRes = apiService.getAllUsers()
                if (usersRes.isSuccessful && usersRes.body()?.success == true) {
                    agents.value = (usersRes.body()?.data ?: emptyList()).filter { it.role == "AGENT" }
                }

                val handRes = apiService.getPendingHandovers()
                if (handRes.isSuccessful && handRes.body()?.success == true) {
                    pendingHandovers.value = handRes.body()?.data ?: emptyList()
                }

                val indRes = apiService.getPendingIndents()
                if (indRes.isSuccessful && indRes.body()?.success == true) {
                    pendingIndents.value = indRes.body()?.data ?: emptyList()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            } finally {
                isLoading.value = false
            }
        }
    }

    fun assignAgent(requestId: String, agentId: String) {
        viewModelScope.launch {
            try {
                val res = apiService.assignRequest(requestId, mapOf("agentId" to agentId))
                if (res.isSuccessful) {
                    loadData()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            }
        }
    }

    fun acknowledgeHandover(handoverId: String, amount: Double, notes: String) {
        viewModelScope.launch {
            try {
                val res = apiService.acknowledgeHandover(handoverId, HandoverAcknowledgeRequest(amount, notes))
                if (res.isSuccessful) {
                    loadData()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            }
        }
    }

    fun dispatchIndent(indentId: String) {
        viewModelScope.launch {
            try {
                val res = apiService.dispatchIndent(indentId, DispatchIndentRequest("Dispatched by Store In-Charge"))
                if (res.isSuccessful) {
                    loadData()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            }
        }
    }

    fun rejectIndent(indentId: String) {
        viewModelScope.launch {
            try {
                val res = apiService.rejectIndent(indentId, RejectIndentRequest("Out of stock at central store"))
                if (res.isSuccessful) {
                    loadData()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            credentialManager.clearAuthSession()
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun StoreInchargeDashboardScreen(
    viewModel: StoreInchargeViewModel = hiltViewModel()
) {
    val requests by viewModel.requests.collectAsState()
    val agents by viewModel.agents.collectAsState()
    val handovers by viewModel.pendingHandovers.collectAsState()
    val indents by viewModel.pendingIndents.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    var selectedTab by remember { mutableStateOf(0) }
    var selectedHandoverForDialog by remember { mutableStateOf<CashHandover?>(null) }
    var receivedAmountText by remember { mutableStateOf("") }
    var notesText by remember { mutableStateOf("") }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text("Store In-Charge Console", fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("SBR Operations & Logistics", fontSize = 12.sp, color = Color.Gray)
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.logout() }) {
                        Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = "Logout", tint = Color.Red)
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Dispatch (${requests.filter { it.status == "Pending" || it.assignedAgentId.isNullOrEmpty() }.size})") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Cash (${handovers.size})") }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("Indents (${indents.size})") }
                )
            }

            if (isLoading) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else {
                when (selectedTab) {
                    0 -> DispatchQueueTab(
                        requests = requests.filter { it.status == "Pending" || it.assignedAgentId.isNullOrEmpty() },
                        agents = agents,
                        onAssign = { reqId, agId -> viewModel.assignAgent(reqId, agId) }
                    )
                    1 -> CashHandoverTab(
                        handovers = handovers,
                        onReconcileClick = { handover ->
                            selectedHandoverForDialog = handover
                            receivedAmountText = handover.totalCollectedCash.toString()
                        }
                    )
                    2 -> IndentsTab(
                        indents = indents,
                        onDispatch = { viewModel.dispatchIndent(it) },
                        onReject = { viewModel.rejectIndent(it) }
                    )
                }
            }
        }
    }

    // Reconcile Cash Handover Dialog
    if (selectedHandoverForDialog != null) {
        val h = selectedHandoverForDialog!!
        AlertDialog(
            onDismissRequest = { selectedHandoverForDialog = null },
            title = { Text("Reconcile Cash Handover") },
            text = {
                Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                    Text("Agent: ${h.agentId?.name ?: "Field Agent"}", fontWeight = FontWeight.Bold)
                    Text("Submitted Cash: ₹${String.format("%.2f", h.totalCollectedCash)}")
                    OutlinedTextField(
                        value = receivedAmountText,
                        onValueChange = { receivedAmountText = it },
                        label = { Text("Received Amount (₹)") },
                        singleLine = true
                    )
                    OutlinedTextField(
                        value = notesText,
                        onValueChange = { notesText = it },
                        label = { Text("Store Notes / Remarks") }
                    )
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        val amt = receivedAmountText.toDoubleOrNull() ?: h.totalCollectedCash
                        viewModel.acknowledgeHandover(h._id, amt, notesText)
                        selectedHandoverForDialog = null
                    }
                ) {
                    Text("Confirm Settle")
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
fun DispatchQueueTab(
    requests: List<ServiceRequest>,
    agents: List<UserDto>,
    onAssign: (String, String) -> Unit
) {
    if (requests.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("All service requests have been dispatched!", color = Color.Gray)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(requests) { req ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(req.serviceType, fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Surface(
                                color = Color(0xFFFEF3C7),
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    "Pending Dispatch",
                                    color = Color(0xFFD97706),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 11.sp,
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp)
                                )
                            }
                        }
                        Text("Address: ${req.customerAddress}", fontSize = 12.sp, color = Color.Gray)

                        var expanded by remember { mutableStateOf(false) }
                        Box {
                            OutlinedButton(
                                onClick = { expanded = true },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Icon(Icons.Default.PersonAdd, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Assign Field Agent")
                            }
                            DropdownMenu(
                                expanded = expanded,
                                onDismissRequest = { expanded = false }
                            ) {
                                agents.forEach { agent ->
                                    DropdownMenuItem(
                                        text = { Text(agent.name) },
                                        onClick = {
                                            expanded = false
                                            onAssign(req.id, agent.id)
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
}

@Composable
fun CashHandoverTab(
    handovers: List<CashHandover>,
    onReconcileClick: (CashHandover) -> Unit
) {
    if (handovers.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No pending cash handovers.", color = Color.Gray)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(handovers) { h ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                Text(h.agentId?.name ?: "Field Agent", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                                Text("Date: ${h.date}", fontSize = 12.sp, color = Color.Gray)
                            }
                            Text(
                                "₹${String.format("%.2f", h.totalCollectedCash)}",
                                fontWeight = FontWeight.Black,
                                fontSize = 18.sp,
                                color = Color(0xFF0284C7)
                            )
                        }

                        if (!h.agentNotes.isNullOrBlank()) {
                            Text("Agent Note: ${h.agentNotes}", fontSize = 12.sp, color = Color.DarkGray)
                        }

                        Button(
                            onClick = { onReconcileClick(h) },
                            modifier = Modifier.fillMaxWidth(),
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF059669))
                        ) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null)
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Verify & Settle Handover")
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun IndentsTab(
    indents: List<AgentIndent>,
    onDispatch: (String) -> Unit,
    onReject: (String) -> Unit
) {
    if (indents.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("No pending part requisitions.", color = Color.Gray)
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize().padding(12.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            items(indents) { ind ->
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("From: ${ind.agentId?.name ?: "Agent"}", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                            Surface(
                                color = Color(0xFFFFEDD5),
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    ind.urgency ?: "MEDIUM",
                                    color = Color(0xFFC2410C),
                                    fontSize = 11.sp,
                                    fontWeight = FontWeight.Bold,
                                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                )
                            }
                        }

                        HorizontalDivider()

                        ind.items.forEach { item ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(item.name, fontSize = 13.sp)
                                Text("Qty: ${item.requestedQuantity}", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }

                        if (!ind.agentRemarks.isNullOrBlank()) {
                            Text("Note: ${ind.agentRemarks}", fontSize = 12.sp, color = Color.Gray)
                        }

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Button(
                                onClick = { onDispatch(ind._id) },
                                modifier = Modifier.weight(1f),
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2563EB))
                            ) {
                                Text("Dispatch to Van")
                            }
                            OutlinedButton(
                                onClick = { onReject(ind._id) },
                                modifier = Modifier.weight(1f)
                            ) {
                                Text("Reject", color = Color.Red)
                            }
                        }
                    }
                }
            }
        }
    }
}
