package com.sbr.sms.ui.agent

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
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
fun AgentPaymentBreakdownDialog(
    job: ServiceRequest,
    apiService: ApiService,
    onDismiss: () -> Unit,
    onCompletedSuccess: () -> Unit
) {
    val scope = rememberCoroutineScope()

    var components by remember { mutableStateOf(job.requiredComponents) }
    var serviceChargeText by remember { mutableStateOf(job.serviceCharge?.toInt()?.toString() ?: "350") }
    var discountText by remember { mutableStateOf(job.discount?.toInt()?.toString() ?: "0") }
    var discountRemarks by remember { mutableStateOf(job.discountRemarks ?: "") }
    var paymentMethod by remember { mutableStateOf(job.paymentMethod ?: "Cash") }

    var vanItems by remember { mutableStateOf<List<AgentInventoryItem>>(emptyList()) }
    var isLoadingVanStock by remember { mutableStateOf(false) }
    var showAddExtraPartDialog by remember { mutableStateOf(false) }

    var isSubmitting by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Fetch van inventory for extra parts
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

    val partsSubtotal = components.sumOf { it.quantity * (it.unitPrice ?: 0.0) }
    val serviceChargeValue = serviceChargeText.toDoubleOrNull() ?: 0.0
    val discountValue = discountText.toDoubleOrNull() ?: 0.0
    val netTotal = maxOf(0.0, partsSubtotal + serviceChargeValue - discountValue)

    val paymentMethods = listOf("Cash", "UPI", "Card")

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth(0.95f)
                .fillMaxHeight(0.94f)
                .padding(vertical = 12.dp),
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 8.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(18.dp)
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Payment & Job Completion",
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

                HorizontalDivider(modifier = Modifier.padding(vertical = 10.dp))

                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState()),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Job Summary Card
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.35f))
                    ) {
                        Column(modifier = Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(3.dp)) {
                            Text(job.serviceType, style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                            Text("Customer: ${job.customerName ?: "Client"}", style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                            Text(job.customerAddress, style = MaterialTheme.typography.bodySmall, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        }
                    }

                    // 1. Spare Parts Section
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("1. Spare Parts Used", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))
                                TextButton(
                                    onClick = { showAddExtraPartDialog = true },
                                    contentPadding = PaddingValues(horizontal = 8.dp, vertical = 2.dp)
                                ) {
                                    Icon(Icons.Default.AddCircle, contentDescription = null, modifier = Modifier.size(16.dp))
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Add Extra Part", fontWeight = FontWeight.Bold, fontSize = 12.sp)
                                }
                            }

                            if (components.isEmpty()) {
                                Text(
                                    text = "No spare parts recorded. Tap '+ Add Extra Part' if any parts were replaced on site.",
                                    style = MaterialTheme.typography.bodySmall,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                            } else {
                                components.forEach { comp ->
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
                                                components = components.filterNot { it.productId == comp.productId && it.name == comp.name }
                                            },
                                            modifier = Modifier.size(32.dp)
                                        ) {
                                            Icon(Icons.Default.Delete, contentDescription = "Remove", tint = Color.Red, modifier = Modifier.size(18.dp))
                                        }
                                    }
                                }

                                HorizontalDivider()

                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Parts Subtotal:", fontWeight = FontWeight.SemiBold)
                                    Text("₹${partsSubtotal.toInt()}", fontWeight = FontWeight.Bold, color = SBRBlue)
                                }
                            }
                        }
                    }

                    // 2. Service Charge & Discount Section
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("2. Service Charge & Discount", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Service Charge (₹)", style = MaterialTheme.typography.bodyMedium)
                                OutlinedTextField(
                                    value = serviceChargeText,
                                    onValueChange = { serviceChargeText = it.filter { ch -> ch.isDigit() } },
                                    modifier = Modifier.width(110.dp),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    shape = RoundedCornerShape(8.dp)
                                )
                            }

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text("Store Discount (₹)", style = MaterialTheme.typography.bodyMedium)
                                OutlinedTextField(
                                    value = discountText,
                                    onValueChange = { discountText = it.filter { ch -> ch.isDigit() } },
                                    modifier = Modifier.width(110.dp),
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    singleLine = true,
                                    shape = RoundedCornerShape(8.dp)
                                )
                            }

                            if (discountValue > 0) {
                                Card(
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(8.dp),
                                    colors = CardDefaults.cardColors(containerColor = Color(0xFFFFF3E0))
                                ) {
                                    Column(modifier = Modifier.padding(10.dp), verticalArrangement = Arrangement.spacedBy(4.dp)) {
                                        Text("⚠️ Store In-Charge Verification:", fontWeight = FontWeight.Bold, fontSize = 11.sp, color = Color(0xFFE65100))
                                        Text("Any discount entered here must be confirmed with the Store In-Charge or Admin.", fontSize = 11.sp, color = Color(0xFFE65100))
                                    }
                                }

                                OutlinedTextField(
                                    value = discountRemarks,
                                    onValueChange = { discountRemarks = it },
                                    placeholder = { Text("Reason for discount...") },
                                    modifier = Modifier.fillMaxWidth(),
                                    shape = RoundedCornerShape(8.dp),
                                    singleLine = true
                                )
                            }
                        }
                    }

                    // 3. Payment Method & Net Total
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        shape = RoundedCornerShape(12.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                        border = BorderStroke(1.dp, MaterialTheme.colorScheme.outline.copy(alpha = 0.15f))
                    ) {
                        Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                            Text("3. Payment Method", style = MaterialTheme.typography.titleSmall.copy(fontWeight = FontWeight.Bold))

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                paymentMethods.forEach { method ->
                                    FilterChip(
                                        selected = paymentMethod == method,
                                        onClick = { paymentMethod = method },
                                        label = { Text(method, fontWeight = FontWeight.Bold) },
                                        modifier = Modifier.weight(1f)
                                    )
                                }
                            }

                            HorizontalDivider(modifier = Modifier.padding(vertical = 4.dp))

                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Parts Subtotal:", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("₹${partsSubtotal.toInt()}", style = MaterialTheme.typography.bodyMedium)
                            }
                            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                Text("Service Charge:", style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
                                Text("+ ₹${serviceChargeValue.toInt()}", style = MaterialTheme.typography.bodyMedium)
                            }
                            if (discountValue > 0) {
                                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                                    Text("Discount:", style = MaterialTheme.typography.bodyMedium, color = Color.Red)
                                    Text("- ₹${discountValue.toInt()}", style = MaterialTheme.typography.bodyMedium, color = Color.Red)
                                }
                            }

                            HorizontalDivider()

                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text("Net Total Payable:", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))
                                Text(
                                    text = "₹${netTotal.toInt()}",
                                    style = MaterialTheme.typography.titleLarge.copy(fontWeight = FontWeight.ExtraBold),
                                    color = SBRBlue
                                )
                            }
                        }
                    }

                    if (errorMessage != null) {
                        Text(
                            text = errorMessage!!,
                            color = MaterialTheme.colorScheme.error,
                            style = MaterialTheme.typography.bodySmall,
                            textAlign = TextAlign.Center,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }

                    // Completion Action 1: Collect & Request Review (Recommended)
                    Button(
                        onClick = {
                            completeJob(
                                isReviewRequested = true,
                                apiService = apiService,
                                jobId = job.id,
                                components = components,
                                partsSubtotal = partsSubtotal,
                                serviceCharge = serviceChargeValue,
                                discount = discountValue,
                                discountRemarks = discountRemarks,
                                finalAmount = netTotal,
                                paymentMethod = paymentMethod,
                                onLoading = { isSubmitting = it },
                                onError = { errorMessage = it },
                                onSuccess = {
                                    onCompletedSuccess()
                                    onDismiss()
                                }
                            )
                        },
                        modifier = Modifier.fillMaxWidth().height(52.dp),
                        shape = RoundedCornerShape(12.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF1565C0)),
                        enabled = !isSubmitting
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFFFD700), modifier = Modifier.size(20.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = "Collect ₹${netTotal.toInt()} & Request Review",
                                fontWeight = FontWeight.Bold,
                                color = Color.White
                            )
                        }
                    }

                    // Completion Action 2: Direct Close (No Review)
                    OutlinedButton(
                        onClick = {
                            completeJob(
                                isReviewRequested = false,
                                apiService = apiService,
                                jobId = job.id,
                                components = components,
                                partsSubtotal = partsSubtotal,
                                serviceCharge = serviceChargeValue,
                                discount = discountValue,
                                discountRemarks = discountRemarks,
                                finalAmount = netTotal,
                                paymentMethod = paymentMethod,
                                onLoading = { isSubmitting = it },
                                onError = { errorMessage = it },
                                onSuccess = {
                                    onCompletedSuccess()
                                    onDismiss()
                                }
                            )
                        },
                        modifier = Modifier.fillMaxWidth().height(48.dp),
                        shape = RoundedCornerShape(12.dp),
                        enabled = !isSubmitting
                    ) {
                        Text(
                            text = "Collect ₹${netTotal.toInt()} & Close (No Review)",
                            fontWeight = FontWeight.SemiBold
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))
                }
            }
        }
    }

    // Modal to add extra part from van inventory
    if (showAddExtraPartDialog) {
        AddExtraPartDialog(
            vanItems = vanItems,
            isLoading = isLoadingVanStock,
            onDismiss = { showAddExtraPartDialog = false },
            onAdd = { extraPart ->
                val existingIdx = components.indexOfFirst { it.productId == extraPart.productId || it.name == extraPart.name }
                if (existingIdx >= 0) {
                    val existing = components[existingIdx]
                    components = components.toMutableList().also {
                        it[existingIdx] = existing.copy(quantity = existing.quantity + extraPart.quantity, unitPrice = extraPart.unitPrice)
                    }
                } else {
                    components = components + extraPart
                }
                showAddExtraPartDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun AddExtraPartDialog(
    vanItems: List<AgentInventoryItem>,
    isLoading: Boolean,
    onDismiss: () -> Unit,
    onAdd: (RequiredComponent) -> Unit
) {
    var selectedItemId by remember { mutableStateOf("") }
    var quantity by remember { mutableStateOf(1) }
    var unitPriceText by remember { mutableStateOf("") }
    var isExpanded by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            modifier = Modifier.fillMaxWidth().padding(16.dp),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
        ) {
            Column(modifier = Modifier.padding(18.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                Text("Select Extra Spare Part", style = MaterialTheme.typography.titleMedium.copy(fontWeight = FontWeight.Bold))

                if (isLoading) {
                    CircularProgressIndicator(modifier = Modifier.size(24.dp))
                } else if (vanItems.isEmpty()) {
                    Text("No stock items found in your van.", color = MaterialTheme.colorScheme.error)
                } else {
                    ExposedDropdownMenuBox(
                        expanded = isExpanded,
                        onExpandedChange = { isExpanded = !isExpanded }
                    ) {
                        val selected = vanItems.firstOrNull { it.id == selectedItemId }
                        OutlinedTextField(
                            value = selected?.displayName ?: "Choose Part",
                            onValueChange = {},
                            readOnly = true,
                            trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = isExpanded) },
                            modifier = Modifier.menuAnchor().fillMaxWidth(),
                            shape = RoundedCornerShape(10.dp)
                        )
                        ExposedDropdownMenu(
                            expanded = isExpanded,
                            onDismissRequest = { isExpanded = false }
                        ) {
                            vanItems.forEach { item ->
                                DropdownMenuItem(
                                    text = { Text("${item.displayName} (Stock: ${item.quantity})") },
                                    onClick = {
                                        selectedItemId = item.id
                                        unitPriceText = item.unitPrice?.toInt()?.toString() ?: ""
                                        isExpanded = false
                                    }
                                )
                            }
                        }
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Quantity: $quantity", fontWeight = FontWeight.SemiBold)
                        Row {
                            IconButton(onClick = { if (quantity > 1) quantity-- }) {
                                Icon(Icons.Default.RemoveCircleOutline, contentDescription = null)
                            }
                            IconButton(onClick = { quantity++ }) {
                                Icon(Icons.Default.AddCircleOutline, contentDescription = null)
                            }
                        }
                    }

                    OutlinedTextField(
                        value = unitPriceText,
                        onValueChange = { unitPriceText = it.filter { ch -> ch.isDigit() } },
                        label = { Text("Unit Price (₹)") },
                        modifier = Modifier.fillMaxWidth(),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        shape = RoundedCornerShape(10.dp)
                    )
                }

                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                    OutlinedButton(onClick = onDismiss, modifier = Modifier.weight(1f)) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            val item = vanItems.firstOrNull { it.id == selectedItemId } ?: return@Button
                            val price = unitPriceText.toDoubleOrNull() ?: (item.unitPrice ?: 0.0)
                            val prodIdStr = item.resolvedProductId
                            onAdd(
                                RequiredComponent(
                                    posProductId = item.posProductId,
                                    productId = prodIdStr,
                                    name = item.displayName,
                                    sku = item.sku,
                                    quantity = quantity,
                                    unitPrice = price
                                )
                            )
                        },
                        enabled = selectedItemId.isNotBlank(),
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Add")
                    }
                }
            }
        }
    }
}

