package com.sbr.sms.ui.agent

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.AccountBalanceWallet
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.Today
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.api.HandoverSubmitRequest
import com.sbr.sms.data.models.AgentDailySummary
import com.sbr.sms.data.models.CashHandover
import com.sbr.sms.data.models.ServiceRequest
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

data class AgentCashHandoverUiState(
    val allTimePendingCash: Double = 0.0,
    val todaysPendingCash: Double = 0.0,
    val previousPendingCash: Double = 0.0,
    val pendingJobsCount: Int = 0,
    val pendingJobIds: List<String> = emptyList(),
    val hasSubmittedHandover: Boolean = false,
    val latestHandover: CashHandover? = null,
    val isLoading: Boolean = false,
    val isSubmitting: Boolean = false,
    val errorMessage: String? = null,
    val successMessage: String? = null
)

@HiltViewModel
class AgentCashHandoverViewModel @Inject constructor(
    private val apiService: ApiService,
    private val serviceRequestRepository: com.sbr.sms.data.repositories.ServiceRequestRepository,
    private val credentialManager: com.sbr.sms.data.CredentialManager
) : ViewModel() {

    private val _uiState = MutableStateFlow(AgentCashHandoverUiState())
    val uiState = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, errorMessage = null) }
            try {
                val agentId = credentialManager.getUserId() ?: ""
                
                // 1. Fetch Backend Summary
                var backendSummary: AgentDailySummary? = null
                try {
                    val summaryRes = apiService.getAgentDailySummary()
                    if (summaryRes.isSuccessful && summaryRes.body()?.success == true) {
                        backendSummary = summaryRes.body()?.data
                    }
                } catch (e: Exception) {
                    // Non-blocking fallback
                }

                // 2. Fetch All Requests & All Handovers to compute true Day 1 to Present pending cash
                val allRequests = serviceRequestRepository.getAllRequests()
                val handoversRes = try { apiService.getAllHandovers() } catch (e: Exception) { null }
                val handovers = handoversRes?.body()?.data ?: emptyList()

                // Acknowledged Request IDs (fully settled by Store In-Charge)
                val acknowledgedReqIds = handovers
                    .filter { it.status.equals("ACKNOWLEDGED", ignoreCase = true) }
                    .flatMap { h ->
                        h.completedRequests.mapNotNull { item ->
                            when (item) {
                                is String -> item
                                is Map<*, *> -> (item["id"] ?: item["_id"])?.toString()
                                else -> item.toString()
                            }
                        }
                    }.toSet()

                // Filter un-settled cash jobs collected by this agent from Day 1 to present
                val pendingCashJobs = allRequests.filter { req ->
                    val isMyJob = agentId.isBlank() || req.assignedAgentId.isNullOrBlank() || req.assignedAgentId == agentId
                    val isPaidOrCompleted = req.paymentStatus.equals("Paid", ignoreCase = true) ||
                                            req.status.equals("Completed", ignoreCase = true) ||
                                            req.status.equals("Paid", ignoreCase = true)
                    val isCash = req.paymentMethod.isNullOrBlank() || req.paymentMethod.contains("cash", ignoreCase = true)
                    val amt = (req.finalAmount?.takeIf { it > 0 } ?: req.paymentAmount ?: 0.0)
                    val isNotSettled = !acknowledgedReqIds.contains(req.id)
                    isMyJob && isPaidOrCompleted && isCash && amt > 0 && isNotSettled
                }

                val computedAllTimeCash = pendingCashJobs.sumOf { (it.finalAmount?.takeIf { a -> a > 0 } ?: it.paymentAmount ?: 0.0) }
                
                // Group by Today vs Previous Days
                val todayStr = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
                val todaysJobs = pendingCashJobs.filter { req ->
                    val dates = listOfNotNull(req.createdAt, req.completedAt, req.acceptedAt)
                    dates.any { date ->
                        try {
                            SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(date) == todayStr
                        } catch (e: Exception) { false }
                    }
                }
                
                val todaysCash = todaysJobs.sumOf { (it.finalAmount?.takeIf { a -> a > 0 } ?: it.paymentAmount ?: 0.0) }
                val previousCash = (computedAllTimeCash - todaysCash).coerceAtLeast(0.0)

                // 3. Determine Latest Handover & Submitted status
                val latestHandover = backendSummary?.latestHandover ?: handovers.firstOrNull {
                    val hAgentId = it.agentId?.id ?: ""
                    agentId.isBlank() || hAgentId == agentId || hAgentId.isBlank()
                }

                val hasSubmitted = backendSummary?.hasSubmittedHandover == true || 
                                   (latestHandover != null && latestHandover.status.equals("SUBMITTED", ignoreCase = true))

                _uiState.update {
                    it.copy(
                        allTimePendingCash = if (computedAllTimeCash > 0) computedAllTimeCash else (backendSummary?.totalCollectedCash ?: 0.0),
                        todaysPendingCash = todaysCash,
                        previousPendingCash = previousCash,
                        pendingJobsCount = pendingCashJobs.size,
                        pendingJobIds = pendingCashJobs.map { req -> req.id },
                        hasSubmittedHandover = hasSubmitted,
                        latestHandover = latestHandover,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isLoading = false,
                        errorMessage = e.localizedMessage ?: "Failed to compute EOD cash handover balance."
                    ) 
                }
            }
        }
    }

    fun submitHandover(notes: String) {
        val state = _uiState.value
        viewModelScope.launch {
            _uiState.update { it.copy(isSubmitting = true, errorMessage = null, successMessage = null) }
            try {
                val cashAmountToSubmit = if (state.allTimePendingCash > 0) {
                    state.allTimePendingCash
                } else {
                    state.latestHandover?.totalCollectedCash ?: 0.0
                }

                val requestIdsToSubmit = if (state.pendingJobIds.isNotEmpty()) {
                    state.pendingJobIds
                } else {
                    state.latestHandover?.completedRequests?.mapNotNull { item ->
                        when (item) {
                            is String -> item
                            is Map<*, *> -> (item["id"] ?: item["_id"])?.toString()
                            else -> item.toString()
                        }
                    } ?: emptyList()
                }

                val req = HandoverSubmitRequest(
                    totalCollectedCash = cashAmountToSubmit,
                    completedRequests = requestIdsToSubmit,
                    agentNotes = notes
                )

                val res = apiService.submitCashHandover(req)
                if (res.isSuccessful && res.body()?.success == true) {
                    _uiState.update { 
                        it.copy(
                            isSubmitting = false,
                            successMessage = "Cash handover submitted successfully for Store In-Charge verification."
                        ) 
                    }
                    loadData()
                } else {
                    _uiState.update { 
                        it.copy(
                            isSubmitting = false,
                            errorMessage = res.body()?.message ?: "Failed to submit cash handover."
                        ) 
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        isSubmitting = false,
                        errorMessage = e.localizedMessage ?: "An error occurred during submission."
                    ) 
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentCashHandoverScreen(
    viewModel: AgentCashHandoverViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var notesText by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.loadData()
    }

    if (uiState.isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else {
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header Row with Refresh
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            "End-of-Day Cash Handover",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            "Physical cash in hand collected right from Day 1 to present",
                            style = MaterialTheme.typography.bodySmall,
                            color = Color.Gray
                        )
                    }
                    IconButton(onClick = { viewModel.loadData() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            }

            // Error / Success Banners
            if (!uiState.errorMessage.isNullOrBlank()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFFEE2E2)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Warning, contentDescription = null, tint = Color.Red)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(uiState.errorMessage!!, color = Color(0xFF991B1B), fontSize = 13.sp)
                        }
                    }
                }
            }

            if (!uiState.successMessage.isNullOrBlank()) {
                item {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFD1FAE5)),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CheckCircle, contentDescription = null, tint = Color(0xFF059669))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(uiState.successMessage!!, color = Color(0xFF065F46), fontSize = 13.sp)
                        }
                    }
                }
            }

            // Hero Executive Summary Card (All-time Cash in Hand)
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.Transparent),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(
                                Brush.linearGradient(
                                    listOf(Color(0xFF0F172A), Color(0xFF1E3A8A), Color(0xFF0284C7))
                                )
                            )
                            .padding(20.dp)
                    ) {
                        Column(verticalArrangement = Arrangement.spacedBy(14.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column {
                                    Text(
                                        "TOTAL CASH IN HAND (ALL TIME)",
                                        color = Color.White.copy(alpha = 0.7f),
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Bold
                                    )
                                    Text(
                                        "₹${String.format("%.2f", uiState.allTimePendingCash)}",
                                        color = Color.White,
                                        fontWeight = FontWeight.Black,
                                        fontSize = 28.sp
                                    )
                                }
                                Surface(
                                    color = Color.White.copy(alpha = 0.15f),
                                    shape = RoundedCornerShape(12.dp)
                                ) {
                                    Box(modifier = Modifier.padding(10.dp)) {
                                        Icon(
                                            Icons.Default.AccountBalanceWallet,
                                            contentDescription = null,
                                            tint = Color.Yellow,
                                            modifier = Modifier.size(32.dp)
                                        )
                                    }
                                }
                            }

                            HorizontalDivider(color = Color.White.copy(alpha = 0.2f))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.Today, contentDescription = null, tint = Color.White.copy(alpha = 0.8f), modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("TODAY", color = Color.White.copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Text(
                                        "₹${String.format("%.2f", uiState.todaysPendingCash)}",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                }

                                Column {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(Icons.Default.History, contentDescription = null, tint = Color.White.copy(alpha = 0.8f), modifier = Modifier.size(14.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("PREVIOUS", color = Color.White.copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    }
                                    Text(
                                        "₹${String.format("%.2f", uiState.previousPendingCash)}",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                }

                                Column(horizontalAlignment = Alignment.End) {
                                    Text("UNSETTLED JOBS", color = Color.White.copy(alpha = 0.7f), fontSize = 10.sp, fontWeight = FontWeight.Bold)
                                    Text(
                                        "${uiState.pendingJobsCount}",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                }
                            }
                        }
                    }
                }
            }

            // Latest Handover Status Banner (if submitted or acknowledged)
            if (uiState.latestHandover != null) {
                val h = uiState.latestHandover!!
                item {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Latest Handover Status", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                                Surface(
                                    color = when (h.status.uppercase()) {
                                        "ACKNOWLEDGED" -> Color(0xFFD1FAE5)
                                        "DISCREPANCY" -> Color(0xFFFEE2E2)
                                        else -> Color(0xFFFEF3C7)
                                    },
                                    shape = RoundedCornerShape(6.dp)
                                ) {
                                    Text(
                                        h.status.uppercase(),
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 12.sp,
                                        color = when (h.status.uppercase()) {
                                            "ACKNOWLEDGED" -> Color(0xFF059669)
                                            "DISCREPANCY" -> Color(0xFFDC2626)
                                            else -> Color(0xFFD97706)
                                        },
                                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                    )
                                }
                            }

                            Text("Submitted Amount: ₹${String.format("%.2f", h.totalCollectedCash)}", fontSize = 13.sp)

                            if (!h.agentNotes.isNullOrBlank()) {
                                Text("Agent Remarks: ${h.agentNotes}", fontSize = 12.sp, color = Color.Gray)
                            }

                            if (!h.inchargeNotes.isNullOrBlank()) {
                                Text("Store In-Charge Remarks: ${h.inchargeNotes}", fontSize = 12.sp, color = Color.DarkGray)
                            }

                            if (h.status.equals("DISCREPANCY", ignoreCase = true) && h.discrepancyAmount != null) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Warning, contentDescription = null, tint = Color.Red, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Discrepancy Flagged: ₹${String.format("%.2f", h.discrepancyAmount)}", color = Color.Red, fontWeight = FontWeight.Bold, fontSize = 13.sp)
                                }
                            }
                        }
                    }
                }
            }

            // Action Form / All Settled Card
            item {
                if (uiState.allTimePendingCash > 0) {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            Text("Submit Physical Cash Handover", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                            Text(
                                "Submit all accumulated cash of ₹${String.format("%.2f", uiState.allTimePendingCash)} in your possession to Store In-Charge for verification.",
                                fontSize = 13.sp,
                                color = Color.Gray
                            )

                            OutlinedTextField(
                                value = notesText,
                                onValueChange = { notesText = it },
                                label = { Text("Denomination remarks / Notes (Optional)") },
                                placeholder = { Text("e.g. ₹500x4, ₹200x5...") },
                                modifier = Modifier.fillMaxWidth()
                            )

                            Button(
                                onClick = { viewModel.submitHandover(notesText) },
                                modifier = Modifier.fillMaxWidth(),
                                enabled = !uiState.isSubmitting && uiState.allTimePendingCash > 0,
                                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                            ) {
                                if (uiState.isSubmitting) {
                                    CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                                } else {
                                    Icon(Icons.Default.CheckCircle, contentDescription = null)
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Submit Handover (₹${String.format("%.2f", uiState.allTimePendingCash)})")
                                }
                            }
                        }
                    }
                } else {
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFFF0FDF4)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .padding(24.dp)
                                .fillMaxWidth(),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Icon(
                                Icons.Default.CheckCircle,
                                contentDescription = null,
                                tint = Color(0xFF16A34A),
                                modifier = Modifier.size(48.dp)
                            )
                            Text(
                                "All Cash Handed Over & Settled!",
                                fontWeight = FontWeight.Bold,
                                fontSize = 16.sp,
                                color = Color(0xFF15803D)
                            )
                            Text(
                                "You currently have zero pending cash balance in hand.",
                                fontSize = 13.sp,
                                color = Color(0xFF166534)
                            )
                        }
                    }
                }
            }
        }
    }
}
