package com.sbr.sms.ui.agent

import androidx.compose.runtime.*
import androidx.hilt.navigation.compose.hiltViewModel
import com.sbr.sms.ui.agent.viewmodels.AgentDashboardUiState
import com.sbr.sms.ui.agent.viewmodels.AgentRequestsViewModel

@Composable
fun AgentLocationUpdater(
    viewModel: AgentRequestsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    // FIXED: Change the key to only react to whether an active request exists.
    // This prevents the DisposableEffect from being re-run (and thus stopping/starting location)
    // every time any part of the AgentDashboardUiState changes (e.g., new requests arriving).
    val hasActiveRequest = remember(uiState) {
        (uiState as? AgentDashboardUiState.Success)?.activeRequest != null
    }

    DisposableEffect(hasActiveRequest) {
        if (hasActiveRequest) {
            viewModel.startLocationUpdates()
        }

        onDispose {
            // Only stop if the effect is being disposed OR if hasActiveRequest became false
            if (!hasActiveRequest) {
                viewModel.stopLocationUpdates()
            }
        }
    }
}