private fun completeJob(
    isReviewRequested: Boolean,
    apiService: ApiService,
    jobId: String,
    components: List<RequiredComponent>,
    partsSubtotal: Double,
    serviceCharge: Double,
    discount: Double,
    discountRemarks: String,
    finalAmount: Double,
    paymentMethod: String,
    onLoading: (Boolean) -> Unit,
    onError: (String) -> Unit,
    onSuccess: () -> Unit
) {
    onLoading(true)
    kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.IO).launch {
        try {
            val compsToSend = components.map {
                mapOf(
                    "posProductId" to it.posProductId,
                    "productId" to it.productId,
                    "name" to it.name,
                    "sku" to it.sku,
                    "quantity" to it.quantity,
                    "unitPrice" to it.unitPrice
                )
            }

            val payload = mutableMapOf<String, Any?>(
                "status" to "Completed",
                "paymentAmount" to finalAmount,
                "paymentStatus" to "Paid",
                "paymentMethod" to paymentMethod,
                "inventoryTotal" to partsSubtotal,
                "serviceCharge" to serviceCharge,
                "discount" to discount,
                "discountRemarks" to discountRemarks,
                "finalAmount" to finalAmount,
                "requestReview" to isReviewRequested,
                "requiredComponents" to compsToSend
            )

            val res = apiService.updateRequest(jobId, payload)
            if (res.isSuccessful) {
                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                    onLoading(false)
                    onSuccess()
                }
            } else {
                val err = res.errorBody()?.string() ?: "Failed to complete service"
                kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                    onLoading(false)
                    onError(err)
                }
            }
        } catch (e: Exception) {
            kotlinx.coroutines.withContext(kotlinx.coroutines.Dispatchers.Main) {
                onLoading(false)
                onError(e.localizedMessage ?: "Error completing service")
            }
        }
    }
}
