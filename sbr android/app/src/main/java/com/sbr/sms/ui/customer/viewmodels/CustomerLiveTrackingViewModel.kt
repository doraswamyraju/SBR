package com.sbr.sms.ui.customer.viewmodels

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.AgentLocation
import com.sbr.sms.data.repositories.ServiceRequestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

sealed interface LiveTrackingUiState {
    object Loading : LiveTrackingUiState
    data class Success(val location: AgentLocation) : LiveTrackingUiState
    object Error : LiveTrackingUiState
    object Idle : LiveTrackingUiState
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
                // FIXED: Check if 'locationPath' is not empty and get the last location.
                if (request?.locationPath?.isNotEmpty() == true) {
                    val validPath = request.locationPath
                        .filter { it.latitude != 0.0 && it.longitude != 0.0 }
                        .sortedBy { it.timestamp }
                    if (validPath.isNotEmpty()) {
                        LiveTrackingUiState.Success(validPath.last())
                    } else {
                        LiveTrackingUiState.Idle
                    }
                } else if (request != null) {
                    LiveTrackingUiState.Idle
                } else {
                    LiveTrackingUiState.Error
                }
            }
            .stateIn(
                scope = viewModelScope,
                started = SharingStarted.WhileSubscribed(5000),
                initialValue = LiveTrackingUiState.Loading
            )
}