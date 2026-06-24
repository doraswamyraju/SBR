package com.sbr.sms.ui.agent.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
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

data class AgentPaymentInfo(
    val request: ServiceRequest,
    val customer: Customer?
)

data class AgentPaymentStats(
    val totalCollections: Double = 0.0,
    val todaysCollections: Double = 0.0
)

sealed interface AgentPaymentsUiState {
    object Loading : AgentPaymentsUiState
    data class Success(
        val stats: AgentPaymentStats,
        val transactions: List<AgentPaymentInfo>
    ) : AgentPaymentsUiState
    data class Error(val message: String) : AgentPaymentsUiState
}

@HiltViewModel
class AgentPaymentsViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository,
    private val auth: FirebaseAuth
) : ViewModel() {

    // Use a private, mutable state flow that we update directly.
    private val _uiState = MutableStateFlow<AgentPaymentsUiState>(AgentPaymentsUiState.Loading)
    val uiState: StateFlow<AgentPaymentsUiState> = _uiState.asStateFlow()

    init {
        loadPaymentData()
    }

    private fun loadPaymentData() {
        viewModelScope.launch {
            val agentId = auth.currentUser?.uid
            if (agentId == null) {
                _uiState.value = AgentPaymentsUiState.Error("Agent not logged in.")
                return@launch
            }

            // Get the stream of paid requests for the current agent
            serviceRequestRepository.getPaymentHistoryStream(agentId)
                .catch { e ->
                    // Handle errors from the stream
                    _uiState.value = AgentPaymentsUiState.Error(e.message ?: "An unknown error occurred")
                }
                .collect { history ->
                    // For each new list of payments, process it into the final UI state
                    if (history.isEmpty()) {
                        _uiState.value = AgentPaymentsUiState.Success(AgentPaymentStats(), emptyList())
                    } else {
                        // Get customer details for the current list of payments
                        val customerIds = history.map { it.customerId }.distinct()
                        val users = userRepository.getUsersByIds(customerIds).first() // a one-time fetch
                        val usersMap = users.associateBy { it.id }

                        // Combine the data
                        val transactionInfoList = history.map { request ->
                            AgentPaymentInfo(
                                request = request,
                                customer = usersMap[request.customerId] as? Customer
                            )
                        }

                        // Calculate stats
                        val totalCollections = history.sumOf { it.paymentAmount ?: 0.0 }
                        val todaysCollections = history.filter {
                            it.paymentTimestamp?.let { timestamp ->
                                val cal = Calendar.getInstance()
                                val todayStart = cal.apply { set(Calendar.HOUR_OF_DAY, 0); set(Calendar.MINUTE, 0); set(Calendar.SECOND, 0) }.time
                                val todayEnd = cal.apply { set(Calendar.HOUR_OF_DAY, 23); set(Calendar.MINUTE, 59); set(Calendar.SECOND, 59) }.time
                                timestamp.after(todayStart) && timestamp.before(todayEnd)
                            } ?: false
                        }.sumOf { it.paymentAmount ?: 0.0 }

                        val stats = AgentPaymentStats(
                            totalCollections = totalCollections,
                            todaysCollections = todaysCollections
                        )

                        // Update the state with the final combined data
                        _uiState.value = AgentPaymentsUiState.Success(stats, transactionInfoList)
                    }
                }
        }
    }
}