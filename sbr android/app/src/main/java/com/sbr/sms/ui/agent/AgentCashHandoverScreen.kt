package com.sbr.sms.ui.agent

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
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
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AgentCashHandoverViewModel @Inject constructor(
    private val apiService: ApiService
) : ViewModel() {
    val dailySummary = MutableStateFlow<AgentDailySummary?>(null)
    val isLoading = MutableStateFlow(false)
    val isSubmitting = MutableStateFlow(false)
    val message = MutableStateFlow<String?>(null)

    init {
        loadSummary()
    }

    fun loadSummary() {
        viewModelScope.launch {
            isLoading.value = true
            try {
                val res = apiService.getAgentDailySummary()
                if (res.isSuccessful && res.body()?.success == true) {
                    dailySummary.value = res.body()?.data
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            } finally {
                isLoading.value = false
            }
        }
    }

    fun submitHandover(notes: String) {
        val summary = dailySummary.value ?: return
        viewModelScope.launch {
            isSubmitting.value = true
            try {
                val req = HandoverSubmitRequest(
                    totalCollectedCash = summary.totalCollectedCash,
                    completedRequests = summary.completedRequestIds,
                    agentNotes = notes
                )
                val res = apiService.submitCashHandover(req)
                if (res.isSuccessful) {
                    loadSummary()
                }
            } catch (e: Exception) {
                message.value = e.localizedMessage
            } finally {
                isSubmitting.value = false
            }
        }
    }
}

@Composable
fun AgentCashHandoverScreen(
    viewModel: AgentCashHandoverViewModel = hiltViewModel()
) {
    val summary by viewModel.dailySummary.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()

    var notesText by remember { mutableStateOf("") }

    if (isLoading) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            CircularProgressIndicator()
        }
    } else {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Summary Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = Color.Transparent)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .background(
                            Brush.linearGradient(
                                listOf(Color(0xFF1E3A8A), Color(0xFF0284C7))
                            )
                        )
                        .padding(18.dp)
                ) {
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("End-of-Day Cash Handover", color = Color.White, fontWeight = FontWeight.Bold, fontSize = 18.sp)
                        Text("Reconcile field collections with Store In-Charge", color = Color.White.copy(alpha = 0.8f), fontSize = 12.sp)

                        HorizontalDivider(color = Color.White.copy(alpha = 0.2f))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column {
                                Text("TODAY'S CASH", color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("₹${String.format("%.2f", summary?.totalCollectedCash ?: 0.0)}", color = Color.White, fontWeight = FontWeight.Black, fontSize = 22.sp)
                            }
                            Column(horizontalAlignment = Alignment.End) {
                                Text("JOBS COMPLETED", color = Color.White.copy(alpha = 0.7f), fontSize = 11.sp, fontWeight = FontWeight.Bold)
                                Text("${summary?.completedJobsCount ?: 0}", color = Color.White, fontWeight = FontWeight.Black, fontSize = 22.sp)
                            }
                        }
                    }
                }
            }

            // Handover Status or Form
            if (summary?.hasSubmittedHandover == true && summary?.latestHandover != null) {
                val h = summary!!.latestHandover!!
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
                            Text("Submission Status", fontWeight = FontWeight.Bold)
                            Surface(
                                color = when (h.status) {
                                    "ACKNOWLEDGED" -> Color(0xFFD1FAE5)
                                    "DISCREPANCY" -> Color(0xFFFEE2E2)
                                    else -> Color(0xFFFEF3C7)
                                },
                                shape = RoundedCornerShape(6.dp)
                            ) {
                                Text(
                                    h.status,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 12.sp,
                                    color = when (h.status) {
                                        "ACKNOWLEDGED" -> Color(0xFF059669)
                                        "DISCREPANCY" -> Color(0xFFDC2626)
                                        else -> Color(0xFFD97706)
                                    },
                                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
                                )
                            }
                        }

                        Text("Submitted: ₹${String.format("%.2f", h.totalCollectedCash)}")
                        if (!h.inchargeNotes.isNullOrBlank()) {
                            Text("Store Notes: ${h.inchargeNotes}", fontSize = 12.sp, color = Color.DarkGray)
                        }
                        if (h.status == "DISCREPANCY" && h.discrepancyAmount != null) {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Icon(Icons.Default.Warning, contentDescription = null, tint = Color.Red, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Discrepancy: ₹${String.format("%.2f", h.discrepancyAmount)}", color = Color.Red, fontWeight = FontWeight.Bold)
                            }
                        }
                    }
                }
            } else {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp),
                    colors = CardDefaults.cardColors(containerColor = Color.White),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                        Text("Submit Daily Handover", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Text(
                            "Submit today's collected cash of ₹${String.format("%.2f", summary?.totalCollectedCash ?: 0.0)} for verification by the Store In-Charge.",
                            fontSize = 13.sp,
                            color = Color.Gray
                        )

                        OutlinedTextField(
                            value = notesText,
                            onValueChange = { notesText = it },
                            label = { Text("Notes / Denomination remarks (Optional)") },
                            modifier = Modifier.fillMaxWidth()
                        )

                        Button(
                            onClick = { viewModel.submitHandover(notesText) },
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !isSubmitting && (summary?.totalCollectedCash ?: 0.0) >= 0,
                            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF0284C7))
                        ) {
                            if (isSubmitting) {
                                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
                            } else {
                                Icon(Icons.Default.CheckCircle, contentDescription = null)
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Submit Handover")
                            }
                        }
                    }
                }
            }
        }
    }
}
