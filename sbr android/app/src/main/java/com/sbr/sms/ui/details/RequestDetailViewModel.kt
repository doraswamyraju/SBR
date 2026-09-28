package com.sbr.sms.ui.details

import android.util.Log
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.models.User
import com.sbr.sms.data.models.UserRole
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import com.google.firebase.auth.FirebaseAuth
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface RequestDetailUiState {
    object Loading : RequestDetailUiState
    data class Success(
        val request: ServiceRequest,
        val agent: Agent?,
        val customer: User?,
        val viewerRole: UserRole?
    ) : RequestDetailUiState
    data class Error(val message: String) : RequestDetailUiState
}

@HiltViewModel
@OptIn(ExperimentalCoroutinesApi::class)
class RequestDetailViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository,
    private val auth: FirebaseAuth,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    val requestId: String = checkNotNull(savedStateHandle["requestId"])

    val availableAgents: StateFlow<List<Agent>> = userRepository.getAllUsersFlow()
        .map { users -> users.filterIsInstance<Agent>() }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val uiState: StateFlow<RequestDetailUiState> =
        serviceRequestRepository.getRequestStreamById(requestId)
            .flatMapLatest { request ->
                if (request == null) {
                    flowOf(RequestDetailUiState.Error("Request not found or has been deleted."))
                } else {
                    val viewerId = auth.currentUser?.uid

                    val agentFlow = flow { emit(userRepository.getUser(request.assignedAgentId ?: "") as? Agent) }
                    val customerFlow = flow { emit(userRepository.getUser(request.customerId)) }
                    val viewerFlow = flow { emit(userRepository.getUser(viewerId ?: "")?.role) }

                    combine(agentFlow, customerFlow, viewerFlow) { agent, customer, viewerRole ->
                        RequestDetailUiState.Success(request, agent, customer, viewerRole) as RequestDetailUiState
                    }
                }
            }.catch { e ->
                Log.e("RequestDetailVM", "Error loading request details", e)
                emit(RequestDetailUiState.Error(e.message ?: "An unknown error occurred."))
            }.stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = RequestDetailUiState.Loading
            )

    fun reassignTechnician(agentId: String, onSuccess: () -> Unit = {}) {
        viewModelScope.launch {
            try {
                serviceRequestRepository.assignRequest(requestId, agentId)
                onSuccess()
            } catch (e: Exception) {
                Log.e("RequestDetailVM", "Failed to assign technician", e)
            }
        }
    }
}