package com.sbr.sms.ui.admin

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.ui.admin.viewmodels.AdminLiveTrackingViewModel
import com.sbr.sms.ui.admin.viewmodels.LiveTrackingUiState
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.MapStyleOptions
import com.google.maps.android.compose.*
import java.text.SimpleDateFormat
import java.util.Locale

private const val mapStyleJson = """
[
  {"elementType":"geometry","stylers":[{"color":"#242f3e"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#746855"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#242f3e"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#263c3f"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#6b9a76"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#38414e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#212a37"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#9ca5b3"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#746855"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#1f2835"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#f3d19c"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#2f3948"}]},{"featureType":"transit.station","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#17263c"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#515c6d"}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"color":"#17263c"}]}
]
"""

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LiveTrackingScreen(
    navController: NavHostController,
    viewModel: AdminLiveTrackingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cameraPositionState = rememberCameraPositionState()
    val markerState = rememberMarkerState()
    val timeFormatter = remember { SimpleDateFormat("hh:mm:ss a", Locale.getDefault()) }

    LaunchedEffect(uiState) {
        if (uiState is LiveTrackingUiState.Success) {
            // FIXED: Use the 'latestLocation' object from the correct Success state.
            val agentLocation = (uiState as LiveTrackingUiState.Success).latestLocation
            val agentLatLng = LatLng(agentLocation.latitude, agentLocation.longitude)

            markerState.position = agentLatLng
            cameraPositionState.animate(
                CameraUpdateFactory.newLatLngZoom(agentLatLng, 16f),
                1500
            )
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Agent Live Location") },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.onRefresh() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh Location")
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
                is LiveTrackingUiState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                is LiveTrackingUiState.Error -> Text("Could not load tracking information.", modifier = Modifier.align(Alignment.Center))
                is LiveTrackingUiState.Idle -> Text("Agent has not started moving yet.", modifier = Modifier.align(Alignment.Center))
                is LiveTrackingUiState.Success -> {
                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = cameraPositionState,
                        properties = MapProperties(mapStyleOptions = MapStyleOptions(mapStyleJson))
                    ) {
                        // ADDED: Draw the Polyline using the 'path' from the state.
                        Polyline(
                            points = state.path.map { LatLng(it.latitude, it.longitude) },
                            color = Color.Cyan,
                            width = 15f
                        )
                        Marker(
                            state = markerState,
                            title = "Agent Location",
                            icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_GREEN)
                        )
                    }
                    Card(
                        modifier = Modifier
                            .align(Alignment.BottomCenter)
                            .padding(16.dp)
                            .fillMaxWidth(),
                        elevation = CardDefaults.cardElevation(8.dp)
                    ) {
                        Text(
                            // FIXED: Access the timestamp from the 'latestLocation' object.
                            text = "Last updated: ${state.latestLocation.timestamp?.let { timeFormatter.format(it) } ?: "N/A"}",
                            modifier = Modifier.padding(16.dp),
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}