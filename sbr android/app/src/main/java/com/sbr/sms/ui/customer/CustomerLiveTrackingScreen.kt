package com.sbr.sms.ui.customer

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.ui.customer.viewmodels.CustomerLiveTrackingViewModel
import com.sbr.sms.ui.customer.viewmodels.LiveTrackingUiState
// NEW: Import the missing CameraUpdateFactory
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerLiveTrackingScreen(
    navController: NavHostController,
    viewModel: CustomerLiveTrackingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cameraPositionState = rememberCameraPositionState()
    // NEW: Remember the marker state to prevent recreating it on every composition.
    val markerState = rememberMarkerState()

    // This effect will smoothly animate the camera AND update the marker's position.
    LaunchedEffect(uiState) {
        if (uiState is LiveTrackingUiState.Success) {
            val agentLocation = (uiState as LiveTrackingUiState.Success).location
            val agentLatLng = LatLng(agentLocation.latitude, agentLocation.longitude)

            // NEW: Update the position of the remembered marker state.
            markerState.position = agentLatLng

            cameraPositionState.animate(
                // Use the newly imported CameraUpdateFactory
                CameraUpdateFactory.newLatLngZoom(agentLatLng, 16f),
                1500 // Animation duration in ms
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Track Your Agent") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            when (val state = uiState) {
                is LiveTrackingUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is LiveTrackingUiState.Error -> {
                    Text("Could not load tracking information.", modifier = Modifier.align(Alignment.Center))
                }
                is LiveTrackingUiState.Idle -> {
                    Text("Agent has not started moving yet.", modifier = Modifier.align(Alignment.Center))
                }
                is LiveTrackingUiState.Success -> {
                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = cameraPositionState,
                        properties = MapProperties(isTrafficEnabled = true)
                    ) {
                        // NEW: The Marker now uses the stable, remembered markerState.
                        Marker(
                            state = markerState,
                            title = "Agent Location"
                        )
                    }
                }
            }
        }
    }
}