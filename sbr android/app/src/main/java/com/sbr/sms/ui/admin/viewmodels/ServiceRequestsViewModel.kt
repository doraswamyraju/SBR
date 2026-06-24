package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.models.UserRole
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

data class UiRequest(
    val request: ServiceRequest,
    val agentName: String = "Unassigned"
)

sealed interface ServiceRequestUiState {
    object Loading : ServiceRequestUiState
    data class Success(val uiRequests: List<UiRequest>) : ServiceRequestUiState
    data class Error(val message: String) : ServiceRequestUiState
}

@HiltViewModel
class ServiceRequestsViewModel @Inject constructor(
    private val serviceRepo: ServiceRequestRepository,
    private val userRepo: UserRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ServiceRequestUiState>(ServiceRequestUiState.Loading)
    val uiState: StateFlow<ServiceRequestUiState> = _uiState.asStateFlow()

    init {
        observeRequestsAndAgents()
    }

    private fun observeRequestsAndAgents() {
        viewModelScope.launch {
            combine(
                serviceRepo.getAllRequestsStream(),
                userRepo.getAllUsersFlow()
            ) { requests, users ->
                val agentNameMap = users
                    .filter { it.role == UserRole.AGENT }
                    .associateBy({ it.id }, { it.name })
                val uiRequests = requests.map { request ->
                    UiRequest(
                        request = request,
                        agentName = agentNameMap[request.assignedAgentId] ?: "Unassigned"
                    )
                }
                ServiceRequestUiState.Success(uiRequests)
            }.catch { e ->
                _uiState.value = ServiceRequestUiState.Error(e.message ?: "An unknown error occurred")
            }.collect { combinedState ->
                _uiState.value = combinedState
            }
        }
    }

    fun deleteRequest(requestId: String) {
        viewModelScope.launch {
            try {
                serviceRepo.deleteRequest(requestId)
            } catch (e: Exception) {
                println("Error deleting request: ${e.message}")
            }
        }
    }

    fun assignRequest(requestId: String, agentId: String) {
        viewModelScope.launch {
            try {
                serviceRepo.assignRequest(requestId, agentId)
            } catch (e: Exception) {
                println("Error assigning request: ${e.message}")
            }
        }
    }
}
