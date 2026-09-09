package com.sbr.sms.ui.details

import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavHostController
import coil.compose.SubcomposeAsyncImage
import com.sbr.sms.data.models.Agent
import com.sbr.sms.data.models.ServiceRequest
import com.sbr.sms.navigation.AppRoutes
import com.sbr.sms.ui.common.components.JobTimer
import com.sbr.sms.ui.common.components.StatusChip
import com.sbr.sms.ui.theme.SBRBlue

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CustomerRequestDetailScreen(
    requestId: String,
    navController: NavHostController,
    viewModel: CustomerRequestDetailViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var imageUrlToShow by remember { mutableStateOf<String?>(null) }

    if (imageUrlToShow != null) {
        ImagePreviewDialog(
            imageUrl = imageUrlToShow!!,
            onDismiss = { imageUrlToShow = null }
        )
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Service Request Details", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (val state = uiState) {
                is CustomerRequestDetailUiState.Loading -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                is CustomerRequestDetailUiState.Error -> {
                    Text(text = state.message, modifier = Modifier.align(Alignment.Center).padding(16.dp))
                }
                is CustomerRequestDetailUiState.Success -> {
                    CustomerRequestDetailsContent(
                        request = state.request,
                        agent = state.agent,
                        onTrackAgent = {
                            navController.navigate(AppRoutes.CustomerLiveTracking.createRoute(state.request.id))
                        },
                        onViewBeforeImage = {
                            state.request.resolveUrl(state.request.beforeImageUrl)?.let { imageUrlToShow = it }
                        },
                        onViewAfterImage = {
                            state.request.resolveUrl(state.request.afterImageUrl)?.let { imageUrlToShow = it }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun CustomerRequestDetailsContent(
    request: ServiceRequest,
    agent: Agent?,
    onTrackAgent: () -> Unit,
    onViewBeforeImage: () -> Unit,
    onViewAfterImage: () -> Unit
) {
    val context = LocalContext.current
    val isLiveTrackable = (request.status == "Assigned" || request.status == "Accepted" || request.status == "In Progress") &&
            request.assignedAgentId != null

    fun openGoogleReview() {
        try {
            val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://g.page/r/CbdJS-IzWTe2EBE/review"))
            context.startActivity(intent)
        } catch (e: Exception) {
            Toast.makeText(context, "Unable to open browser", Toast.LENGTH_SHORT).show()
        }
    }

    fun callAgent(phone: String) {
        try {
            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:$phone"))
            context.startActivity(intent)
        } catch (e: Exception) {
            // ignore
        }
    }

    LazyColumn(
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Header Info
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                elevation = CardDefaults.cardElevation(2.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = request.serviceType,
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.weight(1f)
                        )
                        StatusChip(status = request.status)
                    }

                    if (request.description.isNotBlank()) {
                        Text(
                            text = request.description,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Live Tracking Button if active
        if (isLiveTrackable) {
            item {
                Button(
                    onClick = onTrackAgent,
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF16A34A))
                ) {
                    Icon(Icons.Default.Navigation, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Track Technician Live on Map", fontWeight = FontWeight.Bold)
                }
            }
        }

        item {
            JobTimer(request = request)
        }

        // Details Card
        item {
            DetailsCard(
                request = request,
                agent = agent,
                onCallAgent = { agent?.phone?.let { callAgent(it) } }
            )
        }

        // Allocated Spares Card (if any)
        if (request.requiredComponents.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                    elevation = CardDefaults.cardElevation(2.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Build, contentDescription = null, tint = SBRBlue, modifier = Modifier.size(18.dp))
                            Spacer(Modifier.width(8.dp))
                            Text("Spare Parts Used", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        }
                        HorizontalDivider()
                        request.requiredComponents.forEach { comp ->
                            Row(
                                modifier = Modifier.fillMaxWidth().padding(vertical = 2.dp),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(comp.name, fontWeight = FontWeight.SemiBold, style = MaterialTheme.typography.bodyMedium)
                                    if (!comp.sku.isNullOrBlank()) {
                                        Text("SKU: ${comp.sku}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                                    }
                                }
                                Text(
                                    "${comp.quantity}x • ₹${"%,.0f".format((comp.unitPrice ?: 0.0) * comp.quantity)}",
                                    fontWeight = FontWeight.Bold,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }
                }
            }
        }

        // Payment Breakdown Card
        item {
            PaymentSummaryCard(request = request)
        }

        // Documentation Photos Card
        item {
            DocumentationPhotosCard(
                request = request,
                onViewBeforeImage = onViewBeforeImage,
                onViewAfterImage = onViewAfterImage
            )
        }

        // Leave Review Button (if review requested & completed/paid)
        if ((request.status == "Completed" || request.status == "Paid") && request.requestReview == true) {
            item {
                OutlinedButton(
                    onClick = { openGoogleReview() },
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    shape = RoundedCornerShape(12.dp),
                    border = BorderStroke(1.5.dp, SBRBlue),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = SBRBlue.copy(alpha = 0.06f),
                        contentColor = SBRBlue
                    )
                ) {
                    Icon(Icons.Default.Star, contentDescription = null, tint = Color(0xFFF59E0B), modifier = Modifier.size(20.dp))
                    Spacer(Modifier.width(8.dp))
                    Text("Leave Sri Balaji Renewables Review", fontWeight = FontWeight.Bold)
                }
            }
        }

        item {
            Spacer(Modifier.height(16.dp))
        }
    }
}

@Composable
private fun DetailsCard(
    request: ServiceRequest,
    agent: Agent?,
    onCallAgent: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Text("Service Information", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            HorizontalDivider()

            ListItem(
                headlineContent = { Text(request.customerAddress, fontWeight = FontWeight.Medium) },
                leadingContent = { Icon(Icons.Default.Place, contentDescription = null, tint = Color(0xFFE53935)) },
                supportingContent = { Text("Service Address") }
            )

            HorizontalDivider()

            ListItem(
                headlineContent = {
                    Column {
                        Text(agent?.name ?: request.assignedAgentName ?: "Technician Pending Assignment", fontWeight = FontWeight.SemiBold)
                        if (!agent?.specialization.isNullOrBlank()) {
                            Text(agent!!.specialization!!, style = MaterialTheme.typography.bodySmall, color = Color.Gray)
                        }
                    }
                },
                leadingContent = { Icon(Icons.Default.Engineering, contentDescription = null, tint = SBRBlue) },
                supportingContent = { Text("Assigned Technician") },
                trailingContent = {
                    if (!agent?.phone.isNullOrBlank()) {
                        IconButton(onClick = onCallAgent) {
                            Icon(Icons.Default.Phone, contentDescription = "Call", tint = Color(0xFF16A34A))
                        }
                    }
                }
            )
        }
    }
}

@Composable
private fun PaymentSummaryCard(request: ServiceRequest) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text("Payment Breakdown", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                StatusChip(status = request.paymentStatus)
            }

            HorizontalDivider()

            if (request.inventoryTotal != null && request.inventoryTotal > 0) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Spare Parts Subtotal", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("₹${"%,.0f".format(request.inventoryTotal)}", fontWeight = FontWeight.SemiBold)
                }
            }

            if (request.serviceCharge != null && request.serviceCharge > 0) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Service Charges", color = MaterialTheme.colorScheme.onSurfaceVariant)
                    Text("₹${"%,.0f".format(request.serviceCharge)}", fontWeight = FontWeight.SemiBold)
                }
            }

            if (request.discount != null && request.discount > 0) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                    Text("Store Discount", color = Color(0xFF16A34A))
                    Text("-₹${"%,.0f".format(request.discount)}", fontWeight = FontWeight.Bold, color = Color(0xFF16A34A))
                }
            }

            val finalAmount = request.finalAmount ?: request.paymentAmount ?: 0.0
            if (finalAmount > 0) {
                HorizontalDivider()
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text("Total Amount", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                    Text("₹${"%,.0f".format(finalAmount)}", fontWeight = FontWeight.Black, style = MaterialTheme.typography.titleLarge, color = SBRBlue)
                }
            }

            if (!request.paymentMethod.isNullOrBlank()) {
                Text("Paid via ${request.paymentMethod}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
            }
        }
    }
}

