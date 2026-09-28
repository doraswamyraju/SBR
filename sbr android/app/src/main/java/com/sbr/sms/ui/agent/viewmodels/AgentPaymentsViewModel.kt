package com.sbr.sms.ui.agent.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.CredentialManager
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

enum class PaymentDateFilter(val label: String) {
    TODAY("Today"),
    YESTERDAY("Yesterday"),
    THIS_WEEK("This Week"),
    THIS_MONTH("This Month"),
    ALL("All Time")
}

data class AgentPaymentInfo(
    val request: ServiceRequest,
    val customer: Customer?
)

data class AgentPaymentStats(
    val totalCollections: Double = 0.0,
    val filteredCollections: Double = 0.0,
    val todaysCollections: Double = 0.0,
    val cashCollections: Double = 0.0,
    val onlineCollections: Double = 0.0,
    val settledHandovers: Double = 0.0,
    val pendingEodCash: Double = 0.0
)

sealed interface AgentPaymentsUiState {
    object Loading : AgentPaymentsUiState
    data class Success(
        val stats: AgentPaymentStats,
        val transactions: List<AgentPaymentInfo>,
        val activeFilter: PaymentDateFilter
    ) : AgentPaymentsUiState
    data class Error(val message: String) : AgentPaymentsUiState
}

