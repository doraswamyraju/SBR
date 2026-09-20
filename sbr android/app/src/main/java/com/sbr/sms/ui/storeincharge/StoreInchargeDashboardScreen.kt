package com.sbr.sms.ui.storeincharge

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.*
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
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
import com.sbr.sms.data.models.AgentInventoryItem
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
    val allHandovers = MutableStateFlow<List<CashHandover>>(emptyList())
    val pendingIndents = MutableStateFlow<List<AgentIndent>>(emptyList())
    val allIndents = MutableStateFlow<List<AgentIndent>>(emptyList())
    val selectedAgentVanStock = MutableStateFlow<List<AgentInventoryItem>>(emptyList())
    val selectedAgentForStock = MutableStateFlow<String?>(null)
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
                    agents.value = (usersRes.body()?.data ?: emptyList()).filter { it.role.equals("AGENT", ignoreCase = true) }
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

    fun loadAllHandovers() {
        viewModelScope.launch {
            try {
                val res = apiService.getAllHandovers()
                if (res.isSuccessful && res.body()?.success == true) {
                    allHandovers.value = res.body()?.data ?: emptyList()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            }
        }
    }

    fun loadAllIndents() {
        viewModelScope.launch {
            try {
                val res = apiService.getAllIndents()
                if (res.isSuccessful && res.body()?.success == true) {
                    allIndents.value = res.body()?.data ?: emptyList()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            }
        }
    }

    fun loadAgentVanStock(agentId: String) {
        viewModelScope.launch {
            selectedAgentForStock.value = agentId
            try {
                val res = apiService.getAgentVanStock(agentId)
                if (res.isSuccessful && res.body()?.success == true) {
                    selectedAgentVanStock.value = res.body()?.data ?: emptyList()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
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
                    loadAllHandovers()
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
                    loadAllIndents()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            }
        }
    }

    fun rejectIndent(indentId: String, reason: String) {
        viewModelScope.launch {
            try {
                val res = apiService.rejectIndent(indentId, RejectIndentRequest(reason))
                if (res.isSuccessful) {
                    loadData()
                    loadAllIndents()
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

@Composable
fun StoreInchargeDashboardScreen(
    viewModel: StoreInchargeViewModel = hiltViewModel(),
    onNavigateToSection: (StoreInchargeSection) -> Unit
) {
    val requests by viewModel.requests.collectAsState()
    val agents by viewModel.agents.collectAsState()
    val handovers by viewModel.pendingHandovers.collectAsState()
    val indents by viewModel.pendingIndents.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    val pendingDispatchesCount = remember(requests) {
        requests.count { it.status.equals("Pending", ignoreCase = true) || it.assignedAgentId.isNullOrBlank() }
    }
    val totalPendingCash = remember(handovers) {
        handovers.sumOf { it.totalCollectedCash }
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Hero Welcome Banner
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Column(
                    modifier = Modifier.padding(20.dp),
                    verticalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(
                                "Store In-Charge Console",
                                style = MaterialTheme.typography.titleLarge,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onPrimary
                            )
                            Text(
                                "Branch Logistics & Technician Dispatch",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onPrimary.copy(alpha = 0.8f)
                            )
                        }
                        IconButton(onClick = { viewModel.loadData() }) {
                            Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = MaterialTheme.colorScheme.onPrimary)
                        }
                    }
                }
            }
        }

        // Executive KPI Metrics 2x2 Grid
        item {
            Text(
                "Operational Overview",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    KpiSummaryCard(
                        title = "Pending Dispatch",
                        count = "$pendingDispatchesCount",
                        subtitle = "Open service requests",
                        icon = Icons.AutoMirrored.Filled.List,
                        iconBg = Color(0xFFFEF3C7),
                        iconTint = Color(0xFFD97706),
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToSection(StoreInchargeSection.Dispatch) }
                    )
                    KpiSummaryCard(
                        title = "Pending Indents",
                        count = "${indents.size}",
                        subtitle = "Van kit requisitions",
                        icon = Icons.Default.Inventory2,
                        iconBg = Color(0xFFFFEDD5),
                        iconTint = Color(0xFFEA580C),
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToSection(StoreInchargeSection.Indents) }
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    KpiSummaryCard(
                        title = "Unsettled Cash",
                        count = "₹${String.format("%.0f", totalPendingCash)}",
                        subtitle = "${handovers.size} pending handovers",
                        icon = Icons.Default.AccountBalanceWallet,
                        iconBg = Color(0xFFDCFCE7),
                        iconTint = Color(0xFF16A34A),
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToSection(StoreInchargeSection.CashHandovers) }
                    )
                    KpiSummaryCard(
                        title = "Active Techs",
                        count = "${agents.size}",
                        subtitle = "Field workforce",
                        icon = Icons.Default.Group,
                        iconBg = Color(0xFFE0F2FE),
                        iconTint = Color(0xFF0284C7),
                        modifier = Modifier.weight(1f),
                        onClick = { onNavigateToSection(StoreInchargeSection.Technicians) }
                    )
                }
            }
        }

        // Quick Actions Section
        item {
            Text(
                "Quick Management Shortcuts",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        item {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                item {
                    QuickActionChip(
                        title = "Dispatch Tickets",
                        icon = Icons.AutoMirrored.Filled.List,
                        onClick = { onNavigateToSection(StoreInchargeSection.Dispatch) }
                    )
                }
                item {
                    QuickActionChip(
                        title = "Verify Field Cash",
                        icon = Icons.Default.AccountBalanceWallet,
                        onClick = { onNavigateToSection(StoreInchargeSection.CashHandovers) }
                    )
                }
                item {
                    QuickActionChip(
                        title = "Review Indents",
                        icon = Icons.Default.Inventory2,
                        onClick = { onNavigateToSection(StoreInchargeSection.Indents) }
                    )
                }
                item {
                    QuickActionChip(
                        title = "Live Agent Map",
                        icon = Icons.Default.Map,
                        onClick = { onNavigateToSection(StoreInchargeSection.LiveMap) }
                    )
                }
                item {
                    QuickActionChip(
                        title = "Store Catalog",
                        icon = Icons.Default.ShoppingCart,
                        onClick = { onNavigateToSection(StoreInchargeSection.Products) }
                    )
                }
                item {
                    QuickActionChip(
                        title = "Our Customers",
                        icon = Icons.Default.People,
                        onClick = { onNavigateToSection(StoreInchargeSection.OurCustomers) }
                    )
                }
            }
        }

        // Urgent Actions Feed: Pending Indents & Dispatches
        if (indents.isNotEmpty() || handovers.isNotEmpty()) {
            item {
                Text(
                    "Urgent Actions Required",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.error
                )
            }

            if (indents.isNotEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onNavigateToSection(StoreInchargeSection.Indents) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF7ED))
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Icon(Icons.Default.WarningAmber, contentDescription = null, tint = Color(0xFFEA580C))
                                Column {
                                    Text("${indents.size} Parts Requisition${if (indents.size > 1) "s" else ""} Awaiting Approval", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("Technicians need van kit replenishment", fontSize = 11.sp, color = Color.Gray)
                                }
                            }
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Color(0xFFEA580C))
                        }
                    }
                }
            }

            if (handovers.isNotEmpty()) {
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth().clickable { onNavigateToSection(StoreInchargeSection.CashHandovers) },
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4))
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                                Icon(Icons.Default.Payments, contentDescription = null, tint = Color(0xFF16A34A))
                                Column {
                                    Text("₹${String.format("%.2f", totalPendingCash)} EOD Cash Awaiting Settle", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                                    Text("${handovers.size} field agent cash handovers to count", fontSize = 11.sp, color = Color.Gray)
                                }
                            }
                            Icon(Icons.AutoMirrored.Filled.ArrowForward, contentDescription = null, tint = Color(0xFF16A34A))
                        }
                    }
                }
            }
        }
    }
}

@Composable
fun KpiSummaryCard(
    title: String,
    count: String,
    subtitle: String,
    icon: ImageVector,
    iconBg: Color,
    iconTint: Color,
    modifier: Modifier = Modifier,
    onClick: () -> Unit
) {
    ElevatedCard(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.elevatedCardElevation(2.dp)
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
                Surface(
                    color = iconBg,
                    shape = CircleShape,
                    modifier = Modifier.size(36.dp)
                ) {
                    Box(contentAlignment = Alignment.Center) {
                        Icon(icon, contentDescription = null, tint = iconTint, modifier = Modifier.size(20.dp))
                    }
                }
                Text(
                    text = count,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Black,
                    color = MaterialTheme.colorScheme.onSurface
                )
            }

            Text(
                text = title,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                fontSize = 11.sp
            )
        }
    }
}

@Composable
fun QuickActionChip(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    ElevatedCard(
        modifier = Modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.elevatedCardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(icon, contentDescription = null, modifier = Modifier.size(18.dp), tint = MaterialTheme.colorScheme.primary)
            Text(title, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold)
        }
    }
}
