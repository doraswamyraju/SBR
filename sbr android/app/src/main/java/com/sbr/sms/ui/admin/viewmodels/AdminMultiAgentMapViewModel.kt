package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import javax.inject.Inject

data class TrackedAgentInfo(
    val request: ServiceRequest,
    val agent: Agent,
    val customer: Customer
)

sealed interface MultiAgentUiState {
    object Loading : MultiAgentUiState
    data class Success(val trackedAgents: List<TrackedAgentInfo>) : MultiAgentUiState
    data class Error(val message: String) : MultiAgentUiState
}

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
class AdminMultiAgentMapViewModel @Inject constructor(
    serviceRequestRepository: ServiceRequestRepository,
    userRepository: UserRepository
) : ViewModel() {

    val uiState: StateFlow<MultiAgentUiState> =
        serviceRequestRepository.getActiveRequestsStream()
            .flatMapLatest { activeRequests ->
                if (activeRequests.isEmpty()) {
                    return@flatMapLatest flowOf(MultiAgentUiState.Success(emptyList()) as MultiAgentUiState)
                }
                val userIds = (activeRequests.mapNotNull { it.assignedAgentId } +
                        activeRequests.map { it.customerId }).distinct()

                userRepository.getUsersByIds(userIds).map { users ->
                    val usersMap = users.associateBy { it.id }
                    val trackedAgentInfoList = activeRequests.map { request ->
                        val agentObj = (usersMap[request.assignedAgentId] as? Agent) ?: Agent(
                            id = request.assignedAgentId ?: "",
                            name = request.assignedAgentName ?: "Technician",
                            phone = request.assignedAgentPhone
                        )
                        val customerObj = (usersMap[request.customerId] as? Customer) ?: Customer(
                            id = request.customerId,
                            name = request.customerName ?: "Customer",
                            phone = request.customerPhone
                        )
                        TrackedAgentInfo(request, agentObj, customerObj)
                    }
                    MultiAgentUiState.Success(trackedAgentInfoList) as MultiAgentUiState
                }
            }
            .catch { e -> emit(MultiAgentUiState.Error(e.message ?: "An error occurred")) }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = MultiAgentUiState.Loading
            )
}