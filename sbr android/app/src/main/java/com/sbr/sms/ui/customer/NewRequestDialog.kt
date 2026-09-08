package com.sbr.sms.ui.customer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.sbr.sms.ui.common.components.MapPinPickerDialog
import java.util.Locale

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewRequestDialog(
    onDismiss: () -> Unit,
    onSubmit: (serviceType: String, description: String, address: String, latitude: Double?, longitude: Double?) -> Unit
) {
    val serviceTypes = listOf(
        "RO Water Purifier Installation",
        "Filter Replacement / Maintenance",
        "Membrane Cleaning & TDS Adjustment",
        "Leakage / Pump Repair",
        "General Health Checkup & Sanitization",
        "Commercial RO Service"
    )

    var selectedServiceType by remember { mutableStateOf(serviceTypes[0]) }
    var description by remember { mutableStateOf("") }
    var address by remember { mutableStateOf("") }
    var latitude by remember { mutableStateOf<Double?>(null) }
    var longitude by remember { mutableStateOf<Double?>(null) }
    var showMapPicker by remember { mutableStateOf(false) }
    var expandedDropdown by remember { mutableStateOf(false) }

    if (showMapPicker) {
        MapPinPickerDialog(
            initialLatitude = latitude,
            initialLongitude = longitude,
            initialAddress = address,
            onDismiss = { showMapPicker = false },
            onLocationSelected = { lat, lng, resolvedAddr ->
                latitude = lat
                longitude = lng
                if (address.isBlank() && resolvedAddr.isNotBlank()) {
                    address = resolvedAddr
                }
                showMapPicker = false
            }
        )
    }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "New Service Request",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.Bold
                    )
                    IconButton(onClick = onDismiss, modifier = Modifier.size(24.dp)) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = Color.Gray)
                    }
                }

                HorizontalDivider(color = Color.LightGray.copy(alpha = 0.4f))

                // Service Type Dropdown
                Text(
                    text = "Service Type",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                ExposedDropdownMenuBox(
                    expanded = expandedDropdown,
                    onExpandedChange = { expandedDropdown = !expandedDropdown }
                ) {
                    OutlinedTextField(
                        value = selectedServiceType,
                        onValueChange = {},
                        readOnly = true,
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expandedDropdown) },
                        modifier = Modifier
                            .menuAnchor()
                            .fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp)
                    )
                    ExposedDropdownMenu(
                        expanded = expandedDropdown,
                        onDismissRequest = { expandedDropdown = false }
                    ) {
                        serviceTypes.forEach { type ->
                            DropdownMenuItem(
                                text = { Text(type, fontSize = 14.sp) },
                                onClick = {
                                    selectedServiceType = type
                                    expandedDropdown = false
                                }
                            )
                        }
                    }
                }

                // Problem Description
                Text(
                    text = "Problem Description",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    placeholder = { Text("E.g. Low water flow, TDS high, leakage from membrane...") },
                    minLines = 3,
                    maxLines = 4,
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                // Service Address
                Text(
                    text = "Service Address",
                    fontSize = 13.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                OutlinedTextField(
                    value = address,
                    onValueChange = { address = it },
                    placeholder = { Text("Door No, Apartment / Street, Landmark...") },
                    leadingIcon = { Icon(Icons.Default.Home, contentDescription = null, tint = MaterialTheme.colorScheme.primary) },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                // Interactive GPS Pin Picker Button
                OutlinedButton(
                    onClick = { showMapPicker = true },
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.outlinedButtonColors(
                        contentColor = MaterialTheme.colorScheme.primary
                    )
                ) {
                    Icon(
                        imageVector = if (latitude != null) Icons.Default.CheckCircle else Icons.Default.LocationOn,
                        contentDescription = "Pin Location",
                        tint = if (latitude != null) Color(0xFF2E7D32) else MaterialTheme.colorScheme.primary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = if (latitude != null) "Pin Attached (%.4f, %.4f)".format(Locale.US, latitude, longitude)
                        else "Pin Exact Location on Map (GPS)",
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 13.sp
                    )
                }

                Spacer(modifier = Modifier.height(6.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    TextButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .weight(1f)
                            .height(46.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            onSubmit(selectedServiceType, description, address, latitude, longitude)
                        },
                        enabled = description.isNotBlank() && address.isNotBlank(),
                        modifier = Modifier
                            .weight(1.3f)
                            .height(46.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
                    ) {
                        Text("Book Service", fontWeight = FontWeight.Bold)
                    }
                }
            }
        }
    }
}