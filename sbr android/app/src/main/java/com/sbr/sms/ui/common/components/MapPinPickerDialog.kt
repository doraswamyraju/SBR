package com.sbr.sms.ui.common.components

import android.Manifest
import android.content.Context
import android.content.pm.PackageManager
import android.location.Address
import android.location.Geocoder
import android.os.Build
import android.widget.Toast
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MapPinPickerDialog(
    initialLatitude: Double? = null,
    initialLongitude: Double? = null,
    initialAddress: String = "",
    onDismiss: () -> Unit,
    onLocationSelected: (latitude: Double, longitude: Double, resolvedAddress: String) -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    val keyboardController = LocalSoftwareKeyboardController.current
    val fusedLocationClient = remember { LocationServices.getFusedLocationProviderClient(context) }

    val defaultLatLng = LatLng(
        initialLatitude?.takeIf { it != 0.0 } ?: 12.9716,
        initialLongitude?.takeIf { it != 0.0 } ?: 77.5946
    )

    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(defaultLatLng, 16f)
    }

    var searchText by remember { mutableStateOf(initialAddress) }
    var detectedAddress by remember { mutableStateOf("") }
    var isLocating by remember { mutableStateOf(false) }
    var isSearching by remember { mutableStateOf(false) }

    fun reverseGeocode(lat: Double, lng: Double) {
        coroutineScope.launch(Dispatchers.IO) {
            try {
                val geocoder = Geocoder(context, Locale.getDefault())
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                    geocoder.getFromLocation(lat, lng, 1) { addresses ->
                        if (addresses.isNotEmpty()) {
                            val addr = addresses[0]
                            val fullText = listOfNotNull(
                                addr.featureName,
                                addr.subLocality,
                                addr.locality,
                                addr.adminArea
                            ).distinct().joinToString(", ")
                            detectedAddress = fullText
                        }
                    }
                } else {
                    @Suppress("DEPRECATION")
                    val addresses = geocoder.getFromLocation(lat, lng, 1)
                    if (!addresses.isNullOrEmpty()) {
                        val addr = addresses[0]
                        val fullText = listOfNotNull(
                            addr.featureName,
                            addr.subLocality,
                            addr.locality,
                            addr.adminArea
                        ).distinct().joinToString(", ")
                        withContext(Dispatchers.Main) {
                            detectedAddress = fullText
                        }
                    }
                }
            } catch (e: Exception) {
                // Ignore geocode failure
            }
        }
    }

    fun fetchCurrentGpsLocation() {
        if (ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED ||
            ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        ) {
            isLocating = true
            fusedLocationClient.lastLocation.addOnSuccessListener { loc ->
                isLocating = false
                if (loc != null) {
                    val latLng = LatLng(loc.latitude, loc.longitude)
                    coroutineScope.launch {
                        cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(latLng, 17f), 600)
                    }
                    reverseGeocode(loc.latitude, loc.longitude)
                } else {
                    Toast.makeText(context, "Could not acquire GPS position. Drag map manually.", Toast.LENGTH_SHORT).show()
                }
            }.addOnFailureListener {
                isLocating = false
                Toast.makeText(context, "GPS error: ${it.localizedMessage}", Toast.LENGTH_SHORT).show()
            }
        }
    }

    val permissionLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.RequestMultiplePermissions()
    ) { permissions ->
        if (permissions[Manifest.permission.ACCESS_FINE_LOCATION] == true || permissions[Manifest.permission.ACCESS_COARSE_LOCATION] == true) {
            fetchCurrentGpsLocation()
        } else {
            Toast.makeText(context, "Location permission is required for auto-locate.", Toast.LENGTH_SHORT).show()
        }
    }

    fun requestGps() {
        val fineGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
        val coarseGranted = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
        if (fineGranted || coarseGranted) {
            fetchCurrentGpsLocation()
        } else {
            permissionLauncher.launch(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION))
        }
    }

    fun searchAddress(query: String) {
        if (query.isBlank()) return
        keyboardController?.hide()
        isSearching = true
        coroutineScope.launch(Dispatchers.IO) {
            try {
                val geocoder = Geocoder(context, Locale.getDefault())
                @Suppress("DEPRECATION")
                val results = geocoder.getFromLocationName(query, 1)
                withContext(Dispatchers.Main) {
                    isSearching = false
                    if (!results.isNullOrEmpty()) {
                        val addr = results[0]
                        val latLng = LatLng(addr.latitude, addr.longitude)
                        cameraPositionState.animate(CameraUpdateFactory.newLatLngZoom(latLng, 16f), 600)
                        val fullText = listOfNotNull(addr.featureName, addr.subLocality, addr.locality, addr.adminArea).distinct().joinToString(", ")
                        detectedAddress = fullText
                    } else {
                        Toast.makeText(context, "No location found for '$query'", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                withContext(Dispatchers.Main) {
                    isSearching = false
                    Toast.makeText(context, "Search failed: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    LaunchedEffect(cameraPositionState.isMoving) {
        if (!cameraPositionState.isMoving) {
            val center = cameraPositionState.position.target
            reverseGeocode(center.latitude, center.longitude)
        }
    }

    LaunchedEffect(Unit) {
        if (initialLatitude != null && initialLongitude != null && initialLatitude != 0.0 && initialLongitude != 0.0) {
            reverseGeocode(initialLatitude, initialLongitude)
        } else if (initialAddress.isNotBlank()) {
            searchAddress(initialAddress)
        } else {
            requestGps()
        }
    }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Drop Location Pin", fontSize = 18.sp, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = onDismiss) {
                            Icon(Icons.Default.Close, contentDescription = "Close")
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface
                    )
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Interactive Google Map
                GoogleMap(
                    modifier = Modifier.fillMaxSize(),
                    cameraPositionState = cameraPositionState,
                    uiSettings = MapUiSettings(
                        zoomControlsEnabled = false,
                        myLocationButtonEnabled = false
                    ),
                    properties = MapProperties(isMyLocationEnabled = false)
                )

                // Stationary Center Pin Indicator
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(bottom = 32.dp),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.LocationOn,
                        contentDescription = "Pin Target",
                        tint = Color(0xFFE53935),
                        modifier = Modifier
                            .size(52.dp)
                            .shadow(8.dp, CircleShape)
                    )
                }

                // Top Search Bar
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .align(Alignment.TopCenter)
                        .padding(16.dp)
                ) {
                    Card(
                        shape = RoundedCornerShape(16.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        elevation = CardDefaults.cardElevation(defaultElevation = 6.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 12.dp, vertical = 4.dp)
                        ) {
                            Icon(Icons.Default.Search, contentDescription = "Search", tint = Color.Gray)
                            Spacer(modifier = Modifier.width(8.dp))
                            TextField(
                                value = searchText,
                                onValueChange = { searchText = it },
                                placeholder = { Text("Search address, area or landmark", fontSize = 14.sp) },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                colors = TextFieldDefaults.colors(
                                    focusedContainerColor = Color.Transparent,
                                    unfocusedContainerColor = Color.Transparent,
                                    disabledContainerColor = Color.Transparent,
                                    focusedIndicatorColor = Color.Transparent,
                                    unfocusedIndicatorColor = Color.Transparent
                                ),
                                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                                keyboardActions = KeyboardActions(onSearch = { searchAddress(searchText) })
                            )
                            if (isSearching) {
                                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp)
                            } else if (searchText.isNotBlank()) {
                                IconButton(onClick = { searchAddress(searchText) }) {
                                    Icon(Icons.Default.ArrowForward, contentDescription = "Search Go", tint = MaterialTheme.colorScheme.primary)
                                }
                            }
                        }
                    }
                }

                // Floating GPS "Use My Location" Button
                FloatingActionButton(
                    onClick = { requestGps() },
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = MaterialTheme.colorScheme.primary,
                    modifier = Modifier
                        .align(Alignment.BottomEnd)
                        .padding(bottom = 240.dp, end = 16.dp)
                        .shadow(6.dp, CircleShape)
                ) {
                    if (isLocating) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), strokeWidth = 2.dp)
                    } else {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 12.dp)
                        ) {
                            Icon(Icons.Default.MyLocation, contentDescription = "GPS")
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Use GPS", fontWeight = FontWeight.Bold, fontSize = 13.sp)
                        }
                    }
                }

                // Bottom Confirmation Card
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
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Text(
                            text = "Adjust Map to Align Location Pin",
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        Text(
                            text = "Drag the map manually to align the pin or tap 'Use GPS'.",
                            fontSize = 12.sp,
                            color = Color.Gray,
                            textAlign = TextAlign.Center
                        )

                        AnimatedVisibility(visible = detectedAddress.isNotBlank()) {
                            Column {
                                Spacer(modifier = Modifier.height(10.dp))
                                Row(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .background(MaterialTheme.colorScheme.primary.copy(alpha = 0.08f), RoundedCornerShape(8.dp))
                                        .padding(10.dp),
                                    verticalAlignment = Alignment.CenterVertically
                                ) {
                                    Icon(Icons.Default.LocationOn, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                                    Spacer(modifier = Modifier.width(8.dp))
                                    Text(
                                        text = detectedAddress,
                                        fontSize = 13.sp,
                                        fontWeight = FontWeight.Medium,
                                        maxLines = 2,
                                        overflow = TextOverflow.Ellipsis
                                    )
                                }
                            }
                        }

                        Spacer(modifier = Modifier.height(12.dp))
                        HorizontalDivider(color = Color.LightGray.copy(alpha = 0.5f))
                        Spacer(modifier = Modifier.height(10.dp))

                        val center = cameraPositionState.position.target
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text(
                                text = "Lat: %.5f".format(Locale.US, center.latitude),
                                fontSize = 12.sp,
                                color = Color.Gray,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                            Text(
                                text = "Lng: %.5f".format(Locale.US, center.longitude),
                                fontSize = 12.sp,
                                color = Color.Gray,
                                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
                            )
                        }

                        Spacer(modifier = Modifier.height(16.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            OutlinedButton(
                                onClick = { requestGps() },
                                modifier = Modifier
                                    .weight(1f)
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp)
                            ) {
                                Icon(Icons.Default.GpsFixed, contentDescription = null, modifier = Modifier.size(16.dp))
                                Spacer(modifier = Modifier.width(6.dp))
                                Text("GPS Locate", fontSize = 13.sp)
                            }

                            Button(
                                onClick = {
                                    val target = cameraPositionState.position.target
                                    onLocationSelected(target.latitude, target.longitude, detectedAddress)
                                    onDismiss()
                                },
                                modifier = Modifier
                                    .weight(1.2f)
                                    .height(48.dp),
                                shape = RoundedCornerShape(12.dp),
                                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                            ) {
                                Text("Set Pin Location", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                            }
                        }
                    }
                }
            }
        }
    }
}
