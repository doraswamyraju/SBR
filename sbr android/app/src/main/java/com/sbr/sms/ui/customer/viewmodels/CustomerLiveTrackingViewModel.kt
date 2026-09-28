package com.sbr.sms.ui.customer.viewmodels

import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.sbr.sms.data.models.AgentLocation
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import com.sbr.sms.data.socket.SocketManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.Date
import javax.inject.Inject

sealed interface LiveTrackingUiState {
    object Loading : LiveTrackingUiState
    data class Success(
        val request: ServiceRequest,
        val location: AgentLocation?,
        val heading: Float = 0f,
        val speed: Float = 0f
    ) : LiveTrackingUiState
    data class Error(val message: String) : LiveTrackingUiState
}

@HiltViewModel
class CustomerLiveTrackingViewModel @Inject constructor(
    private val serviceRequestRepository: ServiceRequestRepository,
    private val socketManager: SocketManager,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val requestId: String = checkNotNull(savedStateHandle["requestId"])

    private val _uiState = MutableStateFlow<LiveTrackingUiState>(LiveTrackingUiState.Loading)
    val uiState: StateFlow<LiveTrackingUiState> = _uiState.asStateFlow()

    init {
        loadInitialAndListenSocket()
    }

    private fun loadInitialAndListenSocket() {
        viewModelScope.launch {
            // 1. Initial fetch from repository
            val initialRequest = serviceRequestRepository.getRequestById(requestId)
            if (initialRequest != null) {
                val lastLoc = initialRequest.locationPath
                    .filter { it.latitude != 0.0 && it.longitude != 0.0 }
                    .sortedBy { it.timestamp }
                    .lastOrNull()

                _uiState.value = LiveTrackingUiState.Success(
                    request = initialRequest,
                    location = lastLoc
                )
            } else {
                _uiState.value = LiveTrackingUiState.Error("Service request not found")
            }

            // 2. Connect and join WebSocket room for this request
            socketManager.connect()
            socketManager.joinRequestRoom(requestId)

            // 3. Listen to real-time location stream
            launch {
                socketManager.locationUpdates
                    .filter { it.requestId == requestId }
                    .collect { update ->
                        val currentState = _uiState.value
                        if (currentState is LiveTrackingUiState.Success) {
                            val newLoc = AgentLocation(
                                latitude = update.latitude,
                                longitude = update.longitude,
                                timestamp = Date(update.timestamp)
                            )
                            _uiState.value = currentState.copy(
                                location = newLoc,
                                heading = update.heading,
                                speed = update.speed
                            )
                        }
                    }
            }

            // 4. Listen to real-time status stream
            launch {
                socketManager.statusUpdates
                    .filter { it.requestId == requestId }
                    .collect { statusUpdate ->
                        val currentState = _uiState.value
                        if (currentState is LiveTrackingUiState.Success) {
                            _uiState.value = currentState.copy(
                                request = currentState.request.copy(status = statusUpdate.status)
                            )
                        }
                    }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        socketManager.leaveRequestRoom(requestId)
    }
}