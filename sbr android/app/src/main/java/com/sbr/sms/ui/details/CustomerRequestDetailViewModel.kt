package com.sbr.sms.ui.details

import android.util.Log
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.repositories.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

// This UI state is specific to the customer's view.
sealed interface CustomerRequestDetailUiState {
    object Loading : CustomerRequestDetailUiState
    data class Success(val request: ServiceRequest, val agent: Agent?) : CustomerRequestDetailUiState
    data class Error(val message: String) : CustomerRequestDetailUiState
}

@HiltViewModel
class CustomerRequestDetailViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val userRepository: UserRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val requestId: String = checkNotNull(savedStateHandle["requestId"])

    // Use a private, mutable state flow that we control directly.
    private val _uiState = MutableStateFlow<CustomerRequestDetailUiState>(CustomerRequestDetailUiState.Loading)
    val uiState: StateFlow<CustomerRequestDetailUiState> = _uiState.asStateFlow()

    init {
        loadDetails()
    }

    private fun loadDetails() {
        viewModelScope.launch {
            // Use a simple try-catch block to handle any errors from the data stream.
            try {
                // Get a real-time stream of the service request.
                serviceRequestRepository.getRequestStreamById(requestId)
                    .collect { request ->
                        if (request == null) {
                            _uiState.value = CustomerRequestDetailUiState.Error("Request not found.")
                        } else {
                            // When a request is received, fetch its agent details
                            val agent = userRepository.getUser(request.assignedAgentId ?: "") as? Agent
                            // Update the state with the complete data
                            _uiState.value = CustomerRequestDetailUiState.Success(request, agent)
                        }
                    }
            } catch (e: Exception) {
                // If the stream itself throws an exception, set the error state.
                Log.e("CustomerRequestDetailVM", "Error collecting request details", e)
                _uiState.value = CustomerRequestDetailUiState.Error(e.message ?: "An unknown error occurred.")
            }
        }
    }
}