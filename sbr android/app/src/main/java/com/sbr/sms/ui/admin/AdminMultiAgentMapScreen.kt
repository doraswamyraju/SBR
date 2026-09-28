package com.sbr.sms.ui.admin

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import kotlinx.coroutines.launch
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
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
import androidx.compose.ui.platform.LocalContext
import com.google.android.gms.maps.MapsInitializer

private const val mapStyleJson = """
[
  {"elementType":"geometry","stylers":[{"color":"#242f3e"}]},{"elementType":"labels.text.fill","stylers":[{"color":"#746855"}]},{"elementType":"labels.text.stroke","stylers":[{"color":"#242f3e"}]},{"featureType":"administrative.locality","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"poi.park","elementType":"geometry","stylers":[{"color":"#263c3f"}]},{"featureType":"poi.park","elementType":"labels.text.fill","stylers":[{"color":"#6b9a76"}]},{"featureType":"road","elementType":"geometry","stylers":[{"color":"#38414e"}]},{"featureType":"road","elementType":"geometry.stroke","stylers":[{"color":"#212a37"}]},{"featureType":"road","elementType":"labels.text.fill","stylers":[{"color":"#9ca5b3"}]},{"featureType":"road.highway","elementType":"geometry","stylers":[{"color":"#746855"}]},{"featureType":"road.highway","elementType":"geometry.stroke","stylers":[{"color":"#1f2835"}]},{"featureType":"road.highway","elementType":"labels.text.fill","stylers":[{"color":"#f3d19c"}]},{"featureType":"transit","elementType":"geometry","stylers":[{"color":"#2f3948"}]},{"featureType":"transit.station","elementType":"labels.text.fill","stylers":[{"color":"#d59563"}]},{"featureType":"water","elementType":"geometry","stylers":[{"color":"#17263c"}]},{"featureType":"water","elementType":"labels.text.fill","stylers":[{"color":"#515c6d"}]},{"featureType":"water","elementType":"labels.stroke","stylers":[{"color":"#17263c"}]}
]
"""

