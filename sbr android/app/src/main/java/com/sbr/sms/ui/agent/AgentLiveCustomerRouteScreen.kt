package com.sbr.sms.ui.agent

import android.content.Context
import android.content.Intent
import android.location.Location
import android.net.Uri
import android.widget.Toast
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import androidx.navigation.NavHostController
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.BitmapDescriptorFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.android.gms.maps.model.LatLngBounds
import com.google.maps.android.compose.*
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.data.repositories.ServiceRequestRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class AgentLiveRouteViewModel @Inject constructor(
    private val repository: ServiceRequestRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    val requestId: String = savedStateHandle.get<String>("requestId") ?: ""

    val requestStream: StateFlow<ServiceRequest?> =
        if (requestId.isNotBlank()) {
            repository.getRequestStreamById(requestId)
                .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), null)
        } else {
            kotlinx.coroutines.flow.MutableStateFlow(null)
        }

    fun markArrived(onSuccess: () -> Unit) {
        if (requestId.isBlank()) return
        viewModelScope.launch {
            try {
                repository.updateRequestStatus(requestId, "In Progress", requestReview = false)
                onSuccess()
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentLiveCustomerRouteScreen(
    navController: NavHostController,
    viewModel: AgentLiveRouteViewModel = hiltViewModel()
) {
    val request by viewModel.requestStream.collectAsState()
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    var isMapLoaded by remember { mutableStateOf(false) }
    var agentLatLng by remember { mutableStateOf<LatLng?>(null) }
    var distanceKm by remember { mutableStateOf<Double?>(null) }
    var etaMinutes by remember { mutableStateOf<Int?>(null) }

    val customerLatLng = remember(request) {
        val req = request
        if (req?.latitude != null && req.longitude != null && req.latitude != 0.0 && req.longitude != 0.0) {
            LatLng(req.latitude, req.longitude)
        } else {
            LatLng(12.9716, 77.5946)
        }
    }

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(customerLatLng, 15f)
    }

    val agentMarkerState = rememberMarkerState()
    val customerMarkerState = rememberMarkerState(position = customerLatLng)

    fun calculateRouteMetrics(from: LatLng, to: LatLng) {
        val results = FloatArray(1)
        Location.distanceBetween(from.latitude, from.longitude, to.latitude, to.longitude, results)
        val distMeters = results[0]
        val distKm = distMeters / 1000.0
        distanceKm = distKm
        etaMinutes = ((distKm / 25.0) * 60.0).toInt().coerceAtLeast(1)
    }

    // Fetch initial device location safely with permission check
    LaunchedEffect(Unit) {
        try {
            val hasFine = androidx.core.content.ContextCompat.checkSelfPermission(
                context, android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            val hasCoarse = androidx.core.content.ContextCompat.checkSelfPermission(
                context, android.Manifest.permission.ACCESS_COARSE_LOCATION
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED

            if (hasFine || hasCoarse) {
                fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                    if (loc != null) {
                        val pos = LatLng(loc.latitude, loc.longitude)
                        agentLatLng = pos
                        agentMarkerState.position = pos
                        calculateRouteMetrics(pos, customerLatLng)
                    }
                }.addOnFailureListener {
                    // Ignore failure
                }
            }
        } catch (e: Exception) {
            // Permission or location fetch issue
        }
    }

    // Animate camera only AFTER map is loaded
    LaunchedEffect(isMapLoaded, agentLatLng, customerLatLng) {
        if (isMapLoaded) {
            coroutineScope.launch {
                try {
                    val pos = agentLatLng
                    if (pos != null &&
                        (kotlin.math.abs(pos.latitude - customerLatLng.latitude) > 0.0005 ||
                         kotlin.math.abs(pos.longitude - customerLatLng.longitude) > 0.0005)
                    ) {
                        val bounds = LatLngBounds.builder()
                            .include(pos)
                            .include(customerLatLng)
                            .build()
                        cameraPositionState.animate(CameraUpdateFactory.newLatLngBounds(bounds, 120), 800)
                    } else {
                        val target = pos ?: customerLatLng
                        cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(target, 15f), 800)
                    }
                } catch (e: Exception) {
                    try {
                        cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(customerLatLng, 15f), 500)
                    } catch (_: Exception) {}
                }
            }
        }
    }

    fun openExternalGoogleMaps() {
        try {
            val uri = Uri.parse("google.navigation:q=${customerLatLng.latitude},${customerLatLng.longitude}&mode=d")
            val mapIntent = Intent(Intent.ACTION_VIEW, uri).apply {
                setPackage("com.google.android.apps.maps")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
            }
            context.startActivity(mapIntent)
        } catch (e: Exception) {
            try {
                val fallbackUri = Uri.parse("https://www.google.com/maps/dir/?api=1&destination=${customerLatLng.latitude},${customerLatLng.longitude}")
                val browserIntent = Intent(Intent.ACTION_VIEW, fallbackUri).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(browserIntent)
            } catch (e2: Exception) {
                Toast.makeText(context, "Could not open Google Maps", Toast.LENGTH_SHORT).show()
            }
        }
    }

    fun callCustomer() {
        val phone = request?.customerPhone
        if (!phone.isNullOrBlank()) {
            try {
                val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone")).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                context.startActivity(intent)
            } catch (e: Exception) {
                Toast.makeText(context, "Could not open dialer", Toast.LENGTH_SHORT).show()
            }
        } else {
            Toast.makeText(context, "Customer phone number not available", Toast.LENGTH_SHORT).show()
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Customer Route Navigation", fontWeight = FontWeight.Bold, fontSize = 18.sp) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { openExternalGoogleMaps() }) {
                        Icon(Icons.Default.Map, contentDescription = "External Maps", tint = MaterialTheme.colorScheme.primary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = MaterialTheme.colorScheme.surface)
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            // Google Map is always composed to prevent 0-size crashes
            GoogleMap(
                modifier = Modifier.fillMaxSize(),
                cameraPositionState = cameraPositionState,
                onMapLoaded = { isMapLoaded = true },
                uiSettings = MapUiSettings(zoomControlsEnabled = false, myLocationButtonEnabled = false),
                properties = MapProperties(isTrafficEnabled = true, isMyLocationEnabled = false)
            ) {
                // Customer Pin
                Marker(
                    state = customerMarkerState,
                    title = request?.customerName ?: "Customer",
                    snippet = request?.customerAddress ?: "Service Location",
                    icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)
                )

                // Agent Pin & Polyline
                agentLatLng?.let { pos ->
                    Marker(
                        state = agentMarkerState,
                        title = "Your Location",
                        snippet = "En Route to Customer",
                        icon = BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_AZURE)
                    )

                    // Route Polyline
                    Polyline(
                        points = listOf(pos, customerLatLng),
                        color = Color(0xFF1976D2),
                        width = 12f
                    )
                }
            }

            if (request == null) {
                CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
            } else {
                val req = request!!

                // Top Turn-by-Turn Instruction Banner
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                        .align(Alignment.TopCenter),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = Color(0xFF0F172A)),
                        elevation = CardDefaults.cardElevation(defaultElevation = 8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            modifier = Modifier.padding(14.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(44.dp)
                                    .clip(RoundedCornerShape(10.dp))
                                    .background(Color(0xFF2E7D32)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Navigation, contentDescription = null, tint = Color.White, modifier = Modifier.size(24.dp))
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = "Head towards ${req.customerAddress.ifBlank { "Customer Location" }.take(30)}...",
                                    color = Color.White,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 14.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                                Row(verticalAlignment = Alignment.CenterVertically) {
                                    if (distanceKm != null) {
                                        Text(
                                            text = "%.1f km".format(Locale.US, distanceKm),
                                            color = Color(0xFF64B5F6),
                                            fontWeight = FontWeight.Bold,
                                            fontSize = 13.sp
                                        )
                                    }
                                    if (etaMinutes != null) {
                                        Text(
                                            text = " • ETA ~$etaMinutes mins",
                                            color = Color.LightGray,
                                            fontSize = 12.sp
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Floating Recenter Button
                FloatingActionButton(
                    onClick = {
                        coroutineScope.launch {
                            try {
                                agentLatLng?.let { pos ->
                                    cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(pos, 16f), 500)
                                } ?: run {
                                    cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(customerLatLng, 16f), 500)
                                }
                            } catch (_: Exception) {}
                        }
                    },
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(bottom = 200.dp, end = 16.dp)
                        .size(46.dp),
                    shape = CircleShape,
                    containerColor = Color.Black.copy(alpha = 0.8f),
                    contentColor = Color.White
                ) {
                    Icon(Icons.Default.MyLocation, contentDescription = "Recenter", modifier = Modifier.size(22.dp))
                }

                // Bottom Customer & Actions Panel
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
                        // Customer Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(42.dp)
                                    .clip(CircleShape)
                                    .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.12f)),
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Person, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                            }
                            Spacer(modifier = Modifier.width(10.dp))
                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = req.customerName ?: "Customer",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 15.sp
                                )
                                Text(
                                    text = req.customerAddress.ifBlank { "Address not specified" },
                                    fontSize = 12.sp,
                                    color = Color.Gray,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis
                                )
                            }
                        }

                        HorizontalDivider(color = Color.LightGray.copy(alpha = 0.3f))

                        // Action Buttons Row
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(10.dp)
                        ) {
                            OutlinedButton(
                                onClick = { callCustomer() },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(46.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.outlinedButtonColors(contentColor = Color(0xFF2E7D32))
                            ) {
                                Icon(Icons.Default.Phone, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Call", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }

                            OutlinedButton(
                                onClick = { openExternalGoogleMaps() },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(46.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.OpenInNew, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("Maps", fontSize = 13.sp)
                            }

                            Button(
                                onClick = {
                                    viewModel.markArrived {
                                        Toast.makeText(context, "Marked as Arrived at customer location!", Toast.LENGTH_SHORT).show()
                                        navController.popBackStack()
                                    }
                                },
                                modifier = Modifier
                                    .weight(1.3f)
                                    .height(46.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text("Arrived", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
