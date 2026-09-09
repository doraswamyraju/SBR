package com.sbr.sms.ui.agent

import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties
import com.sbr.sms.data.api.ApiService
import com.sbr.sms.data.models.AgentInventoryItem
import com.sbr.sms.data.models.RequiredComponent
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.ui.theme.SBRBlue
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AgentAssessmentDialog(
    request: ServiceRequest,
    apiService: ApiService,
    onDismiss: () -> Unit,
    onAcceptedSuccess: () -> Unit
) {
    val job = request
    val onAcceptSuccess = onAcceptedSuccess
    val context = LocalContext.current
    val scope = rememberCoroutineScope()

    var assessmentType by remember { mutableStateOf("service_only") } // "service_only" or "spare_parts"
    var vanItems by remember { mutableStateOf<List<AgentInventoryItem>>(emptyList()) }
    var selectedComponents by remember { mutableStateOf<List<RequiredComponent>>(emptyList()) }
    var isLoadingVanStock by remember { mutableStateOf(false) }

    var selectedPartId by remember { mutableStateOf("") }
    var partQuantity by remember { mutableStateOf(1) }
    var isPartDropdownExpanded by remember { mutableStateOf(false) }

    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Fetch van inventory
    LaunchedEffect(Unit) {
        isLoadingVanStock = true
        try {
            val res = apiService.getMyVanStock()
            if (res.isSuccessful && res.body()?.success == true) {
                vanItems = res.body()?.data ?: emptyList()
            }
        } catch (e: Exception) {
            // handle error
        } finally {
            isLoadingVanStock = false
        }
    }

    val estimatedPartsTotal = selectedComponents.sumOf {
        (it.quantity) * (it.unitPrice ?: 0.0)
    }

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
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Assess & Accept Job",
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
                    // 1. Call & Customer Details Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(14.dp),
                            verticalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            Text(
                                text = "1. Customer & Request Info",
                                style = MaterialTheme.typography.labelMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = job.serviceType,
                                style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold),
                                color = MaterialTheme.colorScheme.onSurface
                            )
                            Text(
                                text = "Address: ${job.customerAddress}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )

                            val customerPhone = job.customerPhone ?: job.customerId
                            if (!customerPhone.isNullOrBlank()) {
                                Spacer(modifier = Modifier.height(4.dp))
                                Button(
                                    onClick = {
                                        val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$customerPhone"))
                                        context.startActivity(intent)
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(containerColor = SBRBlue),
                                    shape = RoundedCornerShape(8.dp)
                                ) {
                                    Icon(Icons.Default.Call, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(6.dp))
                                    Text("Call Customer to Diagnose", fontWeight = FontWeight.Bold)
                                }
                            }
                        }
                    }

                    // 2. Assessment Mode Selector
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        Text(
                            text = "2. Job Requirement Assessment",
                            style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            FilterChip(
                                selected = assessmentType == "service_only",
                                onClick = { assessmentType = "service_only" },
                                label = { Text("Service Only", fontWeight = FontWeight.Bold) },
                                leadingIcon = {
                                    Icon(Icons.Default.Build, contentDescription = null, modifier = Modifier.size(16.dp))
                                },
                                modifier = Modifier.weight(1f)
                            )
                            FilterChip(
                                selected = assessmentType == "spare_parts",
                                onClick = { assessmentType = "spare_parts" },
                                label = { Text("Requires Spares", fontWeight = FontWeight.Bold) },
                                leadingIcon = {
                                    Icon(Icons.Default.Inventory2, contentDescription = null, modifier = Modifier.size(16.dp))
                                },
                                modifier = Modifier.weight(1f)
                            )
                        }
                    }

                    // 3. Van Stock Spares Allocation (if spare_parts selected)
                    if (assessmentType == "spare_parts") {
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            shape = RoundedCornerShape(12.dp),
                            colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF8E1)),
                            border = BorderStroke(1.dp, Color(0xFFFFB300).copy(alpha = 0.3f))
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(14.dp),
                                verticalArrangement = Arrangement.spacedBy(10.dp)
                            ) {
                                Text(
                                    text = "3. Allocate Spares from Van Stock",
                                    style = MaterialTheme.typography.labelLarge.copy(fontWeight = FontWeight.Bold),
                                    color = Color(0xFFE65100)
                                )

                                if (isLoadingVanStock) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        CircularProgressIndicator(modifier = Modifier.size(16.dp), strokeWidth = 2.dp)
                                        Spacer(modifier = Modifier.width(8.dp))
                                        Text("Loading van inventory...", style = MaterialTheme.typography.bodySmall)
                                    }
                                } else if (vanItems.isEmpty()) {
                                    Text(
                                        text = "No spare parts found in your van inventory.",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.error
                                    )
                                } else {
                                    // Part Dropdown
                                    ExposedDropdownMenuBox(
                                        expanded = isPartDropdownExpanded,
                                        onExpandedChange = { isPartDropdownExpanded = !isPartDropdownExpanded }
                                    ) {
                                        val selectedItem = vanItems.firstOrNull { it.id == selectedPartId }
                                        val labelText = if (selectedItem != null) {
                                            "${selectedItem.displayName} (Stock: ${selectedItem.quantity}) - ₹${selectedItem.unitPrice?.toInt() ?: 0}"
                                        } else {
                                            "Choose a Spare Part"
                                        }

                                        OutlinedTextField(
                                            value = labelText,
                                            onValueChange = {},
                                            readOnly = true,
                                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isPartDropdownExpanded) },
                                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                                            shape = RoundedCornerShape(10.dp)
                                        )

                                        ExposedDropdownMenu(
                                            expanded = isPartDropdownExpanded,
                                            onDismissRequest = { isPartDropdownExpanded = false }
                                        ) {
                                            vanItems.forEach { item ->
                                                DropdownMenuItem(
                                                    text = {
                                                        Column {
                                                            Text(item.displayName, fontWeight = FontWeight.Bold)
                                                            Text("Stock: ${item.quantity} | Unit Price: ₹${item.unitPrice?.toInt() ?: 0}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                                                        }
                                                    },
                                                    onClick = {
                                                        selectedPartId = item.id
                                                        isPartDropdownExpanded = false
                                                    }
                                                )
                                            }
                                        }
                                    }

                                    if (selectedPartId.isNotBlank()) {
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Row(verticalAlignment = Alignment.CenterVertically) {
                                                Text("Quantity: ", fontWeight = FontWeight.SemiBold)
                                                IconButton(
                                                    onClick = { if (partQuantity > 1) partQuantity-- },
                                                    modifier = Modifier.size(32.dp)
                                                ) {
                                                    Icon(Icons.Default.RemoveCircleOutline, contentDescription = "Decrease")
                                                }
                                                Text(
                                                    text = "$partQuantity",
                                                    fontWeight = FontWeight.Bold,
                                                    modifier = Modifier.padding(horizontal = 8.dp)
                                                )
                                                IconButton(
                                                    onClick = { partQuantity++ },
                                                    modifier = Modifier.size(32.dp)
                                                ) {
                                                    Icon(Icons.Default.AddCircleOutline, contentDescription = "Increase")
                                                }
                                            }

                                            Button(
                                                onClick = {
                                                    val item = vanItems.firstOrNull { it.id == selectedPartId } ?: return@Button
                                                    val prodIdStr = item.resolvedProductId
                                                    val existingIdx = selectedComponents.indexOfFirst { it.productId == prodIdStr || it.name == item.displayName }
                                                    if (existingIdx >= 0) {
                                                        val existing = selectedComponents[existingIdx]
                                                        selectedComponents = selectedComponents.toMutableList().also {
                                                            it[existingIdx] = existing.copy(quantity = existing.quantity + partQuantity)
                                                        }
                                                    } else {
                                                        selectedComponents = selectedComponents + RequiredComponent(
                                                            posProductId = item.posProductId,
                                                            productId = prodIdStr,
                                                            name = item.displayName,
                                                            sku = item.sku,
                                                            quantity = partQuantity,
                                                            unitPrice = item.unitPrice ?: 0.0
                                                        )
                                                    }
                                                    selectedPartId = ""
                                                    partQuantity = 1
                                                },
                                                shape = RoundedCornerShape(8.dp)
                                            ) {
                                                Text("Add to Job")
                                            }
                                        }
                                    }
                                }
                            }
                        }

                        // Summary of Selected Parts
                        if (selectedComponents.isNotEmpty()) {
                            Card(
                                modifier = Modifier.fillMaxWidth(),
                                shape = RoundedCornerShape(12.dp),
                                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                                border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.2f))
                            ) {
                                Column(
                                    modifier = Modifier.fillMaxWidth().padding(12.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text("Allocated Parts Summary", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))

                                    selectedComponents.forEach { comp ->
                                        Row(
                                            modifier = Modifier.fillMaxWidth(),
                                            verticalAlignment = Alignment.CenterVertically,
                                            horizontalArrangement = Arrangement.SpaceBetween
                                        ) {
                                            Column(modifier = Modifier.weight(1f)) {
                                                Text(comp.name, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                                Text("Qty: ${comp.quantity} × ₹${comp.unitPrice?.toInt() ?: 0}", style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                                            }
                                            Text(
                                                text = "₹${(comp.quantity * (comp.unitPrice ?: 0.0)).toInt()}",
                                                fontWeight = FontWeight.Bold,
                                                fontSize = 14.sp
                                            )
                                            IconButton(
                                                onClick = {
                                                    selectedComponents = selectedComponents.filterNot { it.productId == comp.productId && it.name == comp.name }
                                                },
                                                modifier = Modifier.size(32.dp)
                                            ) {
                                                Icon(Icons.Default.Delete, contentDescription = "Remove", tint = Color.Red, modifier = Modifier.size(18.dp))
                                            }
                                        }
                                    }

                                    HorizontalDivider()

                                    Row(
                                        modifier = Modifier.fillMaxWidth(),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Text("Estimated Parts Total:", fontWeight = FontWeight.Bold)
                                        Text("₹${estimatedPartsTotal.toInt()}", fontWeight = FontWeight.Bold, color = SBRBlue)
                                    }
                                }
                            }
                        }
                    }

                    if (errorMessage != null) {
                        Text(
                            text = errorMessage!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }

                HorizontalDivider(modifier = Modifier.padding(vertical = 12.dp))

                // Bottom Action Button
                val isSubmitDisabled = isSubmitting || (assessmentType == "spare_parts" && selectedComponents.isEmpty())

                Button(
                    onClick = {
                        isSubmitting = true
                        errorMessage = null
                        scope.launch {
                            try {
                                val compsToSend = if (assessmentType == "spare_parts") {
                                    selectedComponents.map {
                                        mapOf(
                                            "posProductId" to it.posProductId,
                                            "productId" to it.productId,
                                            "name" to it.name,
                                            "sku" to it.sku,
                                            "quantity" to it.quantity,
                                            "unitPrice" to it.unitPrice
                                        )
                                    }
                                } else {
                                    emptyList()
                                }

                                val payload = mutableMapOf<String, Any>(
                                    "status" to "Accepted"
                                )
                                if (compsToSend.isNotEmpty()) {
                                    payload["requiredComponents"] = compsToSend
                                }

                                val res = apiService.updateRequestStatus(job.id, payload)
                                if (res.isSuccessful) {
                                    onAcceptSuccess()
                                    onDismiss()
                                } else {
                                    errorMessage = res.errorBody()?.string() ?: "Failed to accept request"
                                }
                            } catch (e: Exception) {
                                errorMessage = e.localizedMessage ?: "Error updating request"
                            } finally {
                                isSubmitting = false
                            }
                        }
                    },
                    modifier = Modifier.fillMaxWidth().height(50.dp),
                    shape = RoundedCornerShape(12.dp),
                    enabled = !isSubmitDisabled,
                    colors = ButtonDefaults.buttonColors(containerColor = SBRBlue)
                ) {
                    if (isSubmitting) {
                        CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp), strokeWidth = 2.dp)
                    } else {
                        Text(
                            text = if (assessmentType == "service_only") "Confirm & Accept (Service Only)"
                            else if (selectedComponents.isEmpty()) "Allocate Spares to Accept"
                            else "Confirm & Allocate Spares (₹${estimatedPartsTotal.toInt()})",
                            fontWeight = FontWeight.Bold
                        )
                    }
                }
            }
        }
    }
}
