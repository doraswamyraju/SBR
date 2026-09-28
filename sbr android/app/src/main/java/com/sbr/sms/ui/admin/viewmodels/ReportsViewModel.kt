package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.models.UserRole
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import java.util.Calendar
import java.util.Date
import javax.inject.Inject

data class AgentPerformance(
    val id: String,
    val name: String,
    val phone: String,
    val completedJobs: Int,
    val totalRevenue: Double,
    val rating: Float
)

data class ReportsData(
    val totalRevenue: Double = 0.0,
    val cashRevenue: Double = 0.0,
    val onlineRevenue: Double = 0.0,
    val totalTickets: Int = 0,
    val completedTickets: Int = 0,
    val pendingTickets: Int = 0,
    val inProgressTickets: Int = 0,
    val customerSatisfaction: Float = 96.0f,
    val topAgents: List<AgentPerformance> = emptyList(),
    val serviceTypeCounts: Map<String, Int> = emptyMap()
)

@HiltViewModel
class ReportsViewModel @Inject constructor(
    private val requestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    val selectedFilter = MutableStateFlow("This Month") // "Today", "This Week", "This Month", "All Time"
    val reportsData = MutableStateFlow(ReportsData())
    val isLoading = MutableStateFlow(false)

    init {
        loadReports()
    }

    fun setFilter(filter: String) {
        selectedFilter.value = filter
        loadReports()
    }

    fun loadReports() {
        viewModelScope.launch {
            isLoading.value = true
            try {
                combine(
                    requestRepository.getAllRequestsStream(),
                    userRepository.getAllUsersFlow()
                ) { allRequests, allUsers ->
                    val filteredRequests = filterRequestsByDate(allRequests, selectedFilter.value)

                    val totalRevenue = filteredRequests
                        .filter { it.paymentStatus.equals("Paid", ignoreCase = true) || it.status.equals("Completed", ignoreCase = true) }
                        .sumOf { it.finalAmount ?: it.paymentAmount ?: 0.0 }

                    val cashRevenue = filteredRequests
                        .filter { (it.paymentStatus.equals("Paid", ignoreCase = true) || it.status.equals("Completed", ignoreCase = true)) && it.paymentMethod?.contains("cash", ignoreCase = true) == true }
                        .sumOf { it.finalAmount ?: it.paymentAmount ?: 0.0 }

                    val onlineRevenue = totalRevenue - cashRevenue

                    val completedCount = filteredRequests.count { it.status.equals("Completed", ignoreCase = true) }
                    val pendingCount = filteredRequests.count { it.status.equals("Pending", ignoreCase = true) }
                    val inProgressCount = filteredRequests.count { it.status.equals("In Progress", ignoreCase = true) || it.status.equals("Accepted", ignoreCase = true) }

                    // Agent Performance Leaderboard
                    val agents = allUsers.filterIsInstance<Agent>()
                    val topAgents = agents.map { agent ->
                        val agentRequests = filteredRequests.filter { it.assignedAgentId == agent.id }
                        val jobsCount = agentRequests.count { it.status.equals("Completed", ignoreCase = true) }
                        val rev = agentRequests.sumOf { it.finalAmount ?: it.paymentAmount ?: 0.0 }
                        AgentPerformance(
                            id = agent.id,
                            name = agent.name,
                            phone = agent.phone ?: "",
                            completedJobs = jobsCount,
                            totalRevenue = rev,
                            rating = agent.rating
                        )
                    }.sortedByDescending { it.completedJobs }

                    // Service Type breakdown
                    val serviceTypeCounts = filteredRequests.groupBy { it.serviceType }.mapValues { it.value.size }

                    // Satisfaction
                    val ratedAgents = agents.filter { it.rating > 0 }
                    val satisfaction = if (ratedAgents.isNotEmpty()) {
                        (ratedAgents.map { it.rating.toDouble() }.average() / 5.0 * 100.0).toFloat()
                    } else {
                        96.0f
                    }

                    ReportsData(
                        totalRevenue = totalRevenue,
                        cashRevenue = cashRevenue,
                        onlineRevenue = onlineRevenue.coerceAtLeast(0.0),
                        totalTickets = filteredRequests.size,
                        completedTickets = completedCount,
                        pendingTickets = pendingCount,
                        inProgressTickets = inProgressCount,
                        customerSatisfaction = satisfaction,
                        topAgents = topAgents,
                        serviceTypeCounts = serviceTypeCounts
                    )
                }.collect {
                    reportsData.value = it
                    isLoading.value = false
                }
            } catch (e: Exception) {
                isLoading.value = false
            }
        }
    }

    private fun filterRequestsByDate(requests: List<ServiceRequest>, filter: String): List<ServiceRequest> {
        val calendar = Calendar.getInstance()
        val now = Date()

        return when (filter) {
            "Today" -> {
                calendar.time = now
                calendar.set(Calendar.HOUR_OF_DAY, 0)
                calendar.set(Calendar.MINUTE, 0)
                calendar.set(Calendar.SECOND, 0)
                val startOfDay = calendar.time
                requests.filter { it.createdAt != null && it.createdAt >= startOfDay }
            }
            "This Week" -> {
                calendar.time = now
                calendar.set(Calendar.DAY_OF_WEEK, calendar.firstDayOfWeek)
                calendar.set(Calendar.HOUR_OF_DAY, 0)
                calendar.set(Calendar.MINUTE, 0)
                calendar.set(Calendar.SECOND, 0)
                val startOfWeek = calendar.time
                requests.filter { it.createdAt != null && it.createdAt >= startOfWeek }
            }
            "This Month" -> {
                calendar.time = now
                calendar.set(Calendar.DAY_OF_MONTH, 1)
                calendar.set(Calendar.HOUR_OF_DAY, 0)
                calendar.set(Calendar.MINUTE, 0)
                calendar.set(Calendar.SECOND, 0)
                val startOfMonth = calendar.time
                requests.filter { it.createdAt != null && it.createdAt >= startOfMonth }
            }
            else -> requests
        }
    }
}