@Composable
private fun DocumentationPhotosCard(
    request: ServiceRequest,
    onViewBeforeImage: () -> Unit,
    onViewAfterImage: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(2.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            Text(
                text = "Service Documentation Photos",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(14.dp)
            ) {
                PhotoBox(
                    label = "Before Photo",
                    imageUrl = request.resolveUrl(request.beforeImageUrl),
                    onClick = onViewBeforeImage,
                    modifier = Modifier.weight(1f)
                )
                PhotoBox(
                    label = "After Photo",
                    imageUrl = request.resolveUrl(request.afterImageUrl),
                    onClick = onViewAfterImage,
                    modifier = Modifier.weight(1f)
                )
            }
        }
    }
}

@Composable
private fun PhotoBox(
    label: String,
    imageUrl: String?,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier, horizontalAlignment = Alignment.CenterHorizontally) {
        Text(text = label, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Spacer(modifier = Modifier.height(6.dp))
        Card(
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier
                .fillMaxWidth()
                .height(130.dp)
                .clickable(enabled = imageUrl != null, onClick = onClick),
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.5f)),
            border = BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant.copy(alpha = 0.5f))
        ) {
            if (imageUrl != null) {
                SubcomposeAsyncImage(
                    model = imageUrl,
                    contentDescription = label,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Crop,
                    loading = {
                        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                            CircularProgressIndicator(strokeWidth = 2.dp, modifier = Modifier.size(24.dp))
                        }
                    }
                )
            } else {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Icon(
                            imageVector = Icons.Default.PhotoCamera,
                            contentDescription = "No Image",
                            tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.4f),
                            modifier = Modifier.size(28.dp)
                        )
                        Spacer(Modifier.height(4.dp))
                        Text("Not uploaded", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                    }
                }
            }
        }
    }
}

@Composable
private fun ImagePreviewDialog(
    imageUrl: String,
    onDismiss: () -> Unit
) {
    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(16.dp),
            elevation = CardDefaults.cardElevation(8.dp)
        ) {
            SubcomposeAsyncImage(
                model = imageUrl,
                contentDescription = "Service Image",
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f),
                contentScale = ContentScale.Fit,
                loading = {
                    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        CircularProgressIndicator()
                    }
                }
            )
        }
    }
}