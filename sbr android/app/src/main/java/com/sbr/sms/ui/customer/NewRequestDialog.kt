package com.sbr.sms.ui.customer

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.foundation.BorderStroke
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.sbr.sms.data.models.Customer
import com.sbr.sms.data.models.UserAddress
import com.sbr.sms.ui.common.components.MapPinPickerDialog
import com.sbr.sms.ui.theme.SBRBlue
import java.util.Locale

data class SelectableAddress(
    val id: String,
    val label: String,
    val addressLine: String,
    val latitude: Double?,
    val longitude: Double?
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NewRequestDialog(
    customerProfile: Customer? = null,
    isSubmitting: Boolean = false,
    onDismiss: () -> Unit,
    onSubmit: (serviceType: String, description: String, address: String, latitude: Double?, longitude: Double?) -> Unit
) {
    val serviceCategories = listOf(
        "Solar Water Heaters",
        "HM Hard Water Scalenors",
        "Automatic Water Softeners",
        "RO Water Plant Maintenance",
        "Domestic RO Purifier Service",
        "Solar Power Systems Maintenance",
        "Heat Pumps Repairs",
        "Other Service / Custom Repair"
    )

    var selectedServiceCategory by remember { mutableStateOf(serviceCategories[0]) }
    var customServiceText by remember { mutableStateOf(serviceCategories[0]) }
    var isCategoryDropdownExpanded by remember { mutableStateOf(false) }

    var description by remember { mutableStateOf("") }

    // Build selectable addresses from customer profile
    val selectableAddresses = remember(customerProfile) {
        val list = mutableListOf<SelectableAddress>()
        if (customerProfile != null) {
            if (!customerProfile.address.isNullOrBlank()) {
                list.add(
                    SelectableAddress(
                        id = "primary",
                        label = "Primary Address",
                        addressLine = customerProfile.address,
                        latitude = customerProfile.latitude,
                        longitude = customerProfile.longitude
                    )
                )
            }
            customerProfile.addresses.forEach { addr ->
                list.add(
                    SelectableAddress(
                        id = addr.id,
                        label = addr.title,
                        addressLine = addr.addressLine,
                        latitude = addr.latitude,
                        longitude = addr.longitude
                    )
                )
            }
        }
        list
    }

    var selectedAddressId by remember(selectableAddresses) {
        mutableStateOf(if (selectableAddresses.isNotEmpty()) selectableAddresses.first().id else "custom")
    }

    var customAddressLine by remember { mutableStateOf("") }
    var customLatitude by remember { mutableStateOf<Double?>(null) }
    var customLongitude by remember { mutableStateOf<Double?>(null) }

    var isAddressDropdownExpanded by remember { mutableStateOf(false) }
    var showPinPickerDialog by remember { mutableStateOf(false) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.92f)
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
                // Header Row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "New Service Request",
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
                    verticalArrangement = Arrangement.spacedBy(18.dp)
                ) {
                    // Service Category / Required
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Service Required",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        ExposedDropdownMenuBox(
                            expanded = isCategoryDropdownExpanded,
                            onExpandedChange = { isCategoryDropdownExpanded = !isCategoryDropdownExpanded }
                        ) {
                            OutlinedTextField(
                                value = customServiceText,
                                onValueChange = { customServiceText = it },
                                placeholder = { Text("e.g. Solar Heater Leak Repair") },
                                trailingIcon = {
                                    ExposedDropdownMenuDefaults.TrailingIcon(expanded = isCategoryDropdownExpanded)
                                },
                                modifier = Modifier
                                    .menuAnchor()
                                    .fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                singleLine = true
                            )

                            ExposedDropdownMenu(
                                expanded = isCategoryDropdownExpanded,
                                onDismissRequest = { isCategoryDropdownExpanded = false }
                            ) {
                                serviceCategories.forEach { category ->
                                    DropdownMenuItem(
                                        text = { Text(category, fontWeight = if (category == selectedServiceCategory) FontWeight.Bold else FontWeight.Normal) },
                                        onClick = {
                                            selectedServiceCategory = category
                                            customServiceText = category
                                            isCategoryDropdownExpanded = false
                                        },
                                        leadingIcon = {
                                            when {
                                                category.contains("Solar") -> Icon(Icons.Default.WbSunny, contentDescription = null, tint = Color(0xFFF57C00), modifier = Modifier.size(20.dp))
                                                category.contains("Water") || category.contains("RO") -> Icon(Icons.Default.WaterDrop, contentDescription = null, tint = Color(0xFF1976D2), modifier = Modifier.size(20.dp))
                                                category.contains("Pump") -> Icon(Icons.Default.Speed, contentDescription = null, tint = Color(0xFF388E3C), modifier = Modifier.size(20.dp))
                                                else -> Icon(Icons.Default.Build, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(20.dp))
                                            }
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Symptoms & Details
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "Symptoms & Details",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        OutlinedTextField(
                            value = description,
                            onValueChange = { description = it },
                            placeholder = { Text("Describe what needs maintenance or repair...") },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(110.dp),
                            maxLines = 4,
                            shape = RoundedCornerShape(12.dp)
                        )
                    }

                    // Service Address Selection
                    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text(
                            text = "Service Address",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        if (selectableAddresses.isNotEmpty()) {
                            // Dropdown for selecting saved addresses vs custom
                            ExposedDropdownMenuBox(
                                expanded = isAddressDropdownExpanded,
                                onExpandedChange = { isAddressDropdownExpanded = !isAddressDropdownExpanded }
                            ) {
                                val currentSelectionLabel = when {
                                    selectedAddressId == "custom" -> "Use Custom / New Address..."
                                    else -> {
                                        val matched = selectableAddresses.firstOrNull { it.id == selectedAddressId }
                                        if (matched != null) "${matched.label} (${matched.addressLine.take(24)}...)" else "Select Location"
                                    }
                                }

                                OutlinedTextField(
                                    value = currentSelectionLabel,
                                    onValueChange = {},
                                    readOnly = true,
                                    trailingIcon = {
                                        ExposedDropdownMenuDefaults.TrailingIcon(expanded = isAddressDropdownExpanded)
                                    },
                                    leadingIcon = {
                                        Icon(
                                            imageVector = Icons.Default.Place,
                                            contentDescription = null,
                                            tint = MaterialTheme.colorScheme.primary
                                        )
                                    },
                                    modifier = Modifier
                                        .menuAnchor()
                                        .fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp)
                                )

                                ExposedDropdownMenu(
                                    expanded = isAddressDropdownExpanded,
                                    onDismissRequest = { isAddressDropdownExpanded = false }
                                ) {
                                    selectableAddresses.forEach { option ->
                                        DropdownMenuItem(
                                            text = {
                                                Column {
                                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                                        Text(option.label, fontWeight = FontWeight.Bold)
                                                        if (option.latitude != null && option.longitude != null) {
                                                            Spacer(modifier = Modifier.width(6.dp))
                                                            Text(
                                                                text = "Pin Saved",
                                                                style = MaterialTheme.typography.labelSmall,
                                                                color = Color(0xFF2E7D32),
                                                                modifier = Modifier
                                                                    .background(Color(0xFFE8F5E9), RoundedCornerShape(4.dp))
                                                                    .padding(horizontal = 6.dp, vertical = 2.dp)
                                                            )
                                                        }
                                                    }
                                                    Text(
                                                        text = option.addressLine,
                                                        style = MaterialTheme.typography.bodySmall,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                                        maxLines = 1,
                                                        overflow = TextOverflow.Ellipsis
                                                    )
                                                }
                                            },
                                            onClick = {
                                                selectedAddressId = option.id
                                                isAddressDropdownExpanded = false
                                            },
                                            leadingIcon = {
                                                val lower = option.label.lowercase()
                                                val icon = when {
                                                    lower.contains("home") -> Icons.Default.Home
                                                    lower.contains("work") || lower.contains("office") -> Icons.Default.Business
                                                    else -> Icons.Default.LocationOn
                                                }
                                                Icon(icon, contentDescription = null, tint = SBRBlue)
                                            }
                                        )
                                    }

                                    HorizontalDivider()

                                    DropdownMenuItem(
                                        text = { Text("Use Custom / New Address...", fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.primary) },
                                        onClick = {
                                            selectedAddressId = "custom"
                                            isAddressDropdownExpanded = false
                                        },
                                        leadingIcon = {
                                            Icon(Icons.Default.AddLocationAlt, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                                        }
                                    )
                                }
                            }

                            // If a saved address is selected, display preview card
                            if (selectedAddressId != "custom") {
                                val selectedOption = selectableAddresses.firstOrNull { it.id == selectedAddressId }
                                if (selectedOption != null) {
                                    Card(
                                        modifier = Modifier.fillMaxWidth(),
                                        shape = RoundedCornerShape(12.dp),
                                        colors = CardDefaults.cardColors(
                                            containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                        ),
                                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                                    ) {
                                        Column(
                                            modifier = Modifier
                                                .fillMaxWidth()
                                                .padding(14.dp),
                                            verticalArrangement = Arrangement.spacedBy(4.dp)
                                        ) {
                                            Row(
                                                modifier = Modifier.fillMaxWidth(),
                                                verticalAlignment = Alignment.CenterVertically,
                                                horizontalArrangement = Arrangement.SpaceBetween
                                            ) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = Icons.Default.Place,
                                                        contentDescription = null,
                                                        tint = MaterialTheme.colorScheme.primary,
                                                        modifier = Modifier.size(18.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(6.dp))
                                                    Text(
                                                        text = selectedOption.label,
                                                        style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                                        color = MaterialTheme.colorScheme.onSurface
                                                    )
                                                }

                                                if (selectedOption.latitude != null && selectedOption.longitude != null) {
                                                    Row(
                                                        verticalAlignment = Alignment.CenterVertically,
                                                        modifier = Modifier
                                                            .background(Color(0xFFE8F5E9), RoundedCornerShape(6.dp))
                                                            .padding(horizontal = 8.dp, vertical = 3.dp)
                                                    ) {
                                                        Icon(
                                                            imageVector = Icons.Default.CheckCircle,
                                                            contentDescription = null,
                                                            tint = Color(0xFF2E7D32),
                                                            modifier = Modifier.size(12.dp)
                                                        )
                                                        Spacer(modifier = Modifier.width(4.dp))
                                                        Text(
                                                            text = "Pin Saved",
                                                            style = MaterialTheme.typography.labelSmall.copy(fontWeight = FontWeight.Bold),
                                                            color = Color(0xFF2E7D32)
                                                        )
                                                    }
                                                }
                                            }

                                            Text(
                                                text = selectedOption.addressLine,
                                                style = MaterialTheme.typography.bodyMedium,
                                                color = MaterialTheme.colorScheme.onSurfaceVariant
                                            )
                                        }
                                    }
                                }
                            }
                        }

                        // Custom Address Fields (shown when "custom" selected or no saved addresses exist)
                        if (selectedAddressId == "custom" || selectableAddresses.isEmpty()) {
                            Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
                                if (selectableAddresses.isEmpty()) {
                                    Text(
                                        text = "No saved addresses found. Please enter service location details below:",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = Color(0xFFE65100),
                                        fontWeight = FontWeight.SemiBold
                                    )
                                }

                                OutlinedTextField(
                                    value = customAddressLine,
                                    onValueChange = { customAddressLine = it },
                                    label = { Text("Street Address, Landmark, City") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    maxLines = 3
                                )

                                // GPS Pin Picker Card
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(12.dp),
                                    colors = CardDefaults.cardColors(
                                        containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)
                                    ),
                                    border = BorderStroke(
                                        1.dp,
                                        if (customLatitude != null) Color(0xFF2E7D32).copy(alpha = 0.3f)
                                        else MaterialTheme.colorScheme.outline.copy(alpha = 0.15f)
                                    )
                                ) {
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(12.dp),
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            if (customLatitude != null && customLongitude != null) {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = Icons.Default.CheckCircle,
                                                        contentDescription = null,
                                                        tint = Color(0xFF2E7D32),
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        text = "Location Pin Placed",
                                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                                        color = Color(0xFF2E7D32)
                                                    )
                                                }
                                                Text(
                                                    text = String.format(Locale.US, "%.5f, %.5f", customLatitude, customLongitude),
                                                    style = MaterialTheme.typography.bodySmall.copy(fontFamily = FontFamily.Monospace),
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            } else {
                                                Row(verticalAlignment = Alignment.CenterVertically) {
                                                    Icon(
                                                        imageVector = Icons.Outlined.LocationOn,
                                                        contentDescription = null,
                                                        tint = Color(0xFFE65100),
                                                        modifier = Modifier.size(16.dp)
                                                    )
                                                    Spacer(modifier = Modifier.width(4.dp))
                                                    Text(
                                                        text = "No Location Pin",
                                                        style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                                        color = Color(0xFFE65100)
                                                    )
                                                }
                                                Text(
                                                    text = "A precise pin helps representative locate you faster",
                                                    style = MaterialTheme.typography.bodySmall,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                                )
                                            }
                                        }

                                        FilledTonalButton(
                                            onClick = { showPinPickerDialog = true },
                                            shape = RoundedCornerShape(10.dp),
                                            contentPadding = PaddingValues(horizontal = 10.dp, vertical = 6.dp)
                                        ) {
                                            Icon(
                                                imageVector = Icons.Default.LocationOn,
                                                contentDescription = null,
                                                modifier = Modifier.size(14.dp)
                                            )
                                            Spacer(modifier = Modifier.width(4.dp))
                                            Text(
                                                text = if (customLatitude != null) "Edit Pin" else "Set Pin",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 12.sp
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                // Bottom Action Buttons
                val isSubmitEnabled = customServiceText.isNotBlank() && !isSubmitting &&
                        (if (selectedAddressId == "custom" || selectableAddresses.isEmpty()) customAddressLine.isNotBlank() else true)

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedButton(
                        onClick = onDismiss,
                        modifier = Modifier
                            .weight(1f)
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Cancel")
                    }

                    Button(
                        onClick = {
                            var finalAddress = ""
                            var finalLat: Double? = null
                            var finalLng: Double? = null

                            if (selectedAddressId == "custom" || selectableAddresses.isEmpty()) {
                                finalAddress = customAddressLine.trim()
                                finalLat = customLatitude
                                finalLng = customLongitude
                            } else {
                                val matched = selectableAddresses.firstOrNull { it.id == selectedAddressId }
                                if (matched != null) {
                                    finalAddress = matched.addressLine
                                    finalLat = matched.latitude
                                    finalLng = matched.longitude
                                }
                            }

                            onSubmit(
                                customServiceText.trim(),
                                description.trim(),
                                finalAddress,
                                finalLat,
                                finalLng
                            )
                        },
                        enabled = isSubmitEnabled,
                        modifier = Modifier
                            .weight(1.4f)
                            .height(50.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = SBRBlue)
                    ) {
                        if (isSubmitting) {
                            CircularProgressIndicator(
                                color = Color.White,
                                modifier = Modifier.size(22.dp),
                                strokeWidth = 2.5.dp
                            )
                        } else {
                            Text(
                                text = "Book Appointment",
                                style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold),
                                color = Color.White
                            )
                        }
                    }
                }
            }
        }
    }

    if (showPinPickerDialog) {
        MapPinPickerDialog(
            initialLatitude = customLatitude,
            initialLongitude = customLongitude,
            initialAddress = customAddressLine,
            onDismiss = { showPinPickerDialog = false },
            onLocationSelected = { lat, lng, resolvedAddress ->
                customLatitude = lat
                customLongitude = lng
                if (customAddressLine.isBlank() && resolvedAddress.isNotBlank()) {
                    customAddressLine = resolvedAddress
                }
                showPinPickerDialog = false
            }
        )
    }
}