@Composable
fun AdminMultiAgentMapScreen(
    navController: NavHostController,
    viewModel: AdminMultiAgentMapViewModel = hiltViewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    val cameraPositionState = rememberCameraPositionState {
        position = com.google.android.gms.maps.model.CameraPosition.fromLatLngZoom(LatLng(17.3850, 78.4867), 12f)
    }
    val coroutineScope = rememberCoroutineScope()
    var isPanelExpanded by remember { mutableStateOf(false) }

    val mapStyleOptions = remember {
        try {
            MapStyleOptions(mapStyleJson)
        } catch (_: Exception) {
            null
        }
    }

    LaunchedEffect(Unit) {
        try {
            MapsInitializer.initialize(context)
        } catch (_: Exception) {}
    }

    LaunchedEffect(uiState) {
        if (uiState is MultiAgentUiState.Success) {
            val agents = (uiState as MultiAgentUiState.Success).trackedAgents
            val validPositions = agents.mapNotNull { agentInfo ->
                val path = agentInfo.request.locationPath
                val lat = path.lastOrNull()?.latitude ?: agentInfo.agent.currentLat
                val lng = path.lastOrNull()?.longitude ?: agentInfo.agent.currentLng
                if (lat != null && lng != null && lat != 0.0 && lng != 0.0) LatLng(lat, lng) else null
            }
            if (validPositions.isNotEmpty()) {
                try {
                    if (validPositions.size == 1) {
                        cameraPositionState.animate(
                            CameraUpdateFactory.newLatLngZoom(validPositions.first(), 14f),
                            800
                        )
                    } else {
                        val minLat = validPositions.minOf { it.latitude }
                        val maxLat = validPositions.maxOf { it.latitude }
                        val minLng = validPositions.minOf { it.longitude }
                        val maxLng = validPositions.maxOf { it.longitude }
                        if (maxLat - minLat > 0.0001 || maxLng - minLng > 0.0001) {
                            val bounds = LatLngBounds(LatLng(minLat, minLng), LatLng(maxLat, maxLng))
                            cameraPositionState.animate(
                                CameraUpdateFactory.newLatLngBounds(bounds, 100),
                                800
                            )
                        } else {
                            cameraPositionState.animate(
                                CameraUpdateFactory.newLatLngZoom(validPositions.first(), 14f),
                                800
                            )
                        }
                    }
                } catch (_: Exception) {
                    validPositions.firstOrNull()?.let { pos ->
                        try {
                            cameraPositionState.position = com.google.android.gms.maps.model.CameraPosition.fromLatLngZoom(pos, 14f)
                        } catch (_: Exception) {}
                    }
                }
            }
        }
    }

    Box(modifier = Modifier.fillMaxSize()) {
        // Background Map
        when (val state = uiState) {
            is MultiAgentUiState.Loading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            is MultiAgentUiState.Error -> Text(state.message, modifier = Modifier.align(Alignment.Center))
            is MultiAgentUiState.Success -> {
                GoogleMap(
                    modifier = Modifier.fillMaxSize(),
                    cameraPositionState = cameraPositionState,
                    properties = MapProperties(mapStyleOptions = mapStyleOptions)
                ) {
                    state.trackedAgents.forEach { agentInfo ->
                        val path = agentInfo.request.locationPath
                        val lat = path.lastOrNull()?.latitude ?: agentInfo.agent.currentLat
                        val lng = path.lastOrNull()?.longitude ?: agentInfo.agent.currentLng
                        if (lat != null && lng != null && lat != 0.0 && lng != 0.0) {
                            val validPath = path.filter { it.latitude != 0.0 && it.longitude != 0.0 }
                            if (validPath.size >= 2) {
                                Polyline(
                                    points = validPath.map { LatLng(it.latitude, it.longitude) },
                                    color = Color.Yellow,
                                    width = 10f
                                )
                            }
                            Marker(
                                state = MarkerState(position = LatLng(lat, lng)),
                                title = agentInfo.agent.name.ifBlank { "Technician" },
                                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE),
                            )
                        }
                    }
                }

                if (state.trackedAgents.isEmpty()) {
                    Surface(
                        modifier = Modifier
                            .align(Alignment.TopCenter)
                            .padding(top = 16.dp),
                        shape = RoundedCornerShape(20.dp),
                        color = Color.Black.copy(alpha = 0.75f)
                    ) {
                        Text(
                            "No active technicians on duty right now.",
                            color = Color.White,
                            fontSize = 13.sp,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
                        )
                    }
                }
            }
        }

        // Floating Bottom Panel
        Surface(
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .fillMaxWidth()
                .padding(12.dp),
            shape = RoundedCornerShape(16.dp),
            tonalElevation = 6.dp,
            shadowElevation = 8.dp,
            color = MaterialTheme.colorScheme.surface
        ) {
            ActiveAgentsPanelContent(
                uiState = uiState,
                isExpanded = isPanelExpanded,
                onToggleExpand = { isPanelExpanded = !isPanelExpanded },
                onAgentClick = { agentInfo ->
                    val lat = agentInfo.request.locationPath.lastOrNull()?.latitude ?: agentInfo.agent.currentLat
                    val lng = agentInfo.request.locationPath.lastOrNull()?.longitude ?: agentInfo.agent.currentLng
                    if (lat != null && lng != null && lat != 0.0 && lng != 0.0) {
                        coroutineScope.launch {
                            try {
                                cameraPositionState.animate(
                                    CameraUpdateFactory.newLatLngZoom(LatLng(lat, lng), 16f),
                                    600
                                )
                            } catch (_: Exception) {}
                        }
                    }
                }
            )
        }
    }
}

@Composable
private fun ActiveAgentsPanelContent(
    uiState: MultiAgentUiState,
    isExpanded: Boolean,
    onToggleExpand: () -> Unit,
    onAgentClick: (TrackedAgentInfo) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(14.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onToggleExpand() },
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.Group, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                Spacer(modifier = Modifier.width(8.dp))
                Text(
                    text = "Active Technicians",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
            IconButton(onClick = onToggleExpand) {
                Icon(
                    imageVector = if (isExpanded) Icons.Default.KeyboardArrowDown else Icons.Default.KeyboardArrowUp,
                    contentDescription = "Toggle Panel"
                )
            }
        }

        if (isExpanded) {
            Spacer(modifier = Modifier.height(8.dp))
            when (uiState) {
                is MultiAgentUiState.Success -> {
                    if (uiState.trackedAgents.isEmpty()) {
                        Text(
                            "No active technicians found.",
                            fontSize = 13.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    } else {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .heightIn(max = 280.dp)
                                .verticalScroll(rememberScrollState()),
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            uiState.trackedAgents.forEach { agentInfo ->
                                AgentInfoRow(agentInfo = agentInfo, onClick = { onAgentClick(agentInfo) })
                            }
                        }
                    }
                }
                else -> {
                    Text(
                        "Loading agent data...",
                        fontSize = 13.sp,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
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
                    text = agentInfo.agent.name.ifBlank { "Technician" },
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "On duty for: ${agentInfo.request.serviceType.ifBlank { "Service Job" }}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Icon(Icons.Default.Place, contentDescription = "Focus on map")
        }
    }
}