@HiltViewModel
class AgentPaymentsViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository,
    private val apiService: ApiService,
    private val auth: FirebaseAuth,
    private val credentialManager: CredentialManager
) : ViewModel() {

    private val _uiState = MutableStateFlow<AgentPaymentsUiState>(AgentPaymentsUiState.Loading)
    val uiState: StateFlow<AgentPaymentsUiState> = _uiState.asStateFlow()

    private val _selectedFilter = MutableStateFlow(PaymentDateFilter.TODAY)
    val selectedFilter: StateFlow<PaymentDateFilter> = _selectedFilter.asStateFlow()

    private var allHistoryRequests: List<ServiceRequest> = emptyList()
    private var customerMap: Map<String, Customer> = emptyMap()
    private var settledHandoversTotal: Double = 0.0

    init {
        loadPaymentData()
    }

    fun setDateFilter(filter: PaymentDateFilter) {
        _selectedFilter.value = filter
        applyFilterAndEmit()
    }

    fun reload() {
        loadPaymentData()
    }

    private fun loadPaymentData() {
        viewModelScope.launch {
            _uiState.value = AgentPaymentsUiState.Loading
            val agentId = credentialManager.getUserId()?.takeIf { it.isNotBlank() } ?: auth.currentUser?.uid
            if (agentId == null) {
                _uiState.value = AgentPaymentsUiState.Error("Agent not logged in.")
                return@launch
            }

            try {
                // Fetch handovers to compute settled vs pending cash
                try {
                    val handRes = apiService.getAllHandovers()
                    if (handRes.isSuccessful && handRes.body()?.success == true) {
                        val handovers: List<com.sbr.sms.data.models.CashHandover> = handRes.body()?.data ?: emptyList()
                        settledHandoversTotal = handovers.filter { it.status.equals("ACKNOWLEDGED", ignoreCase = true) }.sumOf { it.totalCollectedCash }
                    }
                } catch (e: Exception) {
                    // non-blocking for handovers fetch
                }

                val allRequests = serviceRequestRepository.getAllRequests()
                val paymentHistory = allRequests.filter { req ->
                    val isMyJob = req.assignedAgentId.isNullOrBlank() || req.assignedAgentId == agentId
                    val isPaid = req.paymentStatus.equals("Paid", ignoreCase = true) || req.status.equals("Completed", ignoreCase = true)
                    val amt = (req.finalAmount?.takeIf { it > 0 } ?: req.paymentAmount ?: 0.0)
                    isMyJob && isPaid && amt > 0
                }

                allHistoryRequests = paymentHistory
                applyFilterAndEmit()
            } catch (e: Exception) {
                _uiState.value = AgentPaymentsUiState.Error(e.localizedMessage ?: "Failed to load payment history")
            }
        }
    }

    private fun applyFilterAndEmit() {
        if (allHistoryRequests.isEmpty()) {
            _uiState.value = AgentPaymentsUiState.Success(
                stats = AgentPaymentStats(),
                transactions = emptyList(),
                activeFilter = _selectedFilter.value
            )
            return
        }

        val cal = Calendar.getInstance()
        val now = cal.time

        fun isSameDay(d1: Date?, d2: Date): Boolean {
            if (d1 == null) return false
            val c1 = Calendar.getInstance().apply { time = d1 }
            val c2 = Calendar.getInstance().apply { time = d2 }
            return c1.get(Calendar.YEAR) == c2.get(Calendar.YEAR) &&
                    c1.get(Calendar.DAY_OF_YEAR) == c2.get(Calendar.DAY_OF_YEAR)
        }

        fun getEffectiveDate(req: ServiceRequest): Date? {
            return req.paymentTimestamp ?: req.completedAt ?: req.updatedAt ?: req.createdAt
        }

        fun getReqAmount(r: ServiceRequest): Double {
            return (r.finalAmount?.takeIf { it > 0 } ?: r.paymentAmount ?: 0.0)
        }

        val filteredRequests = allHistoryRequests.filter { req ->
            val timestamp = getEffectiveDate(req)
            when (_selectedFilter.value) {
                PaymentDateFilter.TODAY -> isSameDay(timestamp, now)
                PaymentDateFilter.YESTERDAY -> {
                    val yest = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -1) }.time
                    isSameDay(timestamp, yest)
                }
                PaymentDateFilter.THIS_WEEK -> {
                    val weekAgo = Calendar.getInstance().apply { add(Calendar.DAY_OF_YEAR, -7) }.time
                    timestamp != null && timestamp.after(weekAgo)
                }
                PaymentDateFilter.THIS_MONTH -> {
                    val cReq = Calendar.getInstance().apply { if (timestamp != null) time = timestamp }
                    val cNow = Calendar.getInstance()
                    timestamp != null && cReq.get(Calendar.YEAR) == cNow.get(Calendar.YEAR) && cReq.get(Calendar.MONTH) == cNow.get(Calendar.MONTH)
                }
                PaymentDateFilter.ALL -> true
            }
        }

        val totalCollections = allHistoryRequests.sumOf { getReqAmount(it) }
        val filteredCollections = filteredRequests.sumOf { getReqAmount(it) }

        val todaysCollections = allHistoryRequests.filter { isSameDay(getEffectiveDate(it), now) }.sumOf { getReqAmount(it) }
        val cashCollections = allHistoryRequests.filter {
            it.paymentMethod?.uppercase()?.contains("CASH") == true || it.paymentMethod.isNullOrBlank()
        }.sumOf { getReqAmount(it) }
        val onlineCollections = allHistoryRequests.filter {
            it.paymentMethod?.uppercase()?.contains("ONLINE") == true || it.paymentMethod?.uppercase()?.contains("UPI") == true
        }.sumOf { getReqAmount(it) }

        val pendingEodCash = (cashCollections - settledHandoversTotal).coerceAtLeast(0.0)

        val transactions = filteredRequests.map { req ->
            AgentPaymentInfo(
                request = req,
                customer = customerMap[req.customerId]
            )
        }

        val stats = AgentPaymentStats(
            totalCollections = totalCollections,
            filteredCollections = filteredCollections,
            todaysCollections = todaysCollections,
            cashCollections = cashCollections,
            onlineCollections = onlineCollections,
            settledHandovers = settledHandoversTotal,
            pendingEodCash = pendingEodCash
        )

        _uiState.value = AgentPaymentsUiState.Success(
            stats = stats,
            transactions = transactions,
            activeFilter = _selectedFilter.value
        )
    }
}