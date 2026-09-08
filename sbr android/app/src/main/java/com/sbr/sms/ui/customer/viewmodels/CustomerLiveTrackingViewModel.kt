package com.sbr.sms.ui.customer.viewmodels

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.AgentLocation
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

sealed interface LiveTrackingUiState {
    object Loading : LiveTrackingUiState
    data class Success(
        val request: ServiceRequest,
        val location: AgentLocation?
    ) : LiveTrackingUiState
    data class Error(val message: String) : LiveTrackingUiState
}

@HiltViewModel
class CustomerLiveTrackingViewModel @Inject constructor(
    serviceRequestRepository: ServiceRequestRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val requestId: String = checkNotNull(savedStateHandle["requestId"])

    val uiState: StateFlow<LiveTrackingUiState> =
        serviceRequestRepository.getRequestStreamById(requestId)
            .map { request ->
                if (request != null) {
                    val validLocation = request.locationPath
                        .filter { it.latitude != 0.0 && it.longitude != 0.0 }
                        .sortedBy { it.timestamp }
                        .lastOrNull()

                    LiveTrackingUiState.Success(
                        request = request,
                        location = validLocation
                    )
                } else {
                    LiveTrackingUiState.Error("Service request not found")
                }
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = LiveTrackingUiState.Loading
            )
}