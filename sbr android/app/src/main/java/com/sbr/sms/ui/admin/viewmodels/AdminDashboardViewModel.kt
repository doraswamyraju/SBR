package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.DashboardStats
import com.sbr.sms.data.models.User
import com.sbr.sms.data.models.UserRole
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface AdminDashboardUiState {
    object Loading : AdminDashboardUiState
    data class Success(val stats: DashboardStats, val availableAgents: List<User>) : AdminDashboardUiState
    data class Error(val message: String) : AdminDashboardUiState
}

@HiltViewModel
class AdminDashboardViewModel @Inject constructor(
    private val requestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AdminDashboardUiState>(AdminDashboardUiState.Loading)
    val uiState: StateFlow<AdminDashboardUiState> = _uiState.asStateFlow()

    init {
        // Use a reactive approach to load dashboard data.
        observeDashboardData()
    }

    private fun observeDashboardData() {
        // Combine the streams of requests and users to build the dashboard state.
        viewModelScope.launch {
            combine(
                requestRepository.getAllRequestsStream(),
                userRepository.getAllUsersFlow()
            ) { allRequests, allUsers ->
                val agents = allUsers.filter { it.role == UserRole.AGENT }
                val agentList = agents.filterIsInstance<com.sbr.sms.data.models.Agent>()
                val activeAgentCount = agentList.count { it.status == "Active" }

                // Only count completed requests that haven't been paid yet
                val pendingPaymentCount = allRequests.count { req ->
                    req.status.equals("Completed", ignoreCase = true) &&
                    !req.paymentStatus.equals("Paid", ignoreCase = true)
                }

                // Compute real satisfaction from agent ratings or default to 96f
                val agentsWithRating = agentList.filter { it.rating > 0 }
                val satisfactionScore = if (agentsWithRating.isNotEmpty()) {
                    ((agentsWithRating.map { it.rating.toDouble() }.average() / 5.0) * 100.0).toFloat()
                } else {
                    96f
                }

                val stats = DashboardStats(
                    totalRequests = allRequests.size,
                    activeAgents = if (activeAgentCount > 0) activeAgentCount else agents.size,
                    pendingPayments = pendingPaymentCount,
                    customerSatisfaction = satisfactionScore,
                    recentPendingRequests = allRequests
                        .filter { it.status == "Pending" || it.assignedAgentId.isNullOrBlank() }
                        .sortedByDescending { it.createdAt }
                        .take(5)
                )
                AdminDashboardUiState.Success(stats, agents)

            }.catch { e ->
                _uiState.value = AdminDashboardUiState.Error(e.message ?: "An error occurred")
            }.collect { state ->
                _uiState.value = state
            }
        }
    }

    fun assignAgentToRequest(requestId: String, agentId: String) {
        viewModelScope.launch {
            try {
                requestRepository.assignRequest(requestId, agentId)
                // No need to manually reload data, the stream will update automatically.
            } catch (e: Exception) {
                println("Failed to assign agent: ${e.message}")
                // Optionally update UI with an error message
            }
        }
    }
}