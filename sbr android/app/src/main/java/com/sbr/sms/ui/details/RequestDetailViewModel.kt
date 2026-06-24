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
import javax.inject.Inject

sealed interface RequestDetailUiState {
    object Loading : RequestDetailUiState
    // NEW: The Success state now includes the role of the person viewing the screen.
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
    serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository,
    // NEW: Inject FirebaseAuth to get the current user's ID.
    private val auth: FirebaseAuth,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val requestId: String = checkNotNull(savedStateHandle["requestId"])

    val uiState: StateFlow<RequestDetailUiState> =
        serviceRequestRepository.getRequestStreamById(requestId)
            .flatMapLatest { request ->
                if (request == null) {
                    flowOf(RequestDetailUiState.Error("Request not found or has been deleted."))
                } else {
                    // Get the ID of the currently logged-in user.
                    val viewerId = auth.currentUser?.uid

                    // Create flows to fetch the agent, customer, and viewer's role data.
                    val agentFlow = flow { emit(userRepository.getUser(request.assignedAgentId ?: "") as? Agent) }
                    val customerFlow = flow { emit(userRepository.getUser(request.customerId)) }
                    val viewerFlow = flow { emit(userRepository.getUser(viewerId ?: "")?.role) }

                    // Combine all data streams into one final UI state.
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
}