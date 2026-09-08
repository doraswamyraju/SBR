package com.sbr.sms.ui.customer

import android.content.Intent
import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.maps.android.compose.*
import com.sbr.sms.ui.customer.viewmodels.CustomerLiveTrackingViewModel
import com.sbr.sms.ui.customer.viewmodels.LiveTrackingUiState
import kotlinx.coroutines.launch
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerLiveTrackingScreen(
    navController: NavHostController,
    viewModel: CustomerLiveTrackingViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val cameraPositionState = rememberCameraPositionState()
    val agentMarkerState = rememberMarkerState()
    val customerMarkerState = rememberMarkerState()

    fun dialPhone(phone: String) {
        try {
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
            context.startActivity(intent)
        } catch (e: Exception) {
            // Ignore dial exception
        }
    }

    LaunchedEffect(uiState) {
        if (uiState is LiveTrackingUiState.Success) {
            val state = uiState as LiveTrackingUiState.Success
            val agentLoc = state.location
            val custLat = state.request.latitude
            val custLng = state.request.longitude

            if (agentLoc != null) {
                agentMarkerState.position = LatLng(agentLoc.latitude, agentLoc.longitude)
            }
            if (custLat != null && custLng != null && custLat != 0.0 && custLng != 0.0) {
                customerMarkerState.position = LatLng(custLat, custLng)
            }

            if (agentLoc != null && custLat != null && custLng != null && custLat != 0.0 && custLng != 0.0) {
                val bounds = LatLngBounds.builder()
                    .include(LatLng(agentLoc.latitude, agentLoc.longitude))
                    .include(LatLng(custLat, custLng))
                    .build()
                cameraPositionState.animate(CameraUpdateFactory.newLatLngBounds(bounds, 120), 1000)
            } else if (agentLoc != null) {
                cameraPositionState.animate(
                    CameraUpdateFactory.newLatLngZoom(LatLng(agentLoc.latitude, agentLoc.longitude), 16f),
                    1000
                )
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Live Agent Tracking", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
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
                    Column(
                        modifier = Modifier.align(Alignment.Center),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.LocationOff, contentDescription = null, modifier = Modifier.size(48.dp), tint = Color.Gray)
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(state.message, color = Color.Gray)
                    }
                }
                is LiveTrackingUiState.Success -> {
                    val request = state.request
                    val agentLoc = state.location
                    val custLat = request.latitude
                    val custLng = request.longitude

                    GoogleMap(
                        modifier = Modifier.fillMaxSize(),
                        cameraPositionState = cameraPositionState,
                        properties = MapProperties(isTrafficEnabled = true),
                        uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false)
                    ) {
                        // Customer Marker
                        if (custLat != null && custLng != null && custLat != 0.0 && custLng != 0.0) {
                            Marker(
                                state = customerMarkerState,
                                title = "Your Location",
                                snippet = request.customerAddress,
                                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
                            )
                        }

                        // Agent Marker
                        if (agentLoc != null) {
                            Marker(
                                state = agentMarkerState,
                                title = request.assignedAgentName ?: "Technician",
                                snippet = "Heading to your location",
                                icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)
                            )
                        }
                    }

                    // Top Status & Recenter
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp)
                            .align(Alignment.TopCenter),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Surface(
                                shape = RoundedCornerShape(20.dp),
                                color = Color.Black.copy(alpha = 0.75f),
                                contentColor = Color.White
                            ) {
                                Row(
                                    modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Box(
                                        modifier = Modifier
                                            .size(8.dp)
                                            .clip(CircleShape)
                                            .background(Color(0xFF00E676))
                                    )
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text(
                                        text = "LIVE GPS STREAM",
                                        fontSize = 11.sp,
                                        fontWeight = FontWeight.Black,
                                        letterSpacing = 0.5.sp
                                    )
                                }
                            }

                            // Recenter Map
                            FloatingActionButton(
                                onClick = {
                                    coroutineScope.launch {
                                        if (agentLoc != null) {
                                            cameraPositionState.animate(
                                                CameraUpdateFactory.newLatLngZoom(LatLng(agentLoc.latitude, agentLoc.longitude), 16f),
                                                600
                                            )
                                        }
                                    }
                                },
                                modifier = Modifier.size(42.dp),
                                shape = CircleShape,
                                containerColor = Color.Black.copy(alpha = 0.75f),
                                contentColor = Color.White
                            ) {
                                Icon(Icons.Default.MyLocation, contentDescription = "Recenter", modifier = Modifier.size(20.dp))
                            }
                        }

                        // Status Banner
                        Card(
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(
                                containerColor = Color(0xFF1E293B)
                            ),
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Row(
                                modifier = Modifier
                                    .padding(horizontal = 14.dp, vertical = 10.dp)
                                    .fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    Icon(Icons.Default.Engineering, contentDescription = null, tint = Color(0xFFFFD54F), modifier = Modifier.size(20.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = "Status: ${request.status}",
                                        color = Color.White,
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 13.sp
                                    )
                                }
                                Text(
                                    text = request.serviceType,
                                    color = Color.LightGray,
                                    fontSize = 12.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }

                    // Bottom Agent & Destination Details Card
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .align(Alignment.BottomCenter)
                            .padding(16.dp),
                        shape = RoundedCornerShape(20.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 10.dp)
                    ) {
                        Column(
                            modifier = Modifier.padding(16.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Agent Info Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Box(
                                    modifier = Modifier
                                        .size(48.dp)
                                        .clip(CircleShape)
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.15f)),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Icon(Icons.Default.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(28.dp))
                                }

                                Spacer(modifier = Modifier.width(12.dp))

                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = request.assignedAgentName ?: "Technician Assigned",
                                        fontWeight = FontWeight.Bold,
                                        fontSize = 16.sp
                                    )
                                    Text(
                                        text = "Field Service Specialist",
                                        fontSize = 12.sp,
                                        color = Color.Gray
                                    )
                                }

                                if (!request.assignedAgentPhone.isNullOrBlank()) {
                                    Button(
                                        onClick = { dialPhone(request.assignedAgentPhone) },
                                        shape = RoundedCornerShape(10.dp),
                                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF2E7D32)),
                                        contentPadding = PaddingValues(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                                        Spacer(modifier = Modifier.width(4.dp))
                                        Text("Call", fontSize = 12.sp, fontWeight = FontWeight.Bold)
                                    }
                                }
                            }

                            HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))

                            // Destination Address Row
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Icon(Icons.Default.Place, contentDescription = null, tint = Color(0xFFE53935), modifier = Modifier.size(18.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text(
                                    text = "Destination: ${request.customerAddress}",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    maxLines = 2,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}