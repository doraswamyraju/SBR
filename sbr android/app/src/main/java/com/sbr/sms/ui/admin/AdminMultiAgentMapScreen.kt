package com.sbr.sms.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Place
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.sbr.sms.ui.admin.viewmodels.AdminMultiAgentMapViewModel
import com.sbr.sms.ui.admin.viewmodels.MultiAgentUiState
import com.sbr.sms.ui.admin.viewmodels.TrackedAgentInfo
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.android.gms.maps.model.MapStyleOptions
import com.google.maps.android.compose.*
import kotlinx.coroutines.launch

private const val mapStyleJson = """
[
  {"elementType":"geometry","stylers":[{"color":"#242f3e"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#746855"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#242f3e"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#263c3f"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#6b9a76"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#38414e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#212a37"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#9ca5b3"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#746855"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#1f2835"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#f3d19c"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#2f3948"}]},{"featureType":"transit.station","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#17263c"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#515c6d"}]},{"featureType":"water","elementType":"labels.text.stroke","stylers":[{"color":"#17263c"}]}
]
"""

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AdminMultiAgentMapScreen(
    navController: NavHostController,
    viewModel: AdminMultiAgentMapViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val cameraPositionState = rememberCameraPositionState()
    val coroutineScope = rememberCoroutineScope()

    // State for the Bottom Sheet
    val scaffoldState = rememberBottomSheetScaffoldState()

    // NEW: Improved camera logic
    LaunchedEffect(uiState) {
        if (uiState is MultiAgentUiState.Success) {
            val agents = (uiState as MultiAgentUiState.Success).trackedAgents
            if (agents.isNotEmpty()) {
                // If only one agent is active, zoom directly to them.
                if (agents.size == 1) {
                    val singleAgentPath = agents.first().request.locationPath
                    if (singleAgentPath.isNotEmpty()) {
                        val lastLocation = singleAgentPath.last()
                        cameraPositionState.animate(
                            CameraUpdateFactory.newLatLngZoom(LatLng(lastLocation.latitude, lastLocation.longitude), 15f),
                            1000
                        )
                    }
                } else {
                    // If multiple agents are active, zoom to show all of them.
                    val boundsBuilder = LatLngBounds.builder()
                    agents.forEach { agentInfo ->
                        agentInfo.request.locationPath.forEach { location ->
                            boundsBuilder.include(LatLng(location.latitude, location.longitude))
                        }
                    }
                    cameraPositionState.animate(
                        CameraUpdateFactory.newLatLngBounds(boundsBuilder.build(), 150),
                        1000
                    )
                }
            }
        }
    }

    // NEW: Main layout using BottomSheetScaffold
    BottomSheetScaffold(
        scaffoldState = scaffoldState,
        sheetPeekHeight = 110.dp, // Shows the title and a bit of the first item
        sheetContent = {
            // This is the content of the floating panel
            ActiveAgentsSheetContent(
                uiState = uiState,
                onAgentClick = { agentInfo ->
                    val lastLocation = agentInfo.request.locationPath.lastOrNull()
                    if (lastLocation != null) {
                        coroutineScope.launch {
                            // When an agent is clicked, focus the map and collapse the sheet
                            cameraPositionState.animate(
                                CameraUpdateFactory.newLatLngZoom(LatLng(lastLocation.latitude, lastLocation.longitude), 16f)
                            )
                            scaffoldState.bottomSheetState.partialExpand()
                        }
                    }
                }
            )
        }
    ) { padding ->
        // This is the main screen content (the map)
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when (val state = uiState) {
                is MultiAgentUiState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                is MultiAgentUiState.Error -> Text(state.message, modifier = Modifier.align(Alignment.Center))
                is MultiAgentUiState.Success -> {
                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = cameraPositionState,
                        properties = MapProperties(mapStyleOptions = MapStyleOptions(mapStyleJson))
                    ) {
                        state.trackedAgents.forEach { agentInfo ->
                            val path = agentInfo.request.locationPath
                            if (path.isNotEmpty()) {
                                Polyline(
                                    points = path.map { LatLng(it.latitude, it.longitude) },
                                    color = Color.Yellow,
                                    width = 10f
                                )
                                Marker(
                                    state = MarkerState(position = LatLng(path.last().latitude, path.last().longitude)),
                                    title = agentInfo.agent.name,
                                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE),
                                )
                            }
                        }
                    }
                    if (state.trackedAgents.isEmpty()) {
                        Box(contentAlignment = Alignment.Center, modifier = Modifier.fillMaxSize()) {
                            Text("No agents are currently on an active job.")
                        }
                    }
                }
            }
        }
    }
}

@Composable
private fun ActiveAgentsSheetContent(
    uiState: MultiAgentUiState,
    onAgentClick: (TrackedAgentInfo) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp)
    ) {
        // Draggable handle for the bottom sheet
        Box(
            modifier = Modifier
                .padding(vertical = 8.dp)
                .width(40.dp)
                .height(4.dp)
                .background(MaterialTheme.colorScheme.onSurface.copy(alpha = 0.4f), shape = RoundedCornerShape(2.dp))
                .align(Alignment.CenterHorizontally)
        )
        Text(
            text = "Active Agents",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        when (uiState) {
            is MultiAgentUiState.Success -> {
                if (uiState.trackedAgents.isEmpty()) {
                    Text("No active agents found.", modifier = Modifier.padding(vertical = 16.dp))
                } else {
                    LazyColumn(
                        modifier = Modifier.fillMaxWidth(),
                        contentPadding = PaddingValues(bottom = 16.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(uiState.trackedAgents, key = { it.agent.id }) { agentInfo ->
                            AgentInfoRow(agentInfo = agentInfo, onClick = { onAgentClick(agentInfo) })
                        }
                    }
                }
            }
            else -> {
                // Show a simple loading/error text inside the sheet
                Box(modifier = Modifier.fillMaxWidth().padding(16.dp), contentAlignment = Alignment.Center) {
                    Text("Loading agent data...")
                }
            }
        }
    }
}

@Composable
private fun AgentInfoRow(
    agentInfo: TrackedAgentInfo,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(2.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = "Agent",
                modifier = Modifier.size(40.dp),
                tint = MaterialTheme.colorScheme.primary
            )
            Spacer(modifier = Modifier.width(16.dp))
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = agentInfo.agent.name,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "On duty for: ${agentInfo.request.serviceType}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(Icons.Default.Place, contentDescription = "Focus on map")
        }
    }
}