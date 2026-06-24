package com.sbr.sms.ui.admin.viewmodels

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.AgentLocation
import com.sbr.sms.data.repositories.ServiceRequestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.flow.stateIn
import javax.inject.Inject

sealed interface LiveTrackingUiState {
    object Loading : LiveTrackingUiState
    // FIXED: The success state now holds the full path and the latest location.
    data class Success(val path: List<AgentLocation>, val latestLocation: AgentLocation) : LiveTrackingUiState
    object Error : LiveTrackingUiState
    object Idle : LiveTrackingUiState
}

@HiltViewModel
class AdminLiveTrackingViewModel @Inject constructor(
    serviceRequestRepository: ServiceRequestRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val requestId: String = checkNotNull(savedStateHandle["requestId"])
    private val refreshTrigger = MutableStateFlow(0)

    val uiState: StateFlow<LiveTrackingUiState> =
        combine(
            serviceRequestRepository.getRequestStreamById(requestId),
            refreshTrigger
        ) { request, _ -> request }
            .map { request ->
                // FIXED: Check for the 'locationPath' list, not 'agentLocation'.
                if (request != null && request.locationPath.isNotEmpty()) {
                    // Get the most recent location by sorting the path by timestamp.
                    val sortedPath = request.locationPath.sortedByDescending { it.timestamp }
                    LiveTrackingUiState.Success(sortedPath, sortedPath.first())
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

    fun onRefresh() {
        refreshTrigger.value++
    }
}