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
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class AgentLiveRouteViewModel @Inject constructor(
    private val repository: ServiceRequestRepository,
    private val socketManager: com.sbr.sms.data.socket.SocketManager,
    private val credentialManager: com.sbr.sms.data.CredentialManager,
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

    init {
        if (requestId.isNotBlank()) {
            socketManager.connect()
            socketManager.joinRequestRoom(requestId)
        }
    }

    fun emitAgentLocation(latitude: Double, longitude: Double, heading: Float = 0f, speed: Float = 0f) {
        if (requestId.isBlank()) return
        viewModelScope.launch {
            try {
                val agentId = credentialManager.getUserId()
                socketManager.sendAgentLocation(requestId, agentId, latitude, longitude, heading, speed)
                repository.updateAgentLocation(
                    requestId,
                    com.sbr.sms.data.models.AgentLocation(
                        latitude = latitude,
                        longitude = longitude,
                        timestamp = java.util.Date()
                    )
                )
            } catch (_: Exception) {}
        }
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

    var customerLatLng by remember { mutableStateOf(LatLng(13.6288, 79.4192)) } // Default Tirupati, AP Headquarters

    LaunchedEffect(request) {
        val req = request ?: return@LaunchedEffect
        if (req.latitude != null && req.longitude != null && req.latitude != 0.0 && req.longitude != 0.0) {
            customerLatLng = LatLng(req.latitude, req.longitude)
        } else if (!req.customerAddress.isNullOrBlank()) {
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.IO) {
                try {
                    val geocoder = android.location.Geocoder(context, Locale.getDefault())
                    val list = geocoder.getFromLocationName(req.customerAddress, 1)
                    if (!list.isNullOrEmpty()) {
                        customerLatLng = LatLng(list[0].latitude, list[0].longitude)
                    }
                } catch (_: Exception) {}
            }
        }
    }

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(customerLatLng, 15f)
    }

    val agentMarkerState = rememberMarkerState()
    val customerMarkerState = rememberMarkerState(position = customerLatLng)

    var routePoints by remember { mutableStateOf<List<LatLng>>(emptyList()) }
    var nextManeuverInstruction by remember { mutableStateOf("Head towards customer location") }
    var nextManeuverModifier by remember { mutableStateOf("straight") }
    var lastRouteFetchTime by remember { mutableStateOf(0L) }

    fun fetchRoadRoute(from: LatLng, to: LatLng) {
        val now = System.currentTimeMillis()
        if (now - lastRouteFetchTime < 10000 && routePoints.isNotEmpty()) return
        lastRouteFetchTime = now

        coroutineScope.launch(Dispatchers.IO) {
            try {
                val urlStr = "https://router.project-osrm.org/route/v1/driving/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=geojson&steps=true"
                val url = URL(urlStr)
                val conn = url.openConnection() as HttpURLConnection
                conn.connectTimeout = 4000
                conn.readTimeout = 4000
                conn.requestMethod = "GET"
                if (conn.responseCode == 200) {
                    val responseText = conn.inputStream.bufferedReader().use { it.readText() }
                    val json = JSONObject(responseText)
                    val routes = json.optJSONArray("routes")
                    if (routes != null && routes.length() > 0) {
                        val firstRoute = routes.getJSONObject(0)
                        val distM = firstRoute.optDouble("distance", 0.0)
                        val durS = firstRoute.optDouble("duration", 0.0)

                        val geom = firstRoute.optJSONObject("geometry")
                        val coords = geom?.optJSONArray("coordinates")
                        val pts = mutableListOf<LatLng>()
                        if (coords != null) {
                            for (i in 0 until coords.length()) {
                                val c = coords.getJSONArray(i)
                                pts.add(LatLng(c.getDouble(1), c.getDouble(0)))
                            }
                        }

                        val legs = firstRoute.optJSONArray("legs")
                        var stepText = "Proceed on route to customer site"
                        var stepMod = "straight"
                        if (legs != null && legs.length() > 0) {
                            val steps = legs.getJSONObject(0).optJSONArray("steps")
                            if (steps != null && steps.length() > 0) {
                                val step = steps.getJSONObject(0)
                                val man = step.optJSONObject("maneuver")
                                stepMod = man?.optString("modifier") ?: "straight"
                                val roadName = step.optString("name")
                                val stepDist = step.optDouble("distance", 0.0).toInt()
                                stepText = if (roadName.isNotBlank()) {
                                    "${stepMod.replaceFirstChar { it.uppercase() }} onto $roadName ($stepDist m)"
                                } else {
                                    "${stepMod.replaceFirstChar { it.uppercase() }} ($stepDist m)"
                                }
                            }
                        }

                        withContext(Dispatchers.Main) {
                            if (pts.isNotEmpty()) routePoints = pts
                            distanceKm = distM / 1000.0
                            etaMinutes = (durS / 60.0).toInt().coerceAtLeast(1)
                            nextManeuverInstruction = stepText
                            nextManeuverModifier = stepMod
                        }
                        return@launch
                    }
                }
            } catch (_: Exception) {}

            withContext(Dispatchers.Main) {
                if (routePoints.isEmpty()) {
                    routePoints = listOf(from, to)
                }
            }
        }
    }

    fun calculateRouteMetrics(from: LatLng, to: LatLng) {
        val results = FloatArray(1)
        Location.distanceBetween(from.latitude, from.longitude, to.latitude, to.longitude, results)
        val distMeters = results[0]
        val distKm = distMeters / 1000.0
        if (distanceKm == null) distanceKm = distKm
        if (etaMinutes == null) etaMinutes = ((distKm / 25.0) * 60.0).toInt().coerceAtLeast(1)
        fetchRoadRoute(from, to)
    }

    // Continuous location tracking with sub-second WebSocket updates
    DisposableEffect(customerLatLng) {
        val locationRequest = com.google.android.gms.location.LocationRequest.Builder(
            com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY,
            4000
        ).setMinUpdateIntervalMillis(2000).build()

        val locationCallback = object : com.google.android.gms.location.LocationCallback() {
            override fun onLocationResult(result: com.google.android.gms.location.LocationResult) {
                val loc = result.lastLocation ?: return
                val pos = LatLng(loc.latitude, loc.longitude)
                agentLatLng = pos
                agentMarkerState.position = pos
                calculateRouteMetrics(pos, customerLatLng)
                viewModel.emitAgentLocation(loc.latitude, loc.longitude, loc.bearing, loc.speed)
            }
        }

        try {
            val hasFine = androidx.core.content.ContextCompat.checkSelfPermission(
                context, android.Manifest.permission.ACCESS_FINE_LOCATION
            ) == android.content.pm.PackageManager.PERMISSION_GRANTED
            if (hasFine) {
                fusedLocationClient.requestLocationUpdates(locationRequest, locationCallback, android.os.Looper.getMainLooper())
                fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                    if (loc != null) {
                        val pos = LatLng(loc.latitude, loc.longitude)
                        agentLatLng = pos
                        agentMarkerState.position = pos
                        calculateRouteMetrics(pos, customerLatLng)
                        viewModel.emitAgentLocation(loc.latitude, loc.longitude, loc.bearing, loc.speed)
                    }
                }
            }
        } catch (_: Exception) {}

        onDispose {
            try {
                fusedLocationClient.removeLocationUpdates(locationCallback)
            } catch (_: Exception) {}
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

                    // Route Polyline (Turn-by-turn road route)
                    Polyline(
                        points = if (routePoints.isNotEmpty()) routePoints else listOf(pos, customerLatLng),
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
                                val icon = when {
                                    nextManeuverModifier.contains("left", ignoreCase = true) -> Icons.Default.TurnLeft
                                    nextManeuverModifier.contains("right", ignoreCase = true) -> Icons.Default.TurnRight
                                    nextManeuverModifier.contains("u-turn", ignoreCase = true) -> Icons.Default.UTurnLeft
                                    else -> Icons.Default.Straight
                                }
                                Icon(icon, contentDescription = null, tint = Color.White, modifier = Modifier.size(24.dp))
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            Column(modifier = Modifier.weight(1f)) {
                                Text(
                                    text = nextManeuverInstruction,
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
