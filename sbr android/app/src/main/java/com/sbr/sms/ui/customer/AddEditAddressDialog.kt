package com.sbr.sms.ui.customer

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.LocationOn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.sbr.sms.data.models.UserAddress
import com.sbr.sms.ui.common.components.MapPinPickerDialog
import java.util.Locale
import java.util.UUID

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddEditAddressDialog(
    addressToEdit: UserAddress? = null,
    onDismiss: () -> Unit,
    onSave: (UserAddress) -> Unit
) {
    val predefinedTitles = listOf("Home", "Work", "Office", "Other")

    var selectedType by remember {
        mutableStateOf(
            if (addressToEdit != null && predefinedTitles.contains(addressToEdit.title)) {
                addressToEdit.title
            } else if (addressToEdit != null) {
                "Other"
            } else {
                "Home"
            }
        )
    }

    var customTitle by remember {
        mutableStateOf(
            if (addressToEdit != null && !predefinedTitles.contains(addressToEdit.title)) {
                addressToEdit.title
            } else {
                ""
            }
        )
    }

    var addressLine by remember { mutableStateOf(addressToEdit?.addressLine ?: "") }
    var latitude by remember { mutableStateOf(addressToEdit?.latitude) }
    var longitude by remember { mutableStateOf(addressToEdit?.longitude) }

    var showPinPickerDialog by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.90f)
                .padding(vertical = 16.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(20.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = if (addressToEdit == null) "Add New Address" else "Edit Address",
                        style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.Bold),
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    IconButton(onClick = onDismiss) {
                        Icon(
                            imageVector = Icons.Default.Close,
                            contentDescription = "Close",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Address Type Selection
                    Text(
                        text = "Address Type",
                        style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.SemiBold),
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        predefinedTitles.forEach { type ->
                            val isSelected = selectedType == type
                            FilterChip(
                                selected = isSelected,
                                onClick = { selectedType = type },
                                label = {
                                    Text(
                                        text = type,
                                        fontWeight = if (isSelected) FontWeight.Bold else FontWeight.Normal
                                    )
                                },
                                leadingIcon = {
                                    when (type) {
                                        "Home" -> Icon(Icons.Default.Home, contentDescription = null, modifier = Modifier.size(16.dp))
                                        "Work", "Office" -> Icon(Icons.Default.Business, contentDescription = null, modifier = Modifier.size(16.dp))
                                        else -> Icon(Icons.Default.Place, contentDescription = null, modifier = Modifier.size(16.dp))
                                    }
                                },
                                colors = FilterChipDefaults.filterChipColors(
                                    selectedContainerColor = MaterialTheme.colorScheme.primaryContainer,
                                    selectedLabelColor = MaterialTheme.colorScheme.onPrimaryContainer
                                )
                            )
                        }
                    }

                    if (selectedType == "Other") {
                        OutlinedTextField(
                            value = customTitle,
                            onValueChange = { customTitle = it },
                            label = { Text("Custom Label (e.g. Vacation Home, Warehouse)") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            shape = RoundedCornerShape(12.dp)
                        )
                    }

                    // Full Address Input
                    OutlinedTextField(
                        value = addressLine,
                        onValueChange = { addressLine = it },
                        label = { Text("Full Address Details") },
                        placeholder = { Text("Door/Flat No, Building, Street, Area, City, Pincode") },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(110.dp),
                        maxLines = 4,
                        shape = RoundedCornerShape(12.dp)
                    )

                    // Map Location Pin Section
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(14.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)
                        ),
                        border = androidx.compose.foundation.BorderStroke(
                            1.dp,
                            if (latitude != null && longitude != null) Color(0xFF2E7D32).copy(alpha = 0.4f)
                            else MaterialTheme.colorScheme.outline.copy(alpha = 0.2f)
                        )
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                if (latitude != null && longitude != null && latitude != 0.0 && longitude != 0.0) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Default.CheckCircle,
                                            contentDescription = null,
                                            tint = Color(0xFF2E7D32),
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "Location Pin Set",
                                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                            color = Color(0xFF2E7D32)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = String.format(Locale.US, "%.5f, %.5f", latitude, longitude),
                                        style = MaterialTheme.typography.bodySmall.copy(
                                            fontFamily = FontFamily.Monospace,
                                            fontSize = 12.sp
                                        ),
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                } else {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Icon(
                                            imageVector = Icons.Outlined.LocationOn,
                                            contentDescription = null,
                                            tint = Color(0xFFE65100),
                                            modifier = Modifier.size(18.dp)
                                        )
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = "No Location Pin",
                                            style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                            color = Color(0xFFE65100)
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Pinning location improves technician service accuracy",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                }
                            }

                            Spacer(modifier = Modifier.width(12.dp))

                            FilledTonalButton(
                                onClick = { showPinPickerDialog = true },
                                shape = RoundedCornerShape(10.dp),
                                contentPadding = PaddingValues(horizontal = 12.dp, vertical = 8.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.LocationOn,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text(
                                    text = if (latitude != null) "Edit Pin" else "Set Pin",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp
                                )
                            }
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                // Bottom Actions
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier.weight(1f).height(48.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            val finalTitle = if (selectedType == "Other") {
                                if (customTitle.isNotBlank()) customTitle.trim() else "Other"
                            } else {
                                selectedType
                            }
                            val updatedAddress = UserAddress(
                                id = addressToEdit?.id ?: UUID.randomUUID().toString(),
                                title = finalTitle,
                                addressLine = addressLine.trim(),
                                latitude = latitude,
                                longitude = longitude
                            )
                            onSave(updatedAddress)
                            onDismiss()
                        },
                        modifier = Modifier.weight(1f).height(48.dp),
                        enabled = addressLine.isNotBlank(),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text(
                            text = if (addressToEdit == null) "Add Address" else "Save Changes",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }

    if (showPinPickerDialog) {
        MapPinPickerDialog(
            initialLatitude = latitude,
            initialLongitude = longitude,
            initialAddress = addressLine,
            onDismiss = { showPinPickerDialog = false },
            onLocationSelected = { lat, lng, resolvedAddress ->
                latitude = lat
                longitude = lng
                if (addressLine.isBlank() && resolvedAddress.isNotBlank()) {
                    addressLine = resolvedAddress
                }
                showPinPickerDialog = false
            }
        )
    }
}
